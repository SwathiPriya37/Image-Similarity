from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import importlib

# Dynamically import Google's GenAI SDK (module name can be google.genai or google.generativeai)
try:
    genai = importlib.import_module("google.genai")
    types = importlib.import_module("google.genai.types")
except ModuleNotFoundError:
    genai = importlib.import_module("google.generativeai")
    try:
        types = importlib.import_module("google.generativeai.types")
    except ModuleNotFoundError:
        types = getattr(genai, "types", None)
        if types is None:
            # Re-raise with a clearer message if neither package is available
            raise ModuleNotFoundError(
                "Neither 'google.genai' nor 'google.generativeai' could be imported; please install the Google GenAI SDK."
            )

import io
from PIL import Image
import numpy as np
import os
from typing import Optional

# Try to import CLIP embedding helper and cosine similarity
try:
    from models.clip_model import get_image_embedding
except Exception:
    get_image_embedding = None

try:
    from utils.similarity import cosine_similarity
except Exception:
    cosine_similarity = None

app = FastAPI()

# Allow all origins (frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

def calculate_pixel_similarity(image1_array, image2_array):
    """Original pixel-difference based similarity (0-100)."""
    diff = np.mean(np.abs(image1_array - image2_array))
    similarity = max(0, 100 - diff / 2)
    return round(similarity, 2)

def calculate_embedding_similarity(img1_bytes: bytes, img2_bytes: bytes) -> Optional[float]:
    """Use CLIP embeddings + cosine similarity to compute a 0-100 similarity score.

    Returns None if CLIP or cosine similarity is unavailable.
    """
    if get_image_embedding is None or cosine_similarity is None:
        return None

    try:
        emb1 = get_image_embedding(img1_bytes)
        emb2 = get_image_embedding(img2_bytes)
        # embeddings may be shape (1, D) -> flatten to (D,)
        v1 = emb1.reshape(-1)
        v2 = emb2.reshape(-1)
        cos = cosine_similarity(v1, v2)
        # convert cosine (-1..1) to percentage 0..100
        pct = round(((cos + 1) / 2) * 100, 2)
        return pct
    except Exception:
        return None

@app.post("/compare/")
async def compare_images(image1: UploadFile = File(...), image2: UploadFile = File(...)):
    # Read uploaded images as bytes
    img1_bytes = await image1.read()
    img2_bytes = await image2.read()

    # First try embedding-based similarity (preferred)
    similarity_score = calculate_embedding_similarity(img1_bytes, img2_bytes)

    # If embeddings unavailable, fall back to pixel-based similarity
    if similarity_score is None:
        img1 = Image.open(io.BytesIO(img1_bytes)).convert("RGB").resize((224, 224))
        img2 = Image.open(io.BytesIO(img2_bytes)).convert("RGB").resize((224, 224))
        img1_np = np.array(img1)
        img2_np = np.array(img2)
        similarity_score = calculate_pixel_similarity(img1_np, img2_np)

    # Send both actual image files to Gemini (NOT NumPy bytes)
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=[
            types.Part.from_bytes(img1_bytes, mime_type="image/jpeg"),
            types.Part.from_bytes(img2_bytes, mime_type="image/jpeg"),
            types.Part.from_text("Compare these two images and describe their similarities and differences briefly."),
        ],
    )

    explanation = response.text.strip() if hasattr(response, "text") else "No explanation generated."

    return {
        "similarity": similarity_score,
        "explanation": explanation,
    }

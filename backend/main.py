from urllib import response
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.models import Model
from sklearn.metrics.pairwise import cosine_similarity
import cv2
import tempfile
import os
import base64
from dotenv import load_dotenv


import google.generativeai as genai
import tensorflow as tf


# Initialize FastAPI app
app = FastAPI(title="Image Similarity API (Score + Insights)")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("gemini_api_key")


genai.configure(api_key=GOOGLE_API_KEY)


# --- MODEL INITIALIZATION ---
# ResNet50 Base: This part is critical for startup stability.
if 'tf' in globals():
    base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    gap_layer = tf.keras.layers.GlobalAveragePooling2D()
    feature_vector_output = gap_layer(base_model.output)
    similarity_model = Model(inputs=base_model.input, outputs=feature_vector_output)
else:
    # Placeholder models if TensorFlow/Keras failed to import
    base_model = None
    similarity_model = None
    print("WARNING: TensorFlow/Keras not available. Similarity score will be skipped.")


# --- SIMILARITY CORE FUNCTIONS ---

def preprocess_for_similarity(img_path):
    """Loads and preprocesses an image for the ResNet50 model."""
    img = cv2.imread(img_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image from path: {img_path}")
        
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img_array = np.expand_dims(img, axis=0)
    return preprocess_input(img_array)

def extract_features(img_array):
    """Extracts features from a preprocessed image array."""
    if similarity_model is None:
        return np.zeros((1024,)) # Return zero vector if model failed to load
        
    with tf.device('/cpu:0'):
        # Suppress console output from model.predict
        features = similarity_model.predict(img_array, verbose=0)
    return features.flatten()

def get_similarity_score(img_path1, img_path2):
    """Calculates the cosine similarity between two images."""
    if similarity_model is None:
        return 0.0
        
    img1_processed = preprocess_for_similarity(img_path1)
    img2_processed = preprocess_for_similarity(img_path2)
    features1 = extract_features(img1_processed).reshape(1, -1)
    features2 = extract_features(img2_processed).reshape(1, -1)
    return cosine_similarity(features1, features2)[0][0]

# --- GEMINI INSIGHTS FUNCTION ---

def get_llm_explanation(img_path1, img_path2, score):
    """Generate insights using Gemini with multimodal input."""
    if genai is None:
        return "The AI explanation could not be generated because the Gemini API is not configured or failed to initialize."
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        img1 = Image.open(img_path1)
        img2 = Image.open(img_path2)

        prompt = f"""
        You are an expert image analyst. Two images have been compared using a deep learning model, yielding a feature similarity (cosine score) of {score:.4f} (range 0 to 1, where 1 is identical).
        
        Provide a concise analysis in two paragraphs:
        1. **Summary:** Explain the primary reason for this score (e.g., highly similar subject, consistent texture, or strong compositional alignment).
        2. **Differences:** Point out the main visual discrepancies that prevented a perfect score (e.g., slight change in perspective, lighting, cropping, or minor background elements).
        
        Keep the analysis brief, easy to read, and return ONLY the analysis text.
        """
        response = model.generate_content([prompt, img1, img2])
        return response.text
    except Exception as e:
        return f"The AI explanation could not be generated due to a server-side issue: {e}"

# --- ENDPOINT ---

@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Image Similarity API is running"}

@app.post("/compare/")
async def compare_images(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    """Compare two images and return similarity score with Gemini insights."""
    temp_paths = []
    
    try:
        # 1. Save temp files
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp1:
            temp1.write(await file1.read())
            temp_path1 = temp1.name
            temp_paths.append(temp_path1)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp2:
            temp2.write(await file2.read())
            temp_path2 = temp2.name
            temp_paths.append(temp_path2)
        
        # 2. Compute similarity score
        score = get_similarity_score(temp_path1, temp_path2)
        
        # 3. Get LLM explanation
        explanation = get_llm_explanation(temp_path1, temp_path2, score)
        
        # 4. Get base64 original images 
        def image_to_base64_url(path):
            with open(path, "rb") as f:
                b64_str = base64.b64encode(f.read()).decode("utf-8")
                return f"data:image/jpeg;base64,{b64_str}"
                
        b64_a = image_to_base64_url(temp_path1)
        b64_b = image_to_base64_url(temp_path2)

        # 5. Return combined results
        response = {
    "similarity_score": float(round(score * 100, 2)),  # Convert to percentage
    "insights": {
        "llm_explanation": explanation
    },
    "images": {
        "image_a_uri": b64_a,
        "image_b_uri": b64_b
    }
}       
        print(JSONResponse(response))
        return JSONResponse(response)


    except Exception as e:
        # Catch and report any internal processing error, including file reading issues
        raise HTTPException(status_code=500, detail=f"Internal Server Error during processing: {str(e)}")
    
    finally:
        # Clean up temp files
        for path in temp_paths:
            if os.path.exists(path):
                os.remove(path)
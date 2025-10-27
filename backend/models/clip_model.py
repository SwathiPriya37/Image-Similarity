import torch
import clip
from PIL import Image
import io

# Load CLIP model
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

def get_image_embedding(image_bytes):
    """Convert image bytes to normalized CLIP embedding"""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model.encode_image(image)
        embedding /= embedding.norm(dim=-1, keepdim=True)
    return embedding.cpu().numpy()

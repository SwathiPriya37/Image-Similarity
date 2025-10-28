# 🧠 Image Similarity Checker

This full-stack project compares two uploaded images using **ResNet50** embeddings and **cosine similarity**,  
then uses **Google Gemini AI** to generate a natural-language explanation of how similar the images are.

---

## 🚀 Features

- Upload two images via the React frontend  
- Extract visual embeddings using **ResNet50**  
- Compute **cosine similarity** between image features  
- Generate a **text explanation** via **Gemini API**  
- Display similarity percentage and human-readable description  

---


---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React (Vite or CRA) |
| Backend | FastAPI (Python) |
| Model | ResNet50 (from TensorFlow/Keras) |
| Similarity Metric | Cosine Similarity |
| LLM | Gemini (Google Generative AI) |

---

## 🔧 Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/SwathiPriya37/image-similarity-app.git
cd image-similarity-app
```
### 2️⃣ Frontend Setup (React)
```bash 
cd frontend
npm install
npm run dev
```
### 3️⃣ Backend Setup (FastAPI)
Create a virtual environment:
``` bash
cd backend
python -m venv venv
source venv/bin/activate
```  
Create a .env file with your Gemini API key:
```bash 
GEMINI_API_KEY=your_api_key_here
```
Server setup:
```bash
uvicorn main:app --reload
```
### Install dependencies:
``` bash
pip install -r requirements.txt
```
## Usage
- Open the web application at http://localhost:3000
- Upload two images you want to compare
- Click "Compare Images"
- View similarity score, and AI-generated insights

## Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.
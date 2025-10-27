import numpy as np
from PIL import Image
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.models import Model
from sklearn.metrics.pairwise import cosine_similarity
import cv2 


base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
model = Model(inputs=base_model.input, outputs=base_model.get_layer('avg_pool').output)

def preprocess_image(img_path):
    """
    Loads and preprocesses an image for the ResNet50 model.
    """
    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) 
    img = cv2.resize(img, (224, 224))
    
    img_array = np.expand_dims(img, axis=0)
    return preprocess_input(img_array)

def extract_features(img_array):
    """
    Extracts features from a preprocessed image array using the model.
    """
    features = model.predict(img_array)
    return features.flatten() # Flatten the features to a 1D vector

def get_similarity(img_path1, img_path2):
    """
    Calculates the cosine similarity between two images.
    """
    img1_processed = preprocess_image(img_path1)
    img2_processed = preprocess_image(img_path2)
    
    features1 = extract_features(img1_processed).reshape(1, -1)
    features2 = extract_features(img2_processed).reshape(1, -1)
    
    similarity_score = cosine_similarity(features1, features2)[0][0]
    
    return similarity_score
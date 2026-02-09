import joblib
import os
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- CONSTANTS ---
MODEL_PATH = 'crop_recommender_model.pkl'
SCALER_PATH = 'standard_scaler.pkl'
ENCODER_PATH = 'label_encoder.pkl'
REQUIRED_FEATURES = 7 # N, P, K, Temp, Hum, pH, Rainfall
TOP_N = 3 # We want the top 3 recommendations

# --- INITIALIZATION ---
app = Flask(__name__)
CORS(app) # Enable CORS for frontend communication

# Global variables to hold our loaded ML assets
model = None
scaler = None
label_encoder = None

def load_assets():
    """Loads the pre-trained ML model, scaler, and label encoder into memory."""
    global model, scaler, label_encoder
    try:
        print("Loading ML assets...")
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        label_encoder = joblib.load(ENCODER_PATH)
        print("ML assets loaded successfully.")
    except FileNotFoundError as e:
        # Crucial error handling: The API cannot run without these files.
        print(f"ERROR: Missing required model file: {e}")
        # In a production setup, you would terminate the process here.
        model, scaler, label_encoder = None, None, None
    except Exception as e:
        print(f"An unexpected error occurred during asset loading: {e}")
        model, scaler, label_encoder = None, None, None


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Accepts 7 numerical features and returns the top 3 crop recommendations
    with their prediction confidence scores.
    """
    # 1. Check if assets are loaded (safety check)
    if model is None or scaler is None or label_encoder is None:
        return jsonify({
            "error": "Model assets not loaded. Check server logs."
        }), 500

    # 2. Input Validation and Extraction
    try:
        data = request.get_json()
        if not data or 'features' not in data:
            return jsonify({"error": "Missing 'features' key in JSON payload."}), 400

        features = data['features']

        # Ensure we have exactly 7 inputs
        if len(features) != REQUIRED_FEATURES:
            return jsonify({
                "error": f"Expected {REQUIRED_FEATURES} features, received {len(features)}."
            }), 400

        # Convert the list to a numpy array, reshaped for single sample prediction
        input_array = np.array(features).reshape(1, -1)

    except Exception as e:
        return jsonify({"error": f"Invalid input data format: {e}"}), 400

    # 3. Preprocessing (Scaling)
    try:
        scaled_features = scaler.transform(input_array)
    except Exception as e:
        return jsonify({"error": f"Error during scaling: {e}"}), 500

    # 4. Prediction: Get Probabilities
    # predict_proba returns an array of shape (1, n_classes)
    probabilities = model.predict_proba(scaled_features)[0]

    # 5. Get Top N Results (using numpy to sort efficiently)
    # np.argsort sorts in ascending order. We negate the array to sort descendingly.
    # We then take the first N indices (the indices of the highest probabilities)
    top_n_indices = np.argsort(-probabilities)[:TOP_N]

    # 6. Translate and Format Output
    recommendations = []
    
    # Get the human-readable crop names
    top_n_crops = label_encoder.inverse_transform(top_n_indices)

    for i in range(TOP_N):
        # Apply capitalization for cleaner output
        crop_name = str(top_n_crops[i]).capitalize() 
        # Get the probability directly using the index
        confidence = probabilities[top_n_indices[i]] 
        
        recommendations.append({
            "rank": i + 1,
            "crop": crop_name,
            "confidence": round(confidence * 100, 2) # Return as percentage
        })

    # 7. Return structured JSON response
    return jsonify({
        "status": "success",
        "total_recommendations": TOP_N,
        "recommendations": recommendations
    }), 200


if __name__ == '__main__':
    # Load assets once when the application starts
    load_assets()
    # Use the PORT environment variable if provided by the host (e.g., Render), else default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
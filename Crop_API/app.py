import joblib
import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "crop_recommender_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "standard_scaler.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")

REQUIRED_FEATURES = 7
TOP_N = 3

app = Flask(__name__)
CORS(app)

model = None
scaler = None
label_encoder = None


def load_assets():
    global model, scaler, label_encoder
    try:
        print("Loading ML assets...")

        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        label_encoder = joblib.load(ENCODER_PATH)

        print("ML assets loaded successfully.")

    except FileNotFoundError as e:
        print("MODEL FILE MISSING:", e)

    except Exception as e:
        print("MODEL LOAD ERROR:", e)


@app.route("/")
def home():
    return jsonify({"message": "Smart Crop ML API Running"})


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None
    })


@app.route("/api/predict", methods=["POST"])
def predict():

    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.get_json()

        if "features" not in data:
            return jsonify({"error": "Missing features"}), 400

        features = data["features"]

        if len(features) != REQUIRED_FEATURES:
            return jsonify({
                "error": f"Expected {REQUIRED_FEATURES} features"
            }), 400

        input_array = np.array(features).reshape(1, -1)

        scaled = scaler.transform(input_array)

        probabilities = model.predict_proba(scaled)[0]

        top_indices = np.argsort(-probabilities)[:TOP_N]

        crops = label_encoder.inverse_transform(top_indices)

        recommendations = []

        for i in range(TOP_N):

            recommendations.append({
                "rank": i + 1,
                "crop": str(crops[i]).capitalize(),
                "confidence": round(probabilities[top_indices[i]] * 100, 2)
            })

        return jsonify({
            "status": "success",
            "recommendations": recommendations
        })

    except Exception as e:

        print("Prediction error:", e)

        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":

    load_assets()

    port = int(os.environ.get("PORT", 5000))

    app.run(host="0.0.0.0", port=port, debug=True)
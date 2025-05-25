import nltk
import random
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from nltk.stem import WordNetLemmatizer

# Point to your nltk_data directory
nltk.data.path.append("C:/Users/jabeu/AppData/Roaming/nltk_data")

lemmatizer = WordNetLemmatizer()

app = Flask(__name__)
CORS(app)

# Load intents
with open("intents.json", encoding="utf-8") as file:
    intents = json.load(file)

def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    return [lemmatizer.lemmatize(word.lower()) for word in sentence_words]

def find_intent(sentence_words):
    for intent in intents["intents"]:
        for pattern in intent["patterns"]:
            pattern_words = nltk.word_tokenize(pattern.lower())
            if set(pattern_words) & set(sentence_words):
                return intent["tag"]
    return None

def get_response(tag):
    for intent in intents["intents"]:
        if intent["tag"] == tag:
            return random.choice(intent["responses"])
    return "Sorry, I didn’t understand that."

@app.route("/", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)
        if not data or "message" not in data:
            return jsonify({"error": "No message provided"}), 400

        message = data["message"]
        tokens = clean_up_sentence(message)
        tag = find_intent(tokens)
        response = get_response(tag) if tag else "Sorry, I don't understand."

        return jsonify({
            "response": response,
            "intent": tag if tag else "default"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

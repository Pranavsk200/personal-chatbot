from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import nltk
nltk.download('stopwords')  # Download stopwords if not already available
from nltk.corpus import stopwords
from string import punctuation
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def preprocess_text(text):
    """
    Performs text cleaning steps for TF-IDF calculation.

    Args:
        text (str): The text to be preprocessed.

    Returns:
        str: The preprocessed text.
    """


    text = text.lower()  # Convert to lowercase
    text = ''.join([char for char in text if char not in punctuation])  # Remove punctuation
    tokens = [word for word in text.split() if word not in stopwords.words('english')]  # Remove stopwords
    return ' '.join(tokens)  # Join preprocessed tokens

def find_similar_answer(query):
    """
    Finds the most similar answer to a given query using TF-IDF and cosine similarity.

    Args:
        query (str): The query to be matched.

    Returns:
        tuple: A tuple containing the index of the most similar answer and its cosine similarity score.
    """
    vectorizer = joblib.load('vectorizer.pkl')
    tfidf_matrix = joblib.load('tfidf_matrix.pkl')
    answers = joblib.load('answers.pkl')
    query_vector = vectorizer.transform([preprocess_text(query)])
    print("query_vector",query_vector)
    cosine_similarities = cosine_similarity(query_vector, tfidf_matrix)
    most_similar_index = cosine_similarities.argmax()
    similarity_score = cosine_similarities.max()
    return most_similar_index, similarity_score, answers

@app.route('/answer', methods=['POST'])
def answer_question():
    if request.method == 'POST':
        data = request.get_json()
        if 'question' in data:
            question = data['question']
            most_similar_idx, similarity, answers = find_similar_answer(question)
            #if most_similar_idx > len(list(answers)):  # Adjust threshold based on your confidence level
            return jsonify({'answer': answers[most_similar_idx], 'similarity': similarity})
            #else:
                #return jsonify({'message': 'No relevant answer found.'})
        else:
            return jsonify({'message': 'Missing question field in request body.'}), 400
    else:
        return jsonify({'message': 'Unsupported request method.'}), 405

if __name__ == '__main__':
    app.run(debug=True)
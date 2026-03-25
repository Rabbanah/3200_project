import json
import os
from flask import Flask, request, jsonify
from realdb import RealDB

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database.db')
JSON_PATH = os.path.join(BASE_DIR, 'database.json')

db = RealDB(DB_PATH)

# Seed SQLite from database.json on first run
def seed_database_json():
    try:
        if db.list_books():
            return

        next_id = 1
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            books = json.load(f)
            for book in books:
                if not all(k in book for k in ['title', 'author', 'year_published', 'rating', 'genre']):
                    continue

                seed_book = {
                    'title': book['title'],
                    'author': book['author'],
                    'year_published': int(book['year_published']),
                    'rating': int(book['rating']),
                    'genre': book['genre']
                }

                if 'id' in book and isinstance(book['id'], int) and book['id'] > 0:
                    seed_book['id'] = book['id']
                    next_id = max(next_id, book['id'] + 1)
                else:
                    seed_book['id'] = next_id
                    next_id += 1

                db.create_book(seed_book)
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f"Error seeding database.json: {e}")

seed_database_json()

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/', methods=['GET'])
def hello_world():
    return '<p>Hello world</p>'

@app.route('/books', methods=['OPTIONS'])
def books_options():
    return '', 204

@app.route('/books/<int:book_id>', methods=['OPTIONS'])
def books_id_options(book_id):
    return '', 204

@app.route('/books', methods=['GET'])
def list_books():
    books = db.list_books()
    return jsonify(books), 200

@app.route('/debug', methods=['GET'])
def debug_info():
    try:
        count = len(db.list_books())
    except Exception as ex:
        count = str(ex)
    return jsonify({'db_path': DB_PATH, 'exists': os.path.exists(DB_PATH), 'count': count}), 200

@app.route('/books/next_id', methods=['GET'])
def get_next_book_id():
    books = db.list_books()
    if books:
        max_id = max(book['id'] for book in books if 'id' in book and book['id'] is not None)
        next_id = max_id + 1
    else:
        next_id = 1
    return jsonify({'next_id': next_id}), 200

@app.route('/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = db.get_book(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    return jsonify(book), 200

@app.route('/books', methods=['POST'])
def create_a_new_book():
    data = request.get_json() if request.is_json else request.form

    required = ['title', 'author', 'year_published', 'rating', 'genre']
    for field in required:
        if field not in data or str(data.get(field)).strip() == '':
            return jsonify({'error': f"'{field}' field is required"}), 400

    try:
        year_published = int(data['year_published'])
        rating = int(float(data['rating']))
    except (ValueError, TypeError):
        return jsonify({'error': "'year_published' must be an integer and 'rating' must be a number"}), 400

    if rating < 0 or rating > 10:
        return jsonify({'error': "'rating' must be between 0 and 10"}), 400

    if year_published < 1000 or year_published > 2026:
        return jsonify({'error': "'year_published' must be between 1000 and 2026"}), 400

    book = {
        'title': str(data['title']).strip(),
        'author': str(data['author']).strip(),
        'year_published': year_published,
        'rating': rating,
        'genre': str(data['genre']).strip()
    }

    # Handle user-provided ID
    if 'id' in data and data['id']:
        try:
            user_id = int(data['id'])
            if user_id <= 0:
                return jsonify({'error': "'id' must be a positive integer"}), 400
            existing = db.get_book(user_id)
            if existing:
                return jsonify({'error': f"Book with id {user_id} already exists"}), 400
            book['id'] = user_id
        except (ValueError, TypeError):
            return jsonify({'error': "'id' must be an integer"}), 400

    book_id = db.create_book(book)
    created = db.get_book(book_id)
    if created is None:
        created = {**book, 'id': book_id}
    elif 'id' not in created or created['id'] is None:
        created['id'] = book_id
    return jsonify(created), 201

@app.route('/books/<int:book_id>', methods=['PUT'])
def replace_book(book_id):
    data = request.get_json() if request.is_json else request.form

    required = ['title', 'author', 'year_published', 'rating', 'genre']
    for field in required:
        if field not in data or str(data.get(field)).strip() == '':
            return jsonify({'error': f"'{field}' field is required"}), 400

    book = db.get_book(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404

    try:
        year_published = int(data['year_published'])
        rating = int(float(data['rating']))
    except (ValueError, TypeError):
        return jsonify({'error': "'year_published' must be an integer and 'rating' must be a number"}), 400

    if rating < 0 or rating > 10:
        return jsonify({'error': "'rating' must be between 0 and 10"}), 400

    if year_published < 1000 or year_published > 2026:
        return jsonify({'error': "'year_published' must be between 1000 and 2026"}), 400

    updated_book = {
        'title': str(data['title']).strip(),
        'author': str(data['author']).strip(),
        'year_published': year_published,
        'rating': rating,
        'genre': str(data['genre']).strip()
    }

    if not db.update_book(book_id, updated_book):
        return jsonify({'error': 'Update failed'}), 500

    return jsonify(db.get_book(book_id)), 200

@app.route('/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = db.get_book(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    db.delete_book(book_id)
    return jsonify({}), 204

@app.errorhandler(404)
def handle_404(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(405)
def handle_405(e):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(400)
def handle_400(e):
    return jsonify({'error': 'Bad request'}), 400

if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')

import sqlite3

class RealDB:
    def __init__(self, filename):
        self.filename = filename
        self.conn = sqlite3.connect(self.filename, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        self._init_schema()

    def _init_schema(self):
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                year_published INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                genre TEXT NOT NULL
            )
        """)
        self.conn.commit()

    def list_books(self):
        self.cursor.execute("SELECT * FROM books ORDER BY id")
        rows = self.cursor.fetchall()
        books = []
        for row in rows:
            book = dict(row)
            if 'id' not in book or book['id'] is None:
                # assign fallback id to preserve client expectations
                book['id'] = -1
            books.append(book)
        return books

    def get_book(self, book_id):
        self.cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
        row = self.cursor.fetchone()
        return dict(row) if row else None

    def create_book(self, book):
        if 'id' in book:
            self.cursor.execute(
                "INSERT INTO books (id, title, author, year_published, rating, genre) VALUES (?, ?, ?, ?, ?, ?)",
                (book['id'], book['title'], book['author'], book['year_published'], book['rating'], book['genre'])
            )
        else:
            self.cursor.execute(
                "INSERT INTO books (title, author, year_published, rating, genre) VALUES (?, ?, ?, ?, ?)",
                (book['title'], book['author'], book['year_published'], book['rating'], book['genre'])
            )
        self.conn.commit()
        return self.cursor.lastrowid

    def update_book(self, book_id, book):
        self.cursor.execute(
            "UPDATE books SET title = ?, author = ?, year_published = ?, rating = ?, genre = ? WHERE id = ?",
            (book['title'], book['author'], book['year_published'], book['rating'], book['genre'], book_id)
        )
        self.conn.commit()
        return self.cursor.rowcount > 0

    def delete_book(self, book_id):
        self.cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
        self.conn.commit()
        return self.cursor.rowcount > 0

    
# Book Collection API

This project manages a single resource: **book**.

## Resource model

- resource: `book`
- attributes:
  - `id` (integer, unique identifier)
  - `title` (text)
  - `author` (text)
  - `year_published` (integer)
  - `rating` (integer 0-10)
  - `genre` (text)

## SQLite schema

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  year_published INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  genre TEXT NOT NULL
);
```

## API endpoints

| Name | Method | Path | Description |
|------|--------|------|-------------|
| List books | GET | /books | Return JSON array of all books |
| Get book | GET | /books/<id> | Return JSON data for one book |
| Create book | POST | /books | Create book using JSON or form data |
| Replace book | PUT | /books/<id> | Update book by id with all fields |
| Delete book | DELETE | /books/<id> | Delete book by id |
| CORS preflight | OPTIONS | /books, /books/<id> | Return 204 with CORS headers |

## Server details

- File: `server/app.py`
- CORS applied server-wide via `@app.after_request`
- Uses `server/realdb.py` for SQLite logic, class `RealDB`
- `server/database.json` used for initial seed data on first run

## Client details

- File: `client/index.html`, `client/app.js`, `client/style.css`
- Features:
  - book list display with title + author + year + rating + genre
  - add new book form
  - edit existing book via same form (pre-filled)
  - delete book with `confirm()` prompt
  - search and sort functions
  - Ajax calls to all REST endpoints

## Run project

1. Start server:
   ```bash
   cd server
   python app.py
   ```
2. Start client:
   ```bash
   cd client
   python -m http.server 3000
   ```
3. Open browser at `http://localhost:3000`

## Notes

- No third-party JS/CSS frameworks are used.
- Data operations use `fetch` and JSON/form body in client API requests.




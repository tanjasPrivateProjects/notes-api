package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/mattn/go-sqlite3"
)

/*
	Models - note represents a singe note entity stored in the database
	and exchanged via the HTTP API
*/

type Note struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateNoteRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// global database handel (shared across handlers)

var db *sql.DB

// ensures required database schema exists
// safe to call on every startup
func initDB() error {
	query := `
	CREATE TABLE IF NOT EXISTS notes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		content TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := db.Exec(query)
	return err
}

// MAIN

func main() {
	var err error

	// open SQLite database file
	db, err = sql.Open("sqlite3", "./notes.db")
	if err != nil {
		log.Fatal(err)
	}

	// initializes database schema
	if err := initDB(); err != nil {
		log.Fatal(err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	/*  CORS Middleware */
	// allows frontend (vite on localhost:5173) to access this API
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	/*  ROUTES  */

	// Health
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// GET /notes
	r.Get("/notes", func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(
			"SELECT id, title, content, created_at FROM notes ORDER BY id DESC",
		)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer rows.Close()

		var notes []Note
		for rows.Next() {
			var n Note
			rows.Scan(&n.ID, &n.Title, &n.Content, &n.CreatedAt)
			notes = append(notes, n)
		}

		writeJSON(w, http.StatusOK, notes)
	})

	// POST /notes
	r.Post("/notes", func(w http.ResponseWriter, r *http.Request) {
		var req CreateNoteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
			return
		}

		if req.Title == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title required"})
			return
		}

		res, err := db.Exec(
			"INSERT INTO notes (title, content) VALUES (?, ?)",
			req.Title,
			req.Content,
		)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}

		id, _ := res.LastInsertId()

		note := Note{
			ID:      int(id),
			Title:   req.Title,
			Content: req.Content,
		}

		writeJSON(w, http.StatusCreated, note)
	})

	// DELETE /notes/{id}
	r.Delete("/notes/{id}", func(w http.ResponseWriter, r *http.Request) {
		idStr := chi.URLParam(r, "id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
			return
		}

		res, err := db.Exec("DELETE FROM notes WHERE id = ?", id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}

		affected, _ := res.RowsAffected()
		if affected == 0 {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "note not found"})
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	})

	/*  START  */

	log.Println("Server läuft auf http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

/*  HELPERS  */

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"database/sql"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/mattn/go-sqlite3"
)

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

var (
	mu     sync.Mutex
	notes  = make([]Note, 0)
	nextID = 1
)

var db *sql.DB

func main() {
	var err error

	db, err = sql.Open("sqlite3", "./notes.db")
	if err != nil {
		log.Fatal(err)
	}

	if err := initDB(); err != nil {
		log.Fatal(err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	})
	log.Println("RUNNING VERSION: notes routes should exist")

	// Health
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// POST /notes
	r.Post("/notes", func(w http.ResponseWriter, r *http.Request) {
		var req CreateNoteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
			return
		}
		if req.Title == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title must not be empty"})
			return
		}

		result, err := db.Exec(
			"INSERT INTO notes (title, content) VALUES (?, ?)",
			req.Title,
			req.Content,
		)

		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}

		id, err := result.LastInsertId()
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}

		note := Note{
			ID:      int(id),
			Title:   req.Title,
			Content: req.Content,
		}

		writeJSON(w, http.StatusCreated, note)
	})

	// GET /notes
	r.Get("/notes", func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(
			"SELECT id, title, content FROM notes ORDER BY id DESC",
		)

		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer rows.Close()

		var notes []Note

		for rows.Next() {
			var n Note
			rows.Scan(&n.ID, &n.Title, &n.Content)
			notes = append(notes, n)
		}

		writeJSON(w, http.StatusOK, notes)
	})

	log.Println("Server läuft auf http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func initDB() error {
	query := `CREATE BTABLE IF NOT EXISTS notes ( 
	id INTEGER PRIMARY KEY AUTOINCREMENT, 
	title TEXT NOT NULL, 
	content TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := db.Exec(query)
	return err
}

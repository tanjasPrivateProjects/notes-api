package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
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

func main() {
	r := chi.NewRouter()
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

		mu.Lock()
		note := Note{
			ID:        nextID,
			Title:     req.Title,
			Content:   req.Content,
			CreatedAt: time.Now().UTC(),
		}
		nextID++
		notes = append(notes, note)
		mu.Unlock()

		writeJSON(w, http.StatusCreated, note)
	})

	// GET /notes
	r.Get("/notes", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		out := make([]Note, len(notes))
		copy(out, notes)
		mu.Unlock()

		writeJSON(w, http.StatusOK, out)
	})

	log.Println("Server läuft auf http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

# Notes API 

A simple REST API written in Go using the chi router. 
This project is built step by step as a learning and portfolio project.

## Features
- Health check endpoint
- Create Notes
- List Notes
- In-Memory storage (SQLite planned)

## Tech Stack
- Go
- chi router
- REST / JSON

## Endpoints

### Health 
GET /health

Response: ok

### create Note
POST /notes

# List Notes
run locally on: "go run ./cmd/server"

#  Server runs on: "http://localhost:8080"

Danach commit & push: 
```bash
git add README.md
git commit -m "Add README"
git push

```json
{
  "title":"My first note",
  "content":"Hello World"
}

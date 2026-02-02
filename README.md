# Notes API & Web App 

A simple full-stack notes application built as a **learning and portfolio project** 

The project starts with REST API written in Go and is gradually extended with: 
- a web frontend 
- persistent storage (SQLite)
- basic CRUD functionality 

The goal is to understand **backend fundamentals, REST APIs, frontend intergration, and full-stack workflows**

--- 

## Features 

### Backend (Go)
- Health check endpoint 
- create notes 
- list notes 
- delete notes 
- SQLlite database for persistent storage
- CORS-enabled API for frontend usage

### Frontend (React)
- create notes with title and content
- rich-text-lik formatting (bold, italic, underline, lists)
- expandable note view 
- delete notes 
- scrollable notes list 
- clean, modern UI

--- 

## Tech Stack

### Backend
- **Go**
- **chi router**
- **SQLite**
- REST / JSON

### Frontend
- **React**
- **TypeScript**
- **CSS (custom styling)**
- Fetch API

## API Endpoints 

### Health Check 
http
GET /health

# Response 
- ok 

# Create Note 
- POST /notes 

# List Notes
- GET /notes 
retuns all notes ordered by newest first

# Delete Note 
- DELETE /notes/{id}
deletes a note by its ID

# Getting Started 
1. clone the repository 
git clone https://github.com/<tanjaprivateprojects>/<notes-api>.git 
cd <notes-api>

2. Start the Backend 
Make sure you have Go installed 
  go run main.go 

The server will start on: 
  http://localhost:8080

3. Start the Frontend
navigating to the frontend folder: 
  npm install 
  npm run dev
Frontend runs on: 
  http://localhost:5173

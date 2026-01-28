import { useEffect, useState } from "react";
import "./App.css";

type Note = {
  id: number; 
  title: string; 
  content?: string; 
  created_at: string,
}; 

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/notes")
    .then(res => res.json())
    .then(data => setNotes(data));
  }, []);

  const addNote = async () => {
    await fetch("http://localhost:8080/notes", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    setTitle("");
    setContent("");

    const res = await fetch("http://localhost:8080/notes");
    setNotes(await res.json());
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>Notes App</h1>

      <input
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <textarea
        placeholder="Content"
        value={content}
        onChange={e => setContent(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <button onClick={addNote}>Add Note</button>

      <ul>
        {notes.map(note => (
          <li key={note.id}>
            <strong>{note.title}</strong>
            <div>{note.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
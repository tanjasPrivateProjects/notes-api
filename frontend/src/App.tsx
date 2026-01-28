import { useEffect, useState } from "react";
import "./App.css";
import ReactQuill from "react-quill";

type Note = {
  id: number;
  title: string;
  content?: string;
};

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/notes")
      .then(res => res.json())
      .then(setNotes);
  }, []);

  const addNote = async () => {
    if (!title) return;

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
    <div className="app">
      <div className="card">
        <h1>Notes App</h1>

        <input
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Content"
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        <button onClick={addNote}>Add Note</button>

        {notes.map(note => (
          <div key={note.id} className="note">
            <h2>{note.title}</h2>
            {note.content && <p>{note.content}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
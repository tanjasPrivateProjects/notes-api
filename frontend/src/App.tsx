import { useEffect, useRef, useState } from "react";
import "./App.css";
import ReactQuill from "react-quill";

type Note = {
  id: number;
  title: string;
  content?: string;
};

export default function App() {
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
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

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const wrapSelection = (wrapper: string) => {
    const textarea = textareaRef.current; 
    if(!textarea) return; 

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd; 

    const selectedText = content.slice(start, end);
    const newText = content.slice(0, start) + 
      wrapper + 
      selectedText + 
      wrapper + 
      content.slice(end);

      setContent(newText);

      setTimeout(() => {
        textarea.focus(); 
        textarea.selectionStart = start + wrapper.length; 
        textarea.selectionEnd = end + wrapper.length;
      }, 0);
  };

  const formatText = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/\n/g, "<br/>");
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

       <div className="toolbar">
        <button onMouseDown={(e) => {e.preventDefault(); wrapSelection("**");}}>B</button>
        <button onMouseDown={(e) => {e.preventDefault();wrapSelection("*");}}>I</button>
        <button onMouseDown={(e) => {e.preventDefault(); wrapSelection("__");}}>U</button>
       </div>

        <textarea
          ref={textareaRef}
          placeholder="Content"
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        <button onClick={addNote}>Add Note</button>

        {notes.map(note => {
  const isOpen = openNoteId === note.id;

  return (
    <div
      key={note.id}
      className="note"
      onClick={() =>
        setOpenNoteId(isOpen ? null : note.id)
      }
      style={{ cursor: "pointer" }}
    >
      <h2>{note.title}</h2>

      {/* Preview (immer sichtbar) */}
      {!isOpen && note.content && (
        <p className="note-preview">
          {note.content.slice(0, 80)}
          {note.content.length > 80 && "..."}
        </p>
      )}

      {/* Full content (nur wenn offen) */}
      {isOpen && (
        <div
          className="note-full"
          dangerouslySetInnerHTML={{
            __html: formatText(note.content || ""),
          }}
        />
      )}
    </div>
  );
})}
      </div>
    </div>
  );
}
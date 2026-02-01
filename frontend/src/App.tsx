import { useEffect, useRef, useState } from "react";
import "./App.css";

type Note = {
  id: number;
  title: string;
  content?: string;
};

/* ================= TEXT FORMAT ================= */

const formatText = (text: string) => {
  let html = text;

  html = html
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<u>$1</u>");

  html = html.replace(
    /(?:^|\n)(- .*(?:\n- .*)*)/g,
    (_, list) => {
      const items = list
        .trim()
        .split("\n")
        .map((i: string) => `<li>${i.slice(2)}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }
  );

  html = html.replace(
    /(?:^|\n)((?:\d+\. .*(?:\n|$))+)/g,
    (_, list) => {
      const items = list
        .trim()
        .split("\n")
        .map((i: string) => `<li>${i.replace(/^\d+\. /, "")}</li>`)
        .join("");
      return `<ol>${items}</ol>`;
    }
  );

  html = html.replace(/\n/g, "<br/>");
  return html;
};

/* ================= APP ================= */

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* ===== FETCH ===== */
  useEffect(() => {
    fetch("http://localhost:8080/notes")
      .then(res => res.json())
      .then(setNotes);
  }, []);

  /* ===== ESC CLOSE ===== */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenNoteId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ===== ADD NOTE ===== */
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

 const deleteNote = async (id: number) => {
	await fetch(`http://localhost:8080/notes/${id}`, {
		method: "DELETE",
	});

	setNotes(notes.filter(n => n.id !== id));


  // Falls gerade offen → schließen
  if (openNoteId === id) {
    setOpenNoteId(null);
  }
};


  /* ===== FORMAT HELPERS ===== */

  const wrapSelection = (wrapper: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    setContent(
      content.slice(0, start) +
        wrapper +
        content.slice(start, end) +
        wrapper +
        content.slice(end)
    );

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + wrapper.length;
      textarea.selectionEnd = end + wrapper.length;
    }, 0);
  };

  const insertBullet = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(start);

    setContent(
      before +
        (before.endsWith("\n") || before === "" ? "" : "\n") +
        prefix +
        after
    );
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(start);

    const lines = before.split("\n");
    const currentLine = lines[lines.length - 1];

    if (currentLine.startsWith("- ")) {
      e.preventDefault();
      setContent(before + "\n- " + after);
      return;
    }

    const match = currentLine.match(/^(\d+)\. /);
    if (match) {
      e.preventDefault();
      const next = parseInt(match[1]) + 1;
      setContent(before + `\n${next}. ` + after);
    }
  };

  /* ================= RENDER ================= */

return (
  <div className="app">
    <div className="layout">

      {/* ===== EDITOR ===== */}
      <div className="card editor-card">
        <h1>Notes App</h1>

        <div className="editor">
          <input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="toolbar">
            <button onMouseDown={e => { e.preventDefault(); wrapSelection("**"); }}>B</button>
            <button onMouseDown={e => { e.preventDefault(); wrapSelection("*"); }}>I</button>
            <button onMouseDown={e => { e.preventDefault(); wrapSelection("__"); }}>U</button>
            <button onMouseDown={e => { e.preventDefault(); insertBullet("- "); }}>•</button>
            <button onMouseDown={e => { e.preventDefault(); insertBullet("1. "); }}>1.</button>
          </div>

          <textarea
            ref={textareaRef}
            placeholder="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleEnter}
          />

          <button onClick={addNote}>Add Note</button>
        </div>
      </div>

      {/* ===== NOTES ===== */}
      {notes.length > 0 && (
        <div className="notes-stage">
          <h3 className="notes-title">Your Notes</h3>

          <div className="notes-scroll">
{notes.map(note => {
  const isOpen = openNoteId === note.id;

  return (
    <div
      key={note.id}
      className={`note ${isOpen ? "note-open" : ""}`}
      onClick={() => setOpenNoteId(isOpen ? null : note.id)}
    >
      <div className="note-header">
        <h2>{note.title}</h2>

        <div className="note-actions">
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();   // 🔥 wichtig
              deleteNote(note.id);
            }}
          >
            ✕
          </button>

          <span className="chevron">
            {isOpen ? "▲" : "▼"}
          </span>
        </div>
      </div>

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
      )}

    </div>
  </div>
);
}
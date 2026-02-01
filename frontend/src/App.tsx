import { useEffect, useRef, useState } from "react";
import "./App.css";

type Note = {
  id: number;
  title: string;
  content?: string;
};

const formatText = (text: string) => {
  let html = text;

  // Bold, Italic, Underline
  html = html
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<u>$1</u>");

  // Unordered list
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

  // Ordered list
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

  // Line breaks
  html = html.replace(/\n/g, "<br/>");

  return html;
};


export default function App() {
  const [focusedNoteId, setFocusedNoteId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/notes")
      .then(res => res.json())
      .then(setNotes);
  }, []);

    useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedNoteId(null);
        setOpenNoteId(null);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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

  const wrapSelection = (wrapper: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);
    const newText =
      content.slice(0, start) +
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

  const insertBullet = (prefix: string) => {
    const textarea = textareaRef.current; 
    if (!textarea) return; 

    const start = textarea.selectionStart;

    const before = content.slice(0, start); 
    const after = content.slice(start);

    const newText = 
      before + 
        (before.endsWith("\n")  ||  before === "" ? "" : "\n") + 
        prefix + 
        after;

    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = 
        start + prefix.length + 1;
    }, 0);
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

  // BULLET LIST
  if (currentLine.startsWith("- ")) {
    e.preventDefault();

    // Wenn nur "- " → Liste beenden
    if (currentLine.trim() === "-") {
      setContent(before.slice(0, -2) + "\n" + after);
      return;
    }

    setContent(before + "\n- " + after);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 3;
    }, 0);
    return;
  }

  // ORDERED LIST
  const match = currentLine.match(/^(\d+)\. (.*)/);
  if (match) {
    e.preventDefault();

    const number = parseInt(match[1], 10);
    const text = match[2];

    // Wenn leer → Liste beenden
    if (text.trim() === "") {
      setContent(before.slice(0, -match[0].length) + "\n" + after);
      return;
    }

    const nextNumber = number + 1;
    setContent(before + `\n${nextNumber}. ` + after);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd =
        start + nextNumber.toString().length + 3;
    }, 0);
  }
};


  return (
    <div className="app">
      <div className="card">
        <h1>Notes App</h1>

        {/* ===== EDITOR ===== */}
        <div className="editor">
          <input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="toolbar">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                wrapSelection("**");
              }}
            >
              B
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                wrapSelection("*");
              }}
            >
              I
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                wrapSelection("__");
              }}
            >
              U
            </button>

            <button
              onMouseDown={(e) => {
                e.preventDefault();
                insertBullet("- "); 
              }}
            >
              . 
            </button>

            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                insertBullet("1. "); 
              }}
             >
              1.   
            </button> 
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

        {/* ===== STAGE ===== */}
        {notes.length > 0 && (
          <div className={`notes-stage ${focusedNoteId ? "stage-dimmed" : ""}`} 
            onClick={() => { 
              setFocusedNoteId(null); 
              setOpenNoteId(null);
            }}
          >
            <h3 className="notes-title">Your Notes</h3>

            {notes.map(note => {
              const isOpen = openNoteId === note.id;

              return (
                <div
                  key={note.id}
                  className={`note ${isOpen ? "note-open" : ""} ${focusedNoteId === note.id ? "note-focus" : ""}`}
                  onClick={(e) => {
                      e.stopPropagation();
                      setOpenNoteId(isOpen ? null : note.id);
                      setFocusedNoteId(isOpen ? null : note.id);
                  }}
                >
                  <div className="note-header">
                    <h2>{note.title}</h2>
                    <span className="chevron">
                      {isOpen ? "▲" : "▼"}
                    </span>
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
        )}
      </div>
    </div>
  );
}
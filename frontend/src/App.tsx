import { useEffect, useState } from "react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-700">
        
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Notes App
        </h1>

        {/* Form */}
        <div className="space-y-3 mb-6">
          <input
            className="w-full rounded-lg bg-slate-800 text-white px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <textarea
            className="w-full rounded-lg bg-slate-800 text-white px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          <button
            onClick={addNote}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Add Note
          </button>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="bg-slate-800/80 rounded-xl p-4 border border-slate-700"
            >
              <h2 className="text-white font-semibold">{note.title}</h2>
              {note.content && (
                <p className="text-slate-300 text-sm mt-1">
                  {note.content}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
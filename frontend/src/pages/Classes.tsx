import { useEffect, useState } from "react";
import { api } from "../api";

type Aula = {
  id: number;
  title: string;
  description: string;
  start_datetime: string;
  instructor: number;
  created_at: string;
};

export default function Classes() {
  const [items, setItems] = useState<Aula[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await api.get("/classes/");
    setItems(r.data.results || []);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      const r = await api.post("/classes/", {
        title,
        description,
        start_datetime: start
      });
      setTitle("");
      setDescription("");
      setStart("");
      await load();
      setMsg("Aula criada");
    } catch (err: any) {
      setMsg("Não autorizado ou dados inválidos");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Aulas</h2>
      <ul style={{ padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {items.map(i => (
          <li key={i.id} style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{i.title}</div>
            <div>{i.description}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{new Date(i.start_datetime).toLocaleString()}</div>
          </li>
        ))}
        {!items.length && <li>Nenhuma aula cadastrada</li>}
      </ul>

      <div style={{ borderTop: "1px solid #eee", marginTop: 24, paddingTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Criar aula</h3>
        <form onSubmit={create} style={{ display: "grid", gap: 8 }}>
          <input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
          <input placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
          <input placeholder="Início (ISO 8601)" value={start} onChange={e=>setStart(e.target.value)} />
          <button type="submit">Salvar</button>
        </form>
        {msg && <p style={{ color: "#0a0", marginTop: 8 }}>{msg}</p>}
      </div>
    </div>
  );
}

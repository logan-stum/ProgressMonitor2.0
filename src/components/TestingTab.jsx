import { useRef, useState } from "react";
import Modal from "./Modal.jsx";

const SEASONS = ["spring", "winter", "summer", "fall"];

function TestingTab({ student, selSet, upd, theme }) {
  const entries = Array.isArray(student?.testing) ? student.testing : [];
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [scores, setScores] = useState({});
  const scoreRefs = useRef({});

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setName("");
    setScores({});
  };

  const openNew = () => {
    setEditingId(null);
    setName("");
    setScores({});
    setShowModal(true);
  };

  const openEdit = entry => {
    setEditingId(entry.id);
    setName(entry.name);
    setScores(entry.scores ?? {});
    setShowModal(true);
  };

  const toggleSeason = season => {
    const isSelected = Object.prototype.hasOwnProperty.call(scores, season);
    setScores(current => {
      if (Object.prototype.hasOwnProperty.call(current, season)) {
        const next = { ...current };
        delete next[season];
        return next;
      }
      return { ...current, [season]: "" };
    });
    if (!isSelected) {
      requestAnimationFrame(() => scoreRefs.current[season]?.focus());
    }
  };

  const saveEntry = scoresDraft => {
    const trimmedName = name.trim();
    const scoresToSave = scoresDraft ?? scores;
    const selectedScores = Object.fromEntries(
      Object.entries(scoresToSave)
        .filter(([season, score]) => SEASONS.includes(season) && String(score).trim() !== "")
        .map(([season, score]) => [season, Number(score)])
        .filter(([, score]) => Number.isFinite(score) && score >= 0)
    );
    if (!trimmedName || Object.keys(selectedScores).length === 0) return;

    const payload = { id: editingId ?? `testing_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`, name: trimmedName, scores: selectedScores };
    upd(data => {
      if (!Array.isArray(data[selSet].testing)) data[selSet].testing = [];
      data[selSet].testing = editingId
        ? data[selSet].testing.map(entry => entry.id === editingId ? { ...entry, ...payload } : entry)
        : [...data[selSet].testing, payload];
    });
    resetForm();
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 18, color: theme.text }}>📝 Testing</div>
          <div style={{ fontSize: 12, color: theme.subtle, marginTop: 2 }}>{entries.length} test{entries.length !== 1 ? "s" : ""} recorded for {student?.name}</div>
        </div>
        <button className="action-btn" onClick={openNew} style={{ background: theme.primary, color: "#fff" }}>+ Add Testing Entry</button>
      </div>

      <div style={{ background: theme.card, borderRadius: "var(--r-lg)", border: `2px solid ${theme.border}`, padding: 18, boxShadow: `0 8px 20px ${theme.shadow}` }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: theme.subtle, fontSize: 13 }}>No testing entries recorded yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map(entry => (
              <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 10, background: theme.softPanel, border: `1.5px solid ${theme.border}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, color: theme.text }}>{entry.name}</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
                    {SEASONS.filter(season => entry.scores?.[season] !== undefined).map(season => (
                      <span key={season} style={{ padding: "4px 9px", borderRadius: 999, background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 12, fontWeight: 700 }}>
                        {season[0].toUpperCase() + season.slice(1)}: {entry.scores[season]}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="ghost-btn" onClick={() => openEdit(entry)} style={{ color: theme.text, borderColor: theme.border, flexShrink: 0 }}>✏️ Edit</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal show={showModal} onClose={resetForm} title={editingId ? "Edit Testing Entry" : "Add Testing Entry"} emoji="📝" wide>
        <form onSubmit={event => { event.preventDefault(); saveEntry(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Testing name</label>
            <input type="text" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Reading Assessment" autoFocus style={{ width: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Seasons and scores</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {SEASONS.map(season => {
                const selected = Object.prototype.hasOwnProperty.call(scores, season);
                return (
                  <div
                    key={season}
                    role="checkbox"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() => toggleSeason(season)}
                    onKeyDown={event => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleSeason(season);
                      }
                    }}
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      border: `1.5px solid ${selected ? "rgba(38,198,176,0.7)" : theme.border}`,
                      background: selected ? "rgba(38,198,176,0.18)" : theme.panel,
                      boxShadow: selected ? "0 6px 18px rgba(38,198,176,0.12)" : "none",
                      cursor: "pointer",
                      transition: "all .15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, textTransform: "capitalize", color: theme.text }}>
                      <span style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${selected ? theme.primary : theme.border}`, background: selected ? theme.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>{selected ? "✓" : ""}</span>
                      {season}
                    </div>
                    {selected && <input ref={element => { scoreRefs.current[season] = element; }} type="number" min="0" step="any" value={scores[season]} onClick={event => event.stopPropagation()} onChange={event => setScores(current => ({ ...current, [season]: event.target.value }))} onKeyDown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        saveEntry({ ...scores, [season]: event.currentTarget.value });
                      }
                    }} placeholder="Score" style={{ marginTop: 8, width: "100%" }} />}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="ghost-btn" onClick={resetForm}>Cancel</button>
            <button type="submit" className="action-btn" disabled={!name.trim() || Object.keys(scores).length === 0} style={{ background: theme.primary, color: "#fff" }}>{editingId ? "Save" : "Add"} Testing Entry</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TestingTab;
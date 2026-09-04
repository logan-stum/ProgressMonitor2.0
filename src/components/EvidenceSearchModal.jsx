import { useMemo, useState } from "react";
import Modal from "./Modal.jsx";

function EvidenceSearchModal({ show, onClose, sets, onOpenStudent }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    const matches = [];
    sets.forEach((student, studentIndex) => {
      (student.charts ?? []).forEach((chart, goalIndex) => {
        if (chart.notes) matches.push({ studentIndex, goalIndex, studentName: student.name, goalName: chart.name, date: "", type: "Goal note", text: chart.notes });
        (chart.data ?? []).forEach(point => {
          if (point.notes) matches.push({ studentIndex, goalIndex, studentName: student.name, goalName: chart.name, date: point.x, type: "Progress note", text: point.notes });
        });
      });
      (student.minutes ?? []).filter(entry => entry.kind === "attendance").forEach(entry => {
        [entry.sessionNote, entry.lateReason].filter(Boolean).forEach(text => matches.push({
          studentIndex, goalIndex: 0, studentName: student.name, goalName: entry.groupName || "Attendance", date: entry.date,
          type: entry.lateReason ? "Late reason" : "Attendance note", text,
        }));
      });
      Object.entries(student.accDays ?? {}).forEach(([date, record]) => {
        if (record?._note) matches.push({ studentIndex, goalIndex: 0, studentName: student.name, goalName: "Accommodations", date, type: "Accommodation note", text: record._note });
        Object.entries(record?._explanations ?? {}).forEach(([accommodationId, text]) => {
          const accommodation = (student.accommodations ?? []).find(item => String(item.id) === String(accommodationId));
          matches.push({ studentIndex, goalIndex: 0, studentName: student.name, goalName: accommodation?.name || "Accommodations", date, type: "N/A explanation", text });
        });
      });
    });
    return matches
      .filter(result => !normalizedQuery || `${result.studentName} ${result.goalName} ${result.type} ${result.text} ${result.date}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [sets, normalizedQuery]);

  return (
    <Modal show={show} onClose={onClose} title="Evidence & Notes" emoji="🔎" wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search students, goals, notes, or dates…" />
        <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
          Searches goal notes, progress notes, attendance notes, late reasons, and accommodation notes.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "55vh", overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--ink-soft)", fontSize: 13 }}>
              {normalizedQuery ? "No notes match that search." : "No evidence notes have been recorded yet."}
            </div>
          ) : results.map((result, index) => (
            <button key={`${result.studentIndex}-${result.date}-${index}`} onClick={() => { onOpenStudent(result.studentIndex, result.goalIndex); onClose(); }} style={{
              textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)",
              background: "var(--cream)", cursor: "pointer", color: "var(--ink)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, color: "var(--ink-soft)" }}>
                <span style={{ fontWeight: 800, color: "var(--ink-mid)" }}>{result.studentName} · {result.goalName}</span>
                <span>{result.date || "General"}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--teal)", textTransform: "uppercase", marginTop: 5 }}>{result.type}</div>
              <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 3 }}>{result.text}</div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default EvidenceSearchModal;

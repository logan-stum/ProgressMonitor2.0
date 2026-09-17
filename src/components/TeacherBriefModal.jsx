import { useMemo, useState } from "react";
import Modal from "./Modal.jsx";
import { getOnTrackValue, todayStr } from "../utils.js";

function TeacherBriefModal({ show, onClose, sets, theme }) {
  const [copied, setCopied] = useState(false);
  const date = todayStr();
  const brief = useMemo(() => {
    const rows = sets.map(student => {
      const todayAcc = student.accDays?.[date];
      const accommodations = student.accommodations ?? [];
      const missingAccommodations = accommodations.length > 0 && !accommodations.some(item => todayAcc?.[item.id] !== undefined);
      const behindGoals = (student.charts ?? []).filter(chart => {
        const latest = chart.data?.[chart.data.length - 1];
        const target = latest ? getOnTrackValue(chart, latest.x) : null;
        return target != null && target - latest.y > 0.05;
      }).map(chart => chart.name);
      const wins = (student.charts ?? []).filter(chart => {
        const points = chart.data ?? [];
        return points.length >= 2 && points[points.length - 1].y > points[points.length - 2].y;
      }).map(chart => chart.name);
      return { student, missingAccommodations, behindGoals, wins };
    });
    return {
      rows,
      risks: rows.filter(row => row.missingAccommodations || row.behindGoals.length),
      wins: rows.filter(row => row.wins.length),
      logged: rows.filter(row => row.student.accommodations?.length && !row.missingAccommodations).length,
    };
  }, [sets, date]);

  const copyBrief = async () => {
    const text = [
      `Progress Monitor — Teacher Brief (${date})`,
      "",
      `Class: ${sets.length} students · ${brief.risks.length} need attention · ${brief.logged} accommodation logs completed`,
      "",
      "NEEDS ATTENTION",
      ...(brief.risks.length ? brief.risks.map(row => `- ${row.student.name}: ${[row.missingAccommodations ? "accommodations not logged" : "", row.behindGoals.length ? `behind pace in ${row.behindGoals.join(", ")}` : ""].filter(Boolean).join("; ")}`) : ["- No immediate risks found."]),
      "",
      "WINS",
      ...(brief.wins.length ? brief.wins.map(row => `- ${row.student.name}: ${row.wins.join(", ")} trending up`) : ["- Keep collecting progress data to surface wins."]),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal show={show} onClose={onClose} title="Teacher Brief" emoji="✨" wide>
      <div className="print-report" style={{ color: theme.text }}>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: `linear-gradient(135deg, ${theme.softPanel}, ${theme.panel})`, border: `1.5px solid ${theme.border}`, marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 22 }}>Your classroom, distilled.</div>
          <div style={{ color: theme.subtle, fontSize: 13, marginTop: 4 }}>{date} · A private, offline snapshot for your next teaching decision.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {[
            ["👥", sets.length, "students"],
            ["⚠️", brief.risks.length, "need attention"],
            ["📋", brief.logged, "logs complete"],
          ].map(([icon, value, label]) => (
            <div key={label} style={{ padding: "12px 10px", textAlign: "center", borderRadius: 10, background: theme.softPanel, border: `1.5px solid ${theme.border}` }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 22 }}>{value}</div>
              <div style={{ fontSize: 11, color: theme.subtle }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <section style={{ border: "1.5px solid rgba(255,107,107,.4)", borderRadius: 12, padding: 12, background: "rgba(255,107,107,.07)" }}>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, marginBottom: 8 }}>⚡ Next actions</div>
            {brief.risks.length ? brief.risks.map(row => (
              <div key={row.student.sid || row.student.name} style={{ fontSize: 12, padding: "7px 0", borderBottom: "1px dashed rgba(255,107,107,.25)" }}>
                <strong>{row.student.name}</strong>
                <div style={{ color: theme.subtle }}>{row.missingAccommodations ? "Log accommodations today" : ""}{row.missingAccommodations && row.behindGoals.length ? " · " : ""}{row.behindGoals.length ? `Review ${row.behindGoals.join(", ")}` : ""}</div>
              </div>
            )) : <div style={{ fontSize: 12, color: theme.subtle }}>No immediate risks. Protect the momentum.</div>}
          </section>
          <section style={{ border: "1.5px solid rgba(82,201,122,.45)", borderRadius: 12, padding: 12, background: "rgba(82,201,122,.07)" }}>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, marginBottom: 8 }}>🌟 Momentum</div>
            {brief.wins.length ? brief.wins.map(row => (
              <div key={row.student.sid || row.student.name} style={{ fontSize: 12, padding: "7px 0", borderBottom: "1px dashed rgba(82,201,122,.25)" }}><strong>{row.student.name}</strong><div style={{ color: theme.subtle }}>{row.wins.join(", ")} trending up</div></div>
            )) : <div style={{ fontSize: 12, color: theme.subtle }}>No recent upward trends yet—every new log helps reveal one.</div>}
          </section>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }} className="no-print">
          <button className="ghost-btn" onClick={() => window.print()}>🖨 Print brief</button>
          <button className="action-btn" onClick={copyBrief} style={{ background: theme.primary, color: "#fff" }}>{copied ? "✓ Copied" : "Copy brief"}</button>
        </div>
      </div>
    </Modal>
  );
}

export default TeacherBriefModal;

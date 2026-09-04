import { useMemo } from "react";
import { calculateLinearRegression, getOnTrackValue } from "../utils.js";
import Modal from "./Modal.jsx";

function StudentScorecard({ show, onClose, student }) {
  const summary = useMemo(() => {
    if (!student) return null;
    const goals = (student.charts ?? []).map(chart => {
      const points = chart.data ?? [];
      const latest = points[points.length - 1];
      const regression = calculateLinearRegression(points);
      const onTrack = latest ? getOnTrackValue(chart, latest.x) : null;
      const mastered = latest && chart.goalValue != null && Number(latest.y) >= Number(chart.goalValue);
      const behind = latest && onTrack != null && Number(latest.y) < Number(onTrack) - 0.05;
      return { name: chart.name, latest, regression, mastered, behind, pointCount: points.length };
    });
    const minutes = (student.minutes ?? []).filter(entry => entry.kind !== "attendance")
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);
    const attendance = (student.minutes ?? []).filter(entry => entry.kind === "attendance");
    const attended = attendance.filter(entry => entry.status === "attended" || entry.status === "late").length;
    const attendanceRate = attendance.length ? Math.round((attended / attendance.length) * 100) : null;
    const accList = student.accommodations ?? [];
    const accRecords = Object.values(student.accDays ?? {});
    const accStatuses = accRecords.flatMap(record => accList.map(item => record?.[item.id]).filter(Boolean));
    const compliance = accStatuses.length ? Math.round((accStatuses.filter(status => status === "given").length / accStatuses.length) * 100) : null;
    const dates = [
      ...goals.flatMap(goal => goal.latest?.x ? [goal.latest.x] : []),
      ...attendance.map(entry => entry.date).filter(Boolean),
      ...Object.keys(student.accDays ?? {}),
    ].sort();
    return { goals, minutes, attendanceRate, compliance, lastActivity: dates.at(-1) || null };
  }, [student]);

  if (!summary) return null;
  const counts = {
    onTrack: summary.goals.filter(goal => !goal.behind && !goal.mastered && goal.latest).length,
    atRisk: summary.goals.filter(goal => goal.behind).length,
    mastered: summary.goals.filter(goal => goal.mastered).length,
  };

  return (
    <Modal show={show} onClose={onClose} title={`${student.name} Snapshot`} emoji="📋" wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
          {[
            ["Goals on track", counts.onTrack, "#26c6b0"],
            ["Goals at risk", counts.atRisk, "#ff6b6b"],
            ["Goals mastered", counts.mastered, "#52c97a"],
            ["Service minutes", summary.minutes, "#4e9af1"],
          ].map(([label, value, color]) => (
            <div key={label} className="stat-card" style={{ borderColor: `${color}66`, background: "var(--cream)" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)" }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <div><strong>Attendance:</strong> {summary.attendanceRate == null ? "No data" : `${summary.attendanceRate}%`}</div>
          <div><strong>Accommodations:</strong> {summary.compliance == null ? "No data" : `${summary.compliance}% given`}</div>
          <div><strong>Last activity:</strong> {summary.lastActivity || "No activity"}</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>Goal overview</div>
          {summary.goals.length === 0 ? <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>No goals created yet.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {summary.goals.map(goal => (
                <div key={goal.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--cream)", borderRadius: 8, fontSize: 12 }}>
                  <span>{goal.mastered ? "✅" : goal.behind ? "⚠️" : goal.latest ? "📈" : "⚪"}</span>
                  <span style={{ flex: 1, fontWeight: 700 }}>{goal.name}</span>
                  <span>{goal.latest ? `${goal.latest.y}%` : "No entries"}</span>
                  <span style={{ color: "var(--ink-soft)", fontSize: 10 }}>{goal.pointCount} {goal.pointCount === 1 ? "entry" : "entries"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Snapshot uses the data saved on this device. “At risk” means the latest score is below the configured target pace.</div>
      </div>
    </Modal>
  );
}

export default StudentScorecard;

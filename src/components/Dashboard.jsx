import { useState } from "react";
import { getPal, getStudentEmoji, todayStr, getOnTrackValue, currentYear } from "../utils.js";
import Sparkline from "./Sparkline.jsx";

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({
  sets,
  onSelectStudent,
  onAddStudent,
  getPal,
  getStudentEmoji,
  onUpdateStudentGroup,
  groups,
  onOpenGroupModal,
  onOpenBulkReport,
  homeSearch,
  setHomeSearch,
  homeAccommodation,
  setHomeAccommodation,
  homeGroupFilter,
  setHomeGroupFilter,
  theme,
  setTheme,
}){
  const thisYear = currentYear();
  const [dashboardGroupCollapsed, setDashboardGroupCollapsed] = useState({});
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const allAccommodations = [...new Set(sets.flatMap(student => (student.accommodations ?? []).map(item => item.name.trim())).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const filteredStudents = sets.filter(student => {
    const matchesSearch = !homeSearch || `${student.name} ${(student.accommodations ?? []).map(item => item.name).join(" ")}`.toLowerCase().includes(homeSearch.toLowerCase());
    const matchesAccommodation = !homeAccommodation || (student.accommodations ?? []).some(item => item.name === homeAccommodation);
    const matchesGroup = homeGroupFilter === "all" || (homeGroupFilter === "ungrouped" ? !student.groupId : student.groupId === homeGroupFilter);
    return matchesSearch && matchesAccommodation && matchesGroup;
  });

  const orderedStudents = [...filteredStudents].sort((a, b) => a.name.localeCompare(b.name));

  const groupSections = [
    ...groups.map(group => ({
      ...group,
      students: orderedStudents.filter(student => student.groupId === group.id),
    })),
    { id: "ungrouped", name: "Ungrouped", students: orderedStudents.filter(student => !student.groupId || !groups.some(group => group.id === student.groupId)) },
  ];

  const ungroupedStudents = orderedStudents.filter(student => !student.groupId || !groups.some(group => group.id === student.groupId));

  const renderStudentCard = (student, index) => {
    const p = getPal(index);
    const accList = student.accommodations ?? [];
    const hasAccommodations = accList.length > 0;
    const accDays = student.accDays ?? {};
    const todayAcc = accDays[todayStr()];
    const accDone = !!(todayAcc && Object.keys(todayAcc).length > 0);
    const accMissing = hasAccommodations && !accDone;

    // Work out, per goal, whether the latest entry has fallen below the trend line connecting
    // baseline (date+value) to goal (date+value) — i.e. below where the student should be *today*
    // if on pace, not just below the final goal number.
    // Severity is based on the two most recent points, not just magnitude:
    //  - latest point below the line, but the point before it was on/above the line => yellow (new dip)
    //  - latest point below the line, AND the point before it was also below the line => red (a trend)
    let redGoalCount = 0, yellowGoalCount = 0;
    const goalStatuses = student.charts.map(c => {
      const cPts = c.data ?? [];
      const cLatest = cPts[cPts.length - 1];
      if (!cLatest) return { cPts, cLatest, level: null, diff: null, onTrackValue: null, streakCount: 0 };
      const onTrackValue = getOnTrackValue(c, cLatest.x);
      if (onTrackValue == null) return { cPts, cLatest, level: null, diff: null, onTrackValue: null, streakCount: 0 };
      const diff = onTrackValue - cLatest.y;
      // Small epsilon so floating-point rounding on a point that's essentially right on the
      // trend line doesn't get flagged as "behind" by a fraction of a point.
      const EPS = 0.05;

      // Count how many consecutive entries, ending at the latest one, fall below the trend
      // line's target for their own date. This drives the red/yellow severity below.
      let streakCount = 0;
      for (let i = cPts.length - 1; i >= 0; i--) {
        const pt = cPts[i];
        const ptTarget = getOnTrackValue(c, pt.x);
        if (ptTarget == null || ptTarget - pt.y <= EPS) break;
        streakCount++;
      }

      const level = streakCount >= 2 ? "red" : streakCount === 1 ? "yellow" : null;
      if (level === "red") redGoalCount++;
      else if (level === "yellow") yellowGoalCount++;
      return { cPts, cLatest, level, diff, onTrackValue, streakCount };
    });

    return (
      <div key={index} className="stu-card" draggable onDragStart={event => {
          event.dataTransfer.setData("text/plain", String(index));
          event.dataTransfer.effectAllowed = "move";
        }} onClick={() => onSelectStudent(index)} style={{
          borderColor: accMissing || redGoalCount > 0 ? "var(--red)" : yellowGoalCount > 0 ? "var(--yellow)" : p.border,
          background: theme.card,
          boxShadow: `0 10px 25px ${theme.shadow}`,
          borderWidth: 2,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${p.chip},${p.chip}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{getStudentEmoji(student)}</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.name}</div>
            <div style={{ fontSize: 11, color: theme.subtle, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>{student.charts.length} goal{student.charts.length !== 1 ? "s" : ""}</span>
              {redGoalCount > 0 && <span style={{ color: "var(--red)", fontWeight: 800 }}>🔴 {redGoalCount} behind pace</span>}
              {redGoalCount === 0 && yellowGoalCount > 0 && <span style={{ color: "#9a6a00", fontWeight: 800 }}>🟡 {yellowGoalCount} behind pace</span>}
            </div>
          </div>
          {accDone ? (
            <span title="Accommodations logged today" style={{ fontSize: 16 }}>✅</span>
          ) : accMissing ? (
            <span title="Accommodations not logged today" style={{ fontSize: 16 }}>⚠️</span>
          ) : null}
        </div>

        {accMissing && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(255,107,107,0.12)", border: "1.5px solid rgba(255,107,107,0.4)", fontSize: 11, fontWeight: 700, color: "#c0392b" }}>
            <span>⚠️</span><span>Accommodations not logged today</span>
          </div>
        )}

        {student.charts.map((c, ci) => {
          const { cPts, cLatest, level, diff, onTrackValue, streakCount } = goalStatuses[ci];
          if (!cLatest) return null;
          const goalPct = c.goalValue ? Math.round((cLatest.y / c.goalValue) * 100) : null;
          const levelColor = level === "red" ? "var(--red)" : level === "yellow" ? "var(--yellow)" : null;
          const levelBg = level === "red" ? "rgba(255,107,107,0.10)" : level === "yellow" ? "rgba(255,209,102,0.16)" : theme.softPanel;
          return (
            <div key={ci} onClick={event => { event.stopPropagation(); onSelectStudent(index, ci); }} style={{ background: levelBg, borderRadius: 8, padding: "8px 10px", border: `1.5px solid ${levelColor ? levelColor : p.border + "44"}`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                  {level && <span title={level === "red" ? `Below target for ${streakCount} entries in a row` : "Newly below target"}>{level === "red" ? "🔴" : "🟡"}</span>}
                  {c.name}
                </span>
                <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 14, color: levelColor || p.chip, flexShrink: 0, marginLeft: 6 }}>{cLatest.y}%</span>
              </div>
              {onTrackValue != null && (
                <div style={{ fontSize: 10, color: levelColor || theme.subtle, marginBottom: 4 }}>
                  {level === "red" && `Target ${Math.round(onTrackValue * 10) / 10}% by ${cLatest.x} — below target ${streakCount} entries in a row`}
                  {level === "yellow" && `Target ${Math.round(onTrackValue * 10) / 10}% by ${cLatest.x} — newly below target`}
                  {!level && `On pace · target was ${Math.round(onTrackValue * 10) / 10}% as of ${cLatest.x}`}
                </div>
              )}
              <Sparkline data={cPts} color={p.chip} />
              {goalPct !== null && (
                <div style={{ marginTop: 5, height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(goalPct, 100)}%`, height: "100%", background: levelColor || p.chip, borderRadius: 99, transition: "width .4s ease" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "24px 28px", background: theme.page, color: theme.text, transition: "all .2s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 22, color: theme.text }}>👋 {greeting}!</div>
          <div style={{ fontSize: 13, color: theme.subtle, marginTop: 2 }}>Here’s your class at a glance.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 999, background: theme.panel, border: `1.5px solid ${theme.border}`, boxShadow: `0 6px 18px ${theme.shadow}` }}>
            <span style={{ fontSize: 12 }}>🎨</span>
            <select value={theme.key} onChange={event => setTheme(event.target.value)} style={{ background: "transparent", border: "none", color: theme.text, minWidth: 82, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              <option value="sunrise">Sunrise</option>
              <option value="studio">Studio</option>
              <option value="night">Night</option>
            </select>
          </div>
          <button className="ghost-btn" onClick={onOpenBulkReport} style={{ background: theme.panel, color: theme.text, borderColor: theme.border }}>🖨 Print All Reports</button>
          <button className="action-btn" onClick={onOpenGroupModal} style={{ background: theme.accent, color: theme.accentText }}>+ Add Group</button>
          <button className="action-btn" onClick={onAddStudent} style={{ background: theme.primary, color: "#fff" }}>+ Add Student</button>
        </div>
      </div>



      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", minWidth: 220, flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔎</span>
          <input
            type="text"
            value={homeSearch}
            onChange={event => setHomeSearch(event.target.value)}
            placeholder="Search student or accommodation…"
            style={{ paddingLeft: 36, background: theme.panel, borderColor: theme.border, color: theme.text }}
          />
        </div>

        <select value={homeAccommodation} onChange={event => setHomeAccommodation(event.target.value)} style={{ minWidth: 180, background: theme.panel, borderColor: theme.border, color: theme.text }}>
          <option value="">All accommodations</option>
          {allAccommodations.map(acc => (
            <option key={acc} value={acc}>{acc}</option>
          ))}
        </select>

        <select value={homeGroupFilter} onChange={event => setHomeGroupFilter(event.target.value)} style={{ minWidth: 160, background: theme.panel, borderColor: theme.border, color: theme.text }}>
          <option value="all">All groups</option>
          <option value="ungrouped">Ungrouped</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      {sets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: theme.subtle }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎒</div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, marginBottom: 8, color: theme.text }}>No students yet</div>
          <button className="action-btn" onClick={onAddStudent} style={{ background: theme.primary, color: "#fff", marginTop: 8 }}>+ Add Your First Student</button>
        </div>
      ) : orderedStudents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: theme.subtle }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔎</div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, color: theme.text }}>No students match that filter</div>
        </div>
      ) : (
        <>
          {homeGroupFilter === "all" && !homeAccommodation && !homeSearch.trim() ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {groupSections.map(section => (
                <div
                  key={section.id}
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    const draggedIndex = Number(event.dataTransfer.getData("text/plain"));
                    if (!Number.isNaN(draggedIndex)) onUpdateStudentGroup(draggedIndex, section.id === "ungrouped" ? "" : section.id);
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: 12, background: theme.softPanel, borderRadius: 16, padding: 12, border: `1.5px dashed ${theme.border}` }}
                >
                  <div
                    onClick={() => setDashboardGroupCollapsed(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                    style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer", color: theme.text }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{section.name}</span>
                      <span style={{ fontSize: 12, color: theme.subtle, fontWeight: 700 }}>({section.students.length})</span>
                    </div>
                    <span style={{ fontSize: 13, color: theme.subtle }}>{dashboardGroupCollapsed[section.id] ? "▸" : "▾"}</span>
                  </div>
                  {!dashboardGroupCollapsed[section.id] && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                      {section.students.length > 0 ? section.students.map(student => renderStudentCard(student, sets.indexOf(student))) : (
                        <div style={{ padding: "18px 12px", border: `2px dashed ${theme.border}`, borderRadius: 12, color: theme.subtle, fontSize: 13, background: theme.panel }}>
                          Drop a student here to place them in {section.name}.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
              {orderedStudents.map(student => renderStudentCard(student, sets.indexOf(student)))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;

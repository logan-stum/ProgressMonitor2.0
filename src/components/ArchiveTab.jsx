import { useEffect, useState } from "react";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
}[character]));

const formatArchiveDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
};

const sectionLabels = {
  overview: "Overview",
  goals: "Goals",
  accommodations: "Accommodations",
  minutes: "Minutes",
  attendance: "Attendance",
  testing: "Testing",
};

function archiveSectionMarkup(snapshot, section, selectedGoalIndex = null) {
  const charts = Array.isArray(snapshot.charts) ? snapshot.charts : [];
  const accommodations = Array.isArray(snapshot.accommodations) ? snapshot.accommodations : [];
  const accommodationNames = Object.fromEntries(accommodations.map(item => [String(item.id), item.name]));
  const accDays = snapshot.accDays && typeof snapshot.accDays === "object" ? snapshot.accDays : {};
  const minutes = Array.isArray(snapshot.minutes) ? snapshot.minutes : [];
  const plainMinutes = minutes.filter(entry => entry.kind !== "attendance");
  const attendance = minutes.filter(entry => entry.kind === "attendance");
  const testing = Array.isArray(snapshot.testing) ? snapshot.testing : [];
  const goalList = selectedGoalIndex == null ? charts : [charts[selectedGoalIndex]].filter(Boolean);
  const goalMarkup = goalList.map((chart, index) => `
    <section class="block">
      <h2>${escapeHtml(chart.name || `Goal ${index + 1}`)}</h2>
      ${chart.chartImage ? `<img class="chart" src="${chart.chartImage}" alt="${escapeHtml(chart.name)} progress graph" style="display:block;width:100%;max-width:900px;height:auto;margin:12px 0;border:1px solid #e7e1d8;border-radius:8px;" />` : ""}
      <p>${Array.isArray(chart.data) ? chart.data.length : 0} progress entries</p>
      ${chart.notes ? `<p><strong>Goal notes:</strong> ${escapeHtml(chart.notes)}</p>` : ""}
      <ul>${(chart.data ?? []).map(point => `<li>${escapeHtml(point.x)}: ${escapeHtml(point.y)}%</li>`).join("")}</ul>
    </section>
  `).join("");
  const accMarkup = `
    <section class="block"><h2>Accommodation setup</h2>
      ${accommodations.length ? `<ul>${accommodations.map(item => `<li>${escapeHtml(item.name)}</li>`).join("")}</ul>` : "<p>None recorded.</p>"}
    </section>
    <section class="block"><h2>Accommodation log</h2>
      ${Object.entries(accDays).length ? Object.entries(accDays).sort(([a], [b]) => a.localeCompare(b)).map(([date, record]) => `<div class="row"><strong>${escapeHtml(date)}</strong> ${escapeHtml(Object.entries(record).filter(([key]) => !key.startsWith("_")).map(([key, value]) => `${accommodationNames[String(key)] || key}: ${value}`).join(" · "))}${record._note ? `<br /><em>${escapeHtml(record._note)}</em>` : ""}</div>`).join("") : "<p>No accommodation days recorded.</p>"}
    </section>`;
  const minuteMarkup = plainMinutes.length ? plainMinutes.map(entry => `<div class="row"><strong>${escapeHtml(entry.label || "Other")}</strong> ${escapeHtml(entry.amount)} minutes</div>`).join("") : "<p>No minutes recorded.</p>";
  const attendanceMarkup = attendance.length ? attendance.map(entry => `<div class="row"><strong>${escapeHtml(entry.date || "Undated")}</strong> ${escapeHtml(entry.groupName || "Attendance")} · ${escapeHtml(entry.status)}${entry.start ? ` · ${escapeHtml(entry.start)}${entry.stop ? `–${escapeHtml(entry.stop)}` : ""}` : ""}${entry.lateReason ? ` · ${escapeHtml(entry.lateReason)}` : ""}${entry.sessionNote ? `<br /><em>${escapeHtml(entry.sessionNote)}</em>` : ""}</div>`).join("") : "<p>No attendance records recorded.</p>";
  const testingMarkup = testing.length ? testing.map(entry => `<div class="row"><strong>${escapeHtml(entry.name)}</strong> ${Object.entries(entry.scores ?? {}).map(([season, score]) => `${escapeHtml(season)}: ${escapeHtml(score)}`).join(" · ")}</div>`).join("") : "<p>No testing entries recorded.</p>";
  const overviewMarkup = `<section class="block"><h2>Period overview</h2><p>${charts.length} goals · ${accommodations.length} accommodations · ${plainMinutes.length} minute entries · ${attendance.length} attendance entries · ${testing.length} testing entries</p></section>`;
  if (section === "goals") return goalMarkup || "<p>No goals recorded.</p>";
  if (section === "accommodations") return accMarkup;
  if (section === "minutes") return `<section class="block"><h2>Minutes</h2>${minuteMarkup}</section>`;
  if (section === "attendance") return `<section class="block"><h2>Attendance</h2>${attendanceMarkup}</section>`;
  if (section === "testing") return `<section class="block"><h2>Testing</h2>${testingMarkup}</section>`;
  return overviewMarkup + goalMarkup + accMarkup + `<section class="block"><h2>Minutes</h2>${minuteMarkup}</section><section class="block"><h2>Attendance</h2>${attendanceMarkup}</section><section class="block"><h2>Testing</h2>${testingMarkup}</section>`;
}

function ArchiveTab({ student, theme, pal, onRenderChart, onPrint }) {
  const archives = Array.isArray(student?.archives) ? student.archives : [];
  const [selectedId, setSelectedId] = useState(archives[archives.length - 1]?.id ?? null);
  const [selectedNode, setSelectedNode] = useState("overview");
  const [expandedPeriods, setExpandedPeriods] = useState(() => new Set(archives.length ? [archives[archives.length - 1].id] : []));
  const [expandedGoals, setExpandedGoals] = useState(() => new Set(archives.length ? [archives[archives.length - 1].id] : []));
  const [generatedChartImages, setGeneratedChartImages] = useState({});
  const [treeOpen, setTreeOpen] = useState(true);
  const selected = archives.find(archive => archive.id === selectedId) ?? null;
  const snapshot = selected?.snapshot ?? {};
  const charts = Array.isArray(snapshot.charts) ? snapshot.charts : [];
  const minutes = Array.isArray(snapshot.minutes) ? snapshot.minutes : [];
  const attendance = minutes.filter(entry => entry.kind === "attendance");
  const displaySnapshot = {
    ...snapshot,
    charts: charts.map((chart, index) => ({ ...chart, chartImage: chart.chartImage || generatedChartImages[index] })),
  };

  useEffect(() => {
    if (selected && !expandedPeriods.has(selected.id)) setExpandedPeriods(previous => new Set([...previous, selected.id]));
  }, [selected, expandedPeriods]);

  useEffect(() => {
    let cancelled = false;
    setGeneratedChartImages({});
    if (!onRenderChart || !charts.some(chart => !chart.chartImage)) return undefined;
    Promise.all(charts.map((chart, index) => chart.chartImage ? Promise.resolve([index, chart.chartImage]) : onRenderChart(chart, pal).then(image => [index, image])))
      .then(entries => {
        if (cancelled) return;
        setGeneratedChartImages(Object.fromEntries(entries.filter(([, image]) => image)));
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  const selectPeriod = archive => {
    setSelectedId(archive.id);
    setSelectedNode("overview");
    setExpandedPeriods(previous => new Set([...previous, archive.id]));
  };
  const selectGoal = index => setSelectedNode(`goal:${index}`);
  const nodeParts = selectedNode.split(":");
  const section = nodeParts[0] === "goal" ? "goals" : nodeParts[0];
  const goalIndex = nodeParts[0] === "goal" ? Number(nodeParts[1]) : null;
  const printSection = sectionName => onPrint(archiveSectionMarkup(displaySnapshot, sectionName, sectionName === "goals" && goalIndex != null ? goalIndex : null), `${student.name} - ${sectionLabels[sectionName]} - Period ${archives.indexOf(selected) + 1}`);

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16, color: theme.text }}>
      <style>{`.archive-tree-button{display:flex!important;width:100%;box-sizing:border-box;align-items:flex-start;text-align:left;white-space:normal}.archive-tree-children{display:flex;flex-direction:column;width:100%;box-sizing:border-box}.archive-view-content .block{border:1px solid ${theme.border};border-radius:10px;background:${theme.softPanel};padding:12px 14px;box-sizing:border-box}.archive-view-content h2{font-family:var(--font-head);font-size:15px;margin:0 0 8px;color:${theme.text}}.archive-view-content p{font-size:12px;line-height:1.55;margin:6px 0;color:${theme.text}}.archive-view-content ul{margin:6px 0 0;padding-left:20px}.archive-view-content li{font-size:12px;line-height:1.55;margin:2px 0}.archive-view-content .row{border-bottom:1px solid ${theme.border};padding:8px 0;font-size:12px;line-height:1.55}.archive-view-content .row:last-child{border-bottom:0}.archive-view-content .row strong{margin-right:6px}.archive-view-content .chart{background:#fff}`}</style>
      <div>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 18 }}>🗄 Archive History</div>
        <div style={{ fontSize: 12, color: theme.subtle, marginTop: 2 }}>Read-only records organized by period and section.</div>
      </div>
      {archives.length === 0 ? (
        <div style={{ padding: "36px 20px", textAlign: "center", color: theme.subtle, background: theme.card, border: `1.5px dashed ${theme.border}`, borderRadius: 12 }}>No archived progress yet.</div>
      ) : (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          {treeOpen && <nav aria-label="Archived progress" style={{ flex: "0 1 250px", minWidth: 220, display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="ghost-btn" onClick={() => setTreeOpen(false)} title="Hide archive tree" aria-label="Hide archive tree" style={{ alignSelf: "flex-start", color: theme.text, borderColor: theme.border, background: theme.card, padding: "5px 9px", fontSize: 16 }}>☰ <span style={{ fontSize: 11, verticalAlign: "middle" }}>Periods</span></button>
            {archives.map((archive, archiveIndex) => {
              const expanded = expandedPeriods.has(archive.id);
              return <div key={archive.id} style={{ borderLeft: `2px solid ${selectedId === archive.id ? theme.primary : theme.border}`, paddingLeft: 8 }}>
                <button className="ghost-btn archive-tree-button" onClick={() => { selectPeriod(archive); setExpandedPeriods(previous => { const next = new Set(previous); if (expanded) next.delete(archive.id); else next.add(archive.id); return next; }); }} style={{ justifyContent: "flex-start", color: theme.text, borderColor: selectedId === archive.id ? theme.primary : theme.border, background: selectedId === archive.id ? theme.softPanel : theme.card }}>
                  <span>{expanded ? "▾" : "▸"} <strong>Period {archiveIndex + 1}</strong><br /><small style={{ marginLeft: 18, color: theme.subtle }}>{formatArchiveDate(archive.archivedAt)}</small></span>
                </button>
                {expanded && <div className="archive-tree-children" style={{ gap: 3, padding: "5px 0 5px 14px" }}>
                  {Object.entries(sectionLabels).map(([key, label]) => key === "goals" ? (
                    <div key={key}>
                      <button className="ghost-btn archive-tree-button" onClick={() => { setSelectedId(archive.id); setSelectedNode("goals"); setExpandedGoals(previous => { const next = new Set(previous); if (next.has(archive.id)) next.delete(archive.id); else next.add(archive.id); return next; }); }} style={{ justifyContent: "flex-start", color: selectedId === archive.id && section === key && goalIndex == null ? theme.primary : theme.subtle, border: "none", padding: "5px 7px", fontSize: 12 }}>• {expandedGoals.has(archive.id) ? "▾" : "▸"} {label}</button>
                      {expandedGoals.has(archive.id) && <div className="archive-tree-children">{charts.map((chart, index) => <button key={`${archive.id}-${index}`} className="ghost-btn archive-tree-button" onClick={() => { setSelectedId(archive.id); selectGoal(index); }} style={{ justifyContent: "flex-start", color: selectedId === archive.id && goalIndex === index ? theme.primary : theme.subtle, border: "none", padding: "5px 7px 5px 23px", fontSize: 12 }}>↳ {chart.name || `Goal ${index + 1}`}</button>)}</div>}
                    </div>
                  ) : <button key={key} className="ghost-btn archive-tree-button" onClick={() => { setSelectedId(archive.id); setSelectedNode(key); }} style={{ justifyContent: "flex-start", color: selectedId === archive.id && section === key ? theme.primary : theme.subtle, border: "none", padding: "5px 7px", fontSize: 12 }}>• {label}</button>)}
                </div>}
              </div>;
            })}
          </nav>}

          {!treeOpen && <div style={{ flex: "0 0 auto" }}><button className="ghost-btn" onClick={() => setTreeOpen(true)} title="Show archive tree" aria-label="Show archive tree" style={{ color: theme.text, borderColor: theme.border, background: theme.card, padding: "5px 9px", fontSize: 16 }}>☰ <span style={{ fontSize: 11, verticalAlign: "middle" }}>Periods</span></button></div>}
          {selected && <main style={{ flex: "1 1 520px", minWidth: 0, background: theme.card, border: `1.5px solid ${theme.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 17 }}>Period {archives.indexOf(selected) + 1} · {sectionLabels[section]}</div><div style={{ fontSize: 11, color: theme.subtle }}>{formatArchiveDate(selected.archivedAt)}</div></div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><button className="ghost-btn" onClick={() => printSection(section)} style={{ color: theme.text, borderColor: theme.border }}>🖨 Print section</button><button className="action-btn" onClick={() => onPrint(archiveSectionMarkup(displaySnapshot, "overview"), `${student.name} - Complete Archive - Period ${archives.indexOf(selected) + 1}`)} style={{ background: theme.primary, color: "#fff" }}>🖨 Print entire period</button></div>
            </div>
            {section === "attendance" && <div style={{ fontSize: 12, color: theme.subtle }}>{attendance.length} attendance records</div>}
            <div className="archive-view-content" style={{ display: "flex", flexDirection: "column", gap: 10 }} dangerouslySetInnerHTML={{ __html: archiveSectionMarkup(displaySnapshot, section, goalIndex) }} />
            <details><summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 12 }}>View complete archived data</summary><pre style={{ whiteSpace: "pre-wrap", overflow: "auto", maxHeight: 360, margin: "10px 0 0", padding: 10, background: theme.softPanel, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 11 }}>{JSON.stringify(snapshot, null, 2)}</pre></details>
          </main>}
        </div>
      )}
    </div>
  );
}

export { archiveSectionMarkup };
export default ArchiveTab;

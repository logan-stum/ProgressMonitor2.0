import { useState, useRef, useEffect } from "react";
import "chartjs-adapter-date-fns";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, TimeScale, Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

import "./styles/globalStyles.js";
import { DEFAULT_MINUTE_OPTIONS, ATTENDANCE_STATUS, STATUS_CONFIG, MONTHS } from "./constants.js";
import {
  getPal, getEmoji, getStudentEmoji, normalizeStudentAttachments, ensureStudentId, formatTime,
  parseLocationHash, buildLocationHash, escapeHtml,
} from "./utils.js";
import SectionLabel from "./components/SectionLabel.jsx";
import Modal from "./components/Modal.jsx";
import EmojiPickerModal from "./components/EmojiPickerModal.jsx";
import GuideModal from "./components/GuideModal.jsx";
import Dashboard from "./components/Dashboard.jsx";
import GoalsTab from "./components/GoalsTab.jsx";
import AccommodationsTab from "./components/AccommodationsTab.jsx";
import MinutesTab from "./components/MinutesTab.jsx";
import ReportModal from "./components/ReportModal.jsx";
import AttendanceGroupsModal from "./components/AttendanceGroupsModal.jsx";
import TakeAttendanceModal from "./components/TakeAttendanceModal.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler, zoomPlugin);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App(){
  const [sets,setSets]=useState(()=>{
    try{
      const s=localStorage.getItem("pm_v2");
      const parsed = s ? JSON.parse(s) : [{name:"Alex Johnson",collapsed:false,accommodations:[],accDays:{},minutes:[],accommodationAttachments:[],
        charts:[{name:"Reading Fluency",startValue:40,startDate:"",goalValue:90,goalDate:"",data:[],notes:"",attachments:[]}]}];
      return Array.isArray(parsed) ? parsed.map(student => ensureStudentId(normalizeStudentAttachments({
        ...student,
        accommodations: Array.isArray(student.accommodations) ? student.accommodations : [],
        accDays: student.accDays ?? {},
        minutes: Array.isArray(student.minutes) ? student.minutes : [],
        charts: Array.isArray(student.charts) ? student.charts : [],
      }))) : [];
    } catch { return []; }
  });

  const [themeKey, setThemeKey] = useState(() => {
    try {
      const raw = localStorage.getItem("pm_dashboard_theme");
      return raw ? JSON.parse(raw) : "sunrise";
    } catch {
      return "sunrise";
    }
  });
  const dashboardThemes = {
    sunrise: {
      key: "sunrise",
      page: "linear-gradient(135deg, #fffaf1 0%, #f4fbff 100%)",
      panel: "rgba(255,255,255,0.72)",
      card: "rgba(255,255,255,0.8)",
      softPanel: "#fffaf2",
      border: "#f4dca6",
      primary: "#26c6b0",
      accent: "#ffd166",
      accentText: "#2d2d3a",
      text: "#2d2d3a",
      subtle: "#5f6478",
      shadow: "rgba(45,45,58,0.10)",
    },
    studio: {
      key: "studio",
      page: "linear-gradient(135deg, #f4f1ff 0%, #ecfbff 100%)",
      panel: "rgba(255,255,255,0.72)",
      card: "rgba(255,255,255,0.82)",
      softPanel: "#f4f1ff",
      border: "#d8ccff",
      primary: "#7c6ef8",
      accent: "#9ed8ff",
      accentText: "#2d2d3a",
      text: "#2d2d3a",
      subtle: "#5d5f77",
      shadow: "rgba(76,60,120,0.10)",
    },
    night: {
      key: "night",
      page: "linear-gradient(135deg, #171d2f 0%, #252f46 100%)",
      panel: "rgba(20,28,42,0.72)",
      card: "rgba(25,33,49,0.88)",
      softPanel: "rgba(39,48,68,0.9)",
      border: "rgba(140,167,216,0.30)",
      primary: "#7ad7d3",
      accent: "#ffd166",
      accentText: "#132238",
      text: "#eef5ff",
      subtle: "rgba(238,245,255,0.75)",
      shadow: "rgba(10,14,24,0.32)",
    },
  };
  const theme = dashboardThemes[themeKey] ?? dashboardThemes.sunrise;
  const initialRoute = parseLocationHash();
  const [view,setView]=useState(initialRoute.view); // "dashboard" | "student"
  const [selSet,setSelSet]=useState(()=>Math.min(Math.max(initialRoute.selSet,0), Math.max(sets.length-1,0)));
  const [selChart,setSelChart]=useState(initialRoute.selChart);
  const [activeTab,setActiveTab]=useState(initialRoute.activeTab);
  const [history,setHistory]=useState([]);

  // Keep the URL hash in sync with navigation, and respond to back/forward.
  // Every navigation-relevant change — dashboard <-> student, switching students, switching tabs
  // (Goals/Accommodations/Minutes), or switching goals — pushes a new history entry, so the back
  // button retraces each step (goal 2 -> back -> goal 1, accommodations -> back -> goals, etc).
  const isPoppingRef = useRef(false);
  useEffect(() => {
    const onPop = () => {
      const r = parseLocationHash();
      isPoppingRef.current = true;
      setView(r.view);
      setSelSet(v => Math.min(Math.max(r.selSet,0), Math.max(sets.length-1,0)));
      setActiveTab(r.activeTab);
      setSelChart(r.selChart);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [sets.length]);
  useEffect(() => {
    if (isPoppingRef.current) { isPoppingRef.current = false; return; }
    const hash = buildLocationHash(view, selSet, activeTab, selChart);
    if (window.location.hash === hash) return;
    window.history.pushState(null, "", hash);
  }, [view, selSet, activeTab, selChart]);

  const [editPt,setEditPt]=useState(null);
  const [showAtt,setShowAtt]=useState(false);
  const [showAS,setShowAS]=useState(false);
  const [showAG,setShowAG]=useState(false);
  const [showReport,setShowReport]=useState(false);
  const [bulkReportOpen,setBulkReportOpen]=useState(false);
  const [bulkSelectedStudentIds,setBulkSelectedStudentIds]=useState([]);
  const [showGuide,setShowGuide]=useState(false);
  const [showMinuteOptions,setShowMinuteOptions]=useState(false);
  const [confirmDialog,setConfirmDialog]=useState(null);
  const [renameTarget,setRenameTarget]=useState(null);
  const [renameValue,setRenameValue]=useState("");
  const [renameEmoji,setRenameEmoji]=useState("");
  const [newSName,setNewSName]=useState("");
  const [newSEmoji,setNewSEmoji]=useState("");
  const [showGroupModal,setShowGroupModal]=useState(false);
  const [newGroupName,setNewGroupName]=useState("");
  const [sidebarGroupCollapsed,setSidebarGroupCollapsed]=useState({});
  const [sidebarControlsCollapsed,setSidebarControlsCollapsed]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  const [emojiTarget,setEmojiTarget]=useState(null);
  const [newGName,setNewGName]=useState("");
  const [newMinuteOption,setNewMinuteOption]=useState("");
  const [showQL,setShowQL]=useState(false); // global quick log
  const [homeSearch,setHomeSearch]=useState("");
  const [homeAccommodation,setHomeAccommodation]=useState("");
  const [homeGroupFilter,setHomeGroupFilter]=useState("all");
  const [groups,setGroups]=useState(()=>{
    try{
      const s=localStorage.getItem("pm_groups");
      return s?JSON.parse(s):[];
    }catch{return [];}
  });
  // Attendance-tracking groups are intentionally separate from the dashboard "groups" above —
  // a student's membership here (by stable sid) never touches their dashboard groupId.
  const [attendanceGroups,setAttendanceGroups]=useState(()=>{
    try{
      const s=localStorage.getItem("pm_attendance_groups");
      return s?JSON.parse(s):[];
    }catch{return [];}
  });
  const [showAttGroups,setShowAttGroups]=useState(false);
  const [showTakeAttendance,setShowTakeAttendance]=useState(false);
  const [minuteOptions,setMinuteOptions]=useState(()=>{
    try{
      const s=localStorage.getItem("pm_minute_options");
      return s?JSON.parse(s):DEFAULT_MINUTE_OPTIONS;
    }catch{return DEFAULT_MINUTE_OPTIONS;}
  });
  const chartRef=useRef(null);
  const isValidDateValue = value => {
    if (!value || typeof value !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };

  const student=sets[selSet];
  const chart=student?.charts?.[selChart]??null;
  const pal=getPal(selSet);
  const allStudentIds = sets.map((_, idx) => idx);

  // Attachments are scoped per-goal (chart.attachments), except on the Accommodations tab,
  // which has its own separate pool (student.accommodationAttachments). Whichever tab is active
  // decides which pool the Files button/modal reads from and writes to.
  const attachmentsScope = activeTab === "accommodations" ? "accommodations" : "goal";
  const activeAttachments = attachmentsScope === "accommodations"
    ? (student?.accommodationAttachments ?? [])
    : (chart?.attachments ?? []);
  const addActiveAttachment = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const entry = { name: file.name, type: file.type, size: file.size, content: ev.target.result.split(",")[1] };
      upd(d => {
        if (attachmentsScope === "accommodations") {
          if (!Array.isArray(d[selSet].accommodationAttachments)) d[selSet].accommodationAttachments = [];
          d[selSet].accommodationAttachments.push(entry);
        } else {
          const c = d[selSet].charts[selChart];
          if (!c) return;
          if (!Array.isArray(c.attachments)) c.attachments = [];
          c.attachments.push(entry);
        }
      });
    };
    reader.readAsDataURL(file);
  };
  const removeActiveAttachment = index => {
    upd(d => {
      if (attachmentsScope === "accommodations") {
        d[selSet].accommodationAttachments = (d[selSet].accommodationAttachments ?? []).filter((_, j) => j !== index);
      } else {
        const c = d[selSet].charts[selChart];
        if (!c) return;
        c.attachments = (c.attachments ?? []).filter((_, j) => j !== index);
      }
    });
  };

  const openBulkReport = () => {
    setBulkSelectedStudentIds(allStudentIds);
    setBulkReportOpen(true);
  };

  const toggleBulkStudent = studentIndex => {
    setBulkSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentIndex)) next.delete(studentIndex);
      else next.add(studentIndex);
      return [...next];
    });
  };

  const toggleBulkGroup = groupId => {
    const studentIndexes = sets
      .map((student, idx) => (groupId === "ungrouped"
        ? (!student.groupId || !groups.some(group => group.id === student.groupId) ? idx : null)
        : student.groupId === groupId ? idx : null))
      .filter(index => index !== null);

    setBulkSelectedStudentIds(prev => {
      const next = new Set(prev);
      const allSelected = studentIndexes.length > 0 && studentIndexes.every(index => next.has(index));
      if (allSelected) {
        studentIndexes.forEach(index => next.delete(index));
      } else {
        studentIndexes.forEach(index => next.add(index));
      }
      return [...next];
    });
  };

  const selectAllBulkStudents = () => setBulkSelectedStudentIds(allStudentIds);
  const clearBulkStudents = () => setBulkSelectedStudentIds([]);

  useEffect(()=>{localStorage.setItem("pm_v2",JSON.stringify(sets));},[sets]);
  useEffect(()=>{localStorage.setItem("pm_minute_options",JSON.stringify(minuteOptions));},[minuteOptions]);
  useEffect(()=>{localStorage.setItem("pm_groups",JSON.stringify(groups));},[groups]);
  useEffect(()=>{localStorage.setItem("pm_attendance_groups",JSON.stringify(attendanceGroups));},[attendanceGroups]);
  useEffect(()=>{localStorage.setItem("pm_dashboard_theme", JSON.stringify(themeKey));},[themeKey]);

  const snap=()=>setHistory(h=>{const n=[...h,JSON.stringify(sets)];if(n.length>20)n.shift();return n;});
  const undo=()=>{if(!history.length)return;setHistory(h=>h.slice(0,-1));setSets(JSON.parse(history[history.length-1]));};
  const upd=fn=>setSets(prev=>{const next=JSON.parse(JSON.stringify(prev));fn(next);return next;});
  const requestConfirm=({title,message,confirmLabel="Confirm",onConfirm,danger=false})=>{
    setConfirmDialog({title,message,confirmLabel,onConfirm,danger});
  };

  const addStudent=()=>{
    if(!newSName.trim()) return;
    const name = newSName.trim();
    const emoji = (newSEmoji.trim() || getStudentEmoji({ name })).slice(0, 2);
    upd(d => d.push(ensureStudentId({ name, emoji, groupId: "", collapsed: false, accommodations: [], accDays: {}, minutes: [], accommodationAttachments: [], charts: [] })));
    setSelSet(sets.length);setSelChart(0);setActiveTab("goals");setView("student");setNewSName("");setNewSEmoji("");setShowAS(false);
  };
  const addGoal=()=>{
    if(!newGName.trim()) return;
    upd(d=>d[selSet].charts.push({name:newGName.trim(),startValue:0,startDate:"",goalValue:100,goalDate:"",data:[],notes:"",quarters:[],attachments:[]}));
    setSelChart(student.charts.length);setNewGName("");setShowAG(false);
  };
  const addGroup=()=>{
    const label = newGroupName.trim();
    if(!label) return;
    setGroups(prev => [...prev, { id: `group-${Date.now()}-${Math.random().toString(16).slice(2,8)}`, name: label }]);
    setNewGroupName("");
    setShowGroupModal(false);
  };
  const updateStudentGroup=(studentIndex, groupId)=>{
    upd(d => {
      if (!d[studentIndex]) return;
      d[studentIndex].groupId = groupId || "";
    });
  };
  const reorderGroups=(draggedId,targetId)=>{
    if (!draggedId || !targetId || draggedId === targetId) return;
    setGroups(prev => {
      const next = [...prev];
      const from = next.findIndex(group => group.id === draggedId);
      const to = next.findIndex(group => group.id === targetId);
      if (from === -1 || to === -1) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const renameGroup=(groupId, nextName)=>{
    const label = nextName.trim();
    if (!label) return;
    setGroups(prev => prev.map(group => group.id === groupId ? { ...group, name: label } : group));
  };
  const deleteGroup=(groupId)=>{
    setGroups(prev => prev.filter(group => group.id !== groupId));
    upd(d => d.forEach(student => {
      if (student.groupId === groupId) student.groupId = "";
    }));
  };

  // ─── Attendance groups ────────────────────────────────────────────────────
  const saveAttendanceGroup=({id, name, times, studentIds})=>{
    if (id) {
      setAttendanceGroups(prev => prev.map(g => g.id === id ? { ...g, name, times, studentIds } : g));
    } else {
      setAttendanceGroups(prev => [...prev, { id: `attgrp-${Date.now()}-${Math.random().toString(16).slice(2,8)}`, name, times, studentIds }]);
    }
  };
  const deleteAttendanceGroup=(id)=>{
    setAttendanceGroups(prev => prev.filter(g => g.id !== id));
  };
  // Logs one minutes-tab entry per student in the group for this attendance-taking session.
  // These are tagged kind:"attendance" so MinutesTab can show/print them separately from the
  // plain running-total minute categories, which have no date and get replaced on re-entry.
  const submitAttendance=(group, date, entries)=>{
    snap();
    upd(d => {
      entries.forEach(({sid, status, start, stop, sessionNote, lateReason}) => {
        const idx = d.findIndex(s => s.sid === sid);
        if (idx === -1) return;
        if (!Array.isArray(d[idx].minutes)) d[idx].minutes = [];
        d[idx].minutes.push({
          id: `att-${Date.now()}-${Math.random().toString(16).slice(2,8)}-${sid}`,
          kind: "attendance",
          date,
          groupId: group.id,
          groupName: group.name,
          status,
          start: start || null,
          stop: stop || null,
          sessionNote: sessionNote || null,
          lateReason: lateReason || null,
        });
      });
    });
  };
  const printAttendanceLog=(attStudent, entries, groupFilter)=>{
    if (!attStudent || !entries?.length) return;
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const rows = entries.map(e => {
      const cfg = ATTENDANCE_STATUS[e.status] ?? ATTENDANCE_STATUS.attended;
      const timeLabel = e.start ? ` (${formatTime(e.start)}${e.stop ? `–${formatTime(e.stop)}` : ""})` : "";
      const notesHtml = [
        e.status === "late" && e.lateReason ? `Late reason: ${escapeHtml(e.lateReason)}` : null,
        e.sessionNote ? `Session note: ${escapeHtml(e.sessionNote)}` : null,
      ].filter(Boolean).join(" · ");
      return `
        <div class="quarter-row" style="flex-direction:column;align-items:flex-start;gap:2px">
          <div style="display:flex;justify-content:space-between;width:100%">
            <span class="quarter-date">${escapeHtml(e.date)} — ${escapeHtml(e.groupName)}${timeLabel}</span>
            <span class="quarter-avg" style="color:${cfg.color}">${cfg.icon} ${cfg.label}</span>
          </div>
          ${notesHtml ? `<div style="font-size:11px;color:#6b6b7d">${notesHtml}</div>` : ""}
        </div>
      `;
    }).join("");
    const html = `
      <div class="report-page">
        <div class="report">
          <div class="report-header">
            <div>
              <div class="report-name">${escapeHtml(attStudent.name)}</div>
              <div class="report-meta">Attendance Log${groupFilter && groupFilter !== "all" ? ` — ${escapeHtml(groupFilter)}` : ""} · Generated ${today}</div>
            </div>
            <span class="badge"></span>
          </div>
          <div class="quarter-summary">
            <div class="quarter-summary-title">Attendance</div>
            ${rows}
          </div>
          <div class="footer"><span>Progress Monitor</span><span>${today}</span></div>
        </div>
      </div>
    `;
    printHtmlDocument(html, `Attendance Log - ${attStudent.name}`);
  };
  const printAccommodationsCalendar=(calStudent, fromDate, toDate, accList, accDays)=>{
    if (!calStudent || !fromDate || !toDate) return;
    const start = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T00:00:00");
    if (start > end) return;
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Tally totals across the range for a summary strip up top — replaces the calendar grid,
    // which only showed color dots with no real information a reader could act on.
    const totals = { given:0, refused:0, not_given:0, absent:0, na:0 };
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayRec = accDays?.[ds];
      if (!dayRec) continue;
      accList.forEach(a => { if (dayRec[a.id] && totals[dayRec[a.id]] !== undefined) totals[dayRec[a.id]]++; });
    }
    const totalLogged = totals.given + totals.refused + totals.not_given + totals.absent + totals.na;
    const compliance = totalLogged > 0 ? Math.round((totals.given / totalLogged) * 100) : null;

    const summaryHtml = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
        ${Object.entries(STATUS_CONFIG).map(([key,cfg]) => `
          <div style="padding:8px 14px;border-radius:10px;background:${cfg.bg};border:1.5px solid ${cfg.border}66;min-width:90px">
            <div style="font-size:10px;font-weight:800;color:${cfg.color};text-transform:uppercase;letter-spacing:.05em">${cfg.label}</div>
            <div style="font-size:20px;font-weight:900;color:${cfg.color}">${totals[key]}</div>
          </div>
        `).join("")}
        ${compliance != null ? `
          <div style="padding:8px 14px;border-radius:10px;background:#edfdf5;border:1.5px solid #52c97a66;min-width:110px">
            <div style="font-size:10px;font-weight:800;color:#1a8a7a;text-transform:uppercase;letter-spacing:.05em">Compliance</div>
            <div style="font-size:20px;font-weight:900;color:#1a8a7a">${compliance}%</div>
          </div>
        ` : ""}
      </div>
    `;

    // Detailed daily list for every logged day in the range — this is what guarantees every
    // piece of data (including N/A explanations and day notes) actually makes it onto paper.
    const detailRows = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayRec = accDays?.[ds];
      if (!dayRec) continue;
      const parts = accList
        .filter(a => dayRec[a.id] !== undefined)
        .map(a => {
          const cfg = STATUS_CONFIG[dayRec[a.id]] ?? STATUS_CONFIG.given;
          const explanation = dayRec[a.id] === "na" ? dayRec._explanations?.[a.id] : null;
          return `<div style="margin-bottom:4px"><span style="color:${cfg.color};font-weight:700">${cfg.icon} ${escapeHtml(a.name)}: ${cfg.label}</span>${explanation ? `<div style="font-size:11px;color:#6b6b7d;margin-left:16px">↳ ${escapeHtml(explanation)}</div>` : ""}</div>`;
        }).join("");
      if (!parts && !dayRec._note) continue;
      detailRows.push(`
        <div style="border:1px solid #e7e1d8;border-radius:10px;padding:10px 12px;margin-bottom:8px;page-break-inside:avoid;break-inside:avoid">
          <div style="font-weight:800;font-size:12px;margin-bottom:6px;color:#2d2d3a">${d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</div>
          ${parts}
          ${dayRec._note ? `<div style="margin-top:6px;font-size:11px;background:#fffaf0;border:1px solid #f8dd9a;border-radius:6px;padding:6px 8px">📝 ${escapeHtml(dayRec._note)}</div>` : ""}
        </div>
      `);
    }

    const html = `
      <div class="report-page">
        <div class="report">
          <div class="report-header">
            <div>
              <div class="report-name">${escapeHtml(calStudent.name)}</div>
              <div class="report-meta">Accommodations Tracker — ${fromDate} to ${toDate} · Generated ${today}</div>
            </div>
            <span class="badge"></span>
          </div>
          ${summaryHtml}
          ${detailRows.length ? detailRows.join("") : `<div class="empty">No accommodation days logged in this range.</div>`}
          <div class="footer"><span>Progress Monitor</span><span>${today}</span></div>
        </div>
      </div>
    `;

    printHtmlDocument(html, `Accommodations Tracker - ${calStudent.name} - ${fromDate} to ${toDate}`);
  };
  const addMinuteOption=()=>{
    const label=newMinuteOption.trim();
    if(!label) return;
    setMinuteOptions(prev=>[...prev,{id:`opt-${Date.now()}-${Math.random().toString(16).slice(2,8)}`,label}]);
    setNewMinuteOption("");
  };
  const removeMinuteOption=(id)=>{
    setMinuteOptions(prev=>prev.filter(opt=>opt.id!==id));
  };
  const exportJSON=()=>{
    const payload={version:1,groups,students:sets,minuteOptions,attendanceGroups};
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    a.download="progress-data.json";a.click();
  };
  const buildQuartersMarkup = (c) => {
    const qs = Array.isArray(c.quarters) ? c.quarters.slice().sort((a, b) => a.date.localeCompare(b.date)) : [];
    if (!qs.length) return "";
    const rows = qs.map(q => `
      <div class="quarter-row">
        <span class="quarter-date">${escapeHtml(q.name || q.date)}${q.name ? ` <span style="font-weight:400;color:#8b85b8">(${escapeHtml(q.date)})</span>` : ""}</span>
        <span class="quarter-count">${q.count} ${q.count === 1 ? "entry" : "entries"}${q.manual ? " · edited" : ""}</span>
        <span class="quarter-avg">${q.avg != null ? `${q.avg}%` : "No data"}</span>
      </div>
    `).join("");
    return `
      <div class="quarter-summary">
        <div class="quarter-summary-title">Quarterly Averages</div>
        ${rows}
      </div>
    `;
  };
  const buildStudentPrintMarkup=(student)=>{
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const minuteEntries = Array.isArray(student.minutes) ? student.minutes : [];
    const totalMinutes = minuteEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const minuteSummary = Object.entries(minuteEntries.reduce((acc, entry) => {
      const label = entry.label || "Other";
      acc[label] = (acc[label] || 0) + Number(entry.amount || 0);
      return acc;
    }, {}));
    const goalMarkup = (student.charts ?? []).map((c) => {
      const pts = c.data ?? [];
      const latest = pts[pts.length - 1];
      return `
        <section class="goal-block">
          <div class="goal-header"><span>${(c.name ?? "Goal").replace(/[&<>\"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}</span><span class="goal-value">${latest ? `${latest.y}%` : "—"}</span></div>
          ${(latest && latest.notes) ? `<div class="goal-note">Session note: ${latest.notes}</div>` : ""}
          ${(c.notes) ? `<div class="goal-note goal-notes-block">Goal notes: ${c.notes}</div>` : ""}
          ${buildQuartersMarkup(c)}
        </section>
      `;
    }).join("");
    const accMarkup = (student.accommodations ?? []).length ? (student.accommodations ?? []).map((a, i) => `<div class="acc-item">${i + 1}. ${a.name}</div>`).join("") : "<div class=\"empty\">No accommodations recorded.</div>";
    return `
      <div class="report-page">
        <div class="report">
          <div class="report-header"><div><div class="report-name">${student.name}</div><div class="report-meta">Progress Report · Generated ${today}</div></div><span class="badge"></span></div>
          <div class="section"><div class="section-title">Minutes</div>${minuteEntries.length ? `<div class="minutes-summary">${totalMinutes} minutes total${minuteSummary.length ? ` · ${minuteSummary.map(([label, total]) => `${label}: ${total} min`).join(" · ")}` : ""}</div>` : "<div class=\"empty\">No minutes recorded</div>"}</div>
          ${goalMarkup}
          <div class="section"><div class="section-title">Accommodations</div>${accMarkup}</div>
          <div class="footer"><span>Progress Monitor</span><span>${today}</span></div>
        </div>
      </div>
    `;
  };
  const printHtmlDocument=(contentHtml,title,onDone)=>{
    const printHtml = `<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title><style>@page{size:A4 portrait;margin:0.6in;}body{margin:0;background:#fff;color:#2d2d3a;font-family:"Segoe UI",Arial,sans-serif;line-height:1.4}.report-page{break-before:page;page-break-before:always}.report-page:first-child{break-before:auto;page-break-before:auto}.report{width:100%;max-width:100%;box-sizing:border-box}.report-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5dfd5;padding-bottom:10px;margin-bottom:18px}.report-name{font-size:20px;font-weight:900;color:#2d2d3a}.report-meta{font-size:12px;color:#6b6b7d;margin-top:2px}.badge{width:18px;height:18px;border-radius:6px;background:linear-gradient(135deg,#ff6b6b 0 16.66%,#ffd166 16.66% 33.32%,#52c97a 33.32% 49.98%,#4e9af1 49.98% 66.64%,#a78bfa 66.64% 83.3%,#ff9f6b 83.3% 100%);display:inline-block}.section{border:1px solid #e7e1d8;border-radius:12px;background:#fff;padding:14px 16px;margin-bottom:18px;box-sizing:border-box;page-break-inside:avoid;break-inside:avoid}.goal-block{page-break-inside:avoid;break-inside:avoid}.section-title{font-size:15px;font-weight:800;margin-bottom:10px}.mini-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}.mini-box{border:1px solid #e7e1d8;border-radius:8px;padding:10px 12px;background:#faf7f3;min-height:72px}.mini-label{font-size:10px;color:#7d7d8f;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}.mini-number{font-size:20px;font-weight:800;line-height:1.2}.goal-header{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:16px;margin-bottom:8px}.goal-value{color:#ff6b6b}.goal-note{margin-top:10px;font-size:12px;color:#4d4d5f;background:#fffaf0;border:1px solid #f8dd9a;border-radius:8px;padding:8px 10px}.goal-notes-block{background:#fff7f0;border-color:#f9c7a5}.quarter-summary{margin-top:10px;border:1px solid #ded8fa;border-radius:8px;padding:8px 10px;background:#f6f4ff}.quarter-summary-title{font-size:11px;font-weight:800;color:#5b4bc4;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}.quarter-row{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#3f3a5c;padding:3px 0;border-bottom:1px dashed #e2ddf7}.quarter-row:last-child{border-bottom:none}.quarter-avg{font-weight:800;color:#5b4bc4}.acc-item{padding:4px 0;border-bottom:1px dashed #ece5dc;font-size:13px}.acc-item:last-child{border-bottom:none}.empty{font-size:13px;color:#77778d}.minutes-summary{font-size:13px;color:#4d4d5f;margin-top:8px}.footer{margin-top:20px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#7d7d8f;border-top:1px solid #ece5dc;padding-top:10px}</style></head><body>${contentHtml}</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", title);
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.srcdoc = printHtml;
    document.body.appendChild(iframe);
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      iframe.remove();
      onDone?.();
    };
    iframe.onload = () => {
      try {
        iframe.contentWindow?.addEventListener("afterprint", cleanup);
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (error) {
        console.error("Failed to print report", error);
        cleanup();
      }
      // Fallback in case afterprint never fires (some browsers on a cancelled/failed dialog).
      setTimeout(cleanup, 4000);
    };
  };
  // Renders a static snapshot of a goal's chart on a detached, off-screen canvas — used so every
  // goal in Parent Print gets an actual chart image, not just whichever one happens to be open in
  // the Goals tab (the only one with a live, on-screen Chart.js canvas to grab a frame from).
  const renderGoalChartImage = (goal, pal) => new Promise(resolve => {
    try {
      const pts = goal?.data ?? [];
      if (!pts.length) { resolve(null); return; }

      const parseD = value => {
        if (!value || typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
        const d = new Date(`${value}T12:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
      };
      const startChartDate = parseD(goal.startDate);
      const goalChartDate = parseD(goal.goalDate);
      const hasValidTargetDates = Boolean(startChartDate && goalChartDate && startChartDate.getTime() <= goalChartDate.getTime());
      const goalVal = goal.goalValue ?? 100;
      const quarters = Array.isArray(goal.quarters) ? goal.quarters : [];

      const canvas = document.createElement("canvas");
      canvas.width = 900; canvas.height = 340;
      canvas.style.position = "fixed";
      canvas.style.left = "-9999px";
      canvas.style.top = "0";
      document.body.appendChild(canvas);

      const bgPlugin = {
        id: "chartBgStatic",
        beforeDraw(ch) {
          const { ctx, chartArea: { top, bottom, left, right }, scales: { y } } = ch;
          if (!y) return;
          const zones = [
            { from: goalVal, to: 100, color: "rgba(82,201,122,0.08)" },
            { from: goalVal * 0.7, to: goalVal, color: "rgba(255,209,102,0.08)" },
            { from: 0, to: goalVal * 0.7, color: "rgba(255,107,107,0.06)" },
          ];
          zones.forEach(({ from, to, color }) => {
            const yTop = y.getPixelForValue(Math.min(to, 100));
            const yBot = y.getPixelForValue(Math.max(from, 0));
            ctx.fillStyle = color;
            ctx.fillRect(left, yTop, right - left, yBot - yTop);
          });
        },
      };
      const qLinePlugin = {
        id: "quarterLinesStatic",
        afterDraw(ch) {
          const { ctx, chartArea, scales } = ch;
          const x = scales.x;
          if (!x || !chartArea) return;
          const { top, bottom, left, right } = chartArea;
          quarters.forEach(q => {
            const qDate = parseD(q.date);
            if (!qDate) return;
            const px = x.getPixelForValue(qDate.getTime());
            if (!Number.isFinite(px) || px < left || px > right) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(px, top);
            ctx.lineTo(px, bottom);
            ctx.strokeStyle = "#7c6cf0";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            ctx.save();
            ctx.fillStyle = "#7c6cf0";
            ctx.font = "700 11px 'Nunito Sans', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText("🏁", px, top + 3);
            ctx.restore();
          });
        },
      };

      const chartInstance = new ChartJS(canvas, {
        type: "line",
        data: {
          datasets: [
            { label: goal.name ?? "Progress", data: pts, borderColor: pal.chip, backgroundColor: pal.chip + "22", tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: "#fff", pointBorderColor: pal.chip, pointBorderWidth: 2 },
            hasValidTargetDates && { label: "🎯 Target", data: [{ x: startChartDate, y: goal.startValue }, { x: goalChartDate, y: goal.goalValue }], borderColor: "#52c97a", borderDash: [6, 4], borderWidth: 2, fill: false, pointRadius: 4, pointBackgroundColor: "#52c97a" },
          ].filter(Boolean),
        },
        options: {
          responsive: false,
          animation: false,
          devicePixelRatio: 2,
          plugins: {
            legend: { labels: { color: "#5a5a72", font: { family: "'Nunito',sans-serif", size: 12, weight: "700" }, boxWidth: 14, padding: 16 } },
            tooltip: { enabled: false },
          },
          scales: {
            x: { type: "time", time: { unit: "day", tooltipFormat: "MMM d, yyyy" }, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#9898b0", font: { family: "'Nunito Sans'", size: 11 } } },
            y: { min: 0, max: 100, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#9898b0", font: { family: "'Nunito'", size: 11 }, callback: v => v + "%" } },
          },
        },
        plugins: [bgPlugin, qLinePlugin],
      });

      // With animation disabled Chart.js draws synchronously during construction, but give it
      // one frame to be safe before grabbing the image.
      requestAnimationFrame(() => {
        const img = chartInstance.toBase64Image("image/png", 1);
        chartInstance.destroy();
        canvas.remove();
        resolve(img);
      });
    } catch (error) {
      console.error("Failed to render chart snapshot", error);
      resolve(null);
    }
  });

  // "Parent Print" — a full handout covering every one of the student's goals: headline numbers,
  // a chart image, quarterly averages, and notes for each. No minutes or accommodations included.
  const printGoalReport = async () => {
    if (!student) return;
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const charts = student.charts ?? [];
    if (!charts.length) return;
    const pal = getPal(selSet);

    const chartImages = await Promise.all(charts.map(g => renderGoalChartImage(g, pal)));

    const goalBlocks = charts.map((g, gi) => {
      const pts = g.data ?? [];
      const latest = pts[pts.length - 1];
      const chartImg = chartImages[gi];
      return `
        <section class="goal-block">
          <div class="goal-header"><span>${escapeHtml(g.name ?? "Goal")}</span><span class="goal-value">${latest ? `${latest.y}%` : "—"}</span></div>
          <div class="mini-grid">
            <div class="mini-box"><div class="mini-label">Baseline</div><div class="mini-number">${g.startValue ?? 0}%</div></div>
            <div class="mini-box"><div class="mini-label">Latest data entry</div><div class="mini-number">${latest ? `${latest.y}%` : "—"}</div></div>
            <div class="mini-box"><div class="mini-label">Goal</div><div class="mini-number">${g.goalValue ?? 0}%</div></div>
          </div>
          ${chartImg
            ? `<div style="margin-top:16px;border:1px solid #e7e1d8;border-radius:12px;padding:10px;background:#fff"><img src="${chartImg}" style="width:100%;display:block" /></div>`
            : `<div class="empty" style="margin-top:12px">No data points yet to chart.</div>`}
          ${(g.notes) ? `<div class="goal-note goal-notes-block">Goal notes: ${escapeHtml(g.notes)}</div>` : ""}
          ${buildQuartersMarkup(g)}
        </section>
      `;
    }).join("");

    const html = `
      <div class="report-page">
        <div class="report">
          <div class="report-header">
            <div>
              <div class="report-name">${escapeHtml(student?.name ?? "")}</div>
              <div class="report-meta">Parent Copy · Generated ${today}</div>
            </div>
            <span class="badge"></span>
          </div>
          ${goalBlocks}
          <div class="footer"><span>Progress Monitor · Parent Copy</span><span>${today}</span></div>
        </div>
      </div>
    `;

    printHtmlDocument(html, `Parent Report - ${student?.name ?? ""}`);
  };

  // Act on whichever attachment pool is currently active — the selected goal's own files, or
  // the Accommodations tab's separate pool — not every file the student has everywhere.
  const downloadAllAttachments = () => {
    const atts = activeAttachments;
    if (!atts.length) return;
    // Stagger the downloads slightly — firing many `a.click()` calls in the same tick gets
    // several of them silently dropped by the browser's popup/download-blocking heuristics.
    atts.forEach((f, i) => {
      setTimeout(() => {
        try {
          const bytes = Uint8Array.from(atob(f.content), c => c.charCodeAt(0));
          const url = URL.createObjectURL(new Blob([bytes], { type: f.type || "application/octet-stream" }));
          const a = document.createElement("a");
          a.href = url; a.download = f.name; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        } catch (error) {
          console.error("Failed to download attachment", f.name, error);
        }
      }, i * 250);
    });
  };
  const printAllAttachments = () => {
    const atts = activeAttachments;
    if (!atts.length) return;
    // Fire one print job per file, one after another — each attachment gets its own print
    // dialog/page setup instead of being merged into a single multi-page document.
    let i = 0;
    const printNext = () => {
      if (i >= atts.length) return;
      const f = atts[i]; i += 1;
      const type = f.type || "";
      const body = type.startsWith("image/")
        ? `<img src="data:${type};base64,${f.content}" style="max-width:100%;max-height:9in;display:block;margin:0 auto;border-radius:8px" />`
        : type === "application/pdf"
          ? `<embed src="data:application/pdf;base64,${f.content}" type="application/pdf" style="width:100%;height:9.5in;border:1px solid #e7e1d8;border-radius:8px" />`
          : `<div style="text-align:center;padding:70px 20px;color:#77778d;border:1.5px dashed #e7e1d8;border-radius:12px"><div style="font-size:44px;margin-bottom:10px">📄</div><div style="font-weight:700;font-size:15px;color:#2d2d3a">${escapeHtml(f.name)}</div><div style="font-size:12px;margin-top:6px">${escapeHtml(type || "Unknown type")} · ${Math.round((f.size||0)/1024)}KB</div><div style="font-size:12px;margin-top:12px">This file type can't be previewed for printing — use "Download All" to save it instead.</div></div>`;
      const page = `
        <div class="report-page">
          <div class="report">
            <div class="report-header"><div><div class="report-name">${escapeHtml(f.name)}</div><div class="report-meta">${escapeHtml(student?.name ?? "")} · Attachment ${i} of ${atts.length}</div></div><span class="badge"></span></div>
            ${body}
          </div>
        </div>
      `;
      printHtmlDocument(page, f.name, printNext);
    };
    printNext();
  };
  const printStudentReport = () => {
    const student = sets[selSet];
    if (!student) return;

    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const minuteEntries = Array.isArray(student.minutes) ? student.minutes : [];
    const totalMinutes = minuteEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const minuteSummary = Object.entries(minuteEntries.reduce((acc, entry) => {
      const label = entry.label || "Other";
      acc[label] = (acc[label] || 0) + Number(entry.amount || 0);
      return acc;
    }, {}));

    const goalMarkup = (student.charts ?? []).map((c) => {
      const pts = c.data ?? [];
      const latest = pts[pts.length - 1];
      return `
        <section class="goal-block">
          <div class="goal-header">
            <span>${escapeHtml(c.name ?? "Goal")}</span>
            <span class="goal-value">${latest ? `${latest.y}%` : "—"}</span>
          </div>
          ${(latest && latest.notes) ? `<div class="goal-note">Session note: ${latest.notes}</div>` : ""}
          ${(c.notes) ? `<div class="goal-note goal-notes-block">Goal notes: ${c.notes}</div>` : ""}
          ${buildQuartersMarkup(c)}
        </section>
      `;
    }).join("");

    const accMarkup = (student.accommodations ?? []).length
      ? (student.accommodations ?? []).map((a, i) => `<div class="acc-item">${i + 1}. ${escapeHtml(a.name)}</div>`).join("")
      : "<div class=\"empty\">No accommodations recorded.</div>";

    // Reuses the same print-document builder (and its CSS) as every other print path in the app
    // (Parent Print, Print All attachments, bulk class reports) instead of keeping its own
    // hand-rolled copy — a prior version of this function had its own duplicate <style> block that
    // silently drifted out of sync with this one.
    const html = `
      <div class="report-page">
        <div class="report">
          <div class="report-header">
            <div>
              <div class="report-name">${escapeHtml(student.name)}</div>
              <div class="report-meta">Progress Report · Generated ${today}</div>
            </div>
            <span class="badge"></span>
          </div>
          <div class="section">
            <div class="section-title">Minutes</div>
            ${minuteEntries.length ? `<div class="minutes-summary">${totalMinutes} minutes total${minuteSummary.length ? ` · ${minuteSummary.map(([label, total]) => `${label}: ${total} min`).join(" · ")}` : ""}</div>` : `<div class="empty">No minutes recorded</div>`}
          </div>
          ${goalMarkup}
          <div class="section">
            <div class="section-title">Accommodations</div>
            ${accMarkup}
          </div>
          <div class="footer"><span>Progress Monitor</span><span>${today}</span></div>
        </div>
      </div>
    `;

    printHtmlDocument(html, `Progress Report - ${student.name}`);
  };
  const bulkPrintReports = () => {
    if (!bulkSelectedStudentIds.length) return;
    const selectedStudents = sets.filter((_, idx) => bulkSelectedStudentIds.includes(idx));
    const pagesHtml = selectedStudents.map(student => buildStudentPrintMarkup(student)).join("");
    if (!pagesHtml) return;
    printHtmlDocument(pagesHtml, "Progress Monitor Class Reports");
    setBulkReportOpen(false);
  };
  const importJSON=e=>{
    const f=e.target.files[0];if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{try{
      const d=JSON.parse(ev.target.result);
      const nextSets = Array.isArray(d) ? d : (d && Array.isArray(d.students) ? d.students : null);
      if (!Array.isArray(nextSets)) throw new Error("Invalid file");
      const normalizedSets = nextSets.map(student => ensureStudentId(normalizeStudentAttachments({
        ...student,
        accommodations: Array.isArray(student.accommodations) ? student.accommodations : [],
        accDays: student.accDays ?? {},
        minutes: Array.isArray(student.minutes) ? student.minutes : [],
        charts: Array.isArray(student.charts) ? student.charts : [],
        groupId: student.groupId ?? "",
      })));
      setSets(normalizedSets);
      if (d && Array.isArray(d.groups)) setGroups(d.groups);
      if (d && Array.isArray(d.attendanceGroups)) setAttendanceGroups(d.attendanceGroups);
      const importedMinuteOptions = Array.isArray(d?.minuteOptions) ? d.minuteOptions : (Array.isArray(d?.options) ? d.options : DEFAULT_MINUTE_OPTIONS);
      setMinuteOptions(importedMinuteOptions.length ? importedMinuteOptions : DEFAULT_MINUTE_OPTIONS);
      setSelSet(0); setSelChart(0); setView("dashboard");
    }catch{alert("Couldn't read that file");}};
    r.readAsText(f);
  };
  useEffect(()=>{
    if(renameTarget){
      setRenameValue(renameTarget.currentName ?? "");
      setRenameEmoji(renameTarget.currentEmoji ?? "");
    }
  },[renameTarget]);
  const saveRename=()=>{
    const nextName = renameValue.trim();
    if(!renameTarget || !nextName) return;

    if(renameTarget.type === "student"){
      upd(d => {
        d[renameTarget.studentIndex].name = nextName;
        d[renameTarget.studentIndex].emoji = renameEmoji.trim() || d[renameTarget.studentIndex].emoji || getEmoji(nextName);
      });
    }
    if(renameTarget.type === "goal"){
      upd(d => { d[renameTarget.studentIndex].charts[renameTarget.goalIndex].name = nextName; });
    }

    setRenameTarget(null);
    setRenameValue("");
    setRenameEmoji("");
  };
  const handleSelectStudent=(si,ci=0)=>{setSelSet(si);setSelChart(ci);setActiveTab("goals");setView("student");};
  const toggleSidebarGroup = key => setSidebarGroupCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const sidebarSections = [
    ...groups.map(group => ({ id: group.id, name: group.name, students: sets.filter(student => student.groupId === group.id) })),
    { id: "ungrouped", name: "Ungrouped", students: sets.filter(student => !student.groupId || !groups.some(group => group.id === student.groupId)) },
  ];

  // ── Keyboard shortcuts ──
  useEffect(()=>{
    const handler=e=>{
      const tag=document.activeElement?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA") return;
      if(e.key==="n"||e.key==="N"){e.preventDefault();if(view==="student")setShowQL(true);}
      if((e.ctrlKey||e.metaKey)&&e.key==="z"){e.preventDefault();undo();}
      if(e.key==="?"||e.key==="/"){e.preventDefault();setShowGuide(s=>!s);}
      if(e.key==="h"||e.key==="H"){e.preventDefault();setView("dashboard");}
      if(e.key==="Escape"){setShowGuide(false);setShowQL(false);setShowReport(false);}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[view,history]);

  return(
    <div style={{display:"flex",height:"100vh",width:"100vw",overflow:"hidden",background:theme.page,color:theme.text}}>

      {/* SIDEBAR */}
      <div style={{width:sidebarOpen?272:50,flexShrink:0,background:theme.panel,borderRight:`2px solid ${theme.border}`,display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",boxShadow:`0 0 0 1px ${theme.border}`,transition:"width .3s ease"}}>
        {sidebarOpen && (
          <>
            <div style={{padding:"20px 18px 14px",borderBottom:`2px solid ${theme.border}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,#26c6b0,#4e9af1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📈</div>
                  <div>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:15,color:theme.text}}>Progress Monitor</div>
                  </div>
                </div>
                <button onClick={()=>setSidebarOpen(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:"4px 2px",opacity:.6}}>✕</button>
              </div>
            </div>

        {/* Home button */}
        <div style={{padding:"8px 12px 0"}}>
          <button onClick={()=>setView("dashboard")} className={`tab-btn${view==="dashboard"?" active":""}`} style={{width:"100%",justifyContent:"flex-start",borderRadius:"var(--r-sm)"}}>🏠 Dashboard</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"8px 12px 0"}}>
          <SectionLabel>Students</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {sidebarSections.map(section => (
              <div
                key={section.id}
                draggable={Boolean(section.id !== "ungrouped")}
                onDragStart={event => {
                  if (section.id === "ungrouped") return;
                  event.dataTransfer.setData("text/plain", section.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={event => {
                  if (section.id === "ungrouped") return;
                  event.preventDefault();
                }}
                onDrop={event => {
                  if (section.id === "ungrouped") return;
                  event.preventDefault();
                  const draggedId = event.dataTransfer.getData("text/plain");
                  reorderGroups(draggedId, section.id);
                }}
                style={{borderRadius:"var(--r)",border:`2px solid ${theme.border}`,overflow:"hidden",background:theme.card,boxShadow:`0 6px 18px ${theme.shadow}`,cursor: section.id === "ungrouped" ? "default" : "grab"}}
              >
                <div onClick={()=>toggleSidebarGroup(section.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 10px",cursor:"pointer",background:theme.softPanel}}>
                  <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,color:theme.text}}>{section.name} ({section.students.length})</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {section.id !== "ungrouped" && (
                      <>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            const nextName = window.prompt("Rename group", section.name);
                            if (nextName !== null) renameGroup(section.id, nextName);
                          }}
                          style={{background:"none",border:"none",cursor:"pointer",fontSize:11,opacity:0.7,padding:0}}
                          aria-label={`Rename group ${section.name}`}
                        >✏️</button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            requestConfirm({
                              title: "Delete group?",
                              message: `This will remove the group "${section.name}" and move any students in it back to Ungrouped.`,
                              confirmLabel: "Delete",
                              danger: true,
                              onConfirm: () => deleteGroup(section.id),
                            });
                          }}
                          style={{background:"none",border:"none",cursor:"pointer",fontSize:11,opacity:0.7,padding:0}}
                          aria-label={`Delete group ${section.name}`}
                        >🗑️</button>
                      </>
                    )}
                    <span style={{fontSize:12,color:theme.subtle}}>{sidebarGroupCollapsed[section.id] ? "▸" : "▾"}</span>
                  </div>
                </div>
                {!sidebarGroupCollapsed[section.id] && (
                  <div style={{display:"flex",flexDirection:"column",gap:6,padding:"8px 8px 10px"}}>
                    {section.students.length === 0 ? (
                      <div style={{padding:"10px",border:`1.5px dashed ${theme.border}`,borderRadius:8,color:theme.subtle,fontSize:11}}>No students here</div>
                    ) : section.students.map((s,si)=>{
                      const p=getPal(sets.indexOf(s));
                      const isActive=view==="student"&&selSet===sets.indexOf(s);
                      return (
                        <div key={`${section.id}-${s.name}-${si}`} style={{borderRadius:"var(--r-sm)",border:`2px solid ${isActive ? p.border : theme.border}`,overflow:"hidden",transition:"border-color .15s"}}>
                          <div onClick={()=>handleSelectStudent(sets.indexOf(s))} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 8px",background:isActive ? theme.softPanel : "transparent", cursor:"pointer", transition:"background .15s"}}>
                            <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${p.chip},${p.chip}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{getStudentEmoji(s)}</div>
                            <div style={{flex:1,overflow:"hidden"}}>
                              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,color:theme.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                              <div style={{fontSize:10,color:theme.subtle}}>{s.charts.length} goal{s.charts.length!==1?"s":""}</div>
                            </div>
                            <div style={{display:"flex",gap:1}}>
                              <button onClick={e=>{e.stopPropagation();setRenameTarget({type:"student",studentIndex:sets.indexOf(s),currentName:s.name,currentEmoji:s.emoji ?? getStudentEmoji(s)});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,opacity:.45,padding:"2px"}}>✏️</button>
                              <button onClick={e=>{e.stopPropagation();requestConfirm({title:"Remove student?",message:`This will delete ${s.name} and all of their data.`,confirmLabel:"Remove",danger:true,onConfirm:()=>{upd(d=>d.splice(sets.indexOf(s),1));setSelSet(0);setSelChart(0);setView("dashboard");setConfirmDialog(null);}});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,opacity:.45,padding:"2px"}}>🗑️</button>
                            </div>
                          </div>
                          {isActive&&(
                            <div style={{background:p.bg,padding:"4px 10px 10px 40px",display:"flex",flexDirection:"column",gap:4}}>
                              {s.charts.map((c,ci)=>{
                                const isAC=activeTab==="goals"&&selChart===ci;
                                return(
                                  <div key={ci} onClick={()=>{setSelChart(ci);setActiveTab("goals");}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 10px",borderRadius:99,background:isAC?p.chip:"transparent",border:`1.5px solid ${isAC?p.chip:p.border+"55"}`,cursor:"pointer",transition:"all .15s"}}>
                                    <span style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,color:isAC?"#fff":p.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.name}</span>
                                    <div style={{display:"flex",gap:1}}>
                                      <button onClick={e=>{e.stopPropagation();setRenameTarget({type:"goal",studentIndex:sets.indexOf(s),goalIndex:ci,currentName:c.name});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:9,opacity:isAC?.75:.35,padding:"1px 2px",color:isAC?"#fff":"inherit"}}>✏️</button>
                                      <button onClick={e=>{e.stopPropagation();requestConfirm({title:"Delete goal?",message:`This will remove the goal "${c.name}" from this student.`,confirmLabel:"Delete",danger:true,onConfirm:()=>{upd(d=>d[sets.indexOf(s)].charts.splice(ci,1));setSelChart(0);setConfirmDialog(null);}});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:9,opacity:isAC?.75:.35,padding:"1px 2px",color:isAC?"#fff":"inherit"}}>✕</button>
                                    </div>
                                  </div>
                                );
                              })}
                              <button onClick={()=>setShowAG(true)} style={{background:"none",border:`1.5px dashed ${p.border}88`,borderRadius:99,color:p.text,fontSize:10,fontFamily:"var(--font-head)",fontWeight:700,padding:"4px 10px",marginTop:2,cursor:"pointer",alignSelf:"flex-start"}}>+ Goal</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:"12px",borderTop:`2px solid ${theme.border}`,background:theme.softPanel}}>
          <div onClick={()=>setSidebarControlsCollapsed(value => !value)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",padding:"4px 2px 8px",userSelect:"none"}}>
            <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,color:theme.subtle,letterSpacing:"0.08em",textTransform:"uppercase"}}>Quick Tools</span>
            <span style={{fontSize:12,color:theme.subtle}}>{sidebarControlsCollapsed ? "▸" : "▾"}</span>
          </div>
          {!sidebarControlsCollapsed && (
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <button className="action-btn" onClick={()=>setShowAS(true)} style={{background:theme.primary,color:"#fff",justifyContent:"center",width:"100%"}}>+ Add Student</button>
              <button className="ghost-btn" onClick={()=>setShowGroupModal(true)} style={{justifyContent:"center",fontSize:11, color:theme.text, borderColor: theme.border, background: theme.card}}>+ Add Group</button>
              <button className="ghost-btn" onClick={()=>setShowAttGroups(true)} style={{justifyContent:"center",fontSize:11, color:theme.text, borderColor: theme.border, background: theme.card}}>+ Attendance Group</button>
              <button className="ghost-btn" onClick={()=>setShowMinuteOptions(true)} style={{justifyContent:"center",fontSize:11, color:theme.text, borderColor: theme.border, background: theme.card}}>⏱ Minutes Options</button>
              <div style={{display:"flex",gap:6}}>
                <button className="ghost-btn" onClick={exportJSON} style={{flex:1,justifyContent:"center"}}>↓ Export</button>
                <label className="ghost-btn" style={{flex:1,justifyContent:"center",cursor:"pointer"}}>↑ Import<input type="file" accept=".json" onChange={importJSON} style={{display:"none"}}/></label>
              </div>
              <button className="ghost-btn" onClick={()=>setShowGuide(true)} style={{justifyContent:"center",fontSize:11}}>📘 Guide</button>
            </div>
          )}
        </div>
          </>
        )}
        {!sidebarOpen && (
          <div style={{padding:"8px",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:`2px solid ${theme.border}`}}>
            <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,padding:"4px",color:theme.text}}>≡</button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {view==="dashboard"?(
          <Dashboard
            sets={sets}
            onSelectStudent={handleSelectStudent}
            onAddStudent={()=>setShowAS(true)}
            getPal={getPal}
            getStudentEmoji={getStudentEmoji}
            onUpdateStudentGroup={updateStudentGroup}
            groups={groups}
            onOpenGroupModal={()=>setShowGroupModal(true)}
            onOpenBulkReport={openBulkReport}
            onOpenTakeAttendance={()=>setShowTakeAttendance(true)}
            homeSearch={homeSearch}
            setHomeSearch={setHomeSearch}
            homeAccommodation={homeAccommodation}
            setHomeAccommodation={setHomeAccommodation}
            homeGroupFilter={homeGroupFilter}
            setHomeGroupFilter={setHomeGroupFilter}
            theme={theme}
            setTheme={setThemeKey}
          />
        ):student?(
          <>
            {/* Topbar */}
            <div style={{padding:"12px 22px 0",background:theme.panel,borderBottom:`2px solid ${theme.border}`,flexShrink:0, color:theme.text, boxShadow:`0 8px 20px ${theme.shadow}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:12,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <button className="ghost-btn" onClick={()=>setView("dashboard")} style={{padding:"4px 10px",fontSize:12, color:theme.text, borderColor: theme.border, background: theme.card}}>← Home</button>
                  <span style={{fontSize:19}}>{getStudentEmoji(student)}</span>
                  <span style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:19,color:theme.text}}>{student?.name}</span>
                  {activeTab==="goals"&&chart&&(
                    <><span style={{color:theme.subtle,fontSize:15}}>›</span>
                    <span style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,color:pal.text}}>{chart.name}</span></>
                  )}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: theme.card, border: `1.5px solid ${theme.border}` }}>
                    <span style={{ fontSize: 12 }}>🎨</span>
                    <select value={theme.key} onChange={event => setThemeKey(event.target.value)} style={{ background: "transparent", border: "none", color: theme.text, minWidth: 84, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      <option value="sunrise">Sunrise</option>
                      <option value="studio">Studio</option>
                      <option value="night">Night</option>
                    </select>
                  </div>
                  {activeTab==="goals"&&<button className="ghost-btn" onClick={undo} disabled={!history.length} style={{color:theme.text, borderColor: theme.border, background: theme.card}}>↩ Undo</button>}
                  {(activeTab==="goals"||activeTab==="accommodations")&&<button className="ghost-btn" onClick={()=>setShowAtt(true)} style={{color:theme.text, borderColor: theme.border, background: theme.card}}>📎 Files</button>}
                  <button className="ghost-btn" onClick={()=>setShowReport(true)} style={{color:theme.text, borderColor: theme.border, background: theme.card}}>📄 Report</button>
                </div>
              </div>
              <div style={{display:"flex",gap:4,paddingBottom:12,flexWrap:"wrap"}}>
                <button className={`tab-btn${activeTab==="goals"?" active":""}`} onClick={()=>setActiveTab("goals")} style={{background: activeTab === "goals" ? theme.card : "transparent", borderColor: theme.border, color: theme.text}}>📊 Goals</button>
                <button className={`tab-btn${activeTab==="accommodations"?" active":""}`} onClick={()=>setActiveTab("accommodations")} style={{background: activeTab === "accommodations" ? theme.card : "transparent", borderColor: theme.border, color: theme.text}}>🛠 Accommodations</button>
                <button className={`tab-btn${activeTab==="minutes"?" active":""}`} onClick={()=>setActiveTab("minutes")} style={{background: activeTab === "minutes" ? theme.card : "transparent", borderColor: theme.border, color: theme.text}}>⏱ Minutes</button>
              </div>
            </div>

            {activeTab==="accommodations"?(
              <AccommodationsTab student={student} selSet={selSet} upd={upd} theme={theme} pal={pal} onPrintCalendar={printAccommodationsCalendar}/>
            ):activeTab==="minutes"?(
              <MinutesTab student={student} selSet={selSet} upd={upd} minuteOptions={minuteOptions} requestConfirm={requestConfirm} theme={theme} pal={pal} onPrintAttendance={printAttendanceLog}/>
            ):(
              <GoalsTab sets={sets} selSet={selSet} selChart={selChart} setSelChart={setSelChart}
                upd={upd} snap={snap} undo={undo} history={history}
                showAtt={showAtt} setShowAtt={setShowAtt} setShowAG={setShowAG}
                chartRef={chartRef} editPt={editPt} setEditPt={setEditPt} theme={theme} pal={pal} requestConfirm={requestConfirm}/>
            )}
          </>
        ):(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:40}}>
            <div style={{fontSize:56}}>🎒</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22}}>Welcome to Progress Monitor!</div>
            <button className="action-btn" onClick={()=>setShowAS(true)} style={{background:"var(--teal)",color:"#fff",fontSize:15,padding:"12px 28px",marginTop:6}}>+ Add Your First Student</button>
          </div>
        )}
      </div>

      {/* MODALS */}
      <Modal show={showAS} onClose={()=>setShowAS(false)} title="Add Student" emoji="🎒">
        <SectionLabel>Student Name</SectionLabel>
        <input type="text" placeholder="e.g. Jordan Smith" value={newSName} onChange={e=>setNewSName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addStudent()} style={{marginTop:6}} autoFocus/>

        <div style={{marginTop:14}}>
          <SectionLabel>Custom Emoji</SectionLabel>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <input type="text" placeholder="e.g. 🦋 or ⭐" value={newSEmoji} onChange={e=>setNewSEmoji(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addStudent()} style={{flex:1}} />
            <button className="ghost-btn" type="button" onClick={()=>{setEmojiTarget({source:"newStudent", setter:setNewSEmoji}); setShowEmojiPicker(true);}} style={{padding:"0 12px"}}>🎨</button>
          </div>
        </div>

        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <button className="ghost-btn" onClick={()=>setShowAS(false)}>Cancel</button>
          <button className="action-btn" onClick={addStudent} style={{background:"var(--teal)",color:"#fff"}}>Add Student ✓</button>
        </div>
      </Modal>

      <Modal show={showGroupModal} onClose={()=>{setShowGroupModal(false); setNewGroupName("");}} title="Add Group" emoji="👥">
        <SectionLabel>Group Name</SectionLabel>
        <input type="text" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGroup()} placeholder="e.g. 3rd Grade" style={{marginTop:6,marginBottom:16}} autoFocus/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="ghost-btn" onClick={()=>{setShowGroupModal(false); setNewGroupName("");}}>Cancel</button>
          <button className="action-btn" onClick={addGroup} style={{background:"var(--yellow)",color:"#2d2d3a"}}>Add Group ✓</button>
        </div>
      </Modal>

      <AttendanceGroupsModal
        show={showAttGroups}
        onClose={()=>setShowAttGroups(false)}
        sets={sets}
        groups={groups}
        attendanceGroups={attendanceGroups}
        onSave={saveAttendanceGroup}
        onDelete={deleteAttendanceGroup}
        requestConfirm={requestConfirm}
      />

      <TakeAttendanceModal
        show={showTakeAttendance}
        onClose={()=>setShowTakeAttendance(false)}
        sets={sets}
        attendanceGroups={attendanceGroups}
        onSubmit={submitAttendance}
      />

      <Modal show={showAG} onClose={()=>setShowAG(false)} title="Add Goal" emoji="🎯">
        <SectionLabel>Goal Name</SectionLabel>
        <input type="text" placeholder="e.g. Reading Fluency, Math Facts…" value={newGName} onChange={e=>setNewGName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGoal()} style={{marginTop:6,marginBottom:16}} autoFocus/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="ghost-btn" onClick={()=>setShowAG(false)}>Cancel</button>
          <button className="action-btn" onClick={addGoal} style={{background:pal.chip,color:"#fff"}}>Add Goal ✓</button>
        </div>
      </Modal>

      <Modal show={showMinuteOptions} onClose={()=>setShowMinuteOptions(false)} title="Minutes Options" emoji="⏱">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <SectionLabel>Add an option</SectionLabel>
            <input type="text" placeholder="e.g. Small Group, Intervention, Reading" value={newMinuteOption} onChange={e=>setNewMinuteOption(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMinuteOption()} style={{marginTop:6}} autoFocus/>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button className="action-btn" onClick={addMinuteOption} style={{background:"var(--teal)",color:"#fff"}}>Add Option</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {minuteOptions.map(option=>(
              <div key={option.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"8px 10px",background:"var(--cream)",borderRadius:8,border:"1.5px solid var(--border)"}}>
                <span style={{fontSize:13,fontWeight:700,color:"var(--ink-mid)"}}>{option.label}</span>
                <button className="ghost-btn" onClick={()=>removeMinuteOption(option.id)} style={{padding:"4px 8px",fontSize:11}}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal show={!!confirmDialog} onClose={()=>setConfirmDialog(null)} title={confirmDialog?.title ?? "Confirm"} emoji={confirmDialog?.danger ? "⚠️" : "❔"}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{fontSize:14,color:"var(--ink-mid)",lineHeight:1.5}}>{confirmDialog?.message ?? "Are you sure?"}</div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>setConfirmDialog(null)}>Cancel</button>
            <button className="action-btn" onClick={()=>{confirmDialog?.onConfirm?.(); setConfirmDialog(null);}} style={{background:confirmDialog?.danger ? "var(--red)" : "var(--teal)",color:"#fff"}}>{confirmDialog?.confirmLabel ?? "Confirm"}</button>
          </div>
        </div>
      </Modal>

      <Modal show={!!renameTarget} onClose={()=>{setRenameTarget(null);setRenameValue("");setRenameEmoji("");}} title={renameTarget?.type === "student" ? "Rename Student" : "Rename Goal"} emoji="✏️">
        {renameTarget?.type === "student" ? (
          <>
            <SectionLabel>Student Name</SectionLabel>
            <input type="text" value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveRename()} style={{marginTop:6}} autoFocus/>

            <div style={{marginTop:14}}>
              <SectionLabel>Custom Emoji</SectionLabel>
              <div style={{display:"flex",gap:8,marginTop:6}}>
                <input type="text" value={renameEmoji} onChange={e=>setRenameEmoji(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveRename()} style={{flex:1}} placeholder="e.g. 🦋 or ⭐" />
                <button className="ghost-btn" type="button" onClick={()=>{setEmojiTarget({source:"renameStudent", setter:setRenameEmoji}); setShowEmojiPicker(true);}} style={{padding:"0 12px"}}>🎨</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <SectionLabel>Goal Name</SectionLabel>
            <input type="text" value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveRename()} style={{marginTop:6,marginBottom:16}} autoFocus/>
          </>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <button className="ghost-btn" onClick={()=>{setRenameTarget(null);setRenameValue("");setRenameEmoji("");}}>Cancel</button>
          <button className="action-btn" onClick={saveRename} style={{background:"var(--teal)",color:"#fff"}}>Save ✓</button>
        </div>
      </Modal>

      <EmojiPickerModal
        show={showEmojiPicker}
        onClose={()=>{setShowEmojiPicker(false); setEmojiTarget(null);}}
        selected={emojiTarget?.source === "newStudent" ? newSEmoji : emojiTarget?.source === "renameStudent" ? renameEmoji : ""}
        onSelect={emoji => {
          if (emojiTarget?.setter) emojiTarget.setter(emoji);
          setShowEmojiPicker(false);
          setEmojiTarget(null);
        }}
      />

      <Modal show={showAtt} onClose={()=>setShowAtt(false)} title="Attachments" emoji="📎">
        {student&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:12,color:"var(--ink-soft)"}}>
              {attachmentsScope==="accommodations"
                ? `Shared across the Accommodations tab for ${student.name} — separate from any goal's files.`
                : `Only attached to "${chart?.name ?? "this goal"}" — other goals have their own files.`}
            </div>
            <div><SectionLabel>Upload a File</SectionLabel>
              <input type="file" style={{marginTop:6}} onChange={e=>{
                const f=e.target.files[0];if(!f) return;
                addActiveAttachment(f);
                e.target.value="";
              }}/></div>
            {activeAttachments.length===0?(<div style={{textAlign:"center",padding:"14px 0",color:"var(--ink-soft)",fontSize:13}}>No files yet</div>
            ):(
              <>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="ghost-btn" onClick={downloadAllAttachments} style={{padding:"5px 12px",fontSize:12}}>⬇ Download All ({activeAttachments.length})</button>
                  <button className="ghost-btn" onClick={printAllAttachments} style={{padding:"5px 12px",fontSize:12}}>🖨 Print All</button>
                </div>
                {activeAttachments.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--cream)",borderRadius:8,border:"1.5px solid var(--border)"}}>
                    <span style={{fontSize:20}}>📄</span>
                    <span style={{flex:1,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                    <span style={{fontSize:11,color:"var(--ink-soft)"}}>{Math.round(f.size/1024)}KB</span>
                    <button className="ghost-btn" onClick={()=>{const bytes=Uint8Array.from(atob(f.content),c=>c.charCodeAt(0));const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([bytes],{type:f.type}));a.download=f.name;a.click();}} style={{padding:"3px 10px"}}>↓</button>
                    <button className="ghost-btn" onClick={()=>removeActiveAttachment(i)} style={{padding:"3px 10px",color:"var(--red)"}}>🗑️</button>
                  </div>
                ))}
              </>
            )}
            <div style={{display:"flex",justifyContent:"flex-end"}}><button className="ghost-btn" onClick={()=>setShowAtt(false)}>Close</button></div>
          </div>
        )}
      </Modal>

      {/* User Guide modal */}
      <GuideModal show={showGuide} onClose={()=>setShowGuide(false)} />

      <ReportModal show={showReport} onClose={()=>setShowReport(false)} sets={sets} selSet={selSet} onPrint={printStudentReport} chart={chart} onParentPrint={printGoalReport} />

      <Modal show={bulkReportOpen} onClose={()=>setBulkReportOpen(false)} title="Print Class Reports" emoji="🖨" wide>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap",padding:"10px 12px",background:"var(--cream)",border:"1.5px solid var(--border)",borderRadius:12}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:16,color:"var(--ink)"}}>Select students to print</div>
              <div style={{fontSize:12,color:"var(--ink-soft)",marginTop:2}}>{bulkSelectedStudentIds.length} student{bulkSelectedStudentIds.length === 1 ? "" : "s"} selected</div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="ghost-btn" onClick={selectAllBulkStudents}>Select all</button>
              <button className="ghost-btn" onClick={clearBulkStudents}>Clear</button>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {groups
              .map(group => {
                const groupStudentIndexes = sets
                  .map((student, idx) => (student.groupId === group.id ? idx : null))
                  .filter(index => index !== null);

                if (groupStudentIndexes.length === 0) return null;

                const checked = groupStudentIndexes.length > 0 && groupStudentIndexes.every(index => bulkSelectedStudentIds.includes(index));

                return (
                  <div
                    key={group.id}
                    onClick={()=>toggleBulkGroup(group.id)}
                    style={{
                      border:"1.5px solid var(--border)",
                      borderRadius:14,
                      padding:12,
                      background: checked ? "linear-gradient(135deg, rgba(38,198,176,0.12), rgba(78,154,241,0.08))" : "var(--paper)",
                      boxShadow: checked ? "0 6px 18px rgba(38,198,176,0.12)" : "0 2px 8px rgba(35,34,54,0.04)",
                      cursor:"pointer",
                      transition:"all .15s ease",
                      borderColor: checked ? "rgba(38,198,176,0.75)" : "var(--border)",
                    }}
                  >
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:18,height:18,borderRadius:6,border:"1.5px solid "+(checked?"var(--teal)":"var(--border)"),background:checked?"var(--teal)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10}}>
                          {checked ? "✓" : ""}
                        </div>
                        <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:"var(--ink)"}}>{group.name}</div>
                      </div>
                      <span style={{padding:"3px 8px",borderRadius:999,background:"var(--cream)",border:"1px solid var(--border)",fontSize:11,color:"var(--ink-soft)",fontWeight:700}}>{groupStudentIndexes.length}</span>
                    </div>

                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {groupStudentIndexes.map(index => (
                        <button
                          key={index}
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            toggleBulkStudent(index);
                          }}
                          style={{
                            display:"inline-flex",
                            alignItems:"center",
                            justifyContent:"center",
                            borderRadius:999,
                            background: bulkSelectedStudentIds.includes(index) ? "rgba(38,198,176,0.18)" : "var(--cream)",
                            border:"1.5px solid "+(bulkSelectedStudentIds.includes(index) ? "rgba(38,198,176,0.7)" : "var(--border)"),
                            color:"var(--ink-mid)",
                            fontSize:12,
                            fontWeight:700,
                            padding:"6px 10px",
                            cursor:"pointer",
                            transition:"all .15s ease",
                          }}
                        >
                          {sets[index]?.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

            {(() => {
              const ungroupedIndexes = sets
                .map((student, idx) => (!student.groupId || !groups.some(group => group.id === student.groupId) ? idx : null))
                .filter(index => index !== null);

              if (ungroupedIndexes.length === 0) return null;

              const checked = ungroupedIndexes.length > 0 && ungroupedIndexes.every(index => bulkSelectedStudentIds.includes(index));

              return (
                <div
                  onClick={()=>toggleBulkGroup("ungrouped")}
                  style={{
                    border:"1.5px solid var(--border)",
                    borderRadius:14,
                    padding:12,
                    background: checked ? "linear-gradient(135deg, rgba(38,198,176,0.12), rgba(78,154,241,0.08))" : "var(--paper)",
                    boxShadow: checked ? "0 6px 18px rgba(38,198,176,0.12)" : "0 2px 8px rgba(35,34,54,0.04)",
                    cursor:"pointer",
                    transition:"all .15s ease",
                    borderColor: checked ? "rgba(38,198,176,0.75)" : "var(--border)",
                  }}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:18,height:18,borderRadius:6,border:"1.5px solid "+(checked?"var(--teal)":"var(--border)"),background:checked?"var(--teal)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10}}>
                        {checked ? "✓" : ""}
                      </div>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:"var(--ink)"}}>Ungrouped</div>
                    </div>
                    <span style={{padding:"3px 8px",borderRadius:999,background:"var(--cream)",border:"1px solid var(--border)",fontSize:11,color:"var(--ink-soft)",fontWeight:700}}>{ungroupedIndexes.length}</span>
                  </div>

                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {ungroupedIndexes.map(index => (
                      <button
                        key={index}
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          toggleBulkStudent(index);
                        }}
                        style={{
                          display:"inline-flex",
                          alignItems:"center",
                          justifyContent:"center",
                          borderRadius:999,
                          background: bulkSelectedStudentIds.includes(index) ? "rgba(38,198,176,0.18)" : "var(--cream)",
                          border:"1.5px solid "+(bulkSelectedStudentIds.includes(index) ? "rgba(38,198,176,0.7)" : "var(--border)"),
                          color:"var(--ink-mid)",
                          fontSize:12,
                          fontWeight:700,
                          padding:"6px 10px",
                          cursor:"pointer",
                          transition:"all .15s ease",
                        }}
                      >
                        {sets[index]?.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <button className="action-btn" onClick={bulkPrintReports} style={{background:"var(--teal)",color:"#fff",justifyContent:"center",width:"100%",padding:"12px 18px",fontWeight:800}}>🖨 Print selected reports</button>
        </div>
      </Modal>
    </div>
  );
}

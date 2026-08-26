import { PALETTE, EMOJIS } from "./constants.js";

// Small, dependency-free helper functions shared across components: palette/emoji lookups,
// number clamping, chart-point sanitizing, date helpers, the URL-hash router, the confetti
// burst effect, on-track goal-line math, and HTML-escaping for print output.

const getPal   = i => PALETTE[i%PALETTE.length];
const getEmoji = n => EMOJIS[(n?.charCodeAt(0)??0)%EMOJIS.length];
const getStudentEmoji = student => student?.emoji?.trim() || getEmoji(student?.name ?? "");
const clamp    = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const sanitize = arr => (Array.isArray(arr)?arr:[]).map(p=>({...p,y:clamp(Number(p.y),0,100)})).sort((a,b)=>new Date(a.x)-new Date(b.x));
const todayStr = () => new Date().toISOString().split("T")[0];
// Attachments are scoped per-goal (chart.attachments) and the Accommodations tab has its own
// separate pool (student.accommodationAttachments) — a file uploaded to one goal, or to
// Accommodations, doesn't show up anywhere else.
// A prior version of this app pooled every goal's attachments into one shared, student-level
// list (student.attachments). This normalizer runs once per load: it makes sure every chart has
// its own `attachments` array, and — since a merged pool has no way to tell which goal a given
// file used to belong to — moves any leftover shared pool onto the Accommodations tab rather
// than silently dropping it, so nothing already-uploaded disappears.
const normalizeStudentAttachments = student => {
  const charts = Array.isArray(student.charts) ? student.charts : [];
  const { attachments: legacySharedPool, ...rest } = student;
  return {
    ...rest,
    accommodationAttachments: [
      ...(Array.isArray(student.accommodationAttachments) ? student.accommodationAttachments : []),
      ...(Array.isArray(legacySharedPool) ? legacySharedPool : []),
    ],
    charts: charts.map(c => ({ ...c, attachments: Array.isArray(c.attachments) ? c.attachments : [] })),
  };
};
const currentYear = () => new Date().getFullYear();

// Every student needs a stable id independent of their position in the `sets` array (array
// index shifts whenever a student earlier in the list is deleted). Attendance groups reference
// students by this id so group membership survives reordering/deletion elsewhere. Assigns one
// the first time a student is seen if it doesn't already have one.
const ensureStudentId = student =>
  student.sid ? student : { ...student, sid: `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` };

// Formats a 24-hour "HH:MM" value (what <input type="time"> gives/expects) as a friendly
// 12-hour string, e.g. "09:05" -> "9:05 AM". Returns "" for anything that isn't HH:MM.
const formatTime = hhmm => {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};

// URL hash acts as this app's "router" so the dashboard and a student's page are addressable as
// separate URLs — refreshing on a student page reloads back into that same page instead of
// bouncing to the dashboard, and the browser back/forward buttons move between the two.
// Format: "#/student/<studentIndex>/<tab>/<goalIndex>" or "#/dashboard".
const parseLocationHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "student") {
    return { view: "student", selSet: Number(parts[1]) || 0, activeTab: parts[2] || "goals", selChart: Number(parts[3]) || 0 };
  }
  return { view: "dashboard", selSet: 0, activeTab: "goals", selChart: 0 };
};
const buildLocationHash = (view, selSet, activeTab, selChart) =>
  view === "student" ? `#/student/${selSet}/${activeTab}/${selChart}` : "#/dashboard";

function burst(x,y,big=false) {
  const colors=["#ff6b6b","#26c6b0","#ffd166","#4e9af1","#a78bfa","#52c97a"];
  const n = big ? 30 : 12;
  for(let i=0;i<n;i++){
    const d=document.createElement("div");
    d.className="confetti-dot";
    const spread = big ? 160 : 80;
    d.style.left=(x+(Math.random()-.5)*spread)+"px";
    d.style.top=(y+(Math.random()-.5)*spread)+"px";
    d.style.background=colors[i%colors.length];
    d.style.animationDelay=(Math.random()*.2)+"s";
    if(big){d.style.width="10px";d.style.height="10px";}
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),1000);
  }
}

function parseISODate(value) {
  if (!value || typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// The goal is a trend line from (startDate, startValue) to (goalDate, goalValue) — not a flat
// threshold. This returns what the student *should* be at on a given date if they're on pace.
// Before the baseline date it's clamped to startValue; after the goal date it's clamped to goalValue.
// Returns null when there isn't a full, valid baseline→goal trend line configured — in that case
// there's nothing to compare against, so callers should skip flagging rather than fall back to a
// flat number.
function getOnTrackValue(chart, atDateStr) {
  const atDate = parseISODate(atDateStr);
  const startDate = parseISODate(chart?.startDate);
  const goalDate = parseISODate(chart?.goalDate);
  const hasTrendLine = atDate && startDate && goalDate && chart?.startValue != null && chart?.goalValue != null && startDate.getTime() <= goalDate.getTime();
  if (!hasTrendLine) return null;
  const span = goalDate.getTime() - startDate.getTime();
  const t = span === 0 ? 1 : (atDate.getTime() - startDate.getTime()) / span;
  const clampedT = Math.max(0, Math.min(1, t));
  return chart.startValue + clampedT * (chart.goalValue - chart.startValue);
}

// Escapes a string for safe interpolation into print HTML.
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));

export {
  getPal, getEmoji, getStudentEmoji, clamp, sanitize, todayStr,
  normalizeStudentAttachments, ensureStudentId, formatTime, currentYear, parseLocationHash, buildLocationHash,
  burst, parseISODate, getOnTrackValue, escapeHtml,
};

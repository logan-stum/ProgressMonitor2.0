import React, { useState, useRef, useEffect } from "react";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, TimeScale, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler);

// ─── Inject global styles ─────────────────────────────────────────────────────
const css = document.createElement("style");
css.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Nunito+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --font-head: 'Nunito', sans-serif;
    --font-body: 'Nunito Sans', sans-serif;
    --cream:    #fdf8f2;
    --paper:    #ffffff;
    --teal:     #26c6b0;
    --yellow:   #ffd166;
    --yellow-lt:#fffbec;
    --blue:     #4e9af1;
    --green:    #52c97a;
    --red:      #ff6b6b;
    --ink:      #2d2d3a;
    --ink-mid:  #5a5a72;
    --ink-soft: #9898b0;
    --border:   #ede8e0;
    --shadow-sm: 0 1px 3px rgba(45,45,58,.07), 0 1px 2px rgba(45,45,58,.05);
    --shadow:    0 4px 12px rgba(45,45,58,.10);
    --shadow-lg: 0 8px 28px rgba(45,45,58,.14);
    --r: 12px; --r-sm: 8px; --r-lg: 18px;
  }
  body { font-family: var(--font-body); background: var(--cream); color: var(--ink); min-height:100vh; display:block; }
  input, textarea {
    font-family: var(--font-body); color: var(--ink); background: var(--paper);
    border: 2px solid var(--border); border-radius: var(--r-sm);
    padding: 8px 12px; font-size: 14px; outline: none; width: 100%;
    transition: border-color .15s, box-shadow .15s;
  }
  input:focus, textarea:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(38,198,176,.15); }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius:99px; }
  @keyframes popIn  { 0%{opacity:0;transform:scale(.92) translateY(6px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes fadeUp { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes confetti { 0%{opacity:1;transform:scale(1) rotate(0deg)} 100%{opacity:0;transform:scale(0) rotate(200deg) translateY(-40px)} }
  .card-appear { animation: popIn .22s cubic-bezier(.34,1.56,.64,1) both; }
  .fade-up     { animation: fadeUp .2s ease both; }
  .action-btn  { display:inline-flex; align-items:center; gap:5px; padding:9px 18px; border-radius:99px; font-family:var(--font-head); font-weight:700; font-size:13px; cursor:pointer; border:none; transition:all .15s; box-shadow:var(--shadow-sm); }
  .action-btn:hover  { transform:translateY(-1px); box-shadow:var(--shadow); }
  .action-btn:active { transform:translateY(0); }
  .ghost-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 12px; border-radius:99px; font-family:var(--font-head); font-weight:600; font-size:12px; cursor:pointer; border:2px solid var(--border); background:transparent; color:var(--ink-mid); transition:all .15s; }
  .ghost-btn:hover    { border-color:var(--ink-soft); color:var(--ink); }
  .ghost-btn:disabled { opacity:.4; cursor:not-allowed; }
  .log-row { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px dashed var(--border); animation:fadeUp .15s ease both; }
  .log-row:last-child { border-bottom:none; }
  .stat-card { background:var(--paper); border-radius:var(--r-lg); padding:16px 20px; box-shadow:var(--shadow-sm); border:2px solid var(--border); display:flex; flex-direction:column; gap:4px; transition:box-shadow .15s, transform .15s; }
  .stat-card:hover { box-shadow:var(--shadow); transform:translateY(-1px); }
  .confetti-dot { position:fixed; pointer-events:none; width:8px; height:8px; border-radius:2px; animation:confetti .65s ease forwards; }
  .tab-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:99px; font-family:var(--font-head); font-weight:700; font-size:13px; cursor:pointer; border:2px solid transparent; background:transparent; color:var(--ink-mid); transition:all .15s; }
  .tab-btn:hover { color:var(--ink); background:var(--cream); }
  .tab-btn.active { background:var(--paper); color:var(--ink); border-color:var(--border); box-shadow:var(--shadow-sm); }
  .acc-status-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border-radius:99px; font-family:var(--font-head); font-weight:700; font-size:12px; cursor:pointer; border:2px solid; transition:all .15s; background:transparent; }
  .acc-status-btn:hover { transform:translateY(-1px); }
  .cal-day { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:var(--font-head); font-weight:700; font-size:13px; cursor:pointer; border:2px solid transparent; transition:all .15s; position:relative; }
  .cal-day:hover { background:var(--cream); border-color:var(--border); }
  .cal-day.today { border-color:var(--teal) !important; color:var(--teal); }
  .cal-day.has-data { border-color: var(--border) !important; }
  .cal-day.selected { background:var(--teal) !important; color:#fff !important; border-color:var(--teal) !important; }
  .cal-day.other-month { opacity:.3; cursor:default; }
`;
document.head.appendChild(css);

// ─── Constants ────────────────────────────────────────────────────────────────
const PALETTE = [
  { bg:"#fff0f0", border:"#ff6b6b", text:"#c0392b", chip:"#ff6b6b" },
  { bg:"#e8faf7", border:"#26c6b0", text:"#1a8a7a", chip:"#26c6b0" },
  { bg:"#eef5ff", border:"#4e9af1", text:"#2362b8", chip:"#4e9af1" },
  { bg:"#fffbec", border:"#ffd166", text:"#9a6a00", chip:"#e6a817" },
  { bg:"#f3f0ff", border:"#a78bfa", text:"#6d28d9", chip:"#a78bfa" },
  { bg:"#edfdf5", border:"#52c97a", text:"#1e7a45", chip:"#52c97a" },
];
const EMOJIS = ["🌟","🎯","🚀","💡","🎓","🌈","⚡","🦋","🔥","🏆"];
const MONTHS  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const getPal   = i => PALETTE[i % PALETTE.length];
const getEmoji = n => EMOJIS[(n?.charCodeAt(0) ?? 0) % EMOJIS.length];
const clamp    = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const sanitize = arr => (Array.isArray(arr)?arr:[]).map(p=>({...p,y:clamp(Number(p.y),0,100)})).sort((a,b)=>new Date(a.x)-new Date(b.x));
const todayStr = () => new Date().toISOString().split("T")[0];

function burst(x, y) {
  const colors = ["#ff6b6b","#26c6b0","#ffd166","#4e9af1","#a78bfa","#52c97a"];
  for (let i = 0; i < 12; i++) {
    const d = document.createElement("div");
    d.className = "confetti-dot";
    d.style.left = (x+(Math.random()-.5)*80)+"px";
    d.style.top  = (y+(Math.random()-.5)*80)+"px";
    d.style.background = colors[i%colors.length];
    d.style.animationDelay = (Math.random()*.15)+"s";
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),900);
  }
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--ink-soft)", marginBottom:5 }}>{children}</div>;
}

function Ring({ pct, color, size=54 }) {
  const r=size/2-6, circ=2*Math.PI*r, dash=(clamp(pct,0,100)/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:"stroke-dasharray .5s ease" }}/>
    </svg>
  );
}

function Modal({ show, onClose, title, emoji, children, wide }) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(45,45,58,.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(6px)" }}>
      <div onClick={e=>e.stopPropagation()} className="card-appear" style={{ background:"var(--paper)", borderRadius:"var(--r-lg)", boxShadow:"var(--shadow-lg)", padding:28, minWidth: wide?520:360, maxWidth: wide?620:500, width:"92%", border:"2px solid var(--border)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {emoji && <span style={{ fontSize:22 }}>{emoji}</span>}
            <h3 style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:17 }}>{title}</h3>
          </div>
          <button onClick={onClose} className="ghost-btn" style={{ padding:"4px 10px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Calendar component ───────────────────────────────────────────────────────
function Calendar({ year, month, onSelectDay, accDays, selectedDay }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = todayStr();
  const cells = [];

  // Leading blanks from previous month
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay-1; i >= 0; i--) {
    cells.push({ day: prevDays-i, cur: false });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length-firstDay-daysInMonth+1, cur: false });

  return (
    <div>
      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontFamily:"var(--font-head)", fontWeight:800, fontSize:11, color:"var(--ink-soft)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{d}</div>)}
      </div>
      {/* Day cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((c, i) => {
          if (!c.cur) return <div key={i} className="cal-day other-month">{c.day}</div>;
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(c.day).padStart(2,"0")}`;
          const isToday    = dateStr === today;
          const hasData    = !!accDays?.[dateStr];
          const isSelected = dateStr === selectedDay;
          // Build mini summary for this day
          const dayEntry = accDays?.[dateStr];
          let counts = null;
          if (dayEntry) {
            const vals = Object.values(dayEntry);
            counts = {
              given:     vals.filter(v=>v==="given").length,
              refused:   vals.filter(v=>v==="refused").length,
              not_given: vals.filter(v=>v==="not_given").length,
              absent:    vals.filter(v=>v==="absent").length,
            };
          }
          return (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <div
                className={`cal-day${isToday?" today":""}${hasData?" has-data":""}${isSelected?" selected":""}`}
                onClick={() => onSelectDay(dateStr)}
                style={{ marginBottom: 0 }}
              >
                {c.day}
              </div>
              {counts && (
                <div style={{ display:"flex", gap:2, flexWrap:"wrap", justifyContent:"center", minHeight:14 }}>
                  {counts.given     > 0 && <span style={{ width:6, height:6, borderRadius:"50%", background:"#52c97a", display:"inline-block" }} title={`${counts.given} given`}/>}
                  {counts.refused   > 0 && <span style={{ width:6, height:6, borderRadius:"50%", background:"#ff6b6b", display:"inline-block" }} title={`${counts.refused} refused`}/>}
                  {counts.not_given > 0 && <span style={{ width:6, height:6, borderRadius:"50%", background:"#9898b0", display:"inline-block" }} title={`${counts.not_given} not given`}/>}
                  {counts.absent    > 0 && <span style={{ width:6, height:6, borderRadius:"50%", background:"#a78bfa", display:"inline-block" }} title={`${counts.absent} absent`}/>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Accommodations Tab ───────────────────────────────────────────────────────
function AccommodationsTab({ student, selSet, upd }) {
  const accList  = student?.accommodations ?? [];       // [{id, name}]
  const accDays  = student?.accDays ?? {};              // { "2025-01-15": { accId: "given"|"refused"|"not_given" } }

  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selDay,   setSelDay]   = useState(null);
  const [showSetup,  setShowSetup]  = useState(false);
  const [showDayPop, setShowDayPop] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [setupInput, setSetupInput] = useState("");
  const [setupList,  setSetupList]  = useState([]);
  const [editList,   setEditList]   = useState([]);
  const [newAccName, setNewAccName] = useState("");

  // First visit: prompt setup if no accommodations yet
  useEffect(() => {
    if (accList.length === 0) setShowSetup(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selSet]);

  const saveSetup = () => {
    const items = setupList.filter(s=>s.trim()).map(name=>({ id: Date.now()+Math.random(), name:name.trim() }));
    if (!items.length) return;
    upd(d => { d[selSet].accommodations = items; });
    setShowSetup(false);
    setSetupList([]);
    setSetupInput("");
  };

  const openDay = (dateStr) => {
    setSelDay(dateStr);
    setShowDayPop(true);
  };

  const setStatus = (dateStr, accId, status) => {
    upd(d => {
      if (!d[selSet].accDays) d[selSet].accDays = {};
      if (!d[selSet].accDays[dateStr]) d[selSet].accDays[dateStr] = {};
      d[selSet].accDays[dateStr][accId] = status;
    });
  };

  const openEdit = () => {
    setEditList(accList.map(a=>({...a})));
    setShowEdit(true);
  };

  const saveEdit = () => {
    const cleaned = editList.filter(a=>a.name.trim()).map(a=>({...a, name:a.name.trim()}));
    upd(d => { d[selSet].accommodations = cleaned; });
    setShowEdit(false);
  };

  const addToEditList = () => {
    if (!newAccName.trim()) return;
    setEditList(l=>[...l, { id: Date.now()+Math.random(), name: newAccName.trim() }]);
    setNewAccName("");
  };

  const dayData  = selDay ? (accDays[selDay] ?? {}) : {};
  const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
  const nextMonth = () => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };

  const STATUS_CONFIG = {
    given:     { label:"Given",     icon:"✓", color:"#52c97a", bg:"#edfdf5", border:"#52c97a" },
    refused:   { label:"Refused",   icon:"✗", color:"#ff6b6b", bg:"#fff0f0", border:"#ff6b6b" },
    not_given: { label:"Not Given", icon:"—", color:"#9898b0", bg:"#f4f4f8", border:"#c8c8d8" },
    absent:    { label:"Absent",    icon:"☁", color:"#a78bfa", bg:"#f3f0ff", border:"#a78bfa" },
  };

  // Summary stats for the current month
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  let givenCount=0, totalPossible=0;
  for (let d=1; d<=daysInMonth; d++) {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (accDays[ds]) {
      Object.values(accDays[ds]).forEach(s => { totalPossible++; if(s==="given") givenCount++; });
    }
  }

  return (
    <div style={{ flex:1, overflow:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:"var(--font-head)", fontWeight:900, fontSize:18 }}>🛠 Accommodations</div>
          <div style={{ fontSize:12, color:"var(--ink-soft)", marginTop:2 }}>
            {accList.length===0 ? "No accommodations set up yet" : `${accList.length} accommodation${accList.length!==1?"s":""} for ${student?.name}`}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="ghost-btn" onClick={openEdit}>✏️ Edit Accommodations</button>
          {accList.length===0 && <button className="action-btn" onClick={()=>setShowSetup(true)} style={{ background:"var(--teal)", color:"#fff" }}>+ Set Up</button>}
        </div>
      </div>

      {accList.length > 0 ? (
        <>
          {/* Month summary chips */}
          {totalPossible > 0 && (
            <div className="fade-up" style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {[
                { label:`${givenCount} Given`,               color:"#52c97a", bg:"#edfdf5" },
                { label:`${totalPossible-givenCount} Other`, color:"#9898b0", bg:"#f4f4f8" },
                { label:`${accList.length} Accommodations`,  color:"#4e9af1", bg:"#eef5ff" },
              ].map(({label,color,bg})=>(
                <div key={label} style={{ padding:"5px 14px", borderRadius:99, background:bg, color, fontFamily:"var(--font-head)", fontWeight:700, fontSize:12, border:`1.5px solid ${color}44` }}>{label}</div>
              ))}
            </div>
          )}

          {/* Calendar */}
          <div style={{ background:"var(--paper)", borderRadius:"var(--r-lg)", border:"2px solid var(--border)", padding:"20px", boxShadow:"var(--shadow-sm)" }}>
            {/* Month nav */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <button className="ghost-btn" onClick={prevMonth} style={{ padding:"5px 12px" }}>‹</button>
              <div style={{ fontFamily:"var(--font-head)", fontWeight:900, fontSize:16 }}>{MONTHS[calMonth]} {calYear}</div>
              <button className="ghost-btn" onClick={nextMonth} style={{ padding:"5px 12px" }}>›</button>
            </div>
            <Calendar year={calYear} month={calMonth} onSelectDay={openDay} accDays={accDays} selectedDay={selDay}/>
            <div style={{ marginTop:14, fontSize:12, color:"var(--ink-soft)", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"var(--teal)" }}/>
              Days with logged accommodations — click any day to view or log
            </div>
          </div>

          {/* Accommodation list reference */}
          <div style={{ background:"var(--paper)", borderRadius:"var(--r-lg)", border:"2px solid var(--border)", padding:"18px", boxShadow:"var(--shadow-sm)" }}>
            <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:14, marginBottom:12 }}>📋 Accommodation List</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {accList.map((a,i) => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--cream)", borderRadius:8, border:"1.5px solid var(--border)" }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--teal)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-head)", fontWeight:800, fontSize:11, flexShrink:0 }}>{i+1}</div>
                  <span style={{ fontSize:13, fontWeight:600 }}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ background:"var(--paper)", borderRadius:"var(--r-lg)", border:"2px dashed var(--border)", padding:"48px 24px", textAlign:"center", boxShadow:"var(--shadow-sm)" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🛠</div>
          <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:16, marginBottom:6 }}>No accommodations yet</div>
          <div style={{ fontSize:13, color:"var(--ink-soft)", marginBottom:20, maxWidth:340, margin:"0 auto 20px" }}>Set up this student's accommodations once and they'll be available to log every day.</div>
          <button className="action-btn" onClick={()=>setShowSetup(true)} style={{ background:"var(--teal)", color:"#fff" }}>+ Set Up Accommodations</button>
        </div>
      )}

      {/* ── First-time Setup Modal ── */}
      <Modal show={showSetup} onClose={()=>setShowSetup(false)} title="Set Up Accommodations" emoji="🛠" wide>
        <div style={{ fontSize:13, color:"var(--ink-mid)", marginBottom:16 }}>
          Enter each accommodation for <strong>{student?.name}</strong>. These will appear every day when you log.
        </div>
        {/* Quick-add via enter */}
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <input
            type="text"
            placeholder="Type an accommodation and press Enter…"
            value={setupInput}
            onChange={e=>setSetupInput(e.target.value)}
            onKeyDown={e=>{
              if(e.key==="Enter"&&setupInput.trim()){
                setSetupList(l=>[...l,setupInput.trim()]);
                setSetupInput("");
              }
            }}
            autoFocus
          />
          <button className="action-btn" onClick={()=>{ if(setupInput.trim()){setSetupList(l=>[...l,setupInput.trim()]);setSetupInput("");}}} style={{ background:"var(--teal)", color:"#fff", flexShrink:0 }}>Add</button>
        </div>
        {setupList.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
            {setupList.map((s,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", background:"var(--cream)", borderRadius:8, border:"1.5px solid var(--border)" }}>
                <span style={{ flex:1, fontSize:13, fontWeight:600 }}>{s}</span>
                <button onClick={()=>setSetupList(l=>l.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--ink-soft)", fontSize:14 }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button className="ghost-btn" onClick={()=>setShowSetup(false)}>Skip for now</button>
          <button className="action-btn" onClick={saveSetup} disabled={setupList.length===0} style={{ background:"var(--teal)", color:"#fff", opacity:setupList.length===0?.5:1 }}>Save Accommodations ✓</button>
        </div>
      </Modal>

      {/* ── Edit Accommodations Modal ── */}
      <Modal show={showEdit} onClose={()=>setShowEdit(false)} title="Edit Accommodations" emoji="✏️" wide>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
          {editList.map((a,i)=>(
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input
                type="text"
                value={a.name}
                onChange={e=>setEditList(l=>l.map((x,j)=>j===i?{...x,name:e.target.value}:x))}
                style={{ flex:1 }}
              />
              <button onClick={()=>setEditList(l=>l.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--red)", fontSize:16, flexShrink:0 }}>✕</button>
            </div>
          ))}
        </div>
        {/* Add new */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <input type="text" placeholder="Add another accommodation…" value={newAccName} onChange={e=>setNewAccName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addToEditList()}/>
          <button className="action-btn" onClick={addToEditList} style={{ background:"var(--teal)", color:"#fff", flexShrink:0 }}>Add</button>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button className="ghost-btn" onClick={()=>setShowEdit(false)}>Cancel</button>
          <button className="action-btn" onClick={saveEdit} style={{ background:"var(--teal)", color:"#fff" }}>Save Changes ✓</button>
        </div>
      </Modal>

      {/* ── Day Pop-up Modal ── */}
      <Modal show={showDayPop} onClose={()=>setShowDayPop(false)} title={selDay ? new Date(selDay+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}) : ""} emoji="📅" wide>
        {accList.length === 0 ? (
          <div style={{ textAlign:"center", padding:"20px 0", color:"var(--ink-soft)", fontSize:13 }}>No accommodations set up yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {accList.map(acc => {
              const status = dayData[acc.id] ?? "given";
              return (
                <div key={acc.id} style={{ background:"var(--cream)", borderRadius:10, padding:"12px 14px", border:"1.5px solid var(--border)" }}>
                  <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:13, marginBottom:10 }}>{acc.name}</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg])=>(
                      <button
                        key={key}
                        className="acc-status-btn"
                        onClick={()=>setStatus(selDay, acc.id, key)}
                        style={{
                          borderColor: cfg.border,
                          color: status===key ? "#fff" : cfg.color,
                          background: status===key ? cfg.color : "transparent",
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
              <button className="action-btn" onClick={()=>setShowDayPop(false)} style={{ background:"var(--teal)", color:"#fff" }}>Done ✓</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [sets, setSets] = useState(() => {
    try {
      const s = localStorage.getItem("pm_v2");
      return s ? JSON.parse(s) : [{
        name:"Alex Johnson", collapsed:false,
        accommodations: [],
        accDays: {},
        charts:[{ name:"Reading Fluency", startValue:40, startDate:"", goalValue:90, goalDate:"", data:[], notes:"", attachments:[] }],
      }];
    } catch { return []; }
  });

  const [selSet,   setSelSet]   = useState(0);
  const [selChart, setSelChart] = useState(0);
  const [activeTab, setActiveTab] = useState("goals"); // "goals" | "accommodations"
  const [newVal,   setNewVal]   = useState("");
  const [newDate,  setNewDate]  = useState(todayStr);
  const [newNote,  setNewNote]  = useState("");
  const [history,  setHistory]  = useState([]);
  const [editPt,   setEditPt]   = useState(null);
  const [showAtt,  setShowAtt]  = useState(false);
  const [showAS,   setShowAS]   = useState(false);
  const [showAG,   setShowAG]   = useState(false);
  const [newSName, setNewSName] = useState("");
  const [newGName, setNewGName] = useState("");
  const chartRef = useRef(null);

  const student = sets[selSet];
  const chart   = student?.charts?.[selChart] ?? null;

  useEffect(() => { localStorage.setItem("pm_v2", JSON.stringify(sets)); }, [sets]);

  const snap = () => setHistory(h => { const n=[...h, JSON.stringify(sets)]; if(n.length>20)n.shift(); return n; });
  const undo = () => { if(!history.length)return; setHistory(h=>h.slice(0,-1)); setSets(JSON.parse(history[history.length-1])); };
  const upd  = fn => setSets(prev => { const next=JSON.parse(JSON.stringify(prev)); fn(next); return next; });

  const addPoint = e => {
    if (!newVal||!newDate||!chart) return;
    snap();
    upd(d => {
      d[selSet].charts[selChart].data.push({ x:newDate, y:clamp(Number(newVal),0,100), notes:newNote });
      d[selSet].charts[selChart].data = sanitize(d[selSet].charts[selChart].data);
    });
    if(e?.clientX) burst(e.clientX, e.clientY);
    setNewVal(""); setNewDate(todayStr()); setNewNote("");
  };

  const saveEdit = () => {
    if(!editPt) return; snap();
    upd(d => {
      d[selSet].charts[selChart].data[editPt.idx] = { x:editPt.x, y:clamp(Number(editPt.y),0,100), notes:editPt.notes };
      d[selSet].charts[selChart].data = sanitize(d[selSet].charts[selChart].data);
    });
    setEditPt(null);
  };

  const addStudent = () => {
    if(!newSName.trim()) return;
    upd(d => d.push({ name:newSName.trim(), collapsed:false, accommodations:[], accDays:{}, charts:[] }));
    setSelSet(sets.length); setSelChart(0); setActiveTab("goals"); setNewSName(""); setShowAS(false);
  };

  const addGoal = () => {
    if(!newGName.trim()) return;
    upd(d => d[selSet].charts.push({ name:newGName.trim(), startValue:0, startDate:"", goalValue:100, goalDate:"", data:[], notes:"", attachments:[] }));
    setSelChart(student.charts.length); setNewGName(""); setShowAG(false);
  };

  const exportJSON = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(sets,null,2)],{type:"application/json"}));
    a.download = "progress-data.json"; a.click();
  };

  const importJSON = e => {
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{ try{ const d=JSON.parse(ev.target.result); if(Array.isArray(d)){setSets(d);setSelSet(0);setSelChart(0);} else alert("Invalid file"); }catch{ alert("Couldn't read that file"); } };
    r.readAsText(f);
  };

  const pts    = chart?.data ?? [];
  const latest = pts[pts.length-1];
  const goalPct = latest && chart?.goalValue ? Math.round((latest.y/chart.goalValue)*100) : null;
  const trend   = pts.length>=2 ? (pts[pts.length-1].y-pts[pts.length-2].y).toFixed(1) : null;
  const pal     = getPal(selSet);

  const chartData = {
    datasets: [
      { label:chart?.name??"Progress", data:pts, borderColor:pal.chip, backgroundColor:pal.chip+"22", tension:0.35, fill:true, pointRadius:6, pointHoverRadius:9, pointBackgroundColor:pal.chip, pointBorderColor:"#fff", pointBorderWidth:2, pointHitRadius:14 },
      chart?.startDate&&chart?.goalDate&&{ label:"🎯 Target", data:[{x:chart.startDate,y:chart.startValue},{x:chart.goalDate,y:chart.goalValue}], borderColor:"#52c97a", borderDash:[6,4], borderWidth:2, fill:false, pointRadius:4, pointBackgroundColor:"#52c97a" },
    ].filter(Boolean),
  };

  const chartOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{ labels:{ color:"#5a5a72", font:{family:"'Nunito',sans-serif",size:12,weight:"700"}, boxWidth:14, padding:16 } },
      tooltip:{ backgroundColor:"#2d2d3a", titleColor:"#fff", bodyColor:"#9898b0", padding:12, cornerRadius:10, titleFont:{family:"'Nunito',sans-serif",weight:"800"}, bodyFont:{family:"'Nunito Sans',sans-serif",size:12}, callbacks:{ label:ctx=>` ${ctx.parsed.y}%${ctx.raw?.notes?`  · ${ctx.raw.notes}`:""}` } },
    },
    scales:{
      x:{ type:"time", time:{unit:"day",tooltipFormat:"MMM d, yyyy"}, grid:{color:"rgba(0,0,0,0.04)"}, ticks:{color:"#9898b0",font:{family:"'Nunito Sans'",size:11}} },
      y:{ min:0, max:100, grid:{color:"rgba(0,0,0,0.04)"}, ticks:{color:"#9898b0",font:{family:"'Nunito'",size:11},callback:v=>v+"%"} },
    },
    onClick:(evt,els)=>{
      if(!(evt?.native?.ctrlKey||evt?.native?.metaKey)) return;
      if(els?.length&&window.confirm("Delete this point?")){ snap(); upd(d=>d[selSet].charts[selChart].data.splice(els[0].index,1)); }
    },
  };

  // When switching students reset tab
  const handleSelectStudent = (si) => { setSelSet(si); setSelChart(0); setActiveTab("goals"); };

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden", background:"var(--cream)" }}>

      {/* SIDEBAR */}
      <div style={{ width:272, flexShrink:0, background:"var(--paper)", borderRight:"2px solid var(--border)", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
        <div style={{ padding:"20px 18px 14px", borderBottom:"2px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:"linear-gradient(135deg,#26c6b0,#4e9af1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📈</div>
            <div>
              <div style={{ fontFamily:"var(--font-head)", fontWeight:900, fontSize:15 }}>Progress Monitor</div>
              <div style={{ fontSize:11, color:"var(--ink-soft)" }}>Track every win ✨</div>
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
          <SectionLabel>Students</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {sets.map((s, si) => {
              const p = getPal(si);
              const isActive = selSet===si;
              return (
                <div key={si} style={{ borderRadius:"var(--r)", border:`2px solid ${isActive?p.border:"var(--border)"}`, overflow:"hidden", transition:"border-color .15s" }}>
                  <div onClick={()=>handleSelectStudent(si)} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px", background:isActive?p.bg:"transparent", cursor:"pointer", transition:"background .15s" }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${p.chip},${p.chip}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{getEmoji(s.name)}</div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:13, color:isActive?p.text:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                      <div style={{ fontSize:11, color:"var(--ink-soft)" }}>{s.charts.length} goal{s.charts.length!==1?"s":""}</div>
                    </div>
                    <div style={{ display:"flex", gap:1 }}>
                      <button onClick={e=>{e.stopPropagation();const n=prompt("Name:",s.name);if(n)upd(d=>d[si].name=n);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, opacity:.45, padding:"2px" }}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();if(window.confirm("Remove student?")){upd(d=>d.splice(si,1));setSelSet(0);setSelChart(0);}}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, opacity:.45, padding:"2px" }}>🗑️</button>
                    </div>
                  </div>
                  {isActive && (
                    <div style={{ background:p.bg, padding:"4px 10px 10px 50px", display:"flex", flexDirection:"column", gap:4 }}>
                      {s.charts.map((c,ci)=>{
                        const isAC = activeTab==="goals" && selChart===ci;
                        return (
                          <div key={ci} onClick={()=>{setSelChart(ci);setActiveTab("goals");}} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 10px", borderRadius:99, background:isAC?p.chip:"transparent", border:`1.5px solid ${isAC?p.chip:p.border+"55"}`, cursor:"pointer", transition:"all .15s" }}>
                            <span style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:12, color:isAC?"#fff":p.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{c.name}</span>
                            <div style={{ display:"flex", gap:1 }}>
                              <button onClick={e=>{e.stopPropagation();const n=prompt("Goal:",c.name);if(n)upd(d=>d[si].charts[ci].name=n);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, opacity:isAC?.75:.35, padding:"1px 2px", color:isAC?"#fff":"inherit" }}>✏️</button>
                              <button onClick={e=>{e.stopPropagation();if(window.confirm("Delete goal?")){upd(d=>d[si].charts.splice(ci,1));setSelChart(0);}}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, opacity:isAC?.75:.35, padding:"1px 2px", color:isAC?"#fff":"inherit" }}>✕</button>
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={()=>setShowAG(true)} style={{ background:"none", border:`1.5px dashed ${p.border}88`, borderRadius:99, color:p.text, fontSize:11, fontFamily:"var(--font-head)", fontWeight:700, padding:"4px 10px", marginTop:2, cursor:"pointer", alignSelf:"flex-start" }}>+ Goal</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding:"12px", borderTop:"2px solid var(--border)", display:"flex", flexDirection:"column", gap:7 }}>
          <button className="action-btn" onClick={()=>setShowAS(true)} style={{ background:"var(--teal)", color:"#fff", justifyContent:"center", width:"100%" }}>+ Add Student</button>
          <div style={{ display:"flex", gap:6 }}>
            <button className="ghost-btn" onClick={exportJSON} style={{ flex:1, justifyContent:"center" }}>↓ Export</button>
            <label className="ghost-btn" style={{ flex:1, justifyContent:"center", cursor:"pointer" }}>↑ Import<input type="file" accept=".json" onChange={importJSON} style={{ display:"none" }}/></label>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {student ? (
          <>
            {/* Topbar with tabs */}
            <div style={{ padding:"12px 22px 0", background:"var(--paper)", borderBottom:"2px solid var(--border)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:19 }}>{getEmoji(student?.name??"")}</span>
                  <span style={{ fontFamily:"var(--font-head)", fontWeight:900, fontSize:19 }}>{student?.name}</span>
                  {activeTab==="goals" && chart && (
                    <>
                      <span style={{ color:"var(--ink-soft)", fontSize:15 }}>›</span>
                      <span style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:15, color:pal.text }}>{chart.name}</span>
                    </>
                  )}
                </div>
                {activeTab==="goals" && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="ghost-btn" onClick={undo} disabled={!history.length}>↩ Undo</button>
                    <button className="ghost-btn" onClick={()=>setShowAtt(true)}>📎 Files</button>
                  </div>
                )}
              </div>
              {/* Tab switcher */}
              <div style={{ display:"flex", gap:4, paddingBottom:12 }}>
                <button className={`tab-btn${activeTab==="goals"?" active":""}`} onClick={()=>setActiveTab("goals")}>📊 Goals</button>
                <button className={`tab-btn${activeTab==="accommodations"?" active":""}`} onClick={()=>setActiveTab("accommodations")}>🛠 Accommodations</button>
              </div>
            </div>

            {/* Tab content */}
            {activeTab==="accommodations" ? (
              <AccommodationsTab student={student} selSet={selSet} upd={upd}/>
            ) : chart ? (
              <div style={{ flex:1, overflow:"auto", padding:"18px 22px", display:"flex", flexDirection:"column", gap:16 }}>
                {latest && (
                  <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                    {[
                      { label:"Latest Score",     val:`${latest.y}%`,                  sub:latest.x,                                                                color:pal.chip,  pct:latest.y },
                      { label:"Goal Target",      val:`${chart.goalValue}%`,            sub:chart.goalDate||"No target date",                                       color:"#52c97a", pct:chart.goalValue },
                      { label:"Progress to Goal", val:goalPct!=null?`${goalPct}%`:"—", sub:trend!=null?(Number(trend)>=0?`▲ +${trend}% from last`:`▼ ${trend}% from last`):"Need more data", color:goalPct>=100?"#52c97a":"#ffd166", pct:goalPct??0 },
                    ].map(({label,val,sub,color,pct})=>(
                      <div key={label} className="stat-card">
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <div style={{ fontFamily:"var(--font-head)", fontWeight:900, fontSize:26 }}>{val}</div>
                          <Ring pct={pct} color={color} size={52}/>
                        </div>
                        <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-soft)" }}>{label}</div>
                        <div style={{ fontSize:11, color:"var(--ink-soft)" }}>{sub}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ background:"var(--paper)", borderRadius:"var(--r-lg)", border:"2px solid var(--border)", padding:"16px", boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:14 }}>Progress Chart</div>
                    <div style={{ fontSize:11, color:"var(--ink-soft)" }}>Ctrl+click a point to delete</div>
                  </div>
                  <div style={{ height:240 }}><Line ref={chartRef} data={chartData} options={chartOpts}/></div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div style={{ background:"var(--paper)", borderRadius:"var(--r-lg)", border:"2px solid var(--border)", padding:"18px", boxShadow:"var(--shadow-sm)" }}>
                    <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:14, marginBottom:14 }}>📝 Log Session</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div>
                          <SectionLabel>Accuracy %</SectionLabel>
                          <input type="number" min={0} max={100} placeholder="0–100" value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPoint(e)} style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:18, textAlign:"center" }}/>
                        </div>
                        <div>
                          <SectionLabel>Date</SectionLabel>
                          <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}/>
                        </div>
                      </div>
                      <div>
                        <SectionLabel>Session Note</SectionLabel>
                        <input type="text" placeholder="What went well? Any observations…" value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPoint(e)}/>
                      </div>
                      <button className="action-btn" onClick={addPoint} style={{ background:pal.chip, color:"#fff", justifyContent:"center", width:"100%", fontSize:14, padding:"11px 18px" }}>✦ Add Data Point</button>
                    </div>
                    <div style={{ marginTop:16, paddingTop:14, borderTop:"1px dashed var(--border)" }}>
                      <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:11, color:"var(--ink-soft)", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.07em" }}>🎯 Goal Setup</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {[
                          {label:"Baseline %",    val:chart.startValue, key:"startValue", type:"number"},
                          {label:"Baseline Date", val:chart.startDate,  key:"startDate",  type:"date"},
                          {label:"Goal %",        val:chart.goalValue,  key:"goalValue",  type:"number"},
                          {label:"Goal Date",     val:chart.goalDate,   key:"goalDate",   type:"date"},
                        ].map(({label,val,key,type})=>(
                          <div key={key}>
                            <SectionLabel>{label}</SectionLabel>
                            <input type={type} value={val||""} onChange={e=>upd(d=>d[selSet].charts[selChart][key]=type==="number"?Number(e.target.value):e.target.value)} style={{ fontSize:13 }}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div style={{ background:"var(--paper)", borderRadius:"var(--r-lg)", border:"2px solid var(--border)", padding:"18px", boxShadow:"var(--shadow-sm)", flex:1 }}>
                      <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:14, marginBottom:12 }}>📋 Session Log</div>
                      <div style={{ maxHeight:185, overflowY:"auto" }}>
                        {pts.length===0 ? (
                          <div style={{ textAlign:"center", padding:"24px 0", color:"var(--ink-soft)", fontSize:13 }}>
                            <div style={{ fontSize:30, marginBottom:6 }}>🌱</div>No sessions yet!
                          </div>
                        ) : [...pts].reverse().map((pt,i)=>{
                          const realIdx=pts.length-1-i;
                          return (
                            <div key={i} className="log-row">
                              <div style={{ width:44, textAlign:"right", fontFamily:"var(--font-head)", fontWeight:900, fontSize:14, color:pal.chip, flexShrink:0 }}>{pt.y}%</div>
                              <div style={{ flex:1, overflow:"hidden" }}>
                                <div style={{ fontSize:12, fontWeight:600 }}>{pt.x}</div>
                                {pt.notes && <div style={{ fontSize:11, color:"var(--ink-soft)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pt.notes}</div>}
                              </div>
                              <button className="ghost-btn" onClick={()=>setEditPt({idx:realIdx,x:pt.x,y:pt.y,notes:pt.notes||""})} style={{ padding:"3px 8px", fontSize:11 }}>Edit</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ background:"var(--yellow-lt)", borderRadius:"var(--r-lg)", border:"2px solid #ffd166", padding:"16px", boxShadow:"var(--shadow-sm)" }}>
                      <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:13, marginBottom:8, color:"#9a6a00" }}>🗒 Goal Notes</div>
                      <textarea value={chart.notes} onChange={e=>upd(d=>d[selSet].charts[selChart].notes=e.target.value)} placeholder="Strategies, parent notes, observations…" style={{ resize:"none", height:80, fontSize:13, background:"rgba(255,255,255,.6)", border:"1.5px solid #ffd16699" }}/>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"var(--ink-soft)" }}>
                <div style={{ fontSize:36 }}>📊</div>
                <p style={{ fontSize:14 }}>Add a goal from the sidebar to get started.</p>
                <button className="action-btn" onClick={()=>setShowAG(true)} style={{ background:pal.chip, color:"#fff" }}>+ Add Goal</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, padding:40 }}>
            <div style={{ fontSize:56 }}>🎒</div>
            <div style={{ fontFamily:"var(--font-head)", fontWeight:900, fontSize:22 }}>Welcome to Progress Monitor!</div>
            <div style={{ fontSize:14, color:"var(--ink-soft)", textAlign:"center", maxWidth:360 }}>Select a student from the sidebar or add your first one to get started.</div>
            <button className="action-btn" onClick={()=>setShowAS(true)} style={{ background:"var(--teal)", color:"#fff", fontSize:15, padding:"12px 28px", marginTop:6 }}>+ Add Your First Student</button>
          </div>
        )}
      </div>

      {/* MODALS */}
      <Modal show={showAS} onClose={()=>setShowAS(false)} title="Add Student" emoji="🎒">
        <SectionLabel>Student Name</SectionLabel>
        <input type="text" placeholder="e.g. Jordan Smith" value={newSName} onChange={e=>setNewSName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addStudent()} style={{ marginTop:6, marginBottom:16 }} autoFocus/>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button className="ghost-btn" onClick={()=>setShowAS(false)}>Cancel</button>
          <button className="action-btn" onClick={addStudent} style={{ background:"var(--teal)", color:"#fff" }}>Add Student ✓</button>
        </div>
      </Modal>

      <Modal show={showAG} onClose={()=>setShowAG(false)} title="Add Goal" emoji="🎯">
        <SectionLabel>Goal Name</SectionLabel>
        <input type="text" placeholder="e.g. Reading Fluency, Math Facts…" value={newGName} onChange={e=>setNewGName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGoal()} style={{ marginTop:6, marginBottom:16 }} autoFocus/>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button className="ghost-btn" onClick={()=>setShowAG(false)}>Cancel</button>
          <button className="action-btn" onClick={addGoal} style={{ background:pal.chip, color:"#fff" }}>Add Goal ✓</button>
        </div>
      </Modal>

      <Modal show={!!editPt} onClose={()=>setEditPt(null)} title="Edit Session" emoji="✏️">
        {editPt && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><SectionLabel>Accuracy %</SectionLabel><input type="number" value={editPt.y} onChange={e=>setEditPt(p=>({...p,y:e.target.value}))} style={{ marginTop:5 }}/></div>
              <div><SectionLabel>Date</SectionLabel><input type="date" value={editPt.x} onChange={e=>setEditPt(p=>({...p,x:e.target.value}))} style={{ marginTop:5 }}/></div>
            </div>
            <div><SectionLabel>Notes</SectionLabel><textarea value={editPt.notes} onChange={e=>setEditPt(p=>({...p,notes:e.target.value}))} style={{ marginTop:5, resize:"vertical", minHeight:60 }}/></div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
              <button className="ghost-btn" onClick={()=>setEditPt(null)}>Cancel</button>
              <button className="action-btn" onClick={saveEdit} style={{ background:"var(--teal)", color:"#fff" }}>Save Changes</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal show={showAtt} onClose={()=>setShowAtt(false)} title="Attachments" emoji="📎">
        {chart && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <SectionLabel>Upload a File</SectionLabel>
              <input type="file" style={{ marginTop:6 }} onChange={e=>{
                const f=e.target.files[0]; if(!f) return;
                const r=new FileReader();
                r.onload=ev=>{ upd(d=>{ if(!Array.isArray(d[selSet].charts[selChart].attachments))d[selSet].charts[selChart].attachments=[]; d[selSet].charts[selChart].attachments.push({name:f.name,type:f.type,size:f.size,content:ev.target.result.split(",")[1]}); }); };
                r.readAsDataURL(f); e.target.value="";
              }}/>
            </div>
            {(chart.attachments??[]).length===0 ? (
              <div style={{ textAlign:"center", padding:"14px 0", color:"var(--ink-soft)", fontSize:13 }}>No files yet</div>
            ) : (chart.attachments??[]).map((f,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--cream)", borderRadius:8, border:"1.5px solid var(--border)" }}>
                <span style={{ fontSize:20 }}>📄</span>
                <span style={{ flex:1, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                <span style={{ fontSize:11, color:"var(--ink-soft)" }}>{Math.round(f.size/1024)}KB</span>
                <button className="ghost-btn" onClick={()=>{ const bytes=Uint8Array.from(atob(f.content),c=>c.charCodeAt(0)); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([bytes],{type:f.type})); a.download=f.name; a.click(); }} style={{ padding:"3px 10px" }}>↓</button>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button className="ghost-btn" onClick={()=>setShowAtt(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

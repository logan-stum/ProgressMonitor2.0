import React, { useState, useRef, useEffect, useCallback } from "react";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, TimeScale, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler);

// ─── Global styles ────────────────────────────────────────────────────────────
const css = document.createElement("style");
css.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Nunito+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --font-head:'Nunito',sans-serif; --font-body:'Nunito Sans',sans-serif;
    --cream:#fdf8f2; --paper:#fff; --teal:#26c6b0; --yellow:#ffd166;
    --yellow-lt:#fffbec; --blue:#4e9af1; --green:#52c97a; --red:#ff6b6b;
    --ink:#2d2d3a; --ink-mid:#5a5a72; --ink-soft:#9898b0; --border:#ede8e0;
    --shadow-sm:0 1px 3px rgba(45,45,58,.07),0 1px 2px rgba(45,45,58,.05);
    --shadow:0 4px 12px rgba(45,45,58,.10);
    --shadow-lg:0 8px 28px rgba(45,45,58,.14);
    --r:12px; --r-sm:8px; --r-lg:18px;
  }
  body { font-family:var(--font-body); background:var(--cream); color:var(--ink); min-height:100vh; display:block; }
  .report-page{break-before:page;page-break-before:always;}
  .report-page:first-child{break-before:auto;page-break-before:auto;}
  input,textarea { font-family:var(--font-body); color:var(--ink); background:var(--paper); border:2px solid var(--border); border-radius:var(--r-sm); padding:8px 12px; font-size:14px; outline:none; width:100%; transition:border-color .15s,box-shadow .15s; }
  input:focus,textarea:focus { border-color:var(--teal); box-shadow:0 0 0 3px rgba(38,198,176,.15); }
  select { font-family:var(--font-body); color:var(--ink); background:var(--paper); border:2px solid var(--border); border-radius:var(--r-sm); padding:7px 10px; font-size:13px; outline:none; cursor:pointer; }
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}
  @keyframes popIn  {0%{opacity:0;transform:scale(.92) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes fadeUp {0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes confetti{0%{opacity:1;transform:scale(1) rotate(0deg)}100%{opacity:0;transform:scale(0) rotate(200deg) translateY(-40px)}}
  @keyframes bigPop  {0%{opacity:0;transform:scale(.5)}60%{transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}
  .card-appear{animation:popIn .22s cubic-bezier(.34,1.56,.64,1) both}
  .fade-up{animation:fadeUp .2s ease both}
  .action-btn{display:inline-flex;align-items:center;gap:5px;padding:9px 18px;border-radius:99px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer;border:none;transition:all .15s;box-shadow:var(--shadow-sm)}
  .action-btn:hover{transform:translateY(-1px);box-shadow:var(--shadow)}
  .action-btn:active{transform:translateY(0)}
  .ghost-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:99px;font-family:var(--font-head);font-weight:600;font-size:12px;cursor:pointer;border:2px solid var(--border);background:transparent;color:var(--ink-mid);transition:all .15s}
  .ghost-btn:hover{border-color:var(--ink-soft);color:var(--ink)}
  .ghost-btn:disabled{opacity:.4;cursor:not-allowed}
  .log-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px dashed var(--border);animation:fadeUp .15s ease both}
  .log-row:last-child{border-bottom:none}
  .stat-card{background:var(--paper);border-radius:var(--r-lg);padding:16px 20px;box-shadow:var(--shadow-sm);border:2px solid var(--border);display:flex;flex-direction:column;gap:4px;transition:box-shadow .15s,transform .15s}
  .stat-card:hover{box-shadow:var(--shadow);transform:translateY(-1px)}
  .confetti-dot{position:fixed;pointer-events:none;width:8px;height:8px;border-radius:2px;animation:confetti .65s ease forwards}
  .tab-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:99px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer;border:2px solid transparent;background:transparent;color:var(--ink-mid);transition:all .15s}
  .tab-btn:hover{color:var(--ink);background:var(--cream)}
  .tab-btn.active{background:var(--paper);color:var(--ink);border-color:var(--border);box-shadow:var(--shadow-sm)}
  .acc-status-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:99px;font-family:var(--font-head);font-weight:700;font-size:12px;cursor:pointer;border:2px solid;transition:all .15s;background:transparent}
  .acc-status-btn:hover{transform:translateY(-1px)}
  .cal-day{width:100%;min-height:52px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:6px 4px 5px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer;border:2px solid transparent;transition:all .15s;position:relative;gap:4px}
  .cal-day:hover{background:var(--cream);border-color:var(--border)}
  .cal-day.today{border-color:var(--teal)!important;color:var(--teal)}
  .cal-day.selected{background:var(--teal)!important;color:#fff!important;border-color:var(--teal)!important}
  .cal-day.other-month{opacity:.3;cursor:default;min-height:52px}
  .cal-day-dots{display:flex;gap:2px;flex-wrap:wrap;justify-content:center;width:100%}
  .cal-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
  .kbd{display:inline-flex;align-items:center;justify-content:center;padding:2px 6px;border-radius:4px;background:var(--cream);border:1.5px solid var(--border);font-family:var(--font-head);font-weight:700;font-size:11px;color:var(--ink-mid)}
  .stu-card{background:var(--paper);border-radius:var(--r-lg);border:2px solid var(--border);padding:18px;cursor:pointer;transition:all .2s;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px}
  .stu-card:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
  .sparkline{display:flex;align-items:flex-end;gap:2px;height:28px}
  .spark-bar{border-radius:2px 2px 0 0;min-width:4px;transition:height .3s}
  @media print {
    @page {
      size: A4 portrait;
      margin: 0.5in;
    }
    html, body, #root, #root > div {
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    }
    body * { visibility: hidden !important; }
    .print-report, .print-report * { visibility: visible !important; }
    .print-report {
      position: static !important;
      inset: auto !important;
      display: block !important;
      width: 100% !important;
      max-width: none !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
    .print-report > div,
    .report-section {
      break-inside: auto !important;
      page-break-inside: auto !important;
      page-break-after: auto !important;
      overflow: visible !important;
    }
    .no-print { display: none !important; }
  }
`;
document.head.appendChild(css);

// ─── Constants ────────────────────────────────────────────────────────────────
const PALETTE=[
  {bg:"#fff0f0",border:"#ff6b6b",text:"#c0392b",chip:"#ff6b6b"},
  {bg:"#e8faf7",border:"#26c6b0",text:"#1a8a7a",chip:"#26c6b0"},
  {bg:"#eef5ff",border:"#4e9af1",text:"#2362b8",chip:"#4e9af1"},
  {bg:"#fffbec",border:"#ffd166",text:"#9a6a00",chip:"#e6a817"},
  {bg:"#f3f0ff",border:"#a78bfa",text:"#6d28d9",chip:"#a78bfa"},
  {bg:"#edfdf5",border:"#52c97a",text:"#1e7a45",chip:"#52c97a"},
];
const EMOJIS=["🌟","🎯","🚀","💡","🎓","🌈","⚡","🦋","🔥","🏆"];
const EMOJI_OPTIONS=[
  "😀","😁","😂","😃","😄","😅","😆","😉","😊","🙂","🙃","😌","😍","🥰","😎","🤩","😇","🤪","😬","🤭","😮","😴","🤓","😺","😸","😹","😻","😼","😽","🙀","😿","😾","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦄","🐝","🦋","🌼","🌻","🌞","🌙","⭐","🌟","✨","⚡","🔥","💫","🌈","🌍","🌱","🌿","☀️","🌤️","🌊","🚀","🛸","🚁","✈️","🚗","🏠","🏫","🎒","🎓","📚","✏️","📝","🧠","🎯","🏆","🥇","🥈","🥉","🎉","🎊","🎁","🎨","🧩","🎵","🎶","🎮","🧸","🍎","🍉","🍓","🍇","🍒","🥕","🌮","🍔","🍕","🍦","☕","🍵","💡","🔍","✅","❌","⚠️","💯","🔒","🔑","🛠️","⏱️","📅","⏰","💙","💚","💛","💜","💖","❤️","🧡","🙌","👏","👋","🤝","🧑‍🏫","👩‍🏫","👨‍🏫","👦","👧","🧒","🧑","👨","👩","🦄","🐙","🐠","🌸","💐","🌹","🌷","🪴","☘️","🍀","⚽","🏀","🎾","🏈","🏐","🎲","🎳","🏓","🎻","🎺","🎹","🎼","🥁" ];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DOT_COLORS={given:"#52c97a",refused:"#ff6b6b",not_given:"#c8c8d8",absent:"#a78bfa"};
const STATUS_CONFIG={
  given:    {label:"Given",    icon:"✓",color:"#52c97a",bg:"#edfdf5",border:"#52c97a"},
  refused:  {label:"Refused",  icon:"✗",color:"#ff6b6b",bg:"#fff0f0",border:"#ff6b6b"},
  not_given:{label:"Not Given",icon:"—",color:"#9898b0",bg:"#f4f4f8",border:"#c8c8d8"},
  absent:   {label:"Absent",   icon:"☁",color:"#a78bfa",bg:"#f3f0ff",border:"#a78bfa"},
};
const DEFAULT_MINUTE_OPTIONS=[
  {id:"reading",label:"Reading"},
  {id:"math",label:"Math"},
  {id:"writing",label:"Writing"},
  {id:"speech",label:"Speech"},
];

const getPal   = i => PALETTE[i%PALETTE.length];
const getEmoji = n => EMOJIS[(n?.charCodeAt(0)??0)%EMOJIS.length];
const getStudentEmoji = student => student?.emoji?.trim() || getEmoji(student?.name ?? "");
const clamp    = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const sanitize = arr => (Array.isArray(arr)?arr:[]).map(p=>({...p,y:clamp(Number(p.y),0,100)})).sort((a,b)=>new Date(a.x)-new Date(b.x));
const todayStr = () => new Date().toISOString().split("T")[0];
const currentYear = () => new Date().getFullYear();

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

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionLabel({children}){
  return <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--ink-soft)",marginBottom:5}}>{children}</div>;
}
function Ring({pct,color,size=54}){
  const r=size/2-6,circ=2*Math.PI*r,dash=(clamp(pct,0,100)/100)*circ;
  return(
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s ease"}}/>
    </svg>
  );
}
function Modal({show,onClose,title,emoji,children,wide}){
  if(!show) return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,45,58,.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} className="card-appear" style={{background:"var(--paper)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-lg)",padding:28,minWidth:wide?520:360,maxWidth:wide?640:500,width:"92%",border:"2px solid var(--border)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {emoji&&<span style={{fontSize:22}}>{emoji}</span>}
            <h3 style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17}}>{title}</h3>
          </div>
          <button onClick={onClose} className="ghost-btn" style={{padding:"4px 10px"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmojiPickerModal({show,onClose,onSelect,selected}){
  const [search,setSearch]=useState("");
  const filtered=EMOJI_OPTIONS.filter(emoji => {
    if(!search.trim()) return true;
    const needle = search.toLowerCase();
    return emoji.toLowerCase().includes(needle) || "smile happy school sun star animal fruit heart classroom".includes(needle);
  });
  if(!show) return null;
  return (
    <Modal show={show} onClose={onClose} title="Choose Emoji" emoji="🎨">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search emoji ideas…" autoFocus />
        <div style={{display:"grid",gridTemplateColumns:"repeat(8,minmax(0,1fr))",gap:8,maxHeight:260,overflowY:"auto",paddingRight:4}}>
          {filtered.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={()=>{onSelect(emoji); onClose();}}
              title={emoji}
              style={{
                fontSize:26,
                background:selected===emoji ? "rgba(38,198,176,0.15)" : "var(--cream)",
                border:`1.5px solid ${selected===emoji ? "var(--teal)" : "var(--border)"}`,
                borderRadius:10,
                padding:"10px 0",
                cursor:"pointer",
                transition:"all .15s ease",
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({data,color}){
  if(!data||data.length<2) return <div style={{fontSize:11,color:"var(--ink-soft)"}}>No data</div>;
  const vals=data.slice(-10).map(p=>p.y);
  const max=Math.max(...vals)||1;
  return(
    <div className="sparkline">
      {vals.map((v,i)=>(
        <div key={i} className="spark-bar" style={{height:`${(v/max)*100}%`,background:color,opacity:.7+.3*(i/(vals.length-1)),flex:1}}/>
      ))}
    </div>
  );
}

// ─── Calendar ────────────────────────────────────────────────────────────────
function Calendar({year,month,onSelectDay,accDays,accList,selectedDay}){
  const firstDay=new Date(year,month,1).getDay();
  const dim=new Date(year,month+1,0).getDate();
  const today=todayStr();
  const cells=[];
  const prevDays=new Date(year,month,0).getDate();
  for(let i=firstDay-1;i>=0;i--) cells.push({day:prevDays-i,cur:false});
  for(let d=1;d<=dim;d++) cells.push({day:d,cur:true});
  while(cells.length%7!==0) cells.push({day:cells.length-firstDay-dim+1,cur:false});
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,color:"var(--ink-soft)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((c,i)=>{
          if(!c.cur) return <div key={i} className="cal-day other-month"><span>{c.day}</span></div>;
          const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(c.day).padStart(2,"0")}`;
          const isToday=ds===today, isSel=ds===selectedDay;
          const dayRec=accDays?.[ds];
          // Only show dots if this day has been explicitly logged
          const hasEntry = !!dayRec && Object.keys(dayRec).length > 0;
          let counts = { given:0, refused:0, not_given:0, absent:0 };
          if (hasEntry && accList?.length > 0) {
            accList.forEach(a => {
              const s = dayRec[a.id] ?? "given";
              counts[s] = (counts[s] || 0) + 1;
            });
          }
          return(
            <div key={i} className={`cal-day${isToday?" today":""}${isSel?" selected":""}`} onClick={()=>onSelectDay(ds)}
              title={hasEntry?`Given:${counts.given} · Refused:${counts.refused} · Not Given:${counts.not_given} · Absent:${counts.absent}`:""}>
              <span style={{lineHeight:1}}>{c.day}</span>
              {hasEntry&&(
                <div className="cal-day-dots">
                  {Object.entries(counts).map(([status,count])=>
                    count>0?Array.from({length:Math.min(count,4)}).map((_,di)=>(
                      <div key={status+di} className="cal-dot" style={{background:isSel?"rgba(255,255,255,0.7)":DOT_COLORS[status]}}/>
                    )):null
                  )}
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
function AccommodationsTab({student,selSet,upd,theme,pal}){
  const accList=student?.accommodations??[];
  const accDays=student?.accDays??{};
  const [calYear,setCalYear]=useState(currentYear);
  const [calMonth,setCalMonth]=useState(()=>new Date().getMonth());
  const [selDay,setSelDay]=useState(null);
  const [showSetup,setShowSetup]=useState(false);
  const [showDayPop,setShowDayPop]=useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const [setupInput,setSetupInput]=useState("");
  const [setupList,setSetupList]=useState([]);
  const [editList,setEditList]=useState([]);
  const [newAccName,setNewAccName]=useState("");

  // Available years from data
  const dataYears=Array.from(new Set(Object.keys(accDays).map(d=>d.split("-")[0]))).map(Number).sort((a,b)=>b-a);
  if(!dataYears.includes(calYear)&&dataYears.length>0) dataYears.push(calYear);
  const yearList=[...new Set([currentYear(),...dataYears])].sort((a,b)=>b-a);

  useEffect(()=>{if(accList.length===0)setShowSetup(true);},[selSet]);

  const saveSetup=()=>{
    const items=setupList.filter(s=>s.trim()).map(name=>({id:Date.now()+Math.random(),name:name.trim()}));
    if(!items.length) return;
    upd(d=>{d[selSet].accommodations=items;});
    setShowSetup(false);setSetupList([]);setSetupInput("");
  };
  const openDay=ds=>{setSelDay(ds);setShowDayPop(true);};
  const setStatus=(ds,accId,status)=>upd(d=>{
    if(!d[selSet].accDays)d[selSet].accDays={};
    if(!d[selSet].accDays[ds])d[selSet].accDays[ds]={};
    d[selSet].accDays[ds][accId]=status;
  });
  const openEdit=()=>{setEditList(accList.map(a=>({...a})));setShowEdit(true);};
  const saveEdit=()=>{
    upd(d=>{d[selSet].accommodations=editList.filter(a=>a.name.trim()).map(a=>({...a,name:a.name.trim()}));});
    setShowEdit(false);
  };
  const addToEditList=()=>{if(!newAccName.trim())return;setEditList(l=>[...l,{id:Date.now()+Math.random(),name:newAccName.trim()}]);setNewAccName("");};
  const dayData=selDay?(accDays[selDay]??{}):{};
  const prevMonth=()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);};
  const nextMonth=()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);};

  // Monthly stats
  const dim=new Date(calYear,calMonth+1,0).getDate();
  let mGiven=0,mRefused=0,mNotGiven=0,mAbsent=0,mLogged=0;
  for(let d=1;d<=dim;d++){
    const ds=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if(accDays[ds]){mLogged++;Object.values(accDays[ds]).forEach(s=>{if(s==="given")mGiven++;else if(s==="refused")mRefused++;else if(s==="not_given")mNotGiven++;else if(s==="absent")mAbsent++;});}
  }
  const totalLogged=mGiven+mRefused+mNotGiven+mAbsent;
  const complianceRate=totalLogged>0?Math.round((mGiven/totalLogged)*100):null;

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:theme.text}}>🛠 Accommodations</div>
          <div style={{fontSize:12,color:theme.subtle,marginTop:2}}>
            {accList.length===0?"No accommodations set up yet":`${accList.length} accommodation${accList.length!==1?"s":""} · ${student?.name}`}
            {complianceRate!==null&&<span style={{marginLeft:10,fontWeight:700,color:theme.primary}}>{complianceRate}% compliance this month</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select value={calYear} onChange={e=>setCalYear(Number(e.target.value))}>
            {yearList.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button className="ghost-btn" onClick={openEdit}>✏️ Edit</button>
          {accList.length===0&&<button className="action-btn" onClick={()=>setShowSetup(true)} style={{background:theme.primary,color:"#fff"}}>+ Set Up</button>}
        </div>
      </div>

      {accList.length>0?(
        <>
          {mLogged>0&&(
            <div className="fade-up" style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {[
                {label:`✓ ${mGiven} Given`,     color:"#52c97a",bg:"#edfdf5"},
                {label:`✗ ${mRefused} Refused`, color:"#ff6b6b",bg:"#fff0f0"},
                {label:`— ${mNotGiven} Not Given`,color:"#9898b0",bg:"#f4f4f8"},
                {label:`☁ ${mAbsent} Absent`,   color:"#a78bfa",bg:"#f3f0ff"},
              ].map(({label,color,bg})=>(
                <div key={label} style={{padding:"4px 12px",borderRadius:99,background:bg,color,fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,border:`1.5px solid ${color}44`}}>{label}</div>
              ))}
              {complianceRate!==null&&(
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
                  <Ring pct={complianceRate} color="#52c97a" size={40}/>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13}}>{complianceRate}%<br/><span style={{fontSize:10,fontWeight:600,color:"var(--ink-soft)"}}>COMPLIANCE</span></div>
                </div>
              )}
            </div>
          )}

          <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"20px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <button className="ghost-btn" onClick={prevMonth} style={{padding:"5px 12px",color:theme.text,borderColor:theme.border}}>‹</button>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:16,color:theme.text}}>{MONTHS[calMonth]} {calYear}</div>
              <button className="ghost-btn" onClick={nextMonth} style={{padding:"5px 12px",color:theme.text,borderColor:theme.border}}>›</button>
            </div>
            <Calendar year={calYear} month={calMonth} onSelectDay={openDay} accDays={accDays} accList={accList} selectedDay={selDay}/>
            <div style={{marginTop:14,display:"flex",gap:14,flexWrap:"wrap"}}>
              {[{color:"#52c97a",label:"Given"},{color:"#ff6b6b",label:"Refused"},{color:"#c8c8d8",label:"Not Given"},{color:"#a78bfa",label:"Absent"}].map(({color,label})=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:theme.subtle}}>
                  <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:color}}/>{label}
                </div>
              ))}
            </div>
          </div>

          <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"18px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:12,color:theme.text}}>📋 Accommodation List</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {accList.map((a,i)=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:theme.softPanel,borderRadius:8,border:`1.5px solid ${theme.border}`}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"var(--teal)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,flexShrink:0}}>{i+1}</div>
                  <span style={{fontSize:13,fontWeight:600}}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ):(
        <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px dashed ${theme.border}`,padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>🛠</div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:6,color:theme.text}}>No accommodations yet</div>
          <div style={{fontSize:13,color:theme.subtle,marginBottom:20}}>Set up once, log every day.</div>
          <button className="action-btn" onClick={()=>setShowSetup(true)} style={{background:theme.primary,color:"#fff"}}>+ Set Up Accommodations</button>
        </div>
      )}

      <Modal show={showSetup} onClose={()=>setShowSetup(false)} title="Set Up Accommodations" emoji="🛠" wide>
        <div style={{fontSize:13,color:theme.subtle,marginBottom:16}}>Enter each accommodation for <strong>{student?.name}</strong>. Press Enter to add.</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input type="text" placeholder="Type an accommodation and press Enter…" value={setupInput} onChange={e=>setSetupInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&setupInput.trim()){setSetupList(l=>[...l,setupInput.trim()]);setSetupInput("");}}} autoFocus style={{background:theme.panel,borderColor:theme.border,color:theme.text}}/>
          <button className="action-btn" onClick={()=>{if(setupInput.trim()){setSetupList(l=>[...l,setupInput.trim()]);setSetupInput("");}}} style={{background:theme.primary,color:"#fff",flexShrink:0}}>Add</button>
        </div>
        {setupList.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
            {setupList.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"var(--cream)",borderRadius:8,border:"1.5px solid var(--border)"}}>
                <span style={{flex:1,fontSize:13,fontWeight:600}}>{s}</span>
                <button onClick={()=>setSetupList(l=>l.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink-soft)",fontSize:14}}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
          <button className="ghost-btn" onClick={()=>setShowSetup(false)}>Skip for now</button>
          <button className="action-btn" onClick={saveSetup} disabled={setupList.length===0} style={{background:"var(--teal)",color:"#fff",opacity:setupList.length===0?.5:1}}>Save ✓</button>
        </div>
      </Modal>

      <Modal show={showEdit} onClose={()=>setShowEdit(false)} title="Edit Accommodations" emoji="✏️" wide>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {editList.map((a,i)=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="text" value={a.name} onChange={e=>setEditList(l=>l.map((x,j)=>j===i?{...x,name:e.target.value}:x))} style={{flex:1}}/>
              <button onClick={()=>setEditList(l=>l.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)",fontSize:16,flexShrink:0}}>✕</button>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input type="text" placeholder="Add another…" value={newAccName} onChange={e=>setNewAccName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addToEditList()}/>
          <button className="action-btn" onClick={addToEditList} style={{background:"var(--teal)",color:"#fff",flexShrink:0}}>Add</button>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="ghost-btn" onClick={()=>setShowEdit(false)}>Cancel</button>
          <button className="action-btn" onClick={saveEdit} style={{background:"var(--teal)",color:"#fff"}}>Save ✓</button>
        </div>
      </Modal>

      <Modal show={showDayPop} onClose={()=>setShowDayPop(false)}
        title={selDay?new Date(selDay+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}):""}
        emoji="📅" wide>
        {accList.length===0?(
          <div style={{textAlign:"center",padding:"20px 0",color:"var(--ink-soft)",fontSize:13}}>No accommodations set up yet.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {accList.map(acc=>{
              const status=dayData[acc.id]??"given";
              return(
                <div key={acc.id} style={{background:"var(--cream)",borderRadius:10,padding:"12px 14px",border:"1.5px solid var(--border)"}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:10}}>{acc.name}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {Object.entries(STATUS_CONFIG).map(([key,cfg])=>(
                      <button key={key} className="acc-status-btn" onClick={()=>setStatus(selDay,acc.id,key)}
                        style={{borderColor:cfg.border,color:status===key?"#fff":cfg.color,background:status===key?cfg.color:"transparent"}}>
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}>
              <button className="action-btn" onClick={()=>setShowDayPop(false)} style={{background:"var(--teal)",color:"#fff"}}>Done ✓</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

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
    const allPts = student.charts.flatMap(c => c.data ?? []);
    const latest = allPts[allPts.length - 1];
    const thisMonthStr = `${thisYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const monthPts = allPts.filter(pt => pt.x?.startsWith(thisMonthStr));
    const streak = monthPts.length;
    const accDays = student.accDays ?? {};
    const todayAcc = accDays[todayStr()];
    const accDone = !!(todayAcc && Object.keys(todayAcc).length > 0);

    return (
      <div key={index} className="stu-card" draggable onDragStart={event => {
          event.dataTransfer.setData("text/plain", String(index));
          event.dataTransfer.effectAllowed = "move";
        }} onClick={() => onSelectStudent(index)} style={{
          borderColor: p.border,
          background: theme.card,
          boxShadow: `0 10px 25px ${theme.shadow}`,
          borderWidth: 2,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${p.chip},${p.chip}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{getStudentEmoji(student)}</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.name}</div>
            <div style={{ fontSize: 11, color: theme.subtle }}>{student.charts.length} goal{student.charts.length !== 1 ? "s" : ""}</div>
          </div>
          {accDone && <span title="Accommodations logged today" style={{ fontSize: 16 }}>✅</span>}
        </div>

        {student.charts.map((c, ci) => {
          const cPts = c.data ?? [];
          const cLatest = cPts[cPts.length - 1];
          if (!cLatest) return null;
          const goalPct = c.goalValue ? Math.round((cLatest.y / c.goalValue) * 100) : null;
          return (
            <div key={ci} style={{ background: theme.softPanel, borderRadius: 8, padding: "8px 10px", border: `1.5px solid ${p.border}44` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.name}</span>
                <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 14, color: p.chip, flexShrink: 0, marginLeft: 6 }}>{cLatest.y}%</span>
              </div>
              <Sparkline data={cPts} color={p.chip} />
              {goalPct !== null && (
                <div style={{ marginTop: 5, height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(goalPct, 100)}%`, height: "100%", background: p.chip, borderRadius: 99, transition: "width .4s ease" }} />
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: theme.subtle, marginTop: 8 }}>
          <span>{streak} this month</span>
          <span>{latest ? `${latest.y}% latest` : "No data"}</span>
        </div>
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

// ─── Goals Tab ────────────────────────────────────────────────────────────────
function GoalsTab({sets,selSet,selChart,setSelChart,upd,snap,undo,history,showAtt,setShowAtt,setShowAG,chartRef,editPt,setEditPt,theme}){
  const student=sets[selSet];
  const chart=student?.charts?.[selChart]??null;
  const pal=getPal(selSet);

  const [newVal,setNewVal]=useState("");
  const [newDate,setNewDate]=useState(todayStr);
  const [newNote,setNewNote]=useState("");
  const [dateDrafts,setDateDrafts]=useState({ startDate: "", goalDate: "" });
  const [viewYear,setViewYear]=useState(currentYear);
  const [showQL,setShowQL]=useState(false); // quick log modal

  const normalizeDateDigits = value => String(value ?? "").replace(/\D/g, "").slice(0, 8);
  const formatDateDraft = value => {
    const digits = normalizeDateDigits(value);
    if (!digits) return "";
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };
  const parseDateDigits = value => {
    const digits = normalizeDateDigits(value);
    if (digits.length !== 8) return null;

    const month = Number(digits.slice(0, 2));
    const day = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return null;

    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  const [selectedPointIndex,setSelectedPointIndex]=useState(null);
  const [pointToDelete,setPointToDelete]=useState(null);

  const parseDateInput = value => {
    if (!value || typeof value !== "string") return null;
    const normalized = value.trim();
    if (!normalized) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const parsed = new Date(`${normalized}T12:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : normalized;
    }

    return parseDateDigits(normalized);
  };

  const formatDateInput = value => {
    if (!value || typeof value !== "string") return "";
    const digits = normalizeDateDigits(value);
    if (!digits) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-");
      return `${month}/${day}/${year}`;
    }
    return formatDateDraft(digits);
  };

  useEffect(() => {
    if (!chart) return;
    setDateDrafts({
      startDate: formatDateDraft(chart.startDate || ""),
      goalDate: formatDateDraft(chart.goalDate || ""),
    });
  }, [chart?.startDate, chart?.goalDate]);

  // Derive available years from data
  const allPts=chart?.data??[];
  const dataYears=Array.from(new Set(allPts.map(p=>p.x?.split("-")[0]).filter(Boolean))).map(Number);
  const yearList=[...new Set([currentYear(),...dataYears])].sort((a,b)=>b-a);

  // Filter pts by year
  const pts=allPts.filter(p=>p.x?.startsWith(String(viewYear)));
  const latest=pts[pts.length-1];
  const goalPct=latest&&chart?.goalValue?Math.round((latest.y/chart.goalValue)*100):null;
  const trend=pts.length>=2?(pts[pts.length-1].y-pts[pts.length-2].y).toFixed(1):null;

  // Streak (sessions this month across all goals)
  const thisMonthStr=`${viewYear}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
  const monthPts=allPts.filter(p=>p.x?.startsWith(thisMonthStr));
  const streak=monthPts.length;

  const addPoint=useCallback((e,val,date,note)=>{
    const v=val??newVal, d=date??newDate, n=note??newNote;
    if(!v||!d||!chart) return;
    snap();
    upd(data=>{
      data[selSet].charts[selChart].data.push({x:d,y:clamp(Number(v),0,100),notes:n});
      data[selSet].charts[selChart].data=sanitize(data[selSet].charts[selChart].data);
    });
    if(e?.clientX) burst(e.clientX,e.clientY);
    // Celebrate if goal hit
    if(chart.goalValue&&clamp(Number(v),0,100)>=chart.goalValue){
      setTimeout(()=>burst(window.innerWidth/2,window.innerHeight/3,true),100);
    }
    setNewVal("");setNewDate(todayStr());setNewNote("");
  },[newVal,newDate,newNote,chart,selSet,selChart]);

  const saveEditPt=()=>{
    if(!editPt) return; snap();
    upd(d=>{
      d[selSet].charts[selChart].data[editPt.idx]={x:editPt.x,y:clamp(Number(editPt.y),0,100),notes:editPt.notes};
      d[selSet].charts[selChart].data=sanitize(d[selSet].charts[selChart].data);
    });
    setEditPt(null);
  };

  const deletePointAtIndex=(indexToDelete)=>{
    if(indexToDelete===null || indexToDelete===undefined || !chart || !Array.isArray(chart.data) || indexToDelete<0 || indexToDelete>=chart.data.length) return;
    snap();
    upd(d=>{
      d[selSet].charts[selChart].data.splice(indexToDelete,1);
      d[selSet].charts[selChart].data=sanitize(d[selSet].charts[selChart].data);
    });
    setSelectedPointIndex(null);
    setPointToDelete(null);
  };

  // Chart zones plugin (green/yellow/red bands)
  const goalVal = chart?.goalValue ?? 100;
  const chartBgPlugin = {
    id: "chartBg",
    beforeDraw(ch) {
      const { ctx, chartArea:{ top, bottom, left, right }, scales:{ y } } = ch;
      if (!y) return;
      const zones = [
        { from: goalVal,        to: 100,       color: "rgba(82,201,122,0.08)" },
        { from: goalVal * 0.7,  to: goalVal,   color: "rgba(255,209,102,0.08)" },
        { from: 0,              to: goalVal * 0.7, color: "rgba(255,107,107,0.06)" },
      ];
      zones.forEach(({ from, to, color }) => {
        const yTop = y.getPixelForValue(Math.min(to, 100));
        const yBot = y.getPixelForValue(Math.max(from, 0));
        ctx.fillStyle = color;
        ctx.fillRect(left, yTop, right - left, yBot - yTop);
      });
    }
  };

  const parseChartDate = value => {
    if (!value || typeof value !== "string") return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const startChartDate = parseChartDate(chart?.startDate);
  const goalChartDate = parseChartDate(chart?.goalDate);
  const hasValidTargetDates = Boolean(startChartDate && goalChartDate && startChartDate.getTime() <= goalChartDate.getTime());

  const chartData={
    datasets:[
      {label:chart?.name??"Progress",data:pts,borderColor:pal.chip,backgroundColor:pal.chip+"22",tension:0.35,fill:true,
       pointRadius:pts.map(p=>{
         const absIndex = allPts.indexOf(p);
         return absIndex===selectedPointIndex ? 8 : p.notes ? 7 : 5;
       }),pointHoverRadius:9,pointBackgroundColor:pts.map(p=>p.notes?pal.chip:"#fff"),
       pointBorderColor:pts.map(p=>p.notes?pal.chip:pal.chip),pointBorderWidth:pts.map(p=>p.notes?0:2),pointHitRadius:14},
      hasValidTargetDates && {label:"🎯 Target",data:[{x:startChartDate,y:chart.startValue},{x:goalChartDate,y:chart.goalValue}],
        borderColor:"#52c97a",borderDash:[6,4],borderWidth:2,fill:false,pointRadius:4,pointBackgroundColor:"#52c97a"},
    ].filter(Boolean),
  };

  const chartOpts={
    responsive:true,maintainAspectRatio:false,
    plugins:{
      legend:{labels:{color:"#5a5a72",font:{family:"'Nunito',sans-serif",size:12,weight:"700"},boxWidth:14,padding:16}},
      tooltip:{backgroundColor:"#2d2d3a",titleColor:"#fff",bodyColor:"#9898b0",padding:12,cornerRadius:10,
        titleFont:{family:"'Nunito',sans-serif",weight:"800"},bodyFont:{family:"'Nunito Sans',sans-serif",size:12},
        callbacks:{label:ctx=>` ${ctx.parsed.y}%${ctx.raw?.notes?`  · ${ctx.raw.notes}`:""}`}},
      chartBg:chartBgPlugin,
    },
    scales:{
      x:{type:"time",time:{unit:"day",tooltipFormat:"MMM d, yyyy"},grid:{color:"rgba(0,0,0,0.04)"},ticks:{color:"#9898b0",font:{family:"'Nunito Sans'",size:11}}},
      y:{min:0,max:100,grid:{color:"rgba(0,0,0,0.04)"},ticks:{color:"#9898b0",font:{family:"'Nunito'",size:11},callback:v=>v+"%"}},
    },
    onClick:(evt,els)=>{
      if(!els?.length) return;
      const clickedPoint = pts[els[0].index];
      if(!clickedPoint) return;
      const absIndex = allPts.indexOf(clickedPoint);
      setSelectedPointIndex(absIndex >= 0 ? absIndex : null);
    },
  };

  if(!chart) return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"var(--ink-soft)"}}>
      <div style={{fontSize:36}}>📊</div>
      <p style={{fontSize:14}}>Add a goal from the sidebar to get started.</p>
      <button className="action-btn" onClick={()=>setShowAG(true)} style={{background:pal.chip,color:"#fff"}}>+ Add Goal</button>
    </div>
  );

  return(
    <div style={{flex:1,overflow:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:16}}>
      {/* Year picker + streak */}
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <select value={viewYear} onChange={e=>setViewYear(Number(e.target.value))}>
          {yearList.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <button className="action-btn" onClick={()=>setShowQL(true)} style={{background:pal.chip,color:"#fff",marginLeft:"auto",padding:"6px 14px",fontSize:12}}>⚡ Quick Log</button>
      </div>

      {latest&&(
        <div className="fade-up" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {label:"Latest Score",   val:`${latest.y}%`,                  sub:latest.x,                                                   color:pal.chip, pct:latest.y}, 
            {label:"Goal Target",    val:`${chart.goalValue}%`,            sub:chart.goalDate||"No target date",                           color:"#52c97a",pct:chart.goalValue},
            {label:"Progress to Goal",val:goalPct!=null?`${goalPct}%`:"—",sub:trend!=null?(Number(trend)>=0?`▲ +${trend}% from last`:`▼ ${trend}% from last`):"Need more data",color:goalPct>=100?"#52c97a":"#ffd166",pct:goalPct??0},
          ].map(({label,val,sub,color,pct})=>(
            <div key={label} className="stat-card" style={{ backgroundColor: theme.card }} 
>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:26}}>{val}</div>
                <Ring pct={pct} color={color} size={52}/>
              </div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-soft)"}}>{label}</div>
              <div style={{fontSize:11,color:"var(--ink-soft)"}}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"16px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:10}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:theme.text}}>Progress Chart — {viewYear}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{fontSize:11,color:"var(--ink-soft)"}}>Click a point to select it · filled dot = has note</div>
            {selectedPointIndex!==null&&(
              <button className="ghost-btn" onClick={()=>setPointToDelete(selectedPointIndex)} style={{padding:"4px 10px",fontSize:11,color:"var(--red)"}}>Delete selected</button>
            )}
          </div>
        </div>
        <div style={{height:240}}>
          <Line ref={chartRef} data={chartData} options={chartOpts} plugins={[chartBgPlugin]}/>
        </div>
        <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
          {[{color:"rgba(82,201,122,0.3)",label:"At/above goal"},{color:"rgba(255,209,102,0.3)",label:"Near goal"},{color:"rgba(255,107,107,0.2)",label:"Below goal"}].map(({color,label})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--ink-soft)"}}>
              <span style={{display:"inline-block",width:12,height:8,borderRadius:2,background:color}}/>{label}
            </div>
          ))}
        </div>
      </div>

      <div style={{background:theme.softPanel,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"16px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,marginBottom:8,color:theme.text}}>🗒 Goal Notes</div>
        <textarea value={chart.notes} onChange={e=>upd(d=>d[selSet].charts[selChart].notes=e.target.value)} placeholder="Strategies, parent notes, observations…" style={{display:"block",width:"100%",minHeight:140,resize:"vertical",fontSize:13,background:"rgba(255,255,255,.6)",border:"1.5px solid #ffd16699"}}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"18px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:14,color:theme.text}}>📝 Log Session</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><SectionLabel>Accuracy %</SectionLabel><input type="number" min={0} max={100} placeholder="0–100" value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPoint(e)} style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:18,textAlign:"center"}}/></div>
              <div><SectionLabel>Date</SectionLabel><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}/></div>
            </div>
            <div><SectionLabel>Session Note</SectionLabel><input type="text" placeholder="What went well? Any observations…" value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPoint(e)}/></div>
            <button className="action-btn" onClick={addPoint} style={{background:pal.chip,color:"#fff",justifyContent:"center",width:"100%",fontSize:14,padding:"11px 18px"}}>✦ Add Data Point</button>
          </div>
          <div style={{marginTop:16,paddingTop:14,borderTop:`1px dashed ${theme.border}`}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,color:theme.subtle,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.07em"}}>🎯 Goal Setup</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{label:"Baseline %",val:chart.startValue,key:"startValue",type:"number"},{label:"Baseline Date",val:chart.startDate,key:"startDate",type:"date"},{label:"Goal %",val:chart.goalValue,key:"goalValue",type:"number"},{label:"Goal Date",val:chart.goalDate,key:"goalDate",type:"date"}].map(({label,val,key,type})=>(
                <div key={key}><SectionLabel>{label}</SectionLabel><input
                  type={type}
                  value={key === "startValue" || key === "goalValue" ? (val ?? "") : (val || "")}
                  onChange={e=>{
                    if (key === "startValue" || key === "goalValue") {
                      upd(d=>d[selSet].charts[selChart][key]=Number(e.target.value));
                      return;
                    }

                    const value = e.target.value;
                    if (!value || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return;

                    const parsed = new Date(`${value}T12:00:00`);
                    if (Number.isNaN(parsed.getTime())) return;

                    if (key === "goalDate" && chart?.startDate && new Date(`${chart.startDate}T12:00:00`).getTime() > parsed.getTime()) {
                      return;
                    }

                    upd(d=>d[selSet].charts[selChart][key]=value);
                  }}
                  style={{fontSize:13}}
                /></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"18px",boxShadow:`0 8px 20px ${theme.shadow}`,flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:12,color:theme.text}}>📋 Session Log</div>
            <div style={{flex:1,minHeight:0,overflowY:"auto"}}>
              {pts.length===0?(
                <div style={{textAlign:"center",padding:"24px 0",color:"var(--ink-soft)",fontSize:13}}>
                  <div style={{fontSize:30,marginBottom:6}}>🌱</div>No sessions in {viewYear} yet!
                </div>
              ):[...pts].reverse().map((pt,i)=>{
                const realIdx=pts.length-1-i;
                return(
                  <div key={i} className="log-row">
                    <div style={{width:44,textAlign:"right",fontFamily:"var(--font-head)",fontWeight:900,fontSize:14,color:pal.chip,flexShrink:0}}>{pt.y}%</div>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{fontSize:12,fontWeight:600}}>{pt.x}</div>
                      {pt.notes&&<div style={{fontSize:11,color:theme.subtle,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pt.notes}</div>}
                    </div>
                    <button className="ghost-btn" onClick={()=>setEditPt({idx:allPts.indexOf(pt),x:pt.x,y:pt.y,notes:pt.notes||""})} style={{padding:"3px 8px",fontSize:11}}>Edit</button>
                    <button className="ghost-btn" onClick={()=>setPointToDelete(allPts.indexOf(pt))} style={{padding:"3px 8px",fontSize:11,color:"#ef4444",borderColor:"#ef4444"}}>Delete</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal show={pointToDelete!==null} onClose={()=>setPointToDelete(null)} title="Delete point?" emoji="⚠️">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:14,color:theme.text,lineHeight:1.5}}>This will remove the selected data point from this goal.</div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>setPointToDelete(null)}>Cancel</button>
            <button className="action-btn" onClick={()=>deletePointAtIndex(pointToDelete)} style={{background:"var(--red)",color:"#fff"}}>Delete</button>
          </div>
        </div>
      </Modal>

      {/* Quick Log Modal */}
      <Modal show={showQL} onClose={()=>setShowQL(false)} title="Quick Log" emoji="⚡">
        <div style={{fontSize:13,color:theme.text,marginBottom:14}}>Log a session for <strong>{chart.name}</strong> right now.</div>
        <QuickLogForm pal={pal} onSave={(v,d,n,e)=>{addPoint(e,v,d,n);setShowQL(false);}}/>
      </Modal>

      {/* Edit Point Modal */}
      <Modal show={!!editPt} onClose={()=>setEditPt(null)} title="Edit Session" emoji="✏️">
        {editPt&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><SectionLabel>Accuracy %</SectionLabel><input type="number" value={editPt.y} onChange={e=>setEditPt(p=>({...p,y:e.target.value}))} style={{marginTop:5}}/></div>
              <div><SectionLabel>Date</SectionLabel><input type="date" value={editPt.x} onChange={e=>setEditPt(p=>({...p,x:e.target.value}))} style={{marginTop:5}}/></div>
            </div>
            <div><SectionLabel>Notes</SectionLabel><textarea value={editPt.notes} onChange={e=>setEditPt(p=>({...p,notes:e.target.value}))} style={{marginTop:5,resize:"vertical",minHeight:60}}/></div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
              <button className="ghost-btn" onClick={()=>setEditPt(null)}>Cancel</button>
              <button className="action-btn" onClick={saveEditPt} style={{background:"var(--teal)",color:"#fff"}}>Save Changes</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Quick Log inline form ────────────────────────────────────────────────────
function QuickLogForm({pal,onSave}){
  const [v,setV]=useState("");
  const [d,setD]=useState(todayStr);
  const [n,setN]=useState("");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><SectionLabel>Accuracy %</SectionLabel><input type="number" min={0} max={100} placeholder="0–100" value={v} onChange={e=>setV(e.target.value)} style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:20,textAlign:"center"}} autoFocus/></div>
        <div><SectionLabel>Date</SectionLabel><input type="date" value={d} onChange={e=>setD(e.target.value)}/></div>
      </div>
      <div><SectionLabel>Note (optional)</SectionLabel><input type="text" placeholder="Quick note…" value={n} onChange={e=>setN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSave(v,d,n,e)}/></div>
      <button className="action-btn" onClick={e=>onSave(v,d,n,e)} style={{background:pal.chip,color:"#fff",justifyContent:"center",width:"100%"}}>✦ Log It</button>
    </div>
  );
}

function MinutesTab({student, selSet, upd, minuteOptions, requestConfirm, theme, pal}){
  const [selectedOptionId,setSelectedOptionId]=useState(minuteOptions[0]?.id ?? "");
  const [minutesValue,setMinutesValue]=useState("30");
  const [editingId,setEditingId]=useState(null);
  const entries=Array.isArray(student.minutes)?[...student.minutes]:[];

  useEffect(()=>{
    if(!minuteOptions.some(option=>option.id===selectedOptionId) && minuteOptions[0]){
      setSelectedOptionId(minuteOptions[0].id);
    }
  },[minuteOptions,selectedOptionId]);

  const selectedOption = minuteOptions.find(option => option.id === selectedOptionId) ?? null;

  const saveEntry=()=>{
    const rawMinutes = String(minutesValue ?? "").trim();
    const effectiveMinutes = rawMinutes === "" ? "30" : rawMinutes;
    const amount = Number(effectiveMinutes);
    if(!selectedOption || !Number.isFinite(amount) || amount <= 0) return;

    const payload = { id: editingId ?? `${Date.now()}-${Math.random().toString(16).slice(2,8)}`, optionId: selectedOption.id, label: selectedOption.label, amount };

    upd(d=>{
      if(!Array.isArray(d[selSet].minutes)) d[selSet].minutes=[];

      if(editingId){
        d[selSet].minutes = d[selSet].minutes.map(item => item.id === editingId ? { ...item, ...payload } : item);
        return;
      }

      const existingEntry = d[selSet].minutes.find(item => item.optionId === selectedOption.id);
      if(existingEntry){
        requestConfirm({
          title: `Replace ${selectedOption.label}?`,
          message: `"${selectedOption.label}" already exists for this student. Replace the current ${existingEntry.amount} minutes with ${amount}?`,
          confirmLabel: "Replace",
          onConfirm: () => {
            upd(inner => {
              inner[selSet].minutes = (inner[selSet].minutes ?? []).map(item =>
                item.id === existingEntry.id ? { ...item, ...payload } : item
              );
            });
            setMinutesValue("30");
            setEditingId(null);
            setSelectedOptionId(minuteOptions[0]?.id ?? "");
          },
        });
        return;
      }

      d[selSet].minutes.push(payload);
    });

    setMinutesValue("30");
    setEditingId(null);
    setSelectedOptionId(minuteOptions[0]?.id ?? "");
  };

  const startEdit=(entry)=>{
    setEditingId(entry.id);
    setSelectedOptionId(entry.optionId);
    setMinutesValue(String(entry.amount));
  };

  const cancelEdit=()=>{
    setEditingId(null);
    setMinutesValue("30");
    setSelectedOptionId(minuteOptions[0]?.id ?? "");
  };

  return(
    <div style={{flex:1,overflow:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"18px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:12,color:theme.text}}>
          {editingId ? "✏️ Edit Minutes Entry" : "⏱ Add Minutes"}
        </div>

        {minuteOptions.length===0?(
          <div style={{padding:"14px 0",textAlign:"center",color:theme.subtle,fontSize:13}}>
            No minute options are set up yet. Add a global option from the site settings.
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"minmax(180px, 1.2fr) minmax(120px, .8fr) auto",gap:10,alignItems:"end"}}>
            <div>
              <SectionLabel>Category</SectionLabel>
              <select value={selectedOptionId} onChange={e=>setSelectedOptionId(e.target.value)} style={{background:theme.panel,borderColor:theme.border,color:theme.text}}>
                {minuteOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <SectionLabel>Minutes</SectionLabel>
              <input type="number" min={0} step={5} value={minutesValue} onChange={e=>setMinutesValue(e.target.value)} placeholder="30"/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="action-btn" onClick={saveEntry} style={{background:theme.primary,color:"#fff",padding:"10px 16px"}}>{editingId ? "Save" : "Add"}</button>
              {editingId && <button className="ghost-btn" onClick={cancelEdit} style={{padding:"10px 12px"}}>Cancel</button>}
            </div>
          </div>
        )}
      </div>

      <div style={{background:"var(--paper)",borderRadius:"var(--r-lg)",border:"2px solid var(--border)",padding:"18px",boxShadow:"var(--shadow-sm)"}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:12}}>📋 Minutes Added</div>
        {entries.length===0?(
          <div style={{textAlign:"center",padding:"20px 0",color:"var(--ink-soft)",fontSize:13}}>No minutes added for this student yet.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {entries.map((entry,i)=>(
              <div key={entry.id ?? i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"12px 14px",borderRadius:10,background:"var(--cream)",border:"1.5px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
                  <div style={{minWidth:90,fontFamily:"var(--font-head)",fontWeight:800,color:"var(--ink)"}}>{entry.label || "Minutes"}</div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:"#26c6b0"}}>{entry.amount} min</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="ghost-btn" onClick={()=>startEdit(entry)} style={{padding:"4px 8px",fontSize:11}}>Edit</button>
                  <button className="ghost-btn" onClick={()=>upd(d=>d[selSet].minutes = (d[selSet].minutes ?? []).filter(item => item.id !== entry.id))} style={{padding:"4px 8px",fontSize:11}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({show,onClose,sets,selSet,onPrint}){
  const student=sets[selSet];
  if(!show||!student) return null;
  const today=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const pal=getPal(selSet);
  const minuteEntries = Array.isArray(student.minutes) ? student.minutes : [];
  const totalMinutes = minuteEntries.reduce((sum,entry)=>sum + Number(entry.amount || 0),0);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,45,58,.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} className="card-appear print-report" style={{background:"var(--paper)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-lg)",padding:36,width:"92%",maxWidth:680,maxHeight:"90vh",overflowY:"auto",border:"2px solid var(--border)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}} className="no-print">
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17}}>📄 Progress Report</div>
          <div style={{display:"flex",gap:8}}>
            <button className="action-btn" onClick={onPrint} style={{background:"var(--teal)",color:"#fff"}}>🖨 Print</button>
            <button className="ghost-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Report content */}
        <div style={{borderTop:"3px solid "+pal.chip,paddingTop:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,color:pal.text}}>{student.name}</div>
              <div style={{fontSize:13,color:"var(--ink-soft)",marginTop:3}}>Progress Report · Generated {today}</div>
            </div>
            <div style={{fontSize:28}}>{getEmoji(student.name)}</div>
          </div>

          <div style={{marginBottom:20,padding:"16px",background:"var(--cream)",borderRadius:"var(--r)",border:"1.5px solid var(--border)"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:6}}>🕒 Minutes</div>
            <div style={{fontSize:14,color:"var(--ink-mid)"}}>{minuteEntries.length ? `${totalMinutes} minutes total` : "No minutes recorded"}</div>
            {minuteEntries.length>0&&(
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                {Object.entries(minuteEntries.reduce((acc,entry)=>{acc[entry.label || 'Other']=(acc[entry.label || 'Other']||0)+Number(entry.amount||0); return acc;},{})).map(([label,total])=>(
                  <div key={label} style={{fontSize:12,color:"var(--ink-soft)"}}>{label}: {total} min</div>
                ))}
              </div>
            )}
          </div>

          {student.charts.map((c,ci)=>{
            const pts=c.data??[];
            const latest=pts[pts.length-1];
            const goalPct=latest&&c.goalValue?Math.round((latest.y/c.goalValue)*100):null;
            const thisYear=currentYear();
            const yearPts=pts.filter(p=>p.x?.startsWith(String(thisYear)));
            return(
              <div key={ci} className="report-section" style={{marginBottom:24,padding:"16px",background:"var(--cream)",borderRadius:"var(--r)",border:"1.5px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>{c.name}</div>
                  {latest&&<div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:pal.chip}}>{latest.y}%</div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                  {[
                    {label:"Baseline",val:`${c.startValue}%`},
                    {label:"Goal",val:`${c.goalValue}%`},
                    {label:"Progress to Goal",val:goalPct!=null?`${goalPct}%`:"—"},
                  ].map(({label,val})=>(
                    <div key={label} style={{background:"var(--paper)",borderRadius:8,padding:"10px 12px",border:"1.5px solid var(--border)"}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18}}>{val}</div>
                      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"var(--ink-soft)"}}>{label}</div>
                    </div>
                  ))}
                </div>
                {yearPts.length>0&&(
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{background:"var(--paper)"}}>
                      {["Date","Score","Notes"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px",fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",color:"var(--ink-soft)",borderBottom:"1.5px solid var(--border)"}}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {[...yearPts].reverse().slice(0,10).map((pt,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid var(--border)"}}>
                          <td style={{padding:"6px 8px"}}>{pt.x}</td>
                          <td style={{padding:"6px 8px",fontFamily:"var(--font-head)",fontWeight:700,color:pal.chip}}>{pt.y}%</td>
                          <td style={{padding:"6px 8px",color:"var(--ink-soft)"}}>{pt.notes||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {c.notes&&<div style={{marginTop:10,fontSize:12,color:"var(--ink-mid)",padding:"8px 10px",background:"var(--yellow-lt)",borderRadius:6,border:"1px solid #ffd16666"}}>📝 {c.notes}</div>}
              </div>
            );
          })}

          {(student.accommodations??[]).length>0&&(
            <div className="report-section" style={{padding:"16px",background:"var(--cream)",borderRadius:"var(--r)",border:"1.5px solid var(--border)"}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:10}}>🛠 Accommodations</div>
              {(student.accommodations??[]).map((a,i)=>(
                <div key={i} style={{fontSize:13,padding:"4px 0",borderBottom:"1px dashed var(--border)"}}>{i+1}. {a.name}</div>
              ))}
            </div>
          )}

          {(student.accommodations??[]).length===0&&(
            <div className="report-section" style={{padding:"16px",background:"var(--cream)",borderRadius:"var(--r)",border:"1.5px solid var(--border)",color:"var(--ink-soft)"}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:4}}>🛠 Accommodations</div>
              <div style={{fontSize:13}}>No accommodations currently recorded.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App(){
  const [sets,setSets]=useState(()=>{
    try{
      const s=localStorage.getItem("pm_v2");
      const parsed = s ? JSON.parse(s) : [{name:"Alex Johnson",collapsed:false,accommodations:[],accDays:{},minutes:[],
        charts:[{name:"Reading Fluency",startValue:40,startDate:"",goalValue:90,goalDate:"",data:[],notes:"",attachments:[]}]}];
      return Array.isArray(parsed) ? parsed.map(student => ({
        ...student,
        accommodations: Array.isArray(student.accommodations) ? student.accommodations : [],
        accDays: student.accDays ?? {},
        minutes: Array.isArray(student.minutes) ? student.minutes : [],
        charts: Array.isArray(student.charts) ? student.charts : [],
      })) : [];
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
  const [view,setView]=useState("dashboard"); // "dashboard" | "student"
  const [selSet,setSelSet]=useState(0);
  const [selChart,setSelChart]=useState(0);
  const [activeTab,setActiveTab]=useState("goals");
  const [history,setHistory]=useState([]);
  const [editPt,setEditPt]=useState(null);
  const [showAtt,setShowAtt]=useState(false);
  const [showAS,setShowAS]=useState(false);
  const [showAG,setShowAG]=useState(false);
  const [showReport,setShowReport]=useState(false);
  const [bulkReportOpen,setBulkReportOpen]=useState(false);
  const [bulkSelectedStudentIds,setBulkSelectedStudentIds]=useState([]);
  const [showShortcuts,setShowShortcuts]=useState(false);
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
    upd(d => d.push({ name, emoji, groupId: "", collapsed: false, accommodations: [], accDays: {}, minutes: [], charts: [] }));
    setSelSet(sets.length);setSelChart(0);setActiveTab("goals");setView("student");setNewSName("");setNewSEmoji("");setShowAS(false);
  };
  const addGoal=()=>{
    if(!newGName.trim()) return;
    upd(d=>d[selSet].charts.push({name:newGName.trim(),startValue:0,startDate:"",goalValue:100,goalDate:"",data:[],notes:"",attachments:[]}));
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
    const payload={version:1,groups,students:sets,minuteOptions};
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    a.download="progress-data.json";a.click();
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
      const goalPct = latest && c.goalValue ? Math.round((latest.y / c.goalValue) * 100) : null;
      return `
        <section class="goal-block">
          <div class="goal-header"><span>${(c.name ?? "Goal").replace(/[&<>\"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}</span><span class="goal-value">${latest ? `${latest.y}%` : "—"}</span></div>
          <div class="mini-grid">
            <div class="mini-box"><div class="mini-label">Baseline</div><div class="mini-number">${c.startValue ?? 0}%</div></div>
            <div class="mini-box"><div class="mini-label">Goal</div><div class="mini-number">${c.goalValue ?? 0}%</div></div>
            <div class="mini-box"><div class="mini-label">Progress to Goal</div><div class="mini-number">${goalPct != null ? `${goalPct}%` : "—"}</div></div>
          </div>
          ${(latest && latest.notes) ? `<div class="goal-note">Session note: ${latest.notes}</div>` : ""}
          ${(c.notes) ? `<div class="goal-note goal-notes-block">Goal notes: ${c.notes}</div>` : ""}
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
  const printHtmlDocument=(contentHtml,title)=>{
    const printHtml = `<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title><style>@page{size:A4 portrait;margin:0.6in;}body{margin:0;background:#fff;color:#2d2d3a;font-family:"Segoe UI",Arial,sans-serif;line-height:1.4}.report-page{break-before:page;page-break-before:always}.report-page:first-child{break-before:auto;page-break-before:auto}.report{width:100%;max-width:100%;box-sizing:border-box}.report-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5dfd5;padding-bottom:10px;margin-bottom:18px}.report-name{font-size:20px;font-weight:900;color:#2d2d3a}.report-meta{font-size:12px;color:#6b6b7d;margin-top:2px}.badge{width:18px;height:18px;border-radius:6px;background:linear-gradient(135deg,#ff6b6b 0 16.66%,#ffd166 16.66% 33.32%,#52c97a 33.32% 49.98%,#4e9af1 49.98% 66.64%,#a78bfa 66.64% 83.3%,#ff9f6b 83.3% 100%);display:inline-block}.section{border:1px solid #e7e1d8;border-radius:12px;background:#fff;padding:14px 16px;margin-bottom:18px;box-sizing:border-box;page-break-inside:avoid;break-inside:avoid}.section-title{font-size:15px;font-weight:800;margin-bottom:10px}.mini-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}.mini-box{border:1px solid #e7e1d8;border-radius:8px;padding:10px 12px;background:#faf7f3;min-height:72px}.mini-label{font-size:10px;color:#7d7d8f;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}.mini-number{font-size:20px;font-weight:800;line-height:1.2}.goal-header{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:16px;margin-bottom:8px}.goal-value{color:#ff6b6b}.goal-note{margin-top:10px;font-size:12px;color:#4d4d5f;background:#fffaf0;border:1px solid #f8dd9a;border-radius:8px;padding:8px 10px}.goal-notes-block{background:#fff7f0;border-color:#f9c7a5}.acc-item{padding:4px 0;border-bottom:1px dashed #ece5dc;font-size:13px}.acc-item:last-child{border-bottom:none}.empty{font-size:13px;color:#77778d}.minutes-summary{font-size:13px;color:#4d4d5f;margin-top:8px}.footer{margin-top:20px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#7d7d8f;border-top:1px solid #ece5dc;padding-top:10px}</style></head><body>${contentHtml}</body></html>`;
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
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (error) {
        console.error("Failed to print report", error);
      }
      setTimeout(() => iframe.remove(), 1000);
    };
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
      const goalPct = latest && c.goalValue ? Math.round((latest.y / c.goalValue) * 100) : null;
      return `
        <section class="goal-block">
          <div class="goal-header">
            <span>${(c.name ?? "Goal").replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}</span>
            <span class="goal-value">${latest ? `${latest.y}%` : "—"}</span>
          </div>
          <div class="mini-grid">
            <div class="mini-box"><div class="mini-label">Baseline</div><div class="mini-number">${c.startValue ?? 0}%</div></div>
            <div class="mini-box"><div class="mini-label">Goal</div><div class="mini-number">${c.goalValue ?? 0}%</div></div>
            <div class="mini-box"><div class="mini-label">Progress to Goal</div><div class="mini-number">${goalPct != null ? `${goalPct}%` : "—"}</div></div>
          </div>
          ${(latest && latest.notes) ? `<div class="goal-note">Session note: ${latest.notes}</div>` : ""}
          ${(c.notes) ? `<div class="goal-note goal-notes-block">Goal notes: ${c.notes}</div>` : ""}
        </section>
      `;
    }).join("");

    const accMarkup = (student.accommodations ?? []).length ? (student.accommodations ?? []).map((a, i) => `<div class="acc-item">${i + 1}. ${a.name}</div>`).join("") : "<div class=\"empty\">No accommodations recorded.</div>";

    const printHtml = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Progress Report - ${student.name}</title>
        <style>
          @page { size: A4 portrait; margin: 0.6in; }
          body {
            margin: 0;
            background: #ffffff;
            color: #2d2d3a;
            font-family: "Segoe UI", Arial, sans-serif;
            line-height: 1.4;
          }
          .report {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e5dfd5;
            padding-bottom: 10px;
            margin-bottom: 18px;
          }
          .report-name {
            font-size: 20px;
            font-weight: 900;
            color: #2d2d3a;
          }
          .report-meta {
            font-size: 12px;
            color: #6b6b7d;
            margin-top: 2px;
          }
          .badge {
            width: 18px;
            height: 18px;
            border-radius: 6px;
            background: linear-gradient(135deg, #ff6b6b 0 16.66%, #ffd166 16.66% 33.32%, #52c97a 33.32% 49.98%, #4e9af1 49.98% 66.64%, #a78bfa 66.64% 83.3%, #ff9f6b 83.3% 100%);
            display: inline-block;
          }
          .section {
            border: 1px solid #e7e1d8;
            border-radius: 12px;
            background: #fff;
            padding: 14px 16px;
            margin-bottom: 18px;
            box-sizing: border-box;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .section-title {
            font-size: 15px;
            font-weight: 800;
            margin-bottom: 10px;
          }
          .mini-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-top: 10px;
          }
          .mini-box {
            border: 1px solid #e7e1d8;
            border-radius: 8px;
            padding: 10px 12px;
            background: #faf7f3;
            min-height: 72px;
          }
          .mini-label {
            font-size: 10px;
            color: #7d7d8f;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .mini-number {
            font-size: 20px;
            font-weight: 800;
            line-height: 1.2;
          }
          .mini-sub {
            font-size: 11px;
            color: #7d7d8f;
            margin-top: 4px;
          }
          .goal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 800;
            font-size: 16px;
            margin-bottom: 8px;
          }
          .goal-value {
            color: #ff6b6b;
          }
          .goal-note {
            margin-top: 10px;
            font-size: 12px;
            color: #4d4d5f;
            background: #fffaf0;
            border: 1px solid #f8dd9a;
            border-radius: 8px;
            padding: 8px 10px;
          }
          .goal-notes-block {
            background: #fff7f0;
            border-color: #f9c7a5;
          }
          .acc-item {
            padding: 4px 0;
            border-bottom: 1px dashed #ece5dc;
            font-size: 13px;
          }
          .acc-item:last-child { border-bottom: none; }
          .empty {
            font-size: 13px;
            color: #77778d;
          }
          .minutes-summary {
            font-size: 13px;
            color: #4d4d5f;
            margin-top: 8px;
          }
          .footer {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #7d7d8f;
            border-top: 1px solid #ece5dc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="report-header">
            <div>
              <div class="report-name">${student.name}</div>
              <div class="report-meta">Progress Report · Generated ${today}</div>
            </div>
            <span class="badge"></span>
          </div>

          <div class="section">
            <div class="section-title">Minutes</div>
            ${minuteEntries.length ? `<div class="minutes-summary">${totalMinutes} minutes total${minuteSummary.length ? ` · ${minuteSummary.map(([label, total]) => `${label}: ${total} min`).join(" · ")}` : ""}</div>` : "<div class=\"empty\">No minutes recorded</div>"}
          </div>

          ${goalMarkup}

          <div class="section">
            <div class="section-title">Accommodations</div>
            ${accMarkup}
          </div>

          <div class="footer">
            <span>Progress Monitor</span>
            <span>${today}</span>
          </div>
        </div>
      </body>
      </html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Progress report print");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.srcdoc = printHtml;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (error) {
        console.error("Failed to print report", error);
      }

      setTimeout(() => {
        iframe.remove();
      }, 1000);
    };
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
      const normalizedSets = nextSets.map(student => ({
        ...student,
        accommodations: Array.isArray(student.accommodations) ? student.accommodations : [],
        accDays: student.accDays ?? {},
        minutes: Array.isArray(student.minutes) ? student.minutes : [],
        charts: Array.isArray(student.charts) ? student.charts : [],
        groupId: student.groupId ?? "",
      }));
      setSets(normalizedSets);
      if (d && Array.isArray(d.groups)) setGroups(d.groups);
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
  const handleSelectStudent=si=>{setSelSet(si);setSelChart(0);setActiveTab("goals");setView("student");};
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
      if(e.key==="?"||e.key==="/"){e.preventDefault();setShowShortcuts(s=>!s);}
      if(e.key==="h"||e.key==="H"){e.preventDefault();setView("dashboard");}
      if(e.key==="Escape"){setShowShortcuts(false);setShowQL(false);setShowReport(false);}
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
              <button className="ghost-btn" onClick={()=>setShowMinuteOptions(true)} style={{justifyContent:"center",fontSize:11, color:theme.text, borderColor: theme.border, background: theme.card}}>⏱ Minutes Options</button>
              <div style={{display:"flex",gap:6}}>
                <button className="ghost-btn" onClick={exportJSON} style={{flex:1,justifyContent:"center"}}>↓ Export</button>
                <label className="ghost-btn" style={{flex:1,justifyContent:"center",cursor:"pointer"}}>↑ Import<input type="file" accept=".json" onChange={importJSON} style={{display:"none"}}/></label>
              </div>
              <button className="ghost-btn" onClick={()=>setShowShortcuts(true)} style={{justifyContent:"center",fontSize:11}}>⌨ Shortcuts</button>
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
                  <span style={{fontSize:19}}>{getEmoji(student?.name??"")}</span>
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
                  {activeTab==="goals"&&<><button className="ghost-btn" onClick={undo} disabled={!history.length} style={{color:theme.text, borderColor: theme.border, background: theme.card}}>↩ Undo</button><button className="ghost-btn" onClick={()=>setShowAtt(true)} style={{color:theme.text, borderColor: theme.border, background: theme.card}}>📎 Files</button></>}
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
              <AccommodationsTab student={student} selSet={selSet} upd={upd} theme={theme} pal={pal}/>
            ):activeTab==="minutes"?(
              <MinutesTab student={student} selSet={selSet} upd={upd} minuteOptions={minuteOptions} requestConfirm={requestConfirm} theme={theme} pal={pal}/>
            ):(
              <GoalsTab sets={sets} selSet={selSet} selChart={selChart} setSelChart={setSelChart}
                upd={upd} snap={snap} undo={undo} history={history}
                showAtt={showAtt} setShowAtt={setShowAtt} setShowAG={setShowAG}
                chartRef={chartRef} editPt={editPt} setEditPt={setEditPt} theme={theme} pal={pal}/>
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
        {chart&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><SectionLabel>Upload a File</SectionLabel>
              <input type="file" style={{marginTop:6}} onChange={e=>{
                const f=e.target.files[0];if(!f) return;
                const r=new FileReader();
                r.onload=ev=>{upd(d=>{if(!Array.isArray(d[selSet].charts[selChart].attachments))d[selSet].charts[selChart].attachments=[];d[selSet].charts[selChart].attachments.push({name:f.name,type:f.type,size:f.size,content:ev.target.result.split(",")[1]});});};
                r.readAsDataURL(f);e.target.value="";
              }}/></div>
            {(chart.attachments??[]).length===0?(<div style={{textAlign:"center",padding:"14px 0",color:"var(--ink-soft)",fontSize:13}}>No files yet</div>
            ):(chart.attachments??[]).map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--cream)",borderRadius:8,border:"1.5px solid var(--border)"}}>
                <span style={{fontSize:20}}>📄</span>
                <span style={{flex:1,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                <span style={{fontSize:11,color:"var(--ink-soft)"}}>{Math.round(f.size/1024)}KB</span>
                <button className="ghost-btn" onClick={()=>{const bytes=Uint8Array.from(atob(f.content),c=>c.charCodeAt(0));const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([bytes],{type:f.type}));a.download=f.name;a.click();}} style={{padding:"3px 10px"}}>↓</button>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"flex-end"}}><button className="ghost-btn" onClick={()=>setShowAtt(false)}>Close</button></div>
          </div>
        )}
      </Modal>

      {/* Shortcuts modal */}
      <Modal show={showShortcuts} onClose={()=>setShowShortcuts(false)} title="Keyboard Shortcuts" emoji="⌨">
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            ["N","Quick log a session (on student page)"],
            ["H","Go to Dashboard"],
            ["Ctrl+Z","Undo last change"],
            ["?  or  /","Toggle this shortcuts panel"],
            ["Escape","Close any open modal"],
            ["Ctrl+click chart point","Delete that data point"],
          ].map(([key,desc])=>(
            <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px dashed var(--border)"}}>
              <span className="kbd">{key}</span>
              <span style={{fontSize:13,color:"var(--ink-mid)"}}>{desc}</span>
            </div>
          ))}
        </div>
      </Modal>

      <ReportModal show={showReport} onClose={()=>setShowReport(false)} sets={sets} selSet={selSet} onPrint={printStudentReport} />

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

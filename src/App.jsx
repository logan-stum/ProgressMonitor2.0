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
    .no-print{display:none!important}
    body{background:white}
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
function AccommodationsTab({student,selSet,upd}){
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
          <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18}}>🛠 Accommodations</div>
          <div style={{fontSize:12,color:"var(--ink-soft)",marginTop:2}}>
            {accList.length===0?"No accommodations set up yet":`${accList.length} accommodation${accList.length!==1?"s":""} · ${student?.name}`}
            {complianceRate!==null&&<span style={{marginLeft:10,fontWeight:700,color:"#52c97a"}}>{complianceRate}% compliance this month</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select value={calYear} onChange={e=>setCalYear(Number(e.target.value))}>
            {yearList.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button className="ghost-btn" onClick={openEdit}>✏️ Edit</button>
          {accList.length===0&&<button className="action-btn" onClick={()=>setShowSetup(true)} style={{background:"var(--teal)",color:"#fff"}}>+ Set Up</button>}
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

          <div style={{background:"var(--paper)",borderRadius:"var(--r-lg)",border:"2px solid var(--border)",padding:"20px",boxShadow:"var(--shadow-sm)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <button className="ghost-btn" onClick={prevMonth} style={{padding:"5px 12px"}}>‹</button>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:16}}>{MONTHS[calMonth]} {calYear}</div>
              <button className="ghost-btn" onClick={nextMonth} style={{padding:"5px 12px"}}>›</button>
            </div>
            <Calendar year={calYear} month={calMonth} onSelectDay={openDay} accDays={accDays} accList={accList} selectedDay={selDay}/>
            <div style={{marginTop:14,display:"flex",gap:14,flexWrap:"wrap"}}>
              {[{color:"#52c97a",label:"Given"},{color:"#ff6b6b",label:"Refused"},{color:"#c8c8d8",label:"Not Given"},{color:"#a78bfa",label:"Absent"}].map(({color,label})=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--ink-soft)"}}>
                  <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:color}}/>{label}
                </div>
              ))}
            </div>
          </div>

          <div style={{background:"var(--paper)",borderRadius:"var(--r-lg)",border:"2px solid var(--border)",padding:"18px",boxShadow:"var(--shadow-sm)"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:12}}>📋 Accommodation List</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {accList.map((a,i)=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--cream)",borderRadius:8,border:"1.5px solid var(--border)"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"var(--teal)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,flexShrink:0}}>{i+1}</div>
                  <span style={{fontSize:13,fontWeight:600}}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ):(
        <div style={{background:"var(--paper)",borderRadius:"var(--r-lg)",border:"2px dashed var(--border)",padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>🛠</div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:6}}>No accommodations yet</div>
          <div style={{fontSize:13,color:"var(--ink-soft)",marginBottom:20}}>Set up once, log every day.</div>
          <button className="action-btn" onClick={()=>setShowSetup(true)} style={{background:"var(--teal)",color:"#fff"}}>+ Set Up Accommodations</button>
        </div>
      )}

      <Modal show={showSetup} onClose={()=>setShowSetup(false)} title="Set Up Accommodations" emoji="🛠" wide>
        <div style={{fontSize:13,color:"var(--ink-mid)",marginBottom:16}}>Enter each accommodation for <strong>{student?.name}</strong>. Press Enter to add.</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input type="text" placeholder="Type an accommodation and press Enter…" value={setupInput} onChange={e=>setSetupInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&setupInput.trim()){setSetupList(l=>[...l,setupInput.trim()]);setSetupInput("");}}} autoFocus/>
          <button className="action-btn" onClick={()=>{if(setupInput.trim()){setSetupList(l=>[...l,setupInput.trim()]);setSetupInput("");}}} style={{background:"var(--teal)",color:"#fff",flexShrink:0}}>Add</button>
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
function Dashboard({sets,onSelectStudent,onAddStudent,getPal,getEmoji}){
  const thisYear=currentYear();
  return(
    <div style={{flex:1,overflow:"auto",padding:"24px 28px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22}}>👋 Good morning!</div>
          <div style={{fontSize:13,color:"var(--ink-soft)",marginTop:2}}>Here's your class at a glance.</div>
        </div>
        <button className="action-btn" onClick={onAddStudent} style={{background:"var(--teal)",color:"#fff"}}>+ Add Student</button>
      </div>

      {sets.length===0?(
        <div style={{textAlign:"center",padding:"60px 24px",color:"var(--ink-soft)"}}>
          <div style={{fontSize:56,marginBottom:12}}>🎒</div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,marginBottom:8}}>No students yet</div>
          <button className="action-btn" onClick={onAddStudent} style={{background:"var(--teal)",color:"#fff",marginTop:8}}>+ Add Your First Student</button>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
          {sets.map((s,si)=>{
            const p=getPal(si);
            const yearPts=s.charts.flatMap(c=>(c.data??[]).filter(pt=>pt.x?.startsWith(String(thisYear))));
            const allPts=s.charts.flatMap(c=>c.data??[]);
            const latest=allPts[allPts.length-1];
            const thisMonthStr=`${thisYear}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
            const monthPts=allPts.filter(pt=>pt.x?.startsWith(thisMonthStr));
            const streak=monthPts.length;
            const accDays=s.accDays??{};
            const todayAcc=accDays[todayStr()];
            const accDone=todayAcc&&Object.values(todayAcc).length>0;
            return(
              <div key={si} className="stu-card" onClick={()=>onSelectStudent(si)} style={{borderColor:p.border}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${p.chip},${p.chip}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{getEmoji(s.name)}</div>
                  <div style={{flex:1,overflow:"hidden"}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:p.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                    <div style={{fontSize:11,color:"var(--ink-soft)"}}>{s.charts.length} goal{s.charts.length!==1?"s":""}</div>
                  </div>
                  {accDone&&<span title="Accommodations logged today" style={{fontSize:16}}>✅</span>}
                </div>

                {s.charts.map((c,ci)=>{
                  const cPts=c.data??[];
                  const cLatest=cPts[cPts.length-1];
                  if(!cLatest) return null;
                  const goalPct=c.goalValue?Math.round((cLatest.y/c.goalValue)*100):null;
                  return(
                    <div key={ci} style={{background:p.bg,borderRadius:8,padding:"8px 10px",border:`1.5px solid ${p.border}44`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:700,color:p.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.name}</span>
                        <span style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:14,color:p.chip,flexShrink:0,marginLeft:6}}>{cLatest.y}%</span>
                      </div>
                      <Sparkline data={cPts} color={p.chip}/>
                      {goalPct!==null&&(
                        <div style={{marginTop:5,height:4,background:"var(--border)",borderRadius:99,overflow:"hidden"}}>
                          <div style={{width:`${Math.min(goalPct,100)}%`,height:"100%",background:p.chip,borderRadius:99,transition:"width .4s ease"}}/>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{display:"flex",gap:8,marginTop:2}}>
                  {streak>0&&<div style={{fontSize:11,color:"var(--ink-soft)"}}>🔥 {streak} session{streak!==1?"s":""} this month</div>}
                  {yearPts.length>0&&<div style={{fontSize:11,color:"var(--ink-soft)",marginLeft:"auto"}}>{yearPts.length} pts in {thisYear}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Goals Tab ────────────────────────────────────────────────────────────────
function GoalsTab({sets,selSet,selChart,setSelChart,upd,snap,undo,history,showAtt,setShowAtt,setShowAG,chartRef,editPt,setEditPt}){
  const student=sets[selSet];
  const chart=student?.charts?.[selChart]??null;
  const pal=getPal(selSet);

  const [newVal,setNewVal]=useState("");
  const [newDate,setNewDate]=useState(todayStr);
  const [newNote,setNewNote]=useState("");
  const [viewYear,setViewYear]=useState(currentYear);
  const [showQL,setShowQL]=useState(false); // quick log modal
  const [selectedPointIndex,setSelectedPointIndex]=useState(null);
  const [pointToDelete,setPointToDelete]=useState(null);

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

  const chartData={
    datasets:[
      {label:chart?.name??"Progress",data:pts,borderColor:pal.chip,backgroundColor:pal.chip+"22",tension:0.35,fill:true,
       pointRadius:pts.map(p=>{
         const absIndex = allPts.indexOf(p);
         return absIndex===selectedPointIndex ? 8 : p.notes ? 7 : 5;
       }),pointHoverRadius:9,pointBackgroundColor:pts.map(p=>p.notes?pal.chip:"#fff"),
       pointBorderColor:pts.map(p=>p.notes?pal.chip:pal.chip),pointBorderWidth:pts.map(p=>p.notes?0:2),pointHitRadius:14},
      chart?.startDate&&chart?.goalDate&&{label:"🎯 Target",data:[{x:chart.startDate,y:chart.startValue},{x:chart.goalDate,y:chart.goalValue}],
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
        {streak>0&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:99,background:"#fffbec",border:"1.5px solid #ffd16666",fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"#9a6a00"}}>🔥 {streak} session{streak!==1?"s":""} this month</div>}
        <button className="action-btn" onClick={()=>setShowQL(true)} style={{background:pal.chip,color:"#fff",marginLeft:"auto",padding:"6px 14px",fontSize:12}}>⚡ Quick Log</button>
      </div>

      {latest&&(
        <div className="fade-up" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {label:"Latest Score",   val:`${latest.y}%`,                  sub:latest.x,                                                   color:pal.chip, pct:latest.y},
            {label:"Goal Target",    val:`${chart.goalValue}%`,            sub:chart.goalDate||"No target date",                           color:"#52c97a",pct:chart.goalValue},
            {label:"Progress to Goal",val:goalPct!=null?`${goalPct}%`:"—",sub:trend!=null?(Number(trend)>=0?`▲ +${trend}% from last`:`▼ ${trend}% from last`):"Need more data",color:goalPct>=100?"#52c97a":"#ffd166",pct:goalPct??0},
          ].map(({label,val,sub,color,pct})=>(
            <div key={label} className="stat-card">
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

      <div style={{background:"var(--paper)",borderRadius:"var(--r-lg)",border:"2px solid var(--border)",padding:"16px",boxShadow:"var(--shadow-sm)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:10}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14}}>Progress Chart — {viewYear}</div>
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

      <div style={{background:"var(--yellow-lt)",borderRadius:"var(--r-lg)",border:"2px solid #ffd166",padding:"16px",boxShadow:"var(--shadow-sm)"}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,marginBottom:8,color:"#9a6a00"}}>🗒 Goal Notes</div>
        <textarea value={chart.notes} onChange={e=>upd(d=>d[selSet].charts[selChart].notes=e.target.value)} placeholder="Strategies, parent notes, observations…" style={{resize:"none",height:80,fontSize:13,background:"rgba(255,255,255,.6)",border:"1.5px solid #ffd16699"}}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"var(--paper)",borderRadius:"var(--r-lg)",border:"2px solid var(--border)",padding:"18px",boxShadow:"var(--shadow-sm)"}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:14}}>📝 Log Session</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><SectionLabel>Accuracy %</SectionLabel><input type="number" min={0} max={100} placeholder="0–100" value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPoint(e)} style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:18,textAlign:"center"}}/></div>
              <div><SectionLabel>Date</SectionLabel><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}/></div>
            </div>
            <div><SectionLabel>Session Note</SectionLabel><input type="text" placeholder="What went well? Any observations…" value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPoint(e)}/></div>
            <button className="action-btn" onClick={addPoint} style={{background:pal.chip,color:"#fff",justifyContent:"center",width:"100%",fontSize:14,padding:"11px 18px"}}>✦ Add Data Point</button>
          </div>
          <div style={{marginTop:16,paddingTop:14,borderTop:"1px dashed var(--border)"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,color:"var(--ink-soft)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.07em"}}>🎯 Goal Setup</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{label:"Baseline %",val:chart.startValue,key:"startValue",type:"number"},{label:"Baseline Date",val:chart.startDate,key:"startDate",type:"date"},{label:"Goal %",val:chart.goalValue,key:"goalValue",type:"number"},{label:"Goal Date",val:chart.goalDate,key:"goalDate",type:"date"}].map(({label,val,key,type})=>(
                <div key={key}><SectionLabel>{label}</SectionLabel><input type={type} value={val||""} onChange={e=>upd(d=>d[selSet].charts[selChart][key]=type==="number"?Number(e.target.value):e.target.value)} style={{fontSize:13}}/></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"var(--paper)",borderRadius:"var(--r-lg)",border:"2px solid var(--border)",padding:"18px",boxShadow:"var(--shadow-sm)",flex:1}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:12}}>📋 Session Log</div>
            <div style={{maxHeight:185,overflowY:"auto"}}>
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
                      {pt.notes&&<div style={{fontSize:11,color:"var(--ink-soft)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pt.notes}</div>}
                    </div>
                    <button className="ghost-btn" onClick={()=>setEditPt({idx:allPts.indexOf(pt),x:pt.x,y:pt.y,notes:pt.notes||""})} style={{padding:"3px 8px",fontSize:11}}>Edit</button>
                    <button className="ghost-btn" onClick={()=>setPointToDelete(allPts.indexOf(pt))} style={{padding:"3px 8px",fontSize:11,color:"var(--red)"}}>Delete</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal show={pointToDelete!==null} onClose={()=>setPointToDelete(null)} title="Delete point?" emoji="⚠️">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:14,color:"var(--ink-mid)",lineHeight:1.5}}>This will remove the selected data point from this goal.</div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>setPointToDelete(null)}>Cancel</button>
            <button className="action-btn" onClick={()=>deletePointAtIndex(pointToDelete)} style={{background:"var(--red)",color:"#fff"}}>Delete</button>
          </div>
        </div>
      </Modal>

      {/* Quick Log Modal */}
      <Modal show={showQL} onClose={()=>setShowQL(false)} title="Quick Log" emoji="⚡">
        <div style={{fontSize:13,color:"var(--ink-mid)",marginBottom:14}}>Log a session for <strong>{chart.name}</strong> right now.</div>
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

function MinutesTab({student, selSet, upd, minuteOptions, requestConfirm}){
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
      <div style={{background:"var(--paper)",borderRadius:"var(--r-lg)",border:"2px solid var(--border)",padding:"18px",boxShadow:"var(--shadow-sm)"}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:12}}>
          {editingId ? "✏️ Edit Minutes Entry" : "⏱ Add Minutes"}
        </div>

        {minuteOptions.length===0?(
          <div style={{padding:"14px 0",textAlign:"center",color:"var(--ink-soft)",fontSize:13}}>
            No minute options are set up yet. Add a global option from the site settings.
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"minmax(180px, 1.2fr) minmax(120px, .8fr) auto",gap:10,alignItems:"end"}}>
            <div>
              <SectionLabel>Category</SectionLabel>
              <select value={selectedOptionId} onChange={e=>setSelectedOptionId(e.target.value)}>
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
              <button className="action-btn" onClick={saveEntry} style={{background:"var(--teal)",color:"#fff",padding:"10px 16px"}}>{editingId ? "Save" : "Add"}</button>
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
function ReportModal({show,onClose,sets,selSet}){
  const student=sets[selSet];
  if(!show||!student) return null;
  const today=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const pal=getPal(selSet);
  const minuteEntries = Array.isArray(student.minutes) ? student.minutes : [];
  const totalMinutes = minuteEntries.reduce((sum,entry)=>sum + Number(entry.amount || 0),0);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,45,58,.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} className="card-appear" style={{background:"var(--paper)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-lg)",padding:36,width:"92%",maxWidth:680,maxHeight:"90vh",overflowY:"auto",border:"2px solid var(--border)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}} className="no-print">
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17}}>📄 Progress Report</div>
          <div style={{display:"flex",gap:8}}>
            <button className="action-btn" onClick={()=>window.print()} style={{background:"var(--teal)",color:"#fff"}}>🖨 Print</button>
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
              <div key={ci} style={{marginBottom:24,padding:"16px",background:"var(--cream)",borderRadius:"var(--r)",border:"1.5px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>{c.name}</div>
                  {latest&&<div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:pal.chip}}>{latest.y}%</div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                  {[
                    {label:"Baseline",val:`${c.startValue}%`,sub:c.startDate||"—"},
                    {label:"Goal",val:`${c.goalValue}%`,sub:c.goalDate||"—"},
                    {label:"Progress to Goal",val:goalPct!=null?`${goalPct}%`:"—",sub:`${yearPts.length} sessions in ${thisYear}`},
                  ].map(({label,val,sub})=>(
                    <div key={label} style={{background:"var(--paper)",borderRadius:8,padding:"10px 12px",border:"1.5px solid var(--border)"}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18}}>{val}</div>
                      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"var(--ink-soft)"}}>{label}</div>
                      <div style={{fontSize:11,color:"var(--ink-soft)"}}>{sub}</div>
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
            <div style={{padding:"16px",background:"var(--cream)",borderRadius:"var(--r)",border:"1.5px solid var(--border)"}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:10}}>🛠 Accommodations</div>
              {(student.accommodations??[]).map((a,i)=>(
                <div key={i} style={{fontSize:13,padding:"4px 0",borderBottom:"1px dashed var(--border)"}}>{i+1}. {a.name}</div>
              ))}
            </div>
          )}

          {(student.accommodations??[]).length===0&&(
            <div style={{padding:"16px",background:"var(--cream)",borderRadius:"var(--r)",border:"1.5px solid var(--border)",color:"var(--ink-soft)"}}>
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
  const [showShortcuts,setShowShortcuts]=useState(false);
  const [showMinuteOptions,setShowMinuteOptions]=useState(false);
  const [confirmDialog,setConfirmDialog]=useState(null);
  const [renameTarget,setRenameTarget]=useState(null);
  const [renameValue,setRenameValue]=useState("");
  const [newSName,setNewSName]=useState("");
  const [newGName,setNewGName]=useState("");
  const [newMinuteOption,setNewMinuteOption]=useState("");
  const [showQL,setShowQL]=useState(false); // global quick log
  const [minuteOptions,setMinuteOptions]=useState(()=>{
    try{
      const s=localStorage.getItem("pm_minute_options");
      return s?JSON.parse(s):DEFAULT_MINUTE_OPTIONS;
    }catch{return DEFAULT_MINUTE_OPTIONS;}
  });
  const chartRef=useRef(null);

  const student=sets[selSet];
  const chart=student?.charts?.[selChart]??null;
  const pal=getPal(selSet);

  useEffect(()=>{localStorage.setItem("pm_v2",JSON.stringify(sets));},[sets]);
  useEffect(()=>{localStorage.setItem("pm_minute_options",JSON.stringify(minuteOptions));},[minuteOptions]);

  const snap=()=>setHistory(h=>{const n=[...h,JSON.stringify(sets)];if(n.length>20)n.shift();return n;});
  const undo=()=>{if(!history.length)return;setHistory(h=>h.slice(0,-1));setSets(JSON.parse(history[history.length-1]));};
  const upd=fn=>setSets(prev=>{const next=JSON.parse(JSON.stringify(prev));fn(next);return next;});
  const requestConfirm=({title,message,confirmLabel="Confirm",onConfirm,danger=false})=>{
    setConfirmDialog({title,message,confirmLabel,onConfirm,danger});
  };

  const addStudent=()=>{
    if(!newSName.trim()) return;
    upd(d=>d.push({name:newSName.trim(),collapsed:false,accommodations:[],accDays:{},minutes:[],charts:[]}));
    setSelSet(sets.length);setSelChart(0);setActiveTab("goals");setView("student");setNewSName("");setShowAS(false);
  };
  const addGoal=()=>{
    if(!newGName.trim()) return;
    upd(d=>d[selSet].charts.push({name:newGName.trim(),startValue:0,startDate:"",goalValue:100,goalDate:"",data:[],notes:"",attachments:[]}));
    setSelChart(student.charts.length);setNewGName("");setShowAG(false);
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
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(sets,null,2)],{type:"application/json"}));
    a.download="progress-data.json";a.click();
  };
  const importJSON=e=>{
    const f=e.target.files[0];if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(Array.isArray(d)){setSets(d);setSelSet(0);setSelChart(0);setView("dashboard");}else alert("Invalid file");}catch{alert("Couldn't read that file");}};
    r.readAsText(f);
  };
  useEffect(()=>{
    if(renameTarget){ setRenameValue(renameTarget.currentName ?? ""); }
  },[renameTarget]);
  const saveRename=()=>{
    const nextName = renameValue.trim();
    if(!renameTarget || !nextName) return;

    if(renameTarget.type === "student"){
      upd(d => { d[renameTarget.studentIndex].name = nextName; });
    }
    if(renameTarget.type === "goal"){
      upd(d => { d[renameTarget.studentIndex].charts[renameTarget.goalIndex].name = nextName; });
    }

    setRenameTarget(null);
    setRenameValue("");
  };
  const handleSelectStudent=si=>{setSelSet(si);setSelChart(0);setActiveTab("goals");setView("student");};

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
    <div style={{display:"flex",height:"100vh",width:"100vw",overflow:"hidden",background:"var(--cream)"}}>

      {/* SIDEBAR */}
      <div style={{width:272,flexShrink:0,background:"var(--paper)",borderRight:"2px solid var(--border)",display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
        <div style={{padding:"20px 18px 14px",borderBottom:"2px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,#26c6b0,#4e9af1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📈</div>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:15}}>Progress Monitor</div>
              <div style={{fontSize:11,color:"var(--ink-soft)"}}>Track every win ✨</div>
            </div>
          </div>
        </div>

        {/* Home button */}
        <div style={{padding:"8px 12px 0"}}>
          <button onClick={()=>setView("dashboard")} className={`tab-btn${view==="dashboard"?" active":""}`} style={{width:"100%",justifyContent:"flex-start",borderRadius:"var(--r-sm)"}}>🏠 Dashboard</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"8px 12px 0"}}>
          <SectionLabel>Students</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {sets.map((s,si)=>{
              const p=getPal(si);
              const isActive=view==="student"&&selSet===si;
              return(
                <div key={si} style={{borderRadius:"var(--r)",border:`2px solid ${isActive?p.border:"var(--border)"}`,overflow:"hidden",transition:"border-color .15s"}}>
                  <div onClick={()=>handleSelectStudent(si)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",background:isActive?p.bg:"transparent",cursor:"pointer",transition:"background .15s"}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${p.chip},${p.chip}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{getEmoji(s.name)}</div>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,color:isActive?p.text:"var(--ink)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                      <div style={{fontSize:11,color:"var(--ink-soft)"}}>{s.charts.length} goal{s.charts.length!==1?"s":""}</div>
                    </div>
                    <div style={{display:"flex",gap:1}}>
                      <button onClick={e=>{e.stopPropagation();setRenameTarget({type:"student",studentIndex:si,currentName:s.name});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:.45,padding:"2px"}}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();requestConfirm({title:"Remove student?",message:`This will delete ${s.name} and all of their data.`,confirmLabel:"Remove",danger:true,onConfirm:()=>{upd(d=>d.splice(si,1));setSelSet(0);setSelChart(0);setView("dashboard");setConfirmDialog(null);}});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:.45,padding:"2px"}}>🗑️</button>
                    </div>
                  </div>
                  {isActive&&(
                    <div style={{background:p.bg,padding:"4px 10px 10px 50px",display:"flex",flexDirection:"column",gap:4}}>
                      {s.charts.map((c,ci)=>{
                        const isAC=activeTab==="goals"&&selChart===ci;
                        return(
                          <div key={ci} onClick={()=>{setSelChart(ci);setActiveTab("goals");}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 10px",borderRadius:99,background:isAC?p.chip:"transparent",border:`1.5px solid ${isAC?p.chip:p.border+"55"}`,cursor:"pointer",transition:"all .15s"}}>
                            <span style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:isAC?"#fff":p.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.name}</span>
                            <div style={{display:"flex",gap:1}}>
                              <button onClick={e=>{e.stopPropagation();setRenameTarget({type:"goal",studentIndex:si,goalIndex:ci,currentName:c.name});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,opacity:isAC?.75:.35,padding:"1px 2px",color:isAC?"#fff":"inherit"}}>✏️</button>
                              <button onClick={e=>{e.stopPropagation();requestConfirm({title:"Delete goal?",message:`This will remove the goal "${c.name}" from this student.`,confirmLabel:"Delete",danger:true,onConfirm:()=>{upd(d=>d[si].charts.splice(ci,1));setSelChart(0);setConfirmDialog(null);}});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,opacity:isAC?.75:.35,padding:"1px 2px",color:isAC?"#fff":"inherit"}}>✕</button>
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={()=>setShowAG(true)} style={{background:"none",border:`1.5px dashed ${p.border}88`,borderRadius:99,color:p.text,fontSize:11,fontFamily:"var(--font-head)",fontWeight:700,padding:"4px 10px",marginTop:2,cursor:"pointer",alignSelf:"flex-start"}}>+ Goal</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{padding:"12px",borderTop:"2px solid var(--border)",display:"flex",flexDirection:"column",gap:7}}>
          <button className="action-btn" onClick={()=>setShowAS(true)} style={{background:"var(--teal)",color:"#fff",justifyContent:"center",width:"100%"}}>+ Add Student</button>
          <button className="ghost-btn" onClick={()=>setShowMinuteOptions(true)} style={{justifyContent:"center",fontSize:11}}>⏱ Minutes Options</button>
          <div style={{display:"flex",gap:6}}>
            <button className="ghost-btn" onClick={exportJSON} style={{flex:1,justifyContent:"center"}}>↓ Export</button>
            <label className="ghost-btn" style={{flex:1,justifyContent:"center",cursor:"pointer"}}>↑ Import<input type="file" accept=".json" onChange={importJSON} style={{display:"none"}}/></label>
          </div>
          <button className="ghost-btn" onClick={()=>setShowShortcuts(true)} style={{justifyContent:"center",fontSize:11}}>⌨ Shortcuts</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {view==="dashboard"?(
          <Dashboard sets={sets} onSelectStudent={handleSelectStudent} onAddStudent={()=>setShowAS(true)} getPal={getPal} getEmoji={getEmoji}/>
        ):student?(
          <>
            {/* Topbar */}
            <div style={{padding:"12px 22px 0",background:"var(--paper)",borderBottom:"2px solid var(--border)",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button className="ghost-btn" onClick={()=>setView("dashboard")} style={{padding:"4px 10px",fontSize:12}}>← Home</button>
                  <span style={{fontSize:19}}>{getEmoji(student?.name??"")}</span>
                  <span style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:19}}>{student?.name}</span>
                  {activeTab==="goals"&&chart&&(
                    <><span style={{color:"var(--ink-soft)",fontSize:15}}>›</span>
                    <span style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,color:pal.text}}>{chart.name}</span></>
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  {activeTab==="goals"&&<><button className="ghost-btn" onClick={undo} disabled={!history.length}>↩ Undo</button><button className="ghost-btn" onClick={()=>setShowAtt(true)}>📎 Files</button></>}
                  <button className="ghost-btn" onClick={()=>setShowReport(true)}>📄 Report</button>
                </div>
              </div>
              <div style={{display:"flex",gap:4,paddingBottom:12,flexWrap:"wrap"}}>
                <button className={`tab-btn${activeTab==="goals"?" active":""}`} onClick={()=>setActiveTab("goals")}>📊 Goals</button>
                <button className={`tab-btn${activeTab==="accommodations"?" active":""}`} onClick={()=>setActiveTab("accommodations")}>🛠 Accommodations</button>
                <button className={`tab-btn${activeTab==="minutes"?" active":""}`} onClick={()=>setActiveTab("minutes")}>⏱ Minutes</button>
              </div>
            </div>

            {activeTab==="accommodations"?(
              <AccommodationsTab student={student} selSet={selSet} upd={upd}/>
            ):activeTab==="minutes"?(
              <MinutesTab student={student} selSet={selSet} upd={upd} minuteOptions={minuteOptions} requestConfirm={requestConfirm}/>
            ):(
              <GoalsTab sets={sets} selSet={selSet} selChart={selChart} setSelChart={setSelChart}
                upd={upd} snap={snap} undo={undo} history={history}
                showAtt={showAtt} setShowAtt={setShowAtt} setShowAG={setShowAG}
                chartRef={chartRef} editPt={editPt} setEditPt={setEditPt}/>
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
        <input type="text" placeholder="e.g. Jordan Smith" value={newSName} onChange={e=>setNewSName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addStudent()} style={{marginTop:6,marginBottom:16}} autoFocus/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="ghost-btn" onClick={()=>setShowAS(false)}>Cancel</button>
          <button className="action-btn" onClick={addStudent} style={{background:"var(--teal)",color:"#fff"}}>Add Student ✓</button>
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

      <Modal show={!!renameTarget} onClose={()=>{setRenameTarget(null);setRenameValue("");}} title={renameTarget?.type === "student" ? "Rename Student" : "Rename Goal"} emoji="✏️">
        <SectionLabel>{renameTarget?.type === "student" ? "Student Name" : "Goal Name"}</SectionLabel>
        <input type="text" value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveRename()} style={{marginTop:6,marginBottom:16}} autoFocus/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="ghost-btn" onClick={()=>{setRenameTarget(null);setRenameValue("");}}>Cancel</button>
          <button className="action-btn" onClick={saveRename} style={{background:"var(--teal)",color:"#fff"}}>Save ✓</button>
        </div>
      </Modal>

      <Modal show={!!renameTarget} onClose={()=>{setRenameTarget(null);setRenameValue("");}} title={renameTarget?.type === "student" ? "Rename Student" : "Rename Goal"} emoji="✏️">
        <SectionLabel>{renameTarget?.type === "student" ? "Student Name" : "Goal Name"}</SectionLabel>
        <input type="text" value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveRename()} style={{marginTop:6,marginBottom:16}} autoFocus/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="ghost-btn" onClick={()=>{setRenameTarget(null);setRenameValue("");}}>Cancel</button>
          <button className="action-btn" onClick={saveRename} style={{background:"var(--teal)",color:"#fff"}}>Save ✓</button>
        </div>
      </Modal>

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

      <ReportModal show={showReport} onClose={()=>setShowReport(false)} sets={sets} selSet={selSet}/>
    </div>
  );
}

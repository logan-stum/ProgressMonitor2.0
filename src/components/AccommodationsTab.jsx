import { useState, useEffect } from "react";
import { MONTHS, STATUS_CONFIG } from "../constants.js";
import { currentYear } from "../utils.js";
import SectionLabel from "./SectionLabel.jsx";
import Ring from "./Ring.jsx";
import Modal from "./Modal.jsx";
import Calendar from "./Calendar.jsx";

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

export default AccommodationsTab;

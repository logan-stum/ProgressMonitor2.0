import { getPal, getEmoji, currentYear } from "../utils.js";

// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({show,onClose,sets,selSet,onPrint,chart,onParentPrint}){
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
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="action-btn" onClick={onPrint} style={{background:"var(--teal)",color:"#fff"}}>🖨 Print</button>
            {chart&&(
              <button className="action-btn" onClick={onParentPrint} title={`Print all of ${student.name}'s goals — numbers, notes, and quarterly averages (chart image included for "${chart.name ?? "the open goal"}")`} style={{background:"#4e9af1",color:"#fff"}}>👪 Parent Print</button>
            )}
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
                {Array.isArray(c.quarters)&&c.quarters.length>0&&(
                  <div style={{marginTop:10,padding:"8px 10px",background:"#f6f4ff",borderRadius:8,border:"1px solid #ded8fa"}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#5b4bc4",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Quarterly Averages</div>
                    {c.quarters.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(q=>(
                      <div key={q.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#3f3a5c",padding:"3px 0",borderBottom:"1px dashed #e2ddf7"}}>
                        <span>{q.date}</span>
                        <span style={{color:"var(--ink-soft)"}}>{q.count} {q.count===1?"entry":"entries"}{q.manual?" · edited":""}</span>
                        <span style={{fontWeight:800,color:"#5b4bc4"}}>{q.avg!=null?`${q.avg}%`:"No data"}</span>
                      </div>
                    ))}
                  </div>
                )}
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


export default ReportModal;

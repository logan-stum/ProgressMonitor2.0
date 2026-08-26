import { useState, useEffect } from "react";
import { ATTENDANCE_STATUS } from "../constants.js";
import { formatTime } from "../utils.js";
import SectionLabel from "./SectionLabel.jsx";

function MinutesTab({student, selSet, upd, minuteOptions, requestConfirm, theme, pal, onPrintAttendance}){
  const [selectedOptionId,setSelectedOptionId]=useState(minuteOptions[0]?.id ?? "");
  const [minutesValue,setMinutesValue]=useState("30");
  const [editingId,setEditingId]=useState(null);
  const [attGroupFilter,setAttGroupFilter]=useState("all");
  const entries=Array.isArray(student.minutes)?[...student.minutes]:[];
  const plainEntries=entries.filter(e=>e.kind!=="attendance");
  const attendanceEntries=entries.filter(e=>e.kind==="attendance").sort((a,b)=>(b.date??"").localeCompare(a.date??""));
  const attendanceGroupNames=[...new Set(attendanceEntries.map(e=>e.groupName))];
  const visibleAttendance=attGroupFilter==="all"?attendanceEntries:attendanceEntries.filter(e=>e.groupName===attGroupFilter);

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
        {plainEntries.length===0?(
          <div style={{textAlign:"center",padding:"20px 0",color:"var(--ink-soft)",fontSize:13}}>No minutes added for this student yet.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {plainEntries.map((entry,i)=>(
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

      <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"18px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:10,flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:theme.text}}>🗓️ Attendance Log</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {attendanceGroupNames.length>1&&(
              <select value={attGroupFilter} onChange={e=>setAttGroupFilter(e.target.value)} style={{fontSize:12}}>
                <option value="all">All groups</option>
                {attendanceGroupNames.map(name=><option key={name} value={name}>{name}</option>)}
              </select>
            )}
            {visibleAttendance.length>0&&(
              <button className="ghost-btn" onClick={()=>onPrintAttendance?.(student, visibleAttendance, attGroupFilter)} style={{padding:"5px 12px",fontSize:12}}>🖨 Print</button>
            )}
          </div>
        </div>
        {visibleAttendance.length===0?(
          <div style={{textAlign:"center",padding:"14px 0",color:"var(--ink-soft)",fontSize:13}}>No attendance logged yet. Use "📋 Take Attendance" in Quick Tools.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {visibleAttendance.map((entry,i)=>{
              const cfg=ATTENDANCE_STATUS[entry.status]??ATTENDANCE_STATUS.attended;
              return(
                <div key={entry.id ?? i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,background:"var(--cream)",border:"1.5px solid var(--border)"}}>
                  <div style={{minWidth:96,fontSize:12,color:"var(--ink-soft)",fontWeight:700}}>{entry.date}</div>
                  <div style={{flex:1,minWidth:0,fontWeight:700,fontSize:13,color:"var(--ink)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.groupName}</div>
                  {entry.start&&<div style={{fontSize:12,color:"var(--ink-soft)"}}>{formatTime(entry.start)}{entry.stop?` – ${formatTime(entry.stop)}`:""}</div>}
                  <span style={{padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:800,border:`1.5px solid ${cfg.border}`,background:cfg.bg,color:cfg.color}}>{cfg.icon} {cfg.label}</span>
                  <button className="ghost-btn" onClick={()=>upd(d=>d[selSet].minutes=(d[selSet].minutes??[]).filter(item=>item.id!==entry.id))} style={{padding:"3px 8px",fontSize:11,color:"var(--red)"}}>🗑️</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


export default MinutesTab;

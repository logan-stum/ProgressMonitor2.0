import { useState } from "react";
import { formatTime } from "../utils.js";
import Modal from "./Modal.jsx";
import SectionLabel from "./SectionLabel.jsx";

// Attendance groups are intentionally separate from the dashboard/sidebar "Groups" (student.groupId) —
// a student can belong to any number of attendance groups without touching which dashboard group
// they're filed under. Membership is stored by stable student id (student.sid), not array index.
function AttendanceGroupsModal({show,onClose,sets,groups,attendanceGroups,onSave,onDelete,requestConfirm}){
  const [editingId,setEditingId]=useState(null); // null = list view, "new" = new form, else group.id being edited
  const [name,setName]=useState("");
  const [times,setTimes]=useState([]); // [{id, start, stop}]
  const [studentIds,setStudentIds]=useState([]);

  const close=()=>{ onClose(); setEditingId(null); };

  const startNew=()=>{ setEditingId("new"); setName(""); setTimes([]); setStudentIds([]); };
  const startEdit=(g)=>{ setEditingId(g.id); setName(g.name); setTimes(g.times??[]); setStudentIds(g.studentIds??[]); };
  const cancelForm=()=>setEditingId(null);

  const addTimeSlot=()=>setTimes(ts=>[...ts,{id:`t_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,start:"",stop:""}]);
  const updateTimeSlot=(id,field,value)=>setTimes(ts=>ts.map(t=>t.id===id?{...t,[field]:value}:t));
  const removeTimeSlot=(id)=>setTimes(ts=>ts.filter(t=>t.id!==id));

  const toggleStudent=(sid)=>setStudentIds(ids=>ids.includes(sid)?ids.filter(id=>id!==sid):[...ids,sid]);
  const toggleDashboardGroup=(indexes)=>{
    const allSelected = indexes.length>0 && indexes.every(sid=>studentIds.includes(sid));
    setStudentIds(ids=> allSelected ? ids.filter(id=>!indexes.includes(id)) : [...new Set([...ids,...indexes])]);
  };
  const selectAll=()=>setStudentIds(sets.map(s=>s.sid));
  const clearAll=()=>setStudentIds([]);

  const save=()=>{
    if(!name.trim()) return;
    // Only keep time slots where both start and stop were actually filled in.
    const cleanTimes=times.filter(t=>t.start&&t.stop);
    onSave({ id: editingId==="new" ? undefined : editingId, name: name.trim(), times: cleanTimes, studentIds });
    setEditingId(null);
  };

  // Same "group card with student pills" layout as the Print Class Reports modal, reused here
  // for picking which students belong to this attendance group.
  const dashboardGroupCards = groups
    .map(group=>{
      const sids = sets.filter(s=>s.groupId===group.id).map(s=>s.sid);
      if (sids.length===0) return null;
      const checked = sids.every(sid=>studentIds.includes(sid));
      return (
        <div key={group.id} onClick={()=>toggleDashboardGroup(sids)} style={{
          border:"1.5px solid var(--border)",borderRadius:14,padding:12,cursor:"pointer",transition:"all .15s ease",
          background: checked ? "linear-gradient(135deg, rgba(38,198,176,0.12), rgba(78,154,241,0.08))" : "var(--paper)",
          borderColor: checked ? "rgba(38,198,176,0.75)" : "var(--border)",
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:18,height:18,borderRadius:6,border:"1.5px solid "+(checked?"var(--teal)":"var(--border)"),background:checked?"var(--teal)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10}}>{checked?"✓":""}</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:16,color:"var(--ink)"}}>{group.name}</div>
            </div>
            <span style={{padding:"3px 8px",borderRadius:999,background:"var(--cream)",border:"1px solid var(--border)",fontSize:11,color:"var(--ink-soft)",fontWeight:700}}>{sids.length}</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {sids.map(sid=>{
              const s=sets.find(st=>st.sid===sid);
              return (
                <button key={sid} type="button" onClick={e=>{e.stopPropagation();toggleStudent(sid);}} style={{
                  display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:999,
                  background: studentIds.includes(sid) ? "rgba(38,198,176,0.18)" : "var(--cream)",
                  border:"1.5px solid "+(studentIds.includes(sid) ? "rgba(38,198,176,0.7)" : "var(--border)"),
                  color:"var(--ink-mid)",fontSize:12,fontWeight:700,padding:"6px 10px",cursor:"pointer",transition:"all .15s ease",
                }}>{s?.name}</button>
              );
            })}
          </div>
        </div>
      );
    })
    .filter(Boolean);

  const ungroupedSids = sets.filter(s=>!s.groupId||!groups.some(g=>g.id===s.groupId)).map(s=>s.sid);
  if (ungroupedSids.length>0) {
    const checked = ungroupedSids.every(sid=>studentIds.includes(sid));
    dashboardGroupCards.push(
      <div key="ungrouped" onClick={()=>toggleDashboardGroup(ungroupedSids)} style={{
        border:"1.5px solid var(--border)",borderRadius:14,padding:12,cursor:"pointer",transition:"all .15s ease",
        background: checked ? "linear-gradient(135deg, rgba(38,198,176,0.12), rgba(78,154,241,0.08))" : "var(--paper)",
        borderColor: checked ? "rgba(38,198,176,0.75)" : "var(--border)",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:18,height:18,borderRadius:6,border:"1.5px solid "+(checked?"var(--teal)":"var(--border)"),background:checked?"var(--teal)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10}}>{checked?"✓":""}</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:16,color:"var(--ink)"}}>Ungrouped</div>
          </div>
          <span style={{padding:"3px 8px",borderRadius:999,background:"var(--cream)",border:"1px solid var(--border)",fontSize:11,color:"var(--ink-soft)",fontWeight:700}}>{ungroupedSids.length}</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {ungroupedSids.map(sid=>{
            const s=sets.find(st=>st.sid===sid);
            return (
              <button key={sid} type="button" onClick={e=>{e.stopPropagation();toggleStudent(sid);}} style={{
                display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:999,
                background: studentIds.includes(sid) ? "rgba(38,198,176,0.18)" : "var(--cream)",
                border:"1.5px solid "+(studentIds.includes(sid) ? "rgba(38,198,176,0.7)" : "var(--border)"),
                color:"var(--ink-mid)",fontSize:12,fontWeight:700,padding:"6px 10px",cursor:"pointer",transition:"all .15s ease",
              }}>{s?.name}</button>
            );
          })}
        </div>
      </div>
    );
  }

  return(
    <Modal show={show} onClose={close} title="Attendance Groups" emoji="🗓️" wide>
      {editingId===null?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <button className="action-btn" onClick={startNew} style={{background:"var(--yellow)",color:"#2d2d3a",justifyContent:"center"}}>+ New Attendance Group</button>
          {attendanceGroups.length===0?(
            <div style={{textAlign:"center",padding:"16px 0",color:"var(--ink-soft)",fontSize:13}}>No attendance groups yet.</div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {attendanceGroups.map(g=>(
                <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"var(--cream)",border:"1.5px solid var(--border)"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:13,color:"var(--ink)"}}>{g.name}</div>
                    <div style={{fontSize:11,color:"var(--ink-soft)"}}>
                      {(g.studentIds??[]).length} student{(g.studentIds??[]).length!==1?"s":""}
                      {(g.times??[]).length>0?` · ${g.times.map(t=>`${formatTime(t.start)}–${formatTime(t.stop)}`).join(", ")}`:" · no set times"}
                    </div>
                  </div>
                  <button className="ghost-btn" onClick={()=>startEdit(g)} style={{padding:"4px 10px",fontSize:11}}>Edit</button>
                  <button className="ghost-btn" onClick={()=>requestConfirm({
                    title:`Delete "${g.name}"?`,
                    message:"This removes the group and its schedule. Attendance already logged in each student's Minutes tab is kept.",
                    confirmLabel:"Delete",
                    onConfirm:()=>onDelete(g.id),
                  })} style={{padding:"4px 10px",fontSize:11,color:"var(--red)"}}>Delete</button>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",justifyContent:"flex-end"}}><button className="ghost-btn" onClick={close}>Close</button></div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <SectionLabel>Group Name</SectionLabel>
            <input type="text" autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Morning Reading Group" style={{marginTop:6}}/>
          </div>

          <div>
            <SectionLabel>Set Times (optional)</SectionLabel>
            <div style={{fontSize:11,color:"var(--ink-soft)",marginBottom:8}}>Add the start and stop time this group meets. Marking a student "Attended" uses one of these automatically.</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {times.map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1}}>
                    <SectionLabel>Start</SectionLabel>
                    <input type="time" value={t.start} onChange={e=>updateTimeSlot(t.id,"start",e.target.value)}/>
                  </div>
                  <div style={{flex:1}}>
                    <SectionLabel>Stop</SectionLabel>
                    <input type="time" value={t.stop} onChange={e=>updateTimeSlot(t.id,"stop",e.target.value)}/>
                  </div>
                  <button onClick={()=>removeTimeSlot(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)",fontSize:14,marginTop:16}}>✕</button>
                </div>
              ))}
            </div>
            <button className="ghost-btn" onClick={addTimeSlot} style={{marginTop:8,padding:"6px 14px",fontSize:12}}>+ Add Time Slot</button>
          </div>

          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap",marginBottom:8}}>
              <div>
                <SectionLabel>Students in this Group</SectionLabel>
                <div style={{fontSize:11,color:"var(--ink-soft)"}}>{studentIds.length} selected · separate from each student's dashboard group</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="ghost-btn" onClick={selectAll} style={{padding:"5px 10px",fontSize:11}}>Select all</button>
                <button className="ghost-btn" onClick={clearAll} style={{padding:"5px 10px",fontSize:11}}>Clear</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:280,overflowY:"auto"}}>
              {dashboardGroupCards.length>0 ? dashboardGroupCards : (
                <div style={{textAlign:"center",padding:"16px 0",color:"var(--ink-soft)",fontSize:13}}>No students yet.</div>
              )}
            </div>
          </div>

          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={cancelForm}>Cancel</button>
            <button className="action-btn" onClick={save} style={{background:"var(--yellow)",color:"#2d2d3a"}}>Save Group ✓</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default AttendanceGroupsModal;

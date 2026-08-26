import { useState, useEffect } from "react";
import { getStudentEmoji, todayStr } from "../utils.js";
import { ATTENDANCE_STATUS } from "../constants.js";
import Modal from "./Modal.jsx";
import SectionLabel from "./SectionLabel.jsx";

function TakeAttendanceModal({show,onClose,sets,attendanceGroups,onSubmit}){
  const [groupId,setGroupId]=useState(null);
  const [date,setDate]=useState(todayStr());
  const [sessionStart,setSessionStart]=useState("");
  const [sessionStop,setSessionStop]=useState("");
  const [statuses,setStatuses]=useState({}); // sid -> "attended" | "absent" | "late"
  const [lateArrival,setLateArrival]=useState({}); // sid -> "HH:MM"

  const group=attendanceGroups.find(g=>g.id===groupId)??null;
  const groupStudents=group?sets.filter(s=>(group.studentIds??[]).includes(s.sid)):[];

  useEffect(()=>{
    if(!group) return;
    const firstSlot=group.times?.[0];
    setSessionStart(firstSlot?.start ?? "");
    setSessionStop(firstSlot?.stop ?? "");
    const initial={};
    groupStudents.forEach(s=>{ initial[s.sid]="attended"; });
    setStatuses(initial);
    setLateArrival({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[groupId]);

  const close=()=>{ onClose(); setGroupId(null); };

  const setStatus=(sid,status)=>setStatuses(st=>({...st,[sid]:status}));
  const setLate=(sid,val)=>setLateArrival(t=>({...t,[sid]:val}));

  const applyTimeSlot=(slot)=>{
    setSessionStart(slot.start ?? "");
    setSessionStop(slot.stop ?? "");
  };

  const submit=()=>{
    if(!group) return;
    const entries=groupStudents.map(s=>{
      const status=statuses[s.sid]??"attended";
      if(status==="absent") return { sid:s.sid, status, start:null, stop:null };
      if(status==="late") return { sid:s.sid, status, start:lateArrival[s.sid]||null, stop:sessionStop||null };
      return { sid:s.sid, status, start:sessionStart||null, stop:sessionStop||null };
    });
    onSubmit(group, date, entries);
    close();
  };

  return(
    <Modal show={show} onClose={close} title="Take Attendance" emoji="📋" wide>
      {!group?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {attendanceGroups.length===0?(
            <div style={{textAlign:"center",padding:"16px 0",color:"var(--ink-soft)",fontSize:13}}>No attendance groups yet — create one first from "+ Attendance Group."</div>
          ):(
            attendanceGroups.map(g=>(
              <button key={g.id} className="ghost-btn" onClick={()=>setGroupId(g.id)} style={{justifyContent:"flex-start",padding:"12px 14px",fontSize:13}}>
                <div>
                  <div style={{fontWeight:800}}>{g.name}</div>
                  <div style={{fontSize:11,color:"var(--ink-soft)",fontWeight:500}}>{(g.studentIds??[]).length} student{(g.studentIds??[]).length!==1?"s":""}</div>
                </div>
              </button>
            ))
          )}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"end"}}>
            <div>
              <SectionLabel>Date</SectionLabel>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            </div>
            <div>
              <SectionLabel>Scheduled Start</SectionLabel>
              <input type="time" value={sessionStart} onChange={e=>setSessionStart(e.target.value)}/>
            </div>
            <div>
              <SectionLabel>Scheduled Stop</SectionLabel>
              <input type="time" value={sessionStop} onChange={e=>setSessionStop(e.target.value)}/>
            </div>
            {group.times?.length>1&&(
              <div>
                <SectionLabel>Use a set time</SectionLabel>
                <select onChange={e=>{const slot=group.times.find(t=>t.id===e.target.value);if(slot) applyTimeSlot(slot);}} defaultValue="">
                  <option value="" disabled>Pick a slot…</option>
                  {group.times.map(t=><option key={t.id} value={t.id}>{t.start}–{t.stop}</option>)}
                </select>
              </div>
            )}
            <button className="ghost-btn" onClick={()=>setGroupId(null)} style={{marginLeft:"auto",fontSize:11}}>← Choose a different group</button>
          </div>
          <div style={{fontSize:11,color:"var(--ink-soft)",marginTop:-8}}>These default from the group's set times but can be changed for today's session — "Attended" students will use them.</div>

          <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:340,overflowY:"auto"}}>
            {groupStudents.map(s=>{
              const status=statuses[s.sid]??"attended";
              return(
                <div key={s.sid} style={{display:"flex",flexDirection:"column",gap:8,padding:"10px 12px",borderRadius:10,background:"var(--cream)",border:"1.5px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:16}}>{getStudentEmoji(s)}</span>
                    <span style={{fontWeight:800,fontSize:13,flex:1,minWidth:100}}>{s.name}</span>
                    <div style={{display:"flex",gap:6}}>
                      {Object.entries(ATTENDANCE_STATUS).map(([key,cfg])=>(
                        <button key={key} onClick={()=>setStatus(s.sid,key)} style={{
                          padding:"5px 12px",borderRadius:999,fontSize:11,fontWeight:800,cursor:"pointer",
                          border:`1.5px solid ${status===key?cfg.border:"var(--border)"}`,
                          background:status===key?cfg.bg:"transparent",
                          color:status===key?cfg.color:"var(--ink-soft)",
                        }}>{cfg.icon} {cfg.label}</button>
                      ))}
                    </div>
                  </div>
                  {status==="late"&&(
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <SectionLabel>Actual arrival time</SectionLabel>
                      <input type="time" value={lateArrival[s.sid]??""} onChange={e=>setLate(s.sid,e.target.value)} style={{width:150}}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button className="ghost-btn" onClick={close}>Cancel</button>
            <button className="action-btn" onClick={submit} style={{background:"var(--yellow)",color:"#2d2d3a"}}>Submit Attendance ✓</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default TakeAttendanceModal;

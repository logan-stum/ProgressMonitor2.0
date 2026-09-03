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
  const [lateReasons,setLateReasons]=useState({}); // sid -> why they were late
  const [sessionNote,setSessionNote]=useState(""); // applies to every student in this submission (e.g. a time change)

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
    setLateReasons({});
    setSessionNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[groupId]);

  const close=()=>{ onClose(); setGroupId(null); };

  const setStatus=(sid,status)=>setStatuses(st=>({...st,[sid]:status}));
  const setLate=(sid,val)=>setLateArrival(t=>({...t,[sid]:val}));
  const setLateReason=(sid,val)=>setLateReasons(t=>({...t,[sid]:val}));

  const applyTimeSlot=(slot)=>{
    setSessionStart(slot.start ?? "");
    setSessionStop(slot.stop ?? "");
  };

  const submit=()=>{
    if(!group) return;
    const entries=groupStudents.map(s=>{
      const status=statuses[s.sid]??"attended";
      const base={ sid:s.sid, status, sessionNote: sessionNote.trim()||null };
      if(status==="absent") return { ...base, start:null, stop:null, lateReason:null };
      if(status==="late") return { ...base, start:lateArrival[s.sid]||null, stop:sessionStop||null, lateReason:(lateReasons[s.sid]||"").trim()||null };
      return { ...base, start:sessionStart||null, stop:sessionStop||null, lateReason:null };
    });
    onSubmit(group, date, entries);
    close();
  };

  return(
    <Modal show={show} onClose={close} title="Take Attendance" emoji="📋" xl>
      {!group?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {attendanceGroups.length===0?(
            <div style={{textAlign:"center",padding:"16px 0",color:"var(--ink-soft)",fontSize:13}}>No attendance groups yet — create one first from "+ Attendance Group."</div>
          ):(
            <>
              <div style={{fontSize:12,color:"var(--ink-soft)",paddingBottom:2}}>Select a group to take attendance for today.</div>
              {attendanceGroups.map(g=>{
                const today=todayStr();
                const groupSids=new Set(g.studentIds??[]);
                const takenToday=sets.some(s=>
                  groupSids.has(s.sid) &&
                  (s.minutes??[]).some(m=>m.kind==="attendance"&&m.groupId===g.id&&m.date===today)
                );
                return(
                  <button key={g.id} className="ghost-btn" onClick={()=>setGroupId(g.id)}
                    style={{justifyContent:"space-between",padding:"12px 14px",fontSize:13,
                      borderColor: takenToday ? "rgba(82,201,122,0.6)" : "rgba(255,107,107,0.5)",
                      background: takenToday ? "rgba(82,201,122,0.07)" : "rgba(255,107,107,0.05)",
                    }}>
                    <div style={{textAlign:"left"}}>
                      <div style={{fontWeight:800}}>{g.name}</div>
                      <div style={{fontSize:11,color:"var(--ink-soft)",fontWeight:500,marginTop:2}}>
                        {(g.studentIds??[]).length} student{(g.studentIds??[]).length!==1?"s":""}
                        {(g.times??[]).length>0&&` · ${g.times[0].start}–${g.times[0].stop}`}
                      </div>
                    </div>
                    {takenToday ? (
                      <span style={{fontSize:11,fontWeight:800,color:"#1e7a45",background:"#edfdf5",border:"1.5px solid #52c97a66",borderRadius:999,padding:"3px 10px",flexShrink:0}}>✓ Done today</span>
                    ) : (
                      <span style={{fontSize:11,fontWeight:800,color:"#c0392b",background:"#fff0f0",border:"1.5px solid #ff6b6b66",borderRadius:999,padding:"3px 10px",flexShrink:0}}>⚠ Not taken</span>
                    )}
                  </button>
                );
              })}
            </>
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

          <div>
            <SectionLabel>Note for today's session (optional)</SectionLabel>
            <input type="text" value={sessionNote} onChange={e=>setSessionNote(e.target.value)} placeholder="e.g. Group met 15 minutes late today due to fire drill" style={{fontSize:12}}/>
            <div style={{fontSize:11,color:"var(--ink-soft)",marginTop:4}}>This note is saved to every student's attendance log entry for this session — use it for things like a time change.</div>
          </div>

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
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <SectionLabel>Actual arrival time</SectionLabel>
                        <input type="time" value={lateArrival[s.sid]??""} onChange={e=>setLate(s.sid,e.target.value)} style={{width:150}}/>
                      </div>
                      <div>
                        <SectionLabel>Why were they late? (optional)</SectionLabel>
                        <textarea rows={3} value={lateReasons[s.sid]??""} onChange={e=>setLateReason(s.sid,e.target.value)} placeholder="e.g. Bus was delayed, doctor's appointment, overslept…" style={{width:"100%",fontSize:13,marginTop:4,resize:"vertical"}}/>
                      </div>
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

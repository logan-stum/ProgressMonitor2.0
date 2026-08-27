import { useState, useEffect } from "react";
import Modal from "./Modal.jsx";
import SectionLabel from "./SectionLabel.jsx";
import { todayStr } from "../utils.js";

// Small reusable "pick a date range, then print" picker — used by the Attendance Log print
// button and the Accommodations Calendar print button so both work the same way.
function DateRangePrintModal({show, onClose, title="Print", emoji="🖨", defaultFrom, defaultTo, onPrint}){
  const [from,setFrom]=useState(defaultFrom ?? todayStr());
  const [to,setTo]=useState(defaultTo ?? todayStr());

  useEffect(()=>{
    if(show){ setFrom(defaultFrom ?? todayStr()); setTo(defaultTo ?? todayStr()); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[show]);

  return(
    <Modal show={show} onClose={onClose} title={title} emoji={emoji}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{fontSize:12,color:"var(--ink-soft)"}}>Choose a date range to include in the printout.</div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}><SectionLabel>From</SectionLabel><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
          <div style={{flex:1}}><SectionLabel>To</SectionLabel><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="action-btn" onClick={()=>{onPrint(from,to);onClose();}} disabled={!from||!to||from>to} style={{background:"var(--teal)",color:"#fff",opacity:(!from||!to||from>to)?.5:1}}>🖨 Print</button>
        </div>
      </div>
    </Modal>
  );
}

export default DateRangePrintModal;

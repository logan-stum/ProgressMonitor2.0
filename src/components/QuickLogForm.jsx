import { useState } from "react";
import { todayStr } from "../utils.js";
import SectionLabel from "./SectionLabel.jsx";

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

export default QuickLogForm;

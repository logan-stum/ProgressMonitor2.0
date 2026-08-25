import { clamp } from "../utils.js";

function Ring({pct,color,size=54}){
  const r=size/2-6,circ=2*Math.PI*r,dash=(clamp(pct,0,100)/100)*circ;
  return(
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s ease"}}/>
    </svg>
  );
}

export default Ring;

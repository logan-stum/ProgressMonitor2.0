import { DAYS, DOT_COLORS } from "../constants.js";
import { todayStr } from "../utils.js";

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
          // Only count real accommodation entries — accDays[ds] may also carry meta keys like
          // _note (a general day note) and _explanations (N/A reasons) that aren't statuses.
          const hasEntry = !!dayRec && (accList?.some(a => dayRec[a.id] !== undefined) ?? false);
          const hasNote = !!dayRec?._note;
          let counts = { given:0, refused:0, not_given:0, absent:0, na:0 };
          if (hasEntry && accList?.length > 0) {
            accList.forEach(a => {
              const s = dayRec[a.id] ?? "given";
              counts[s] = (counts[s] || 0) + 1;
            });
          }
          return(
            <div key={i} className={`cal-day${isToday?" today":""}${isSel?" selected":""}`} onClick={()=>onSelectDay(ds)}
              title={hasEntry?`Given:${counts.given} · Refused:${counts.refused} · Not Given:${counts.not_given} · Absent:${counts.absent} · N/A:${counts.na}`:""}>
              <span style={{lineHeight:1}}>{c.day}</span>
              {hasNote&&<span style={{position:"absolute",top:2,right:3,fontSize:9,lineHeight:1}} title="Has a note">📝</span>}
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

export default Calendar;

import { useState, useRef, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
import { clamp, sanitize, todayStr, getPal, burst, currentYear } from "../utils.js";
import SectionLabel from "./SectionLabel.jsx";
import Modal from "./Modal.jsx";
import Ring from "./Ring.jsx";
import QuickLogForm from "./QuickLogForm.jsx";

// ─── Goals Tab ────────────────────────────────────────────────────────────────
function GoalsTab({sets,selSet,selChart,setSelChart,upd,snap,undo,history,showAtt,setShowAtt,setShowAG,chartRef,editPt,setEditPt,theme,requestConfirm}){
  const student=sets[selSet];
  const chart=student?.charts?.[selChart]??null;
  const pal=getPal(selSet);

  const [newVal,setNewVal]=useState("");
  const [newDate,setNewDate]=useState(todayStr);
  const [newNote,setNewNote]=useState("");
  const [dateDrafts,setDateDrafts]=useState({ startDate: "", goalDate: "" });
  const [viewYear,setViewYear]=useState(currentYear);
  const [showQL,setShowQL]=useState(false); // quick log modal
  const [editingQuarterId,setEditingQuarterId]=useState(null);
  const [editingQuarterVal,setEditingQuarterVal]=useState("");
  const [editingQuarterName,setEditingQuarterName]=useState("");
  const [quarterLogCollapsed,setQuarterLogCollapsed]=useState(false);
  const [flagPositions,setFlagPositions]=useState([]);
  const [hoveredFlagId,setHoveredFlagId]=useState(null);
  const flagPositionsRef=useRef([]);

  const normalizeDateDigits = value => String(value ?? "").replace(/\D/g, "").slice(0, 8);
  const formatDateDraft = value => {
    const digits = normalizeDateDigits(value);
    if (!digits) return "";
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };
  const parseDateDigits = value => {
    const digits = normalizeDateDigits(value);
    if (digits.length !== 8) return null;

    const month = Number(digits.slice(0, 2));
    const day = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return null;

    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  const [selectedPointIndex,setSelectedPointIndex]=useState(null);
  const [pointToDelete,setPointToDelete]=useState(null);

  const parseDateInput = value => {
    if (!value || typeof value !== "string") return null;
    const normalized = value.trim();
    if (!normalized) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const parsed = new Date(`${normalized}T12:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : normalized;
    }

    return parseDateDigits(normalized);
  };

  const formatDateInput = value => {
    if (!value || typeof value !== "string") return "";
    const digits = normalizeDateDigits(value);
    if (!digits) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-");
      return `${month}/${day}/${year}`;
    }
    return formatDateDraft(digits);
  };

  useEffect(() => {
    if (!chart) return;
    setDateDrafts({
      startDate: formatDateDraft(chart.startDate || ""),
      goalDate: formatDateDraft(chart.goalDate || ""),
    });
  }, [chart?.startDate, chart?.goalDate]);

  // Derive available years from data
  const allPts=chart?.data??[];
  const dataYears=Array.from(new Set(allPts.map(p=>p.x?.split("-")[0]).filter(Boolean))).map(Number);
  const yearList=[...new Set([currentYear(),...dataYears])].sort((a,b)=>b-a);

  // Filter pts by year
  const pts=allPts.filter(p=>p.x?.startsWith(String(viewYear)));
  const latest=pts[pts.length-1];
  const goalPct=latest&&chart?.goalValue?Math.round((latest.y/chart.goalValue)*100):null;
  const trend=pts.length>=2?(pts[pts.length-1].y-pts[pts.length-2].y).toFixed(1):null;

  // Streak (sessions this month across all goals)
  const thisMonthStr=`${viewYear}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
  const monthPts=allPts.filter(p=>p.x?.startsWith(thisMonthStr));
  const streak=monthPts.length;

  const addPoint=useCallback((e,val,date,note)=>{
    const v=val??newVal, d=date??newDate, n=note??newNote;
    if(!v||!d||!chart) return;
    snap();
    upd(data=>{
      data[selSet].charts[selChart].data.push({x:d,y:clamp(Number(v),0,100),notes:n});
      data[selSet].charts[selChart].data=sanitize(data[selSet].charts[selChart].data);
    });
    if(e?.clientX) burst(e.clientX,e.clientY);
    // Celebrate if goal hit
    if(chart.goalValue&&clamp(Number(v),0,100)>=chart.goalValue){
      setTimeout(()=>burst(window.innerWidth/2,window.innerHeight/3,true),100);
    }
    setNewVal("");setNewDate(todayStr());setNewNote("");
  },[newVal,newDate,newNote,chart,selSet,selChart]);

  const saveEditPt=()=>{
    if(!editPt) return; snap();
    upd(d=>{
      d[selSet].charts[selChart].data[editPt.idx]={x:editPt.x,y:clamp(Number(editPt.y),0,100),notes:editPt.notes};
      d[selSet].charts[selChart].data=sanitize(d[selSet].charts[selChart].data);
    });
    setEditPt(null);
  };

  const deletePointAtIndex=(indexToDelete)=>{
    if(indexToDelete===null || indexToDelete===undefined || !chart || !Array.isArray(chart.data) || indexToDelete<0 || indexToDelete>=chart.data.length) return;
    snap();
    upd(d=>{
      d[selSet].charts[selChart].data.splice(indexToDelete,1);
      d[selSet].charts[selChart].data=sanitize(d[selSet].charts[selChart].data);
    });
    setSelectedPointIndex(null);
    setPointToDelete(null);
  };

  // ─── Quarter markers ────────────────────────────────────────────────────
  // A "quarter" is a snapshot: the date it was marked, plus the average of every data
  // point since the previous quarter marker (or the beginning of the data, if this is the
  // first one) through that date. Averages can be hand-edited later; the underlying data
  // points are never modified.
  const quarters = Array.isArray(chart?.quarters) ? chart.quarters : [];
  const quartersSorted = quarters.slice().sort((a, b) => a.date.localeCompare(b.date));

  // Force an immediate canvas redraw whenever the quarter markers actually change content
  // (added, edited, or deleted) — otherwise the vertical line/flag can lag a render behind
  // and only appear after something else forces the chart to re-render (e.g. a page refresh).
  const quartersSignature = JSON.stringify(quarters);
  useEffect(() => {
    chartRef.current?.update();
  }, [quartersSignature]);


  const handleEndQuarter = () => {
    if (!chart) return;
    const today = todayStr();

    if (quartersSorted.some(q => q.date === today)) {
      alert("A quarter is already marked for today. Delete it first if you\'d like to re-mark today.");
      return;
    }

    const prevDate = quartersSorted.length ? quartersSorted[quartersSorted.length - 1].date : null;
    const matched = allPts.filter(p => (!prevDate || p.x > prevDate) && p.x <= today);
    const avg = matched.length
      ? Math.round((matched.reduce((sum, p) => sum + Number(p.y), 0) / matched.length) * 10) / 10
      : null;

    snap();
    upd(d => {
      const c = d[selSet].charts[selChart];
      if (!Array.isArray(c.quarters)) c.quarters = [];

      c.quarters.push({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: today,
        name: `Quarter ${quartersSorted.length + 1}`,
        avg,
        count: matched.length
      });
    });
  };

  const startEditQuarter = q => { setEditingQuarterId(q.id); setEditingQuarterVal(q.avg ?? ""); setEditingQuarterName(q.name ?? ""); };
  const cancelEditQuarter = () => { setEditingQuarterId(null); setEditingQuarterVal(""); setEditingQuarterName(""); };
  const saveEditQuarter = id => {
    const parsed = clamp(Number(editingQuarterVal), 0, 100);
    if (Number.isNaN(parsed)) { cancelEditQuarter(); return; }
    const nextName = editingQuarterName.trim();
    snap();
    upd(d => {
      const c = d[selSet].charts[selChart];
      c.quarters = (c.quarters ?? []).map(q => q.id === id ? { ...q, avg: parsed, name: nextName || q.name, manual: true } : q);
    });
    cancelEditQuarter();
  };
  const deleteQuarter = q => {
    requestConfirm({
      title: "Delete quarter marker?",
      message: `This will remove the ${q.date} quarter line and its average from this goal.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        snap();
        upd(d => {
          const c = d[selSet].charts[selChart];
          c.quarters = (c.quarters ?? []).filter(x => x.id !== q.id);
        });
      },
    });
  };

  // Chart zones plugin (green/yellow/red bands). Dynamic values (goalVal) are read from
  // pluginOptions (chart.options.plugins.chartBg below) rather than closed over directly —
  // react-chartjs-2 refreshes chart.options on every render but does NOT re-register the
  // `plugins` array on updates, so a value captured via closure here would stay frozen at
  // whatever it was when the chart first mounted, only catching up on a full page refresh.
  const chartBgPlugin = {
    id: "chartBg",
    beforeDraw(ch, args, pluginOptions) {
      const { ctx, chartArea:{ top, bottom, left, right }, scales:{ y } } = ch;
      if (!y) return;
      const goalVal = pluginOptions?.goalVal ?? 100;
      const zones = [
        { from: goalVal,        to: 100,       color: "rgba(82,201,122,0.08)" },
        { from: goalVal * 0.7,  to: goalVal,   color: "rgba(255,209,102,0.08)" },
        { from: 0,              to: goalVal * 0.7, color: "rgba(255,107,107,0.06)" },
      ];
      zones.forEach(({ from, to, color }) => {
        const yTop = y.getPixelForValue(Math.min(to, 100));
        const yBot = y.getPixelForValue(Math.max(from, 0));
        ctx.fillStyle = color;
        ctx.fillRect(left, yTop, right - left, yBot - yTop);
      });
    }
  };

  const parseChartDate = value => {
    if (!value || typeof value !== "string") return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  // Draws a vertical quarter-end line from the very top to the very bottom
  // of the chart plotting area. The line follows zoom/pan because its x pixel
  // position is calculated from the currently visible time scale.
  // Same as chartBgPlugin above: `quarters` comes from pluginOptions (chart.options.plugins.
  // quarterLines) so marking/deleting a quarter shows up on next draw, not just after a refresh.
  const quarterLinePlugin = {
    id: "quarterLines",
    afterDraw(ch, args, pluginOptions) {
      const { ctx, chartArea, scales } = ch;
      const x = scales.x;

      if (!x || !chartArea) return;

      const { top, bottom, left, right } = chartArea;
      const nextFlagPositions = [];
      const quartersForDraw = pluginOptions?.quarters ?? [];

      quartersForDraw.forEach(q => {
        const qDate = parseChartDate(q.date);
        if (!qDate) return;

        const px = x.getPixelForValue(qDate.getTime());

        // Do not draw the line if this quarter is outside the visible chart.
        if (!Number.isFinite(px) || px < left || px > right) return;

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(px, top);
        ctx.lineTo(px, bottom);
        ctx.strokeStyle = "#7c6cf0";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.restore();

        // Small quarter flag at the top of the line.
        ctx.save();
        ctx.fillStyle = "#7c6cf0";
        ctx.font = "700 11px 'Nunito Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("🏁", px, top + 3);
        ctx.restore();

        // Record where the flag landed so a hoverable overlay can be positioned on top
        // of the canvas (canvas-drawn text can't natively receive hover events).
        nextFlagPositions.push({ id: q.id, x: px, y: top + 3, name: q.name || q.date, date: q.date, avg: q.avg });
      });

      // Only trigger a React re-render when positions actually changed (e.g. after zoom/pan/resize),
      // to avoid looping: setState -> re-render -> chart redraw -> afterDraw -> setState...
      const prev = flagPositionsRef.current;
      const changed = prev.length !== nextFlagPositions.length || nextFlagPositions.some((p, i) => {
        const o = prev[i];
        return !o || o.id !== p.id || Math.round(o.x) !== Math.round(p.x) || Math.round(o.y) !== Math.round(p.y) || o.name !== p.name;
      });
      if (changed) {
        flagPositionsRef.current = nextFlagPositions;
        setFlagPositions(nextFlagPositions);
      }
    },
  };

  const startChartDate = parseChartDate(chart?.startDate);
  const goalChartDate = parseChartDate(chart?.goalDate);
  const hasValidTargetDates = Boolean(startChartDate && goalChartDate && startChartDate.getTime() <= goalChartDate.getTime());

  // Users can zoom/pan into a portion of the chart (see zoom plugin options below). The tick
  // generator below recomputes its spacing against whatever date range is *currently visible* —
  // daily for a short span, weekly for a several-month span, monthly for a multi-year span, etc.
  // — so ticks stay readable at every zoom level instead of a fixed set built once for the full range.
  const generateNiceTicks = (minTime, maxTime) => {
    if (!Number.isFinite(minTime) || !Number.isFinite(maxTime) || maxTime <= minTime) return null;
    const DAY = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round((maxTime - minTime) / DAY));
    const niceStepsDays = [1, 2, 3, 5, 7, 14, 21, 30, 60, 90, 182, 365];
    const maxTicks = 25;
    let stepDays = niceStepsDays[niceStepsDays.length - 1];
    for (const candidate of niceStepsDays) {
      if (totalDays / candidate <= maxTicks) { stepDays = candidate; break; }
    }
    const tickTimes = new Set([minTime, maxTime]);
    for (let t = minTime; t <= maxTime; t += stepDays * DAY) tickTimes.add(t);
    return Array.from(tickTimes).sort((a, b) => a - b);
  };

  const chartData={
    datasets:[
      {label:chart?.name??"Progress",data:pts,borderColor:pal.chip,backgroundColor:pal.chip+"22",tension:0.35,fill:true,
       pointRadius:pts.map(p=>{
         const absIndex = allPts.indexOf(p);
         return absIndex===selectedPointIndex ? 8 : p.notes ? 7 : 5;
       }),pointHoverRadius:9,pointBackgroundColor:pts.map(p=>p.notes?pal.chip:"#fff"),
       pointBorderColor:pts.map(p=>p.notes?pal.chip:pal.chip),pointBorderWidth:pts.map(p=>p.notes?0:2),pointHitRadius:14},
      hasValidTargetDates && {label:"🎯 Target",data:[{x:startChartDate,y:chart.startValue},{x:goalChartDate,y:chart.goalValue}],
        borderColor:"#52c97a",borderDash:[6,4],borderWidth:2,fill:false,pointRadius:4,pointBackgroundColor:"#52c97a"},
    ].filter(Boolean),
  };

  const chartOpts={
    responsive:true,maintainAspectRatio:false,
    plugins:{
      legend:{labels:{color:"#5a5a72",font:{family:"'Nunito',sans-serif",size:12,weight:"700"},boxWidth:14,padding:16}},
      tooltip:{backgroundColor:"#2d2d3a",titleColor:"#fff",bodyColor:"#9898b0",padding:12,cornerRadius:10,
        titleFont:{family:"'Nunito',sans-serif",weight:"800"},bodyFont:{family:"'Nunito Sans',sans-serif",size:12},
        callbacks:{label:ctx=>` ${ctx.parsed.y}%${ctx.raw?.notes?`  · ${ctx.raw.notes}`:""}`}},
      chartBg:{goalVal:chart?.goalValue ?? 100},
      quarterLines:{quarters},
      zoom:{
        pan:{enabled:true,mode:"x"},
        zoom:{wheel:{enabled:true},pinch:{enabled:true},drag:{enabled:false},mode:"x"},
        limits:{x:{min:"original",max:"original",minRange:2*24*60*60*1000}},
      },
    },
    scales:{
      x:{type:"time",time:{unit:"day",tooltipFormat:"MMM d, yyyy"},grid:{color:"rgba(0,0,0,0.04)"},
         ticks:{color:"#9898b0",font:{family:"'Nunito Sans'",size:11},autoSkip:false,maxRotation:60,minRotation:0},
         afterBuildTicks: axis => {
           // axis.min/axis.max already reflect any active zoom/pan, so this regenerates ticks
           // for whatever window is currently visible instead of the original full range.
           const niceTicks = generateNiceTicks(axis.min, axis.max);
           if (niceTicks) axis.ticks = niceTicks.map(value => ({ value }));
         }},
      y:{min:0,max:100,grid:{color:"rgba(0,0,0,0.04)"},ticks:{color:"#9898b0",font:{family:"'Nunito'",size:11},callback:v=>v+"%"}},
    },
    onClick:(evt,els)=>{
      if(!els?.length) return;
      const clickedPoint = pts[els[0].index];
      if(!clickedPoint) return;
      const absIndex = allPts.indexOf(clickedPoint);
      setSelectedPointIndex(absIndex >= 0 ? absIndex : null);
    },
  };

  if(!chart) return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"var(--ink-soft)"}}>
      <div style={{fontSize:36}}>📊</div>
      <p style={{fontSize:14}}>Add a goal from the sidebar to get started.</p>
      <button className="action-btn" onClick={()=>setShowAG(true)} style={{background:pal.chip,color:"#fff"}}>+ Add Goal</button>
    </div>
  );

  return(
    <div style={{flex:1,overflow:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:16}}>
      {/* Year picker + streak */}
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <select value={viewYear} onChange={e=>setViewYear(Number(e.target.value))}>
          {yearList.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <button className="action-btn" onClick={()=>setShowQL(true)} style={{background:pal.chip,color:"#fff",marginLeft:"auto",padding:"6px 14px",fontSize:12}}>⚡ Quick Log</button>
      </div>

      {latest&&(
        <div className="fade-up" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {label:"Latest Score",   val:`${latest.y}%`,                  sub:latest.x,                                                   color:pal.chip, pct:latest.y}, 
            {label:"Goal Target",    val:`${chart.goalValue}%`,            sub:chart.goalDate||"No target date",                           color:"#52c97a",pct:chart.goalValue},
            {label:"Progress to Goal",val:goalPct!=null?`${goalPct}%`:"—",sub:trend!=null?(Number(trend)>=0?`▲ +${trend}% from last`:`▼ ${trend}% from last`):"Need more data",color:goalPct>=100?"#52c97a":"#ffd166",pct:goalPct??0},
          ].map(({label,val,sub,color,pct})=>(
            <div key={label} className="stat-card" style={{ backgroundColor: theme.card }} 
>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:26}}>{val}</div>
                <Ring pct={pct} color={color} size={52}/>
              </div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-soft)"}}>{label}</div>
              <div style={{fontSize:11,color:"var(--ink-soft)"}}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
        <div style={{flex:"1 1 0",minWidth:0,background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"16px",boxShadow:`0 8px 20px ${theme.shadow}`,transition:"flex-basis .2s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:10,flexWrap:"wrap"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:theme.text}}>Progress Chart — {viewYear}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <div style={{fontSize:11,color:"var(--ink-soft)"}}>Click a point to select it · filled dot = has note · scroll/pinch to zoom · drag to pan</div>
              <button className="ghost-btn" onClick={()=>chartRef.current?.resetZoom()} style={{padding:"4px 10px",fontSize:11}}>Reset zoom</button>
              {selectedPointIndex!==null&&(
                <button className="ghost-btn" onClick={()=>setPointToDelete(selectedPointIndex)} style={{padding:"4px 10px",fontSize:11,color:"var(--red)"}}>Delete selected</button>
              )}
              <button className="action-btn" onClick={handleEndQuarter} style={{padding:"4px 12px",fontSize:11,background:"#7c6cf0",color:"#fff"}} title="Mark today as the end of a quarter and average all entries since the last quarter line">🏁 End Quarter</button>
            </div>
          </div>
          <div style={{height:240,position:"relative"}}>
            <Line ref={chartRef} data={chartData} options={chartOpts} plugins={[chartBgPlugin, quarterLinePlugin]}/>
            {/* Hoverable overlay for each quarter flag — canvas text can't natively receive hover
                events, so we position a small transparent hit-target on top of each flag using
                the pixel coordinates the quarterLines plugin records on every draw. */}
            {flagPositions.map(fp=>(
              <div
                key={fp.id}
                onMouseEnter={()=>setHoveredFlagId(fp.id)}
                onMouseLeave={()=>setHoveredFlagId(id=>id===fp.id?null:id)}
                style={{position:"absolute",left:fp.x-9,top:fp.y-2,width:18,height:18,cursor:"help",zIndex:5}}
              >
                {hoveredFlagId===fp.id&&(
                  <div style={{position:"absolute",bottom:22,left:"50%",transform:"translateX(-50%)",background:"#2d2d3a",color:"#fff",padding:"6px 10px",borderRadius:8,fontSize:11,fontFamily:"var(--font-head)",fontWeight:700,whiteSpace:"nowrap",boxShadow:"var(--shadow)",pointerEvents:"none"}}>
                    {fp.name}
                    <div style={{fontWeight:500,color:"#9898b0",fontSize:10,marginTop:2}}>{fp.date}{fp.avg!=null?` · ${fp.avg}%`:""}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
            {[{color:"rgba(82,201,122,0.3)",label:"At/above goal"},{color:"rgba(255,209,102,0.3)",label:"Near goal"},{color:"rgba(255,107,107,0.2)",label:"Below goal"}].map(({color,label})=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--ink-soft)"}}>
                <span style={{display:"inline-block",width:12,height:8,borderRadius:2,background:color}}/>{label}
              </div>
            ))}
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--ink-soft)"}}>
              <span style={{display:"inline-block",width:12,height:8,borderRadius:2,background:"repeating-linear-gradient(90deg,#7c6cf0 0 4px,transparent 4px 8px)"}}/>🏁 Quarter marker — hover a flag for its name
            </div>
          </div>
        </div>

        {quarterLogCollapsed ? (
          <button
            onClick={()=>setQuarterLogCollapsed(false)}
            title="Show quarterly averages"
            style={{flex:"0 0 34px",width:34,alignSelf:"stretch",minHeight:240,background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,boxShadow:`0 8px 20px ${theme.shadow}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0"}}
          >
            <span style={{fontSize:11,color:theme.subtle}}>◂</span>
            <span style={{writingMode:"vertical-rl",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,color:theme.text,letterSpacing:"0.04em"}}>Quarterly Averages</span>
            {quartersSorted.length>0&&(
              <span style={{fontSize:10,fontWeight:800,color:"#fff",background:pal.chip,borderRadius:999,padding:"2px 6px",minWidth:16,textAlign:"center"}}>{quartersSorted.length}</span>
            )}
          </button>
        ) : (
          <div style={{flex:"0 0 200px",width:200,minWidth:0,background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"14px",boxShadow:`0 8px 20px ${theme.shadow}`,alignSelf:"flex-start"}}>
            <div
              onClick={()=>setQuarterLogCollapsed(true)}
              title="Collapse"
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8,cursor:"pointer",userSelect:"none"}}
            >
              <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
                <span style={{fontSize:12,color:theme.subtle}}>▸</span>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,color:theme.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Quarterly Avgs</div>
              </div>
              <div style={{fontSize:10,color:"var(--ink-soft)",flexShrink:0}}>{quartersSorted.length}</div>
            </div>
            {quartersSorted.length===0 ? (
              <div style={{fontSize:11,color:"var(--ink-soft)"}}>No quarters marked yet. Press "🏁 End Quarter" to log the average since the last line.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:280,overflowY:"auto"}}>
                {quartersSorted.slice().reverse().map(q=>(
                  <div key={q.id} style={{display:"flex",flexDirection:"column",padding:"7px 9px",borderRadius:8,background:theme.softPanel,border:`1.5px solid ${pal.border}44`,gap:6}}>
                    {editingQuarterId===q.id ? (
                      <>
                        <div><SectionLabel>Quarter name</SectionLabel><input type="text" autoFocus value={editingQuarterName} onChange={e=>setEditingQuarterName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEditQuarter(q.id)} placeholder={q.date} style={{fontSize:12,padding:"6px 8px"}}/></div>
                        <div><SectionLabel>Percentage</SectionLabel><input type="number" min={0} max={100} value={editingQuarterVal} onChange={e=>setEditingQuarterVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEditQuarter(q.id)} style={{width:"100%",padding:"6px 8px",fontSize:12}}/></div>
                        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                          <button className="ghost-btn" onClick={()=>saveEditQuarter(q.id)} style={{padding:"3px 8px",fontSize:10}}>Save</button>
                          <button className="ghost-btn" onClick={cancelEditQuarter} style={{padding:"3px 8px",fontSize:10}}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                          <div style={{fontWeight:700,fontSize:12,color:theme.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={q.name||q.date}>🏁 {q.name || q.date}</div>
                          <span style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:14,color:pal.chip,flexShrink:0}}>{q.avg!=null?`${q.avg}%`:"—"}</span>
                        </div>
                        <div style={{fontSize:10,color:"var(--ink-soft)"}}>{q.date} · {q.count} {q.count===1?"entry":"entries"}{q.manual?" · edited":""}</div>
                        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                          <button onClick={()=>startEditQuarter(q)} title="Edit name or percentage" style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:.6}}>✏️</button>
                          <button onClick={()=>deleteQuarter(q)} title="Delete this quarter line and average" style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:.6,color:"var(--red)"}}>🗑️</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{background:theme.softPanel,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"16px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,marginBottom:8,color:theme.text}}>🗒 Goal Notes</div>
        <textarea value={chart.notes} onChange={e=>upd(d=>d[selSet].charts[selChart].notes=e.target.value)} placeholder="Strategies, parent notes, observations…" style={{display:"block",width:"100%",minHeight:140,resize:"vertical",fontSize:13,background:"rgba(255,255,255,.6)",border:"1.5px solid #ffd16699"}}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"18px",boxShadow:`0 8px 20px ${theme.shadow}`}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:14,color:theme.text}}>📝 Log Session</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><SectionLabel>Accuracy %</SectionLabel><input type="number" min={0} max={100} placeholder="0–100" value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPoint(e)} style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:18,textAlign:"center"}}/></div>
              <div><SectionLabel>Date</SectionLabel><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}/></div>
            </div>
            <div><SectionLabel>Session Note</SectionLabel><input type="text" placeholder="What went well? Any observations…" value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPoint(e)}/></div>
            <button className="action-btn" onClick={addPoint} style={{background:pal.chip,color:"#fff",justifyContent:"center",width:"100%",fontSize:14,padding:"11px 18px"}}>✦ Add Data Point</button>
          </div>
          <div style={{marginTop:16,paddingTop:14,borderTop:`1px dashed ${theme.border}`}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,color:theme.subtle,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.07em"}}>🎯 Goal Setup</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{label:"Baseline %",val:chart.startValue,key:"startValue",type:"number"},{label:"Baseline Date",val:chart.startDate,key:"startDate",type:"date"},{label:"Goal %",val:chart.goalValue,key:"goalValue",type:"number"},{label:"Goal Date",val:chart.goalDate,key:"goalDate",type:"date"}].map(({label,val,key,type})=>(
                <div key={key}><SectionLabel>{label}</SectionLabel><input
                  type={type}
                  value={key === "startValue" || key === "goalValue" ? (val ?? "") : (val || "")}
                  onChange={e=>{
                    if (key === "startValue" || key === "goalValue") {
                      upd(d=>d[selSet].charts[selChart][key]=Number(e.target.value));
                      return;
                    }

                    const value = e.target.value;
                    if (!value || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return;

                    const parsed = new Date(`${value}T12:00:00`);
                    if (Number.isNaN(parsed.getTime())) return;

                    if (key === "goalDate" && chart?.startDate && new Date(`${chart.startDate}T12:00:00`).getTime() > parsed.getTime()) {
                      return;
                    }

                    upd(d=>d[selSet].charts[selChart][key]=value);
                  }}
                  style={{fontSize:13}}
                /></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:theme.card,borderRadius:"var(--r-lg)",border:`2px solid ${theme.border}`,padding:"18px",boxShadow:`0 8px 20px ${theme.shadow}`,flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:12,color:theme.text}}>📋 Session Log</div>
            <div style={{flex:1,minHeight:0,overflowY:"auto"}}>
              {pts.length===0?(
                <div style={{textAlign:"center",padding:"24px 0",color:"var(--ink-soft)",fontSize:13}}>
                  <div style={{fontSize:30,marginBottom:6}}>🌱</div>No sessions in {viewYear} yet!
                </div>
              ):[...pts].reverse().map((pt,i)=>{
                const realIdx=pts.length-1-i;
                return(
                  <div key={i} className="log-row">
                    <div style={{width:44,textAlign:"right",fontFamily:"var(--font-head)",fontWeight:900,fontSize:14,color:pal.chip,flexShrink:0}}>{pt.y}%</div>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{fontSize:12,fontWeight:600}}>{pt.x}</div>
                      {pt.notes&&<div style={{fontSize:11,color:theme.subtle,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pt.notes}</div>}
                    </div>
                    <button className="ghost-btn" onClick={()=>setEditPt({idx:allPts.indexOf(pt),x:pt.x,y:pt.y,notes:pt.notes||""})} style={{padding:"3px 8px",fontSize:11}}>Edit</button>
                    <button className="ghost-btn" onClick={()=>setPointToDelete(allPts.indexOf(pt))} style={{padding:"3px 8px",fontSize:11,color:"#ef4444",borderColor:"#ef4444"}}>Delete</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal show={pointToDelete!==null} onClose={()=>setPointToDelete(null)} title="Delete point?" emoji="⚠️">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:14,color:theme.text,lineHeight:1.5}}>This will remove the selected data point from this goal.</div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>setPointToDelete(null)}>Cancel</button>
            <button className="action-btn" onClick={()=>deletePointAtIndex(pointToDelete)} style={{background:"var(--red)",color:"#fff"}}>Delete</button>
          </div>
        </div>
      </Modal>

      {/* Quick Log Modal */}
      <Modal show={showQL} onClose={()=>setShowQL(false)} title="Quick Log" emoji="⚡">
        <div style={{fontSize:13,color:theme.text,marginBottom:14}}>Log a session for <strong>{chart.name}</strong> right now.</div>
        <QuickLogForm pal={pal} onSave={(v,d,n,e)=>{addPoint(e,v,d,n);setShowQL(false);}}/>
      </Modal>

      {/* Edit Point Modal */}
      <Modal show={!!editPt} onClose={()=>setEditPt(null)} title="Edit Session" emoji="✏️">
        {editPt&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><SectionLabel>Accuracy %</SectionLabel><input type="number" value={editPt.y} onChange={e=>setEditPt(p=>({...p,y:e.target.value}))} style={{marginTop:5}}/></div>
              <div><SectionLabel>Date</SectionLabel><input type="date" value={editPt.x} onChange={e=>setEditPt(p=>({...p,x:e.target.value}))} style={{marginTop:5}}/></div>
            </div>
            <div><SectionLabel>Notes</SectionLabel><textarea value={editPt.notes} onChange={e=>setEditPt(p=>({...p,notes:e.target.value}))} style={{marginTop:5,resize:"vertical",minHeight:60}}/></div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
              <button className="ghost-btn" onClick={()=>setEditPt(null)}>Cancel</button>
              <button className="action-btn" onClick={saveEditPt} style={{background:"var(--teal)",color:"#fff"}}>Save Changes</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default GoalsTab;

function Sparkline({data,color}){
  if(!data||data.length<2) return <div style={{fontSize:11,color:"var(--ink-soft)"}}>No data</div>;
  const vals=data.slice(-10).map(p=>p.y);
  const max=Math.max(...vals)||1;
  return(
    <div className="sparkline">
      {vals.map((v,i)=>(
        <div key={i} className="spark-bar" style={{height:`${(v/max)*100}%`,background:color,opacity:.7+.3*(i/(vals.length-1)),flex:1}}/>
      ))}
    </div>
  );
}

export default Sparkline;

// Base modal shell — a centered card over a blurred backdrop. Click the backdrop or the ✕ to close.
function Modal({show,onClose,title,emoji,children,wide}){
  if(!show) return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,45,58,.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} className="card-appear" style={{background:"var(--paper)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-lg)",padding:28,minWidth:wide?520:360,maxWidth:wide?640:500,width:"92%",border:"2px solid var(--border)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {emoji&&<span style={{fontSize:22}}>{emoji}</span>}
            <h3 style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17}}>{title}</h3>
          </div>
          <button onClick={onClose} className="ghost-btn" style={{padding:"4px 10px"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;

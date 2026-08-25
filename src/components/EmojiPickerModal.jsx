import { useState } from "react";
import { EMOJI_OPTIONS } from "../constants.js";
import Modal from "./Modal.jsx";

function EmojiPickerModal({show,onClose,onSelect,selected}){
  const [search,setSearch]=useState("");
  const filtered=EMOJI_OPTIONS.filter(emoji => {
    if(!search.trim()) return true;
    const needle = search.toLowerCase();
    return emoji.toLowerCase().includes(needle) || "smile happy school sun star animal fruit heart classroom".includes(needle);
  });
  if(!show) return null;
  return (
    <Modal show={show} onClose={onClose} title="Choose Emoji" emoji="🎨">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search emoji ideas…" autoFocus />
        <div style={{display:"grid",gridTemplateColumns:"repeat(8,minmax(0,1fr))",gap:8,maxHeight:260,overflowY:"auto",paddingRight:4}}>
          {filtered.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={()=>{onSelect(emoji); onClose();}}
              title={emoji}
              style={{
                fontSize:26,
                background:selected===emoji ? "rgba(38,198,176,0.15)" : "var(--cream)",
                border:`1.5px solid ${selected===emoji ? "var(--teal)" : "var(--border)"}`,
                borderRadius:10,
                padding:"10px 0",
                cursor:"pointer",
                transition:"all .15s ease",
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default EmojiPickerModal;

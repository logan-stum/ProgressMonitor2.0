import { useState } from "react";
import Modal from "./Modal.jsx";

function GuideModal({show,onClose}){
  const [open,setOpen]=useState(0);
  const sections=[
    {emoji:"🏠",title:"Dashboard",body:[
      "👤 Click any student name to open their page",
      "💬 Click a goal chip to jump to that goal's chart",
      "📁 Click group headers to collapse/expand groups",
      "🔍 Use filters at the top to search by name, accommodation, or group",
    ]},
    {emoji:"🧑‍🎓",title:"Adding Students",body:[
      "📌 Press \"+ Add Student\" in Quick Tools (bottom-left)",
      "✏️ Give them a name and pick an emoji",
      "💡 Emojis help you spot students at a glance",
      "🔄 Students stay organized even when you reorder or delete others",
    ]},
    {emoji:"📁",title:"Groups & Organization",body:[
      "📂 Use \"+ Add Group\" to organize students (by grade, class, caseload, etc.)",
      "🎯 Makes the Dashboard and sidebar easier to navigate",
      "🔀 Drag groups in the sidebar to reorder them",
      "📋 Attendance Groups are separate — use them to track session attendance",
    ]},
    {emoji:"📊",title:"Goals & Tracking",body:[
      "🎯 Create a goal: name + starting value + starting date + target value + target date",
      "⚡ Log progress: click the chart or use \"⚡ Quick Log\" button (press \"N\" for speed)",
      "📈 Charts show your data over time — zoom, pan, and reset view as needed",
      "❌ Click a point to select it, then delete. Or Ctrl+click to delete instantly",
    ]},
    {emoji:"🏁",title:"Quarterly Tracking",body:[
      "📍 Press \"🏁 End Quarter\" to mark the end of a term",
      "📊 It averages all entries since the last quarter and saves that average",
      "📝 Click any quarter line to see the date and average",
      "✏️ Rename quarterly records or edit percentages — the data stays the same",
    ]},
    {emoji:"🛠",title:"Accommodations",body:[
      "📝 Press \"+ Setup\" to create your accommodation list (e.g. \"Preferential Seating\")",
      "📅 Click any day on the calendar to log what was given, refused, or N/A",
      "💬 Add a note per day and explanations for N/A statuses",
      "📊 See monthly totals at a glance — \"🖨 Print Calendar\" for reports",
    ]},
    {emoji:"⏱",title:"Minutes & Services",body:[
      "⏱️ Log service time: speech therapy, counseling, intervention, etc.",
      "➕ Press \"⏱ Minutes Options\" to manage your service labels",
      "📋 Use \"📋 Take Attendance\" for group sessions — tracks who attended and late arrivals",
      "🖨️ Print attendance logs for parent communications",
    ]},
    {emoji:"📎",title:"Files & Attachments",body:[
      "📎 Click the Files button to upload documents, images, or PDFs",
      "🎯 Files are saved to that specific goal — no mixing across students",
      "🛡️ Accommodations tab has its own separate file storage",
      "⬇️ Download one at a time, or \"⬇️ Download All\" to grab them quickly",
    ]},
    {emoji:"🖨",title:"Printing & Reports",body:[
      "📄 Press \"📄 Report\" to see a summary of everything",
      "🖨️ \"Print\" = full report with all goals, quarters, accommodations, and minutes",
      "👪 \"Parent Print\" = single-page handout with goal progress (share with families)",
      "📋 \"Bulk Report\" = print multiple students at once",
    ]},
    {emoji:"↕",title:"Backup & Restore",body:[
      "↓ Press \"↓ Export\" to download all your data as a backup file",
      "↑ Press \"↑ Import\" to restore from a backup or move to another device",
      "💾 Everything is saved locally — nothing sent to the cloud",
      "🔒 Back up regularly to keep your data safe",
    ]},
    {emoji:"🎨",title:"Themes & Appearance",body:[
      "🌅 Pick a theme from the dashboard: Sunrise (default), Studio, or Night mode",
      "🎯 Your preference is saved automatically",
      "💡 Night mode is easier on eyes in dim lighting",
    ]},
    {emoji:"⌨",title:"Keyboard Shortcuts",body:null,shortcuts:[
      ["N","Quick log (on student page)"],
      ["H","Go to Dashboard"],
      ["Ctrl+Z","Undo"],
      ["?  or  /","Show this guide"],
      ["Escape","Close any popup"],
      ["Ctrl+Click","Delete chart point"],
    ]},
    {emoji:"💡",title:"Pro Tips",body:[
      "💨 Press \"N\" while on a student page to log progress super fast",
      "🔗 Bookmark student pages — the URL updates automatically",
      "📊 Zoom the chart to see details, then \"Reset\" to see the big picture",
      "📁 Use Groups to organize how you work (by class, by support type, etc.)",
      "🖨️ Print before meetings with families — reports look professional",
      "💾 Export your data monthly as a backup — it's your safety net",
    ]},
  ];
  return(
    <Modal show={show} onClose={onClose} title="User Guide" emoji="📘" wide>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sections.map((s,i)=>(
          <div key={s.title} style={{border:"1.5px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
            <div onClick={()=>setOpen(o=>o===i?-1:i)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",cursor:"pointer",userSelect:"none",background:"var(--cream)"}}>
              <span style={{fontSize:16}}>{s.emoji}</span>
              <span style={{flex:1,fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,color:"var(--ink)"}}>{s.title}</span>
              <span style={{fontSize:12,color:"var(--ink-soft)"}}>{open===i?"▾":"▸"}</span>
            </div>
            {open===i&&(
              <div style={{padding:"10px 14px 14px"}}>
                {s.shortcuts?(
                  s.shortcuts.map(([key,desc])=>(
                    <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 0",borderBottom:"1px dashed var(--border)"}}>
                      <span className="kbd">{key}</span>
                      <span style={{fontSize:13,color:"var(--ink-mid)"}}>{desc}</span>
                    </div>
                  ))
                ):(
                  s.body.map((line,j)=>(
                    <div key={j} style={{fontSize:13,color:"var(--ink-mid)",lineHeight:1.5,marginBottom:j===s.body.length-1?0:8}}>{line}</div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default GuideModal;

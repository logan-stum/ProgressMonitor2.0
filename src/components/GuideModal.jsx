import { useState } from "react";
import Modal from "./Modal.jsx";

function GuideModal({show,onClose}){
  const [open,setOpen]=useState(0);
  const sections=[
    {emoji:"🏠",title:"Dashboard",body:[
      "The Dashboard is the home screen — it lists every student grouped by whichever Groups you've set up, with each goal's latest progress at a glance.",
      "Click a student's name (or a goal chip under them) to jump straight into that student's page.",
      "Click a group header to collapse or expand that group.",
    ]},
    {emoji:"🧑‍🎓",title:"Students & Groups",body:[
      "Use \"+ Add Student\" in the Quick Tools panel (bottom-left) to create a new student — give them a name and pick an emoji to represent them.",
      "\"+ Add Group\" lets you organize students into groups (e.g. by caseload, grade, or classroom) so the Dashboard and sidebar are easier to scan.",
      "The left sidebar lists all students; click one to open their page, or use the search/collapse controls at the top of the sidebar.",
    ]},
    {emoji:"📊",title:"Goals tab",body:[
      "Each student can have multiple goals. Use \"+ Add Goal\" to create one, giving it a name, a starting/baseline value, and a target/goal value.",
      "Log a new data point with the ⚡ Quick Log button, or click directly on the chart.",
      "Click any existing point on the chart to select it — a \"Delete selected\" button appears so you can remove it. Ctrl+click a point to delete it immediately without the extra step.",
      "Scroll or pinch on the chart to zoom in, drag to pan, and use \"Reset zoom\" to snap back to the full view.",
      "🏁 End Quarter draws a vertical line on the chart at today's date and averages every entry since the last quarter line (or the beginning, if there isn't one yet). That average is added to the Quarterly Averages log.",
      "Hover any 🏁 flag on the chart to see that quarter's name, date, and average in a tooltip.",
      "The Quarterly Averages panel sits beside the chart and can be collapsed to a thin strip on the right (click its header) so the chart can use the full width. Each entry can be renamed, have its percentage edited (✏️), or be deleted (🗑️).",
    ]},
    {emoji:"🛠",title:"Accommodations tab",body:[
      "Keep a running list of accommodations/modifications in place for the student. Add, edit, or remove entries from this tab.",
      "This tab also has its own 📎 Files button for attachments related to accommodations (separate from each goal's own files).",
    ]},
    {emoji:"⏱",title:"Minutes tab",body:[
      "Log service minutes delivered to the student (e.g. therapy or intervention time), tagged with a label/service type.",
      "Manage the list of available labels from \"⏱ Minutes Options\" in Quick Tools.",
    ]},
    {emoji:"📎",title:"Files / Attachments",body:[
      "Open the 📎 Files button (available on the Goals and Accommodations tabs) to upload files for that specific goal or for accommodations — files are kept separate per goal and per accommodations tab, not shared across everything.",
      "\"⬇ Download All\" saves every file in that list to your computer one at a time.",
      "\"🖨 Print All\" opens a separate print dialog for each file, one after another — images and PDFs are shown full-page; other file types show a placeholder page since browsers can't render them for printing.",
      "Each file also has its own download (↓) and delete (🗑️) buttons.",
    ]},
    {emoji:"🖨",title:"Reports & Printing",body:[
      "Click \"📄 Report\" (top of a student's page) to open the report modal.",
      "\"🖨 Print\" prints the full report for that student — every goal, quarterly averages, accommodations, and minutes.",
      "\"👪 Parent Print\" prints a short, single-goal handout for whichever goal is currently open: the goal's stats, a snapshot image of its chart (with quarter lines), and the quarterly averages log. Open the Goals tab first so the chart is on screen to capture.",
      "For printing several students at once, use the class-wide bulk print option to select multiple students and print all their reports together.",
    ]},
    {emoji:"↕",title:"Import & Export",body:[
      "\"↓ Export\" downloads all of your data (students, goals, accommodations, minutes, files, settings) as a single JSON file — use this as a backup or to move data to another device.",
      "\"↑ Import\" loads a previously exported JSON file back in, restoring everything it contains.",
    ]},
    {emoji:"⌨",title:"Keyboard Shortcuts",body:null,shortcuts:[
      ["N","Quick log a session (on student page)"],
      ["H","Go to Dashboard"],
      ["Ctrl+Z","Undo last change"],
      ["?  or  /","Toggle this guide"],
      ["Escape","Close any open modal"],
      ["Ctrl+click chart point","Delete that data point"],
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

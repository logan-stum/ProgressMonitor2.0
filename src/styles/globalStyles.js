// Injects the app's global CSS (design tokens, base element styles, shared component classes,
// and print media rules) once, as a side effect. Import this file for its effect only:
//   import "./styles/globalStyles.js";
const css = document.createElement("style");
css.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Nunito+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --font-head:'Nunito',sans-serif; --font-body:'Nunito Sans',sans-serif;
    --cream:#fdf8f2; --paper:#fff; --teal:#26c6b0; --yellow:#ffd166;
    --yellow-lt:#fffbec; --blue:#4e9af1; --green:#52c97a; --red:#ff6b6b;
    --ink:#2d2d3a; --ink-mid:#5a5a72; --ink-soft:#9898b0; --border:#ede8e0;
    --shadow-sm:0 1px 3px rgba(45,45,58,.07),0 1px 2px rgba(45,45,58,.05);
    --shadow:0 4px 12px rgba(45,45,58,.10);
    --shadow-lg:0 8px 28px rgba(45,45,58,.14);
    --r:12px; --r-sm:8px; --r-lg:18px;
  }
  body { font-family:var(--font-body); background:var(--cream); color:var(--ink); min-height:100vh; display:block; }
  .report-page{break-before:page;page-break-before:always;}
  .report-page:first-child{break-before:auto;page-break-before:auto;}
  input,textarea { font-family:var(--font-body); color:var(--ink); background:var(--paper); border:2px solid var(--border); border-radius:var(--r-sm); padding:8px 12px; font-size:14px; outline:none; width:100%; transition:border-color .15s,box-shadow .15s; }
  input:focus,textarea:focus { border-color:var(--teal); box-shadow:0 0 0 3px rgba(38,198,176,.15); }
  select { font-family:var(--font-body); color:var(--ink); background:var(--paper); border:2px solid var(--border); border-radius:var(--r-sm); padding:7px 10px; font-size:13px; outline:none; cursor:pointer; }
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}
  @keyframes popIn  {0%{opacity:0;transform:scale(.92) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes fadeUp {0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes confetti{0%{opacity:1;transform:scale(1) rotate(0deg)}100%{opacity:0;transform:scale(0) rotate(200deg) translateY(-40px)}}
  @keyframes bigPop  {0%{opacity:0;transform:scale(.5)}60%{transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}
  .card-appear{animation:popIn .22s cubic-bezier(.34,1.56,.64,1) both}
  .fade-up{animation:fadeUp .2s ease both}
  .action-btn{display:inline-flex;align-items:center;gap:5px;padding:9px 18px;border-radius:99px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer;border:none;transition:all .15s;box-shadow:var(--shadow-sm)}
  .action-btn:hover{transform:translateY(-1px);box-shadow:var(--shadow)}
  .action-btn:active{transform:translateY(0)}
  .ghost-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:99px;font-family:var(--font-head);font-weight:600;font-size:12px;cursor:pointer;border:2px solid var(--border);background:transparent;color:var(--ink-mid);transition:all .15s}
  .ghost-btn:hover{border-color:var(--ink-soft);color:var(--ink)}
  .ghost-btn:disabled{opacity:.4;cursor:not-allowed}
  .log-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px dashed var(--border);animation:fadeUp .15s ease both}
  .log-row:last-child{border-bottom:none}
  .stat-card{background:var(--paper);border-radius:var(--r-lg);padding:16px 20px;box-shadow:var(--shadow-sm);border:2px solid var(--border);display:flex;flex-direction:column;gap:4px;transition:box-shadow .15s,transform .15s}
  .stat-card:hover{box-shadow:var(--shadow);transform:translateY(-1px)}
  .confetti-dot{position:fixed;pointer-events:none;width:8px;height:8px;border-radius:2px;animation:confetti .65s ease forwards}
  .tab-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:99px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer;border:2px solid transparent;background:transparent;color:var(--ink-mid);transition:all .15s}
  .tab-btn:hover{color:var(--ink);background:var(--cream)}
  .tab-btn.active{background:var(--paper);color:var(--ink);border-color:var(--border);box-shadow:var(--shadow-sm)}
  .acc-status-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:99px;font-family:var(--font-head);font-weight:700;font-size:12px;cursor:pointer;border:2px solid;transition:all .15s;background:transparent}
  .acc-status-btn:hover{transform:translateY(-1px)}
  .cal-day{width:100%;min-height:52px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:6px 4px 5px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer;border:2px solid transparent;transition:all .15s;position:relative;gap:4px}
  .cal-day:hover{background:var(--cream);border-color:var(--border)}
  .cal-day.today{border-color:var(--teal)!important;color:var(--teal)}
  .cal-day.selected{background:var(--teal)!important;color:#fff!important;border-color:var(--teal)!important}
  .cal-day.other-month{opacity:.3;cursor:default;min-height:52px}
  .cal-day-dots{display:flex;gap:2px;flex-wrap:wrap;justify-content:center;width:100%}
  .cal-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
  .kbd{display:inline-flex;align-items:center;justify-content:center;padding:2px 6px;border-radius:4px;background:var(--cream);border:1.5px solid var(--border);font-family:var(--font-head);font-weight:700;font-size:11px;color:var(--ink-mid)}
  .stu-card{background:var(--paper);border-radius:var(--r-lg);border:2px solid var(--border);padding:18px;cursor:pointer;transition:all .2s;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px}
  .stu-card:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
  .sparkline{display:flex;align-items:flex-end;gap:2px;height:28px}
  .spark-bar{border-radius:2px 2px 0 0;min-width:4px;transition:height .3s}
  @media print {
    @page {
      size: A4 portrait;
      margin: 0.5in;
    }
    html, body, #root, #root > div {
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    }
    body * { visibility: hidden !important; }
    .print-report, .print-report * { visibility: visible !important; }
    .print-report {
      position: static !important;
      inset: auto !important;
      display: block !important;
      width: 100% !important;
      max-width: none !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
    .print-report > div,
    .report-section {
      break-inside: auto !important;
      page-break-inside: auto !important;
      page-break-after: auto !important;
      overflow: visible !important;
    }
    .no-print { display: none !important; }
  }
`;
document.head.appendChild(css);

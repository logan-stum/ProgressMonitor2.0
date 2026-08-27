// Shared literal data used across the app: color palettes, emoji options, calendar labels,
// accommodation status config, and default minute-tracking labels.
const PALETTE=[
  {bg:"#fff0f0",border:"#ff6b6b",text:"#c0392b",chip:"#ff6b6b"},
  {bg:"#e8faf7",border:"#26c6b0",text:"#1a8a7a",chip:"#26c6b0"},
  {bg:"#eef5ff",border:"#4e9af1",text:"#2362b8",chip:"#4e9af1"},
  {bg:"#fffbec",border:"#ffd166",text:"#9a6a00",chip:"#e6a817"},
  {bg:"#f3f0ff",border:"#a78bfa",text:"#6d28d9",chip:"#a78bfa"},
  {bg:"#edfdf5",border:"#52c97a",text:"#1e7a45",chip:"#52c97a"},
];
const EMOJIS=["🌟","🎯","🚀","💡","🎓","🌈","⚡","🦋","🔥","🏆"];
const EMOJI_OPTIONS=[
  "😀","😁","😂","😃","😄","😅","😆","😉","😊","🙂","🙃","😌","😍","🥰","😎","🤩","😇","🤪","😬","🤭","😮","😴","🤓","😺","😸","😹","😻","😼","😽","🙀","😿","😾","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦄","🐝","🦋","🌼","🌻","🌞","🌙","⭐","🌟","✨","⚡","🔥","💫","🌈","🌍","🌱","🌿","☀️","🌤️","🌊","🚀","🛸","🚁","✈️","🚗","🏠","🏫","🎒","🎓","📚","✏️","📝","🧠","🎯","🏆","🥇","🥈","🥉","🎉","🎊","🎁","🎨","🧩","🎵","🎶","🎮","🧸","🍎","🍉","🍓","🍇","🍒","🥕","🌮","🍔","🍕","🍦","☕","🍵","💡","🔍","✅","❌","⚠️","💯","🔒","🔑","🛠️","⏱️","📅","⏰","💙","💚","💛","💜","💖","❤️","🧡","🙌","👏","👋","🤝","🧑‍🏫","👩‍🏫","👨‍🏫","👦","👧","🧒","🧑","👨","👩","🦄","🐙","🐠","🌸","💐","🌹","🌷","🪴","☘️","🍀","⚽","🏀","🎾","🏈","🏐","🎲","🎳","🏓","🎻","🎺","🎹","🎼","🥁" ];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DOT_COLORS={given:"#52c97a",refused:"#ff6b6b",not_given:"#c8c8d8",absent:"#a78bfa",na:"#4e9af1"};
const STATUS_CONFIG={
  given:    {label:"Given",    icon:"✓",color:"#52c97a",bg:"#edfdf5",border:"#52c97a"},
  refused:  {label:"Refused",  icon:"✗",color:"#ff6b6b",bg:"#fff0f0",border:"#ff6b6b"},
  not_given:{label:"Not Given",icon:"—",color:"#9898b0",bg:"#f4f4f8",border:"#c8c8d8"},
  absent:   {label:"Absent",   icon:"☁",color:"#a78bfa",bg:"#f3f0ff",border:"#a78bfa"},
  na:       {label:"N/A",      icon:"⊘",color:"#4e9af1",bg:"#eef5ff",border:"#4e9af1"},
};
const ATTENDANCE_STATUS={
  attended: {label:"Attended", icon:"✓",color:"#52c97a",bg:"#edfdf5",border:"#52c97a"},
  late:     {label:"Late",     icon:"⏰",color:"#ffd166",bg:"#fffbec",border:"#e6a817"},
  absent:   {label:"Absent",   icon:"✗",color:"#ff6b6b",bg:"#fff0f0",border:"#ff6b6b"},
};
const DEFAULT_MINUTE_OPTIONS=[
  {id:"reading",label:"Reading"},
  {id:"math",label:"Math"},
  {id:"writing",label:"Writing"},
  {id:"speech",label:"Speech"},
];

export { PALETTE, EMOJIS, EMOJI_OPTIONS, MONTHS, DAYS, DOT_COLORS, STATUS_CONFIG, ATTENDANCE_STATUS, DEFAULT_MINUTE_OPTIONS };

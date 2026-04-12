import fs from "fs";

const path = "public/silabus/index.html";
let html = fs.readFileSync(path, "utf8");

if (html.includes("MOBILE-RESPONSIVE")) {
  console.log("Already has mobile CSS");
  process.exit(0);
}

const mobileCSS = `
/* MOBILE-RESPONSIVE */
@media(max-width:768px){
  .app{padding:1rem 0.75rem 5rem}
  .topbar{gap:8px;margin-bottom:1.25rem}
  .logo{font-size:16px}
  .topbar-right{width:100%;justify-content:flex-end}
  .btn-icon{padding:5px 8px;font-size:12px}
  .lang-dropdown{width:calc(100vw - 2rem);right:-60px;max-height:70vh}
  .cur-header{margin-bottom:1rem}
  .cur-title{gap:8px}
  .cur-flag{font-size:24px}
  .cur-name{font-size:18px}
  .cur-desc{font-size:12px}
  .cur-stats{gap:4px}
  .stat-chip{font-size:10px;padding:3px 8px}
  .level-tabs{gap:4px;margin-bottom:1rem}
  .level-tab{padding:6px 10px;font-size:12px}
  .sublevel-row{gap:4px;margin-bottom:1rem}
  .sub-btn{padding:5px 10px;font-size:11px}
  .meta-bar{gap:4px;margin-bottom:1rem}
  .meta-chip{font-size:10px;padding:3px 7px}
  .sessions-grid{grid-template-columns:1fr;gap:8px}
  .session-card{padding:12px}
  .session-num{font-size:10px}
  .session-title{font-size:13px}
  .tag{font-size:10px;padding:1px 6px}
  .detail-panel{padding:1rem;margin-top:4px}
  .dp-title{font-size:14px}
  .dp-num{font-size:11px}
  .dp-label{font-size:10px}
  .dp-content{font-size:13px}
  .dp-list li{font-size:12px}
  .dp-objectives{padding:10px}
  .dp-row{flex-direction:column;gap:4px}
  .dp-row-label{min-width:auto}
  .vocab-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:4px}
  .vocab-pill{padding:4px 7px;font-size:11px}
  .vocab-native{font-size:10px}
  .grammar-box{padding:8px 10px}
  .grammar-box .grammar-rule{font-size:12px}
  .copyright{font-size:9px;right:8px;bottom:6px}
  .scroll-top{width:32px;height:32px;font-size:14px;bottom:36px;right:8px}
}
@media(max-width:380px){
  .app{padding:0.75rem 0.5rem 4.5rem}
  .logo{font-size:14px}
  .level-tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .level-tabs::-webkit-scrollbar{display:none}
  .level-tab{white-space:nowrap;flex-shrink:0}
  .sublevel-row{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .sublevel-row::-webkit-scrollbar{display:none}
  .sub-btn{white-space:nowrap;flex-shrink:0}
  .lang-dropdown{right:-20px;width:calc(100vw - 1rem)}
}
`;

html = html.replace("</style>", mobileCSS + "\n</style>");
fs.writeFileSync(path, html);
console.log("Mobile responsive CSS added!");
console.log("Run: git add -A && git commit -m 'add mobile responsive silabus' && git push");

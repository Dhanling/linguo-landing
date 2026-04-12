import fs from "fs";

const path = "public/silabus/index.html";
let html = fs.readFileSync(path, "utf8");

// ── 1. Add mobile responsive CSS ──
if (!html.includes("MOBILE-RESPONSIVE")) {
  const mobileCSS = `
/* MOBILE-RESPONSIVE */
@media(max-width:768px){
  .app{padding:1rem 0.75rem 5rem}
  .topbar{gap:6px;margin-bottom:1rem;flex-direction:column;align-items:flex-start}
  .logo{font-size:15px}
  .topbar-right{width:100%;justify-content:flex-start;gap:6px}
  .btn-icon{padding:5px 8px;font-size:11px}
  .lang-dropdown{position:fixed;top:auto;bottom:0;left:0;right:0;width:100%;border-radius:16px 16px 0 0;max-height:75vh;padding:16px}
  .lang-search{font-size:14px;padding:10px 12px}
  .lang-item{padding:10px 8px}
  .cur-header{margin-bottom:1rem}
  .cur-title{gap:8px}
  .cur-flag{font-size:22px}
  .cur-name{font-size:17px}
  .cur-desc{font-size:12px}
  .cur-stats{gap:4px}
  .stat-chip{font-size:10px;padding:3px 7px}
  .level-tabs{gap:4px;margin-bottom:0.75rem;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px}
  .level-tabs::-webkit-scrollbar{display:none}
  .level-tab{padding:6px 10px;font-size:11px;white-space:nowrap;flex-shrink:0}
  .sublevel-row{gap:4px;margin-bottom:0.75rem;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px}
  .sublevel-row::-webkit-scrollbar{display:none}
  .sub-btn{padding:5px 10px;font-size:11px;white-space:nowrap;flex-shrink:0}
  .meta-bar{gap:4px;margin-bottom:0.75rem}
  .meta-chip{font-size:10px;padding:3px 7px}
  .sessions-grid{grid-template-columns:1fr;gap:8px}
  .session-card{padding:12px}
  .session-num{font-size:10px}
  .session-title{font-size:13px;margin-bottom:4px}
  .tag{font-size:10px;padding:1px 6px}
  .detail-panel{padding:1rem;margin-top:4px}
  .dp-header{flex-direction:row;gap:0.5rem}
  .dp-title{font-size:14px}
  .dp-num{font-size:10px}
  .dp-label{font-size:10px}
  .dp-content{font-size:12px;line-height:1.6}
  .dp-list li{font-size:11px}
  .dp-objectives{padding:10px}
  .dp-row{flex-direction:column;gap:4px}
  .dp-row-label{min-width:auto;font-size:11px}
  .dp-row-val{font-size:11px}
  .vocab-grid{grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:4px}
  .vocab-pill{padding:4px 7px;font-size:11px}
  .vocab-native{font-size:9px}
  .grammar-box{padding:8px 10px}
  .grammar-box .grammar-rule{font-size:11px;line-height:1.6}
  .copyright{font-size:9px;right:8px;bottom:6px}
  .scroll-top{width:32px;height:32px;font-size:14px;bottom:36px;right:8px}
  .share-btn{font-size:10px!important;padding:3px 8px!important}
}
`;
  html = html.replace("</style>", mobileCSS + "\n</style>");
  console.log("Added mobile responsive CSS");
}

// ── 2. Add URL parameter support + share button ──
if (!html.includes("SHARE-FEATURE")) {
  const shareCode = `
// SHARE-FEATURE: read ?lang= parameter and add share button
(function(){
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang');
  if (langParam) {
    const found = LANGUAGES.find(l => l.id === langParam || l.name.toLowerCase() === langParam.toLowerCase() || (l.label_id||'').toLowerCase() === langParam.toLowerCase());
    if (found) {
      curLangId = found.id;
      curLevel = 'A1';
      curSublevel = Object.keys(getCurriculum().levels['A1']||{})[0]||'A1.1';
      curSession = null;
      render();
    }
  }
})();

// Share button in header
function getShareURL() {
  return window.location.origin + '/silabus?lang=' + curLangId;
}
function copyShareLink() {
  const url = getShareURL();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('shareBtn');
    btn.textContent = '✅ Link disalin!';
    setTimeout(() => { btn.textContent = '🔗 Share Link'; }, 2000);
  });
}

// Inject share button after render
const origRender = render;
render = function() {
  origRender();
  const topRight = document.querySelector('.topbar-right');
  if (topRight && !document.getElementById('shareBtn')) {
    const btn = document.createElement('button');
    btn.id = 'shareBtn';
    btn.className = 'btn-icon share-btn';
    btn.textContent = '🔗 Share Link';
    btn.onclick = copyShareLink;
    btn.style.cssText = 'font-size:11px;padding:5px 10px;cursor:pointer';
    topRight.insertBefore(btn, topRight.firstChild);
  }
};
render();
`;
  html = html.replace("</script>", shareCode + "\n</script>");
  console.log("Added share URL feature");
}

fs.writeFileSync(path, html);
console.log("\\nDone! Run: git add -A && git commit -m 'silabus mobile responsive + share link' && git push");

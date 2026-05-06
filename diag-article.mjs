import { readFileSync } from "fs";
const FILE = "./src/app/blog/[slug]/ArticleContent.tsx";
const lines = readFileSync(FILE, "utf8").split("\n");
const total = lines.length;
console.log("Total lines:", total);
console.log("\n── Lines 1080-1095 ────────────────────");
lines.slice(1079, 1095).forEach((l, i) => console.log(1080+i, JSON.stringify(l)));
console.log("\n── Lines around last } ─────────────────");
lines.slice(Math.max(0, total-10)).forEach((l, i) => console.log(total-9+i, JSON.stringify(l)));

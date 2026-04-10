import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/onboarding/[token]/page.tsx", "utf8");

// Find and remove the SECOND SearchDropdown function (the duplicate one that's outside component)
// Keep only the first one that's inside the file properly

// Count occurrences
const count = (code.match(/function SearchDropdown/g) || []).length;
console.log(`Found ${count} SearchDropdown definitions`);

if (count > 1) {
  // Find the second occurrence and remove it (up to the closing })
  const firstIdx = code.indexOf("function SearchDropdown");
  const secondIdx = code.indexOf("function SearchDropdown", firstIdx + 1);
  
  if (secondIdx !== -1) {
    // Find the end of the second function - look for the closing } at the right nesting level
    let braceCount = 0;
    let endIdx = secondIdx;
    let started = false;
    for (let i = secondIdx; i < code.length; i++) {
      if (code[i] === '{') { braceCount++; started = true; }
      if (code[i] === '}') { braceCount--; }
      if (started && braceCount === 0) { endIdx = i + 1; break; }
    }
    
    // Remove the second function
    code = code.substring(0, secondIdx) + code.substring(endIdx);
    console.log("✅ Removed duplicate SearchDropdown");
  }
}

// Also make sure useState import exists at top
if (!code.includes('import { useState')) {
  code = code.replace('"use client";', '"use client";\nimport { useState } from "react";');
}

writeFileSync("src/app/onboarding/[token]/page.tsx", code);
console.log("✅ Fixed and saved!");

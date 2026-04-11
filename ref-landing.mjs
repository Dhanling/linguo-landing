import { readFileSync, writeFileSync } from "fs";

const FILE = "src/app/page.tsx";
let code = readFileSync(FILE, "utf-8");

// 1. Update saveLead to accept referral_source
code = code.replace(
  `async function saveLead(data: {wa_number:string; language?:string; name?:string; email?:string; program?:string; level?:string}) {
  try {
    await fetch(\`\${SUPABASE_URL}/rest/v1/leads\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: \`Bearer \${SUPABASE_KEY}\` },
      body: JSON.stringify({ ...data, source: "landing-page" }),
    });
  } catch (e) { console.error("Lead save failed:", e); }
}`,
  `async function saveLead(data: {wa_number:string; language?:string; name?:string; email?:string; program?:string; level?:string; referral_source?:string}) {
  try {
    // Get referral from URL or localStorage
    const ref = new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("linguo_ref") || undefined;
    if (ref) localStorage.setItem("linguo_ref", ref);
    await fetch(\`\${SUPABASE_URL}/rest/v1/leads\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: \`Bearer \${SUPABASE_KEY}\` },
      body: JSON.stringify({ ...data, source: "landing-page", referral_source: data.referral_source || ref || null }),
    });
  } catch (e) { console.error("Lead save failed:", e); }
}`
);

// 2. In Home() component, save ref param to localStorage on mount
code = code.replace(
  `useEffect(()=>{window.scrollTo(0,0);const fn=()=>setSt(window.scrollY>400);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);`,
  `useEffect(()=>{
    window.scrollTo(0,0);
    const fn=()=>setSt(window.scrollY>400);window.addEventListener("scroll",fn);
    // Save referral param
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("linguo_ref", ref);
    return()=>window.removeEventListener("scroll",fn);
  },[]);`
);

// 3. In FunnelModal handleFinal, pass referral_source to create-invoice API
code = code.replace(
  `body: JSON.stringify({ name: formName, email: formEmail, wa_number: fullNum, language: selLang, program: productKey.split("-")[0], level: selLevel, productKey }),`,
  `body: JSON.stringify({ name: formName, email: formEmail, wa_number: fullNum, language: selLang, program: productKey.split("-")[0], level: selLevel, productKey, referral_source: localStorage.getItem("linguo_ref") || undefined }),`
);

writeFileSync(FILE, code);
console.log("✅ Referral tracking added! Links: linguo.id/?ref=handlename");

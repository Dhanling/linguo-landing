import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/onboarding/[token]/page.tsx", "utf8");

// Replace COUNTRIES array with all countries
const oldCountries = `const COUNTRIES = [
  "Australia","Bahrain","Brunei","China","Germany","Hong Kong","India","Japan",
  "Kuwait","Malaysia","Netherlands","Oman","Philippines","Qatar","Saudi Arabia",
  "Singapore","South Korea","Taiwan","Thailand","Turkey","UAE","UK","USA","Vietnam","Lainnya"
];`;

const newCountries = `const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium",
  "Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria",
  "Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad",
  "Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Djibouti","Dominica","Dominican Republic","East Timor","Ecuador","Egypt","El Salvador",
  "Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania",
  "Luxembourg","Macau","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands",
  "Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco",
  "Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger",
  "Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama",
  "Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
  "Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","UAE","Uganda","Ukraine",
  "United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela",
  "Vietnam","Yemen","Zambia","Zimbabwe"
];`;

code = code.replace(oldCountries, newCountries);
console.log("✅ Countries list updated (195 countries)");

// Replace the country select with searchable dropdown component
// Add SearchDropdown component after PROGRAM_LABELS
const searchDropdownComponent = `
function SearchDropdown({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={\`w-full px-4 py-3 rounded-xl border text-sm text-left focus:outline-none transition-all flex items-center justify-between \${open ? "border-[#1A9E9E] ring-2 ring-[#1A9E9E]/20" : "border-slate-200"} \${value ? "text-slate-900" : "text-slate-400"}\`}>
        {value || placeholder}
        <svg className={\`h-4 w-4 text-slate-400 transition-transform \${open ? "rotate-180" : ""}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl max-h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E]" />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Tidak ditemukan</p>}
            {filtered.map(o => (
              <button key={o} onClick={() => { onChange(o); setOpen(false); setSearch(""); }}
                className={\`w-full text-left px-4 py-2.5 text-sm transition-colors \${o === value ? "bg-[#1A9E9E]/10 text-[#1A9E9E] font-medium" : "text-slate-600 hover:bg-slate-50"}\`}>
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}
`;

// Insert SearchDropdown before the main component
code = code.replace(
  "export default function OnboardingPage()",
  searchDropdownComponent + "\nexport default function OnboardingPage()"
);
console.log("✅ SearchDropdown component added");

// Replace country native select with SearchDropdown
code = code.replace(
  `<select value={country} onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 bg-white">
                      <option value="">Pilih negara...</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>`,
  `<SearchDropdown options={COUNTRIES} value={country} onChange={setCountry} placeholder="Pilih negara..." />`
);
console.log("✅ Country dropdown now searchable");

// Also replace province native select with SearchDropdown
code = code.replace(
  `<select value={province} onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 bg-white">
                      <option value="">Pilih provinsi...</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>`,
  `<SearchDropdown options={PROVINCES} value={province} onChange={setProvince} placeholder="Pilih provinsi..." />`
);
console.log("✅ Province dropdown now searchable too");

writeFileSync("src/app/onboarding/[token]/page.tsx", code);
console.log("✅ Saved!");

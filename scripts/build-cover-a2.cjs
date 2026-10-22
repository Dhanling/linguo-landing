/* Membuat ilustrasi SVG asli per sesi; teks tetap berasal dari materi silabus. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');
const [landing, dashboard] = process.argv.slice(2);
if (!landing || !dashboard) throw new Error('Pakai: node scripts/build-cover-a2.cjs <landing> <dashboard>');
const LANGUAGES = {
  japanese: ['Jepang', 'pagoda', '#F2A391', '#263A4A', '#FFD2AE'],
  korean: ['Korea', 'palace', '#B1A3D8', '#263443', '#F6CEB4'],
  french: ['Prancis', 'tower', '#F0A09C', '#49382E', '#F8D2B9'],
  arabic: ['Arab', 'arches', '#E7B966', '#302B2F', '#DFA978'],
  hebrew: ['Ibrani', 'terrace', '#8BAFD5', '#45332B', '#EDBD98'],
  persian: ['Persia', 'arches', '#ACA0D8', '#302D37', '#E8B48F'],
  javanese: ['Jawa', 'joglo', '#D7A66D', '#292E33', '#BB805E'],
  sundanese: ['Sunda', 'cottage', '#A6BC77', '#2C3035', '#CF9772'],
  bipa: ['BIPA', 'monument', '#EC9C82', '#35303A', '#BF8E6E'],
  georgian: ['Georgia', 'terrace', '#D6A183', '#3B3031', '#EBC29F'],
  greek: ['Yunani', 'island', '#8AB9DC', '#44352E', '#EBC09C'],
  russian: ['Rusia', 'dome', '#C8A0CE', '#5A3C2F', '#F7D2B7'],
  swedish: ['Swedia', 'town', '#E9BF69', '#AF7942', '#F6D1B7'],
  norwegian: ['Norwegia', 'fjord', '#95AECB', '#6F4832', '#F1C7AB'],
  danish: ['Denmark', 'town', '#E9A18F', '#8F603A', '#F3CAB0'],
  finnish: ['Finlandia', 'forest', '#9FBFA3', '#A87A48', '#F3D2B7'],
  polish: ['Polandia', 'town', '#DAA0B1', '#60432E', '#F2CCB0'],
  hungarian: ['Hungaria', 'bridge', '#D9B17D', '#523B2C', '#EAC29E'],
  romanian: ['Rumania', 'cottage', '#ABA9D1', '#50352C', '#EAC09E'],
  turkish: ['Turki', 'dome', '#DDA17D', '#3A2C2D', '#DFAE88'],
  bulgarian: ['Bulgaria', 'cottage', '#C1B283', '#49322C', '#E8BC9A'],
  ukrainian: ['Ukraina', 'town', '#E8BF68', '#7F5431', '#F1CAAC'],
  icelandic: ['Islandia', 'fjord', '#A2B8D4', '#93643D', '#F0C9AF'],
};
const cache = new Map();
function readTS(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} }; cache.set(file, mod.exports);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', js)((name) => {
    if (!name.startsWith('.')) throw new Error(`Import tidak didukung: ${name}`);
    return readTS(path.resolve(path.dirname(file), name + '.ts'));
  }, mod, mod.exports);
  cache.set(file, mod.exports); return mod.exports;
}
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rect = (x,y,w,h,fill,r=12,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circle = (x,y,r,fill,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const line = (x,y,x2,y2,stroke='#36545B',width=8) => `<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
const p = (d,fill,extra='') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const group = (x,y,scale,body) => `<g transform="translate(${x} ${y}) scale(${scale})">${body}</g>`;
const TEAL = '#1A9E9E', INK = '#244A53', CREAM = '#FFF5E2';

// Fenotipe dan busana sehari-hari bervariasi; setiap bahasa mempunyai pasangan tetap.
function character({skin,hair,shirt,accent,long=false,pose=0,flip=false}) {
  const body = `<ellipse cx="0" cy="286" rx="76" ry="12" fill="#163F49" opacity=".12"/>`+
    (long ? p('M-62 30Q-85-52 0-64Q85-52 62 102L-66 105Z',hair) : '')+
    p('M-38 169L-42 252Q-34 267-10 258L0 194L13 259Q35 268 43 252L36 169Z','#4A6982')+
    rect(-50,250,43,26,CREAM,11)+rect(8,250,43,26,CREAM,11)+line(-43,274,-13,274,INK,5)+line(15,274,45,274,INK,5)+
    p('M-41 85Q0 68 41 85L49 180Q0 195-49 180Z',shirt)+
    p('M-15 79L0 98L15 79Z',accent)+
    p('M-42 94Q-71 118-63 154L-46 151L-25 109Z',shirt)+
    (pose%3===0 ? p('M40 96Q61 116 74 95L83 70', 'none', `stroke="${shirt}" stroke-width="23" stroke-linecap="round"`)+circle(84,64,12,skin)+line(84,58,81,44,skin,7)+line(91,60,96,48,skin,7) : pose%3===1 ? p('M38 99Q72 136 20 149','none',`stroke="${shirt}" stroke-width="24" stroke-linecap="round"`)+circle(17,149,12,skin) : p('M39 101Q69 104 76 127','none',`stroke="${shirt}" stroke-width="24" stroke-linecap="round"`)+circle(80,130,12,skin))+
    circle(-55,156,12,skin)+rect(-13,57,26,31,skin,10)+
    circle(-53,17,13,skin)+circle(53,17,13,skin)+
    p('M-55-12Q-61-62 0-64Q60-63 55-12L53 27Q48 74 0 76Q-48 74-53 27Z',skin)+
    p('M-57-2Q-69-48-27-63Q-6-82 22-65Q67-63 60-6L45 8Q48-26 22-29Q3-8-28-22Q-43-8-44 13Z',hair)+
    (long ? p('M44 12Q66 48 53 94Q83 70 61 9Z',hair)+p('M-45 13Q-59 46-50 85Q-79 70-61 9Z',hair) : p('M-37-53Q-51-76-17-70Q-18-90 8-72Q31-83 38-56Z',hair))+
    `<ellipse cx="-21" cy="22" rx="10" ry="13" fill="${INK}"/><ellipse cx="21" cy="22" rx="10" ry="13" fill="${INK}"/>`+
    circle(-18,18,3.5,'#fff')+circle(24,18,3.5,'#fff')+
    `<ellipse cx="-35" cy="41" rx="12" ry="6" fill="#E88F80" opacity=".6"/><ellipse cx="35" cy="41" rx="12" ry="6" fill="#E88F80" opacity=".6"/>`+
    p('M-13 47Q0 61 13 47Q8 69-3 63Q-11 61-13 47Z',INK)+p('M-7 58Q1 53 9 58Q2 66-7 58Z','#EC9A8A');
  return `<g${flip?' transform="scale(-1 1)"':''}>${body}</g>`;
}
function plant(x,y,s=1) { return group(x,y,s,rect(-22,-7,44,48,'#E4B58C',9)+p('M0-5Q-57-36-31-70Q7-54 0-5','#70B0A0')+p('M2-16Q52-63 32-93Q-4-71 2-16','#3F998F')+line(0,0,2,-48,'#38857E',4)); }
function book(color=TEAL) { return p('M-74-48Q-30-64 0-45Q31-64 74-48L74 41Q31 27 0 47Q-33 27-74 41Z',color)+p('M-64-39Q-28-50-5-34L-5 32Q-33 18-64 29Z',CREAM)+p('M5-34Q30-50 64-39L64 29Q31 18 5 32Z','#FFFDF4')+line(0,-36,0,39,'#73BDB5',3); }
function bubble(x,y,color=CREAM,shape=0) { return group(x,y,1,p('M-54-35H48Q66-35 66-17V16Q66 32 48 32H-11L-35 51L-31 32H-54Q-70 32-70 14V-16Q-70-35-54-35Z',color)+(shape===0?circle(-27,-1,6,TEAL)+circle(-2,-1,6,TEAL)+circle(23,-1,6,TEAL):p('M-24-2L-5 15L29-18','none',`stroke="${TEAL}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`))); }
function themeOf(title, topics) {
  const t=title.toLowerCase();
  const rules=[
    ['review',/review|recap|ulasan|rangkuman|evaluasi|kuis|quiz|proyek|project|ujian|assessment|refleksi|konsolidasi/],
    ['writing',/hiragana|katakana|hangul|hanja|kanji|alfabet|abjad|alphabet|huruf|aksara|tulis|writing|ejaan|spelling|cyril|kirill|vokal|konsonan|fonetik|pelafalan|pronuncia|bunyi|intonasi|nada|phon|hangeul/],
    ['food',/makan|food|restoran|restaurant|masak|kuliner|cuisine|minum|drink|kopi|coffee|\btea\b|\bteh\b|dapur|sarapan|lunch|dinner|café|cafe|bakery/],
    ['family',/keluarga|family|kerabat|orang tua|pernikahan|nikah|marriage|wedding/],
    ['travel',/travel|wisata|liburan|holiday|vacation|perjalanan|bandara|airport|paspor|passport|hotel|penginapan|turis|tourism|jalan.jalan/],
    ['transport',/transport|kereta|train|\bbus\b|taksi|taxi|kendaraan|pesawat|flight|metro/],
    ['town',/arah|direction|lokasi|location|alamat|address|kota|city|tempat umum|negara|country|kebangsaan|national|asal.usul/],
    ['shopping',/belanja|shopping|harga|price|uang|money|pasar|market|beli|jual|toko|store|currency|mata uang|tawar/],
    ['clothes',/pakaian|clothes|clothing|fashion|warna|color|colour|baju|berpakaian|busana/],
    ['health',/kesehatan|health|sakit|dokter|doctor|rumah sakit|hospital|tubuh|body|apotek|medicine|obat|medis/],
    ['sport',/olahraga|sport|fitness|sepak bola|football|berenang|swim|hiking|mendaki|yoga/],
    ['music',/musik|music|lagu|song|menyanyi|singing|tarian|tari|dance/],
    ['art',/film|cinema|movie|seni|\bart\b|museum|lukis|painting|teater|theatre|drama/],
    ['nature',/cuaca|weather|musim|season|alam|nature|lingkungan|environment|hewan|animal|binatang|flora|fauna|gunung|mountain/],
    ['home',/rumah|home|house|kamar|room|furniture|perabot|apartemen|tinggal/],
    ['work',/kerja|work|profesi|profession|job|office|kantor|bisnis|business|karier|career|rapat|meeting/],
    ['school',/sekolah|school|kampus|universit|pendidikan|education|kelas|classroom/],
    ['time',/waktu|\btime\b|\bjam\b|clock|hari|days|bulan|month|tanggal|\bdate\b|kalender|calendar|tahun|year|jadwal|schedule|rutin|routine|rutinitas/],
    ['numbers',/angka|number|hitung|count|bilangan|numeral|kuantitas|quantity/],
    ['technology',/teknologi|technology|internet|digital|email|e-mail|telepon|phone|media sosial|komputer|computer|aplikasi/],
    ['culture',/budaya|cultur|tradisi|tradition|festival|sejarah|history|sastra|literatur|cerita rakyat|folklore|mitologi|mitolog|heritage/],
    ['greetings',/salam|greet|sapaan|perkenalan|introduc|identitas|identity|nama|name|terima kasih|thanks|kesopanan|politeness|hormat/],
    ['feelings',/perasaan|feeling|emosi|emotion|suka|like|prefer|hobi|hobb|keinginan|want|harapan|hope|cita.cita|impian|dream|opini|opinion/],
    ['story',/past|lampau|pengalaman|experience|narrat|cerita|story|kisah|biografi/],
    ['planning',/future|depan|rencana|plan|intensi|intention|janji|appointment/],
  ];
  for (const [theme,re] of rules) if(re.test(t)) return theme;
  return 'conversation';
}
function prop(theme, accent, variant) {
  const stroke=`stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
  switch(theme) {
    case 'writing': return rect(-100,-110,200,174,'#E8D5AE',17)+rect(-87,-97,174,145,CREAM,8)+p('M-52-45Q-27-79-3-44T47-45M-51-5Q-25-36-3-5T48-5','none',`stroke="${TEAL}" stroke-width="9" stroke-linecap="round"`)+group(87,-6,-.8,p('M-8-78H8V41L0 61L-8 41Z',accent)+p('M-8-78Q0-93 8-78Z','#EAC19D'));
    case 'food': return `<ellipse cy="39" rx="119" ry="25" fill="#B6DDD3"/><ellipse cy="32" rx="101" ry="26" fill="${CREAM}"/>`+p('M-80-25H80Q70 51 0 51Q-70 51-80-25Z',TEAL)+`<ellipse cy="-25" rx="80" ry="22" fill="${CREAM}"/><ellipse cy="-22" rx="66" ry="14" fill="#EDBD77"/>`+circle(-24,-26,13,'#F0A082')+circle(14,-20,12,'#80AC79')+p('M-28-64Q-47-83-26-103M7-66Q-13-89 9-111M43-64Q24-85 46-105','none','stroke="#F9E7C6" stroke-width="7" stroke-linecap="round"')+line(67,-47,107,-112,INK,6);
    case 'family': return rect(-108,-130,216,188,accent,14)+rect(-94,-116,188,160,CREAM,8)+circle(-43,-57,27,'#D7A781')+circle(40,-57,27,'#F2C4A3')+p('M-80 15Q-80-35-43-35Q-8-35-8 15Z',TEAL)+p('M6 15Q6-35 40-35Q77-35 77 15Z','#E7AD76')+circle(0,-6,24,'#ECC49F')+p('M-34 43Q-34 14 0 14Q34 14 34 43Z',accent)+p('M-55-64Q-56-98-31-74M21-62Q20-94 53-75','none',`stroke="${INK}" stroke-width="14" stroke-linecap="round"`);
    case 'travel': return rect(-83,-77,166,141,TEAL,24)+rect(-28,-108,56,35,'none',8,`stroke="${INK}" stroke-width="9"`)+rect(-68,-62,136,104,'#60B6AD',13)+line(-35,-62,-35,41,'#B3DAD0',8)+line(35,-62,35,41,'#B3DAD0',8)+circle(-48,69,13,INK)+circle(48,69,13,INK)+group(29,-27,.75,p('M-35-12L2-6L30-46L45-42L28 0L62 14L61 27L18 21L0 52L-13 49L-4 17L-41 5Z',CREAM));
    case 'transport': return rect(-116,-95,232,145,TEAL,30)+rect(-100,-77,93,72,'#D5F0E7',12)+rect(6,-77,93,72,'#D5F0E7',12)+line(-85,-64,-49,-24,'#fff',5)+line(22,-64,57,-24,'#fff',5)+rect(-99,13,197,17,accent,8)+circle(-72,53,23,INK)+circle(72,53,23,INK)+circle(-72,53,11,CREAM)+circle(72,53,11,CREAM);
    case 'town': return p('M-104-80L-34-108L35-78L106-107V50L35 78L-34 48L-104 76Z',CREAM)+p('M-34-108V48L35 78V-78Z','#C2DFCD')+p('M-80 22Q-34-38 7 9T83-41','none',`stroke="${accent}" stroke-width="10" stroke-linecap="round" stroke-dasharray="3 18"`)+p('M35-109Q-10-109-10-66Q-10-35 35 2Q80-35 80-66Q80-109 35-109Z',TEAL)+circle(35,-66,17,CREAM);
    case 'shopping': return p('M-86-73H86L101 65H-101Z',accent)+p('M-36-66V-102Q0-145 36-102V-66','none',`stroke="${INK}" stroke-width="11"`)+circle(-12,7,29,CREAM)+p('M-26 7L-15 20L8-5','none',`stroke="${TEAL}" stroke-width="7" stroke-linecap="round"`)+group(84,35,.65,circle(0,0,45,'#F2CC77')+circle(0,0,33,'none',`stroke="#D5A658" stroke-width="4"`));
    case 'clothes': return p('M-41-106L-96-83L-123-27L-83-7L-61-40L-61 68H61V-40L83-7L123-27L96-83L41-106Q0-64-41-106Z',accent)+p('M-41-106Q0-64 41-106','none',`stroke="${CREAM}" stroke-width="12"`)+rect(-20,-7,40,38,TEAL,9)+line(-44,55,43,55,CREAM,5);
    case 'health': return rect(-99,-78,198,144,CREAM,22)+rect(-37,-106,74,35,'none',9,`stroke="${INK}" stroke-width="9"`)+rect(-15,-49,30,85,TEAL,5)+rect(-42,-22,84,30,TEAL,5)+line(-79,50,79,50,'#C4DDD2',5);
    case 'sport': return circle(0,-11,86,CREAM)+p('M-18-38L21-38L39 0L0 26L-38-1Z',TEAL)+p('M-18-38L-44-80M21-38L48-82M39 0L83 12M0 26V74M-38-1L-81 16','none',`stroke="${TEAL}" stroke-width="7"`)+circle(93,54,21,accent);
    case 'music': return p('M-30-94V31M-30-94L75-121V1','none',`stroke="${INK}" stroke-width="15" stroke-linejoin="round"`)+`<ellipse cx="-53" cy="37" rx="34" ry="26" fill="${TEAL}" transform="rotate(-20 -53 37)"/><ellipse cx="50" cy="8" rx="34" ry="26" fill="${accent}" transform="rotate(-20 50 8)"/>`+p('M-77-95Q-107-63-88-27M101-90Q131-56 108-30','none',`stroke="${CREAM}" stroke-width="8" stroke-linecap="round"`);
    case 'art': return p('M-94-43Q-101-106-19-110Q65-113 94-61Q118-13 72 17Q37 44 22 14Q7-15-19 8Q-73 61-94-43Z',CREAM)+circle(-44,-67,15,TEAL)+circle(0,-79,15,accent)+circle(45,-59,15,'#EAA184')+circle(62,-21,14,'#92B7CD')+p('M-67 84L53-36','none',`stroke="${INK}" stroke-width="13" stroke-linecap="round"`)+p('M44-43Q62-77 81-75Q85-51 55-32Z',TEAL);
    case 'nature': return circle(60,-91,40,'#EFC977')+p('M-118 63L-24-87L77 63Z','#86B4A6')+p('M-24-87L-52-43L-22-49L-6-32L8-41Z',CREAM)+p('M-21 63L68-49L134 63Z','#B4CEB4')+p('M-112 65Q-19 13 123 69Z','#609E91')+group(-83,37,.7,plant(0,0));
    case 'home': return p('M-101-43L0-126L101-43Z',accent)+rect(-80,-43,160,112,CREAM,7)+rect(-21,0,42,69,TEAL,8)+rect(-63,-22,29,34,'#A9D9D1',5)+rect(35,-22,29,34,'#A9D9D1',5)+circle(9,39,3,CREAM)+rect(-119,69,238,10,'#D7C5A5',5);
    case 'work': return rect(-105,-100,210,133,INK,12)+rect(-94,-89,188,109,'#DBEDE2',5)+p('M-119 33H119L100 55H-100Z',TEAL)+rect(-26,36,52,9,'#83C9BE',4)+rect(-70,-57,60,11,TEAL,5)+rect(-70,-34,109,8,'#ACCDBD',4)+rect(-70,-15,88,8,'#ACCDBD',4)+circle(58,-52,22,accent);
    case 'school': return group(0,-17,1.2,book())+p('M-94-99L0-132L94-99L0-63Z',INK)+p('M-57-82V-51Q0-24 57-51V-82L0-63Z',TEAL)+line(87,-97,87,-41,accent,6)+circle(87,-34,7,accent);
    case 'time': return circle(0,-25,104,accent)+circle(0,-25,88,CREAM)+[0,90,180,270].map(a=>`<g transform="rotate(${a} 0 -25)">${line(0,-101,0,-89,INK,5)}</g>`).join('')+line(0,-25,0,-80,INK,9)+line(0,-25,49,4,TEAL,10)+circle(0,-25,9,INK)+line(-52,65,-66,85,INK,12)+line(52,65,66,85,INK,12);
    case 'numbers': return rect(-107,-105,214,177,'#D5B28A',13)+[-58,-13,32].map((y,i)=>line(-88,y,88,y,CREAM,6)+[-61,-25,12,48].map((x,j)=>circle(x+((i+variant)%2)*13,y,15,(i+j)%2?TEAL:accent)).join('')).join('')+rect(-126,68,252,13,INK,6);
    case 'technology': return rect(-65,-126,130,207,INK,20)+rect(-53,-107,106,166,'#D9EFE4',9)+rect(-24,-117,48,7,INK,3)+bubble(-1,-48,TEAL,1).replaceAll(`stroke="${TEAL}"`,`stroke="${CREAM}"`)+circle(-22,33,10,accent)+circle(17,33,10,TEAL)+circle(0,70,5,'#8DBFB3');
    case 'culture': return rect(-95,-71,190,138,CREAM,12)+p('M-115-72L0-132L115-72Z',accent)+[-63,-21,21,63].map(x=>rect(x-8,-61,16,111,TEAL,4)).join('')+rect(-110,48,220,16,accent,5)+rect(-124,65,248,14,'#D0B99A',5)+circle(0,-91,12,CREAM);
    case 'feelings': return p('M0 61Q-124-12-88-72Q-53-125 0-67Q53-125 88-72Q124-12 0 61Z',accent)+circle(-27,-31,7,INK)+circle(27,-31,7,INK)+p('M-21-5Q0 17 21-5','none',`stroke="${INK}" stroke-width="7" stroke-linecap="round"`)+circle(-45,-12,10,'#EC9C8A')+circle(45,-12,10,'#EC9C8A');
    case 'planning': return rect(-98,-101,196,171,CREAM,17)+rect(-98,-101,196,43,TEAL,14)+line(-51,-121,-51,-85,INK,9)+line(51,-121,51,-85,INK,9)+[-50,0,50].map((x,i)=>[-23,20].map(y=>rect(x-11,y-11,22,22,(i+variant)%3===0?accent:'#CCE2D4',5)).join('')).join('')+p('M-17 40L0 56L39 18','none',`stroke="${TEAL}" stroke-width="10" stroke-linecap="round"`);
    case 'review': return p('M-55-114H55L45-36Q35 4 0 8Q-35 4-45-36Z','#EBC16F')+p('M-55-92H-92Q-107-17-40-24M55-92H92Q107-17 40-24','none','stroke="#EBC16F" stroke-width="13"')+rect(-10,2,20,45,'#D8A958',4)+rect(-51,44,102,24,TEAL,7)+p('M0-89L10-67L35-64L17-46L21-21L0-33L-21-21L-17-46L-35-64L-10-67Z',CREAM);
    case 'story': return group(0,-6,1.25,book(accent))+bubble(9,-110,CREAM,1);
    case 'greetings': return bubble(-38,-58,CREAM,0)+group(55,20,.8,bubble(0,0,accent,1));
    default: return bubble(-42,-66,CREAM,0)+group(44,13,.9,bubble(0,0,accent,1))+circle(93,-94,10,'#C7E5DA');
  }
}
function landmark(kind) {
  const fill='#A5CCBF';
  switch(kind) {
    case 'tower': return p('M0-240L-70 0H-35L0-77L35 0H70Z',fill)+line(-41,-67,41,-67,'#D5E9DD',7)+line(-26,-129,26,-129,'#D5E9DD',7);
    case 'monument': return rect(-16,-173,32,173,fill,0)+p('M-16-173L0-211L16-173Z','#DCC17A')+rect(-50,-13,100,13,fill,2);
    case 'pagoda': case 'palace': return [-125,-68,-11].map((y,i)=>rect(-38-i*12,y+5,76+i*24,48,fill,0)+p(`M${-64-i*18} ${y+8}Q-29 ${y-5} 0 ${y-28}Q29 ${y-5} ${64+i*18} ${y+8}Z`,'#80AFA4')).join('');
    case 'arches': case 'dome': return rect(-90,-103,180,103,fill,4)+p('M-90-103Q-80-183 0-194Q80-183 90-103Z',fill)+p('M-26 0V-49Q0-98 26-49V0Z','#D1E5D8')+line(0,-195,0,-222,fill,6)+rect(-123,-150,15,150,fill,2)+rect(108,-150,15,150,fill,2);
    case 'joglo': return p('M-115-81L-61-107L-25-156H25L61-107L115-81Z',fill)+rect(-80,-80,160,80,fill,0)+rect(-16,-55,32,55,'#D2E8DC',4);
    case 'island': return rect(-89,-100,70,100,'#E6EBDE',4)+rect(-10,-81,103,81,'#E6EBDE',4)+p('M-89-100Q-54-172-19-100Z','#8CBBC0')+rect(-71,-63,28,40,'#93BAC1',8)+rect(23,-51,27,51,'#93BAC1',9);
    case 'fjord': return p('M-170 0L-82-185L0-54L86-211L178 0Z',fill)+p('M86-211L45-142L78-154L101-139L119-152Z','#DCEDE2')+p('M-174 0Q-83-33 0-5Q82 18 174-13V28H-174Z','#A1CECB');
    case 'forest': return [-100,-44,24,88].map((x,i)=>group(x,0,1,p(`M0 ${-140-i%2*30}L-43-40H-27L-58 0H58L27-40H43Z`,fill))).join('');
    case 'bridge': return rect(-147,-37,294,23,fill,0)+[-102,102].map(x=>rect(x-18,-156,36,156,fill,0)).join('')+p('M-100-140Q0-20 100-140','none',`stroke="${fill}" stroke-width="9"`)+[-60,-20,20,60].map(x=>line(x,-80+(Math.abs(x)/4),x,-37,fill,4)).join('');
    case 'terrace': return [-92,-27,46].map((x,i)=>rect(x,-84-i*20,61,84+i*20,fill,3)+p(`M${x-6} ${-84-i*20}L${x+30} ${-115-i*20}L${x+67} ${-84-i*20}Z`,'#84AEA1')+rect(x+22,-48-i*12,18,29,'#DCEBDE',3)).join('');
    default: return [-102,-33,36].map((x,i)=>rect(x,-90-i%2*40,61,90+i%2*40,fill,3)+p(`M${x-7} ${-90-i%2*40}L${x+30} ${-126-i%2*40}L${x+68} ${-90-i%2*40}Z`,'#8FB7AA')+rect(x+22,-48,16,28,'#E0ECE0',3)).join('');
  }
}
function render(slug, sub, session, theme, kind) {
  const [name,place,accent,hair,skin] = LANGUAGES[slug];
  const seed=Object.keys(LANGUAGES).indexOf(slug)+session.number;
  const title=kind==='cover', objectives=kind==='objectives';
  const a=character({skin,hair,shirt:TEAL,accent,long:false,pose:seed%3});
  const b=character({skin:skin,hair,shirt:accent,accent:CREAM,long:true,pose:(seed+1)%3,flip:true});
  let art;
  if(title) {
    art=`<rect width="1600" height="900" fill="#157E80"/>`+
      p('M0 448Q330 418 620 467T1600 450V900H0Z','#DDECE0')+
      group(240,689,.78,landmark(place))+group(1370,684,.86,landmark(place))+
      p('M0 710Q430 663 805 715T1600 714V900H0Z','#B9D5BD')+
      p('M410 900Q573 710 803 735Q1012 747 1190 900Z','#F7E5C9')+
      group(590,533,1.02,a)+group(1025,533,1.02,b)+group(808,696,.88,prop(theme,accent,seed))+
      plant(210,786,.8)+plant(1400,800,.85)+
      p('M56 454Q74 435 92 453Q114 419 139 449Q166 445 175 463H56Z','#D5E9DB')+
      circle(1463,440,23,'#E5C67A');
  } else if(objectives) {
    art=`<rect width="1600" height="900" fill="#F4F6EB"/>`+
      p('M995 0Q871 286 988 558Q1046 724 918 900H1600V0Z','#DEEBDA')+
      group(1370,489,.9,landmark(place))+
      p('M940 745Q1220 691 1600 744V900H919Z','#C2D9C0')+
      `<ellipse cx="1280" cy="822" rx="277" ry="32" fill="#A6C3AF" opacity=".25"/>`+
      group(1155,544,.93,a)+group(1425,565,.82,b)+group(1284,668,.77,prop(theme,accent,seed))+
      plant(1526,800,.65)+circle(1049,446,10,accent)+circle(1513,281,15,'#D4BB7C');
  } else {
    art=`<rect width="1600" height="900" fill="#EDF3E9"/>`+
      p('M0 811Q400 775 800 818T1600 808V900H0Z','#D8E8D7')+
      group(1492,842,.38,landmark(place))+plant(70,840,.55)+plant(1535,847,.45);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc"><title id="title">${esc(name)} ${esc(sub)} · ${esc(session.title)} · ${kind==='cover'?'Sampul':objectives?'Tujuan':'Latar isi'}</title><desc id="desc">Ilustrasi vector minimalis dengan dua pelajar, tema ${theme}, dan latar ${place}. Ruang teks ${title?'bagian atas':objectives?'sebelah kiri':'bagian tengah'} sengaja dikosongkan.</desc>${art}</svg>\n`;
}

const manifests=[];
for(const slug of Object.keys(LANGUAGES)) {
  const curriculum=readTS(path.join(landing,'src/data/curriculum/data',slug+'.ts')).default;
  for(const level of curriculum.levels.filter(l=>['A1','A2'].includes(l.code))) {
    for(const sub of level.sublevels) {
      const code=sub.code.toLowerCase().replaceAll('.','-');
      if(sub.sessions.length!==16) throw new Error(`${slug}-${code}: bukan 16 sesi`);
      const lessonFile=path.join(dashboard,'src/data/dekSilabus',`${slug}-${code}.ts`);
      const lessons=fs.existsSync(lessonFile)?readTS(lessonFile).default:null;
      for(const [index,s] of sub.sessions.entries()) {
        const lessonTitle=lessons?.[index+1]?.find(slide=>slide.type==='title')?.heading?.replace(/^Sesi\s+\d+\s*[·—–:-]\s*/,'');
        const visualSession={...s,title:lessonTitle||s.title};
        const theme=themeOf(visualSession.title,s.topics);
        const base=`${slug}-${code}-sesi-${index+1}`;
        for(const [kind,suffix] of [['cover','cover'],['objectives','tujuan']]) {
          const file=`${base}-${suffix}-cute-vector-v1.svg`;
          const svg=render(slug,sub.code,visualSession,theme,kind);
          for(const repo of [landing,dashboard]) {
            const dest=path.join(repo,'public/slide-cover',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,svg);
          }
        }
        manifests.push({language:slug,sublevel:sub.code,session:index+1,curriculumNumber:s.number,title:s.title,lessonTitle:lessonTitle||null,theme,cover:`/slide-cover/${base}-cover-cute-vector-v1.svg`,objectives:`/slide-cover/${base}-tujuan-cute-vector-v1.svg`});
      }
    }
  }
  const svg=render(slug,'A1–A2',{number:0,title:'Latar isi'},'conversation','background');
  for(const repo of [landing,dashboard]) fs.writeFileSync(path.join(repo,'public/slide-cover',`${slug}-a1-a2-latar-cute-vector-v1.svg`),svg);
}
for(const repo of [landing,dashboard]) {
  const dir=path.join(repo,'docs/slide-cover-a2');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({version:1,style:'SVG vector minimalis cute, latar tenang, teal #1A9E9E',languages:Object.keys(LANGUAGES),sessions:manifests},null,2)+'\n');
}
console.log(`${Object.keys(LANGUAGES).length} bahasa, ${manifests.length} sesi, ${manifests.length*2+Object.keys(LANGUAGES).length} SVG per repo.`);

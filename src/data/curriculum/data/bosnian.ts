// linguo-patch:silabus-bosnian-v1
import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

// Compact format: [number, title] or [number, title, topics[]]
type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============ A1 — 3 sublevels ============
const a1_1 = toSessions([
  [1, "Zdravo, Dobar dan — Sapaan", ["Zdravo, ćao (akrab) · Dobar dan (resmi)", "Dobro jutro, dobro veče, laku noć", "Hvala — Nema na čemu · Molim", "Doviđenja, vidimo se"]],
  [2, "Abeceda I — 30 Huruf, Satu Huruf Satu Bunyi", ["Piši kao što govoriš — tulis seperti diucapkan", "TIDAK ADA q w x y", "vokal a e i o u dibaca seperti bahasa Indonesia", "dua aksara resmi: latinica & ćirilica — kelas memakai latinica"]],
  [3, "Abeceda II — č ć š ž đ dž", ["č (keras) vs ć (lunak): čaj vs ćevapi", "dž vs đ: džamija vs đak", "š = sy, ž = zh: škola, žena", "lj & nj dihitung SATU huruf: ljubav, njegov"]],
  [4, "Naglasak & Huruf r sebagai Vokal", ["r jadi inti suku kata: prst, trg, krv, Brčko", "tekanan hampir tak pernah di suku kata terakhir", "vokal panjang vs pendek (pengenalan)", "latihan baca nama kota: Sarajevo, Mostar, Tuzla, Banja Luka"]],
  [5, "Ja sam… — Kata Kerja 'biti'", ["ja sam, ti si, on/ona/ono je", "mi smo, vi ste, oni/one/ona su", "bentuk panjang jesam, jesi, jeste — untuk jawaban & penegasan", "Ja sam Dani. Ja sam iz Indonezije."]],
  [6, "Nisam & Da li…? — Sangkal & Tanya", ["nisam, nisi, nije, nismo, niste, nisu", "Da li si student? / Jesi li student?", "jawaban pendek: Jesam. / Nisam.", "da / ne"]],
  [7, "Kako se zoveš? — Berkenalan", ["Kako se zoveš? — Zovem se…", "Drago mi je", "ti (akrab) vs Vi (sopan)", "Odakle si? — Iz Indonezije sam"]],
  [8, "Lične zamjenice — Kata Ganti", ["ja, ti, on, ona, ono, mi, vi, oni, one, ona", "kata ganti sering dibuang: Student sam", "klitik 'sam' TIDAK BOLEH di awal kalimat", "Ja sam student → Student sam"]],
  [9, "Brojevi 0–20", ["nula, jedan, dva, tri, četiri, pet … deset", "jedanaest … devetnaest (-naest), dvadeset", "membaca nomor telepon", "Koliko imaš godina? — Imam 25 godina"]],
  [10, "Rod imenica — Tiga Jenis Kata Benda", ["muški: berakhir konsonan (grad, stan)", "ženski: berakhir -a (kuća, žena)", "srednji: berakhir -o/-e (selo, more)", "pengecualian awal: tata, kolega (muški) · noć, ljubav (ženski)"]],
  [11, "Ovo je… — Kata Tunjuk", ["Ovo je… / To je… / Ono je…", "ovaj/ova/ovo — taj/ta/to — onaj/ona/ono", "Šta je ovo? — Ovo je knjiga", "Ko je to? (Bosnia: šta & ko, bukan što & tko)"]],
  [12, "Zemlje & Nacionalnosti", ["Bosna i Hercegovina, Indonezija, Turska, Njemačka", "Bosanac/Bosanka · Indonežanin/Indonežanka", "Govorim bosanski / indonezijski / engleski", "Bošnjak ≠ Bosanac: etnis vs warga negara"]],
  [13, "Zanimanja — Pekerjaan", ["učitelj/učiteljica, doktor/doktorica, inženjer, student/studentica", "Šta si po zanimanju?", "Radim kao…", "bentuk perempuan -ica / -kinja"]],
  [14, "Pridjevi — Kata Sifat Ikut Jenis", ["dobar, dobra, dobro", "velik/mali, nov/star, lijep/ružan", "kata sifat di DEPAN kata benda: lijepa kuća", "'a' yang hilang: dobar → dobra"]],
  [15, "Porodica — Keluarga", ["majka/mama, otac/tata, brat, sestra", "sin, kćerka, djed, nana", "moj, moja, moje — tvoj, tvoja, tvoje", "amidža, daidža, tetka — istilah keluarga serapan Turki"]],
  [16, "Review & Mini-Project — Predstavljam se", ["perkenalan diri 60 detik (audio)", "nama, asal, pekerjaan, keluarga", "cek pelafalan č/ć & dž/đ", "kosakata ±80 kata"]],
]);

const a1_2 = toSessions([
  [1, "Prezent I — Kata Kerja -ati", ["čitam, čitaš, čita, čitamo, čitate, čitaju", "gledati, slušati, pitati, imati", "pola akhiran -am", "Šta čitaš? — Čitam knjigu."]],
  [2, "Prezent II — Kata Kerja -iti / -jeti", ["govorim, govoriš, govori, govorimo, govorite, govore", "raditi, učiti, voljeti (volim), živjeti (živim)", "pola akhiran -im, jamak -e", "Živim u Sarajevu (lokatif, pengenalan)"]],
  [3, "Prezent III — Pola -em & Tak Beraturan", ["pišem, pijem, jedem, idem", "pisati → pišem: batang kata berubah", "moći: mogu, možeš, može … mogu", "htjeti: hoću, hoćeš, hoće …"]],
  [4, "Negacija — ne + Kata Kerja", ["ne čitam, ne radim", "menyatu: nemam, neću, nisam", "ništa, niko, nikad + ne — sangkal ganda itu WAJIB", "Ne znam ništa"]],
  [5, "Imati & Nemati — Punya & Ada", ["Imam brata", "Ima li…? — Ima. / Nema.", "ima = 'ada', nema = 'tidak ada'", "nema + genitif (pengenalan): Nema problema"]],
  [6, "Akuzativ I — Objek Kalimat", ["ženski -a → -u: Pijem kafu, čitam knjigu", "muški tak bernyawa: tetap (Gledam film)", "muški bernyawa: +a (Vidim brata)", "srednji: tetap"]],
  [7, "Akuzativ II — Kata Sifat & Kata Ganti", ["dobru kafu, novog prijatelja", "me, te, ga, je/ju, nas, vas, ih", "Volim te · Vidim ga", "kata ganti pendek di posisi kedua"]],
  [8, "Kafa & Hrana", ["bosanska kafa: džezva, fildžan, rahat-lokum", "ćevapi, burek, pita, somun, baklava", "burek HANYA isi daging — sirnica, zeljanica, krompiruša", "kahva / kafa — huruf 'h' khas Bosnia"]],
  [9, "U restoranu & u aščinici — Memesan", ["Izvolite? — Želio/željela bih…", "Molim vas, jelovnik", "Račun, molim", "Prijatno! · Živjeli!"]],
  [10, "Brojevi 20–1000 & Konvertibilna Marka", ["dvadeset, trideset … sto, dvjesta, tristo, hiljada", "KM — konvertibilna marka & fening", "Koliko košta? — Košta pet maraka", "1 + nominatif · 2–4 + genitif tunggal · 5+ genitif jamak (pengenalan)"]],
  [11, "Koliko je sati? — Jam", ["Jedan je sat, dva su sata, pet je sati", "pola tri = 2.30 (!)", "i petnaest / petnaest do", "u osam sati = pukul delapan"]],
  [12, "Dani & Mjeseci", ["ponedjeljak, utorak, srijeda, četvrtak, petak, subota, nedjelja", "u ponedjeljak (sekali) vs ponedjeljkom (kebiasaan)", "januar, februar, mart … decembar (bukan siječanj dkk. ala Kroasia)", "Koji je danas dan?"]],
  [13, "Moj dan — Kata Kerja Refleksif 'se'", ["budim se, umivam se, oblačim se, vraćam se", "'se' di posisi kedua: Ja se budim / Budim se", "ustajem, doručkujem, idem na posao", "uvijek, često, ponekad, nikad"]],
  [14, "Modalni glagoli — Bisa, Harus, Mau", ["moći, morati, htjeti, smjeti, trebati", "modal + infinitif: Moram raditi", "atau da + prezent: Moram da radim — keduanya hidup di Bosnia", "Mogu li…? — minta izin"]],
  [15, "Pitanja — Kata Tanya", ["ko, šta, gdje, kada, kako, zašto, koliko", "koji/koja/koje, čiji", "Zašto? — Zato što…", "gdje (tempat) vs kuda (arah)"]],
  [16, "Review & Mini-Project — Moj dan u Sarajevu", ["cerita rutinitas 90 detik", "gabungan prezent + akuzatif + jam", "dialog memesan kafa & ćevapi", "kosakata ±130 kata"]],
]);

const a1_3 = toSessions([
  [1, "Lokativ — Gdje si?", ["u/na + lokatif: u gradu, u školi, na poslu", "muški/srednji -u, ženski -i", "Sarajevo → u Sarajevu · Bosna → u Bosni", "o + lokatif: Govorimo o filmu"]],
  [2, "U vs Na", ["u: ruang tertutup (u kući, u banci)", "na: permukaan, acara, lembaga (na stolu, na koncertu, na fakultetu, na pijaci)", "na moru, na selu, na Baščaršiji", "daftar hafalan 20 tempat"]],
  [3, "Arah vs Tempat — Akuzativ vs Lokativ", ["Idem u školu (arah) vs U školi sam (tempat)", "Kuda ideš? vs Gdje si?", "ići na posao / biti na poslu", "latihan 20 pasang"]],
  [4, "Genitiv I — iz, od, do, kod, bez", ["muški/srednji -a, ženski -e", "Iz Indonezije sam · kafa bez šećera", "kod + genitif: kod kuće, kod doktora", "od Sarajeva do Mostara"]],
  [5, "Genitiv II — Milik & Jumlah", ["knjiga moga brata, centar grada", "čaša vode, kilo hljeba, malo/puno + genitif", "nema + genitif: Nema vremena", "dva brata (2–4) vs pet dana (5+)"]],
  [6, "Grad — Tempat di Kota", ["pošta, banka, apoteka, pijaca, džamija, crkva, most, čaršija", "Gdje je…? — pravo, lijevo, desno", "blizu / daleko od + genitif", "pored, ispred, iza, između + genitif"]],
  [7, "Prevoz — Transportasi", ["tramvaj, autobus, trolejbus, taksi, voz", "idem tramvajem, autobusom (instrumental, pengenalan)", "karta u jednom smjeru / povratna karta", "Kada polazi autobus za Mostar?"]],
  [8, "Perfekt I — Masa Lampau", ["sam/si/je… + partisip -o / -la / -lo", "radio sam (lk) / radila sam (pr)", "jamak: radili, radile", "partisip ikut JENIS KELAMIN pelakunya"]],
  [9, "Perfekt II — Posisi Klitik & Bentuk Tak Beraturan", ["Ja sam radio → Radio sam", "ići → išao, išla · jesti → jeo, jela · moći → mogao, mogla", "biti → bio, bila", "sangkal: nisam radio"]],
  [10, "Perfekt III — Pertanyaan & Keterangan Waktu", ["Jesi li vidio? / Da li si vidio?", "se + je → se: Vratio se", "jučer, prošle sedmice, prije dva dana", "sedmica (Bosnia) — tjedan (Kroasia) — nedelja (Serbia)"]],
  [11, "Futur I — Masa Depan", ["ću, ćeš, će, ćemo, ćete, će + infinitif", "Ja ću raditi → Radit ću", "sangkal: neću raditi", "sutra, sljedeće sedmice, dogodine"]],
  [12, "Vrijeme & Godišnja doba — Cuaca & Musim", ["Kakvo je vrijeme? — Sunčano je, hladno je", "pada kiša / pada snijeg", "proljeće, ljeto, jesen, zima · ljeti, zimi", "Hladno mi je (datif, pengenalan)"]],
  [13, "Odjeća & Kupovina — Belanja", ["košulja, hlače, haljina, cipele, jakna", "Koji broj nosite?", "Mogu li probati?", "skupo / jeftino · popust"]],
  [14, "Sviđa mi se — Datif Pertama", ["mi, ti, mu, joj, nam, vam, im", "Sviđa mi se Sarajevo", "sviđati se vs voljeti", "Kako ti je? — Dobro mi je"]],
  [15, "Telefon & Poruke", ["Halo? Ko je? — Ovdje Dani", "Mogu li dobiti…?", "Pošalji mi poruku · Javi se!", "bahasa chat: nzm = ne znam; diakritik sering dibuang (cao, sta, nista)"]],
  [16, "Review & Mini-Project — Vikend u Mostaru", ["cerita akhir pekan 2 menit (perfekt)", "rencana minggu depan (futur)", "lokatif vs akuzatif dalam satu cerita", "kosakata ±200 kata"]],
]);

// ============ A2 — 4 sublevels ============
const a2_1 = toSessions([
  [1, "Dativ — Kome? Čemu?"],
  [2, "Dativ zamjenica — Naglašene & Nenaglašene"],
  [3, "Glagoli s dativom — pomoći, vjerovati, javiti se"],
  [4, "Instrumental I — s(a) + Društvo"],
  [5, "Instrumental II — Sredstvo bez Prijedloga"],
  [6, "Instrumental mjesta — pred, nad, pod, za, među"],
  [7, "Vokativ — Profesore! Amra! Mujo!"],
  [8, "Sedam padeža — Tabela Jednine"],
  [9, "Množina I — Nominativ & Akuzativ"],
  [10, "Množina II — Genitiv Množine & Nepostojano a"],
  [11, "Množina III — Dativ, Lokativ, Instrumental (-ima / -ama)"],
  [12, "Sibilarizacija — k g h → c z s"],
  [13, "Palatalizacija — k g h → č ž š"],
  [14, "Padeži uz Brojeve"],
  [15, "Review Akumulatif A2.1"],
  [16, "Mini-Project — Pismo prijatelju"],
]);

const a2_2 = toSessions([
  [1, "Šta je glagolski vid? — Svršeni vs Nesvršeni"],
  [2, "Parovi s Prefiksom — pisati / napisati"],
  [3, "Parovi sa Sufiksom — kupiti / kupovati"],
  [4, "Vid u Prezentu — Zašto 'napišem' Nije Sadašnjost"],
  [5, "Vid u Perfektu"],
  [6, "Vid u Futuru"],
  [7, "Vid u Imperativu"],
  [8, "Supletivni Parovi — govoriti / reći, dolaziti / doći"],
  [9, "Glagoli Kretanja — ići, doći, otići, ući, izaći"],
  [10, "Prefiksi Kretanja — do-, od-, u-, iz-, pre-, pro-"],
  [11, "Često vs Jednom — Prilozi kao Okidači Vida"],
  [12, "Tipične Greške Govornika Indonezijskog"],
  [13, "Top 50 Vidskih Parova"],
  [14, "Priča u Prošlosti — Pozadina vs Događaj"],
  [15, "Review Akumulatif A2.2"],
  [16, "Mini-Project — Šta se desilo jučer?"],
]);

const a2_3 = toSessions([
  [1, "Na aerodromu & na granici"],
  [2, "Hotel, hostel & privatni smještaj"],
  [3, "Autobuska & željeznička stanica"],
  [4, "Putokazi & orijentacija"],
  [5, "Imperativ — Dođi! Dođite! Nemoj!"],
  [6, "Kod doktora — Boli me…"],
  [7, "U apoteci"],
  [8, "Tijelo & zdravlje"],
  [9, "U banci & na pošti"],
  [10, "Iznajmljivanje stana"],
  [11, "Komparativ — veći, bolji, ljepši"],
  [12, "Superlativ — naj-"],
  [13, "Posvojne zamjenice & 'svoj'"],
  [14, "Planovi za put — Futur u praksi"],
  [15, "Review Akumulatif A2.3"],
  [16, "Mini-Project — Tura Sarajevo–Mostar–Počitelj"],
]);

const a2_4 = toSessions([
  [1, "Baščaršija & Sebilj"],
  [2, "Stari most & Mostar"],
  [3, "Ritual bosanske kafe"],
  [4, "Bosanska kuhinja — od ćevapa do tufahije"],
  [5, "Turcizmi u svakodnevnom govoru"],
  [6, "Sevdalinka — uvod"],
  [7, "Praznici — Bajram, Božić, Vaskrs"],
  [8, "Komšiluk — kultura susjedstva"],
  [9, "Sarajevo 1984 — Olimpijada"],
  [10, "Mujo i Haso — bosanski humor"],
  [11, "Geografija — Una, Neretva, Drina, Bjelašnica"],
  [12, "Dva pisma — latinica & ćirilica"],
  [13, "Bosanski, hrvatski, srpski — šta je isto, šta različito"],
  [14, "Čitanje — kratki tekstovi A2"],
  [15, "Review Akumulatif A2.4"],
  [16, "Mini-Project — Vodič kroz moj omiljeni grad"],
]);

// ============ B1 — 5 sublevels ============
const b1_1 = toSessions([
  [1, "Red klitika — li, ću, sam, mi, ga, se, je"],
  [2, "Drugo mjesto u rečenici — Wackernagelovo pravilo"],
  [3, "Da-rečenice vs infinitiv"],
  [4, "Odnosne rečenice — koji, koja, koje"],
  [5, "'Koji' u padežima"],
  [6, "Što, čiji, gdje kao odnosne riječi"],
  [7, "Uzročne rečenice — jer, zato što, pošto, budući da"],
  [8, "Vremenske rečenice — kad, dok, čim, prije nego što, nakon što"],
  [9, "Namjerne rečenice — da, kako bi"],
  [10, "Dopusne rečenice — iako, mada, premda"],
  [11, "Upravni & neupravni govor"],
  [12, "Neodređene zamjenice — neko, nešto, iko, išta, niko, ništa"],
  [13, "Futur II — Kad budem imao vremena"],
  [14, "Slaganje vremena"],
  [15, "Review Akumulatif B1.1"],
  [16, "Mini-Project — Složena priča u 12 rečenica"],
]);

const b1_2 = toSessions([
  [1, "Kondicional I — bih, bi, bi, bismo, biste, bi"],
  [2, "Uljudne molbe — Htio bih, Mogli biste…"],
  [3, "Realni uslov — ako + prezent / futur II"],
  [4, "Potencijalni uslov — kad bih…"],
  [5, "Irealni uslov — da sam…"],
  [6, "Kondicional II"],
  [7, "Želje — Da bar…, Kamo sreće…"],
  [8, "Savjeti — Trebao bi, Bolje bi bilo"],
  [9, "Trebati — lično & bezlično"],
  [10, "Pretpostavke — možda, vjerovatno, sigurno, valjda"],
  [11, "Pregovaranje & kompromis"],
  [12, "Žalbe & reklamacije"],
  [13, "Pisanje formalnog emaila"],
  [14, "Formalni telefonski razgovor"],
  [15, "Review Akumulatif B1.2"],
  [16, "Mini-Project — Šta bih uradio da…"],
]);

const b1_3 = toSessions([
  [1, "CV & biografija"],
  [2, "Razgovor za posao"],
  [3, "Radno mjesto & kolege"],
  [4, "Sastanci — izražavanje mišljenja"],
  [5, "Slaganje & neslaganje"],
  [6, "Glagolske imenice — čitanje, pisanje, učenje"],
  [7, "Pasiv I — trpni pridjev"],
  [8, "Pasiv II — se-pasiv"],
  [9, "Bezlične rečenice — Priča se…, Radi se o…"],
  [10, "Obrazovni sistem u BiH"],
  [11, "Studiranje u Sarajevu — upis & administracija"],
  [12, "Jezik šaltera — obrasci, potvrde, takse"],
  [13, "Zbirni brojevi & brojne imenice — dvoje, troje, dvojica"],
  [14, "Prezentacija — struktura & fraze"],
  [15, "Review Akumulatif B1.3"],
  [16, "Mini-Project — Prezentacija 5 minuta"],
]);

const b1_4 = toSessions([
  [1, "Vijesti — naslovi & struktura"],
  [2, "Novinski stil — nominalizacija"],
  [3, "Radio & podcast — slušanje"],
  [4, "Društvene mreže & sleng"],
  [5, "Glagolski prilog sadašnji — -ći"],
  [6, "Glagolski prilog prošli — -vši"],
  [7, "Aorist — prepoznavanje u pričama & porukama (odoh, rekoh)"],
  [8, "Imperfekt & pluskvamperfekt — pasivno prepoznavanje"],
  [9, "Politički sistem BiH — entiteti & kantoni"],
  [10, "Okoliš & priroda"],
  [11, "Dijaspora — Bosanci u svijetu"],
  [12, "Rasprava — za & protiv"],
  [13, "Pisanje komentara & osvrta"],
  [14, "Sažimanje teksta"],
  [15, "Review Akumulatif B1.4"],
  [16, "Mini-Project — Pregled sedmičnih vijesti"],
]);

const b1_5 = toSessions([
  [1, "Pripovijedanje — vremena u priči"],
  [2, "Narodne priče & bajke"],
  [3, "Nasrudin-hodža"],
  [4, "Poslovice & izreke"],
  [5, "Frazemi s dijelovima tijela"],
  [6, "Sevdalinka II — tekstovi & analiza"],
  [7, "'Emina' — Aleksa Šantić"],
  [8, "Deminutivi & augmentativi"],
  [9, "Tvorba riječi — prefiksi"],
  [10, "Tvorba riječi — sufiksi"],
  [11, "Opis osobe & karaktera"],
  [12, "Opis mjesta & atmosfere"],
  [13, "Film — 'Ničija zemlja'"],
  [14, "Pisanje kratke priče"],
  [15, "Review Akumulatif B1.5"],
  [16, "Mini-Project — Moja priča, 300 riječi"],
]);

// ============ B2 — 7 sublevels ============
const b2_1 = toSessions([
  [1, "Naglasak — četiri akcenta"],
  [2, "Dužina vokala & značenje — grad / grȁd"],
  [3, "Glasovne promjene — pregled"],
  [4, "Jotovanje"],
  [5, "Jednačenje po zvučnosti & po mjestu tvorbe"],
  [6, "Nepostojano a & prelazak l u o"],
  [7, "Refleks jata — ije / je"],
  [8, "Određeni & neodređeni vid pridjeva"],
  [9, "Deklinacija brojeva"],
  [10, "Glagolska rekcija — glagol + padež"],
  [11, "Prijedlozi s više padeža"],
  [12, "Red riječi & informacijska struktura"],
  [13, "Kongruencija — teži slučajevi"],
  [14, "Pravopis — veliko slovo, sastavljeno & rastavljeno pisanje"],
  [15, "Review Akumulatif B2.1"],
  [16, "Mini-Project — Gramatički portfolio"],
]);

const b2_2 = toSessions([
  [1, "Poslovna korespondencija"],
  [2, "Ponuda & narudžba"],
  [3, "Ugovori — osnovni pojmovi"],
  [4, "Pregovori"],
  [5, "Sastanak — vođenje & zapisnik"],
  [6, "Finansije & bankarstvo"],
  [7, "Marketing & oglašavanje"],
  [8, "Turizam & ugostiteljstvo"],
  [9, "Halal industrija & tržište BiH"],
  [10, "Poslovna kultura — kafa prije posla"],
  [11, "Administrativni stil"],
  [12, "Izvještaji & grafikoni"],
  [13, "Poslovna prezentacija"],
  [14, "Indonezija–BiH — trgovina & saradnja"],
  [15, "Review Akumulatif B2.2"],
  [16, "Mini-Project — Poslovni prijedlog"],
]);

const b2_3 = toSessions([
  [1, "Razgovorni stil — skraćivanje & redukcija vokala"],
  [2, "Sarajevski govor"],
  [3, "Sleng & žargon"],
  [4, "Turcizmi II — stilska vrijednost"],
  [5, "Bosanski vs hrvatski — leksik"],
  [6, "Bosanski vs srpski — ijekavica & ekavica"],
  [7, "Crnogorski & zajednička osnova"],
  [8, "Dijalekti — štokavski, ijekavski, ikavski"],
  [9, "Psovke & ublažavanje — šta NE reći"],
  [10, "Humor & ironija"],
  [11, "Poštapalice — ba, bolan, bona, ma, ono"],
  [12, "Slušanje — brzi govor"],
  [13, "Registri — od ulice do ureda"],
  [14, "Prevođenje kulturnih pojmova"],
  [15, "Review Akumulatif B2.3"],
  [16, "Mini-Project — Intervju s izvornim govornikom"],
]);

const b2_4 = toSessions([
  [1, "Akademski stil — obilježja"],
  [2, "Čitanje naučnog članka"],
  [3, "Sažetak & ključne riječi"],
  [4, "Citiranje & parafraziranje"],
  [5, "Argumentacija — teza, dokaz, zaključak"],
  [6, "Konektori u akademskom tekstu"],
  [7, "Pasiv & bezličnost u nauci"],
  [8, "Opis podataka — tabele & grafikoni"],
  [9, "Seminarski rad — struktura"],
  [10, "Predavanje — slušanje & bilješke"],
  [11, "Usmeno izlaganje & pitanja publike"],
  [12, "Akademska prepiska s profesorima"],
  [13, "Stipendije & motivaciono pismo"],
  [14, "Recenzija & kritički osvrt"],
  [15, "Review Akumulatif B2.4"],
  [16, "Mini-Project — Seminarski rad, 800 riječi"],
]);

const b2_5 = toSessions([
  [1, "Srednjovjekovna Bosna — Kulin ban & Povelja"],
  [2, "Stećci & bosančica"],
  [3, "Osmanski period"],
  [4, "Austro-Ugarska & 1914."],
  [5, "Jugoslavija"],
  [6, "1992–1995 — jezik sjećanja"],
  [7, "Dejtonski sporazum"],
  [8, "Arebica & alhamijado književnost"],
  [9, "Religije u BiH"],
  [10, "Međunarodni odnosi & evropski put"],
  [11, "Diplomatski jezik"],
  [12, "Javni govor"],
  [13, "Debata"],
  [14, "Analiza dokumentarnog filma"],
  [15, "Review Akumulatif B2.5"],
  [16, "Mini-Project — Esej, 500 riječi"],
]);

const b2_6 = toSessions([
  [1, "Meša Selimović — 'Derviš i smrt'"],
  [2, "Ivo Andrić — 'Na Drini ćuprija'"],
  [3, "Mak Dizdar — 'Kameni spavač'"],
  [4, "Skender Kulenović"],
  [5, "Abdulah Sidran"],
  [6, "Dževad Karahasan"],
  [7, "Aleksandar Hemon & Miljenko Jergović"],
  [8, "Savremena poezija"],
  [9, "Film — Danis Tanović"],
  [10, "Film — Jasmila Žbanić"],
  [11, "Sarajevo Film Festival"],
  [12, "Muzika — od sevdaha do Dubioze kolektiv"],
  [13, "Stilske figure"],
  [14, "Književna analiza"],
  [15, "Review Akumulatif B2.6"],
  [16, "Mini-Project — Književni osvrt, 600 riječi"],
]);

const b2_7 = toSessions([
  [1, "Format Ujian B2 (CEFR) — Gambaran Umum"],
  [2, "Čitanje — strategije"],
  [3, "Slušanje — strategije"],
  [4, "Pisanje — Zadatak 1 (formalno pismo)"],
  [5, "Pisanje — Zadatak 2 (esej)"],
  [6, "Govor — Dio 1 (razgovor)"],
  [7, "Govor — Dio 2 (monolog & rasprava)"],
  [8, "Vocabulary Sprint"],
  [9, "Grammar Sprint — padeži & vid"],
  [10, "Mock Test 1"],
  [11, "Mock Test 2"],
  [12, "Najčešće greške"],
  [13, "Upravljanje vremenom"],
  [14, "Final Review"],
  [15, "Review Akumulatif B2.7"],
  [16, "Mini-Project — Full Mock B2 & Rencana Belajar ke C1"],
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("bosnian")!,
  overview:
    "Bahasa Bosnia (bosanski) adalah salah satu dari tiga bahasa resmi Bosnia dan Herzegovina dan dituturkan ±2,5 juta orang di tanah airnya serta diaspora besar di Jerman, Austria, Swedia, Turki, dan Amerika Serikat. Ia satu rumpun Slavia Selatan dan saling paham hampir sepenuhnya dengan bahasa Kroasia, Serbia, dan Montenegro — belajar satu berarti membuka pintu ke empat negara sekaligus. Kabar baik untuk pelajar Indonesia: ejaannya fonemis (**piši kao što govoriš** — tulis seperti diucapkan), 30 huruf dengan satu bunyi per huruf, dan lima vokalnya dibaca persis seperti bahasa Indonesia. Tantangannya ada di tata bahasa: **tujuh kasus** (padeži), tiga jenis kata benda, **aspek kata kerja** (svršeni vs nesvršeni), dan **klitik** yang wajib duduk di posisi kedua kalimat. Ciri khas ragam Bosnia: pelafalan ijekavica (mlijeko, lijepo), bunyi **h** yang dipertahankan (kahva, lahko, mehko), dan ratusan **turcizmi** — serapan Turki/Arab/Persia dari empat abad era Usmani (čaršija, komšija, džezva, sevdah, merhaba) yang banyak di antaranya terasa akrab di telinga Indonesia. Dua aksara sama-sama resmi (latinica & ćirilica); kelas Linguo memakai latinica sejak hari pertama dan memperkenalkan ćirilica untuk membaca. Anchor budaya: Baščaršija & ritual bosanska kafa, Stari most di Mostar, sevdalinka, stećci, Sarajevo Film Festival, sastra Meša Selimović, Mak Dizdar, dan Ivo Andrić (Nobel 1961). Kurikulum Linguo: abjad & pelafalan di A1.1, akuzatif–lokatif–genitif + perfekt & futur di A1, tujuh kasus lengkap & aspek di A2, klitik & kalimat majemuk di B1, lalu ragam bisnis, akademik, sastra, dan sprint ujian B2 berformat CEFR.",
  levels: [
    {
      code: "A1", name: "Pemula — Abeceda, Prezent & Tiga Kasus Pertama",
      description: "Fondasi: 30 huruf & pelafalan č/ć/dž/đ, kata kerja biti, tiga jenis kata benda, prezent tiga pola, akuzatif–lokatif–genitif, perfekt & futur I, serta percakapan sehari-hari di kota.",
      sublevels: [
        { code: "A1.1", name: "Zdravo! — Abeceda & Perkenalan", sessions: a1_1, preview: true },
        { code: "A1.2", name: "Svaki dan — Prezent & Akuzativ", sessions: a1_2, preview: true },
        { code: "A1.3", name: "Grad & Ljudi — Lokativ, Genitiv, Perfekt", sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Dasar — Tujuh Kasus & Aspek Kata Kerja",
      description: "Melengkapi tujuh kasus (datif, instrumental, vokatif) tunggal & jamak, menguasai pasangan aspek svršeni/nesvršeni, bahasa perjalanan & layanan, serta pengenalan budaya Bosnia dan Herzegovina.",
      sublevels: [
        { code: "A2.1", name: "Padeži do kraja — Dativ, Instrumental, Vokativ", sessions: a2_1, preview: false },
        { code: "A2.2", name: "Glagolski vid — Svršeni & Nesvršeni", sessions: a2_2, preview: false },
        { code: "A2.3", name: "Putovanje & Svakodnevica", sessions: a2_3, preview: false },
        { code: "A2.4", name: "Kultura — Bosna i Hercegovina", sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Menengah — Klitik, Kalimat Majemuk & Kondisional",
      description: "Urutan klitik & posisi kedua, anak kalimat (relatif, sebab, waktu, tujuan), futur II, kondisional, bahasa kerja & pendidikan, media, serta tradisi bercerita Bosnia.",
      sublevels: [
        { code: "B1.1", name: "Složene rečenice — Veznici & Klitike", sessions: b1_1, preview: false },
        { code: "B1.2", name: "Kondicional & Želje", sessions: b1_2, preview: false },
        { code: "B1.3", name: "Posao & Obrazovanje", sessions: b1_3, preview: false },
        { code: "B1.4", name: "Mediji & Društvo", sessions: b1_4, preview: false },
        { code: "B1.5", name: "Priče & Tradicija", sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2", name: "Menengah Atas — Ragam Profesional, Akademik & Sastra",
      description: "Aksen & perubahan bunyi, ragam bisnis dan akademik, perbandingan ragam Bosnia–Kroasia–Serbia, sejarah & masyarakat, sastra & film, ditutup sprint ujian B2 berformat CEFR.",
      sublevels: [
        { code: "B2.1", name: "Napredna gramatika", sessions: b2_1, preview: false },
        { code: "B2.2", name: "Poslovni bosanski", sessions: b2_2, preview: false },
        { code: "B2.3", name: "Razgovorni jezik & Varijante", sessions: b2_3, preview: false },
        { code: "B2.4", name: "Akademski bosanski", sessions: b2_4, preview: false },
        { code: "B2.5", name: "Historija & Društvo", sessions: b2_5, preview: false },
        { code: "B2.6", name: "Književnost & Film", sessions: b2_6, preview: false },
        { code: "B2.7", name: "Sprint Ujian B2 (format CEFR)", sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;

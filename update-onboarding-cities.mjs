import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/onboarding/[token]/page.tsx", "utf8");

// Replace PROVINCES array with PROVINCE_CITIES mapping
const oldProvinces = `const PROVINCES = [
  "Aceh","Bali","Banten","Bengkulu","DI Yogyakarta","DKI Jakarta",
  "Gorontalo","Jambi","Jawa Barat","Jawa Tengah","Jawa Timur",
  "Kalimantan Barat","Kalimantan Selatan","Kalimantan Tengah","Kalimantan Timur","Kalimantan Utara",
  "Kepulauan Bangka Belitung","Kepulauan Riau","Lampung","Maluku","Maluku Utara",
  "Nusa Tenggara Barat","Nusa Tenggara Timur","Papua","Papua Barat","Papua Barat Daya",
  "Papua Pegunungan","Papua Selatan","Papua Tengah","Riau","Sulawesi Barat",
  "Sulawesi Selatan","Sulawesi Tengah","Sulawesi Tenggara","Sulawesi Utara",
  "Sumatera Barat","Sumatera Selatan","Sumatera Utara"
];`;

const newProvinces = `const PROVINCE_CITIES: Record<string, string[]> = {
  "Aceh": ["Banda Aceh","Langsa","Lhokseumawe","Sabang","Subulussalam","Aceh Barat","Aceh Besar","Aceh Jaya","Aceh Selatan","Aceh Tamiang","Aceh Tengah","Aceh Tenggara","Aceh Timur","Aceh Utara","Bener Meriah","Bireuen","Gayo Lues","Nagan Raya","Pidie","Pidie Jaya","Simeulue"],
  "Bali": ["Denpasar","Badung","Bangli","Buleleng","Gianyar","Jembrana","Karangasem","Klungkung","Tabanan"],
  "Banten": ["Cilegon","Serang","Tangerang","Tangerang Selatan","Lebak","Pandeglang","Serang Kab."],
  "Bengkulu": ["Bengkulu","Bengkulu Selatan","Bengkulu Tengah","Bengkulu Utara","Kaur","Kepahiang","Lebong","Mukomuko","Rejang Lebong","Seluma"],
  "DI Yogyakarta": ["Yogyakarta","Bantul","Gunung Kidul","Kulon Progo","Sleman"],
  "DKI Jakarta": ["Jakarta Barat","Jakarta Pusat","Jakarta Selatan","Jakarta Timur","Jakarta Utara","Kepulauan Seribu"],
  "Gorontalo": ["Gorontalo","Boalemo","Bone Bolango","Gorontalo Kab.","Gorontalo Utara","Pohuwato"],
  "Jambi": ["Jambi","Batanghari","Bungo","Kerinci","Merangin","Muaro Jambi","Sarolangun","Sungai Penuh","Tanjung Jabung Barat","Tanjung Jabung Timur","Tebo"],
  "Jawa Barat": ["Bandung","Bandung Barat","Bekasi","Bogor","Ciamis","Cianjur","Cimahi","Cirebon","Depok","Garut","Indramayu","Karawang","Kuningan","Majalengka","Pangandaran","Purwakarta","Subang","Sukabumi","Sumedang","Tasikmalaya"],
  "Jawa Tengah": ["Semarang","Banjarnegara","Banyumas","Batang","Blora","Boyolali","Brebes","Cilacap","Demak","Grobogan","Jepara","Karanganyar","Kebumen","Kendal","Klaten","Kudus","Magelang","Pati","Pekalongan","Pemalang","Purbalingga","Purworejo","Rembang","Salatiga","Solo","Sragen","Sukoharjo","Tegal","Temanggung","Wonogiri","Wonosobo"],
  "Jawa Timur": ["Surabaya","Bangkalan","Banyuwangi","Batu","Blitar","Bojonegoro","Bondowoso","Gresik","Jember","Jombang","Kediri","Lamongan","Lumajang","Madiun","Magetan","Malang","Mojokerto","Nganjuk","Ngawi","Pacitan","Pamekasan","Pasuruan","Ponorogo","Probolinggo","Sampang","Sidoarjo","Situbondo","Sumenep","Trenggalek","Tuban","Tulungagung"],
  "Kalimantan Barat": ["Pontianak","Bengkayang","Kapuas Hulu","Kayong Utara","Ketapang","Kubu Raya","Landak","Melawi","Mempawah","Sambas","Sanggau","Sekadau","Singkawang","Sintang"],
  "Kalimantan Selatan": ["Banjarmasin","Banjarbaru","Balangan","Barito Kuala","Hulu Sungai Selatan","Hulu Sungai Tengah","Hulu Sungai Utara","Kotabaru","Tabalong","Tanah Bumbu","Tanah Laut","Tapin"],
  "Kalimantan Tengah": ["Palangkaraya","Barito Selatan","Barito Timur","Barito Utara","Gunung Mas","Kapuas","Katingan","Kotawaringin Barat","Kotawaringin Timur","Lamandau","Murung Raya","Pulang Pisau","Seruyan","Sukamara"],
  "Kalimantan Timur": ["Samarinda","Balikpapan","Bontang","Berau","Kutai Barat","Kutai Kartanegara","Kutai Timur","Mahakam Ulu","Paser","Penajam Paser Utara"],
  "Kalimantan Utara": ["Tarakan","Bulungan","Malinau","Nunukan","Tana Tidung"],
  "Kepulauan Bangka Belitung": ["Pangkalpinang","Bangka","Bangka Barat","Bangka Selatan","Bangka Tengah","Belitung","Belitung Timur"],
  "Kepulauan Riau": ["Batam","Tanjungpinang","Bintan","Karimun","Kepulauan Anambas","Lingga","Natuna"],
  "Lampung": ["Bandar Lampung","Metro","Lampung Barat","Lampung Selatan","Lampung Tengah","Lampung Timur","Lampung Utara","Mesuji","Pesawaran","Pesisir Barat","Pringsewu","Tanggamus","Tulang Bawang","Tulang Bawang Barat","Way Kanan"],
  "Maluku": ["Ambon","Tual","Buru","Buru Selatan","Kepulauan Aru","Maluku Barat Daya","Maluku Tengah","Maluku Tenggara","Maluku Tenggara Barat","Seram Bagian Barat","Seram Bagian Timur"],
  "Maluku Utara": ["Ternate","Tidore Kepulauan","Halmahera Barat","Halmahera Selatan","Halmahera Tengah","Halmahera Timur","Halmahera Utara","Kepulauan Sula","Pulau Morotai","Pulau Taliabu"],
  "Nusa Tenggara Barat": ["Mataram","Bima","Dompu","Lombok Barat","Lombok Tengah","Lombok Timur","Lombok Utara","Sumbawa","Sumbawa Barat"],
  "Nusa Tenggara Timur": ["Kupang","Alor","Belu","Ende","Flores Timur","Lembata","Manggarai","Manggarai Barat","Manggarai Timur","Nagekeo","Ngada","Rote Ndao","Sabu Raijua","Sikka","Sumba Barat","Sumba Barat Daya","Sumba Tengah","Sumba Timur","Timor Tengah Selatan","Timor Tengah Utara"],
  "Papua": ["Jayapura","Biak Numfor","Jayapura Kab.","Keerom","Kepulauan Yapen","Mamberamo Raya","Mamberamo Tengah","Sarmi","Supiori","Waropen"],
  "Papua Barat": ["Manokwari","Fakfak","Kaimana","Manokwari Selatan","Pegunungan Arfak","Sorong","Sorong Selatan","Teluk Bintuni","Teluk Wondama"],
  "Papua Barat Daya": ["Sorong","Maybrat","Raja Ampat","Tambrauw"],
  "Papua Pegunungan": ["Jayawijaya","Lanny Jaya","Mamberamo Tengah","Nduga","Pegunungan Bintang","Tolikara","Yalimo","Yahukimo"],
  "Papua Selatan": ["Merauke","Asmat","Boven Digoel","Mappi"],
  "Papua Tengah": ["Nabire","Deiyai","Dogiyai","Intan Jaya","Mimika","Paniai","Puncak","Puncak Jaya"],
  "Riau": ["Pekanbaru","Dumai","Bengkalis","Indragiri Hilir","Indragiri Hulu","Kampar","Kepulauan Meranti","Kuantan Singingi","Pelalawan","Rokan Hilir","Rokan Hulu","Siak"],
  "Sulawesi Barat": ["Mamuju","Majene","Mamasa","Mamuju Tengah","Pasangkayu","Polewali Mandar"],
  "Sulawesi Selatan": ["Makassar","Palopo","Parepare","Bantaeng","Barru","Bone","Bulukumba","Enrekang","Gowa","Jeneponto","Kepulauan Selayar","Luwu","Luwu Timur","Luwu Utara","Maros","Pangkajene dan Kepulauan","Pinrang","Sidenreng Rappang","Sinjai","Soppeng","Takalar","Tana Toraja","Toraja Utara","Wajo"],
  "Sulawesi Tengah": ["Palu","Banggai","Banggai Kepulauan","Banggai Laut","Buol","Donggala","Morowali","Morowali Utara","Parigi Moutong","Poso","Sigi","Tojo Una-Una","Toli-Toli"],
  "Sulawesi Tenggara": ["Kendari","Bau-Bau","Bombana","Buton","Buton Selatan","Buton Tengah","Buton Utara","Kolaka","Kolaka Timur","Kolaka Utara","Konawe","Konawe Kepulauan","Konawe Selatan","Konawe Utara","Muna","Muna Barat","Wakatobi"],
  "Sulawesi Utara": ["Manado","Bitung","Kotamobagu","Tomohon","Bolaang Mongondow","Bolaang Mongondow Selatan","Bolaang Mongondow Timur","Bolaang Mongondow Utara","Kepulauan Sangihe","Kepulauan Siau Tagulandang Biaro","Kepulauan Talaud","Minahasa","Minahasa Selatan","Minahasa Tenggara","Minahasa Utara"],
  "Sumatera Barat": ["Padang","Bukittinggi","Padang Panjang","Pariaman","Payakumbuh","Sawahlunto","Solok","Agam","Dharmasraya","Kepulauan Mentawai","Lima Puluh Kota","Padang Pariaman","Pasaman","Pasaman Barat","Pesisir Selatan","Sijunjung","Solok Kab.","Solok Selatan","Tanah Datar"],
  "Sumatera Selatan": ["Palembang","Lubuklinggau","Pagar Alam","Prabumulih","Banyuasin","Empat Lawang","Lahat","Muara Enim","Musi Banyuasin","Musi Rawas","Musi Rawas Utara","Ogan Ilir","Ogan Komering Ilir","Ogan Komering Ulu","Ogan Komering Ulu Selatan","Ogan Komering Ulu Timur","Penukal Abab Lematang Ilir"],
  "Sumatera Utara": ["Medan","Binjai","Gunungsitoli","Padangsidimpuan","Pematangsiantar","Sibolga","Tanjungbalai","Tebing Tinggi","Asahan","Batu Bara","Dairi","Deli Serdang","Humbang Hasundutan","Karo","Labuhanbatu","Labuhanbatu Selatan","Labuhanbatu Utara","Langkat","Mandailing Natal","Nias","Nias Barat","Nias Selatan","Nias Utara","Padang Lawas","Padang Lawas Utara","Pakpak Bharat","Samosir","Serdang Bedagai","Simalungun","Tapanuli Selatan","Tapanuli Tengah","Tapanuli Utara","Toba"],
};
const PROVINCES = Object.keys(PROVINCE_CITIES);`;

code = code.replace(oldProvinces, newProvinces);
console.log("✅ Province-City mapping added");

// Replace province SearchDropdown + city input with province SearchDropdown + city SearchDropdown
// First, find the Indonesia domicile section and replace city input with SearchDropdown
code = code.replace(
  `<div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Kota / Kabupaten</label>
                    <input type="text" placeholder="contoh: Bandung, Bekasi, Surabaya" value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20" />
                  </div>`,
  `{province && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Kota / Kabupaten</label>
                      <SearchDropdown options={PROVINCE_CITIES[province] || []} value={city} onChange={setCity} placeholder="Pilih kota..." />
                    </div>
                  )}`
);
console.log("✅ City dropdown now depends on province selection");

// Reset city when province changes
code = code.replace(
  `<SearchDropdown options={PROVINCES} value={province} onChange={setProvince} placeholder="Pilih provinsi..." />`,
  `<SearchDropdown options={PROVINCES} value={province} onChange={(v) => { setProvince(v); setCity(""); }} placeholder="Pilih provinsi..." />`
);
console.log("✅ City resets when province changes");

writeFileSync("src/app/onboarding/[token]/page.tsx", code);
console.log("✅ Saved!");

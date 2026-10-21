# Tema negara dan budaya pada sertifikat

Bendera dan ilustrasi memakai pemetaan bersama di `src/lib/courseCertificateTheme.ts`. Semua ilustrasi memakai sapuan brush dengan teal dan orange di atas dasar krem. File gambar berada di `public/images/certificates/`.

English default dan English Conversation mengikuti bendera AS yang sudah digunakan pada sertifikat; British English memakai Inggris. Portugis default memakai Brasil, sedangkan varian Portugal memakai Portugal. Swahili mengikuti bendera Tanzania pada sertifikat.

Bahasa daerah memakai ilustrasi budaya daerah masing-masing. Esperanto dan nama bahasa yang tidak dikenal memakai lanskap netral tanpa landmark negara yang ditebak. Nama kelas, level, dan kode batch dinormalkan sebelum lookup.

## Negara dan wilayah

| Kode bendera | Negara/wilayah | Aset |
| --- | --- | --- |
| af | Afghanistan | pashto.webp |
| al | Albania | albanian.webp |
| am | Armenia | armenian.webp |
| az | Azerbaijan | azerbaijani.webp |
| ba | Bosnia dan Herzegovina | bosnian.webp |
| bd | Bangladesh | bengali.webp |
| bg | Bulgaria | bulgarian.webp |
| br | Brasil | brazilian.webp |
| cn | Tiongkok | mandarin.webp |
| cz | Ceko | czech.webp |
| de | Jerman | german.webp |
| dk | Denmark | danish.webp |
| ee | Estonia | estonian.webp |
| es | Spanyol | spanish.webp |
| es-ct | Catalonia | catalan.webp |
| et | Ethiopia | amharic.webp |
| fi | Finlandia | finnish.webp |
| fr | Prancis | french.webp |
| gb | Inggris | english.webp |
| gb-wls | Wales | welsh.webp |
| ge | Georgia | georgian.webp |
| gr | Yunani | greek.webp |
| hk | Hong Kong | cantonese.webp |
| hr | Kroasia | croatian.webp |
| hu | Hungaria | hungarian.webp |
| id | Indonesia | indonesian.webp |
| ie | Irlandia | irish.webp |
| il | Israel | hebrew.webp |
| in | India | hindi.webp |
| ir | Iran | persian.webp |
| is | Islandia | icelandic.webp |
| it | Italia | italian.webp |
| jp | Jepang | japanese.webp |
| kg | Kirgizstan | kyrgyz.webp |
| kh | Kamboja | khmer.webp |
| kr | Korea Selatan | korean.webp |
| kz | Kazakhstan | kazakh.webp |
| la | Laos | lao.webp |
| lk | Sri Lanka | sinhala.webp |
| lt | Lituania | lithuanian.webp |
| lv | Latvia | latvian.webp |
| mk | Makedonia Utara | macedonian.webp |
| mm | Myanmar | burmese.webp |
| mn | Mongolia | mongolian.webp |
| my | Malaysia | malay.webp |
| ng | Nigeria | yoruba.webp |
| nl | Belanda | dutch.webp |
| no | Norwegia | norwegian.webp |
| np | Nepal | nepali.webp |
| ph | Filipina | filipino.webp |
| pk | Pakistan | urdu.webp |
| pl | Polandia | polish.webp |
| pt | Portugal | portuguese.webp |
| ro | Rumania | romanian.webp |
| rs | Serbia | serbian.webp |
| ru | Rusia | russian.webp |
| sa | Arab Saudi | arabic.webp |
| se | Swedia | swedish.webp |
| si | Slovenia | slovenian.webp |
| sk | Slovakia | slovak.webp |
| th | Thailand | thai.webp |
| tj | Tajikistan | tajik.webp |
| tm | Turkmenistan | turkmen.webp |
| tr | Turki | turkish.webp |
| tz | Tanzania | swahili.webp |
| ua | Ukraina | ukrainian.webp |
| us | Amerika Serikat | american.webp |
| uz | Uzbekistan | uzbek.webp |
| va | Vatikan dan Roma | latin.webp |
| vn | Vietnam | vietnamese.webp |
| za | Afrika Selatan | zulu.webp |

## Budaya daerah

| Budaya/wilayah | Aset |
| --- | --- |
| Jawa, Indonesia | javanese.webp |
| Sunda, Indonesia | sundanese.webp |
| Betawi, Indonesia | betawi.webp |
| Bali, Indonesia | balinese.webp |
| Minangkabau, Indonesia | minangkabau.webp |
| Batak, Indonesia | batak.webp |
| Bugis, Indonesia | bugis.webp |
| Aceh, Indonesia | acehnese.webp |
| Banjar, Indonesia | banjar.webp |
| Madura, Indonesia | madurese.webp |
| Tamil Nadu, India | tamil.webp |
| Punjab, India | punjabi.webp |
| Afrika Selatan | afrikaans.webp |
| Wilayah budaya Kurdi | kurdish.webp |

## Pemuatan gambar

Layar memakai WebP ringan di `preview-v1/` dan logo `logo-v1.webp`. Gambar asli hanya dimuat pada dokumen salinan saat ekspor PDF. Bendera di `flags-v1/` disajikan dari domain sendiri. Preview diprefetch saat pilihan sertifikat mendapat hover atau fokus, kecuali pengguna mengaktifkan hemat data.

Jalankan `node scripts/optimasi-gambar-sertifikat.mjs` sesudah memperbarui ilustrasi sumber. Aset gambar memakai cache immutable; naikkan versi nama direktori/file preview dan referensinya bila kontennya berubah.

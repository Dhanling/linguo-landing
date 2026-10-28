# Placement semua bahasa

64 bahasa CEFR dan 2 tes persiapan (IELTS, TOEFL ITP) memakai layout compact yang sama. Hero Swedia tetap memakai aset yang disetujui sebelumnya. Sebanyak 65 hero baru dibuat satu per bahasa memakai built-in imagegen, lalu dikompres ke WebP 1200px. Kedua ilustrasi kartu memakai aset bersama self-assessment-v2.webp dan speaking-test-v2.webp.

Prompt final setiap hero, path aset, ukuran, dan checksum tersedia di imagegen.json.

| Bahasa | Tema hero | Ukuran |
| --- | --- | --- |
| english | London, Big Ben and pastel townhouses, British flag mug | 66 KB |
| japanese | Kyoto pagoda, Mount Fuji and cherry blossom, Japanese flag mug | 71 KB |
| korean | Seoul Namsan tower, hanok rooftops and spring trees, Korean flag mug | 70 KB |
| mandarin | Beijing palace rooftops and distant Great Wall, Chinese flag mug | 58 KB |
| cantonese | Hong Kong Victoria Harbour and skyline, Hong Kong flag mug | 74 KB |
| vietnamese | Hanoi lake, red bridge and old quarter, Vietnamese flag mug | 80 KB |
| thai | Bangkok golden temple roofs and river, Thai flag mug | 75 KB |
| filipino | Manila old city walls and palm trees, Philippine flag mug | 86 KB |
| khmer | Angkor Wat towers and lotus pond, Cambodian flag mug | 92 KB |
| burmese | Bagan golden pagodas and distant hills, Myanmar flag mug | 57 KB |
| hindi | Jaipur pink palace facade, Indian flag mug | 85 KB |
| urdu | Lahore Mughal courtyard and gardens, Pakistani flag mug | 76 KB |
| german | Berlin Brandenburg Gate and pastel facades, German flag mug | 56 KB |
| french | Paris Eiffel Tower and cream Haussmann buildings, French flag mug | 69 KB |
| spanish | Barcelona Sagrada Familia and sunny rooftops, Spanish flag mug | 71 KB |
| italian | Rome Colosseum and cypress trees, Italian flag mug | 62 KB |
| dutch | Amsterdam canal houses and little bridge, Dutch flag mug | 77 KB |
| greek | Santorini blue domes and Aegean sea, Greek flag mug | 61 KB |
| portuguese-br | Rio Sugarloaf mountain and Guanabara bay, Brazilian flag mug | 83 KB |
| portuguese-pt | Lisbon tiled facades and yellow tram, Portuguese flag mug | 99 KB |
| norwegian | Bergen colorful waterfront and fjord mountains, Norwegian flag mug | 79 KB |
| danish | Copenhagen Nyhavn colorful canal houses, Danish flag mug | 77 KB |
| icelandic | Reykjavik Hallgrimskirkja and distant snowy mountain, Icelandic flag mug | 64 KB |
| irish | Dublin Georgian doors and green park, Irish flag mug | 94 KB |
| bosnian | Mostar stone bridge and turquoise river, Bosnian flag mug | 96 KB |
| finnish | Helsinki cathedral and waterfront, Finnish flag mug | 57 KB |
| hungarian | Budapest parliament and Danube river, Hungarian flag mug | 75 KB |
| turkish | Istanbul domes and Bosphorus waterfront, Turkish flag mug | 60 KB |
| romanian | Brasov old square and Carpathian hills, Romanian flag mug | 98 KB |
| russian | Moscow colorful onion domes and pastel skyline, Russian flag mug | 73 KB |
| ukrainian | Kyiv Saint Sophia golden domes and chestnut trees, Ukrainian flag mug | 86 KB |
| bulgarian | Sofia Alexander Nevsky cathedral and mountains, Bulgarian flag mug | 67 KB |
| polish | Krakow main square and twin church towers, Polish flag mug | 79 KB |
| czech | Prague Charles Bridge and castle skyline, Czech flag mug | 69 KB |
| arabic | Cairo Nile waterfront with distant pyramids, small geometric-patterned mug | 79 KB |
| hebrew | Jerusalem cream stone old city and olive trees, Israeli flag mug | 90 KB |
| persian | Isfahan turquoise tiled domes and garden, Iranian flag mug | 93 KB |
| kurdish | Erbil citadel and Zagros mountains, mug with small yellow sun motif | 66 KB |
| armenian | Yerevan pink stone buildings and Mount Ararat, Armenian flag mug | 73 KB |
| javanese | Yogyakarta traditional joglo pavilion and garden, Indonesian flag mug | 81 KB |
| sundanese | Bandung Gedung Sate and green tea hills, Indonesian flag mug | 77 KB |
| betawi | Jakarta Monas and colorful Betawi houses, Indonesian flag mug | 72 KB |
| bipa | Jakarta skyline and tropical urban garden, Indonesian flag mug | 75 KB |
| balinese | Bali split gate and rice terraces, Indonesian flag mug | 66 KB |
| minangkabau | West Sumatra rumah gadang curved roofs and green hills, Indonesian flag mug | 67 KB |
| batak | Lake Toba and traditional Batak pointed-roof houses, Indonesian flag mug | 62 KB |
| bugis | South Sulawesi pinisi boat in calm harbor, Indonesian flag mug | 83 KB |
| acehnese | Banda Aceh Baiturrahman mosque and garden, Indonesian flag mug | 79 KB |
| banjar | Banjarmasin river houses and floating market boats, Indonesian flag mug | 82 KB |
| madurese | Madura traditional red-roof houses and Suramadu bridge, Indonesian flag mug | 72 KB |
| lao | Luang Prabang temple and Mekong river, Lao flag mug | 89 KB |
| bengali | Dhaka Lalbagh fort and water lilies, Bangladesh flag mug | 60 KB |
| tamil | Chennai colorful Dravidian temple tower and palm trees, small jasmine-patterned mug | 95 KB |
| punjabi | Amritsar Golden Temple reflected in water, small mustard-flower mug | 83 KB |
| nepali | Kathmandu pagoda roofs and Himalayan peaks, Nepal flag mug | 69 KB |
| mongolian | Ulaanbaatar skyline and rolling steppe hills, Mongolian flag mug | 72 KB |
| swahili | Zanzibar Stone Town carved doors and Indian Ocean, small dhow-patterned mug | 95 KB |
| zulu | KwaZulu-Natal green hills and round thatched homesteads, South African flag mug | 67 KB |
| yoruba | Lagos waterfront with modern bridge and palms, Nigerian flag mug | 76 KB |
| amharic | Addis Ababa skyline and distant Entoto hills, Ethiopian flag mug | 70 KB |
| georgian | Tbilisi colorful wooden balconies and Narikala fortress, Georgian flag mug | 86 KB |
| latin | Rome ancient forum columns and cypress garden, small laurel-patterned mug | 75 KB |
| esperanto | peaceful international garden with globe sculpture and diverse colorful houses, green mug with white Esperanto star | 96 KB |
| ielts | Cambridge university stone college and river punt, British flag mug, simple study notebook | 82 KB |
| toefl-itp | Boston university red brick campus and river, American flag mug, simple study notebook | 71 KB |

## Validasi

- Build production (Next.js/webpack) dan TypeScript lolos.
- 67 pemeriksaan otomatis lolos: judul/jalur bahasa, jumlah soal, gambar kartu bersama, seluruh aset tersedia, dan 66 hero unik termasuk Swedia.
- Audit 66 route lokal: HTTP 200 dan komponen baru terpasang.
- Browser desktop 1440px dan mobile 390px untuk Inggris, Jepang, Arab, Portugis Portugal, BIPA, Latin, Swedia, IELTS, dan TOEFL ITP: hero termuat, tanpa overflow horizontal/error JavaScript; tombol mulai dan popup booking berfungsi. Pengujian tidak membuat pembayaran.

import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

// Compact format: [sessionNumber, title, topics?]
type Raw = [number, string, string[]?];

// Helper for A1 sublevels (preview: TRUE) — sessions with topics array
const toSessions = (rows: Raw[]): SessionPreview[] =>
  rows.map(([number, title, topics]) => ({
    number,
    title,
    topics: topics ?? [],
  }));

// Helper for A2/B1/B2 sublevels (preview: FALSE) — title only
const titleOnly = (count: number, prefix: string): SessionPreview[] =>
  Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    title: `${prefix} — Sesi ${i + 1}`,
  }));

const meta = getLanguageBySlug("french")!;

const curriculum: LanguageCurriculum = {
  meta,
  levels: [
    {
      code: "A1",
      title: "A1 — Débutant (Pemula)",
      description:
        "Fondasi bahasa Prancis: alfabet dengan accent (é, è, ê, à, ç), 3 vokal nasal khas Prancis, liaison & enchaînement, perbedaan tu vs vous, dan struktur kalimat dasar. Cocok untuk yang belum pernah belajar Prancis sama sekali.",
      sublevels: [
        {
          code: "A1.1",
          title: "Fondations du Français (Fondasi Bahasa Prancis)",
          preview: true,
          sessions: toSessions([
            [1, "Bienvenue & Alphabet Français (Selamat Datang & Alfabet Prancis)", [
              "Pengenalan bahasa Prancis: 320+ juta penutur di 5 benua",
              "Alfabet Prancis: 26 huruf + diacritics",
              "Accents: é (aigu), è (grave), ê (circonflexe), à, ç",
              "Sejarah: la francophonie & posisi Prancis dalam diplomasi",
            ]],
            [2, "Les Sons Nasaux (Bunyi Nasal — Ciri Khas Prancis)", [
              "Tiga vokal nasal: an/en, in/un, on",
              "Latihan: pain, vin, bon, banc, mon",
              "Perbedaan vokal nasal vs vokal biasa",
              "Tip: udara keluar lewat hidung, bukan mulut",
            ]],
            [3, "Liaison & Enchaînement (Liaison & Penyambungan)", [
              "Liaison: konsonan akhir kata terhubung ke vokal awal kata berikut",
              "Contoh: les amis [le-zami], un homme [œ̃-nɔm]",
              "Liaison wajib vs opsional vs terlarang",
              "Enchaînement: konsonan terucap pindah suku kata berikutnya",
            ]],
            [4, "Salutations & Politesse (Sapaan & Kesopanan)", [
              "Bonjour, bonsoir, salut, au revoir",
              "Comment allez-vous? vs Comment ça va? — formal/informal",
              "Réponses: bien, très bien, pas mal, comme ci comme ça",
              "Etiket Prancis: pentingnya 'bonjour' sebelum apapun",
            ]],
            [5, "Tu vs Vous (Akrab vs Formal)", [
              "Tu: keluarga, teman, anak, rekan dekat",
              "Vous: orang asing, atasan, situasi formal, jamak",
              "Tutoyer & vouvoyer — verba khusus untuk transisi",
              "Cultural: kapan minta izin 'on peut se tutoyer?'",
            ]],
            [6, "Présentations Personnelles (Perkenalan Diri)", [
              "Je m'appelle... / Mon nom est... / Je suis...",
              "Comment tu t'appelles? / Comment vous appelez-vous?",
              "Enchanté(e) — gender agreement bahkan di sini",
              "Je viens d'Indonésie / Je suis indonésien(ne)",
            ]],
            [7, "Verbe ÊTRE (Kata Kerja ÊTRE/Menjadi)", [
              "Konjugasi: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont",
              "Penggunaan: identitas, profesi, kebangsaan, sifat",
              "Negasi: ne... pas (Je ne suis pas...)",
              "Pengantar konsep verba paling penting bahasa Prancis",
            ]],
            [8, "Verbe AVOIR (Kata Kerja AVOIR/Memiliki)", [
              "Konjugasi: j'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont",
              "Penggunaan: kepemilikan, usia (J'ai 25 ans!)",
              "Avoir faim, soif, chaud, froid, peur, sommeil",
              "Avoir vs Être: 2 verba paling penting Prancis",
            ]],
            [9, "Pronoms Personnels (Kata Ganti Orang)", [
              "Je, tu, il, elle, on",
              "Nous, vous, ils, elles",
              "On = nous (informal) — sangat sering dipakai",
              "Pronoun gender wajib: il/elle untuk benda juga",
            ]],
            [10, "Articles Définis & Indéfinis (Artikel Definit & Indefinit)", [
              "Définis: le, la, l', les",
              "Indéfinis: un, une, des",
              "Aturan elision: le ami → l'ami",
              "Berbeda dari Inggris: artikel hampir selalu wajib",
            ]],
            [11, "Genre des Noms (Gender Kata Benda)", [
              "Maskulin vs feminin — tidak selalu intuitif",
              "Akhiran feminin umum: -tion, -ion, -té, -ée, -ence",
              "Akhiran maskulin umum: -ment, -isme, -age, -eau",
              "Pengecualian penting: le problème, la maison",
            ]],
            [12, "Nombres 0–30 (Angka 0–30)", [
              "Zéro, un, deux, trois... trente",
              "Pola unik 11-16: onze, douze, treize, quatorze, quinze, seize",
              "21, 31: vingt-et-un, trente-et-un (dengan 'et')",
              "Latihan: nomor telepon, usia, tanggal lahir",
            ]],
            [13, "La Famille (Keluarga)", [
              "Père, mère, frère, sœur, fils, fille",
              "Grand-père, grand-mère, oncle, tante, cousin(e)",
              "Possessif: mon/ma/mes, ton/ta/tes, son/sa/ses",
              "J'ai deux frères / Ma mère s'appelle...",
            ]],
            [14, "Nombres 31–100 & au-delà (Angka 31–100+)", [
              "Trente, quarante, cinquante, soixante",
              "Pola unik 70: soixante-dix (60+10)",
              "Pola unik 80: quatre-vingts (4×20) — sistem vigesimal",
              "Pola unik 90: quatre-vingt-dix (4×20+10)",
            ]],
            [15, "Questions de Base (Pertanyaan Dasar)", [
              "Qu'est-ce que, qui, où, quand, comment, pourquoi, combien",
              "Tiga cara bertanya: intonasi, est-ce que, inversion",
              "Tu habites où? / Où est-ce que tu habites? / Où habites-tu?",
              "Register: intonasi (informal) vs inversion (formal)",
            ]],
            [16, "Révision & Dialogue Culturel (Review & Dialog Budaya)", [
              "Review komprehensif sesi 1–15",
              "Dialog: bertemu orang Prancis di Indonesia",
              "Cultural anchor: la bise (cipika-cipiki khas Prancis)",
              "Self-assessment & persiapan A1.2",
            ]],
          ]),
        },
        {
          code: "A1.2",
          title: "La Vie Quotidienne (Kehidupan Sehari-hari)",
          preview: true,
          sessions: toSessions([
            [1, "Jours, Mois, Saisons (Hari, Bulan, Musim)", [
              "Lundi, mardi, mercredi... dimanche (lowercase!)",
              "Janvier, février... décembre",
              "Quatre saisons: printemps, été, automne, hiver",
              "Quel jour sommes-nous? / Nous sommes le 25 mars",
            ]],
            [2, "L'Heure (Waktu/Jam)", [
              "Quelle heure est-il? — Il est une heure / Il est deux heures",
              "Et demie, et quart, moins le quart",
              "Du matin, de l'après-midi, du soir",
              "Sistem 24 jam (umum di Prancis): quatorze heures = 2 PM",
            ]],
            [3, "Verbes en -ER (Kata Kerja Beraturan -ER)", [
              "Pola konjugasi -ER: parler, étudier, travailler, habiter",
              "Akhiran: -e, -es, -e, -ons, -ez, -ent",
              "Verba sehari-hari: aimer, chanter, danser, écouter, regarder",
              "Latihan: J'étudie le français tous les jours",
            ]],
            [4, "Verbes en -IR & -RE (Kata Kerja Beraturan -IR & -RE)", [
              "Pola -IR: finir, choisir, réussir (akhiran -is, -is, -it, -issons, -issez, -issent)",
              "Pola -RE: vendre, attendre, descendre (akhiran -s, -s, --, -ons, -ez, -ent)",
              "Verba penting: prendre (irreguler tapi sering dipakai)",
              "Tiga grup verba — pengantar klasifikasi",
            ]],
            [5, "Professions (Profesi)", [
              "Professeur, médecin, ingénieur, avocat, infirmier(ière)",
              "Gender: un boulanger / une boulangère",
              "Tu fais quoi dans la vie? / Quel est votre métier?",
              "Je travaille comme... / Je suis + profession (tanpa artikel)",
            ]],
            [6, "Cuisine Française & Boulangerie (Kuliner Prancis & Boulangerie)", [
              "Pain, baguette, croissant, pain au chocolat, brioche",
              "Fromages: camembert, brie, roquefort, comté",
              "Vin: rouge, blanc, rosé — terroir & régions",
              "Cultural: la baguette = warisan UNESCO 2022",
            ]],
            [7, "Au Restaurant (Di Restoran)", [
              "Je voudrais... / J'aimerais... / Pour moi...",
              "La carte, s'il vous plaît / L'addition, s'il vous plaît",
              "Qu'est-ce que vous recommandez? / Le plat du jour?",
              "Etiket: pourboire (tip) sudah termasuk service",
            ]],
            [8, "Articles Partitifs (Artikel Partitif)", [
              "Du, de la, de l', des — untuk kuantitas tak tertentu",
              "Je mange du pain / Je bois de l'eau / Je veux des frites",
              "Negasi → de: Je ne mange pas de pain",
              "Khas Prancis: tidak ada padanan langsung di Inggris/Indonesia",
            ]],
            [9, "Verbe ALLER & Lieux (Kata Kerja ALLER & Tempat)", [
              "Konjugasi ALLER: vais, vas, va, allons, allez, vont (irreguler!)",
              "Aller à + tempat: Je vais au supermarché",
              "Kontraksi: à + le = au, à + les = aux",
              "Tempat umum: parc, école, bureau, magasin, gare",
            ]],
            [10, "Futur Proche (Future Tense Dekat)", [
              "Struktur: aller + infinitif",
              "Je vais étudier demain / Nous allons voyager",
              "Ekspresi waktu masa depan: demain, la semaine prochaine",
              "Latihan: rencana akhir pekan",
            ]],
            [11, "Adjectifs Possessifs (Kata Sifat Possesif)", [
              "Mon/ma/mes, ton/ta/tes, son/sa/ses",
              "Notre/nos, votre/vos, leur/leurs",
              "Aturan: mengikuti gender & jumlah benda yang dimiliki",
              "Trik: mon ami(e) — pakai 'mon' bahkan untuk feminin yang awal vokal",
            ]],
            [12, "Démonstratifs: Ce, Cette, Ces (Demonstratif)", [
              "Ce (mask) / Cette (fem) / Ces (jamak)",
              "Cet sebelum vokal/h muet: cet ami, cet hôtel",
              "Penggunaan: ce livre, cette maison, ces enfants",
              "Tidak ada 'this/that' — tergantung konteks atau pakai -ci/-là",
            ]],
            [13, "Le Corps & La Santé (Tubuh & Kesehatan)", [
              "Tête, yeux, bouche, nez, oreilles, mains, pieds",
              "J'ai mal à la tête / J'ai mal au ventre",
              "Chez le médecin / À la pharmacie",
              "Sécurité Sociale — sistem kesehatan Prancis (cultural)",
            ]],
            [14, "Les Vêtements (Pakaian)", [
              "Chemise, pantalon, jupe, chaussures, chapeau",
              "Porter (mengenakan) vs s'habiller (berpakaian)",
              "Couleurs: rouge, bleu, vert, jaune, noir, blanc",
              "Faire les courses: Combien ça coûte? / Quelle taille?",
            ]],
            [15, "Verbes Irréguliers Fréquents (Verba Irreguler Sering)", [
              "Faire (membuat/melakukan): fais, fais, fait, faisons, faites, font",
              "Prendre (mengambil): prends, prends, prend, prenons, prenez, prennent",
              "Venir (datang): viens, viens, vient, venons, venez, viennent",
              "Voir, savoir, pouvoir, vouloir — preview B1",
            ]],
            [16, "Révision & Mini-Dialogues (Review & Dialog Mini)", [
              "Review semua materi A1.2",
              "Roleplay: di café, di marché, di pharmacie",
              "Cultural: jam makan di Prancis vs Indonesia",
              "Persiapan A1.3 — ekspansi verba & vokabuler",
            ]],
          ]),
        },
        {
          code: "A1.3",
          title: "Mon Univers (Duniaku)",
          preview: true,
          sessions: toSessions([
            [1, "Ma Maison (Rumahku)", [
              "Pièces: salon, cuisine, chambre, salle de bain, salle à manger",
              "Meubles: table, chaise, canapé, lit, armoire",
              "Il y a (ada) — invariable: Il y a une table / Il y a trois chaises",
              "Préposisi tempat: dans, sur, sous, à côté de, devant, derrière",
            ]],
            [2, "La Ville (Kota)", [
              "Rue, avenue, boulevard, place, carrefour",
              "Bâtiments: banque, hôpital, église, musée, bibliothèque",
              "Directions: à droite, à gauche, tout droit",
              "Comment aller à...? / Où se trouve...?",
            ]],
            [3, "Transport (Transportasi)", [
              "Voiture, bus, métro, train, taxi, vélo, avion",
              "Prendre le bus, en voiture, à pied, à vélo",
              "Acheter un billet: aller simple, aller-retour",
              "À la gare: quai, voie, retard, TGV (kereta cepat Prancis)",
            ]],
            [4, "Le Temps Qu'il Fait (Cuaca)", [
              "Il fait beau, il fait froid, il fait chaud, il fait du vent",
              "Il pleut, il neige, il y a du brouillard",
              "Quel temps fait-il? / Comment est la météo?",
              "Saisons di Prancis vs tropis Indonesia (cultural awareness)",
            ]],
            [5, "Loisirs & Hobbies (Waktu Luang & Hobi)", [
              "J'aime + infinitif: J'aime lire",
              "J'aime + sustantivo: J'aime le cinéma / J'aime les livres",
              "Moi aussi, moi non plus — agreement",
              "Hobbies: sport, musique, lecture, voyage, cuisine",
            ]],
            [6, "Les Sports (Olahraga)", [
              "Football, basket, tennis, natation, cyclisme",
              "Jouer à (sport ball) vs Faire de (other sports)",
              "Équipes & événements: Tour de France, Roland-Garros, PSG",
              "Cultural: l'esprit sportif & la fierté nationale",
            ]],
            [7, "Musique & Cinéma Français (Musik & Film Prancis)", [
              "Chanteurs: Édith Piaf, Stromae, Aya Nakamura, Indila",
              "Réalisateurs: Truffaut, Godard, Audiard, Sciamma",
              "Genre: chanson française, rap français, électro",
              "Vocab: chanson, film, album, concert",
            ]],
            [8, "Verbes Pronominaux (Verba Refleksif)", [
              "Pengantar reflexive pronouns: me, te, se, nous, vous, se",
              "Routine quotidienne: se lever, se doucher, s'habiller, se coucher",
              "Posisi pronoun: sebelum verba terkonjugasi",
              "Je me lève à 7 heures / Il se couche tard",
            ]],
            [9, "Ma Routine Quotidienne (Rutinitas Harianku)", [
              "Le matin, l'après-midi, le soir",
              "Connecteurs: d'abord, puis, ensuite, enfin",
              "Fréquence: toujours, souvent, parfois, jamais",
              "Cerita rutinitas pribadi (5 menit speaking)",
            ]],
            [10, "Comparaisons (Perbandingan)", [
              "Plus + adj + que / Moins + adj + que",
              "Aussi + adj + que (sama dengan)",
              "Meilleur, pire — bentuk irreguler",
              "Paris est plus grand que Yakarta — practice",
            ]],
            [11, "Superlatifs (Superlatif)", [
              "Le/la plus + adj + de: le plus grand de la classe",
              "Le/la moins + adj + de",
              "Comparaison antar kota/negara francophone",
              "Cultural: 'le meilleur fromage de France'",
            ]],
            [12, "Quantités & Mesures (Kuantitas & Ukuran)", [
              "Beaucoup, peu, assez, trop",
              "Un kilo, un demi-kilo, un litre, une douzaine",
              "Numerals besar: cent, mille, un million",
              "Mata uang: euro (€) — francophone Eropa & Afrika",
            ]],
            [13, "Impératifs de Base (Imperatif Dasar)", [
              "Tu: parle, mange, finis, prends",
              "Vous: parlez, mangez, finissez, prenez",
              "Nous (let's): parlons, mangeons",
              "Konteks: instruksi, resep, perintah",
            ]],
            [14, "Pronoms COD (Pronoun Objek Langsung)", [
              "Le, la, les — menggantikan objek langsung",
              "Posisi: sebelum verba terkonjugasi",
              "Je le vois / Je la connais / Je les achète",
              "Latihan transformasi kalimat",
            ]],
            [15, "Le Passé Composé (Past Tense Komposit)", [
              "Auxiliaire AVOIR: j'ai, tu as, il a + participe passé",
              "Auxiliaire ÊTRE: 14 verba (DR & MRS VANDERTRAMP)",
              "Participe passé: -é (-er), -i (-ir), -u (-re)",
              "J'ai mangé / Je suis allé(e) — accord avec être",
            ]],
            [16, "Révision A1 Complète (Review A1 Lengkap)", [
              "Review semua A1.1, A1.2, A1.3 (48 sesi)",
              "Mini-présentation 3 menit: 'Ma vie, ma famille, mes loisirs'",
              "Cultural capstone: la Francophonie & Journée Internationale",
              "Persiapan masuk A2 — ekspektasi level intermédiaire",
            ]],
          ]),
        },
      ],
    },
    {
      code: "A2",
      title: "A2 — Élémentaire (Dasar Lanjutan)",
      description:
        "Memperluas kemampuan komunikasi sehari-hari: bercerita tentang masa lalu (passé composé vs imparfait), menjelajah gastronomi Prancis, dan mulai menguasai filler words dasar (euh, bah, alors) agar percakapan kedengaran natural.",
      sublevels: [
        {
          code: "A2.1",
          title: "Routines & Loisirs (Rutinitas & Waktu Luang)",
          preview: false,
          sessions: titleOnly(16, "Routines & Loisirs"),
        },
        {
          code: "A2.2",
          title: "Gastronomie & Culture Française (Gastronomi & Budaya Prancis)",
          preview: false,
          sessions: titleOnly(16, "Gastronomie & Culture Française"),
        },
        {
          code: "A2.3",
          title: "Voyages & Transports (Perjalanan & Transportasi)",
          preview: false,
          sessions: titleOnly(16, "Voyages & Transports"),
        },
        {
          code: "A2.4",
          title: "Imparfait & Passé Composé (Bentuk Lampau Naratif)",
          preview: false,
          sessions: titleOnly(16, "Imparfait & Passé Composé"),
        },
      ],
    },
    {
      code: "B1",
      title: "B1 — Intermédiaire (Menengah)",
      description:
        "Mencapai kemandirian berbahasa: menguasai modus subjonctif (milestone besar bahasa Prancis), berdiskusi tentang isu sosial-budaya, dan menggunakan discourse markers (en fait, du coup, quoi) seperti penutur asli.",
      sublevels: [
        {
          code: "B1.1",
          title: "Santé & Bien-être (Kesehatan & Kesejahteraan)",
          preview: false,
          sessions: titleOnly(16, "Santé & Bien-être"),
        },
        {
          code: "B1.2",
          title: "Travail & Études (Pekerjaan & Studi)",
          preview: false,
          sessions: titleOnly(16, "Travail & Études"),
        },
        {
          code: "B1.3",
          title: "Subjonctif: Introduction (Pengantar Modus Subjonctif)",
          preview: false,
          sessions: titleOnly(16, "Subjonctif: Introduction"),
        },
        {
          code: "B1.4",
          title: "Médias & Technologie (Media & Teknologi)",
          preview: false,
          sessions: titleOnly(16, "Médias & Technologie"),
        },
        {
          code: "B1.5",
          title: "Traditions & Festivals (Tradisi & Festival)",
          preview: false,
          sessions: titleOnly(16, "Traditions & Festivals"),
        },
      ],
    },
    {
      code: "B2",
      title: "B2 — Intermédiaire Avancé (Menengah Atas)",
      description:
        "Berkomunikasi dengan kelancaran dan presisi: subjonctif lanjutan, debat ala Prancis, analisis sastra & sinema (Hugo, Camus, Nouvelle Vague), serta memahami variasi regional dari Paris hingga Québec dan Afrika francophone.",
      sublevels: [
        {
          code: "B2.1",
          title: "Subjonctif Avancé & Conditionnel (Subjonctif Lanjutan & Kondisional)",
          preview: false,
          sessions: titleOnly(16, "Subjonctif Avancé & Conditionnel"),
        },
        {
          code: "B2.2",
          title: "Monde Professionnel (Dunia Profesional)",
          preview: false,
          sessions: titleOnly(16, "Monde Professionnel"),
        },
        {
          code: "B2.3",
          title: "Société & Actualité (Masyarakat & Isu Terkini)",
          preview: false,
          sessions: titleOnly(16, "Société & Actualité"),
        },
        {
          code: "B2.4",
          title: "Art, Cinéma & Littérature (Seni, Sinema & Sastra)",
          preview: false,
          sessions: titleOnly(16, "Art, Cinéma & Littérature"),
        },
        {
          code: "B2.5",
          title: "Débat & Argumentation (Debat & Argumentasi)",
          preview: false,
          sessions: titleOnly(16, "Débat & Argumentation"),
        },
        {
          code: "B2.6",
          title: "Variétés Régionales (Variasi Regional Bahasa Prancis)",
          preview: false,
          sessions: titleOnly(16, "Variétés Régionales"),
        },
        {
          code: "B2.7",
          title: "French Mastery (Penguasaan Bahasa Prancis)",
          preview: false,
          sessions: titleOnly(16, "French Mastery"),
        },
      ],
    },
  ],
};

export default curriculum;

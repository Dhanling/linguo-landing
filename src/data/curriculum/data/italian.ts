import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============================================================================
// A1 — Elementary Foundation (3 sublevels × 16 = 48 sesi)
// ============================================================================

const a1_1 = toSessions([
  [1, "L'alfabeto italiano", ["21 huruf base (j k w x y bukan native — cuma di kata pinjaman: jolly, weekend, taxi, yoga)", "c/g hard vs soft (casa vs cena, gatto vs gente)", "Doppie consonanti phonemic: pala (sekop) vs palla (bola)", "Lettere straniere k=cappa, w=doppia vu"]],
  [2, "Pronuncia + vocali", ["5 vocali murni: a-e-i-o-u (selalu jelas, no schwa)", "Vocali aperte vs chiuse: è (perché) vs é (caffè), ò (cosa) vs ó (sole)", "Diftonghi: ai, ei, oi, au, eu", "Accento tonico — pattern stress di kata"]],
  [3, "Saluti + presentazioni", ["Ciao (informal), Buongiorno (sampai siang), Buonasera (sore-malam), Buonanotte (mau tidur)", "Salve — semi-formal universal", "Piacere di conoscerti / Piacere mio", "Come stai? Bene grazie, e tu?"]],
  [4, "Numeri 1-20", ["Uno, due, tre, quattro, cinque, sei, sette, otto, nove, dieci", "Undici, dodici, tredici... venti", "Numero di telefono: cifra per cifra", "Operazioni: più, meno, per, diviso"]],
  [5, "Pronomi + essere", ["Io, tu, lui/lei, noi, voi, loro", "Sono, sei, è, siamo, siete, sono", "Sono italiano vs sono italiana (gender agreement)", "Lei formal — bukan female pronoun aja"]],
  [6, "Nome + nazionalità", ["Come ti chiami? Mi chiamo...", "Di dove sei? Sono di Jakarta / dell'Indonesia", "Aggettivi: italiano, indonesiano, americano, francese, tedesco", "Parli italiano? Sì, un po'"]],
  [7, "Giorni + mesi + ora", ["Lunedì, martedì, mercoledì, giovedì, venerdì, sabato, domenica (lowercase!)", "Gennaio... dicembre (lowercase!)", "Che ore sono? Sono le tre / È l'una", "Stagioni: primavera, estate, autunno, inverno"]],
  [8, "Avere + età + sensazioni", ["Ho, hai, ha, abbiamo, avete, hanno", "Quanti anni hai? Ho venticinque anni", "Avere fame, sete, sonno, freddo, caldo, paura", "Avere ragione vs avere torto"]],
  [9, "La famiglia", ["Padre, madre, fratello, sorella, figlio, figlia", "Nonno, nonna, zio, zia, cugino, cugina", "Aggettivi possessivi: mio padre, mia madre, i miei genitori", "Famiglia italiana — Sunday lunch tradition"]],
  [10, "Colori + accordo", ["Rosso, blu, verde, giallo, nero, bianco, grigio, marrone", "Maschile/femminile: vestito rosso vs maglia rossa", "Plurale: vestiti rossi vs maglie rosse", "Il tricolore: verde-bianco-rosso (bandiera italiana 1797)"]],
  [11, "Articoli determinativi", ["Il (maschile cons), lo (s+cons, z, gn, ps, x, y), la (femminile), l' (vocale)", "Plurale: i, gli, le", "Un, uno, una, un' (indeterminativi)", "Lo studente, lo zaino, lo psicologo — kapan pakai lo"]],
  [12, "Verbi -are regolari", ["Parlare, mangiare, lavorare, studiare, abitare, ascoltare", "Coniugazione: -o, -i, -a, -iamo, -ate, -ano", "Io parlo italiano, tu mangi pizza, lui lavora in ufficio", "Verbi più comuni daily life"]],
  [13, "Negazione + domande", ["Non + verbo (non parlo francese)", "Question with rising intonation (no aux verbs needed!)", "Question words: chi, che cosa, dove, quando, perché, come, quanto", "Risposta: sì, no, forse, certo, certamente"]],
  [14, "Al bar italiano", ["Vorrei un caffè per favore", "Espresso (default 'caffè'), cappuccino, macchiato, corretto (with grappa)", "Cornetto vs brioche (regional naming)", "Pay at cassa first, then bring receipt to bar"]],
  [15, "Numeri 20-1000 + prezzi", ["Venti, trenta, quaranta... cento", "Duecento, trecento... mille", "Quanto costa? Costa 5 euro / Costano 12 euro", "Sconto, offerta, saldi (sale season)"]],
  [16, "Review A1.1 + Italia geografica", ["Recap alfabeto + pronuncia + greetings + numeri", "20 regioni italiane intro (overview)", "Roma capitale, Milano economic capital", "Italia: forma a stivale, Mediterranean center"]],
]);

const a1_2 = toSessions([
  [17, "Routine quotidiana", ["Mi sveglio, mi alzo, faccio colazione, vado al lavoro", "Pranzo (lunch big meal!), cena (dinner lighter)", "Mattina, pomeriggio, sera, notte", "Riposino pomeridiano — pisolino culture"]],
  [18, "Verbi riflessivi", ["Lavarsi, alzarsi, vestirsi, chiamarsi, addormentarsi", "Pronomi riflessivi: mi, ti, si, ci, vi, si", "Mi lavo le mani vs lavo le mani al bambino", "Reciproci: si amano, si vedono"]],
  [19, "L'ora precisa", ["Sono le tre e mezza / Sono le tre e quindici", "È mezzogiorno (12pm), È mezzanotte (12am)", "A che ora? Alle otto, a mezzogiorno", "24-hour format common di transportasi/TV"]],
  [20, "Cibo italiano base", ["Pane, pasta, pizza, riso, polenta", "Verdure, frutta, carne, pesce, formaggio", "Olio d'oliva (extra vergine), parmigiano, mozzarella", "Mangiare bene — Italian food philosophy"]],
  [21, "Al ristorante", ["Antipasto, primo (pasta/riso), secondo (carne/pesce) + contorno, dolce, caffè", "Vorrei ordinare / Cosa mi consiglia?", "Il conto per favore — coperto + servizio", "Mancia? Rarely — 10% only for excellent service"]],
  [22, "Pasta regionale", ["Spaghetti (Roma), tagliatelle (Bologna), orecchiette (Puglia), trofie (Liguria)", "Carbonara, amatriciana, cacio e pepe (Roma), bolognese, pesto (Genova)", "Al dente — firm to the bite", "Pasta secca (dried) vs pasta fresca (egg dough)"]],
  [23, "La casa", ["Camera (da letto), cucina, bagno, salotto, sala da pranzo, balcone", "Tavolo, sedia, letto, divano, armadio, frigorifero", "Casa vs appartamento — apartment majority urban", "Cortile, terrazza, mansarda"]],
  [24, "Posti + preposizioni", ["A, in, da, di, su, per, con, tra/fra", "Vado a Roma (city), sono in Italia (country)", "Da Marco — chez Marco", "Articulated: del, della, dello, dei, delle, degli"]],
  [25, "Tempo atmosferico", ["Che tempo fa? Fa caldo / fa freddo / piove / nevica / c'è il sole", "Stagioni weather: estate calda, inverno freddo al nord", "Tramontana, scirocco — venti italiani", "Climate diversity: Alps neve vs Sicilia caldo year-round"]],
  [26, "Vestiti + moda", ["Camicia, pantaloni, gonna, vestito, scarpe, stivali", "Cappotto, giacca, maglione, t-shirt, jeans", "Che taglia? La 40, la 42 (Italian sizing)", "Italian fashion: Milano capital, brioso ma elegant"]],
  [27, "Corpo umano", ["Testa, occhi, naso, bocca, orecchie, capelli", "Braccia (le braccia — irregolare!), mani, gambe, piedi", "Cuore, stomaco, schiena, gola", "Mi fa male la testa / mi fanno male i piedi"]],
  [28, "Dal medico", ["Ho mal di testa / di stomaco / di gola / di pancia", "Farmacia (croce verde) vs medico di base (GP)", "Ricetta (prescription), pronto soccorso (ER)", "SSN — Servizio Sanitario Nazionale, universal coverage"]],
  [29, "Fare la spesa", ["Supermercato, mercato (rionale), panetteria, macelleria, salumeria, fruttivendolo", "Un chilo, mezzo chilo, un etto (100g), grammi", "Vorrei mezzo chilo di pomodori per favore", "Esselunga, Conad, Coop — main chains"]],
  [30, "Soldi + euro", ["Banconote (5, 10, 20, 50, 100, 200), monete + centesimi", "Pagare in contanti / con la carta", "Bancomat (debit), carta di credito, contactless ovunque", "Italia adottò l'euro 2002 — addio lira"]],
  [31, "Verbi -ere regolari", ["Leggere, scrivere, vivere, prendere, mettere, vedere", "Coniugazione: -o, -i, -e, -iamo, -ete, -ono", "Leggo un libro, prendo il treno", "-ere stress patterns: leggere vs vedere"]],
  [32, "Review A1.2 + colazione", ["Recap routine + cibo + casa", "Colazione italiana = piccola: caffè + cornetto/biscotti", "Cappuccino HANYA mattina (cultural rule!)", "Stand at bar (cheaper) vs sit at table (servizio)"]],
]);

const a1_3 = toSessions([
  [33, "Verbi -ire regolari", ["Dormire, sentire, partire, aprire, offrire", "Coniugazione: -o, -i, -e, -iamo, -ite, -ono", "Verbi -isco: finire, capire, preferire, pulire", "Finisco il libro, capisci l'italiano?"]],
  [34, "Hobby + mi piace", ["Mi piace + infinito (mi piace leggere)", "Mi piace + nome singolare (mi piace il caffè)", "Mi piacciono + plurale (mi piacciono i film)", "Hobby comuni: leggere, viaggiare, cucinare, sport"]],
  [35, "Sport", ["Il calcio (soccer — religione italiana)", "Serie A — Juventus, Inter, Milan, Roma, Napoli", "Tennis, ciclismo (Giro d'Italia!), pallavolo, basket", "Tifoso, squadra, allenatore, partita, gol"]],
  [36, "Musica + opera intro", ["Generi: pop, rock, classica, lirica, rap, indie", "Opera italiana — eredità unica al mondo", "Verdi, Puccini, Rossini — i tre giganti", "La Scala (Milano), San Carlo (Napoli), Arena Verona"]],
  [37, "Cinema italiano", ["Neorealismo: Rossellini, De Sica, Visconti", "Fellini — La Dolce Vita, 8½, La Strada", "Sorrentino — La Grande Bellezza, È Stata la Mano di Dio", "Cinema vs film, regista, attore/attrice"]],
  [38, "Libri + Dante", ["Lettura, leggere, libro, romanzo, poesia, saggio", "Dante Alighieri — La Divina Commedia (1320)", "Inferno, Purgatorio, Paradiso — 3 cantiche", "Padre della lingua italiana — Tuscan dialect → standard"]],
  [39, "Passato prossimo intro", ["Aux (essere/avere) + participio passato", "Avere: ho mangiato, ho letto, ho visto", "-are → -ato, -ere → -uto, -ire → -ito", "Ieri ho mangiato la pizza"]],
  [40, "Avere vs essere ausiliare", ["Avere — verbi transitivi (mangiare, leggere, vedere)", "Essere — verbi movimento + reflexive (andare, venire, partire, alzarsi)", "Sono andato vs ho mangiato", "Past participle agreement with essere: sono andata (f)"]],
  [41, "Ieri + vocab passato", ["Ieri, l'altro ieri, la settimana scorsa, il mese scorso, l'anno scorso", "Stamattina, ieri sera, ieri pomeriggio", "Qualche giorno fa, due settimane fa", "Già, ancora, mai, sempre"]],
  [42, "Viaggi base", ["Aeroporto, stazione, treno, aereo, autobus, metro", "Biglietto, andata, ritorno, andata e ritorno", "Partire da / arrivare a", "Trenitalia + Italo — high-speed network"]],
  [43, "Indicazioni stradali", ["A destra, a sinistra, dritto, indietro", "Vicino, lontano, qui, lì, davanti, dietro", "Scusi, dov'è...?", "Mappa, GPS — Italian historic centers complicated!"]],
  [44, "Trasporti pubblici", ["Biglietto da obliterare (validate!)", "Metro: Roma A/B/C, Milano M1-M5", "Tram, autobus, filobus", "Trenitalia (Frecciarossa, Frecciargento, regionale), Italo"]],
  [45, "Città italiane intro", ["Roma — Eternal City, capitale, Vaticano", "Milano — moda + finanza", "Venezia — canali, Murano, Burano", "Firenze — Rinascimento, Uffizi, Ponte Vecchio"]],
  [46, "Verbi irregolari comuni", ["Andare: vado, vai, va, andiamo, andate, vanno", "Venire: vengo, vieni, viene, veniamo, venite, vengono", "Fare: faccio, fai, fa, facciamo, fate, fanno", "Dare, dire, stare, sapere"]],
  [47, "Verbi modali", ["Potere — kemampuan/permission (posso entrare?)", "Volere — keinginan (voglio un caffè)", "Dovere — kewajiban (devo studiare)", "Modal + infinito (no preposisi!)"]],
  [48, "Review A1.3 + gesti italiani", ["Recap hobby + passato + viaggi", "Gesti italiani — komunikasi non-verbal", "Mano a tulipano (che vuoi?), bacio dita (perfetto)", "Spalle (chi se ne frega), corni (scaramanzia)"]],
]);

// ============================================================================
// A2 — Pre-Intermediate (4 sublevels × 16 = 64 sesi)
// ============================================================================

const a2_1 = toSessions([
  [49, "Imperfetto tense", ["Coniugazione: -avo/-evo/-ivo... -avano/-evano/-ivano", "Mangiavo, leggevo, dormivo (regulars)", "Ero, avevo, facevo, dicevo (irregolari)", "Past continuous + habit: quando ero piccolo..."]],
  [50, "Imperfetto vs passato prossimo", ["Imperfetto — durata, habit, descrizione background", "Passato prossimo — azione completa, finita", "Mentre studiavo, è suonato il telefono", "Common signal words for each"]],
  [51, "Ricordi d'infanzia", ["Da bambino, da piccolo", "Giochi: nascondino, mosca cieca, palline", "Scuola elementare, asilo", "Famiglia, nonni, vacanze estate"]],
  [52, "Descrizioni persone + luoghi", ["Aspetto fisico: alto, basso, magro, grasso, biondo, bruno", "Carattere: simpatico, gentile, generoso, timido", "Luoghi: bello, brutto, grande, piccolo, antico, moderno", "Borgo medievale tipico — caratteristiche"]],
  [53, "Comparazioni", ["Più... di (Roma è più grande di Firenze)", "Meno... di (Milano è meno calda di Napoli)", "Come — equality (Marco è alto come Luca)", "Migliore/peggiore (better/worse)"]],
  [54, "Superlativi", ["Relativo: il più... di (il più bel monumento d'Italia)", "Assoluto: -issimo (bellissimo, bravissimo, buonissimo)", "Migliore, ottimo, pessimo (irregular)", "Roma è la città più antica"]],
  [55, "Moda italiana", ["Armani — Giorgio Armani Milano", "Versace — Donatella, Gianni heritage", "Prada, Gucci (Firenze), Dolce & Gabbana", "Settimana della moda Milano (Feb + Sep)"]],
  [56, "Design italiano", ["Ferrari — Modena/Maranello, Enzo Ferrari heritage", "Vespa — Piaggio 1946, Pontedera", "Alessi — kitchenware design icons", "Olivetti — typewriter pioneer + design heritage"]],
  [57, "Rinascimento overview", ["Periodo: 14th-16th century", "Centri: Firenze (Medici), Roma (Papi), Venezia, Milano (Sforza)", "Mecenati — i Medici di Firenze", "Umanesimo — riscoperta dei classici"]],
  [58, "Da Vinci + Michelangelo", ["Leonardo — Monna Lisa, Cenacolo, polymath", "Michelangelo — David (Firenze), Pietà, Cappella Sistina", "Vinci (LV birthplace), Caprese (M birthplace)", "Vasari — Le Vite (1550) biografi artisti"]],
  [59, "Vaticano + Cappella Sistina", ["Stato Città del Vaticano — smallest country world", "Basilica di San Pietro — Bramante, Bernini, Maderno", "Cappella Sistina — Michelangelo soffitto + Giudizio Universale", "Musei Vaticani — 70.000+ opere"]],
  [60, "Storia dell'arte italiana", ["Pittura, scultura, architettura, mosaico, affresco", "Tela, pennello, colori, scolpire", "Galleria, museo, mostra, esposizione", "Uffizi Firenze, Vaticani Roma, Brera Milano"]],
  [61, "Pronomi diretti", ["Lo, la, li, le — direct objects", "Lo vedo (him/it), la conosco (her), li compro (them m), le mangio (them f)", "Position: before verb, attached to infinitive", "Lo vedo / Voglio vederlo"]],
  [62, "Pronomi indiretti", ["Mi, ti, gli (a lui), le (a lei), ci, vi, gli (a loro)", "Telefono a Marco → gli telefono", "Verbi con preposizione 'a': parlare a, regalare a", "Mi piace — actually 'piace a me'"]],
  [63, "Combinazioni di pronomi", ["Indiretto + diretto: me lo, te la, glielo, gliela", "Glielo/Gliela — combina (a lui/a lei) + (lo/la)", "Position rules con ausiliari + modal", "Practice scenarios"]],
  [64, "Review A2.1 + tour Roma", ["Recap imperfetto + comparisons + pronouns", "Roma — Colosseo, Foro Romano, Pantheon", "Trastevere, Piazza Navona, Piazza di Spagna", "Fontana di Trevi — lancia moneta, ritornerai"]],
]);

const a2_2 = toSessions([
  [65, "Futuro semplice", ["Coniugazione: -erò, -erai, -erà, -eremo, -erete, -eranno", "Andrò, sarò, avrò, farò (irregolari)", "Probabilità: sarà già a casa (he must be home)", "Futuro vs presente con valore futuro"]],
  [66, "Pianificare un viaggio", ["Voglio andare in Italia per due settimane", "Itinerario, agenzia di viaggi, prenotare", "Visto, passaporto, valigia, zaino", "Assicurazione di viaggio, vaccinazioni"]],
  [67, "Prenotare hotel", ["Camera singola / doppia / matrimoniale", "Con bagno, con vista, con balcone", "Mezza pensione, pensione completa, solo colazione", "Booking.com, Agriturismo, B&B, ostello"]],
  [68, "All'aeroporto", ["Check-in, gate, imbarco, bagaglio a mano", "Bagaglio in stiva, deposito bagagli", "Sicurezza, dogana, controllo passaporti", "Aeroporti: Fiumicino (Roma), Malpensa (Milano), Marco Polo (Venezia)"]],
  [69, "Toscana", ["Capitale Firenze, capoluogo culturale", "Siena — Palio (corsa cavalli, agosto)", "Pisa — Torre pendente, Piazza dei Miracoli", "Chianti, Val d'Orcia, San Gimignano"]],
  [70, "Vino + enoturismo", ["Vino rosso, bianco, rosato, spumante, prosecco", "DOC, DOCG, IGT — qualità classification", "Regioni vinicole: Toscana (Chianti), Piemonte (Barolo), Veneto (Prosecco)", "Enoteca, cantina, degustazione"]],
  [71, "Professioni", ["Medico, avvocato, ingegnere, architetto, professore", "Operaio, impiegato, dirigente, imprenditore", "Studente, casalinga, pensionato, disoccupato", "Posto fisso ideal — Italian career culture"]],
  [72, "Colloquio di lavoro", ["Curriculum vitae (CV), lettera di presentazione", "Esperienza, competenze, formazione", "Quanto guadagna? — rare to ask directly", "Periodo di prova, contratto a tempo indeterminato vs determinato"]],
  [73, "Ufficio + lavoro", ["Scrivania, computer, stampante, telefono", "Riunione, presentazione, scadenza, progetto", "Collega, capo, dipendente, cliente", "Ferie (vacation), permesso, malattia"]],
  [74, "Cultura del lavoro", ["Orario lavoro: 9-13, 14-18 tipico", "Pausa pranzo lunga (1-2 ore)", "Ferragosto (15 agosto) — Italy shuts down", "Tredicesima — 13th month salary (pre-Natale)"]],
  [75, "Email formale", ["Egregio Signor / Gentile Signora", "Oggetto, allegato, cordiali saluti", "Distinti saluti (very formal closing)", "PEC — Posta Elettronica Certificata (legal email)"]],
  [76, "Condizionale presente", ["Coniugazione: -erei, -eresti, -erebbe, -eremmo, -ereste, -erebbero", "Vorrei, potrei, dovrei, sarei, avrei (common)", "Polite requests + hypothetical", "Vorrei un caffè vs voglio un caffè — politeness"]],
  [77, "Richieste educate", ["Vorrei + infinito / nome", "Potrebbe + infinito (could you?)", "Sarebbe possibile...?", "Mi farebbe un favore?"]],
  [78, "Negoziare", ["Si potrebbe fare uno sconto? (any discount?)", "Mi sembra un po' caro", "Sarebbe disposto a...?", "Italian markets — bargaining at street markets only"]],
  [79, "Aziende italiane", ["Fiat (ora Stellantis) — Torino, Agnelli family", "Ferrari (Modena), Lamborghini (Bologna), Maserati", "Lavazza, Illy — caffè", "Barilla — pasta giant, Parma headquarters"]],
  [80, "Review A2.2 + Milano business", ["Recap futuro + condizionale + work", "Milano — capitale economica + finanziaria", "Duomo, Galleria Vittorio Emanuele, Navigli", "Settimana della moda + design week (aprile)"]],
]);

const a2_3 = toSessions([
  [81, "Congiuntivo presente intro", ["Coniugazione: -i/-i/-i, -iamo/-iate/-ino (-are)", "-a/-a/-a, -iamo/-iate/-ano (-ere/-ire)", "Sia, abbia, faccia, vada (irregolari)", "Subjunctive — soggettività, dubbio, opinione"]],
  [82, "Esprimere opinioni", ["Penso che + congiuntivo (penso che sia vero)", "Credo che, ritengo che, suppongo che", "Secondo me + indicativo (secondo me è vero)", "Mi sembra che + congiuntivo"]],
  [83, "Emozioni vocabulario", ["Felice, contento, triste, arrabbiato, stanco, annoiato", "Sorpreso, deluso, preoccupato, geloso, innamorato", "Verbi: amare, odiare, mancare, sentire la mancanza", "Sentimento — Italian emotional vocabulary rich"]],
  [84, "Speranze + desideri", ["Spero che + congiuntivo (spero che venga)", "Voglio che, desidero che, preferisco che", "Magari! (I wish!)", "Sognare di + infinito"]],
  [85, "Dubbio + incertezza", ["Forse, può darsi, probabilmente", "Non sono sicuro che + congiuntivo", "Dubito che + congiuntivo", "Sembra / pare che + congiuntivo"]],
  [86, "Imperativo", ["Tu form: parla! prendi! dormi!", "Lei form: parli! prenda! dorma! (uses cong. present)", "Voi form: parlate! prendete! dormite!", "Negative tu: non parlare! (uses infinito)"]],
  [87, "Dare consigli", ["Dovresti + infinito (you should)", "Ti consiglio di + infinito", "Se fossi in te... (if I were you)", "Perché non...? (why don't you?)"]],
  [88, "Disaccordo educato", ["Non sono d'accordo, ma...", "Capisco il tuo punto, però...", "Mi dispiace, ma non condivido", "Italian conversation — agreement signaling important"]],
  [89, "Cultura del dibattito", ["Italians love passionate debate — not personal attack", "Talking over each other = engagement, not rudeness", "Politics, soccer, food — favorite topics", "Salotto — living room debate tradition"]],
  [90, "Politica italiana base", ["Repubblica parlamentare dal 1946", "Presidente: Mattarella (rappresentanza)", "Primo Ministro: Meloni (governo, Fratelli d'Italia)", "Parlamento: Camera + Senato"]],
  [91, "Giornali italiani", ["Corriere della Sera (Milano), La Repubblica (Roma)", "Il Sole 24 Ore — economico", "Gazzetta dello Sport, Tuttosport — sport", "La Stampa, Il Messaggero, Il Fatto Quotidiano"]],
  [92, "Verbi di opinione", ["Credere, pensare, ritenere, supporre + che + cong", "Sapere, sentire, vedere + che + indicativo (fatto)", "È importante che + cong vs è certo che + ind", "Subjunctive trigger words list"]],
  [93, "Verbi riflessivi emotivi", ["Arrabbiarsi (get angry), preoccuparsi (worry)", "Innamorarsi (fall in love), divertirsi (have fun)", "Annoiarsi (get bored), stancarsi (get tired)", "Sentirsi + aggettivo (mi sento bene)"]],
  [94, "Lamentarsi", ["Mi lamento di, mi lamento che + cong", "Che peccato! Che brutto! Mannaggia!", "Non ce la faccio più (I can't take it anymore)", "Italian complaining style — vivid, expressive"]],
  [95, "Scusarsi", ["Mi scusi (formal), scusami (informal), scusa", "Mi dispiace molto, sono spiacente", "Ti chiedo scusa, perdonami", "Non importa, non c'è problema, figurati"]],
  [96, "Review A2.3 + caffè conversation", ["Recap congiuntivo + opinion + politeness", "Al bar — conversation hub", "Topics: meteo, sport, politica, family, food", "Mai parlare di soldi direttamente — taboo"]],
]);

const a2_4 = toSessions([
  [97, "Impero Romano base", ["Fondazione 753 a.C. — Romolo e Remo", "Repubblica → Impero (27 a.C. Augusto)", "Caduta Impero d'Occidente 476 d.C.", "Eredità: diritto, latino, infrastrutture"]],
  [98, "Roma antica vocab", ["Foro, Colosseo, Pantheon, terme, acquedotti", "Imperatore, senato, console, gladiatore", "Legione, centurione, soldato", "SPQR — Senatus Populusque Romanus"]],
  [99, "Il Rinascimento", ["Periodo: 14th-16th century", "Centri: Firenze, Roma, Venezia, Milano", "Mecenati Medici, Sforza, Papi", "Riscoperta dei classici greci e romani"]],
  [100, "Risorgimento + unità d'Italia", ["1815-1871 — movimento unificazione", "Cavour (statista), Mazzini (idealista), Garibaldi (eroe militare)", "1861 — Regno d'Italia proclamato", "1870 — Roma capitale (presa di Porta Pia)"]],
  [101, "Le due guerre mondiali", ["WWI: Italia entra 1915, vince ma 'vittoria mutilata'", "Fascismo: Mussolini 1922-1943", "WWII: alleata Germania, poi 1943 cambio fronte", "Resistenza — partigiani contro nazifascismo"]],
  [102, "Repubblica Italiana moderna", ["1946 — referendum monarchia vs repubblica, repubblica vince", "1948 — Costituzione entrata in vigore", "Miracolo economico anni '50-'60", "Anni di Piombo — terrorismo anni '70"]],
  [103, "Le 20 regioni", ["5 regioni a statuto speciale: Sicilia, Sardegna, Valle d'Aosta, Trentino-Alto Adige, Friuli-V.G.", "Capoluoghi: Roma (Lazio), Milano (Lombardia), Napoli (Campania), Torino (Piemonte)", "Differenze marcate Nord-Sud", "Identità regionali fortissime"]],
  [104, "Nord Italia", ["Lombardia — Milano economic capital, Lago di Como", "Veneto — Venezia, Verona, Padova, Treviso", "Piemonte — Torino, vino Barolo, Slow Food origine", "Emilia-Romagna — Bologna, Parma, food valley"]],
  [105, "Centro Italia", ["Toscana — Firenze, Siena, Pisa, Chianti", "Lazio — Roma, Vaticano, Tivoli, Frascati", "Umbria — Perugia, Assisi (San Francesco)", "Marche — Ancona, Urbino (Raffaello)"]],
  [106, "Sud + Isole", ["Campania — Napoli, Pompei, Costiera Amalfitana, Capri", "Puglia — Bari, Lecce barocco, trulli Alberobello", "Calabria — punta dello stivale, mare cristallino", "Sicilia — Palermo, Etna, mosaici Monreale | Sardegna — Cagliari, Costa Smeralda"]],
  [107, "Cucina regionale", ["Nord: risotto (Milano), polenta (Veneto), tortellini (Bologna)", "Centro: bistecca alla fiorentina, cacio e pepe (Roma)", "Sud: pizza napoletana, orecchiette (Puglia)", "Sicilia: arancini, cannoli, granita"]],
  [108, "Feste tradizionali", ["Carnevale Venezia — maschere, gondole", "Palio di Siena — 2 luglio + 16 agosto, corse cavalli", "Sagra — village food festival summer", "Festa della Repubblica 2 giugno"]],
  [109, "Natale + Pasqua", ["Natale: presepe (vs albero), tombola, panettone, pandoro", "Vigilia di Natale: cenone di pesce", "Pasqua: colomba, uova di cioccolato, Pasquetta picnic", "Befana — Epifania 6 gennaio, calza con dolci"]],
  [110, "Cultura cattolica", ["89% nominally Catholic, ~25% practicing", "Patroni città: Sant'Ambrogio Milano, San Gennaro Napoli", "Battesimo, comunione, cresima — sacramenti", "Domenica messa — declining but cultural"]],
  [111, "Vaticano + Papa", ["Stato Città del Vaticano — 1929 Patti Lateranensi", "Papa Francesco — primo Papa sudamericano (2013-)", "Cardinali, conclave, fumata bianca", "Audienza papale, Angelus, benedizione Urbi et Orbi"]],
  [112, "Review A2.4 + La Dolce Vita", ["Recap storia + regioni + cultura", "La Dolce Vita 1960 — Fellini film + concetto", "Anita Ekberg fontana Trevi scene iconic", "Paparazzi — termine inventato da Fellini film"]],
]);

// ============================================================================
// B1 — Intermediate (5 sublevels × 16 = 80 sesi)
// ============================================================================

const b1_1 = toSessions([
  [113, "Trapassato prossimo", ["Avevo/ero + participio passato", "Past-before-past: avevo mangiato quando è arrivato", "Sequence in narration", "Quando + trapassato"]],
  [114, "Concordanza dei tempi", ["Present → present", "Imperfetto + passato prossimo coordination", "Past → past via imperfetto + trapassato", "Italian tense system overview"]],
  [115, "Connettivi", ["Perché (because) vs perché (why)", "Siccome, dato che, poiché (since)", "Mentre (while), tuttavia (however), però (but)", "Quindi, allora, dunque (so/then)"]],
  [116, "Raccontare storie", ["C'era una volta... (once upon a time)", "All'improvviso, dopo un po', alla fine", "Si svegliò, si alzò, decise (past historic narrative)", "Verbi narrative: succedere, accadere, capitare"]],
  [117, "Fiabe italiane + Pinocchio", ["Pinocchio — Collodi 1881, Collodi village toscano", "Le Avventure di Pinocchio — burattino, Geppetto, Fata Turchina", "Il Grillo Parlante, Lucignolo, Mangiafuoco", "Pinocchio symbol of Italian children's literature"]],
  [118, "Italo Calvino", ["Cuba-born italiano (1923-1985), Sanremo", "Trilogia degli antenati: Visconte dimezzato, Barone rampante, Cavaliere inesistente", "Le Città invisibili, Se una notte d'inverno", "Fiabe italiane — 200 raccolte regionali"]],
  [119, "Cesare Pavese", ["1908-1950, Piemonte", "La luna e i falò, Il mestiere di vivere (diario)", "Neorealismo + temi: ritorno, mito, langhe", "Suicide Torino, Premio Strega postumo"]],
  [120, "Condizionale passato", ["Avrei/sarei + participio passato", "Sarei venuto, avrei mangiato", "Future-in-the-past (he said he would come)", "Mi avrebbe detto che..."]],
  [121, "Periodo ipotetico tipo I", ["Realtà — se + indicativo, indicativo/imperativo", "Se piove, prendo l'ombrello", "Se vieni, ti aspetto", "Most common in daily Italian"]],
  [122, "Periodo ipotetico tipo II", ["Possibilità — se + cong. imperf., condizionale presente", "Se avessi tempo, viaggerei", "Se fossi ricco, comprerei una villa", "Hypothetical present-future"]],
  [123, "Forma passiva", ["Essere + participio passato + da", "La pizza è preparata dal cuoco", "Venire + participio passato (alternativo)", "Andare passive — obligation: va fatto (must be done)"]],
  [124, "Si impersonale + passivante", ["Si mangia bene in Italia (impersonal)", "Si parla italiano (passive sense)", "Si dice che... (it is said)", "Italian way to avoid passive heavy"]],
  [125, "Discorso indiretto", ["Diretto: Marco dice 'Sono stanco'", "Indiretto: Marco dice che è stanco", "Past reporting: ha detto che era stanco", "Time shift di tutti i tempi"]],
  [126, "Pronomi complessi", ["Ne — partitivo, di+pronoun (ne ho due, ne parlo)", "Ci — locative + a+pronoun (ci vado, ci credo)", "Ci + ne: ce ne sono (there are some)", "Pronouns combinatorics mastery"]],
  [127, "Espressioni idiomatiche", ["In bocca al lupo! (good luck) — risposta: crepi!", "Avere le mani bucate (spendthrift)", "Costare un occhio della testa (expensive)", "Tirare il pacco (stand someone up)"]],
  [128, "Review B1.1 + umorismo italiano", ["Recap trapassato + ipotetico + idioms", "Italian humor — sarcasmo, ironia, doppi sensi", "Stand-up: Crozza, Zalone, Zerocalcare", "Barzellette regionali — northern stinginess, southern passion clichés"]],
]);

const b1_2 = toSessions([
  [129, "Cinema neorealismo", ["1943-1954 period, post-war reality", "Rossellini — Roma città aperta, Paisà, Germania anno zero", "De Sica — Ladri di biciclette, Sciuscià, Umberto D.", "Visconti — Ossessione, La Terra trema"]],
  [130, "Cinema italiano moderno", ["Sorrentino — La Grande Bellezza (Oscar 2014), Loro, È Stata la Mano di Dio", "Garrone — Gomorra, Pinocchio, Io Capitano", "Moretti — Caro Diario, La Stanza del Figlio", "Tornatore — Nuovo Cinema Paradiso, La Leggenda del Pianista sull'Oceano"]],
  [131, "Canzone d'autore", ["Cantautori — tradizione poetica musicale", "Fabrizio De André — La Buona Novella, Crêuza de mä, libertarian", "Lucio Battisti, Lucio Dalla, Francesco De Gregori", "Franco Battiato — colto, mistico, sperimentale"]],
  [132, "Pop italiano moderno", ["Vasco Rossi — rock italiano icon, Modena", "Ligabue, Jovanotti — pop-rock mainstream", "Måneskin — Eurovision 2021 winners, glam-rock", "Mahmood, Marco Mengoni — moderni Sanremo"]],
  [133, "Opera italiana", ["Verdi — La Traviata, Aida, Rigoletto, Nabucco", "Puccini — Tosca, La Bohème, Madama Butterfly, Turandot", "Rossini — Il Barbiere di Siviglia, Guglielmo Tell", "Bel canto tradition — Bellini, Donizetti"]],
  [134, "Teatro italiano", ["Goldoni — riforma commedia 1700s, La Locandiera", "Pirandello — Sei personaggi, Enrico IV (Nobel 1934)", "Eduardo De Filippo — teatro napoletano", "Dario Fo — Nobel 1997, Morte accidentale di un anarchico"]],
  [135, "Calcio + Serie A", ["Serie A — 20 squadre, scudetto championship", "Juventus (Torino) — 36 scudetti record", "Inter + AC Milan (Milano) derby", "Nazionale — 4 Coppe del Mondo (1934, 1938, 1982, 2006), Europei 2020"]],
  [136, "Settimana della moda", ["Milano Fashion Week — Febbraio + Settembre", "Pitti Uomo Firenze — menswear", "Sfilate — Armani, Versace, Prada, Gucci, Valentino", "Vogue Italia — heritage rivista"]],
  [137, "Filosofia design italiano", ["Form + function — Bauhaus heritage + Italian flair", "Achille Castiglioni, Ettore Sottsass", "Memphis Group anni '80", "Italian design philosophy: la bellezza nella vita quotidiana"]],
  [138, "Filosofia gastronomica", ["Mangiare bene = vivere bene", "Stagionalità — eat what's in season", "Cucina povera — peasant origins of haute cuisine", "Genuino — authentic, traditional"]],
  [139, "Slow Food movement", ["Fondato Carlo Petrini 1986 — Bra, Piemonte", "Reazione contro fast food (anti-McDonald's Piazza Spagna 1986)", "Buono, pulito e giusto (good, clean, fair)", "Salone del Gusto Torino, presidi alimentari"]],
  [140, "Cultura espresso", ["Caffè = espresso (default)", "Caffè ristretto, lungo, macchiato, corretto, decaffeinato", "Moka — Bialetti 1933, casa italiana icon", "Mai cappuccino dopo pranzo — cultural rule"]],
  [141, "Aperitivo culture", ["Pre-cena 18-20", "Spritz (Aperol/Campari + prosecco + soda) — Veneto origin", "Stuzzichini — finger food gratuiti col drink", "Milano happy hour buffet style heritage"]],
  [142, "Umorismo + ironia", ["Italian humor — verbale + gesturale", "Ironia sottile vs comicità grossolana", "Doppi sensi, giochi di parole, allusioni", "Pernacchia, sfottò — friendly mocking"]],
  [143, "Gesti italiani decoded", ["Mano a tulipano (che vuoi?), pizzicare guancia (cute)", "Mano sotto mento (don't care), corni (jinx)", "Mano a piattino (move it)", "Italian gestures = vocabolario parallelo"]],
  [144, "Review B1.2 + caffè debate", ["Recap cultura italiana profonda", "Simulazione conversazione al bar", "Topics: ultima partita Inter, Sanremo, Meloni, food", "Italian conversation pace: rapida, sovrapposta, animata"]],
]);

const b1_3 = toSessions([
  [145, "Economia italiana", ["8th largest economy world", "PMI — piccole-medie imprese backbone", "Distretti industriali — pelletteria Toscana, ceramica Sassuolo", "Made in Italy export brand"]],
  [146, "Divario Nord-Sud", ["Mezzogiorno — Sud Italia + Sicilia + Sardegna", "PIL Nord vs Sud — differenza enorme", "Emigrazione interna Sud → Nord storica", "Cassa per il Mezzogiorno — interventi statali"]],
  [147, "Mafia + storia", ["Cosa Nostra (Sicilia), 'Ndrangheta (Calabria), Camorra (Campania), Sacra Corona Unita (Puglia)", "Origine '800s feudal society", "Falcone + Borsellino — magistrati uccisi 1992", "Maxiprocesso Palermo, 41-bis carcere duro"]],
  [148, "Movimento antimafia", ["Don Pino Puglisi, Don Ciotti Libera", "Beni confiscati — riuso sociale", "Addio Pizzo — anti-extortion movement", "Cultura legalità — scuole + società civile"]],
  [149, "Sistema scolastico", ["Asilo nido (0-3), scuola dell'infanzia (3-6)", "Elementare (5y), media (3y), superiore (5y: liceo/tecnico/professionale)", "Maturità — esame finale 18 anni", "Voti: 0-10 scale"]],
  [150, "Università italiane", ["Bologna — Alma Mater Studiorum 1088, oldest in Western world", "La Sapienza Roma — 100,000+ students", "Bocconi Milano — business private", "Iscrizione, esame, laurea triennale + magistrale, tesi"]],
  [151, "Sanità italiana", ["SSN — Servizio Sanitario Nazionale 1978", "Copertura universale, finanziato tasse", "Medico di base, specialisti, ospedale", "Ticket — co-pay sliding scale"]],
  [152, "Welfare state", ["Pensione INPS, pensione anticipata", "Disoccupazione — NASpI", "Reddito di cittadinanza (sostituito ADI 2024)", "Asili nido pubblici, scuola gratuita"]],
  [153, "Politica strutturata", ["Repubblica parlamentare bicamerale", "Camera dei Deputati (400) + Senato (200) post-2020", "Governo, opposizione, fiducia", "Crisi di governo — frequente, breve mandato medio"]],
  [154, "Partiti politici", ["Centrodestra: Fratelli d'Italia (Meloni), Lega (Salvini), Forza Italia", "Centrosinistra: PD (Schlein), M5S (Conte)", "Terzo Polo, Italia Viva, Azione", "Polarizzazione recente, frammentazione cronica"]],
  [155, "UE + Italia", ["Membro fondatore CEE 1957 — Trattati di Roma", "Eurozona dal 1999, euro fisicamente 2002", "PNRR — Piano Nazionale Ripresa e Resilienza, 200+ miliardi", "BCE Francoforte, presidente Lagarde"]],
  [156, "Emigrazione italiana", ["1876-1976: 27 milioni emigrati", "Destinazioni: USA, Argentina, Brasile, Germania, Belgio, Australia", "Little Italy NYC, Mulberry Street", "Oriundi — discendenti italiani all'estero"]],
  [157, "Immigrazione attuale", ["Italia paese di immigrazione dal 1980s", "5+ milioni stranieri residenti", "Lampedusa — hotspot mediterraneo", "Cittadinanza — ius sanguinis vs ius soli debate"]],
  [158, "Autonomia regionale", ["5 regioni a statuto speciale: Sicilia, Sardegna, Trentino-AA, FVG, Valle d'Aosta", "Tutela minoranze linguistiche", "Autonomia differenziata — dibattito attuale", "Lega Nord federalismo heritage"]],
  [159, "Ambiente + clima", ["Emergenza climatica visibile — Po prosciugato, Venezia acqua alta", "Energie rinnovabili — solare Sicilia, eolico Puglia", "Movimenti: FFF Italia, Ultima Generazione", "Parchi nazionali — Gran Paradiso, Stelvio, Pollino"]],
  [160, "Review B1.3 + attualità", ["Recap società + politica + economia", "Reading di articoli stampa quotidiana", "Vocabolario news: tasse, riforma, dl, ddl", "Following Italian current affairs autonomously"]],
]);

const b1_4 = toSessions([
  [161, "Dante Alighieri", ["1265 Firenze - 1321 Ravenna", "Esiliato Firenze 1302, mai tornato", "Divina Commedia — Inferno, Purgatorio, Paradiso", "Italian standard derived from Tuscan vernacular he used"]],
  [162, "Petrarca + sonetti", ["1304-1374, padre dell'umanesimo", "Canzoniere — 366 sonetti per Laura", "Sonetto petrarchesco: ABBA ABBA CDE CDE", "Latin works equally important (De viris illustribus)"]],
  [163, "Boccaccio + Decameron", ["1313-1375, amico di Petrarca", "Decameron — 100 novelle, 10 narratori, 10 giorni", "Cornice: peste 1348 Firenze", "Realismo borghese vs idealismo cortese"]],
  [164, "Letteratura rinascimentale", ["Ariosto — Orlando Furioso, ottava rima", "Tasso — Gerusalemme Liberata, melancolia", "Castiglione — Il Cortegiano, etiquette manuale", "Bembo — codificatore italiano letterario"]],
  [165, "Machiavelli + Il Principe", ["1469-1527, Firenze", "Il Principe (1513) — fine giustifica i mezzi", "Discorsi sopra la prima Deca di Tito Livio", "Mandragola — commedia teatrale"]],
  [166, "Manzoni + I Promessi Sposi", ["1785-1873, Milano", "I Promessi Sposi (1827, riveduto 1840-42)", "Lombardia '600 — Renzo + Lucia + Don Rodrigo", "Sciacquare i panni in Arno — Florentine standardization"]],
  [167, "Leopardi + poesia", ["1798-1837, Recanati (Marche)", "Canti — L'infinito, A Silvia, Il sabato del villaggio", "Pessimismo cosmico, Operette morali", "Sublime poesia + filosofia"]],
  [168, "Pirandello + teatro", ["1867-1936, Sicilia, Nobel 1934", "Sei personaggi in cerca d'autore — metateatro", "Uno, nessuno e centomila — identità frantumata", "Maschera/volto, umorismo definizione"]],
  [169, "Calvino + Città invisibili", ["1923-1985, sperimentale", "Trilogia degli antenati, Marcovaldo", "Le Città invisibili — Marco Polo a Kublai Khan", "Lezioni americane — leggerezza, rapidità, esattezza"]],
  [170, "Eco + Il Nome della Rosa", ["1932-2016, semiologo + romanziere", "Il Nome della Rosa (1980) — abbazia medievale, omicidi", "Il Pendolo di Foucault, L'Isola del Giorno Prima", "Apocalittici e integrati — saggio cultura pop"]],
  [171, "Letteratura italiana contemporanea", ["Elena Ferrante — L'amica geniale tetralogia (Napoli)", "Erri De Luca, Niccolò Ammaniti, Alessandro Baricco", "Premio Strega — più prestigioso italiano", "Donne autrici contemporanee: Postorino, Tamaro, Mazzantini"]],
  [172, "Analisi poesia", ["Metro: endecasillabo, settenario, novenario", "Rima: alternata, baciata, incatenata", "Figure retoriche: metafora, similitudine, anafora", "Strofe: sonetto, canzone, ballata"]],
  [173, "Scrivere racconto breve", ["Struttura: introduzione, sviluppo, climax, risoluzione", "POV: prima vs terza persona", "Dialogo + descrizione bilancio", "Italian narrative tradition — Pavese, Buzzati novellistic"]],
  [174, "Esercizi scrittura creativa", ["Prompt: descrivi un caffè italiano", "Continua una storia in 200 parole", "Riscrivi una fiaba da altro POV", "Stile imitativo: Calvino vs Pavese"]],
  [175, "Metafore + similitudini", ["Bello come il sole", "Forte come un leone, dolce come il miele", "Italian similitudes — animali, natura, food common", "Metaphore originali — creative writing"]],
  [176, "Review B1.4 + tua storia", ["Recap letteratura classica + moderna", "Scrivi un racconto breve 300 parole", "Tema: ricordo + ambientazione italiana", "Workshop peer review se possibile"]],
]);

const b1_5 = toSessions([
  [177, "Italiano formale (lei)", ["Lei capitalized in formal writing", "Verbi terza persona singolare", "Possessivi: Suo, Sua (capitalized)", "Quando usare lei: business, sconosciuti, anziani"]],
  [178, "Email business", ["Gentile Sig./Sig.ra (formale standard)", "Egregio Sig. (very formal, gerarchico)", "Oggetto chiaro + sintesi richiesta primo paragrafo", "Cordiali saluti / Distinti saluti / In attesa di un riscontro"]],
  [179, "Curriculum Vitae", ["Dati personali, foto (still common Italy)", "Esperienza lavorativa cronologico inverso", "Formazione, competenze linguistiche (livelli CEFR)", "Europass CV — formato UE standardizzato"]],
  [180, "Candidatura lavoro", ["Lettera di presentazione (1 pagina)", "Motivazioni + competenze + valore aggiunto", "Disponibilità immediata / al colloquio", "LinkedIn + InfoJobs + Subito Lavoro siti popolari"]],
  [181, "Riunioni di lavoro", ["Convocare, partecipare, presiedere", "Verbale, ordine del giorno, deliberare", "Punto all'ordine del giorno, ai voti", "Italian meeting culture — long, hierarchical, relational"]],
  [182, "Negoziazione stile italiano", ["Relationship-first, business-second", "Mai pressare deadline — segno mancanza rispetto", "Lunch business meeting tradition", "Direct disagreement softened — culturally important"]],
  [183, "Presentazioni", ["Buongiorno a tutti, mi presento", "Slide structure: introduzione, sviluppo, conclusioni", "Domande?, grazie per l'attenzione", "Italian presentation — più storytelling che data-heavy"]],
  [184, "Marketing italiano", ["Pubblicità, campagna, brand, posizionamento", "Mercato target, segmentazione", "Made in Italy — selling point globale", "Influencer marketing, social media manager"]],
  [185, "Commercio + vendite", ["Cliente, fornitore, rappresentante, distributore", "Fattura, scontrino, ricevuta", "IVA — Imposta Valore Aggiunto (22% standard)", "B2B, B2C, e-commerce trend"]],
  [186, "Sistema bancario", ["Conto corrente, libretto, mutuo, prestito", "Banche: Intesa Sanpaolo, Unicredit, Banco BPM", "Bonifico, bancomat, IBAN", "BCE + Banca d'Italia"]],
  [187, "Immobiliare", ["Casa in vendita / in affitto", "Mq (metri quadri), pianta, garage, terrazza", "Notaio — obbligatorio per compravendita", "Agente immobiliare, agenzia"]],
  [188, "Diritto base", ["Contratto, clausola, scadenza, rinnovo", "Civile vs penale", "Avvocato, giudice, tribunale", "Codice civile + penale + procedurale"]],
  [189, "Tasse + burocrazia", ["IRPEF (income tax), IVA, IRES (corporate)", "F24 — modulo pagamento tasse", "Codice fiscale (essential!), partita IVA", "Agenzia delle Entrate, INPS, INAIL"]],
  [190, "PEC + firma digitale", ["PEC — Posta Elettronica Certificata, valore legale", "Firma digitale — SPID, CIE, CNS", "Documenti elettronici amministrativi", "Italian digital admin transformation"]],
  [191, "Smart working culture", ["Telelavoro vs lavoro agile", "Diffusione post-Covid — 2-3 giorni casa tipico", "Bilanciamento vita-lavoro priorità", "Coworking + nomadi digitali"]],
  [192, "Review B1.5 + colloquio simulato", ["Recap business Italian", "Simula colloquio di lavoro 15 min", "Parla di esperienza + obiettivi + perché aziende italiana", "Feedback su register + vocabolario"]],
]);

// ============================================================================
// B2 — Upper Intermediate (7 sublevels × 16 = 112 sesi)
// ============================================================================

const b2_1 = toSessions([
  [193, "Congiuntivo imperfetto", ["Coniugazione: -assi/-essi/-issi", "Volessi, fossi, avessi, facessi", "Used after imperfetto/condizionale: vorrei che venissi", "Wishes about present + softened requests"]],
  [194, "Congiuntivo trapassato", ["Avessi/fossi + participio passato", "Avessi saputo, sarei venuto (had I known, I would have come)", "Periodo ipotetico irrealtà del passato", "Avrei voluto che fosse venuto"]],
  [195, "Periodo ipotetico — i tre tipi", ["Tipo I — realtà: se + ind. + ind.", "Tipo II — possibilità: se + cong. imp. + cond. pres.", "Tipo III — irrealtà passato: se + cong. trap. + cond. pass.", "Mixed types: se avessi studiato, saresti laureato"]],
  [196, "Congiuntivo in subordinate", ["Dopo verbi opinione, desiderio, dubbio + che", "Dopo congiunzioni: benché, sebbene, affinché, prima che", "Dopo pronomi relativi indefiniti: chiunque, qualunque", "Subjunctive triggers comprehensive list"]],
  [197, "Sfumatura nell'opinione", ["Sostenere, asserire, affermare vs credere, pensare", "Forse + indicativo vs penso che + congiuntivo", "Sembra che vs sembra di + infinito", "Italian register subtleties"]],
  [198, "Strumenti retorici", ["Anafora — ripetizione iniziale", "Climax + anticlimax", "Domanda retorica", "Litote — non è male = è buono"]],
  [199, "Registro accademico", ["Si è proceduto a + infinito (passive impersonal)", "Dal momento che, in virtù di, a fronte di", "Citare, riportare, evidenziare, sottolineare", "Latinismi + grecismi colti"]],
  [200, "Scrittura argomentativa", ["Tesi + antitesi + sintesi struttura", "Premessa, sviluppo, conclusione", "Connettivi logici: pertanto, dunque, di conseguenza", "Italian saggio breve format"]],
  [201, "Figure stilistiche", ["Metafora, similitudine, sinestesia", "Iperbole, eufemismo, ossimoro", "Allitterazione, onomatopea", "Italian poetry tools mastery"]],
  [202, "Giochi di parole", ["Calembour, gioco di parole, doppio senso", "Anagramma, palindromo", "Italian wordplay — culturalmente apprezzato", "Crusca + Accademia — linguistic guardians"]],
  [203, "Maestria idiomatica", ["Avere la testa sulle spalle (sensible)", "Tirare il pacco a qualcuno (stand up)", "Fare un buco nell'acqua (fail completely)", "Essere al settimo cielo (cloud nine)"]],
  [204, "Espressioni regionali", ["Toscano: 'sciocchezzine', 'figliolo'", "Romanesco: 'aò', 'mortacci tua'", "Milanese: 'belin', 'oh ma dai'", "Napoletano: 'guagliò', 'jamm'ja'"]],
  [205, "Accento toscano + romano", ["Toscano: gorgia (la casa → la hasa, c aspirated)", "Romano: troncamento (anda' invece di andare)", "Romanesco vs Italian standard", "Geminata raddoppiamento sintattico"]],
  [206, "Influenze napoletane + siciliane", ["Napoletano: 'pizza' (lingua propria UNESCO 2008)", "Siciliano: classified separate language", "Influenze su italiano: pizza, espresso, mafia (lex)", "Andrea Camilleri — italiano + siciliano fusion"]],
  [207, "Colloquialismi", ["Boh (don't know), tipo (like), cioè (I mean)", "Mica, mannaggia, accidenti", "Aggettivi rinforzativi: pazzesco, mostruoso, da paura", "Generational vocabulary shifts"]],
  [208, "Review B2.1 + saggio argomentativo", ["Recap subjunctive mastery + style", "Scrivi saggio 500 parole su tema attuale", "Tesi-antitesi-sintesi obbligatorie", "Strumenti retorici applicati"]],
]);

const b2_2 = toSessions([
  [209, "Italiano per turismo", ["Guida turistica, itinerario, pacchetto viaggio", "Sito UNESCO, patrimonio dell'umanità (Italy: 60 sites, world #1)", "Stagione, alta/bassa stagione", "Overtourism — Venezia, Cinque Terre problematic"]],
  [210, "Italiano della moda", ["Stilista, modello/-a, sfilata, passerella", "Collezione P/E (primavera-estate), A/I (autunno-inverno)", "Pret-à-porter vs haute couture", "Atelier, sartoria, capi su misura"]],
  [211, "Italiano del food industry", ["Chef, sous chef, brigata di cucina", "Materia prima, filiera, tracciabilità", "DOP, IGP, STG — certificazioni qualità", "Ristorazione collettiva vs fine dining"]],
  [212, "Italiano del design", ["Studio di design, brief, concept, prototipo", "Industrial vs grafica vs interior design", "Compasso d'Oro — Italian design award", "Salone del Mobile Milano (April)"]],
  [213, "Italiano diplomatico", ["Ambasciata, consolato, ambasciatore", "Trattato, accordo, intesa, memorandum", "Bilaterale, multilaterale, UE, ONU, NATO", "Farnesina — Ministero Affari Esteri"]],
  [214, "Italiano giornalistico", ["Cronaca, politica, esteri, economia, sport, cultura", "Notizia, fonte, scoop, esclusiva", "Editoriale, fondo, commento, opinione", "Inchiesta + reportage approfondimento"]],
  [215, "Italiano accademico", ["Cattedra, dipartimento, facoltà, corso di laurea", "Ordinario, associato, ricercatore, dottorando", "Pubblicazione, paper, citazione, peer review", "Concorsi universitari + abilitazione scientifica"]],
  [216, "Italiano legale", ["Codice civile, penale, di procedura", "Sentenza, ricorso, appello, Cassazione", "Querela vs denuncia", "Avvocato, procuratore, magistrato, giudice"]],
  [217, "Italiano medico", ["Anamnesi, diagnosi, prognosi, terapia", "Visita specialistica, ricovero, ambulatorio", "Cartella clinica, ricetta medica", "Specializzazioni: cardiologia, oncologia, neurologia, ortopedia"]],
  [218, "Italiano ingegneristico", ["Progettazione, calcolo strutturale, normativa", "CAD, BIM, software di simulazione", "Cantiere, capomastro, geometra", "Polimi, Polito — Politecnici eccellenza italiana"]],
  [219, "Italiano IT + tech", ["Sviluppatore, programmatore, sistemista", "Codice, framework, libreria, database", "Cloud, intelligenza artificiale (IA), machine learning", "Startup italiane: Satispay, ScalaPay, Bending Spoons"]],
  [220, "Italiano finanziario", ["Borsa, azioni, obbligazioni, fondi", "Investimento, rendimento, rischio", "Piazza Affari Milano (FTSE MIB)", "BoT, BTP — titoli di stato"]],
  [221, "Italiano artistico", ["Galleria, mostra, vernissage, opening", "Curatore, mecenate, gallerista, collezionista", "Restauro, conservazione, opere d'arte", "Biennale Venezia (arte + cinema), Documenta"]],
  [222, "Italiano per traduzione", ["Traduttore vs interprete", "Asseverata, giurata, certificata", "CAT tools, glossario, terminologia", "Mercato traduzione italiana — grande domanda EU"]],
  [223, "Italiano per insegnamento", ["Insegnante, docente, maestro", "Didattica, programma, valutazione", "CLIL — Content Language Integrated Learning", "Italian L2 — insegnare a stranieri"]],
  [224, "Review B2.2 + portfolio settore", ["Recap industry verticals", "Costruisci portfolio professionale settore tua scelta", "Glossario personalizzato 50+ termini specialistici", "Case study reale settore"]],
]);

const b2_3 = toSessions([
  [225, "Modulazione del tono", ["Formale vs informale vs intimo", "Sottile vs diretto, ironico vs serio", "Italian tone modulation — extreme spectrum", "Reading the room — context awareness"]],
  [226, "Leggere tra le righe", ["Implicato vs esplicito", "Cosa non si dice — culturalmente importante", "Sottintesi sociali", "Reading Italian indirectness"]],
  [227, "Small talk italiano", ["Tempo, traffico, calcio, sagra locale", "Family inquiries — culturally appropriate", "Politics — friend-only territory", "Bar/café — natural small talk venue"]],
  [228, "Tabù culturali", ["Soldi diretti — non parlare di stipendio", "Età donne, peso — taboo", "Religione — handle with care", "Mafia — heavy topic, geographic sensitivity"]],
  [229, "Sensibilità religiosa", ["Cattolicesimo culturale vs praticante", "Festività religiose — anche atei celebrano", "Rispetto vs critica chiesa istituzionale", "Papa Francesco — controversa figura"]],
  [230, "Umorismo decodificato", ["Ironia vs sarcasmo italiano", "Auto-ironia molto apprezzata", "Sfottò amichevole vs offesa", "Italian humor — il riso amaro"]],
  [231, "Conversazione politica", ["Italians passionate, vocal", "Polarizzazione: sinistra/destra divide netto", "Argomenti sensibili: migranti, UE, fascismo", "Diplomazia familiare a tavola"]],
  [232, "Dinamiche familiari", ["Mamma centrale — Mammismo culturale", "Figli a casa fino tardi (30+ comune)", "Suoceri rapporti complessi", "Pranzo domenicale tradizione"]],
  [233, "Amicizia italiana", ["Amici di lunga data — for life", "Conoscenti vs amici distinzione netta", "Aperitivo + cena tradition", "Italians warm but slow to fully include"]],
  [234, "Linguaggio amoroso", ["Tesoro, amore, cuore mio", "Ti amo (deep) vs ti voglio bene (affection)", "Mai dire ti amo casualmente!", "Italian dating culture — slow, courtship"]],
  [235, "Risoluzione conflitti", ["Confronto diretto vs evitamento", "Scusarsi propriamente — protocollo", "Mediazione, conciliazione", "Italian conflict — sfogo emotional then resolution"]],
  [236, "Leggere stampa fluentemente", ["Identifying register: cronaca vs editoriale", "Recognizing political slant", "Skim vs deep reading", "Daily Italian newspaper habit"]],
  [237, "Guardare TV senza sub", ["RAI 1/2/3, La 7, Mediaset", "Talk show: Otto e Mezzo, Piazzapulita, Porta a Porta", "Serie italiane: My Brilliant Friend, Suburra, Romanzo Criminale", "Reality, cucina, comicità — diversificate"]],
  [238, "Podcast italiani", ["Il Post, Morning, Indagini (Pablo Trincia)", "Storie, true crime, attualità formats", "Spotify Italia growing market", "Velocità nativi — 0.85x speed initially OK"]],
  [239, "Radio italiana", ["RAI Radio 1/2/3, Radio Deejay, Radio 105", "Programmi: Caterpillar, Pascal+, Il Ruggito del Coniglio", "Talk + musica + cronaca mix", "Italian radio personality culture rich"]],
  [240, "Review B2.3 + conversazione reale", ["Recap pragmatica + culturale", "Simulazione conversazione 30 min con native simulato", "Topics liberi: politica, food, cinema, lavoro", "Self-assessment fluency + nuance"]],
]);

const b2_4 = toSessions([
  [241, "Registro accademico avanzato", ["Linguaggio scientifico vs umanistico", "Latinismi: in primis, in toto, ex novo, ad hoc", "Strutture impersonali, passive complesse", "Lessico astratto + tecnico"]],
  [242, "Struttura paper accademico", ["Abstract, parole chiave, introduzione, metodologia", "Risultati, discussione, conclusioni, bibliografia", "Note a piè di pagina vs note finali", "Italian academic writing — più discorsivo che anglo-americano"]],
  [243, "Citare fonti italiane", ["Sistema autore-data vs note", "Bibliografia ragionata", "Sitografia, archivi, fonti primarie/secondarie", "Norme bibliografiche italiane MLA-equivalent"]],
  [244, "Conferenze accademiche", ["Relatore, discussant, moderatore, chair", "Comunicazione, intervento, poster session", "Atti del convegno (proceedings)", "Italian academic conference culture"]],
  [245, "Tesi di laurea", ["Triennale (~50-80 pp), magistrale (~150 pp), dottorato (300+ pp)", "Relatore + correlatore", "Discussione pubblica davanti commissione", "Laurea con lode (110 e lode) — top distinction"]],
  [246, "Università eccellenza", ["Scuola Normale Superiore Pisa — élite", "Sant'Anna Pisa, IUSS Pavia, SISSA Trieste", "European University Institute Fiesole", "Programmi internazionali, Erasmus"]],
  [247, "Intellettuali italiani", ["Umberto Eco — semiologo + scrittore", "Norberto Bobbio — filosofia politica", "Tullio De Mauro — linguista", "Giorgio Agamben — filosofia contemporanea"]],
  [248, "Filosofia italiana", ["Giambattista Vico — Scienza Nuova, storicismo", "Benedetto Croce — neoidealismo, estetica", "Antonio Gramsci — egemonia culturale (Quaderni dal carcere)", "Pasolini — non solo poeta, filosofo culturale"]],
  [249, "Sociologia italiana", ["Pareto, Mosca — élite teorie", "Norberto Bobbio politica", "Franco Ferrarotti, Renate Siebert", "Italian Sociological Association"]],
  [250, "Storiografia italiana", ["Croce, Salvemini — storia liberale", "De Felice — biografia Mussolini revisionista", "Annales influence — storia delle mentalità", "Microstoria — Carlo Ginzburg, Il formaggio e i vermi"]],
  [251, "Linguistica italiana", ["Tullio De Mauro — Storia linguistica dell'Italia unita", "Dialetti vs lingua nazionale", "Dialettologia italiana — ricca tradizione", "Italiano dell'uso medio — De Mauro concept"]],
  [252, "Analisi testi", ["Analisi del testo poetico vs narrativo", "Contesto, autore, contenuto, forma, stile", "Esame di stato maturità — analisi testo prima prova", "Italian close reading tradition"]],
  [253, "Recensioni + critiche", ["Recensione letteraria, cinematografica, gastronomica", "Pro e contro structure", "Giudizio motivato non sentimentale", "Italian critic tradition — strong opinions"]],
  [254, "Dibattito accademico", ["Tesi + argomentazioni + obiezioni + repliche", "Confutare, sostenere, dimostrare, smentire", "Citare auctoritas, esempi, dati", "Italian debate — passionate ma strutturato"]],
  [255, "Difesa di tesi", ["Esposizione orale 15-20 min", "Domande commissione, risposta puntuale", "Defending claims rigorously", "Italian thesis defense — pubblica, formale"]],
  [256, "Review B2.4 + paper accademico", ["Recap academic mastery", "Scrivi mini-paper 1500 parole con bibliografia", "Tema: aspetto della cultura italiana", "Peer review feedback"]],
]);

const b2_5 = toSessions([
  [257, "Registro diplomatico", ["Eccellenza, ambasciatore, ministro plenipotenziario", "Sua Maestà, Sua Eccellenza", "Verbalizzazione formale, comunicati ufficiali", "Italian diplomatic protocol heritage"]],
  [258, "Storia diplomazia italiana", ["Repubbliche marinare diplomazia rinascimentale", "Cavour — diplomazia unità", "Italia in UE founding member", "Farnesina — Ministero Affari Esteri Cooperazione Internazionale"]],
  [259, "UE + ruolo italiano", ["Trattati di Roma 1957 — fondazione CEE", "Italia paese fondatore", "Commissari italiani: Prodi (presidente), Mogherini, Gentiloni", "PNRR — Italy's NextGenerationEU implementation"]],
  [260, "Politica estera italiana", ["Atlantismo + europeismo pilastri storici", "Mediterraneo focus geografico-strategico", "Africa policy — Piano Mattei", "Bilateral relations: USA, Francia, Germania, UK"]],
  [261, "Italia all'ONU", ["Membro fondatore 1955", "Consigli non permanenti multipli", "Caschi blu — peacekeeping eredità importante", "FAO + IFAD + WFP — sedi Roma"]],
  [262, "ONG italiane", ["Emergency (Gino Strada), Save the Children Italia", "ActionAid, Medici Senza Frontiere", "Comunità Sant'Egidio — diplomazia pace", "Italian humanitarian heritage"]],
  [263, "Leadership italiana", ["Leadership style: relazionale, carismatica", "Networking — pratica essenziale", "Mentorship + sponsorship dinamica", "Italian leadership — passionate, visionary tradition"]],
  [264, "Stile manageriale italiano", ["Gerarchia formale ma relazione personale informale", "Decisioni top-down ma consultative", "Personalismo — relazioni importanti", "Cambio recente — più meritocratico"]],
  [265, "Public speaking", ["Discorso pubblico — Italian rhetorical heritage", "Cicero modello classico", "Stile alto vs medio vs basso", "Gestualità coerente con verbale"]],
  [266, "Retorica italiana", ["Cicero — De Oratore foundational", "Padri della retorica italiana medievale", "Retorica forense + politica", "Italian rhetoric tradition unbroken from antiquity"]],
  [267, "Cicerone + eredità", ["106-43 a.C., Arpino", "Catilinarie, Filippiche — speeches modello", "Latin influence on Italian rhetoric direct", "De Officiis — etica del leader"]],
  [268, "Discorsi italiani moderni", ["Aldo Moro — discorsi politici intensi", "Pertini presidente, discorsi popolari", "Mattarella discorsi Capodanno", "Renzi, Conte, Draghi, Meloni styles compared"]],
  [269, "Conferenze stampa", ["Briefing, comunicato, dichiarazione", "Domande dei giornalisti, replica", "On the record vs off the record", "Italian press conference culture"]],
  [270, "Dibattiti politici", ["Confronti elettorali TV", "Bruno Vespa Porta a Porta heritage", "Talk show politici: Floris, Formigli", "Italian political debate — passionate, frammentato"]],
  [271, "Business etiquette internazionale", ["Italian businesses + foreign partners", "Cultural intelligence + adattamento", "Italian negotiation style explicit", "Pranzo di lavoro — non skippable"]],
  [272, "Review B2.5 + discorso italiano", ["Recap leadership + diplomacy", "Prepara discorso pubblico 5 min", "Tema scelto + tono formale", "Delivery + Q&A simulati"]],
]);

const b2_6 = toSessions([
  [273, "Dante Inferno deep read", ["Canto I — selva oscura, le tre fiere", "Canto III — porta inferno 'lasciate ogne speranza'", "Canto V — Paolo e Francesca, 'galeotto fu il libro'", "Canto XXVI — Ulisse, 'fatti non foste a viver come bruti'"]],
  [274, "Letteratura barocca", ["Marino — il Cavalier Marino, marinismo", "L'Adone — opera massima", "Concettismo, meraviglia, immagine sensuale", "Italian Baroque — between Renaissance + Enlightenment"]],
  [275, "Romanticismo italiano", ["Foscolo — Ultime Lettere di Jacopo Ortis, Dei Sepolcri", "Manzoni — I Promessi Sposi", "Leopardi — Canti, Operette Morali, Zibaldone", "Differenza con romanticismo tedesco + inglese"]],
  [276, "Verismo italiano", ["Movimento letterario 1870s-1890s", "Giovanni Verga — I Malavoglia, Mastro-don Gesualdo", "Capuana, De Roberto siciliani", "Verismo vs naturalismo francese (Zola)"]],
  [277, "Futurismo italiano", ["Marinetti — Manifesto del Futurismo 1909", "Velocità, macchina, guerra, modernità", "Pittori: Boccioni, Balla, Severini, Carrà", "Controversia: avanguardia + fascismo connection"]],
  [278, "Ermetismo poetico", ["Movimento poetico anni '20-'30", "Ungaretti — L'allegria, Sentimento del Tempo", "Montale — Ossi di Seppia (Nobel 1975)", "Quasimodo — Ed è subito sera (Nobel 1959)"]],
  [279, "Neorealismo letterario", ["Pavese — La luna e i falò, La casa in collina", "Vittorini — Conversazione in Sicilia", "Calvino — Il sentiero dei nidi di ragno", "Levi — Se questo è un uomo, La tregua"]],
  [280, "Scrittrici italiane", ["Grazia Deledda — Nobel 1926 (sarda)", "Elsa Morante — La Storia, L'isola di Arturo", "Natalia Ginzburg — Lessico famigliare", "Anna Maria Ortese, Alba de Céspedes"]],
  [281, "Fenomeno Ferrante", ["Elena Ferrante — pseudonimo", "L'amica geniale tetralogia — Napoli 1950-2010", "HBO adaptation My Brilliant Friend successo globale", "Mistero identità autrice — dibattito aperto"]],
  [282, "Letteratura per ragazzi", ["Collodi — Pinocchio (1881)", "De Amicis — Cuore (1886)", "Rodari — Favole al telefono, Grammatica della fantasia", "Modern: Bianca Pitzorno, Geronimo Stilton"]],
  [283, "Fumetti italiani", ["Tex Willer — western italiano, Sergio Bonelli", "Diabolik — Astorina, criminal hero", "Dylan Dog — incubo investigatore", "Zerocalcare — graphic novel autobiografico Roma"]],
  [284, "Analisi canzoni", ["Cantautori italiani — testi poetici", "De André analisi: Bocca di Rosa, La canzone di Marinella", "Battiato: La cura, Centro di gravità permanente", "Sanremo — vetrina culturale"]],
  [285, "Teatro avanzato", ["Pirandello — Sei personaggi metateatro", "De Filippo — Filumena Marturano, Napoli Milionaria", "Dario Fo — Mistero Buffo (one-man show)", "Teatro contemporaneo: Castellucci, Ronconi"]],
  [286, "Libretti operistici", ["Italian opera — lingua sacra del melodramma", "Da Ponte (Mozart libretti), Boito (Verdi)", "Recitativo vs aria distinction", "Reading opera libretti — literary analysis"]],
  [287, "Analisi film", ["Sceneggiatura, regia, fotografia, montaggio", "Scuola di cinema — Centro Sperimentale Roma", "Italian film criticism heritage", "Decoding Italian films culturally"]],
  [288, "Review B2.6 + analisi letteraria", ["Recap literary tradition Italy", "Analisi 1500 parole opera scelta", "Contesto + struttura + temi + stile", "Italian literary scholarship demonstration"]],
]);

const b2_7 = toSessions([
  [289, "Struttura esame CILS", ["CILS — Università per Stranieri di Siena", "Livelli: A1, A2, UNO-B1, DUE-B2, TRE-C1, QUATTRO-C2", "5 prove: ascolto, comprensione lettura, analisi struttura, produzione scritta, produzione orale", "Punteggio 11/17 minimo per superare"]],
  [290, "CILS ascolto strategie", ["3-4 brani audio diversi", "Multiple choice + completamento", "Strategy: read questions BEFORE listen", "Native speed — practice intensive"]],
  [291, "CILS comprensione lettura", ["Testi: articolo, narrativo, espositivo", "Multiple choice + true/false + completamento", "Vocabolario inferenza dal contesto", "Time management critical"]],
  [292, "CILS analisi strutture", ["Grammar in context exercises", "Cloze test, multiple choice grammar", "Coniugazioni verbi, pronomi, preposizioni", "Italian grammar comprehensive review"]],
  [293, "CILS produzione scritta", ["Due tracce: lettera/email + saggio o racconto", "200-250 parole tipico per B2", "Coerenza, coesione, vocabolario, grammatica criteri", "Pratica con prompt reali"]],
  [294, "CILS produzione orale", ["Monologo (2-3 min) + dialogo con esaminatore (4-5 min)", "Argomento dato — descrizione + opinione", "Fluency, pronuncia, vocabolario, grammar", "Naturalezza vs accuratezza balance"]],
  [295, "CILS pratica ascolto", ["Simulazioni reali ascolto B2", "Notizie radio, dialoghi, interviste", "Note-taking strategie", "Auto-valutazione punteggio simulato"]],
  [296, "CILS pratica lettura", ["Testi B2 livello — giornali, narrativa, saggi", "Skim, scan, deep read tre fasi", "Identificare tesi + argomenti + esempi", "Tempo: 70 minuti per 4 testi tipico"]],
  [297, "CILS pratica saggio", ["Saggio argomentativo 250 parole", "Tesi + argomenti + esempi + conclusione", "Connettivi logici padroneggiati", "Self-edit checklist applicato"]],
  [298, "CILS pratica lettera", ["Lettera formale o informale per traccia", "Apertura, sviluppo, chiusura appropriate", "Register matching contesto", "Convenzioni Italian letter writing"]],
  [299, "CILS monologo pratica", ["Argomento estratto a sorte", "Preparazione 2 min, esposizione 2-3 min", "Struttura: introduzione, sviluppo, conclusione", "Filler words da evitare (ehm, allora, tipo)"]],
  [300, "CILS dialogo pratica", ["Role-play con esaminatore", "Situazioni: lavoro, viaggio, problema da risolvere", "Negotiation + opinion-giving + politeness", "Active listening + appropriate response"]],
  [301, "Simulazione CILS B2 completa", ["4 ore di simulazione full exam", "Tutte le 5 prove in sequenza realistica", "Time management completo", "Self-assessment vs scoring criteria"]],
  [302, "CILS scoring + feedback", ["Punteggi per prova, totale e media", "Identificare punti deboli", "Piano di miglioramento mirato", "Quando ripetere — best strategy"]],
  [303, "Strategie giorno esame", ["Documenti necessari: CILS application, ID", "Sleep + alimentazione giorno prima", "Sede esame Siena o sede internazionale", "Calma + concentrazione management"]],
  [304, "Review finale + celebrazione", ["Recap 304 sessioni completato", "Italian language journey reflection", "Next steps: CILS C1, immersion Italia, professional path", "Arrivederci e in bocca al lupo per CILS!"]],
]);

// ============================================================================
// Curriculum Assembly
// ============================================================================

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("italian")!,
  overview:
    "Program 304 sesi yang mengantar lo dari nol sampai percakapan near-native dalam Bahasa Italia (Italiano). Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Mulai dari alfabeto italiano (21 huruf — j, k, w, x, y bukan native), pronunciation dengan vocali aperte/chiuse + doppie consonanti yang phonemic (pala vs palla), grammar Romance dengan articoli gendered (il/la/lo) + tre conjugazioni regolari (-are/-ere/-ire) + congiuntivo mastery. Imersi kultur: Dante + Divine Comedy, Renaissance dengan Da Vinci dan Michelangelo, Vatican dan Cappella Sistina, cinema Fellini-Sorrentino, opera Verdi-Puccini, design Ferrari-Vespa, fashion Milano (Armani-Versace-Prada-Gucci), slow food + aperitivo culture, 20 regioni dengan cucina + dialetti masing-masing. Test prep B2.7: CILS — sertifikat ufficiale Università per Stranieri di Siena, diakui untuk study + work + residency di Italia.",
  levels: [
    {
      code: "A1",
      name: "Elementary Foundation",
      description:
        "Fondamenta Elementari. Mulai dari l'alfabeto italiano (21 huruf), pronuncia base dengan vocali aperte/chiuse + doppie consonanti, greetings (ciao, buongiorno, buonasera, salve), numeri 1-1000, present tense verbi essere/avere + 3 conjugazioni regolari (-are/-ere/-ire), articoli determinativi + indeterminativi dengan gender + numero, pronomi personali. Akhir A1: introduce diri sendiri, order al bar italiano dengan benar, navigate routine quotidiana, dan kuasai 800+ kata dasar.",
      sublevels: [
        { code: "A1.1", name: "First Steps", sessions: a1_1, preview: true },
        { code: "A1.2", name: "Daily Life", sessions: a1_2, preview: true },
        { code: "A1.3", name: "Social Basics", sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2",
      name: "Pre-Intermediate",
      description:
        "Pre-Intermedio. Tense expansion: passato prossimo (avere/essere ausiliare), imperfetto, futuro semplice, condizionale presente. Pronomi diretti + indiretti + combinazioni (glielo, gliela). Intro congiuntivo presente. Comparisons + superlativi (-issimo). Mulai imersi: Renaissance dengan Da Vinci + Michelangelo, Vaticano, moda Milano + Made in Italy (Armani, Ferrari, Vespa), cucina regionale, 20 regioni Italia, La Dolce Vita Fellini. Vocab grow to 2000+ kata.",
      sublevels: [
        { code: "A2.1", name: "Beyond Basics", sessions: a2_1, preview: true },
        { code: "A2.2", name: "Travel & Work", sessions: a2_2, preview: true },
        { code: "A2.3", name: "Self-Expression", sessions: a2_3, preview: true },
        { code: "A2.4", name: "Cultural Foundations", sessions: a2_4, preview: true },
      ],
    },
    {
      code: "B1",
      name: "Intermediate",
      description:
        "Intermedio. Fluency tools — trapassato prossimo, periodo ipotetico (tre tipi), congiuntivo imperfetto, discorso indiretto, forma passiva, si impersonale. Deep dive Italian literature: Dante + Petrarca + Boccaccio + Calvino + Manzoni + Eco. Cinema neorealismo (Rossellini, De Sica, Visconti) + moderno (Sorrentino, Garrone). Opera Verdi-Puccini, canzone d'autore De André-Battiato, calcio Serie A. Society + politics + economy Italian. Professional Italian: business email PEC, CV Europass, riunioni, negoziazioni. Vocab 3500+.",
      sublevels: [
        { code: "B1.1", name: "Fluency Foundations", sessions: b1_1, preview: true },
        { code: "B1.2", name: "Cultural Fluency", sessions: b1_2, preview: true },
        { code: "B1.3", name: "Complex Topics", sessions: b1_3, preview: true },
        { code: "B1.4", name: "Creative Expression", sessions: b1_4, preview: true },
        { code: "B1.5", name: "Professional Bridge", sessions: b1_5, preview: true },
      ],
    },
    {
      code: "B2",
      name: "Upper Intermediate",
      description:
        "Upper Intermedio. Near-native expression: congiuntivo trapassato, periodo ipotetico tre tipi mastery, sfumatura nell'opinione, rhetoric strumenti. Academic Italian: paper structure, tesi defense, intellettuali italiani (Eco, Bobbio, Gramsci, Croce). Professional industry-specific: turismo, moda, design, food industry, diplomazia, giornalismo, legale, medico, ingegneristico, IT, finanza. Diplomatic register + leadership Italian + public speaking heritage Cicero. Literary mastery: Dante Inferno deep, Barocco, Romanticismo, Verismo, Futurismo, Ermetismo, Neorealismo, scrittrici italiane (Morante, Ginzburg, Ferrante). Persiapan CILS — esame ufficiale Università per Stranieri di Siena, livello DUE-B2 atau TRE-C1. Vocab 5000+.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression", sessions: b2_1, preview: true },
        { code: "B2.2", name: "Professional Italian", sessions: b2_2, preview: true },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: true },
        { code: "B2.4", name: "Academic Mastery", sessions: b2_4, preview: true },
        { code: "B2.5", name: "Leadership & Diplomacy", sessions: b2_5, preview: true },
        { code: "B2.6", name: "Creative & Literary", sessions: b2_6, preview: true },
        { code: "B2.7", name: "Test Prep (CILS)", sessions: b2_7, preview: true },
      ],
    },
  ],
};

export default curriculum;


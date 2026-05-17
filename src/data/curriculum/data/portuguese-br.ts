import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============================================================================
// A1 — Elementary Foundation (3 sublevels × 16 = 48 sesi)
// ============================================================================

const a1_1 = toSessions([
  [1, "Alfabeto português", ["26 letras (k, w, y dapat acceptance 2009 spelling reform)", "Diacríticos: á é í ó ú (agudo), â ê ô (circunflexo), ã õ (til nasal), à (crase)", "ç (cedilha) — antes a/o/u jadi 's' (criança, açúcar)", "Digrafos: lh (filho), nh (banho), ch (chave), rr, ss"]],
  [2, "Pronúncia brasileira", ["Vogais abertas vs fechadas: pé/pê, avó/avô", "Nasais: ão (pão), ãe (mãe), õe (põe)", "R brasileiro: uvular inicial (Rio = 'Hio'), tap intervocálico (caro)", "S final: sibilante no SP, chiado no Rio (lápis = 'lápish')"]],
  [3, "Saudações + apresentação", ["Oi (mais comum), Olá, E aí? (informal)", "Bom dia, Boa tarde, Boa noite, Tchau", "Tudo bem? Tudo bom? — informal greeting + answer same way", "Prazer em conhecer / Igualmente"]],
  [4, "Números 0-20", ["Zero, um, dois, três, quatro, cinco, seis, sete, oito, nove, dez", "Onze, doze, treze, catorze (or quatorze), quinze... vinte", "Gender agreement: um/uma, dois/duas", "Operações: mais, menos, vezes, dividido por"]],
  [5, "Pronomes + verbo SER", ["Eu, você (default!), ele/ela, nós, vocês, eles/elas", "Tu rare in Brazil — only Sul, Pará, parts of Nordeste", "Sou, é, é, somos, são, são (você uses 3rd person form!)", "SER — identidade permanente (sou brasileiro)"]],
  [6, "Verbo ESTAR + localização", ["Estou, está, está, estamos, estão, estão", "ESTAR — estado temporário, localização", "Como você está? Estou bem.", "Onde você está? Estou em casa."]],
  [7, "Nacionalidade + origem", ["Qual é o seu nome? Meu nome é...", "De onde você é? Sou da Indonésia / do Brasil", "Adjetivos: brasileiro/a, indonésio/a, americano/a, japonês/a", "Você fala português? Falo um pouco"]],
  [8, "Dias + meses + horas", ["Segunda, terça, quarta, quinta, sexta, sábado, domingo", "Janeiro, fevereiro, março... dezembro (no caps!)", "Que horas são? São três horas / É uma hora", "Estações: verão, outono, inverno, primavera (invertidas no Brasil!)"]],
  [9, "Verbo TER + idade", ["Tenho, tem, tem, temos, têm, têm", "Quantos anos você tem? Tenho 25 anos", "Ter fome, sede, sono, calor, frio, medo", "Diferent dari PT-PT: 'há' (existence) lebih literario, BR pakai 'tem' (tem trânsito)"]],
  [10, "Família brasileira", ["Pai, mãe, irmão, irmã, filho, filha", "Avô, avó, tio, tia, primo, prima", "Padrasto, madrasta — comum em famílias modernas", "Cultura família brasileira: extensiva, almoço de domingo sagrado"]],
  [11, "Cores + concordância", ["Vermelho, azul, verde, amarelo, preto, branco, cinza, marrom", "Masculino/feminino: vestido vermelho vs blusa vermelha", "Plural: vestidos vermelhos vs blusas vermelhas", "Bandeira: verde-amarela com losango azul e estrelas (constelação)"]],
  [12, "Artigos definidos + indefinidos", ["O, a, os, as (definidos) — sempre antes de nomes", "Um, uma, uns, umas (indefinidos)", "Combinações: do, da, no, na, pelo, pela", "Brasil USA 'o Brasil', 'a Indonésia' — antes de países major"]],
  [13, "Verbos -AR regulares", ["Falar, morar, trabalhar, estudar, comprar, andar", "Conjugação: -o, -a, -a, -amos, -am, -am (você uses 3rd person)", "Eu falo português, você mora em Jacarta", "Most common -AR daily verbs"]],
  [14, "Perguntar + responder", ["Question words: quem, o que/que, onde, quando, por que, como, quanto", "Question com entonação subindo (sem inverter)", "Sim, não, talvez", "Né? — typical Brazilian tag question"]],
  [15, "No café — pedindo", ["Eu quero / Eu gostaria de... (mais educado)", "Cafezinho — small + strong, default order in Brazil", "Pão de queijo, pão na chapa, misto quente", "Pagar no caixa primeiro ou no final, depende da casa"]],
  [16, "Review A1.1 + Brasil geografia", ["Recap alfabeto + pronúncia + greetings", "Brasil = 5 regiões: Norte, Nordeste, Centro-Oeste, Sudeste, Sul", "26 estados + Distrito Federal (Brasília)", "Brasília capital desde 1960 (transferida do Rio)"]],
]);

const a1_2 = toSessions([
  [17, "Rotina diária", ["Acordo, levanto, tomo café, vou trabalhar", "Almoço (lunch), janto (dinner)", "Manhã, tarde, noite, madrugada", "Brasileiro almoça pesado — comida 'de verdade' meio-dia"]],
  [18, "Verbos -ER regulares", ["Comer, beber, viver, aprender, escrever, vender", "Conjugação: -o, -e, -e, -emos, -em, -em", "Eu como arroz e feijão todo dia", "Padrão verbal -ER"]],
  [19, "Verbos -IR regulares", ["Abrir, partir, dividir, decidir, assistir", "Conjugação: -o, -e, -e, -imos, -em, -em", "Eu abro a porta, você divide a conta", "Padrão verbal -IR"]],
  [20, "Comida brasileira base", ["Arroz, feijão (preto ou carioca — base nacional)", "Carne, frango, peixe, ovo", "Frutas tropicais: manga, mamão, maracujá, açaí, goiaba, cupuaçu", "Pão francês — staple do café da manhã"]],
  [21, "No restaurante", ["Entrada, prato principal, sobremesa, bebida", "Garçom! (call attention), por favor", "A conta, por favor — service charge 10% standard", "Self-service / por quilo restaurants — uniquely Brazilian model"]],
  [22, "Café da manhã brasileiro", ["Pão francês com manteiga, queijo, presunto", "Café com leite — adult version, light brown color", "Tapioca (Nordeste), pão de queijo (Minas)", "Açaí na tigela — café da manhã pós-academia urbano"]],
  [23, "Casa brasileira", ["Quarto, sala, cozinha, banheiro, varanda, quintal", "Móveis: mesa, cadeira, cama, sofá, geladeira, fogão", "Apartamento (urbano) vs casa (subúrbio)", "Empregada doméstica — historic Brazilian household helper"]],
  [24, "Preposições", ["Em, no, na, do, da, para, por, com, sem", "Vou para casa / Estou em casa", "Combinações: do = de + o, na = em + a", "Diferent dari PT-PT — BR favors 'para' over 'a' for direction"]],
  [25, "Clima brasileiro", ["Como está o tempo? Faz calor / Está frio / Vai chover", "Brasil tropical maioria — pouca variação", "Estações: invertidas vs hemisfério Norte (verão dez-mar)", "Friagem (cold front), São Pedro (rain saint), El Niño impact"]],
  [26, "Roupas tropicais", ["Camiseta, shorts, bermuda, chinelo, sandália", "Biquíni — Brazilian iconic beachwear", "Tênis (sneakers), camisa social", "Havaianas — chinelo nacional, exportado mundial"]],
  [27, "Corpo humano", ["Cabeça, olho, nariz, boca, orelha, cabelo", "Braço, mão, perna, pé, joelho, cotovelo", "Coração, estômago, costas, garganta", "Tô com dor de cabeça (informal: tô = estou)"]],
  [28, "SUS + saúde", ["Tô doente, tô com gripe, dor de garganta, febre", "SUS — Sistema Único de Saúde, gratuito constituicional", "UBS (Unidade Básica), hospital, pronto-socorro", "Farmácia/drogaria — algumas vendem medicamento sem receita"]],
  [29, "Compras", ["Supermercado, feira (street market), shopping, padaria", "Quilo, meio quilo, grama, litro", "Quanto custa? Quanto é? Tá quanto?", "Pix — revolução pagamento brasileiro (2020)"]],
  [30, "Real (R$) + dinheiro", ["Cédulas R$ 2, 5, 10, 20, 50, 100, 200", "Moedas: 5, 10, 25, 50 centavos + R$ 1", "Pagar à vista, no débito, no crédito, parcelado", "Plano Real 1994 — controlou hiperinflação"]],
  [31, "Verbos irregulares chave", ["Ir: vou, vai, vai, vamos, vão, vão", "Vir: venho, vem, vem, vimos, vêm, vêm", "Ter: tenho, tem, tem, temos, têm, têm", "Fazer: faço, faz, faz, fazemos, fazem, fazem"]],
  [32, "Review A1.2 + cultura almoço", ["Recap rotina + comida + casa", "Almoço é a refeição PRINCIPAL no Brasil", "Domingo: feijoada (Rio), churrasco (Sul), tucupi (Norte)", "Pratos regionais brasileiros heritage indígena+africano+português"]],
]);

const a1_3 = toSessions([
  [33, "Pretérito perfeito intro", ["Verbos -AR: -ei, -ou, -ou, -amos, -aram, -aram", "Verbos -ER/-IR: -i, -eu/-iu, -eu/-iu, -emos/-imos, -eram/-iram", "Eu falei, comi, abri ontem", "Action completed in past — equivalent simple past"]],
  [34, "Passado de IR + outros irregulares", ["Fui, foi, foi, fomos, foram, foram (IR + SER same!)", "Tive, teve, tivemos (TER)", "Fiz, fez, fizemos (FAZER)", "Eu fui ao Rio = I went to Rio"]],
  [35, "Gostar de + hobbies", ["Gostar DE + nome (gosto de música)", "Gostar DE + verbo infinitivo (gosto de viajar)", "Adorar (love), odiar (hate)", "Hobbies: ler, viajar, cozinhar, esportes"]],
  [36, "Futebol — religião nacional", ["Time, jogador, técnico, torcedor, jogo, gol", "Série A: Flamengo, Palmeiras, Corinthians, São Paulo", "5 Copas do Mundo: 1958, 62, 70, 94, 2002 — record mundial", "Pelé, Garrincha, Zico, Romário, Ronaldo, Ronaldinho, Neymar"]],
  [37, "Música — bossa nova", ["Bossa nova 1950s — Rio fusion jazz+samba", "Tom Jobim, João Gilberto, Vinícius de Moraes", "Garota de Ipanema (1962) — most recorded Brazilian song", "Chega de Saudade, Desafinado, Águas de Março"]],
  [38, "Cinema brasileiro intro", ["Cidade de Deus (2002) Meirelles — Cannes", "Tropa de Elite (2007) Padilha — Berlim", "Central do Brasil (1998) Salles — Oscar nominee", "Bacurau (2019), Aquarius — modern critically acclaimed"]],
  [39, "Pretérito imperfeito intro", ["-AR: -ava, -ava, -ava, -ávamos, -avam, -avam", "-ER/-IR: -ia, -ia, -ia, -íamos, -iam, -iam", "Quando eu era criança, brincava na rua", "Past habitual or descriptive background"]],
  [40, "Imperfeito vs perfeito", ["Imperfeito — duração, hábito, descrição", "Perfeito — ação completa, ponto no tempo", "Eu morava em SP quando conheci ele", "Signal words for each tense"]],
  [41, "Lembranças de infância", ["Quando eu era pequeno...", "Brincadeiras: pega-pega, esconde-esconde, queimada, bets", "Escola pública vs particular", "Domingo de avó — tradição familiar brasileira"]],
  [42, "Viajar pelo Brasil", ["Aeroporto, rodoviária, ônibus, avião, carro alugado", "Passagem, embarque, mala, mochila", "Vacina — Anvisa requirements internas", "Brasil é continental — voar é frequentemente necessário"]],
  [43, "Pedindo direções", ["À direita, à esquerda, em frente, atrás", "Perto, longe, aqui, ali, lá", "Com licença, onde fica...?", "Brasileiro tende dar direção 'na rua tal, quase chegando'"]],
  [44, "Transporte público", ["Ônibus, metrô, BRT, trem urbano", "Bilhete único (SP), RioCard (RJ)", "Uber, 99, BlaBlaCar — apps dominantes", "Trânsito de SP — proverbial nightmare global"]],
  [45, "Cidades brasileiras", ["Rio — Cristo Redentor, Pão de Açúcar, praias", "São Paulo — maior cidade hemisfério sul, finanças", "Salvador — capital primeira, cultura africana", "Brasília — modernismo, Oscar Niemeyer, Lucio Costa"]],
  [46, "Verbos modais", ["Poder (can/may): posso, pode, pode, podemos, podem", "Querer (want): quero, quer, quer, queremos, querem", "Dever (should/must): devo, deve, deve, devemos, devem", "Modal + infinitivo (no preposição needed)"]],
  [47, "Gerúndio brasileiro", ["Estou fazendo = I'm doing (BR favorite!)", "PT-PT alternative: estou a fazer — VERY BR-PT difference", "Ela tá vindo, tô comendo, estamos estudando", "Tô (= estou) — informal abbreviation"]],
  [48, "Review A1.3 + gestos", ["Recap passado + hobbies + futebol + bossa", "Joinha (thumbs up) = OK, but BR mostly", "Aspas no ar — ironia/sarcasmo", "Mão balançando na frente da boca — saboroso, delicia"]],
]);

// ============================================================================
// A2 — Pre-Intermediate (4 sublevels × 16 = 64 sesi)
// ============================================================================

const a2_1 = toSessions([
  [49, "Futuro simples + ir + infinitivo", ["Futuro sintético: -ar/er/ir + ei/á/á/emos/ão/ão", "Eu falarei, comerei, irei", "Ir + infinitivo PREFERRED in spoken BR: vou falar, vai comer", "Future morphological declining in casual speech"]],
  [50, "Planos pro fim de semana", ["O que você vai fazer no fim de semana?", "Vou pra praia, vou viajar, vou ficar em casa", "Vamos sair! — convite informal", "Marcar churrasco — Brazilian weekend ritual"]],
  [51, "Comparações", ["Mais... (do) que: Rio é maior que Recife", "Menos... (do) que: SP é menos quente que Rio", "Tão... quanto/como: tão grande quanto", "Melhor/pior (irregular comparatives)"]],
  [52, "Superlativos", ["Relativo: o mais... de — Rio é a mais bonita do Brasil", "Absoluto: -íssimo — lindíssimo, gostosíssimo, ótimo", "Maior, melhor, pior (irregular)", "Brasileiros loooove exaggeration: tão lindo!"]],
  [53, "Praias brasileiras", ["Copacabana, Ipanema, Leblon — Rio iconic", "Praia do Forte (BA), Jericoacoara (CE), Fernando de Noronha", "Praia do Sancho — frequently top global ranking", "Cultura de praia: futevôlei, frescobol, caipirinha na areia"]],
  [54, "Carnaval", ["Maior festa popular mundial — 4 dias antes Quarta de Cinzas", "Rio — Sambódromo, escolas de samba parade", "Salvador — trio elétrico, blocos de rua", "Recife/Olinda — frevo, maracatu, bonecos gigantes"]],
  [55, "Bossa nova deep", ["Origem 1950s Copacabana/Ipanema apartments", "Tom Jobim — 'Garota de Ipanema', 'Desafinado'", "João Gilberto — voice + violão revolution", "Vinícius de Moraes — poeta diplomata letrista"]],
  [56, "Samba culture", ["Samba origem favelas Rio + Bahia heritage afro", "Mangueira, Portela, Salgueiro, Imperatriz — escolas históricas", "Pagode — variant samba dos anos 80", "Cartola, Nelson Cavaquinho — sambistas legends"]],
  [57, "Pelé + heritage", ["Edson Arantes do Nascimento (1940-2022) — Três Corações MG", "Único 3x campeão mundial como jogador (58, 62, 70)", "1281 gols carreira — record histórico", "Pelé = Rei do Futebol, ícone global do Brasil"]],
  [58, "Copas do Mundo", ["1958 Suécia — Pelé 17 anos estreia mundial", "1962 Chile — Garrincha brilha", "1970 México — equipe considerada melhor de todos os tempos", "1994 USA — Romário, 2002 Coréia — Ronaldo, Rivaldo"]],
  [59, "MPB — Música Popular Brasileira", ["Tropicália movement 1960s: Caetano Veloso, Gilberto Gil", "Chico Buarque — letrista genial, oposição ditadura", "Elis Regina — voz lendária", "Maria Bethânia, Gal Costa, Maria Rita — divas"]],
  [60, "Pronomes oblíquos", ["Me, te, lhe, nos, vos, lhes (átonos)", "Eu te amo (BR pre-verbal placement = NATURAL)", "PT-PT: eu amo-te (post-verbal) — sounds super formal in BR", "Comum em BR: me dá, me liga, te conto"]],
  [61, "Pronomes possessivos", ["Meu/minha, seu/sua, nosso/nossa, deles/delas", "Concordância: minha mãe, meus pais", "BR uses 'seu/sua' for 'your' (você) — overlaps with 'his/her'", "Context-dependent — fonte de ambiguidade comum"]],
  [62, "Tô/tá/cê/pra — coloquialismos", ["Tô = estou, tá = está", "Cê = você (super informal)", "Pra = para, pro = para o, pras = para as", "Brasileiro fala muito reduzido vs escreve formal"]],
  [63, "Combinações pronominais", ["Me dá ele = give it to me (informal common)", "Formal: dá-mo (rare in BR speech)", "Verbo + pronome combos em BR: te conto isso depois", "Brazilian pronoun placement = pre-verbal naturalized"]],
  [64, "Review A2.1 + Rio tour", ["Recap futuro + comparações + samba", "Cristo Redentor — Corcovado, 1931 inaugurado", "Pão de Açúcar — bondinho 1912", "Lapa, Santa Teresa, Copacabana, Ipanema — bairros iconic"]],
]);

const a2_2 = toSessions([
  [65, "Reservar hotel", ["Quarto solteiro, casal, duplo, triplo", "Com café da manhã (geralmente incluso)", "Wi-Fi, ar condicionado (essencial no Brasil!), piscina", "Booking + Hoteis.com + Decolar — apps comuns"]],
  [66, "No aeroporto", ["Check-in, embarque, conexão, escala", "Bagagem despachada, mão", "GRU (Guarulhos SP), GIG (Galeão RJ), CGH (Congonhas SP)", "Latam, Gol, Azul — companhias domésticas major"]],
  [67, "Amazônia", ["Maior floresta tropical do mundo", "Manaus — capital Amazonas, Teatro Amazonas", "Rios: Amazonas, Negro, Solimões, Encontro das Águas", "Povos indígenas: Yanomami, Kayapó, Tukano (>200 etnias)"]],
  [68, "Pantanal + ecoturismo", ["Maior planície alagada do mundo — MS e MT", "Fauna: jacaré, capivara, onça-pintada, tuiuiú", "Bonito MS — flutuação rios cristalinos", "Foz do Iguaçu — Cataratas, mais visitada do Brasil"]],
  [69, "Profissões", ["Médico, advogado, engenheiro, professor", "Empresário, autônomo, funcionário público", "TI: programador, analista, desenvolvedor", "Concursado — public sector dream job culture"]],
  [70, "Entrevista de emprego", ["Currículo (CV), entrevista, vaga, salário", "Pretensão salarial, benefícios", "VT (vale transporte) + VR/VA (vale refeição/alimentação)", "PCD — pessoa com deficiência cotas"]],
  [71, "CLT vs MEI vs PJ", ["CLT — registrado, 13º + férias + FGTS + INSS", "MEI — Microempreendedor Individual, ate R$ 81k/ano", "PJ — pessoa jurídica, mais flexibilidade fiscal", "Pejotização — gig economy controversa"]],
  [72, "CTPS + direitos trabalhistas", ["Carteira de Trabalho — agora digital", "Aviso prévio, FGTS, multa 40%", "Hora extra, adicional noturno, periculosidade", "MTE — Ministério do Trabalho fiscaliza"]],
  [73, "13º salário + férias", ["13º — pago dezembro, 1 mês a mais por ano", "Férias remuneradas — 30 dias + 1/3 a mais", "Direito constitucional, cláusula pétrea", "Unique to Brazil — historic Vargas era heritage"]],
  [74, "Email comercial", ["Prezado(a) Sr./Sra. — formal", "Olá [nome] — semi-formal mais comum em BR", "Atenciosamente, Cordialmente, Abraço (informal)", "Anexo (attachment), seguindo no email anterior"]],
  [75, "Condicional", ["-ar/er/ir + ia/ia/ia/íamos/iam/iam", "Eu falaria, comeria, abriria", "Polite requests: gostaria de, poderia", "Hipotético: se eu pudesse, viajaria"]],
  [76, "Pedidos educados", ["Gostaria de + infinitivo", "Você poderia + infinitivo?", "Seria possível...?", "Desculpa incomodar, mas..."]],
  [77, "Pechinchar — Brazilian art", ["Tá caro, dá pra fazer melhor?", "Aceita pix? Tem desconto à vista?", "Feiras e mercados — pechincha standard", "Lojas e shoppings — preço tabelado, menos espaço"]],
  [78, "Empresas brasileiras", ["Petrobras — petróleo estatal", "Vale — mineração global", "Embraer — aviões regionais world-class", "JBS — maior produtor proteína animal mundo"]],
  [79, "Startups + economia digital", ["Nubank — fintech, maior banco digital América Latina", "iFood — food delivery dominante", "Magazine Luiza — varejo + tech transformation", "Stone, PagSeguro — payments revolução"]],
  [80, "Review A2.2 + SP business", ["Recap futuro + trabalho + viagem", "São Paulo — Av Paulista, Faria Lima", "Maior cidade hemisfério Sul, ~22M metropolitana", "Capital econômica, financeira, cultural — pluralidade extrema"]],
]);

const a2_3 = toSessions([
  [81, "Subjuntivo presente intro", ["Conjugação: -ar → -e/-e/-e/-emos/-em; -er/ir → -a/-a/-a/-amos/-am", "Espero que você venha (não 'vem')", "Acho que (indicativo) vs talvez (subjuntivo)", "Que ele seja, tenha, faça (irregulares)"]],
  [82, "Expressar opinião", ["Acho que + indicativo (acho que sim)", "Acredito que, penso que, suponho que", "Na minha opinião / Pra mim...", "Concordo, discordo, depende"]],
  [83, "Emoções", ["Feliz, contente, triste, bravo, cansado, animado", "Surpreso, decepcionado, preocupado", "Tô feliz! Tô puto! (informal — angry)", "Saudade — untranslatable nostalgia/longing word"]],
  [84, "Esperanças + desejos", ["Espero que + subjuntivo", "Tomara que (I hope) — typically Brazilian!", "Tomara que dê tudo certo", "Que pena! Que bom! Que legal!"]],
  [85, "Dúvida + incerteza", ["Talvez + subjuntivo (talvez ele venha)", "Pode ser que + subjuntivo", "Não tenho certeza, é possível, vai que (uncertainty)", "Sei lá — common 'I don't know' casual"]],
  [86, "Imperativo", ["Affirmativo: fala, come, abre (tu form, used in commands)", "Negativo: não fale, não coma, não abra (subjuntivo!)", "Vamos! — let's", "Brasileiro usa imperativo mais suave que outras línguas"]],
  [87, "Dar conselhos", ["Você deveria + infinitivo", "Eu acho que você precisa de", "Se eu fosse você... (subj imperfeito)", "Por que você não... ?"]],
  [88, "Discordar gentilmente", ["Não concordo totalmente, mas...", "Entendo seu ponto, porém...", "Olha, eu vejo de outro jeito...", "Brazilian conflict avoidance — softening cultural"]],
  [89, "Cultura de debate", ["Brasileiros gostam de discutir, mas evitam confronto direto", "Religião + política — tabu em mesa familiar", "Futebol — debate aceitável, paixão acceptable", "Conversa de boteco — sociology informal"]],
  [90, "Política brasileira", ["República presidencialista federativa", "Presidente: Lula (3º mandato desde 2023)", "Antecessor: Bolsonaro (2019-2022)", "Congresso: Câmara dos Deputados + Senado Federal"]],
  [91, "Jornais brasileiros", ["Folha de S.Paulo, O Globo, Estadão — major", "Veja, Época, Carta Capital — semanais", "G1, UOL, Estadão — portais", "Jornal Nacional — TV news heritage, Globo since 1969"]],
  [92, "Verbos opinião + subjuntivo", ["Acho que + indicativo (certainty)", "Duvido que + subjuntivo (doubt)", "É bom que, é importante que + subjuntivo", "Triggers list comprehensive"]],
  [93, "Verbos reflexivos", ["Lavar-se, levantar-se, chamar-se, vestir-se", "Pronouns: me, te, se, nos, vos, se", "Posição: BR pre-verbal (me lavo) vs PT post-verbal (lavo-me)", "Reciprocidade: eles se amam, se entendem"]],
  [94, "Reclamar", ["Tô cansado, tô sem paciência", "Que saco! Que mico! (embarrassment)", "Mas pelo amor de Deus...", "Brazilian complaining — animated, emotional, eventually let go"]],
  [95, "Pedir desculpas", ["Desculpa (informal), Me desculpe (more formal)", "Sinto muito, perdão", "Foi mal — gíria informal common", "Tudo bem, não foi nada, sem problemas (responses)"]],
  [96, "Review A2.3 + conversa botequim", ["Recap subjuntivo + opinião + desacordo", "Boteco/botequim — bar simples, conversation hub", "Cerveja gelada + porção (petisco)", "Conversa boteco — sociologia brasileira informal"]],
]);

const a2_4 = toSessions([
  [97, "Brasil colonial", ["22 abril 1500 — Pedro Álvares Cabral 'descobre'", "Capitanias hereditárias — primeira divisão", "Pau-brasil — primeira exploração econômica", "Tordesilhas — divisão Espanha vs Portugal 1494"]],
  [98, "Império (1822-1889)", ["7 setembro 1822 — Independência (Dom Pedro I, grito Ipiranga)", "Dom Pedro II — reinado 50+ anos", "Lei Áurea 1888 — abolição escravidão (last in Western Hemisphere)", "Proclamação República 15 novembro 1889"]],
  [99, "Era Vargas (1930-1954)", ["Revolução 1930 — fim Velha República (café com leite)", "Estado Novo (1937-45) — autoritário", "CLT 1943 — direitos trabalhistas codificados", "Petrobras 1953 'O petróleo é nosso'"]],
  [100, "Ditadura militar 1964-1985", ["Golpe 1964 — apoio EUA Guerra Fria", "AI-5 1968 — endurecimento, censura", "Anos de chumbo — tortura, desaparecidos", "Diretas Já 1984 — movimento redemocratização"]],
  [101, "Redemocratização + Constituição 88", ["Eleição indireta Tancredo Neves 1985 (faleceu)", "Sarney presidente, depois Collor (impeachment 1992)", "Constituição cidadã 5 outubro 1988", "Plano Real 1994 FHC — estabilização hiperinflação"]],
  [102, "Brasil moderno", ["FHC (1995-2002), Lula (2003-2010, 2023-)", "Dilma Rousseff — impeachment 2016", "Temer, Bolsonaro, Lula 2023", "Brasil potência regional + South-South diplomacy"]],
  [103, "5 regiões geográficas", ["Norte — Amazônia, AM, PA, RR, RO, AC, AP, TO", "Nordeste — BA, PE, CE, MA, PI, RN, PB, AL, SE", "Centro-Oeste — Brasília, MT, MS, GO", "Sudeste — SP, RJ, MG, ES | Sul — PR, SC, RS"]],
  [104, "Norte — Amazônia", ["Manaus — Zona Franca, Encontro das Águas", "Belém — Círio de Nazaré, açaí origem", "Cultura ribeirinha + indígena predominante", "Florestas + rios + biodiversidade extrema"]],
  [105, "Nordeste", ["Salvador BA — capital primeira, axé, candomblé", "Recife/Olinda PE — frevo, maracatu", "Fortaleza CE — praias + forró", "Sertão — Euclides da Cunha 'Os Sertões'"]],
  [106, "Centro-Oeste", ["Brasília DF — modernismo Niemeyer/Lucio Costa", "Goiânia + Cuiabá — agronegócio centro", "Pantanal — ecoturismo internacional", "Cerrado — segundo bioma maior Brasil"]],
  [107, "Sudeste + Sul", ["São Paulo — economia, finanças, pluralidade", "Rio de Janeiro — turismo, cultura, praias", "Minas Gerais — barroco, pão de queijo, queijo", "Sul — colonização europeia, gaúcho, churrasco"]],
  [108, "Festas + tradições", ["Carnaval — fevereiro/março", "São João — junho, Nordeste forte (Caruaru, Campina Grande)", "Réveillon — Copacabana 2M+ pessoas roupa branca", "Festa Junina — quadrilha, milho, fogueira"]],
  [109, "Culinária regional", ["Norte: tacacá, pato no tucupi, açaí (genuíno)", "Nordeste: acarajé, vatapá, baião de dois", "Sudeste: feijoada (RJ), feijão tropeiro (MG), pizza (SP)", "Sul: churrasco gaúcho, chimarrão"]],
  [110, "Religião brasileira", ["Catolicismo majoritário decrescente (~50%)", "Evangélicos/Pentecostais crescimento exponencial (~30%)", "Religiões afro-brasileiras: Candomblé, Umbanda", "Espiritismo (Kardec) — Brasil tem mais kardecistas que França"]],
  [111, "Religiões afro-brasileiras", ["Candomblé — Bahia, raízes Yoruba", "Umbanda — sincretismo BR único", "Orixás: Iemanjá, Xangô, Oxum, Ogum", "Sincretismo: Iemanjá = Nossa Senhora dos Navegantes (RJ Réveillon)"]],
  [112, "Review A2.4 + carnaval profundo", ["Recap história + regiões + cultura", "Carnaval Rio — escolas + Sambódromo Marquês de Sapucaí", "Carnaval Salvador — trio elétrico, blocos", "Carnaval Olinda — frevo, bonecos gigantes"]],
]);

// ============================================================================
// B1 — Intermediate (5 sublevels × 16 = 80 sesi)
// ============================================================================

const b1_1 = toSessions([
  [113, "Mais-que-perfeito", ["Tinha/havia + particípio passado", "Quando cheguei, ela tinha saído", "Past-before-past for narrative depth", "Forma simples (literária): falara, comera — raríssima em BR fala"]],
  [114, "Concordância de tempos", ["Presente → presente", "Passado → imperfeito + perfeito coordination", "Past hypothetical → conditional perfect", "Brazilian tense system overview"]],
  [115, "Conectivos lógicos", ["Porque (because), já que/visto que (since)", "Embora/apesar de + subjuntivo (although)", "Contudo, no entanto, todavia (however)", "Portanto, logo, assim (therefore)"]],
  [116, "Contar histórias", ["Era uma vez... (once upon a time)", "De repente, então, finalmente", "Estrutura narrative: situação inicial, conflito, resolução", "Verbos narrative: aconteceu, ocorreu, surgiu"]],
  [117, "Folclore brasileiro", ["Saci-Pererê — moleque de uma perna só", "Curupira — protetor floresta, pés invertidos", "Iara — sereia rios amazônicos", "Boto cor-de-rosa — transforma em homem"]],
  [118, "Monteiro Lobato + Sítio", ["Monteiro Lobato (1882-1948) — pai literatura infantil brasileira", "Sítio do Picapau Amarelo — Emília, Visconde, Tia Anastácia", "Reinações de Narizinho — clássico", "Controvérsias atuais — racismo nas obras antigas"]],
  [119, "Poetas brasileiros base", ["Cecília Meireles — Romanceiro da Inconfidência", "Manuel Bandeira — Itinerário de Pasárgada", "Carlos Drummond — Sentimento do Mundo", "Vinícius — Soneto de Fidelidade"]],
  [120, "Condicional perfeito", ["Teria/ria + particípio passado", "Eu teria ido se soubesse", "Future-in-the-past", "Common in counterfactuals"]],
  [121, "Hipotético — se + imperfeito do subjuntivo", ["Conjugação: -asse/-esse/-isse", "Se eu fosse rico, viajaria pelo mundo", "Common in dreams + speculations", "Brazilian uses constantly in casual speech"]],
  [122, "Hipotético passado", ["Se eu tivesse sabido, teria ido", "Mais-que-perfeito do subjuntivo + condicional perfeito", "Counterfactual past", "Drama queens love these constructions"]],
  [123, "Voz passiva", ["Ser + particípio + por", "A casa foi construída pelo arquiteto", "Estar + particípio (state) vs ser + particípio (action)", "BR favors active voice more than English"]],
  [124, "Se impessoal + se passivante", ["Vende-se carros (passive sense)", "Trabalha-se muito no Brasil (impersonal)", "Common in placas + classifieds", "Pronominal placement formal vs informal"]],
  [125, "Discurso indireto", ["Direto: Ele disse 'Estou cansado'", "Indireto: Ele disse que estava cansado", "Time shifts em past reporting", "Brazilian press style"]],
  [126, "Pronomes complexos", ["Lhe (a ele/ela), lhes (a eles/elas)", "BR muitas vezes substitui por 'para ele/ela'", "Combinações: dizer-lhe, dar-lhe — formal escrito", "Coloquial: 'falar pra ele', 'dar pra ela'"]],
  [127, "Gírias + idiomáticas", ["Beleza! (cool, OK)", "Mó legal! (very cool — mó = muito)", "Tá ligado? (you got it?)", "Cara, mano, véio — informal address"]],
  [128, "Review B1.1 + humor brasileiro", ["Recap passado + hipotético + gírias", "Humor brasileiro — autocrítico, autoironia", "Stand-up: Whindersson Nunes, Maurício Meirelles, Ed Gama", "Telenovela humor + Casseta & Planeta heritage"]],
]);

const b1_2 = toSessions([
  [129, "Cinema Novo", ["Movement 1960s — 'uma câmera na mão e uma ideia na cabeça'", "Glauber Rocha — Deus e o Diabo na Terra do Sol", "Nelson Pereira dos Santos — Vidas Secas", "Estética da fome — manifesto Glauber"]],
  [130, "Cinema brasileiro moderno", ["Walter Salles — Central do Brasil, Diários de Motocicleta", "Fernando Meirelles — Cidade de Deus, O Jardineiro Fiel", "Karim Aïnouz, Anna Muylaert — diretores premiados", "Kleber Mendonça Filho — Aquarius, Bacurau"]],
  [131, "MPB profunda", ["Caetano Veloso — Tropicália, voz polimorfa", "Gilberto Gil — Refazenda, Aquele Abraço, Ministro Cultura", "Chico Buarque — Construção, A Banda, Cálice (censura)", "Elis Regina — voz lendária, faleceu jovem 36 anos"]],
  [132, "Funk carioca", ["Origem favelas Rio anos 80-90", "Funk ostentação vs funk consciente", "Anitta, Ludmilla — pop funk crossover", "Polêmica + reconhecimento patrimônio cultural imaterial"]],
  [133, "Sertanejo + axé + forró", ["Sertanejo — música mais ouvida do Brasil", "Sertanejo universitário: Jorge & Mateus, Maiara & Maraisa", "Axé — Salvador, Daniela Mercury, Ivete Sangalo", "Forró — Luiz Gonzaga (Rei do Baião), Asa Branca anthem"]],
  [134, "Globo + telenovelas", ["TV Globo — fundada 1965, dominante", "Manoel Carlos — autor 'das Helenas'", "Aguinaldo Silva — Vale Tudo, Senhora do Destino", "Pantanal (1990 + remake 2022) — épico nacional"]],
  [135, "Carnaval estrutura", ["Escolas de samba — sociedades, bairros, identidade", "Componentes: alas, alegorias, samba-enredo, bateria, mestre-sala/porta-bandeira", "Liesa — Liga Independente Escolas Samba Rio", "Patrimônio Cultural Imaterial UNESCO frevo + samba"]],
  [136, "Capoeira", ["Origem Bahia século XIX, escravos angolanos", "Mistura luta + dança + música", "Mestre Bimba (regional) + Mestre Pastinha (angola)", "Patrimônio UNESCO 2014, presente mundialmente"]],
  [137, "Semana de Arte Moderna 1922", ["Fevereiro 1922 SP — marco modernismo brasileiro", "Oswald de Andrade — Manifesto Antropófago 1928", "Mário de Andrade — Macunaíma, polígrafo", "Tarsila do Amaral — Abaporu, A Negra"]],
  [138, "Mineiridade", ["Minas Gerais identidade — barroco, café, mineração", "Aleijadinho — escultor barroco Ouro Preto, Congonhas", "Comida: queijo Minas, pão de queijo, doce de leite", "Estilo mineiro: introspectivo, hospitaleiro, comilão"]],
  [139, "Cultura praiana", ["Surf — Maya Gabeira big wave records", "Vôlei de praia — gold medals tradicional", "Futevôlei — invento brasileiro carioca", "Praia = espaço social democrático brasileiro"]],
  [140, "Slow food brasileiro", ["Movimento Slow Food Brasil + feiras orgânicas", "Roberto Smeraldi — promoção comida regional", "Ativismo gastronômico anti-fast food", "Resgate de espécies + sementes crioulas"]],
  [141, "Cafezinho culture", ["Café = identidade nacional ('cafezinho' diminutivo afetuoso)", "Servido em xícara pequena, doce ou sem açúcar", "Hora do café — pausa social trabalho", "Brasil 2º maior produtor + consumidor mundo"]],
  [142, "Churrasco gaúcho", ["Origem RS — pampas, gaúcho heritage", "Espeto corrido + rodízio — invenção brasileira", "Carnes: picanha, costela, fraldinha, alcatra", "Chimarrão acompanha — erva-mate quente"]],
  [143, "Gestos brasileiros", ["Joinha — OK (mais BR que outros lusófonos)", "Mão com dedos beijados — saboroso/lindo", "Mão sacudindo — espera!", "Bater na madeira — anti-azar, sorte"]],
  [144, "Review B1.2 + conversa boteco", ["Recap cultura + música + cinema", "Simulação conversa boteco realista", "Topics: futebol, política, novela, food", "Brazilian conversation: animada, sobreposta, calorosa"]],
]);

const b1_3 = toSessions([
  [145, "Economia brasileira", ["9ª economia mundial PIB", "Setores: agronegócio, indústria, serviços, mineração", "Bovespa B3 — bolsa de valores SP", "Real (R$) — Plano Real 1994, estabilidade"]],
  [146, "Desigualdade social", ["Gini index dos mais altos mundo", "1% mais ricos — concentração extrema renda", "Bolsa Família — transferência condicional, modelo global", "10 milhões+ atendidos histórico"]],
  [147, "Favelas", ["~12M brasileiros vivem em favelas", "Rocinha (RJ) — maior do Brasil", "Complexo do Alemão, Maré, Heliópolis (SP)", "Cultura: funk, samba origem, MV Bill, Mano Brown"]],
  [148, "Movimentos sociais", ["MST — Movimento Sem Terra, reforma agrária", "MTST — Movimento Sem Teto, urbano", "Black Lives Matter brasileiro — Marielle Franco legacy", "Movimento indígena APIB"]],
  [149, "Sistema educacional", ["Ensino fundamental (1-9) + médio (10-12) + superior", "Pública gratuita constitucional vs privada", "ENEM — Exame Nacional Ensino Médio (vestibular nacional)", "Universidade pública = elite acesso (paradoxo)"]],
  [150, "Universidades top", ["USP — Universidade de São Paulo, top BR + LatAm", "UNICAMP — Campinas, pesquisa intensa", "UFRJ — Federal Rio, tradição centenária", "ITA + IME — engenharia elite militar"]],
  [151, "SUS deep", ["Sistema Único de Saúde — 1988 Constituição", "Universal + gratuito + integral (princípios)", "Maior sistema público saúde mundo (200M+ usuários)", "Vacinação — modelo mundial (Sabin, BCG, COVID)"]],
  [152, "Welfare brasileiro", ["Bolsa Família → Auxílio Brasil → Bolsa Família again", "INSS — previdência social", "Seguro-desemprego, abono salarial", "Cota racial + sociais — universidades"]],
  [153, "3 poderes", ["Executivo — Presidente + Ministros + governadores", "Legislativo — Congresso (Câmara + Senado)", "Judiciário — STF, STJ, TJs estaduais", "Independência harmônica (Art. 2 CF)"]],
  [154, "Partidos políticos", ["PT — esquerda, Lula", "PL — direita, Bolsonaro filiado", "MDB — centro histórico", "PSDB — centro-direita FHC heritage"]],
  [155, "Mercosul + integração", ["Mercosul 1991 — Argentina, Brasil, Paraguai, Uruguai", "Tratado Assunção, posteriormente Ouro Preto", "Bolívia, Chile, Peru, Colômbia — associados", "Desafios: comércio, livre circulação parcial"]],
  [156, "Imigração no Brasil", ["Histórica: portuguesa, italiana, alemã, japonesa, libanesa, síria", "São Paulo — maior comunidade japonesa fora Japão", "Recente: venezuelanos, haitianos, sírios refugiados", "Política migratória: lei nova 2017 mais humanitária"]],
  [157, "Indígenas brasileiros", ["~900k pessoas, ~305 etnias, ~270 línguas", "Yanomami (RR/AM), Kayapó (PA), Tupinambá (SP)", "FUNAI — órgão indigenista federal", "Demarcação terras — disputa contínua"]],
  [158, "Cultura LGBTQIA+ Brasil", ["Parada SP — maior parada gay do mundo (~3M pessoas)", "STF reconheceu casamento 2011 + união estável", "Violência LGBTfóbica — uma das mais altas", "Pabllo Vittar, Liniker — artistas mainstream"]],
  [159, "Amazônia + clima", ["Desmatamento — crise global", "Inpe — monitora desmatamento por satélite", "COP — Brasil sediará COP30 Belém 2025", "Lula vs Bolsonaro — política ambiental polarizada"]],
  [160, "Review B1.3 + leitura jornal", ["Recap sociedade + economia + política", "Leitura de manchetes Folha + G1", "Vocabulário news: PL, MP, CPI, STF, IOF, Selic", "Acompanhar Brasil atual"]],
]);

const b1_4 = toSessions([
  [161, "Machado de Assis", ["1839-1908 Rio, mulato, autodidata", "Memórias Póstumas de Brás Cubas — narrador defunto", "Dom Casmurro — Capitu, ciúmes, ambiguidade", "Quincas Borba, Esaú e Jacó — realismo psicológico"]],
  [162, "Realismo brasileiro", ["Reação ao Romantismo idealizado", "Aluísio Azevedo — O Cortiço (naturalismo)", "Raul Pompéia — O Ateneu", "Crítica social + análise psicológica"]],
  [163, "Jorge Amado", ["1912-2001 Itabuna BA", "Gabriela, Cravo e Canela — Ilhéus, cacau", "Dona Flor e Seus Dois Maridos", "Bahia, sensualidade, sincretismo religioso"]],
  [164, "Clarice Lispector", ["1920-1977 Ucrânia-Brasil", "A Hora da Estrela — Macabéa, Nordeste, SP", "A Paixão Segundo G.H. — epifania filosófica", "Estilo lírico, introspectivo, existencial"]],
  [165, "Guimarães Rosa", ["1908-1967 MG, médico, diplomata", "Grande Sertão: Veredas — épico sertanejo", "Sagarana, Primeiras Estórias", "Linguagem inventiva — neologismos, sintaxe rosiana"]],
  [166, "Modernismo + Macunaíma", ["Mário de Andrade — Macunaíma 'herói sem nenhum caráter'", "Oswald de Andrade — Pau-Brasil, Antropofagia", "Movimentos: Antropofagia (devoração cultural)", "Brasil = cultura mestiça assumida"]],
  [167, "Drummond + poesia", ["Carlos Drummond de Andrade (1902-1987) Itabira MG", "No meio do caminho tinha uma pedra (1928)", "Sentimento do Mundo, A Rosa do Povo", "Poeta maior modernismo segunda fase"]],
  [168, "Vinícius + Cecília", ["Vinícius de Moraes — Soneto de Fidelidade, Garota de Ipanema (letra)", "Cecília Meireles — Romanceiro Inconfidência, lírica feminina", "Murilo Mendes, Mário Quintana — vozes individuais", "Brasil poesia profusa século XX"]],
  [169, "Paulo Coelho + Brasil", ["1947 Rio, fenômeno global Alquimista (1988)", "320M+ livros vendidos, 88 línguas", "Acadêmico ABL desde 2002", "Polêmica crítica — best-seller vs literatura 'séria'"]],
  [170, "Literatura contemporânea", ["Conceição Evaristo — Olhos d'Água, escrevivência", "Itamar Vieira Jr. — Torto Arado (Jabuti 2019)", "Bernardo Kucinski — K., Yebra", "Tatiana Salem Levy, Cristóvão Tezza, Daniel Galera"]],
  [171, "Crônica — gênero brasileiro", ["Gênero híbrido jornal+literatura", "Rubem Braga — pai da crônica moderna", "Luís Fernando Veríssimo — humor cotidiano", "Fernando Sabino, Carlos Heitor Cony, Antonio Prata"]],
  [172, "Análise poesia", ["Métrica: redondilha, decassílabo", "Rima: ABAB, ABBA, livre", "Figuras retóricas: metáfora, anáfora, sinestesia", "Análise textual ENEM style"]],
  [173, "Escrever conto", ["Estrutura: introdução, desenvolvimento, clímax, desfecho", "Foco narrativo — 1ª vs 3ª pessoa", "Conto brasileiro tradição forte — Machado, Rubem Fonseca", "Construir personagem + cenário + ação"]],
  [174, "Exercícios escrita criativa", ["Prompt: descreva uma manhã no Rio", "Continue uma história em 300 palavras", "Reescreva conto sob outro POV", "Estilo imitativo — Machado vs Clarice"]],
  [175, "Metáforas brasileiras", ["Brasileiro AMA metáforas + comparações criativas", "'Lindo de morrer', 'gostoso pra cachorro'", "Metáforas natureza, futebol, comida frequentes", "Criar metáforas próprias — exercise"]],
  [176, "Review B1.4 + seu conto", ["Recap literatura clássica + moderna", "Escreva conto 500 palavras", "Tema: lembrança brasileira ou personagem", "Workshop peer review se possível"]],
]);

const b1_5 = toSessions([
  [177, "Português formal + senhor", ["Você default informal-neutro", "Senhor/Senhora — respeito (chefes, idosos, formal)", "O senhor desempenha 'lei' role em PT-PT", "BR uses senhor more sparingly, você ubiquitous"]],
  [178, "Email comercial BR", ["Prezado(a) [nome] — formal padrão", "Saudações cordiais, abraços, atenciosamente — closings", "Encaminho, segue anexo, conforme combinado", "Brazilian biz email: warmer than English equivalent"]],
  [179, "Currículo brasileiro", ["Dados pessoais (CPF, idade — sim no BR!)", "Foto recomendada", "Objetivo profissional, experiência, formação", "LinkedIn + Catho + Vagas.com — major sites"]],
  [180, "Entrevista emprego", ["Carta de apresentação opcional mas plus", "Pretensão salarial — abordar com cuidado", "Cultura empresa fit — pergunta padrão", "Soft skills + hard skills balance"]],
  [181, "Reuniões corporativas", ["Pauta, ata, deliberação", "Brainstorming, brainstorm — anglicismo aceito", "Cafezinho durante reunião = ritual", "Brazilian meetings — frequentemente longas, relacionais"]],
  [182, "Negociação BR style", ["Relacionamento PRIMEIRO, negócio segundo", "Almoço de negócios essencial", "Jeitinho — flexibilidade criativa para soluções", "Não dizer 'não' diretamente — softening cultural"]],
  [183, "Apresentações", ["Estrutura clássica + storytelling", "PowerPoint cultura — slides explanados oralmente", "Q&A acolhedor", "Brazilian audiences — engajadas, perguntam aberto"]],
  [184, "Marketing brasileiro", ["Branding, posicionamento, target", "Influencer marketing — gigantesco no Brasil", "Brand awareness, engajamento, ROI", "Mercado digital cresce exponencial"]],
  [185, "E-commerce BR", ["Mercado Livre — pioneiro LatAm", "Magazine Luiza — transformação digital", "Shopee, AliExpress — competition Chinese", "Black Friday brasileira — eventos próprios"]],
  [186, "Sistema bancário + Pix", ["Bancos: Itaú, Bradesco, Santander, BB, Caixa", "Nubank — neobank dominante", "Pix (2020) — pagamento instantâneo gratuito 24/7", "Brasil + adotaram fastest globally"]],
  [187, "Imobiliário", ["Compra, aluguel, financiamento", "Caixa Econômica Federal — financia majority", "ITBI, IPTU — impostos", "Apartamento (urbano) vs casa (subúrbio)"]],
  [188, "Direito básico", ["Constituição Federal, Código Civil, Código Penal", "Justiça do Trabalho — única no mundo", "Defensoria pública vs advocacia privada", "STF — Supremo, instância suprema"]],
  [189, "Tributação", ["IRPF — Imposto Renda Pessoa Física, anual março/abril", "IRPJ — empresas", "ICMS, IPI, ISS — indiretos", "Receita Federal — Leão (logo iconic)"]],
  [190, "CNPJ + MEI + Simples", ["CNPJ — Cadastro Nacional Pessoa Jurídica", "MEI — Microempreendedor, até R$ 81k/ano", "Simples Nacional — regime simplificado PMEs", "Lucro Real, Presumido — opções maiores"]],
  [191, "Home office Brasil", ["Trabalho remoto explodiu pós-COVID", "Híbrido — 2-3 dias casa default many companies", "Anywhere office — nomadismo digital brasileiro", "CLT regulamenta home office desde 2017"]],
  [192, "Review B1.5 + entrevista simulada", ["Recap business Portuguese", "Simule entrevista emprego 20 min", "Falar experiência + objetivos + cultura fit", "Feedback registro + vocabulário"]],
]);

// ============================================================================
// B2 — Upper Intermediate (7 sublevels × 16 = 112 sesi)
// ============================================================================

const b2_1 = toSessions([
  [193, "Subjuntivo imperfeito", ["-asse, -esse, -isse padrão", "Falasse, comesse, abrisse", "Se eu pudesse, viajaria", "Common em hipóteses + desejos passados"]],
  [194, "Subjuntivo mais-que-perfeito", ["Tivesse + particípio passado", "Se eu tivesse sabido, teria ido", "Past counterfactual", "Drama queens BR favorite tense"]],
  [195, "Período hipotético — 3 tipos", ["Tipo 1: Se + presente, futuro (Se chover, ficarei em casa)", "Tipo 2: Se + imperfeito subj, condicional (Se tivesse dinheiro, viajaria)", "Tipo 3: Se + mais-que-perfeito subj, condicional perfeito", "Mistos: Se tivesse estudado, hoje seria médico"]],
  [196, "Subjuntivo em subordinadas", ["Conjunções: embora, ainda que, mesmo que, contanto que", "Quando + subjuntivo (futuro): quando você vier", "Talvez, possivelmente, é provável que + subj", "Triggers comprehensive list"]],
  [197, "Sutileza na opinião", ["Argumentar vs afirmar vs sugerir vs propor", "Sob meu ponto de vista, na minha ótica, na minha visão", "Atenuadores: meio que, mais ou menos, sei lá", "Reforçadores: com certeza, definitivamente, sem dúvida"]],
  [198, "Recursos retóricos", ["Anáfora — repetição inicial", "Hipérbole — exagero", "Pergunta retórica — engaja", "Ironia + sarcasmo — diferenciar"]],
  [199, "Registro acadêmico", ["Passivo + impessoal: foi observado que, considera-se", "Conectivos formais: posto que, dado que, conquanto", "Vocabulário latinismo: ad hoc, in loco, modus operandi", "ABNT — normas para textos acadêmicos"]],
  [200, "Redação ENEM-style", ["Estrutura: introdução, 2-3 desenvolvimentos, conclusão + proposta", "5 competências avaliadas", "Repertório sociocultural — citações + dados", "Brazilian high-stakes writing exam"]],
  [201, "Recursos estilísticos", ["Metáfora, comparação, antítese, paradoxo", "Sinédoque, metonímia, prosopopeia", "Aliteração, assonância, rima", "Brazilian poetry tools mastery"]],
  [202, "Trocadilhos + jogos palavras", ["Trocadilho — tradição brasileira humor", "Calembour, paronomásia, anagramas", "Memes brasileiros — Internet linguistic creativity", "Crase + outros desafios ortográficos jokes"]],
  [203, "Maestria idiomática", ["Pagar o pato (take blame for others)", "Chutar o pau da barraca (give up restraints)", "Tirar o cavalinho da chuva (give up expectation)", "Engolir sapo (endure unpleasantness)"]],
  [204, "Sotaques regionais", ["Carioca — chiado (s = sh), entonação musical", "Paulistano — R retroflex caipira influence, faster speech", "Nordestino — vogais abertas, ritmo cantado", "Gaúcho — entonação specific, tu usage retained"]],
  [205, "Carioca vs paulista", ["Vocabulário: pão de sal (RJ) vs pão francês (SP)", "Bondinho vs bonde (different things)", "Cariocas — relaxados, praia-focused", "Paulistas — trabalho-focused, agitados"]],
  [206, "Nordestino", ["Sotaque cantado, ritmo musical", "Vocabulário: aperreado, oxente, vixe", "Forró + cordel — culture base", "Cangaço heritage — Lampião, Maria Bonita"]],
  [207, "Gauchês", ["Tu retido (você raro)", "Bah! Tchê! Chimarrão", "Charque, churrasco, tradition gaúcha", "Influência platina (uruguaia/argentina)"]],
  [208, "Review B2.1 + redação ENEM", ["Recap subjuntivo + estilo", "Escreva dissertação 30 linhas tema atual", "5 competências aplicadas", "Auto-avaliação rúbrica ENEM"]],
]);

const b2_2 = toSessions([
  [209, "Português turismo", ["Guia turístico, roteiro, pacote, hospedagem", "Patrimônio UNESCO — Brasil 23 sites", "Alta vs baixa temporada", "Overtourism — Fernando de Noronha limit, Bonito quotas"]],
  [210, "Português moda", ["Estilista, modelo, desfile, passarela", "São Paulo Fashion Week — major event LatAm", "Marcas: Osklen, Animale, Farm, Reserva", "Havaianas — Brazilian icon mundial"]],
  [211, "Português culinária", ["Chef, sous-chef, brigada", "Matéria-prima, fornecedor, sazonalidade", "Selo de qualidade, denominação de origem", "Alex Atala — D.O.M. + valorização ingredientes brasileiros"]],
  [212, "Português design", ["Design industrial, gráfico, interior, UX", "Sérgio Rodrigues — design móveis modernista", "Roberto Burle Marx — paisagismo modernista", "MAM, MASP — museums design references"]],
  [213, "Português diplomático", ["Itamaraty — Ministério Relações Exteriores", "Embaixada, consulado, embaixador", "Acordo, tratado, memorando", "Brazilian diplomatic tradition — Rio Branco, Lafer"]],
  [214, "Português jornalismo", ["Editoria: política, economia, esporte, cultura", "Pauta, lide, deadline, nota fria/quente", "Cobertura, apuração, fonte", "Folha + Globo — mainstream | Brasil247 + Intercept — alternative"]],
  [215, "Português acadêmico", ["Graduação, mestrado, doutorado, pós-doc", "Currículo Lattes (CNPq) — universal BR", "Iniciação científica, monografia, TCC", "Sistema universidades públicas vs privadas vs comunitárias"]],
  [216, "Português jurídico", ["Civil, penal, tributário, trabalhista", "Sentença, recurso, apelação, habeas corpus", "Advogado, juiz, promotor, defensor", "OAB — Ordem dos Advogados do Brasil"]],
  [217, "Português médico", ["Anamnese, diagnóstico, prognóstico, terapia", "Consulta, internação, alta, óbito", "Especialidades: cardiologia, oncologia, neurologia, pediatria", "CRM — Conselho Regional Medicina"]],
  [218, "Português engenharia", ["Projeto, cálculo estrutural, norma técnica", "Cronograma, orçamento, ART", "CREA — Conselho Regional Engenharia Agronomia", "Engenharias forte: civil, mecânica, elétrica, produção"]],
  [219, "Português TI + tech", ["Desenvolvedor, programador, dev, sistema", "Código, framework, biblioteca, banco de dados", "Cloud, inteligência artificial (IA), aprendizado máquina", "Brazilian tech: Nubank, Stone, iFood, Loft — unicorns"]],
  [220, "Português finanças", ["Bolsa B3, ações, debêntures, fundos", "Investimento, rentabilidade, risco", "Selic, IPCA, IOF — indicadores", "Tesouro Direto — gov bonds retail"]],
  [221, "Português arte", ["Galeria, exposição, vernissage, curadoria", "Bienal de São Paulo — 2ª mais antiga mundo (1951)", "MASP, MAM, Inhotim, Pinacoteca", "Mercado arte BR — em ascensão"]],
  [222, "Português tradução", ["Tradutor vs intérprete vs versionista", "Juramentada — official documents", "CAT tools, memória tradução, glossário", "Sintra — Sindicato Nacional Tradutores"]],
  [223, "Português PLE", ["PLE — Português Língua Estrangeira", "Celpe-Bras — certificado oficial estrangeiros", "ABRALIN, ABRAPLE — associações", "Mercado crescente — Brasil global player"]],
  [224, "Review B2.2 + portfolio", ["Recap industry verticals", "Construa portfolio profissional setor escolhido", "Glossário personalizado 50+ termos", "Case study real BR"]],
]);

const b2_3 = toSessions([
  [225, "Modulação de tom", ["Formal vs informal vs íntimo", "Sutil vs direto, irônico vs sério", "BR tone — wide spectrum acceptance", "Reading the room — cultural intelligence"]],
  [226, "Ler entrelinhas", ["Implícito vs explícito", "O que não se diz — cultural importance", "Subentendidos sociais", "Brazilian indirectness — soft conflict"]],
  [227, "Small talk brasileiro", ["Tempo, trânsito, futebol, novela", "Família — perguntas culturalmente aceitas", "Política — only with friends close", "Boteco — natural small talk venue"]],
  [228, "Tabus culturais", ["Dinheiro direto — não perguntar salário", "Idade, peso — geralmente evitar", "Religião — handle with care", "Política — pode esquentar fácil"]],
  [229, "Sensibilidade religiosa", ["Catolicismo nominal vs prática", "Evangélicos — força política crescente", "Religiões afro-brasileiras — preconceito ainda existe", "Espiritismo — sem estigma social maior"]],
  [230, "Humor brasileiro decodificado", ["Auto-ironia muito valorizada", "Brincadeiras — friendly mocking padrão", "'Tirando onda' — mocking gently", "Cuidado com ironia — pode confundir não-brasileiros"]],
  [231, "Conversa política", ["Brasileiros polarizados pós-2014", "Lula vs Bolsonaro — divide social", "PT vs antipetismo — vocabulário próprio", "Diplomacia familiar nas refeições"]],
  [232, "Dinâmica familiar", ["Família extensiva — primos, tios próximos", "Mãe central — figura emocional", "Filhos saem mais tarde de casa (financial)", "Almoço domingo — sagrado padrão"]],
  [233, "Amizade brasileira", ["Convivência intensa, calorosa", "Amizade for life — but também 'amigos de festa'", "Roda de amigos — círculos sociais distinct", "Brazilians warm + open mas com tempo"]],
  [234, "Português romântico", ["Amor, paixão, querer", "Te amo (deep) vs te quero (lighter)", "Diminutivos: meu amorzinho, neguinho, lindinho", "Brazilian dating — affectionate + verbal frequent"]],
  [235, "Resolução de conflito", ["Diplomacia + jeitinho — soft approach", "Pedir desculpa — não sinal de fraqueza", "Mediação familiar", "Brazilian conflict — emocional, then reconciliation"]],
  [236, "Ler imprensa fluente", ["Identificar registro: notícia vs opinião", "Reconhecer viés político", "Skim, scan, profundidade — 3 fases", "Hábito leitura jornal diária"]],
  [237, "Assistir TV sem legenda", ["Globo, Record, SBT, Band — major", "Jornal Nacional, Globo Repórter — heritage", "Novelas — vocabulário cotidiano + drama", "Big Brother Brasil — pop culture phenomenon"]],
  [238, "Podcasts brasileiros", ["Mamilos — atualidade", "Café Brasil — Luciano Pires comportamento", "PodPah, Flow — entrevistas longas", "Spotify Brasil — 2º maior mercado mundo"]],
  [239, "Rádio brasileira", ["FM popular — Jovem Pan, Mix, Antena 1", "AM — CBN, Bandeirantes notícia", "Podcasts substituem AM gradualmente", "Programação musical regional"]],
  [240, "Review B2.3 + conversa real", ["Recap pragmática + cultural", "Simulação conversa 30 min nativo", "Topics livres: política, food, viagem", "Self-assessment fluency"]],
]);

const b2_4 = toSessions([
  [241, "Registro acadêmico avançado", ["Linguagem científica vs humanidades", "Latinismos + gregos: ad hoc, modus operandi, ethos", "Estruturas impessoais, passivas", "Léxico abstrato + técnico"]],
  [242, "Artigo acadêmico estrutura", ["Resumo, palavras-chave, introdução, metodologia", "Resultados, discussão, conclusões, referências", "Notas de rodapé, anexos", "Brazilian academic style — mais discursivo"]],
  [243, "ABNT — normas citação", ["NBR 6023, 10520, 14724 — principais", "Citação direta vs indireta", "Sistema autor-data, sistema numérico", "Bibliografia ordenada alfabética"]],
  [244, "Conferências acadêmicas", ["Comunicação oral, pôster, mesa-redonda", "ANPOLL, ANPED — encontros nacionais", "Sociedades científicas — SBPC", "Internacionalização — ALAS, LASA"]],
  [245, "TCC + dissertação + tese", ["TCC graduação — 30-80 pp", "Dissertação mestrado — 100-150 pp", "Tese doutorado — 200-300 pp", "Banca examinadora — defesa pública"]],
  [246, "CAPES + CNPq + FAPESP", ["CAPES — Coordenação pós-graduação federal", "CNPq — Conselho desenvolvimento científico", "FAPESP, FAPERJ, FAPEMIG — estaduais", "Bolsas, fomento, mobilidade internacional"]],
  [247, "Intelectuais brasileiros", ["Sérgio Buarque de Holanda — Raízes do Brasil", "Caio Prado Jr. — Formação do Brasil Contemporâneo", "Roberto Schwarz — crítica literária marxista", "Antonio Candido — Formação Literatura Brasileira"]],
  [248, "Filosofia brasileira", ["Mário Sérgio Cortella — popular philosopher", "Marilena Chauí — feminismo + materialismo", "Vladimir Safatle — Frankfurt school heritage", "Djamila Ribeiro — Lugar de Fala feminismo negro"]],
  [249, "Sociologia brasileira", ["Gilberto Freyre — Casa-Grande & Senzala", "Florestan Fernandes — sociólogo USP, decano", "Octavio Ianni — capitalismo periférico", "Roberto DaMatta — Carnavais, malandros e heróis"]],
  [250, "Antropologia brasileira", ["Darcy Ribeiro — O Povo Brasileiro", "Eduardo Viveiros de Castro — antropologia indígena", "Lélia Gonzalez — pioneira mulher negra", "Manuela Carneiro da Cunha — pesquisa amazônica"]],
  [251, "Linguística brasileira", ["Português brasileiro como variedade independente debate", "Mattoso Câmara — fonologia brasileira", "Ataliba de Castilho — sintaxe", "Marcos Bagno — sociolinguística + preconceito"]],
  [252, "Análise de textos", ["Análise textual — ENEM segundo dia tradição", "Contexto + estrutura + temas + estilo", "Crítica literária + cultural", "Brazilian close reading tradição forte"]],
  [253, "Resenhas + críticas", ["Resenha literária, cinematográfica, gastronômica", "Estrutura: contexto + análise + avaliação", "Crítica embasada não emocional", "Critic tradition: Bandeira, Pignatari, Ismail Xavier"]],
  [254, "Debate acadêmico", ["Tese + argumentos + objeções + réplicas", "Refutar, sustentar, demonstrar, contestar", "Citar autoridades + dados + exemplos", "Brazilian debate — emocional mas estruturado"]],
  [255, "Defesa de tese", ["Apresentação 20-30 min + arguição banca", "Defender claims rigorosamente", "Banca: orientador + examinadores", "Brazilian thesis defense — pública, formal"]],
  [256, "Review B2.4 + artigo", ["Recap academic mastery", "Escreva mini-artigo 2000 palavras + bibliografia", "Tema: cultura brasileira aspecto", "Peer review feedback"]],
]);

const b2_5 = toSessions([
  [257, "Registro diplomático", ["Excelência, embaixador, ministro plenipotenciário", "Sua Excelência (S.E.), Vossa Senhoria", "Verbalização formal, comunicados", "Brazilian diplomatic style — tradição Rio Branco"]],
  [258, "Diplomacia brasileira", ["Itamaraty — Palácio em Brasília + Rio histórico", "Rio Branco — patrono diplomacia BR", "Tradição conciliadora + multilateral", "Lafer, Amorim — chanceleres modernos"]],
  [259, "Brasil + BRICS", ["BRICS — Brasil, Rússia, Índia, China, África Sul", "Recentemente expandido: + Egito, Etiópia, Irã, EAU", "Banco dos BRICS — alternative World Bank", "South-South cooperation pillar"]],
  [260, "Mercosul + integração latino", ["Mercosul — Brasil, Argentina, Uruguai, Paraguai", "UNASUL (in dormancy), CELAC", "ProSul recente (right-wing aligned)", "Integração regional desafios"]],
  [261, "Brasil ONU", ["Membro fundador 1945", "Conselho Segurança candidato permanente histórico", "Tropas paz: Haiti (Minustah), África", "Sede instituições: PNUMA Rio, ILACBRT Brasília"]],
  [262, "ONGs brasileiras", ["Greenpeace Brasil — meio ambiente", "MST — terra + soberania alimentar", "Ação Educativa, Instituto Alana — educação", "Defensores DDHH — exposição ao risco"]],
  [263, "Liderança brasileira style", ["Carismática, relacional, calorosa", "Networking — prática essencial", "Personalismo — relações pesam", "Tendência recente: mais técnica + meritocrática"]],
  [264, "Gerencial brasileiro", ["Hierarquia formal + relação informal", "Top-down mas consultivo", "Personalismo — chefe acessível padrão", "Mudança gradual — gestão profissional"]],
  [265, "Discurso público", ["Brazilian rhetorical heritage strong", "Influência clássica: Cícero, Quintiliano", "Estilo: alto, médio, baixo", "Gestos coerentes com verbal"]],
  [266, "Retórica brasileira", ["Rui Barbosa — Águia de Haia", "Joaquim Nabuco — abolicionismo + diplomata", "Gustavo Capanema — discurso oficial", "Tradição oratória — Império + República"]],
  [267, "Rui Barbosa heritage", ["1849-1923 BA — jurista, escritor, político", "Conferência Haia 1907 — defesa Brasil", "Casa Rui Barbosa Rio — instituição patrimônio", "Discurso modelo elegância clássica"]],
  [268, "Discursos modernos", ["Leonel Brizola — populista, irmão duas pernas", "FHC — sociólogo presidente articulado", "Lula — populismo popular linguagem direta", "Bolsonaro — antitese, comunicação polarizadora"]],
  [269, "Coletivas de imprensa", ["Briefing, comunicado, declaração", "Perguntas jornalistas — réplica", "Off the record vs on the record", "Brazilian press conference culture"]],
  [270, "Debates políticos", ["Confrontos eleitorais TV", "Globo, Band, Record — emissoras debate", "Mediadores: Bonner, Boechat (RIP), Aguiar", "Brazilian political debate — apaixonado, fragmentado"]],
  [271, "Etiqueta internacional", ["Brazilian businesses + foreign partners", "Cultural intelligence + adaptação", "Brazilian negotiation — relational first", "Almoço de negócios — frequentemente estendido"]],
  [272, "Review B2.5 + discurso", ["Recap leadership + diplomacy", "Prepare discurso público 5 min", "Tema escolha + tom formal", "Delivery + Q&A simulados"]],
]);

const b2_6 = toSessions([
  [273, "Machado de Assis aprofundamento", ["Memórias Póstumas — narrador defunto, ironic", "Dom Casmurro — Capitu adultério (or not?) ambiguidade", "Quincas Borba — Humanitismo paródia", "Pai contra mãe — racismo + escravidão"]],
  [274, "Romantismo brasileiro", ["Gonçalves Dias — Canção do Exílio, indianismo", "José de Alencar — Iracema, O Guarani, Senhora", "Castro Alves — abolição, condoreirismo", "Álvares de Azevedo — ultra-romântico"]],
  [275, "Naturalismo", ["Aluísio Azevedo — O Cortiço, descrição social", "Adolfo Caminha — Bom-Crioulo", "Influência Zola francesa direta", "Determinismo social + biológico"]],
  [276, "Parnasianismo", ["Olavo Bilac, Alberto de Oliveira, Raimundo Correia", "Arte pela arte, perfeição formal", "Soneto privilegiado", "Crítica modernista pesada depois"]],
  [277, "Modernismo fases", ["1ª fase 1922-1930 — Oswald, Mário, Tarsila", "2ª fase 1930-1945 — Drummond, Bandeira, Cecília", "3ª fase 1945+ — Geração 45 academicizing", "Pós-modernismo 1960s — concretismo"]],
  [278, "Concretismo", ["Augusto + Haroldo de Campos, Décio Pignatari", "Poesia visual + estrutural", "Manifesto Plano Piloto 1958", "Brasil pioneiro vanguarda mundial"]],
  [279, "Geração 45", ["João Cabral de Melo Neto — Morte e Vida Severina", "Vinícius — Soneto Fidelidade", "Lygia Fagundes Telles — narrativa moderna", "Equilíbrio forma + emoção"]],
  [280, "Mulheres escritoras", ["Clarice Lispector — A Hora da Estrela, A Paixão", "Lygia Fagundes Telles — As Meninas", "Hilda Hilst — provocação + erudição", "Adélia Prado — espiritualidade do cotidiano"]],
  [281, "Literatura afro-brasileira", ["Conceição Evaristo — escrevivência, Olhos d'Água", "Cuti, Miriam Alves, Ricardo Aleixo", "Lima Barreto — pioneer Triste Fim Policarpo Quaresma", "Carolina Maria de Jesus — Quarto de Despejo"]],
  [282, "Literatura infantil", ["Monteiro Lobato — Sítio Picapau Amarelo (controvérsia atual)", "Ana Maria Machado — Bisa Bia, Bisa Bel", "Ruth Rocha — Marcelo, Marmelo, Martelo", "Ziraldo — Menino Maluquinho"]],
  [283, "Quadrinhos brasileiros", ["Turma da Mônica — Mauricio de Sousa, 60+ anos", "Henfil — Graúna, Os Fradinhos, Bode Orelana", "Ziraldo — Pererê", "Modern: Daniel Esteves, Marcello Quintanilha"]],
  [284, "Análise de música", ["Tropicália — Caetano + Gil deconstrução", "Chico Buarque — letras protesto + erudição", "Bossa nova — Tom Jobim análise harmônica", "Sertanejo + funk — pop análise sociocultural"]],
  [285, "Teatro avançado", ["Augusto Boal — Teatro do Oprimido global", "Plínio Marcos — Navalha na Carne realismo", "Nelson Rodrigues — A Falecida, Vestido de Noiva", "Teatro moderno: Antunes Filho, Gerald Thomas"]],
  [286, "Cordel — poesia oral Nordeste", ["Folhetos pendurados em cordel — Pernambuco origem", "Sertão tradition — Patativa do Assaré", "Xilogravura — gravura tradicional", "Patrimônio Cultural Imaterial Brasileiro"]],
  [287, "Análise cinema", ["Roteiro, direção, fotografia, montagem", "EBA/UFRJ, USP — escolas cinema", "Crítica cinematográfica — Glauber, Ismail Xavier", "Decodificar filmes brasileiros culturalmente"]],
  [288, "Review B2.6 + análise literária", ["Recap tradição literária BR", "Análise 2000 palavras obra escolhida", "Contexto + estrutura + temas + estilo", "Brazilian literary scholarship demonstration"]],
]);

const b2_7 = toSessions([
  [289, "Estrutura Celpe-Bras", ["Certificado de Proficiência em Língua Portuguesa para Estrangeiros", "INEP/MEC — examina oficialmente", "Níveis: Intermediário, Intermediário Superior, Avançado, Avançado Superior", "2 partes: coletiva (escrita) + individual (oral)"]],
  [290, "Compreensão oral Celpe-Bras", ["Tarefas integradas — ouve E escreve", "Vídeo + áudio + texto motivador", "Notes-taking essential", "20+ minutos por tarefa"]],
  [291, "Compreensão leitura Celpe-Bras", ["Textos motivadores variados — artigo, propaganda, infográfico", "Compreensão para produção (não MC questions)", "Identificar tese + argumentos + público-alvo", "Tempo: 2h30 total escrita"]],
  [292, "Produção escrita Celpe-Bras", ["4 tarefas comunicativas integradas", "Cada tarefa = leitura/áudio + escrita 150-300 palavras", "Gênero variado: carta, email, artigo, resenha, manifesto", "Avaliação holística desempenho comunicativo"]],
  [293, "Parte oral — interação", ["20 min com avaliador", "Conversa inicial (apresentação) + 3 elementos provocadores (fotos/texto curto)", "Discutir aprofundamento por tópico", "Note: NOT monologue — DIALOGUE com avaliador"]],
  [294, "Tarefas comunicativas — modelo", ["Cenário realista + papel social", "Você lê, ouve, e responde como solicitado", "Adequação: registro, gênero, público", "Critério: comunicar efetivamente, não gramática perfeita"]],
  [295, "Praticar oral Celpe-Bras", ["Praticar com 'elementos provocadores' reais", "Falar 4-5 min por tópico", "Comentar imagens, gráficos, charges", "Naturalness > accuracy at this level"]],
  [296, "Praticar leitura", ["Textos B2 PT-BR — jornais, revistas, blogs", "Skim, scan, profundo — 3 fases", "Identificar argumento + persuasão técnicas", "Tempo: simular condições prova"]],
  [297, "Praticar escrita", ["Simular 4 tarefas em 2h30", "Variar gêneros: carta, email, artigo, resenha", "Auto-edit checklist aplicado", "Buscar feedback nativo se possível"]],
  [298, "Praticar entrevista", ["Role-play com colega ou tutor", "Tópicos: trabalho, hobbies, planos, opiniões", "20 min duração realista", "Naturalness primary criterion"]],
  [299, "Simulação Celpe-Bras completa", ["4h simulação dia integral", "Manhã: parte coletiva (escrita)", "Tarde: parte individual (oral)", "Time management + endurance"]],
  [300, "Avaliação simulada", ["Avaliação holística — não pontos", "Identificar pontos fracos por tarefa", "Plano de melhoria mirado", "Quando refazer — best strategy"]],
  [301, "Estratégias dia da prova", ["Documentos: identidade + comprovante inscrição", "Sono + alimentação dia anterior", "Sede prova — Brasil + 100+ centros internacionais", "Calma + concentração management"]],
  [302, "Níveis de certificação", ["Intermediário — funcional, básico", "Intermediário Superior — funcional, intermediário", "Avançado — sofisticado, próximo nativo", "Avançado Superior — domínio quase nativo"]],
  [303, "Próximos passos pós-certificação", ["Universidade brasileira — graduação ou pós", "Trabalho no Brasil — work permit + skills validation", "Cidadania (se elegível por outros critérios)", "Continued learning — imersão + atualização"]],
  [304, "Revisão final + celebração", ["Recap 304 sessões completas", "Brazilian Portuguese journey reflection", "Próximos passos: imersão Brasil, comunidade lusófona, profissional", "Tchau! Boa sorte no Celpe-Bras!"]],
]);

// ============================================================================
// Curriculum Assembly
// ============================================================================

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("portuguese-br")!,
  overview:
    "Program 304 sesi yang mengantar lo dari nol sampai percakapan near-native dalam Bahasa Portugis Brasil (Português Brasileiro). Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Mulai dari alfabeto português (26 huruf), pronunciation dengan 5 vogais nasais (ão, ãe, õe) + R uvular brasileiro + chiado carioca, grammar Romance dengan você sebagai default 2nd person (tu rare di Brasil), gerundio dominant (estou fazendo bukan 'estou a fazer' PT-PT), pronoun pre-verbal (eu te amo), subjuntivo mastery untuk B2. Imersi kultur Brazil: bossa nova Tom Jobim-João Gilberto-Vinícius, samba + Carnaval Rio Sambódromo, futebol 5x Copa Mundo, MPB Caetano-Gil-Chico-Elis, telenovela Globo, Cinema Novo Glauber → moderno Meirelles-Salles-Padilha, Machado de Assis + Clarice Lispector + Guimarães Rosa + Conceição Evaristo, capoeira Bahia, 5 regiões dengan culinária + sotaques masing-masing (carioca, paulista, nordestino, gaúcho), Amazônia + Pantanal, churrasco gaúcho. Test prep B2.7: Celpe-Bras — sertifikat ufficiale INEP/MEC, diakui untuk study + work + residency di Brasil.",
  levels: [
    {
      code: "A1",
      name: "Elementary Foundation",
      description:
        "Fondasi Elementer. Mulai dari alfabeto português (26 huruf), pronunciation dengan 5 vogais nasais + R uvular brasileiro + ç cedilha, greetings (oi, olá, tchau, tudo bem?), números 1-1000, present tense verbos SER/ESTAR/TER + 3 conjugações regulares (-AR/-ER/-IR), artigos definidos + indefinidos dengan gender + número, pronomes personais dengan você sebagai default. Akhir A1: introduce diri sendiri, order no café, navigate rotina diária, kuasai 800+ kata dasar Brazilian.",
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
        "Pré-Intermediário. Tense expansion: pretérito perfeito + imperfeito + plus-que-perfeito, futuro simples + 'ir + infinitivo' (PREFERRED Brazilian spoken), condicional. Pronomes oblíquos com pre-verbal placement (BR signature). Intro subjuntivo presente. Comparações + superlativos (-íssimo). Imersi: Carnaval Rio + Salvador, bossa nova Tom Jobim, samba escolas, Pelé + 5 Copas Mundo, MPB heritage, 5 regiões Brasil, Era Vargas → República. Vocab grow to 2000+ kata.",
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
        "Intermediário. Fluency tools — mais-que-perfeito, período hipotético (3 tipos), subjuntivo imperfeito, discurso indireto, voz passiva, se impessoal. Deep dive literatura brasileira: Machado de Assis + Clarice Lispector + Guimarães Rosa + Jorge Amado + Conceição Evaristo. Cinema Novo Glauber → moderno Meirelles-Salles-Padilha-Aïnouz. MPB Caetano-Gil-Chico-Elis, funk carioca, sertanejo, Capoeira Bahia, Modernismo Semana 22. Sociedade + política + economia: desigualdade, favelas, SUS, Bolsa Família, Lula vs Bolsonaro. Professional Portuguese: CLT, MEI, Pix, email comercial. Vocab 3500+.",
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
        "Upper Intermediário. Near-native expression: subjuntivo mais-que-perfeito, período hipotético 3 tipos mastery, recursos retóricos. Academic Portuguese: artigo acadêmico ABNT, TCC + dissertação + tese, intelectuais brasileiros (Sérgio Buarque, Caio Prado, Darcy Ribeiro, Florestan Fernandes, Gilberto Freyre). Professional industry-specific: turismo, moda, design, culinária, diplomático (Itamaraty), jornalismo, jurídico, médico, engenharia, TI, finanças. Diplomatic register + leadership + Rui Barbosa heritage rhetoric. Literary mastery: Machado deep, Modernismo fases, Concretismo Campos brothers, Geração 45, mulheres escritoras, literatura afro-brasileira, Cordel. Sotaques regionais decoded (carioca, paulista, nordestino, gaúcho). Persiapan Celpe-Bras — sertifikat oficial INEP/MEC, 4 níveis. Vocab 5000+.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression", sessions: b2_1, preview: true },
        { code: "B2.2", name: "Professional Portuguese", sessions: b2_2, preview: true },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: true },
        { code: "B2.4", name: "Academic Mastery", sessions: b2_4, preview: true },
        { code: "B2.5", name: "Leadership & Diplomacy", sessions: b2_5, preview: true },
        { code: "B2.6", name: "Creative & Literary", sessions: b2_6, preview: true },
        { code: "B2.7", name: "Test Prep (Celpe-Bras)", sessions: b2_7, preview: true },
      ],
    },
  ],
};

export default curriculum;

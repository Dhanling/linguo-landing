import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============================================================================
// A1 — Elementary Foundation (3 sublevels × 16 = 48 sesi)
// ============================================================================

const a1_1 = toSessions([
  [1, "Alfabeto português", ["26 letras (k, w, y oficializadas 1990 Acordo Ortográfico)", "Diacríticos: á é í ó ú (agudo), â ê ô (circunflexo), ã õ (til), à (crase)", "ç (cedilha): antes a/o/u som 's' (criança, açúcar)", "Dígrafos: lh (filho), nh (banho), ch (chave), rr, ss"]],
  [2, "Pronúncia europeia", ["Vogais átonas REDUZIDAS — característica PT-PT chave (telefone soa 'tlefone')", "Chiado: s final = 'sh' (lápis = 'lápish'), faz vs fáz", "R apical norte (vibrante) vs uvular sul + Lisboa", "Nasais: ão, ãe, õe — same as BR mas tom mais fechado"]],
  [3, "Saudações + apresentação", ["Olá, Bom dia, Boa tarde, Boa noite", "Adeus (formal), Até logo, Até já, Tchau (informal)", "Tudo bem? Como estás? Como está?", "Muito prazer / Igualmente"]],
  [4, "Números 0-20", ["Zero, um, dois, três, quatro, cinco... vinte", "Concordância género: um/uma, dois/duas", "Catorze (NÃO 'quatorze' como BR)", "Operações: mais, menos, vezes, a dividir por"]],
  [5, "Tu vs você vs o senhor", ["Tu — informal singular (predomina em PT-PT!)", "Você — FORMAL ou desconhecido (raro entre amigos)", "O senhor / A senhora — muito formal, idosos", "DIFERENÇA CHAVE vs BR onde você é default informal"]],
  [6, "Verbo SER + identidade", ["Sou, és, é, somos, sois (raro), são", "Tu ÉS português — segunda pessoa singular real", "SER = identidade permanente (sou portuguesa)", "ÉS bonito (tu) vs É bonito (você/ele)"]],
  [7, "Verbo ESTAR + estado", ["Estou, estás, está, estamos, estais, estão", "Como estás? — pergunta padrão informal", "ESTAR = estado temporário, localização", "Estou em Lisboa, estás cansado?"]],
  [8, "Nacionalidade + origem", ["Como te chamas? Chamo-me... (note ENCLÍTICO!)", "De onde és? Sou da Indonésia / de Portugal", "Adjetivos: português/portuguesa, indonésio/-a", "Falas português? Falo um pouco"]],
  [9, "Dias + meses + horas", ["Segunda, terça, quarta-feira... domingo", "Janeiro, fevereiro... dezembro (sem maiúsculas)", "Que horas são? São três horas, é uma hora", "Estações: Verão (Jun-Set), Inverno (Dez-Mar)"]],
  [10, "Verbo TER + idade", ["Tenho, tens, tem, temos, tendes, têm", "Quantos anos tens? Tenho 25 anos", "Ter fome, sede, sono, calor, frio, medo", "Há (há trânsito) — mais comum PT-PT que BR ('tem')"]],
  [11, "Família portuguesa", ["Pai, mãe, irmão, irmã, filho, filha", "Avô, avó, tio, tia, primo, prima", "Padrasto, madrasta (modern blended families)", "Família portuguesa: extensa, almoço dominical tradição"]],
  [12, "Cores + concordância", ["Vermelho, azul, verde, amarelo, preto, branco, cinzento, castanho", "Masculino/feminino, plural agreement", "Bandeira: verde-vermelha com escudo + esfera armilar", "5 outubro 1910 — proclamação República + bandeira"]],
  [13, "Artigos + contrações", ["O, a, os, as (definidos)", "Um, uma, uns, umas (indefinidos)", "Contrações: do, da, no, na, pelo, pela", "Antes de países: a Indonésia, o Brasil, Portugal (sem artigo!)"]],
  [14, "Verbos -AR regulares", ["Falar, morar, trabalhar, estudar, comprar", "Conjugação: -o, -as, -a, -amos, -ais, -am", "Tu falas (BR usa você + fala)", "DIFERENÇA CHAVE: tu form usado ativamente"]],
  [15, "Perguntar + responder", ["Question words: quem, o quê, onde, quando, porquê, como, quanto", "Pergunta com entonação (sem inverter ordem)", "Sim, não, talvez, claro, pois (BR 'sim' = PT 'pois é')", "Né? raro em PT, 'não é?' mais comum"]],
  [16, "Review A1.1 + Portugal geografia", ["Recap alfabeto + tu/você + numbers", "Portugal continental + Açores + Madeira", "18 distritos + 2 regiões autónomas", "Lisboa capital, área ~92,000 km² (menor que Java!)"]],
]);

const a1_2 = toSessions([
  [17, "Pequeno-almoço + rotina", ["Acordo, levanto-me, tomo o pequeno-almoço", "DIFERENÇA: 'pequeno-almoço' (PT) vs 'café da manhã' (BR)", "Almoço (lunch), lanche (snack 5pm), jantar", "Portuguese routine: late dinner (20-21h)"]],
  [18, "Verbos -ER regulares", ["Comer, beber, viver, aprender, escrever, vender", "Conjugação: -o, -es, -e, -emos, -eis, -em", "Tu comes, vocês comem (PT-PT distinção real)", "Padrão verbal -ER consistente"]],
  [19, "Verbos -IR regulares", ["Abrir, partir, dividir, decidir, assistir", "Conjugação: -o, -es, -e, -imos, -is, -em", "Abres a porta, partimos amanhã", "Padrão verbal -IR"]],
  [20, "Comida portuguesa base", ["Bacalhau — 1001 maneiras (literally Portuguese saying)", "Sardinhas assadas — Santo António tradition", "Caldo verde, cozido à portuguesa, francesinha (Porto)", "Pão, queijo, presunto — staples mediterrâneos"]],
  [21, "No restaurante", ["Entrada, prato principal, sobremesa, bebida", "Faz favor! (call attention — NOT 'garçom' como BR)", "A conta, se faz favor", "Couvert (entradas pagas) — comum, não optional sempre"]],
  [22, "Pastelaria portuguesa", ["Pastel de nata — original Belém Lisboa", "Pastel de Belém — só Confeitaria Belém pode usar nome", "Bolas de Berlim, bolo-rei (Natal), broa", "Café com pastel — pequeno-almoço típico"]],
  [23, "Casa portuguesa", ["Quarto, sala, cozinha, casa de banho, varanda", "DIFERENÇA: 'casa de banho' (PT) vs 'banheiro' (BR)", "Móveis: mesa, cadeira, cama, sofá, frigorífico (NÃO 'geladeira')", "Apartamento (T1, T2, T3 — number of bedrooms)"]],
  [24, "Preposições + contrações", ["Em, no, na, do, da, para, por, com", "Vou a Lisboa (PT prefere 'a' para destino) vs BR 'para'", "Contrações: ao = a + o, aos = a + os", "Diferenças subtle BR vs PT em preposition use"]],
  [25, "Clima português", ["Como está o tempo? Faz calor / Está frio / Chove", "Mediterrânico — verão seco, inverno chuvoso", "Estações marcadas (NÃO tropical como BR!)", "Açores e Madeira — atlântico, ameno year-round"]],
  [26, "Roupas + estações", ["Camisa, calças, saia, vestido, sapatos", "Casaco, blusão, camisola (NÃO 'suéter'), camisa", "Fato (suit) vs terno (BR)", "Inverno português = real (5-15°C), não tropical"]],
  [27, "Corpo humano", ["Cabeça, olho, nariz, boca, ouvido, cabelo", "Braço, mão, perna, pé", "Coração, estômago, costas, garganta", "Estou com dor de cabeça (similar BR)"]],
  [28, "SNS + saúde", ["SNS — Serviço Nacional de Saúde, universal", "Médico de família, centro de saúde", "Urgência, internamento, alta", "Farmácia — vende OTC + receita"]],
  [29, "Compras", ["Supermercado, mercearia, talho (butcher), peixaria", "Quilo, meio quilo, grama, litro", "Quanto custa? Quanto é? (mais formal PT)", "Continente, Pingo Doce, Auchan — cadeias major"]],
  [30, "Euro + dinheiro", ["Cêntimos (NÃO 'centavos' como BR)", "Notas: 5, 10, 20, 50, 100, 200, 500€", "Multibanco — Portuguese ATM/payment terminal", "Pagar a pronto (cash), com cartão, MB WAY (mobile)"]],
  [31, "Verbos irregulares chave", ["Ir: vou, vais, vai, vamos, ides (raro), vão", "Vir: venho, vens, vem, vimos, vindes, vêm", "Ter: tenho, tens, tem, temos, têm", "Fazer: faço, fazes, faz, fazemos, fazeis, fazem"]],
  [32, "Review A1.2 + almoço cultura", ["Recap rotina + comida + casa", "Almoço português — refeição principal", "Domingo: cozido à portuguesa, arroz de pato, francesinha (Porto)", "Sobremesa: pastel nata, leite-creme, baba de camelo"]],
]);

const a1_3 = toSessions([
  [33, "Pretérito perfeito simples intro", ["Verbos -AR: -ei, -aste, -ou, -ámos, -astes, -aram", "Verbos -ER/-IR: -i, -este, -eu/-iu, -emos/-imos, -estes/-istes, -eram/-iram", "Eu falei, comi, abri ontem", "DIFERENÇA: pretérito composto raro em PT-PT (vs BR comum)"]],
  [34, "Passado de IR + irregulares", ["Fui, foste, foi, fomos, fostes, foram (IR + SER)", "Tive, tiveste, teve, tivemos, tiveram (TER)", "Fiz, fizeste, fez, fizemos, fizeram (FAZER)", "Fui ao Porto = I went to Porto"]],
  [35, "Gostar de + hobbies", ["Gostar DE + nome (gosto de música)", "Gostar DE + verbo (gosto de viajar)", "Adorar, odiar, detestar", "Passatempos: ler, viajar, cozinhar, desporto"]],
  [36, "Futebol português", ["Big 3: SL Benfica (Lisboa), FC Porto, Sporting CP", "Lendas: Eusébio (Pantera Negra), Figo, Rui Costa", "Cristiano Ronaldo — 5x Bola de Ouro, Madeira nascido", "Euro 2016 — primeiro título major Portugal"]],
  [37, "Música portuguesa — fado", ["Fado — música nacional, UNESCO 2011", "Amália Rodrigues — Rainha do Fado", "Carlos do Carmo, Mariza, Dulce Pontes", "Origem: Alfama Lisboa século XIX, marítimo + saudade"]],
  [38, "Cinema português", ["Manoel de Oliveira — diretor centenário (1908-2015)", "Pedro Costa, Miguel Gomes — autores modernos", "Maria de Medeiros (atriz internacional)", "Cinema discreto mas premiado internacionalmente"]],
  [39, "Pretérito imperfeito intro", ["-AR: -ava, -avas, -ava, -ávamos, -áveis, -avam", "-ER/-IR: -ia, -ias, -ia, -íamos, -íeis, -iam", "Quando era criança, brincava na rua", "Past habitual or descriptive background"]],
  [40, "Imperfeito vs perfeito", ["Imperfeito — duração, hábito, descrição", "Perfeito — ação completa", "Estava em casa quando ele chegou", "Signal words: enquanto, sempre vs ontem, no ano passado"]],
  [41, "Memórias de infância", ["Quando eu era pequeno...", "Brincadeiras: macaca (hopscotch), eira, esconde-esconde", "Escola primária, lanche", "Avó na aldeia — tradição portuguesa"]],
  [42, "Viajar por Portugal", ["Aeroporto, comboio (NÃO 'trem'!), autocarro (NÃO 'ônibus'!)", "Bilhete, embarque, mala, mochila", "CP — Comboios de Portugal (railway)", "Carris (Lisboa), STCP (Porto) — public transit"]],
  [43, "Pedir direções", ["À direita, à esquerda, em frente, atrás", "Perto, longe, aqui, ali, lá", "Com licença, onde fica...?", "Português dá direção precisa com pontos de referência"]],
  [44, "Transporte público", ["Metro Lisboa (4 linhas), Metro Porto", "Carris elétricos icónicos Lisboa (28, 12)", "Comboio urbano + intercidades + Alfa Pendular", "Cartão Lisboa Card, Andante Porto"]],
  [45, "Cidades portuguesas", ["Lisboa — 7 colinas, Alfama, Bairro Alto, Belém", "Porto — segunda cidade, Ribeira UNESCO, vinho do Porto", "Coimbra — universidade 1290, tradição estudantil", "Évora — Alentejo capital, Templo Romano"]],
  [46, "Verbos modais", ["Poder: posso, podes, pode, podemos, podem", "Querer: quero, queres, quer, queremos, querem", "Dever: devo, deves, deve, devemos, devem", "Modal + infinitivo"]],
  [47, "Estar a + infinitivo", ["DIFERENÇA MAIOR vs BR: estar A + infinitivo (não gerundio!)", "Estou a fazer = I'm doing", "PT-PT FAVORECE forma vs BR 'estou fazendo'", "Estamos a estudar, ela está a vir"]],
  [48, "Review A1.3 + saudade", ["Recap passado + hobbies + fado", "Saudade — conceito intraduzível original português", "Sentimento melancólico de ausência amada", "Camões, Pessoa, fado — saudade pilar cultural"]],
]);

// ============================================================================
// A2 — Pre-Intermediate (4 sublevels × 16 = 64 sesi)
// ============================================================================

const a2_1 = toSessions([
  [49, "Futuro simples", ["Conjugação: -ar/er/ir + -ei/-ás/-á/-emos/-eis/-ão", "Falarei, comerei, irei", "Ir + infinitivo alternativo (vou falar) — BR-style spoken", "PT-PT escrito usa futuro sintético mais que BR"]],
  [50, "Planos para o fim-de-semana", ["O que vais fazer no fim-de-semana?", "Vou à praia, vou viajar, fico em casa", "Vamos sair! — convite", "Sair à noite — Bairro Alto, Cais do Sodré culture"]],
  [51, "Comparações", ["Mais... (do) que: Lisboa é maior que Coimbra", "Menos... (do) que", "Tão... como/quanto", "Melhor, pior, maior, menor (irregulares)"]],
  [52, "Superlativos", ["Relativo: o mais... de", "Absoluto: -íssimo (lindíssimo, óptimo — PT keeps -pt-)", "Note: Acordo 1990 PT-PT mantém algumas grafias", "PT-PT 'óptimo' vs BR 'ótimo' debate antigo"]],
  [53, "Praias portuguesas", ["Algarve — sul, turismo internacional", "Praia da Marinha, Benagil, Lagos", "Costa Vicentina selvagem", "Açores e Madeira — atlântico autêntico"]],
  [54, "Festas portuguesas", ["Santo António 13 junho — Lisboa, sardinhas, manjericos", "São João 24 junho — Porto, martelinhos, balões ar quente", "São Pedro 29 junho — Sintra, Évora", "Santos Populares — junho festivo Lisboa-Porto"]],
  [55, "Fado deep", ["Origem séc XIX Alfama + Mouraria Lisboa", "Marítimo + saudade — temas centrais", "Amália Rodrigues — Rainha (1920-1999)", "Casa de Fados — restaurante + concerto íntimo"]],
  [56, "Saudade — conceito", ["Untranslatable Portuguese word", "Mistura: nostalgia, longing, ausência, melancolia", "Lusofonia bond — saudade compartilhada Brasil, Cabo Verde, Angola", "Camões, Pessoa, fado — saudade pilares culturais"]],
  [57, "Cristiano Ronaldo + legado", ["Madeira, Funchal, 1985", "5x Bola de Ouro, recordista internacional", "Real Madrid, Manchester United, Juventus, Al-Nassr", "Embaixador Portugal mundial — image plus brand"]],
  [58, "Euro 2016 + heritage", ["Final 10 julho 2016 Paris vs França", "Eder gol histórico — 109' prolongamento", "Primeiro grande título Portugal", "Liga das Nações 2019 também ganha"]],
  [59, "Música moderna portuguesa", ["Madredeus — Lisboa Story film legacy", "Mariza — fado modernizado global", "Salvador Sobral — Eurovision 2017 winner", "Hip-hop tuga: Sam the Kid, ProfJam, Mishlawi"]],
  [60, "Pronomes oblíquos enclíticos", ["DIFERENÇA CHAVE PT vs BR: enclítico padrão", "Amo-te (PT) vs eu te amo (BR)", "Dei-lhe o livro (PT) vs eu dei o livro pra ele (BR)", "PT-PT pre-verbal só em negativos, perguntas, certas conjunções"]],
  [61, "Próclise + mesóclise", ["Próclise — antes do verbo (em negativos): não te vejo", "Mesóclise — DENTRO do futuro: amar-te-ei (formal escrito)", "Mesóclise raríssima em fala", "Ênclise default em afirmativas: vejo-o, conto-te"]],
  [62, "Pronomes possessivos", ["Meu, teu, seu, nosso, vosso, deles", "TEU (your for tu) — PT-PT usa ativamente", "SEU em PT-PT = 'his/her' OR 'your (você formal)' — context", "BR usa 'seu' para 'your' principalmente"]],
  [63, "Vocabulário PT vs BR", ["Autocarro (PT) vs ônibus (BR)", "Comboio vs trem, telemóvel vs celular", "Pequeno-almoço vs café da manhã, casa de banho vs banheiro", "Frigorífico vs geladeira, ginásio vs academia"]],
  [64, "Review A2.1 + Lisboa tour", ["Recap futuro + comparações + fado", "Lisboa — 7 colinas: São Jorge, São Vicente, Santa Catarina, etc", "Alfama, Mouraria, Bairro Alto, Chiado", "Belém: Mosteiro Jerónimos, Torre Belém, Pastéis"]],
]);

const a2_2 = toSessions([
  [65, "Reservar hotel", ["Quarto individual, duplo, triplo", "Com pequeno-almoço incluído (geralmente sim)", "WC privativo, vista, ar condicionado", "Pousada — heritage Portuguese hotel chain"]],
  [66, "No aeroporto", ["Check-in, embarque, escala, ligação", "Bagagem de mão, bagagem de porão", "Aeroportos: Lisboa (LIS — Humberto Delgado), Porto (OPO — Sá Carneiro)", "TAP Air Portugal — flag carrier"]],
  [67, "Norte: Porto + Douro", ["Porto — segunda cidade, Ribeira UNESCO", "Vinho do Porto — Vila Nova de Gaia armazéns", "Douro Valley — UNESCO terraces vineyards", "Francesinha — sandwich icónico Porto"]],
  [68, "Centro: Coimbra + Aveiro", ["Coimbra — universidade desde 1290 (3ª oldest Europe)", "Tuna académica, Queima das Fitas", "Aveiro — Veneza Portuguesa, moliceiros", "Conimbriga ruínas romanas"]],
  [69, "Profissões", ["Médico, advogado, engenheiro, professor", "Empresário, autónomo, funcionário público", "TI: programador, analista, developer", "Concurso público — porta entrada estabilidade"]],
  [70, "Entrevista de emprego", ["CV (Europass formato comum), entrevista, vaga", "Pretensão salarial — handle com cuidado", "Subsídio de refeição, subsídio de férias, 13º + 14º meses", "Contrato sem termo (open-ended) — gold standard"]],
  [71, "Sistema laboral PT", ["Código de Trabalho", "Subsídios: férias + Natal (= 14 meses salário)", "Férias: 22 dias úteis/ano", "ACT — Autoridade Condições Trabalho fiscaliza"]],
  [72, "Segurança Social", ["Descontos: 11% trabalhador + 23.75% empregador", "IRS — Imposto Rendimento Singulares", "Reforma — sistema contributivo + complementar", "EU mobility — coordenação direitos"]],
  [73, "13º + 14º + férias", ["Subsídio de Natal — pago dezembro (13º)", "Subsídio de férias — pago antes férias (14º)", "Direitos consagrados décadas", "Atalhos: pagamento duodecimal mensal possível"]],
  [74, "Email comercial", ["Exmo. Sr. / Cara Sra. — formal", "Cumprimentos, Atenciosamente, Com os melhores cumprimentos", "Anexo, em anexo, junto envio", "Português formal mais elaborado que BR"]],
  [75, "Condicional", ["-ar/er/ir + -ia/-ias/-ia/-íamos/-íeis/-iam", "Gostaria de + infinitivo — politidão padrão", "Hipotético: se pudesse, viajaria pelo mundo", "Common em pedidos educados"]],
  [76, "Pedidos educados", ["Gostaria de + infinitivo", "Podias / Poderia fazer favor de...?", "Importas-te de + infinitivo?", "Português é cerimonioso — mais educado que BR"]],
  [77, "Regatear (limited)", ["Regatear em mercados rurais ou feiras (NÃO lojas)", "Tem desconto? Pode fazer melhor?", "Faz um preço amigo?", "Cultura less prone to bargaining vs BR"]],
  [78, "Empresas portuguesas", ["Galp — energia (petróleo + gás)", "EDP — Energias de Portugal", "Jerónimo Martins — retail (Pingo Doce, Biedronka Polônia)", "Sonae — Continente + tech (Optimus)"]],
  [79, "Startups + tech Portugal", ["Web Summit — Lisboa desde 2016", "Unicorns: Farfetch, OutSystems, Talkdesk, Feedzy", "Lisbon — tech hub European emergente", "EU citizenship + Golden Visa attracted talent"]],
  [80, "Review A2.2 + business Lisboa", ["Recap futuro + trabalho + cidades", "Lisboa — Avenida Liberdade, Marquês Pombal", "Parque das Nações — moderno post-Expo 98", "LX Factory, Beato — startup hubs"]],
]);

const a2_3 = toSessions([
  [81, "Conjuntivo presente intro", ["Conjugação: -ar → -e/-es/-e/-emos/-eis/-em", "-er/ir → -a/-as/-a/-amos/-ais/-am", "Espero que venhas (NÃO 'vens')", "Que ele seja, tenha, faça (irregulares)"]],
  [82, "Expressar opinião", ["Acho que + indicativo", "Penso, acredito, suponho que", "Na minha opinião / Quanto a mim", "Concordo, discordo, talvez (+ conjuntivo)"]],
  [83, "Emoções", ["Feliz, contente, triste, zangado (NÃO 'bravo' como BR)", "Cansado, animado, preocupado, decepcionado", "Estou cá com fome, sono", "Saudade — emoção núcleo Portugal"]],
  [84, "Esperanças + desejos", ["Espero que + conjuntivo (espero que venhas)", "Oxalá + conjuntivo (Arabic origin word — uniquely Portuguese)", "Oxalá chova — I hope it rains", "Que pena! Que bom! Que fixe!"]],
  [85, "Dúvida + incerteza", ["Talvez + conjuntivo", "É possível que, pode ser que + conjuntivo", "Não tenho a certeza", "Logo se vê (we'll see) — typical PT expression"]],
  [86, "Imperativo", ["Affirmativo (tu): fala, come, abre", "Negativo (tu): não fales, não comas, não abras (conjuntivo!)", "Formal (você): fale, coma, abra (= conjuntivo)", "Vamos! — let's, sintético"]],
  [87, "Dar conselhos", ["Devias + infinitivo", "Eu acho que precisas de...", "Se fosse a ti... (conjuntivo imperfeito)", "Porque não...?"]],
  [88, "Discordar educadamente", ["Não concordo totalmente, mas...", "Compreendo, contudo...", "Vejo de outra perspetiva...", "Cultura portuguesa: educada, indireta, não confronto direct"]],
  [89, "Cultura do debate", ["Portugueses discutem mas evitam confronto", "Política — pode aquecer rápido", "Religião — declining import mas sensível", "Café — venue tradicional debate intelectual"]],
  [90, "Política portuguesa", ["República semi-presidencialista parlamentar", "Presidente: Marcelo Rebelo de Sousa (desde 2016)", "Primeiro-ministro: Luís Montenegro (PSD, desde 2024)", "Assembleia da República, 230 deputados"]],
  [91, "Jornais portugueses", ["Público, Diário de Notícias, Jornal de Notícias (JN)", "Expresso (semanário referência), Visão (semanal)", "Correio da Manhã — tabloide popular", "RTP, SIC, TVI — TV main"]],
  [92, "Verbos opinião + conjuntivo", ["Achar que + indicativo", "Duvidar que, recear que + conjuntivo", "É bom/importante/necessário que + conjuntivo", "Triggers comprehensive list"]],
  [93, "Verbos reflexivos enclíticos", ["Lavar-se, levantar-se, chamar-se (enclítico PADRÃO)", "Lavo-me, levantas-te, chama-se", "Próclise em negativos: não me lavo", "Confusion fonte para BR speakers"]],
  [94, "Reclamar", ["Estou cansado, estou sem paciência", "Que chatice! Que aborrecimento!", "Vá lá! (come on)", "Português complaining — drier than BR, mais resignado"]],
  [95, "Pedir desculpas", ["Desculpa (informal), Desculpe (formal), Peço desculpa", "Lamento muito, sinto muito", "Sem problema, não há crise, está tudo bem", "Apologia portuguesa — frequente, ritualizada"]],
  [96, "Review A2.3 + café conversation", ["Recap conjuntivo + opinião", "Café português — institution social", "A Brasileira (Chiado), Majestic (Porto) — históricos", "Conversa de café — debate intelectual heritage"]],
]);

const a2_4 = toSessions([
  [97, "Os Descobrimentos (séc XV-XVI)", ["Era dos Descobrimentos — Portugal pioneer global navigation", "Henrique o Navegador (1394-1460) — Sagres escola náutica", "Bartolomeu Dias — Cabo Boa Esperança 1488", "Padrão dos Descobrimentos Lisboa — monumento icónico"]],
  [98, "Vasco da Gama + Índia", ["Vasco da Gama — Índia 1498 (Calicute)", "Rota marítima alternativa Mediterrâneo+Otomanos", "Estabeleceu Estado da Índia (Goa, Diu, Damão)", "Mosteiro dos Jerónimos Belém — Manuelino estilo, comemora"]],
  [99, "Pedro Álvares Cabral + Brasil", ["Pedro Álvares Cabral — chega Brasil 22 abril 1500", "Frota para Índia desvia-se atlântico", "Tratado de Tordesilhas 1494 — divisão Espanha", "Início colonização portuguesa Brasil"]],
  [100, "Império Ultramarino", ["Brasil, Angola, Moçambique, Guiné-Bissau, Cabo Verde, S. Tomé, Macau, Goa, Timor-Leste", "Tráfico negreiro Atlântico — história sombria", "Império maior do mundo séc XVI-XVII", "Cultura lusófona resultante até hoje"]],
  [101, "União Ibérica + Restauração", ["1580 — União Ibérica com Espanha (Filipe II)", "60 anos perda autonomia política", "1 dezembro 1640 — Restauração da Independência (D. João IV)", "Feriado Nacional Português atual"]],
  [102, "Estado Novo 1933-1974", ["António de Oliveira Salazar — ditadura 1933-1968", "Marcello Caetano sucessor (1968-1974)", "PIDE — polícia política, repressão", "Guerras Coloniais (Angola, Moçambique, Guiné) 1961-1974"]],
  [103, "Revolução dos Cravos", ["25 abril 1974 — golpe militar derruba Estado Novo", "MFA — Movimento das Forças Armadas, Otelo Saraiva", "Cravos vermelhos nas espingardas — símbolo", "Liberdade!  Independência colónias seguinte ano"]],
  [104, "Democracia + EU", ["Constituição 1976 — República democrática", "Adesão CEE/EU em 1986", "Mário Soares, Cavaco Silva — figuras transição", "Euro adoção 2002, Eurozona membro"]],
  [105, "18 distritos + autonomias", ["Norte: Porto, Braga, Viana, Vila Real, Bragança", "Centro: Coimbra, Aveiro, Viseu, Guarda, Castelo Branco", "Lisboa + Setúbal + Santarém + Leiria", "Alentejo: Évora, Beja, Portalegre | Algarve: Faro"]],
  [106, "Açores + Madeira", ["Açores — 9 ilhas atlânticas, descobertas 1432", "Capital: Ponta Delgada (São Miguel)", "Madeira — descoberta 1419, Funchal capital", "Vinho Madeira + bordados + nature tourism"]],
  [107, "Lusofonia + CPLP", ["CPLP — Comunidade Países Língua Portuguesa", "9 países: Portugal, Brasil, Angola, Moçambique, Cabo Verde, Guiné-Bissau, S. Tomé, Timor-Leste, Guiné Equatorial", "~260 milhões falantes globalmente", "Lusofonia — bridge cultural histórico"]],
  [108, "Festas tradicionais", ["Santos Populares junho — Santo António (Lisboa), São João (Porto), São Pedro", "Carnaval — discreto vs BR exuberante", "Páscoa — folar, amêndoas, missa", "Natal — bacalhau ceia 24, peru 25"]],
  [109, "Culinária regional", ["Norte: caldo verde, francesinha, tripas à moda Porto", "Centro: chanfana (Beira), leitão Bairrada, queijo Serra Estrela", "Alentejo: porco preto, açorda, gaspacho", "Algarve: cataplana, peixe grelhado"]],
  [110, "Vinhos portugueses", ["Vinho do Porto (DOC), Madeira, Vinho Verde", "Douro DOC, Alentejo DOC, Dão", "Castas únicas: Touriga Nacional, Alvarinho, Encruzado", "Wine of Portugal — branding internacional"]],
  [111, "Azulejos", ["Azulejos — herança árabe, séc XVI desenvolvimento", "Igrejas, palácios, estações, casas", "Museu Nacional do Azulejo Lisboa", "Estações S. Bento (Porto), Rossio (Lisboa) — azulejaria monumental"]],
  [112, "Review A2.4 + Carnation Revolution", ["Recap história + regiões + cultura", "25 Abril Liberdade — marco democracia portuguesa", "Grândola Vila Morena — canção sinal", "José Afonso (Zeca) — cantautor revolução"]],
]);

// ============================================================================
// B1 — Intermediate (5 sublevels × 16 = 80 sesi)
// ============================================================================

const b1_1 = toSessions([
  [113, "Pretérito mais-que-perfeito", ["Tinha/havia + particípio passado (composto)", "Forma simples: falara, comera (PT-PT mantém uso literário)", "Quando cheguei, ela já tinha saído", "Past-before-past sequencing"]],
  [114, "Concordância de tempos", ["Presente → presente", "Passado → imperfeito + perfeito coordination", "Past hypothetical → condicional perfeito", "European Portuguese tense system overview"]],
  [115, "Conetores lógicos", ["Porque (because), uma vez que/visto que (since)", "Embora/se bem que + conjuntivo (although)", "Contudo, todavia, no entanto (however)", "Portanto, logo, assim (therefore)"]],
  [116, "Contar histórias", ["Era uma vez... (once upon a time)", "De repente, então, finalmente", "Estrutura narrativa portuguesa tradicional", "Verbos: acontecer, ocorrer, suceder"]],
  [117, "Folclore português", ["Galo de Barcelos — lenda + símbolo nacional", "Mouras encantadas, Lobisomem", "Saudades — concept folclore-filosofia", "Adamastor — Camões personagem mítica Cabo Bojador"]],
  [118, "Sophia de Mello Breyner", ["1919-2004 — poetisa maior séc XX", "Mar Novo, Geografia, Dual", "Limpeza moral + clássica + mar", "Prémio Camões 1999 (primeira mulher)"]],
  [119, "Eugénio de Andrade + poesia", ["1923-2005 — Porto, lírica essencial", "As Mãos e os Frutos, Branco no Branco", "Influência haiku, poesia clean", "Prémio Camões 2001"]],
  [120, "Condicional perfeito", ["Teria/ria + particípio", "Teria ido se soubesse", "Future-in-past, counterfactual", "Drama queens'  favorite construction"]],
  [121, "Hipotético — imperfeito conjuntivo", ["-asse/-esse/-isse padrão", "Se eu fosse rico, viajaria pelo mundo", "Common em dreams + speculations", "Triggers: se, como se, quem dera"]],
  [122, "Hipotético passado", ["Se tivesse sabido, teria ido", "Mais-que-perfeito conjuntivo + condicional perfeito", "Counterfactual past — irrealidade passada", "Drama queens tense par excellence"]],
  [123, "Voz passiva", ["Ser + particípio + por", "A casa foi construída pelo arquiteto", "Estar + particípio (estado) vs ser + particípio (ação)", "PT-PT mais formal escrito"]],
  [124, "Se impessoal + passivante", ["Vende-se carros (passive sense)", "Trabalha-se muito em Lisboa (impersonal)", "Comum em anúncios + placas", "Colocação pronominal típica"]],
  [125, "Discurso indireto", ["Direto: Ele disse 'Estou cansado'", "Indireto: Ele disse que estava cansado", "Time shifts em past reporting", "Português escrito formal — Press tradition"]],
  [126, "Pronomes complexos", ["Lhe (a ele/ela), lhes (a eles/elas)", "PT-PT usa enclítico padrão: dei-lhe, conto-te", "Combinações: dei-lho (dei-lhe + o)", "Sintese formal vs análise BR"]],
  [127, "Expressões idiomáticas", ["Pôr-se a pau (be careful)", "Estar com a pulga atrás da orelha (suspicious)", "Cair em cima das maravilhas (favorite + believe)", "Engolir sapos (endure unpleasantness)"]],
  [128, "Review B1.1 + humor português", ["Recap passado + hipotético + idioms", "Humor português — irónico, autodepreciativo, satírico", "Os Contemporâneos, Herman José — TV humor", "Bairro do Cordovil, Os Filmes do Manel, Joana Marques — moderno"]],
]);

const b1_2 = toSessions([
  [129, "Manoel de Oliveira — cinema", ["1908-2015 — diretor centenário (carreira 70+ anos!)", "Aniki-Bóbó (1942) — primeiro filme", "Vale Abraão, Amor de Perdição", "Cinema autoral português mundial"]],
  [130, "Cinema moderno", ["Pedro Costa — Vitalina Varela (Locarno 2019)", "Miguel Gomes — Tabu, As Mil e Uma Noites", "Maria de Medeiros — atriz internacional (Henry & June)", "Festival de Cinema Indielisboa + Doclisboa"]],
  [131, "Música popular portuguesa", ["Madredeus — Lisboa Story Wim Wenders", "Mariza — fado modernizado global", "Salvador Sobral — Eurovision 2017 winner com 'Amar Pelos Dois'", "Capicua — rap consciente Porto"]],
  [132, "Fado — masters", ["Amália Rodrigues — Rainha 1920-1999", "Carlos do Carmo — Lisboa Menina e Moça", "Mariza — fado moderno internacional", "Casas de Fado: Clube de Fado, Mesa de Frades, Senhor Vinho"]],
  [133, "Música tradicional", ["Cantares alentejanos — UNESCO 2014", "Fado de Coimbra — másculino, académico", "Música popular: malhão, vira, bailes", "Pauliteiros de Miranda — danças folclóricas"]],
  [134, "RTP + media", ["RTP — Rádio Televisão Portuguesa (pública)", "SIC, TVI — TV privada (1992 liberalização)", "Telejornal — informação reference", "Big Brother, Got Talent — pop entertainment"]],
  [135, "Carnaval português", ["Discreto vs BR exuberante", "Loulé (Algarve), Torres Vedras, Ovar — mais animados", "Tradições mascaradas regionais", "Não feriado nacional como BR"]],
  [136, "Romarias + peregrinações", ["Fátima — santuário Marian, peregrinação maio + outubro", "Bom Jesus do Monte (Braga) — escadaria barroca", "Senhor Santo Cristo (Açores) — maior festividade", "Religiosidade popular profunda"]],
  [137, "Literatura clássica", ["Camões — Os Lusíadas 1572, epopeia nacional", "Padre António Vieira — sermões séc XVII", "Eça de Queirós — Os Maias, realismo", "Almeida Garrett, Alexandre Herculano — romantismo"]],
  [138, "Pastelaria portuguesa", ["Pastel de nata — Belém origem, séc XIX monges", "Bola de Berlim, queijada de Sintra", "Bolo-rei Natal, pão de ló", "Bolinhos D. Rodrigo, queijinhos do Céu"]],
  [139, "Café cultura", ["Bica (Lisboa) = espresso pequeno", "Cimbalino (Porto) — same thing different name", "Galão = café com leite long glass", "Pastel + bica = breakfast staple"]],
  [140, "Slow food + petiscos", ["Petiscos — small plates portuguese (tapas equivalent)", "Bifana, pataniscas, peixinhos da horta", "Casa de petiscos — taberna culture", "Lisbon + Porto — petisco scene revival"]],
  [141, "Vinho do Porto culture", ["Vinho fortificado Douro Valley", "Tipos: Tawny, Ruby, Vintage, LBV, White", "Vila Nova Gaia — armazéns icónicos", "Maridagem: queijo, sobremesa, foie gras"]],
  [142, "Gastronomia regional", ["Norte: francesinha, tripas à moda do Porto", "Centro: leitão Bairrada, chanfana", "Sul: cataplana algarvia, açorda alentejana", "Açores: cozido das Furnas (geotérmico!)"]],
  [143, "Gestos portugueses", ["Mais reservados que brasileiros", "Joinha — OK comum", "Bater na madeira — anti-azar", "Cumprimento: 2 beijinhos (RJ-style) mulheres"]],
  [144, "Review B1.2 + conversa café", ["Recap cultura + música + cinema", "Simulação conversa café portuguesa", "Topics: política, futebol, gastronomia", "Conversa portuguesa: medida, articulada, ironic"]],
]);

const b1_3 = toSessions([
  [145, "Economia portuguesa", ["~50ª economia mundial PIB", "Setores: turismo (chave!), serviços, indústria", "Bolsa: Euronext Lisbon (PSI-20)", "Euro desde 2002, EU membro 1986"]],
  [146, "Turismo — pilar económico", ["Recordes pré-pandemia + pós-2022", "Algarve, Lisboa, Porto, Madeira, Açores", "Overtourism debate — housing crisis Lisboa+Porto", "Visa Gold + non-habitual resident — controvérsias"]],
  [147, "Crise dívida 2010-2014", ["Troika — FMI + BCE + Comissão", "Programa de assistência 78 bilhões €", "Austeridade Passos Coelho governo", "2017 recuperação — Costa governo socialista"]],
  [148, "Habitação crise atual", ["Lisboa + Porto — preços rents disparados", "Airbnb + golden visa + remote workers — pressure", "Local lodging restrições recentes", "Movimentos: Casa Para Viver, Habitação Digna"]],
  [149, "Sistema educacional", ["Ensino básico (1-9) + secundário (10-12) + superior", "Pública gratuita constitucional", "Exames nacionais 12º — vestibular nacional equivalente", "Politécnicos vs universidades — duas vias"]],
  [150, "Universidades top", ["Universidade de Coimbra — desde 1290, UNESCO", "Universidade do Porto — top BR research", "Universidade de Lisboa — maior", "IST, Nova SBE, Católica — referências"]],
  [151, "SNS — Sistema Saúde", ["Serviço Nacional Saúde universal", "1979 criação — pós-Revolução", "Centros de saúde + hospitais públicos", "Sistema bom mas overworked — listas espera"]],
  [152, "Segurança Social + reforma", ["Sistema contributivo + Caixa Geral Aposentações (CGA)", "Reforma — idade subindo (66+ atual)", "Pensão mínima + complemento solidariedade", "Sustentabilidade demográfica — desafio"]],
  [153, "Sistema político", ["República semi-presidencialista", "Presidente: Marcelo Rebelo Sousa (desde 2016, 2º mandato)", "PM: Luís Montenegro (PSD, desde 2024)", "AR — Assembleia da República 230 deputados"]],
  [154, "Partidos políticos", ["PS — Socialistas (António Costa anterior)", "PSD — Social Democratas (centro-direita)", "CDS, Chega (direita populista), IL (liberal)", "BE, PCP (esquerda), Livre — pluralidade"]],
  [155, "EU + Portugal", ["Membro CEE/EU desde 1986", "Eurozona desde 1999/2002 fisicamente", "Schengen, mobilidade total intra-UE", "Fundos estruturais — vital desenvolvimento"]],
  [156, "Emigração portuguesa", ["Histórica: França, Suíça, EUA, Canadá, Venezuela, Brasil", "1960s anos chumbo emigration", "Atual: jovens qualificados — UK, Alemanha", "Diáspora ~5M (50%+ da população residente!)"]],
  [157, "Imigração atual", ["Brasileiros — maior comunidade", "PALOP — Cabo Verdianos, Angolanos, Mocambicanos", "Ucranianos pós-2022", "Indianos, Nepaleses, Bangladesh — agricultura/serviços"]],
  [158, "LGBT + diversidade", ["Casamento same-sex desde 2010 (12º país mundo)", "Adoção 2016, identidade género lei 2018", "Lisboa Pride — junho festivo", "Conservadorismo declining steadily"]],
  [159, "Ambiente + clima", ["Incêndios florestais — verão crítico (2017 catastrófico)", "Energia: 60%+ renovável", "Mar — gestão sustentável + Atlântico estratégia", "Açores + Madeira — UNESCO geoparks"]],
  [160, "Review B1.3 + leitura jornal", ["Recap sociedade + economia + política", "Leitura manchetes Público + Expresso", "Vocabulário news: PSD, PS, OE, IRC, SIBS", "Acompanhar Portugal atualidade"]],
]);

const b1_4 = toSessions([
  [161, "Camões + Os Lusíadas", ["Luís Vaz de Camões — 1524?-1580", "Os Lusíadas 1572 — epopeia descobrimentos", "10 cantos, oitava rima, Vasco da Gama herói", "10 junho — Dia Camões e das Comunidades Portuguesas"]],
  [162, "Fernando Pessoa", ["1888-1935 Lisboa — figura central modernismo", "Heterónimos: Alberto Caeiro, Ricardo Reis, Álvaro de Campos", "Mensagem (1934) — único livro publicado vida", "Livro do Desassossego — Bernardo Soares heterónimo"]],
  [163, "Pessoa — heterónimos", ["Caeiro — pastor pagão, mestre dos outros", "Reis — médico clássico, odes horacianas", "Campos — engenheiro futurista, dramatic", "Pessoa ele mesmo — ortónimo"]],
  [164, "José Saramago", ["1922-2010 — Nobel Literatura 1998", "Ensaio sobre a Cegueira, Memorial do Convento", "Estilo: sem pontuação direta, fluxo continuo", "Comunista declarado, ateu militante"]],
  [165, "Eça de Queirós", ["1845-1900 — realismo português central", "Os Maias (1888) — Lisboa burguesa decadente", "O Crime do Padre Amaro, A Cidade e as Serras", "Diplomata + romancista, autodidata"]],
  [166, "Literatura clássica oitocentos", ["Almeida Garrett — Viagens na Minha Terra", "Alexandre Herculano — História de Portugal", "Camilo Castelo Branco — Amor de Perdição", "Romantismo + transição realismo"]],
  [167, "Lobo Antunes + moderno", ["António Lobo Antunes (1942-) — psiquiatra-escritor", "Memória de Elefante, Os Cus de Judas", "Estilo: monólogo interior, prosa torrencial", "Considerado para Nobel várias vezes"]],
  [168, "Lídia Jorge + escritoras", ["Lídia Jorge — Os Memoráveis, A Costa dos Murmúrios", "Maria Velho da Costa, Maria Isabel Barreno, Maria Teresa Horta — Novas Cartas Portuguesas (1972, censured)", "Hélia Correia, Inês Pedrosa, Dulce Maria Cardoso", "Geração 60+ feminist literary heritage"]],
  [169, "Literatura PALOP", ["Mia Couto (Moçambique) — Terra Sonâmbula", "Pepetela (Angola) — Mayombe", "Germano Almeida (Cabo Verde)", "Lusofonia literária — Camões Prize circuit"]],
  [170, "Literatura contemporânea", ["Gonçalo M. Tavares — O Bairro, Aprender a Rezar na Era da Técnica", "Afonso Cruz, Valter Hugo Mãe", "Bruno Vieira Amaral — As Primeiras Coisas", "Premio José Saramago — descobrir new voices"]],
  [171, "Crónica portuguesa", ["Tradição forte jornalismo + literatura", "Miguel Esteves Cardoso — Escrito num País Vergonhoso", "Inês Pedrosa, Ricardo Araújo Pereira", "Crónica = humor + observação social"]],
  [172, "Análise poesia", ["Métrica: redondilha, decassílabo, livre", "Rima: heroica (10), tradicional, livre", "Figuras retóricas: metáfora, anáfora, apóstrofe", "Análise textual exame português"]],
  [173, "Escrever conto", ["Estrutura: introdução, desenvolvimento, clímax, desenlace", "Foco narrativo — 1ª vs 3ª pessoa", "Conto português tradição — Miguel Torga, Maria Judite Carvalho", "Construir personagem + cenário + ação"]],
  [174, "Exercícios escrita criativa", ["Prompt: descreve uma manhã em Lisboa", "Continua história 300 palavras", "Reescreve conto outro POV", "Estilo imitativo — Pessoa vs Saramago"]],
  [175, "Metáforas portuguesas", ["Saudade — original portuguese conceito", "Mar — metáfora central cultura marítima", "Sol — Algarve, Mediterrâneo", "Pedra + tempo — duração geológica histórica"]],
  [176, "Review B1.4 + teu conto", ["Recap literatura clássica + moderna", "Escreve conto 500 palavras", "Tema: memória portuguesa ou personagem", "Workshop peer review se possível"]],
]);

const b1_5 = toSessions([
  [177, "Português formal + senhor", ["Você — formal/professional", "Senhor/Senhora + título — respeito hierárquico", "Sr. Doutor, Sra. Engenheira — Portuguese title formality high", "Diferent do BR onde você default informal"]],
  [178, "Email comercial PT", ["Exmo. Sr./Sra. — formal padrão", "Caro/Cara + nome — semi-formal", "Cumprimentos, Com os melhores cumprimentos, Atentamente", "Portuguese biz email — formal heritage"]],
  [179, "CV Europass + PT format", ["Europass — standard EU", "Foto opcional (cultural fade), idade não obrigatória", "Carta motivação separada — usual", "LinkedIn + Net-Empregos + Sapo Emprego"]],
  [180, "Entrevista emprego", ["Carta de apresentação — frequentemente requerida", "Pretensão salarial — abordar quando solicitado", "Cultura empresa fit — pergunta padrão", "Soft skills + hard skills balance"]],
  [181, "Reuniões corporativas", ["Ordem de trabalhos, ata, deliberação", "Português corporate: mais formal que BR equivalent", "Café ritual durante reunião", "Estrutura: pontualidade valued"]],
  [182, "Negociação PT style", ["Relacional + profissional balance", "Cerimónia inicial — espaço social", "Negociar — indireto, sem pressa", "Não dizer não diretamente — softening cultural"]],
  [183, "Apresentações", ["Estrutura clássica + storytelling", "PowerPoint cultura standard", "Audience Q&A — engajada mas medida", "Português audiences — atentas, perguntas substantivas"]],
  [184, "Marketing português", ["Branding, posicionamento, target group", "Mercado pequeno mas sofisticado", "Influencer marketing growing", "Mercado digital + e-commerce ascensão"]],
  [185, "E-commerce PT", ["Worten, Fnac, Continente Online", "Amazon — entrada relativamente tardia 2020s", "MB WAY — payment app dominante", "Sextas-feiras pretas — adopted black friday"]],
  [186, "Sistema bancário", ["Bancos: CGD, BPI, Millennium BCP, Santander, Novo Banco", "Multibanco — Portuguese ATM revolution 1985", "MB WAY — mobile payment Portuguese unique system", "Open banking PSD2 — UE alinhamento"]],
  [187, "Imobiliário", ["Compra, arrendamento (NÃO 'aluguel'!), crédito habitação", "IMI, IMT — impostos compra/posse", "Notário, escritura, escrituração", "Lisboa+Porto — preços disparados crisis"]],
  [188, "Direito básico", ["Constituição República, Código Civil, Código Penal", "Tribunal Constitucional, Supremo, Relação", "Advogado, juiz, procurador", "OA — Ordem Advogados"]],
  [189, "Tributação", ["IRS — Imposto Rendimento Singulares anual", "IRC — Imposto Coletivo (empresas)", "IVA, IMI, IMT — indiretos + imobiliário", "AT — Autoridade Tributária e Aduaneira"]],
  [190, "NIF + empresarial", ["NIF — Número Identificação Fiscal essential", "Empresário individual vs sociedade comercial", "Recibos verdes — trabalho independente", "Simplex — modernização burocrática heritage"]],
  [191, "Trabalho remoto Portugal", ["Remoto explodiu pós-COVID", "Híbrido — modelo emergente", "Digital nomads — Lisboa, Madeira (Digital Nomad Village)", "NHR + visa D7/D8 — atrai talento internacional"]],
  [192, "Review B1.5 + entrevista simulada", ["Recap business Portuguese", "Simula entrevista emprego 20 min", "Falar experiência + objetivos + cultura fit", "Feedback registro + vocabulário"]],
]);

// ============================================================================
// B2 — Upper Intermediate (7 sublevels × 16 = 112 sesi)
// ============================================================================

const b2_1 = toSessions([
  [193, "Conjuntivo imperfeito", ["-asse/-esse/-isse padrão", "Falasse, comesse, abrisse", "Se eu pudesse, viajaria", "Common em hipóteses + desejos passados"]],
  [194, "Conjuntivo mais-que-perfeito", ["Tivesse + particípio", "Se tivesse sabido, teria ido", "Past counterfactual", "Drama queens favorite tense"]],
  [195, "Período hipotético — 3 tipos", ["Tipo 1: Se + presente, futuro/presente", "Tipo 2: Se + imperfeito conj, condicional", "Tipo 3: Se + mais-que-perfeito conj, condicional perfeito", "Mistos: Se tivesse estudado, seria médico"]],
  [196, "Conjuntivo subordinado", ["Conjunções: embora, ainda que, mesmo que, contanto que", "Quando + conjuntivo (futuro): quando vieres", "Talvez, possivelmente, é provável que", "Triggers comprehensive list"]],
  [197, "Subtileza opinião", ["Argumentar, sustentar, defender, contestar", "Sob o meu ponto de vista, na minha óptica", "Atenuadores: mais ou menos, em certa medida", "Reforçadores: com certeza, sem dúvida, indubitavelmente"]],
  [198, "Recursos retóricos", ["Anáfora — repetição inicial", "Hipérbole — exagero", "Pergunta retórica — engagement", "Ironia + sarcasmo — diferenciar"]],
  [199, "Registo académico", ["Passivo + impessoal: foi observado que, considera-se", "Conetivos formais: visto que, posto que, conquanto", "Latinismos: ad hoc, in loco, ex aequo", "APA, ABNT, citation styles"]],
  [200, "Redação argumentativa", ["Tese + antítese + síntese", "Introdução + desenvolvimento + conclusão", "Conetivos lógicos articulação", "Portuguese exam writing tradition"]],
  [201, "Recursos estilísticos", ["Metáfora, comparação, antítese", "Sinédoque, metonímia, prosopopeia", "Aliteração, assonância, rima", "Portuguese poetry tools mastery"]],
  [202, "Trocadilhos + humor verbal", ["Trocadilho — tradição humor PT", "Calembour, paronomásia", "Memes portugueses internet", "Crase + ortografia — fonte humor"]],
  [203, "Idiomáticas mestria", ["Pôr o dedo na ferida (touch sore subject)", "Ficar a ver navios (be left waiting)", "Procurar agulha em palheiro (find needle in haystack)", "Pôr-se a milhas (run away)"]],
  [204, "Sotaques regionais PT", ["Lisboeta — chiado, vogais reduzidas", "Portuense — R apical, entonação musical", "Alentejano — lento, vogais abertas", "Açoriano + madeirense — distintos"]],
  [205, "Lisboeta vs portuense", ["Lisboeta — formal, cosmopolita, irónico", "Portuense — caloroso, direto, orgulho regional", "Rivalidade simpática histórica", "Linguistic differences subtle"]],
  [206, "Alentejano + interior", ["Sotaque pausado, melódico", "Vocabulário: pateta, fato, modo de falar único", "Cante alentejano — UNESCO patrimônio", "Cultura interior — distinct from coast"]],
  [207, "Açoriano + madeirense", ["Açoriano — vogais alteradas, influência migrações", "Madeirense — entonação cantada", "Distância continental — preserved features", "Diáspora — EUA + Canadá communities"]],
  [208, "Review B2.1 + redação", ["Recap conjuntivo + estilo", "Escreve dissertação 30 linhas tema atual", "Tese-argumentos-conclusão", "Auto-avaliação rúbrica"]],
]);

const b2_2 = toSessions([
  [209, "Português turismo", ["Guia turístico, itinerário, alojamento", "Património UNESCO — Portugal 17 sites", "Alta vs baixa época", "Overtourism — Lisboa, Porto critical mass"]],
  [210, "Português moda", ["Estilista, modelo, desfile, passerelle", "ModaLisboa — Portugal Fashion Week", "Marcas: Salsa, Throttleman, Tiffosi, Decenio", "Sapatos portugueses — heritage qualidade"]],
  [211, "Português culinária", ["Chef, sub-chef, brigada", "Matéria-prima, fornecedor, sazonalidade", "DOP, IGP — selos qualidade UE", "José Avillez, Henrique Sá Pessoa — chefs estrela Michelin"]],
  [212, "Português design", ["Design industrial, gráfico, interior", "Centro Cultural Belém (CCB), Casa Música Porto", "Souto de Moura, Siza Vieira — Pritzker arquitetos", "Portuguese design heritage forte"]],
  [213, "Português diplomático", ["Ministério Negócios Estrangeiros", "Embaixada, consulado, embaixador", "Acordo, tratado, memorando", "Diplomacia PT — multilateralismo + CPLP forte"]],
  [214, "Português jornalismo", ["Secções: política, economia, desporto, cultura", "Notícia, lead, editorial, opinião", "Cobertura, apuração, fonte", "Público + Expresso — referência | Observador + ECO online"]],
  [215, "Português académico", ["Licenciatura, mestrado, doutoramento", "FCT — Fundação para a Ciência e Tecnologia", "Tese, dissertação, defesa pública", "Bolonha process — EU harmonized"]],
  [216, "Português jurídico", ["Civil, penal, fiscal, do trabalho", "Sentença, recurso, instância", "Advogado, juiz, magistrado, procurador", "Ordem dos Advogados, Conselho Superior Magistratura"]],
  [217, "Português médico", ["Anamnese, diagnóstico, prognóstico, terapêutica", "Consulta, internamento, alta médica, óbito", "Especialidades: cardiologia, oncologia, neurologia", "OM — Ordem Médicos"]],
  [218, "Português engenharia", ["Projeto, cálculo estrutural, norma técnica", "Cronograma, orçamento, especificações", "OE — Ordem dos Engenheiros", "Engenharias forte: civil, mecânica, eletrotécnica"]],
  [219, "Português IT + tech", ["Programador, programador-analista, developer", "Código, framework, biblioteca, base de dados", "Cloud, IA, machine learning", "Portuguese tech: Outsystems, Talkdesk, Farfetch — unicorns"]],
  [220, "Português finanças", ["PSI-20, ações, obrigações, fundos", "Investimento, rentabilidade, risco", "Euribor, spread, juros", "CMVM — Comissão Mercado Valores Mobiliários"]],
  [221, "Português arte", ["Galeria, exposição, vernissage, curador", "Bienal de Cerveira, FIAP, ARCO Lisboa", "Gulbenkian, Berardo, MAAT — coleções", "Mercado arte PT — small mas sofisticado"]],
  [222, "Português tradução", ["Tradutor, intérprete, retroversor", "Certificada — official documents notário", "CAT tools, memória tradução", "APTRAD — associação profissional"]],
  [223, "Português PLE", ["PLE — Português Língua Estrangeira", "CAPLE — Centro Avaliação Português LE", "Camões, IP — promoção mundial", "Mercado crescente — investimento Portugal global"]],
  [224, "Review B2.2 + portfolio", ["Recap industry verticals", "Constrói portfolio profissional setor escolhido", "Glossário personalizado 50+ termos", "Case study real PT"]],
]);

const b2_3 = toSessions([
  [225, "Modulação do tom", ["Formal vs informal vs íntimo", "Subtil vs direto, irónico vs sério", "Português tone — wider spectrum than English", "Reading the room — cultural intelligence"]],
  [226, "Ler entrelinhas", ["Implícito vs explícito", "O que não se diz — cultural importance", "Subentendidos sociais", "Portuguese indirectness — soft conflict avoidance"]],
  [227, "Small talk português", ["Tempo, trânsito, futebol", "Família — perguntas culturalmente aceites", "Política — only with friends", "Café — natural small talk venue"]],
  [228, "Tabus culturais", ["Dinheiro direto — não perguntar salário", "Idade, peso — geralmente evitar", "Religião — handle com cuidado", "Política — escalates rapidly"]],
  [229, "Sensibilidade religiosa", ["Catolicismo declining mas cultural pillar", "Fátima — santuário internacional", "Religiosidade popular vs prática", "Secularização gradual sem confronto"]],
  [230, "Humor decodificado", ["Ironia subtil — valorizada", "Auto-ironia — apreciada", "Sarcasmo — uso medido", "Português humor — drier than Brazilian"]],
  [231, "Conversa política", ["Portugueses educados em conversa política", "Polarização moderada vs Brasil", "Chega ascensão — debate centro right-populist", "Diplomacia familiar mesa"]],
  [232, "Dinâmica familiar", ["Família extensa importance", "Mãe central — figura emocional", "Filhos saem mais tarde (financial)", "Almoço domingo — tradição padrão"]],
  [233, "Amizade portuguesa", ["Slow to fully include — initially reserved", "For life — amizade duradoura", "Café/jantar — venues principais", "Portuguese friendship — depth over breadth"]],
  [234, "Português romântico", ["Amor, paixão, querer", "Adoro-te (deep) vs gosto muito de ti", "Diminutivos: meu amorzinho, querido/a", "Portuguese romance — poesia + saudade infused"]],
  [235, "Resolução conflito", ["Diplomacia + jeitinho português", "Pedir desculpa — não sinal fraqueza", "Mediação familiar", "Portuguese conflict — emocional, then reconcilação"]],
  [236, "Ler imprensa fluente", ["Identificar registo: notícia vs opinião", "Reconhecer enviesamento", "Skim, scan, profundo — 3 fases", "Hábito leitura jornal diária"]],
  [237, "Ver TV sem legendas", ["RTP1, RTP2, SIC, TVI — major", "Telejornal — institution", "Séries portuguesas: Glória, Rabo de Peixe (Netflix)", "Reality, talk shows pop culture"]],
  [238, "Podcasts portugueses", ["Governo Sombra, As Maluqueiras, Aspirina B", "True crime, atualidade", "Spotify Portugal crescimento", "Velocidade nativos — 0.85x speed initially"]],
  [239, "Rádio portuguesa", ["Antena 1/2/3 (RTP públicas)", "TSF, Comercial, Renascença", "RFM, Cidade, Mega Hits — música", "Portuguese radio personality culture"]],
  [240, "Review B2.3 + conversa real", ["Recap pragmática + cultural", "Simulação conversa 30 min nativo", "Topics livres: política, food, viagem", "Self-assessment fluency + nuance"]],
]);

const b2_4 = toSessions([
  [241, "Registo académico avançado", ["Linguagem científica vs humanística", "Latinismos: ad hoc, modus operandi, ethos", "Estruturas impessoais, passivas complexas", "Léxico abstrato + técnico"]],
  [242, "Artigo académico estrutura", ["Resumo, palavras-chave, introdução, metodologia", "Resultados, discussão, conclusões, referências", "Notas rodapé, anexos", "Portuguese academic style — discursivo"]],
  [243, "Normas citação", ["APA, MLA, Chicago — used internationally", "Sistema autor-data, sistema numérico", "Referências bibliográficas ordering", "Endnote, Mendeley, Zotero — tools"]],
  [244, "Conferências académicas", ["Comunicação oral, poster, mesa-redonda", "FCT, Ciência Aberta — open access push", "Encontros nacionais + internacionais", "ERC, H2020 — EU funding"]],
  [245, "Tese de doutoramento", ["Tese — 200-300 páginas typical", "Júri — orientador + arguentes", "Provas públicas — defesa pública obrigatória", "Sistema bolonha — articulação UE"]],
  [246, "FCT + investigação", ["Fundação para a Ciência e Tecnologia — federal", "Bolsas doutoramento + pós-doc", "Centros investigação — universidades + laboratórios estado", "Internacionalização — Erasmus + Marie Curie"]],
  [247, "Intelectuais portugueses", ["Eduardo Lourenço — ensaísta + filósofo Mitologia Saudade", "Boaventura de Sousa Santos — sociologo Coimbra", "Maria Lúcia Lepecki — crítica literária", "Onésimo Teotónio Almeida — diasporic intelectual"]],
  [248, "Filosofia portuguesa", ["Antero de Quental — Geração 70", "Sampaio Bruno, Leonardo Coimbra", "Agostinho da Silva — heterodoxo", "José Gil — moderno, filosofia portuguesa contemporânea"]],
  [249, "Sociologia portuguesa", ["José Madureira Pinto, Boaventura Sousa Santos", "ICS — Instituto Ciências Sociais", "CES — Centro Estudos Sociais Coimbra", "Portuguese sociology — EU integration focused"]],
  [250, "História + escola Annales", ["Vitorino Magalhães Godinho — Descobrimentos econ", "Joaquim Veríssimo Serrão", "Joel Serrão, Oliveira Marques — síntese", "Microhistória — moderna abordagem"]],
  [251, "Linguística portuguesa", ["Maria Helena Mira Mateus — Gramática Língua Portuguesa", "Telmo Verdelho, Ivo Castro", "Acordo Ortográfico 1990 — debate aceso", "Variedades pluricêntrico estudo"]],
  [252, "Análise de textos", ["Análise textual exames secundários", "Contexto + estrutura + temas + estilo", "Crítica literária + cultural", "Portuguese close reading tradition"]],
  [253, "Resenhas + críticas", ["Recensão literária, cinematográfica, gastronómica", "Estrutura: contexto + análise + juízo", "Crítica fundamentada não emocional", "Critic tradition: Vasco Graça Moura, Eduardo Prado Coelho"]],
  [254, "Debate académico", ["Tese + argumentos + objeções + réplicas", "Refutar, sustentar, demonstrar", "Citar autoridades + dados + exemplos", "Portuguese debate — articulado, formal"]],
  [255, "Defesa pública tese", ["Apresentação 30-40 min + arguição", "Defender claims rigorosamente", "Júri: orientador + arguentes externos + internos", "Portuguese viva — formal, ritualizada"]],
  [256, "Review B2.4 + paper", ["Recap academic mastery", "Escreve mini-paper 2000 palavras + bibliografia", "Tema: cultura portuguesa aspeto", "Peer review feedback"]],
]);

const b2_5 = toSessions([
  [257, "Registo diplomático", ["Sua Excelência, Excelentíssimo Senhor Embaixador", "Comunicados oficiais, notas verbais", "Vocabulário formal protocolar", "Portuguese diplomatic heritage Rio Branco-equivalent"]],
  [258, "Diplomacia portuguesa", ["MNE — Ministério dos Negócios Estrangeiros", "Tradição: equilíbrio Atlântico + Mediterrâneo + lusofonia", "Marquês de Pombal — reformista esclarecido séc XVIII", "Sá da Bandeira, Salazar — figuras controversas heritage"]],
  [259, "EU + Portugal heritage", ["Adesão CEE 1986 (juntamente com Espanha)", "Tratado Lisboa 2007 — marco EU heritage", "Presidências rotativas — Portugal forte", "Eurozona governance — full member"]],
  [260, "CPLP + lusofonia", ["CPLP — Comunidade Países Língua Portuguesa", "9 países, ~260M falantes", "Sede secretariado Lisboa", "Cooperação cultural + económica + diplomática"]],
  [261, "Portugal ONU", ["Membro desde 1955", "Conselho Segurança não-permanente várias vezes", "António Guterres — Secretário-Geral 2017-2027", "Tradição multilateralista forte"]],
  [262, "ONGs portuguesas", ["AMI — Assistência Médica Internacional", "Médicos Mundo, OIKOS", "Acreditar (oncologia), Liga Portuguesa Contra Cancro", "Sociedade civil organizada — heritage 25 abril"]],
  [263, "Liderança portuguesa", ["Estilo: relacional, formal, cerimonioso", "Networking — prática essencial", "Hierarquia respeitada inicialmente", "Mudança gradual — mais técnica + meritocrática"]],
  [264, "Gerencial português", ["Hierarquia formal + relação pessoal", "Decisões top-down mas consultivas", "Cafezinho ritual durante reuniões", "Portuguese management — moderate change-resistant"]],
  [265, "Discurso público", ["Brazilian rhetorical heritage strong", "Influência clássica Cícero, Quintiliano", "Estilo: alto, médio, baixo", "Gestos coerentes verbal"]],
  [266, "Retórica portuguesa", ["Padre António Vieira — Sermão Santo António Peixes (1654)", "Marquês de Pombal — reforma escrita", "Almeida Garrett — oratória política", "Tradição oratória parlamentar"]],
  [267, "Padre António Vieira", ["1608-1697 — jesuíta português-brasileiro", "Sermões — referência prose portuguesa", "Defesa indígenas Brasil colonial", "Profecia + esoterismo — bíblica visão"]],
  [268, "Discursos modernos", ["Mário Soares — democracia consolidação", "Cavaco Silva — pragmatismo desenvolvimento", "Sócrates — controvérsias jurídicas", "Marcelo Rebelo de Sousa — presidente próximo populace"]],
  [269, "Conferências imprensa", ["Briefing, comunicado, declaração", "Perguntas jornalistas — réplica", "Off the record vs on the record", "Portuguese press conference culture"]],
  [270, "Debates políticos", ["Confrontos eleitorais TV — heritage", "Mediadores: Clara Castro, Vítor Gonçalves", "Polarização moderada vs UK/USA", "Portuguese political debate — articulado"]],
  [271, "Etiqueta internacional", ["Portugal + foreign partners business", "Cultural intelligence + adaptação", "Portuguese negotiation — relational first", "Almoço de negócios — frequente extended"]],
  [272, "Review B2.5 + discurso", ["Recap leadership + diplomacy", "Prepara discurso público 5 min", "Tema escolha + tom formal", "Delivery + Q&A simulados"]],
]);

const b2_6 = toSessions([
  [273, "Os Lusíadas aprofundamento", ["Canto I — Convocação + situação inicial", "Canto III — Inês de Castro tragédia", "Canto V — Adamastor Cabo Tormentas", "Canto IX — Ilha dos Amores"]],
  [274, "Pessoa heterónimos deep", ["Alberto Caeiro — O Guardador de Rebanhos, mestre", "Ricardo Reis — odes neoclássicas, médico exilado", "Álvaro de Campos — Tabacaria, dramatismo modernista", "Bernardo Soares — Livro Desassossego, semi-heterónimo"]],
  [275, "Saramago profundidade", ["Memorial do Convento — Mafra construção, séc XVIII", "Ensaio sobre a Cegueira — distopia humana", "O Evangelho Segundo Jesus Cristo — controvérsia religiosa", "Levantado do Chão — Alentejo, latifúndio história"]],
  [276, "Eça de Queirós deep", ["Os Maias — Lisboa burguesa séc XIX decadente", "O Crime do Padre Amaro — Leiria, religião + paixão", "A Relíquia, A Ilustre Casa de Ramires", "Estilo realista psicológico Portuguese summit"]],
  [277, "Sophia + poesia central", ["Sophia de Mello Breyner — clássica + transparente", "Mar Novo, Geografia, O Nome das Coisas", "Limpeza moral + clássica + mar", "Influência Hellenic + cristã renascentista"]],
  [278, "Geração Orpheu modernismo", ["Revista Orpheu 1915 — momento fundador modernismo PT", "Pessoa, Mário de Sá-Carneiro, Almada Negreiros", "Outdoor Lisboa belle époque + estética nova", "Manifesto Antifuturista — provocação cultura"]],
  [279, "Presença + neorealismo", ["Presença anos 1920-30 — segunda fase", "José Régio, João Gaspar Simões — coordenadores", "Neorealismo anos 40 — Alves Redol, Soeiro Pereira Gomes", "Compromiso social literária"]],
  [280, "Escritoras portuguesas", ["Sophia, Maria Judite Carvalho, Agustina Bessa-Luís", "Lídia Jorge, Hélia Correia, Inês Pedrosa", "Dulce Maria Cardoso — O Retorno", "Geração contemporânea: Patrícia Reis, Susana Moreira Marques"]],
  [281, "Literatura africana lusófona", ["Mia Couto (Moçambique) — Terra Sonâmbula, Vinte e Zinco", "Pepetela (Angola) — Mayombe, A Geração Utopia", "José Eduardo Agualusa (Angola)", "Lusofonia literária — Camões Prize circuit"]],
  [282, "Literatura infantil", ["Aquilino Ribeiro — Romance Raposa", "Sophia — A Menina do Mar", "António Mota — moderno", "Alice Vieira — para jovens"]],
  [283, "Banda desenhada", ["BD — banda desenhada (NÃO 'quadrinhos' como BR)", "José Carlos Fernandes, André Carrilho", "Marcello Quintanilha — Brazilian-Portuguese cross", "Festival Internacional BD Amadora"]],
  [284, "Análise música", ["Fado análise — letras + estrutura", "Madredeus + Mariza — modern fado deconstrução", "Letras: Carlos do Carmo + Camane + Ana Moura", "Lyrical poetry + emocional landscape"]],
  [285, "Teatro avançado", ["Bernardo Santareno — clássico moderno", "Sttau Monteiro — Felizmente Há Luar!", "Filipe La Féria — modern productions", "Teatro Nacional D. Maria II Lisboa heritage"]],
  [286, "Camões + sonetos", ["Camões lírica — sonetos amorosos heritage", "Mudam-se os tempos, mudam-se as vontades — soneto referencial", "Influência Petrarca + Renascimento", "Padrão métrica Portuguese poesia"]],
  [287, "Análise cinema", ["Roteiro, realização, fotografia, montagem", "Cinemateca Portuguesa Lisboa — heritage", "Crítica cinematográfica — João Bénard da Costa heritage", "Decodificar filmes portugueses culturalmente"]],
  [288, "Review B2.6 + análise literária", ["Recap tradição literária PT", "Análise 2000 palavras obra escolhida", "Contexto + estrutura + temas + estilo", "Portuguese literary scholarship demonstration"]],
]);

const b2_7 = toSessions([
  [289, "Estrutura CAPLE", ["CAPLE — Centro Avaliação Português Língua Estrangeira", "Universidade de Lisboa — examina oficialmente", "Níveis: CIPLE (A2), DEPLE (B1), DIPLE (B2), DAPLE (C1), DUPLE (C2)", "Linguo target: DIPLE (B2) ou DAPLE (C1)"]],
  [290, "DIPLE — B2 estrutura", ["4 componentes: compreensão escrita, expressão escrita, compreensão oral, expressão oral", "Duração total ~3 horas", "Cada componente 25% nota total", "Aprovação: ≥55% global + ≥30% em cada"]],
  [291, "Compreensão oral CAPLE", ["Conversações, notícias, anúncios, instruções", "Multiple choice + true/false + completar", "Estratégia: ler perguntas ANTES de ouvir", "Native speed — practica intensiva"]],
  [292, "Compreensão escrita CAPLE", ["Textos: artigo, narrativo, informativo, opinião", "Multiple choice + true/false + completar", "Vocabulário inferência contexto", "Time management critical"]],
  [293, "Expressão escrita CAPLE", ["2 tarefas: texto curto (75-100 palavras) + longo (180-220)", "Géneros: carta, email, ensaio, narrativa", "Adequação + coerência + correção + complexidade", "Pratica com prompts reais"]],
  [294, "Expressão oral CAPLE", ["Aquecimento + monólogo (2-3 min) + interação examinador (4-5 min)", "Tópicos: experiência pessoal, opiniões, hipóteses", "Fluência + pronúncia + vocabulário + correção", "Naturalness > absolute accuracy"]],
  [295, "CAPLE pratica oral", ["Simulações com nativo ou tutor", "Falar 4-5 min sobre tópico dado", "Comentar imagens, situações, charges", "Naturalness primary criterion B2 level"]],
  [296, "CAPLE pratica leitura", ["Textos B2 PT-PT — Público, Expresso, Visão", "Skim, scan, profundo — 3 fases", "Identificar argumento + persuasão técnicas", "Tempo: simulate condições prova"]],
  [297, "CAPLE pratica ensaio", ["Ensaio argumentativo 180-220 palavras", "Tese + argumentos + exemplos + conclusão", "Conetivos lógicos articulação", "Self-edit checklist applied"]],
  [298, "CAPLE pratica carta", ["Carta formal ou informal por prompt", "Abertura, desenvolvimento, fecho apropriados", "Registo matching contexto", "Convenções carta portuguesa"]],
  [299, "CAPLE pratica monólogo", ["Tópico sorteado", "Preparação 2 min, exposição 2-3 min", "Estrutura: introdução, desenvolvimento, conclusão", "Filler words: bem, então, pronto — moderate use"]],
  [300, "CAPLE pratica interação", ["Role-play com examinador", "Situações: trabalho, viagem, problema resolver", "Negotiation + opinião + politeness", "Active listening + resposta apropriada"]],
  [301, "Simulação CAPLE completa", ["3+ horas simulação full exam", "Todas 4 componentes em sequência realística", "Time management total", "Self-assessment vs scoring criteria"]],
  [302, "CAPLE scoring + feedback", ["Pontuações por componente + total", "Identificar pontos fracos", "Plano melhoria mirado", "Quando repetir — best strategy"]],
  [303, "Estratégias dia exame", ["Documentos: BI/passaporte + inscrição", "Sono + alimentação dia anterior", "Sede exame Lisboa CAPLE ou centros internacionais", "Calma + concentração management"]],
  [304, "Revisão final + celebração", ["Recap 304 sessões completas", "Portuguese (European) journey reflection", "Próximos passos: DAPLE C1, imersão Portugal, profissional", "Adeus e boa sorte no CAPLE!"]],
]);

// ============================================================================
// Curriculum Assembly
// ============================================================================

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("portuguese-pt")!,
  overview:
    "Program 304 sesi yang mengantar lo dari nol sampai percakapan near-native dalam Bahasa Portugis Eropa (Português Europeu). Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Mulai dari alfabeto português (26 huruf), pronunciation dengan vogais átonas REDUZIDAS (telefone soa 'tlefone' — feature unik PT-PT vs PT-BR) + chiado (s final = 'sh') + R apical/uvular, grammar Romance dengan tu sebagai default 2nd person singular (você = formal, BUKAN default kayak Brazil), enclítico pronouns standard (amo-te, dei-lhe), estar A + infinitivo (BUKAN gerundio — 'estou a fazer' vs PT-BR 'estou fazendo'), conjuntivo mastery untuk B2. Imersi kultur Portugal: Fado UNESCO (Amália → Mariza → Salvador Sobral), Saudade concept untranslatable, Lisboa 7 colinas + Alfama + Belém, Porto + Vinho do Porto + Douro Valley UNESCO, Os Descobrimentos (Vasco da Gama 1498 → Cabral 1500), Camões Os Lusíadas 1572, Fernando Pessoa heterónimos, José Saramago Nobel 1998, Eça de Queirós Os Maias, Sophia de Mello Breyner, Estado Novo Salazar 1933-74 → Revolução dos Cravos 25 abril 1974, EU 1986, CPLP lusofonia, azulejos heritage, pastel de nata Belém, bacalhau 1001 maneiras, futebol Big 3 (Benfica/Porto/Sporting) + Ronaldo + Euro 2016. Test prep B2.7: CAPLE — sertifikat ufficiale Universidade de Lisboa, level DIPLE (B2) atau DAPLE (C1), diakui untuk study + work + nacionalidade Portuguese.",
  levels: [
    {
      code: "A1",
      name: "Elementary Foundation",
      description:
        "Fundamentos Elementares. Mulai dari alfabeto português (26 letras), pronunciation dengan vogais átonas REDUZIDAS + chiado lisboeta + R apical/uvular, greetings (Olá, Bom dia, Adeus), números 1-1000, present tense verbos SER/ESTAR/TER + 3 conjugações regulares (-AR/-ER/-IR) dengan tu form ATIVO (PT-PT signature), artigos definidos + indefinidos, pronomes personais com você FORMAL (NOT default como Brazil). Akhir A1: introduce diri sendiri, order numa pastelaria, kuasai 800+ kata dasar Portuguese.",
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
        "Pré-Intermediário. Tense expansion: pretérito perfeito simples + imperfeito + mais-que-perfeito, futuro simples sintético (mais usado PT escrito), condicional. Pronomes oblíquos enclíticos PADRÃO (amo-te, dei-lho — PT-PT signature). Intro conjuntivo presente. Estar A + infinitivo (BUKAN gerundio PT-BR). Imersi: Fado UNESCO (Amália), Saudade concept, Os Descobrimentos (Vasco da Gama, Cabral), Lisboa + Porto + Coimbra cities, Camões intro, 18 distritos + Açores + Madeira, Estado Novo → Revolução Cravos. Vocab grow to 2000+ kata.",
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
        "Intermediário. Fluency tools — mais-que-perfeito, período hipotético (3 tipos), conjuntivo imperfeito, discurso indireto, voz passiva, se impessoal. Deep dive literatura portuguesa: Camões Os Lusíadas, Fernando Pessoa heterónimos, José Saramago Nobel, Eça de Queirós realismo, Sophia + Eugénio Andrade poesia. Cinema Manoel de Oliveira → Pedro Costa + Miguel Gomes. Fado masters (Amália → Mariza), música moderna Madredeus + Salvador Sobral, gastronomia regional bacalhau-francesinha-cataplana, vinho Porto + Douro. Sociedade: Estado Novo → Revolução Cravos 25 abril 1974 → EU 1986 → crise dívida 2010-14. Professional Portuguese: contrato sem termo, 13º+14º meses, NIF, recibos verdes. Vocab 3500+.",
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
        "Upper Intermediário. Near-native expression: conjuntivo mais-que-perfeito, período hipotético 3 tipos mastery, recursos retóricos. Academic Portuguese: artigo académico, tese doutoramento, FCT investigação, intelectuais portugueses (Eduardo Lourenço, Boaventura Sousa Santos, Agostinho da Silva). Professional industry-specific: turismo, moda, design (Siza Vieira-Souto Moura Pritzker), diplomático (MNE + CPLP), jornalismo, jurídico, médico, engenharia, IT, finanças. Diplomatic register + leadership + Padre António Vieira rhetoric heritage. Literary mastery: Os Lusíadas deep, Pessoa heterónimos, Saramago, Eça profundidade, Geração Orpheu modernismo, Geração Presença + neorealismo, escritoras (Sophia, Lídia Jorge, Dulce Maria Cardoso), literatura africana lusófona (Mia Couto, Pepetela). Sotaques regionais (lisboeta, portuense, alentejano, açoriano, madeirense). Persiapan CAPLE — DIPLE (B2) ou DAPLE (C1), sertifikat oficial Universidade Lisboa. Vocab 5000+.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression", sessions: b2_1, preview: true },
        { code: "B2.2", name: "Professional Portuguese", sessions: b2_2, preview: true },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: true },
        { code: "B2.4", name: "Academic Mastery", sessions: b2_4, preview: true },
        { code: "B2.5", name: "Leadership & Diplomacy", sessions: b2_5, preview: true },
        { code: "B2.6", name: "Creative & Literary", sessions: b2_6, preview: true },
        { code: "B2.7", name: "Test Prep (CAPLE)", sessions: b2_7, preview: true },
      ],
    },
  ],
};

export default curriculum;

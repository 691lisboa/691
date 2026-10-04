// Conteúdo do site 691.pt — PT-PT e EN. Edita aqui e corre `npm run build`.
// Regra: só afirmações verificáveis (nada de preços, tempos de resposta ou números de clientes inventados).

export const SITE = {
  origin: 'https://691.pt',
  brand: '691.pt',
  phone: '+351928158158',
  phoneDisplay: '+351 928 158 158',
  wa: 'https://wa.me/351928158158',
  instagram: 'https://www.instagram.com/691.pt/',
  review: 'https://g.page/r/CZWOHn4SgRvMECE/review',
  complaints: 'https://www.livroreclamacoes.pt/Inicio/',
  updated: '2026-10-04',
  year: 2026
}

// Rotas por idioma. `dest` = páginas de destino.
export const ROUTES = {
  pt: {
    home: '/', airport: '/taxi-aeroporto-lisboa/', lisbon: '/taxi-lisboa/', portugal: '/viagens-portugal/',
    sintra: '/viagens-portugal/sintra/', fatima: '/viagens-portugal/fatima/', nazare: '/viagens-portugal/nazare/',
    porto: '/viagens-portugal/porto/', evora: '/viagens-portugal/evora/', legal: '/legal.html'
  },
  en: {
    home: '/en/', airport: '/en/lisbon-airport-taxi/', lisbon: '/en/lisbon-taxi/', portugal: '/en/trips-portugal/',
    sintra: '/en/trips-portugal/sintra/', fatima: '/en/trips-portugal/fatima/', nazare: '/en/trips-portugal/nazare/',
    porto: '/en/trips-portugal/porto/', evora: '/en/trips-portugal/evora/', legal: '/en/legal.html'
  }
}

export const DEST_KEYS = ['sintra', 'fatima', 'nazare', 'porto', 'evora']

// Imagem principal de cada página + alt.
export const IMAGES = {
  home: { img: 'lisboa', pos: '50% 60%' },
  lisbon: { img: 'lisboa', pos: '50% 60%' },
  airport: { img: 'aeroporto', pos: '50% 58%' },
  portugal: { img: 'sintra', pos: '50% 45%' },
  sintra: { img: 'sintra', pos: '50% 45%' },
  fatima: { img: 'fatima', pos: '50% 50%' },
  nazare: { img: 'nazare', pos: '40% 55%' },
  porto: { img: 'porto', pos: '50% 55%' },
  evora: { img: 'evora', pos: '50% 45%' },
  taxi: { img: 'taxi', pos: '50% 60%' }
}

export const T = {
  pt: {
    lang: 'pt-PT', locale: 'pt_PT', code: 'pt', name: 'Português', other: 'en',
    ui: {
      skip: 'Saltar para o conteúdo',
      home: 'Início', airport: 'Aeroporto', lisbon: 'Lisboa', portugal: 'Viagens por Portugal',
      nav: 'Navegação principal', menu: 'Abrir menu', menuClose: 'Fechar menu', contacts: 'Contactos rápidos',
      book: 'Reservar pelo WhatsApp', bookShort: 'WhatsApp', call: 'Ligar', callFull: 'Ligar agora',
      callLabel: 'Ligar para +351 928 158 158', waLabel: 'WhatsApp', igLabel: 'Instagram @691.pt', reviewLabel: 'Avaliar no Google',
      langSwitch: 'EN', langSwitchLabel: 'Read this page in English',
      breadcrumb: 'Caminho', services: 'Serviços', destinations: 'Destinos', contactsTitle: 'Contactos', legalTitle: 'Informação legal',
      legal: 'Informação Legal e Privacidade', complaints: 'Livro de Reclamações', allDest: 'Ver todos os destinos',
      seeMore: 'Saber mais', faq: 'Perguntas frequentes', others: 'Outros serviços', otherDest: 'Outros destinos',
      facts: { distance: 'Distância', time: 'Duração', approx: 'aprox.', from: 'Saída' },
      footerTag: 'Táxi em Lisboa com reserva direta pelo WhatsApp: cidade, aeroporto e viagens por todo o país.',
      rights: '© 2026 691.pt Lisboa', backHome: 'Voltar ao início', review: 'Avalie-nos no Google', followUs: 'Siga-nos no Instagram',
      sendTitle: 'O que enviar na mensagem', sendIntro: 'Quanto mais claro o pedido, mais rápida a confirmação.',
      send: ['Local de recolha', 'Destino', 'Data e hora', 'Passageiros e bagagem'],
      language: 'Idioma'
    },
    wa: {
      home: 'Olá, gostaria de reservar um táxi.',
      airport: 'Olá, gostaria de reservar um táxi para o Aeroporto de Lisboa.',
      lisbon: 'Olá, gostaria de reservar um táxi em Lisboa.',
      portugal: 'Olá, gostaria de reservar uma viagem de táxi a partir de Lisboa.',
      sintra: 'Olá, gostaria de reservar uma viagem de táxi para Sintra.',
      fatima: 'Olá, gostaria de reservar uma viagem de táxi para Fátima.',
      nazare: 'Olá, gostaria de reservar uma viagem de táxi para a Nazaré.',
      porto: 'Olá, gostaria de reservar uma viagem de táxi para o Porto.',
      evora: 'Olá, gostaria de reservar uma viagem de táxi para Évora.'
    },
    steps: {
      title: 'Reservar é simples', sub: 'Três passos, sem formulários nem aplicações.',
      items: [
        { t: 'Envie uma mensagem', p: 'Diga-nos o local de recolha, o destino, a data e a hora.', i: 'chat' },
        { t: 'Confirmamos consigo', p: 'O motorista responde diretamente e confirma a disponibilidade.', i: 'check' },
        { t: 'Viaje com tranquilidade', p: 'Estamos no local combinado, à hora combinada.', i: 'car' }
      ]
    },
    why: {
      eyebrow: 'Porquê o 691.pt', title: 'Um serviço direto, claro e de confiança.',
      items: [
        { t: 'Direto com o motorista', p: 'Fala com quem conduz. Sem call centers, sem intermediários.', i: 'chat' },
        { t: 'Falamos inglês', p: 'English spoken. Pode escrever-nos em inglês no WhatsApp.', i: 'globe' },
        { t: 'Preço legal e transparente', p: 'O valor é o do taxímetro, segundo o tarifário de táxi em vigor.', i: 'shield' },
        { t: 'Em todo o país', p: 'Lisboa, aeroporto e viagens marcadas para qualquer ponto de Portugal.', i: 'pin' }
      ]
    },
    review: { title: 'Já viajou connosco?', p: 'A sua avaliação no Google ajuda outros viajantes a escolher com confiança.', cta: 'Deixar avaliação' },
    cta: { title: 'Diga-nos onde e quando.', p: 'Envie uma mensagem pelo WhatsApp e respondemos diretamente.' },
    faqTitle: 'Perguntas frequentes',
    pages: {
      home: {
        title: 'Táxi Lisboa e Aeroporto | Reserva Direta pelo WhatsApp — 691.pt',
        desc: 'Táxi em Lisboa, ao aeroporto e para todo o país. Envie uma mensagem pelo WhatsApp e fale diretamente com o motorista. Atendimento em português e inglês.',
        imgAlt: 'Ponte 25 de Abril e telhados de Lisboa ao pôr do sol',
        eyebrow: 'Táxi em Lisboa · Aeroporto · Portugal',
        h1: 'O seu táxi em Lisboa, a uma mensagem de distância.',
        sub: 'Aeroporto, cidade e todo o país. Fale diretamente com o motorista, sem aplicações nem intermediários.',
        chips: ['Reserva direta', 'Falamos inglês', 'Em todo o país'],
        servicesEyebrow: 'Serviços', servicesTitle: 'Para onde vamos hoje?',
        servicesSub: 'Escolha o tipo de viagem e envie-nos o pedido pelo WhatsApp.',
        cards: {
          lisbon: { t: 'Táxi em Lisboa', p: 'Trabalho, consultas, restaurantes, hotéis e tudo o que o dia pede.', alt: 'Ponte 25 de Abril ao pôr do sol' },
          airport: { t: 'Aeroporto de Lisboa', p: 'Partidas a horas e recolhas à chegada, com reserva antecipada.', alt: 'Avião a descolar do aeroporto ao pôr do sol, com um táxi 691 à espera' },
          portugal: { t: 'Viagens por Portugal', p: 'Sintra, Fátima, Nazaré, Porto, Évora e muito mais, a partir de Lisboa.', alt: 'Palácio da Pena, em Sintra' }
        },
        destEyebrow: 'Destinos', destTitle: 'De Lisboa para Portugal.',
        destSub: 'Viagens marcadas, com partida de Lisboa, para os destinos mais procurados.',
        vehicle: {
          eyebrow: 'A nossa viatura', title: 'Reconhece-nos facilmente.',
          p: 'Procure o táxi preto com topo verde e o número 691. Confirmamos sempre consigo o ponto de encontro antes da viagem.',
          alt: 'Táxi preto com topo verde, número 691, estacionado'
        },
        faq: [
          { q: 'Como faço uma reserva?', a: 'Envie-nos uma mensagem pelo WhatsApp com o local de recolha, o destino, a data e a hora. O motorista responde diretamente.' },
          { q: 'A reserva é imediata?', a: 'O pedido de reserva fica sujeito a confirmação e à disponibilidade do serviço. Confirmamos consigo pelo WhatsApp.' },
          { q: 'Como é calculado o preço?', a: 'Pelo taxímetro, de acordo com o tarifário legal de táxi em vigor. O valor final é o indicado no fim da viagem, salvo as situações previstas na lei.' },
          { q: 'Fazem viagens fora de Lisboa?', a: 'Sim: Sintra, Fátima, Nazaré, Porto, Évora e outros destinos. Para viagens mais longas, contacte-nos com antecedência para confirmar a disponibilidade.' },
          { q: 'Posso reservar a recolha no aeroporto?', a: 'Sim. Indique o voo e a hora de chegada, o destino e o número de passageiros e malas, para planearmos a recolha.' },
          { q: 'Falam inglês?', a: 'Sim. English spoken: pode escrever-nos em inglês no WhatsApp.' }
        ]
      },
      airport: {
        title: 'Táxi para o Aeroporto de Lisboa | Reserva Direta — 691.pt',
        desc: 'Táxi para o Aeroporto Humberto Delgado: partidas a horas e recolhas à chegada. Reserve pelo WhatsApp e fale diretamente com o motorista.',
        imgAlt: 'Avião a descolar do aeroporto de Lisboa ao pôr do sol, com um táxi 691 à espera',
        eyebrow: 'Aeroporto de Lisboa',
        h1: 'Do aeroporto ao seu destino, sem filas nem surpresas.',
        sub: 'Reserve com antecedência o táxi para o Aeroporto Humberto Delgado ou combine a recolha à chegada. Fala diretamente com o motorista.',
        sectionEyebrow: 'Transfers', sectionTitle: 'Aeroporto sem complicações.',
        sectionSub: 'Indique a data, a hora, a origem e o destino. A reserva fica sujeita a confirmação.',
        cards: [
          { t: 'Partidas a horas', p: 'Recolha na sua morada ou hotel, à hora combinada, a pensar no seu voo.', i: 'plane' },
          { t: 'Chegadas sem stress', p: 'Combine a recolha à chegada e siga diretamente para o seu destino.', i: 'pin' },
          { t: 'Hotel ↔ Aeroporto', p: 'Uma opção direta para hóspedes e visitantes, nos dois sentidos.', i: 'compass' }
        ],
        tip: { t: 'Voos de madrugada ou muito cedo?', p: 'Reserve com antecedência. Quanto mais cedo nos avisar, mais fácil é garantir a viagem à hora certa.' },
        faq: [
          { q: 'Quanto demora do aeroporto ao centro de Lisboa?', a: 'Em condições normais, cerca de 20 a 30 minutos, dependendo do trânsito e da zona de destino.' },
          { q: 'Que informação devo enviar?', a: 'Data e hora, local de recolha ou destino, número de passageiros e malas e, nas chegadas, o voo e a hora prevista.' },
          { q: 'Como é calculado o preço?', a: 'Pelo taxímetro, de acordo com o tarifário legal de táxi em vigor. O valor final é o indicado no fim da viagem, salvo as situações previstas na lei.' },
          { q: 'Posso reservar para outra pessoa?', a: 'Sim. Indique-nos o nome e o contacto de quem vai viajar e o ponto de encontro.' }
        ]
      },
      lisbon: {
        title: 'Táxi em Lisboa | Reserva Direta pelo WhatsApp — 691.pt',
        desc: 'Táxi em Lisboa para trabalho, consultas, restaurantes, hotéis e aeroporto. Reserve pelo WhatsApp e combine tudo diretamente com o motorista.',
        imgAlt: 'Ponte 25 de Abril e telhados de Lisboa ao pôr do sol',
        eyebrow: 'Táxi em Lisboa',
        h1: 'Lisboa ao seu ritmo: trabalho, jantar, consulta ou passeio.',
        sub: 'Reserve a sua viagem pelo WhatsApp e combine tudo diretamente com o motorista, da recolha ao destino.',
        sectionEyebrow: 'Na cidade', sectionTitle: 'Um serviço simples para Lisboa.',
        sectionSub: 'Para o dia a dia ou para uma noite especial, com hora marcada.',
        cards: [
          { t: 'O dia a dia', p: 'Casa, trabalho, consultas e compromissos, sem esperar por uma viatura.', i: 'clock' },
          { t: 'Hotéis e restaurantes', p: 'Chegue a horas e sem preocupações com estacionamento.', i: 'pin' },
          { t: 'Reserva antecipada', p: 'Escolha a data e a hora e fique com a viagem combinada.', i: 'calendar' }
        ],
        tip: { t: 'Precisa de ir ao aeroporto?', p: 'Reserve a partida ou a recolha com antecedência e deixe o resto connosco.' },
        faq: [
          { q: 'Posso reservar para daqui a pouco?', a: 'Pode pedir, mas a reserva fica sujeita a confirmação e disponibilidade. Para horas marcadas, quanto mais cedo, melhor.' },
          { q: 'Como é calculado o preço?', a: 'Pelo taxímetro, de acordo com o tarifário legal de táxi em vigor. O valor final é o indicado no fim da viagem, salvo as situações previstas na lei.' },
          { q: 'Falam inglês?', a: 'Sim. English spoken: pode escrever-nos em inglês no WhatsApp.' }
        ]
      },
      portugal: {
        title: 'Viagens de Táxi de Lisboa para Portugal | Reserva Direta — 691.pt',
        desc: 'Viagens de táxi a partir de Lisboa para Sintra, Fátima, Nazaré, Porto, Évora e outros destinos. Reserve pelo WhatsApp com o motorista.',
        imgAlt: 'Palácio da Pena, no alto da serra de Sintra',
        eyebrow: 'Lisboa → Portugal',
        h1: 'De Lisboa a qualquer ponto de Portugal.',
        sub: 'Viagens marcadas com partida de Lisboa, no seu horário e ao seu ritmo. Escolha o destino e envie-nos o pedido.',
        sectionEyebrow: 'Destinos', sectionTitle: 'Para onde quer ir?',
        sectionSub: 'Distâncias e durações aproximadas, a partir de Lisboa e sem contar com o trânsito.',
        more: { t: 'Outros destinos', p: 'Também fazemos viagens para Cascais, Óbidos e outros destinos em Portugal. Diga-nos para onde pretende ir.' },
        tip: { t: 'Viagens mais longas', p: 'Contacte-nos com antecedência para confirmar a disponibilidade e combinar horários e paragens.' },
        faq: [
          { q: 'Posso fazer paragens pelo caminho?', a: 'Pode pedir. Combinamos consigo o itinerário e as paragens antes da viagem.' },
          { q: 'Fazem viagens de ida e volta no mesmo dia?', a: 'Sim, sujeito a confirmação. Indique-nos o destino, o horário de partida e a hora a que pretende regressar.' },
          { q: 'Como é calculado o preço?', a: 'Pelo taxímetro, de acordo com o tarifário legal de táxi em vigor. O valor final é o indicado no fim da viagem, salvo as situações previstas na lei.' }
        ]
      }
    },
    dest: {
      sintra: {
        name: 'Sintra', km: '≈ 30 km', time: '≈ 40 min', teaser: 'Palácio da Pena, serra e vila histórica',
        title: 'Táxi de Lisboa para Sintra | Reserva Direta — 691.pt',
        desc: 'Táxi de Lisboa para Sintra, Palácio da Pena e centro histórico. Reserve pelo WhatsApp e viaje sem filas nem problemas de estacionamento.',
        imgAlt: 'Palácio da Pena, amarelo e vermelho, no alto da serra de Sintra',
        h1: 'Sintra sem filas de autocarro nem problemas de estacionamento.',
        sub: 'Viagem direta de Lisboa até à serra, ao Palácio da Pena e à vila histórica, com o motorista a combinar tudo consigo.',
        sectionTitle: 'O melhor de Sintra',
        highlights: [
          { t: 'Palácio da Pena', p: 'O palácio colorido no alto da serra, um dos ícones de Portugal.' },
          { t: 'Centro histórico', p: 'Ruas estreitas, o Palácio Nacional e as pastelarias da vila.' },
          { t: 'Quinta da Regaleira e Castelo dos Mouros', p: 'Jardins, poços e muralhas entre a floresta e o nevoeiro da serra.' }
        ],
        tip: { t: 'Sugestão', p: 'A serra tem muito trânsito e pouco estacionamento no verão. Chegar de táxi poupa tempo e dores de cabeça.' },
        faq: [
          { q: 'Quanto demora a viagem de Lisboa a Sintra?', a: 'Cerca de 40 minutos em condições normais, dependendo do trânsito.' },
          { q: 'Podem esperar enquanto visito os monumentos?', a: 'Podemos combinar uma viagem com espera ou vários pontos de paragem. Diga-nos o plano no pedido de reserva.' },
          { q: 'Também vão ao Cabo da Roca ou a Cascais?', a: 'Sim, são destinos próximos e podem fazer parte da mesma viagem. Indique-nos o itinerário que pretende.' }
        ]
      },
      fatima: {
        name: 'Fátima', km: '≈ 130 km', time: '≈ 1 h 20', teaser: 'Santuário e peregrinação',
        title: 'Táxi de Lisboa para Fátima | Reserva Direta — 691.pt',
        desc: 'Táxi de Lisboa para o Santuário de Fátima. Viagens marcadas, ida e volta no mesmo dia, com reserva direta pelo WhatsApp.',
        imgAlt: 'Santuário de Fátima ao pôr do sol',
        h1: 'Fátima com conforto, ida e volta no mesmo dia.',
        sub: 'Transporte direto de Lisboa para o Santuário, para peregrinações, visitas e viagens programadas.',
        sectionTitle: 'Em Fátima',
        highlights: [
          { t: 'Santuário de Nossa Senhora de Fátima', p: 'O recinto de oração, a Basílica e a grande esplanada.' },
          { t: 'Capelinha das Aparições', p: 'O local mais simbólico do Santuário, no centro do recinto.' },
          { t: 'Valinhos e Via Sacra', p: 'Percursos de oração e memória nos arredores do Santuário.' }
        ],
        tip: { t: 'Datas de grande afluência', p: 'Em 12 e 13 de maio e de outubro há muitos peregrinos. Reserve com a maior antecedência possível.' },
        faq: [
          { q: 'Quanto demora a viagem de Lisboa a Fátima?', a: 'Cerca de 1 h 20 em condições normais, dependendo do trânsito.' },
          { q: 'Fazem ida e volta no mesmo dia?', a: 'Sim, sujeito a confirmação. Indique a hora de partida e a hora a que pretende regressar.' },
          { q: 'Podem recolher várias pessoas em moradas diferentes?', a: 'Podemos combinar vários pontos de recolha. Envie-nos as moradas e o número de passageiros.' }
        ]
      },
      nazare: {
        name: 'Nazaré', km: '≈ 120 km', time: '≈ 1 h 20', teaser: 'Praia, ondas gigantes e costa atlântica',
        title: 'Táxi de Lisboa para a Nazaré | Reserva Direta — 691.pt',
        desc: 'Táxi de Lisboa para a Nazaré: Sítio, Forte de São Miguel Arcanjo e Praia do Norte. Reserve pelo WhatsApp com o motorista.',
        imgAlt: 'Onda gigante junto à falésia e ao farol da Nazaré',
        h1: 'Nazaré: do Sítio às ondas gigantes da Praia do Norte.',
        sub: 'Viagem direta de Lisboa até à costa atlântica, para um dia de miradouros, mar e peixe fresco.',
        sectionTitle: 'Na Nazaré',
        highlights: [
          { t: 'Praia da Nazaré', p: 'Marginal, areal amplo e o ambiente típico da vila piscatória.' },
          { t: 'Sítio da Nazaré', p: 'O miradouro sobre a vila e o oceano, a que se sobe por funicular.' },
          { t: 'Farol e Praia do Norte', p: 'Junto ao Forte de São Miguel Arcanjo, onde o mar gera ondas gigantes.' }
        ],
        tip: { t: 'Quando ver as ondas gigantes', p: 'Acontecem sobretudo entre o outono e o inverno, quando há grandes ondulações. Consulte a previsão antes de escolher o dia.' },
        faq: [
          { q: 'Quanto demora a viagem de Lisboa à Nazaré?', a: 'Cerca de 1 h 20 em condições normais, dependendo do trânsito.' },
          { q: 'Dá para combinar a Nazaré com Óbidos?', a: 'Sim, são destinos próximos e a viagem pode incluir paragens. Diga-nos o itinerário que pretende.' },
          { q: 'Fazem ida e volta no mesmo dia?', a: 'Sim, sujeito a confirmação. Indique a hora de partida e de regresso.' }
        ]
      },
      porto: {
        name: 'Porto', km: '≈ 315 km', time: '≈ 3 h', teaser: 'Ribeira, Douro e centro histórico',
        title: 'Táxi de Lisboa para o Porto | Reserva Direta — 691.pt',
        desc: 'Táxi de Lisboa para o Porto: viagem direta e confortável, com reserva antecipada pelo WhatsApp. Ribeira, Douro e centro histórico.',
        imgAlt: 'Ribeira do Porto e o rio Douro ao entardecer',
        h1: 'Lisboa–Porto numa viagem direta, ao seu horário.',
        sub: 'Uma viagem longa tem de ser confortável. Combine a partida, as paragens e o destino com o motorista.',
        sectionTitle: 'No Porto',
        highlights: [
          { t: 'Ribeira', p: 'A frente ribeirinha histórica, com esplanadas e vistas sobre o Douro.' },
          { t: 'Douro e pontes', p: 'A Ponte D. Luís I, as caves de Vila Nova de Gaia e o rio.' },
          { t: 'Centro histórico', p: 'Património da humanidade, com a Estação de São Bento e os seus azulejos.' }
        ],
        tip: { t: 'Reserve com tempo', p: 'Por ser uma viagem longa, contacte-nos com antecedência para confirmar a disponibilidade e combinar paragens.' },
        faq: [
          { q: 'Quanto demora a viagem de Lisboa ao Porto?', a: 'Cerca de 3 horas em condições normais, sem contar com paragens nem trânsito.' },
          { q: 'Podemos parar pelo caminho?', a: 'Sim, combinamos as paragens consigo antes da viagem.' },
          { q: 'Fazem o percurso inverso, do Porto para Lisboa?', a: 'Sim, sujeito a confirmação. Envie-nos a data, a hora e a morada de recolha.' }
        ]
      },
      evora: {
        name: 'Évora', km: '≈ 135 km', time: '≈ 1 h 30', teaser: 'História e tradição alentejana',
        title: 'Táxi de Lisboa para Évora | Reserva Direta — 691.pt',
        desc: 'Táxi de Lisboa para Évora: centro histórico, Templo Romano e Alentejo. Viagens marcadas com reserva direta pelo WhatsApp.',
        imgAlt: 'Templo Romano de Évora ao fim da tarde',
        h1: 'Évora, a capital do Alentejo a pouco mais de uma hora de Lisboa.',
        sub: 'Viagem direta e confortável até ao centro histórico, para passeios de um dia ou deslocações marcadas.',
        sectionTitle: 'Em Évora',
        highlights: [
          { t: 'Templo Romano', p: 'Um dos monumentos mais reconhecidos da cidade, junto à Sé.' },
          { t: 'Centro histórico', p: 'Classificado pela UNESCO como Património Mundial, com ruas antigas e praças.' },
          { t: 'Sé e Capela dos Ossos', p: 'Duas visitas marcantes no coração da cidade.' }
        ],
        tip: { t: 'Dia inteiro no Alentejo', p: 'Évora combina bem com paragens em adegas e aldeias alentejanas. Diga-nos o que tem em mente.' },
        faq: [
          { q: 'Quanto demora a viagem de Lisboa a Évora?', a: 'Cerca de 1 h 30 em condições normais, dependendo do trânsito.' },
          { q: 'Podem esperar durante a visita?', a: 'Podemos combinar uma viagem com espera. Diga-nos o plano no pedido de reserva.' },
          { q: 'Fazem ida e volta no mesmo dia?', a: 'Sim, sujeito a confirmação. Indique a hora de partida e de regresso.' }
        ]
      }
    },
    notFound: {
      title: 'Página não encontrada — 691.pt', h1: 'Esta página não existe.', p: 'O endereço pode estar errado ou a página mudou de sítio. Volte ao início ou reserve diretamente pelo WhatsApp.'
    },
    offline: {
      title: 'Sem ligação — 691.pt', h1: 'Sem ligação à internet.', p: 'Parece que está offline. Verifique a ligação e tente novamente, ou ligue-nos diretamente.', retry: 'Tentar novamente', contact: 'Reservas'
    }
  },

  en: {
    lang: 'en', locale: 'en_GB', code: 'en', name: 'English', other: 'pt',
    ui: {
      skip: 'Skip to content',
      home: 'Home', airport: 'Airport', lisbon: 'Lisbon', portugal: 'Trips across Portugal',
      nav: 'Main navigation', menu: 'Open menu', menuClose: 'Close menu', contacts: 'Quick contacts',
      book: 'Book on WhatsApp', bookShort: 'WhatsApp', call: 'Call', callFull: 'Call now',
      callLabel: 'Call +351 928 158 158', waLabel: 'Open WhatsApp chat', igLabel: 'Instagram @691.pt', reviewLabel: 'Review us on Google',
      langSwitch: 'PT', langSwitchLabel: 'Ler esta página em português',
      breadcrumb: 'Breadcrumb', services: 'Services', destinations: 'Destinations', contactsTitle: 'Contacts', legalTitle: 'Legal',
      legal: 'Legal Information and Privacy', complaints: 'Complaints Book', allDest: 'See all destinations',
      seeMore: 'Learn more', faq: 'Frequently asked questions', others: 'Other services', otherDest: 'Other destinations',
      facts: { distance: 'Distance', time: 'Duration', approx: 'approx.', from: 'From' },
      footerTag: 'Taxi in Lisbon with direct booking on WhatsApp: city, airport and trips across Portugal.',
      rights: '© 2026 691.pt Lisboa', backHome: 'Back to home', review: 'Review us on Google', followUs: 'Follow us on Instagram',
      sendTitle: 'What to include in your message', sendIntro: 'The clearer the request, the faster the confirmation.',
      send: ['Pickup location', 'Destination', 'Date and time', 'Passengers and luggage'],
      language: 'Language'
    },
    wa: {
      home: 'Hello, I would like to book a taxi.',
      airport: 'Hello, I would like to book a taxi to Lisbon Airport.',
      lisbon: 'Hello, I would like to book a taxi in Lisbon.',
      portugal: 'Hello, I would like to book a taxi trip from Lisbon.',
      sintra: 'Hello, I would like to book a taxi trip to Sintra.',
      fatima: 'Hello, I would like to book a taxi trip to Fátima.',
      nazare: 'Hello, I would like to book a taxi trip to Nazaré.',
      porto: 'Hello, I would like to book a taxi trip to Porto.',
      evora: 'Hello, I would like to book a taxi trip to Évora.'
    },
    steps: {
      title: 'Booking is simple', sub: 'Three steps, no forms and no apps.',
      items: [
        { t: 'Send a message', p: 'Tell us your pickup location, destination, date and time.', i: 'chat' },
        { t: 'We confirm with you', p: 'The driver replies directly and confirms availability.', i: 'check' },
        { t: 'Travel with peace of mind', p: 'We are at the agreed place at the agreed time.', i: 'car' }
      ]
    },
    why: {
      eyebrow: 'Why 691.pt', title: 'A direct, clear and trustworthy service.',
      items: [
        { t: 'Direct with the driver', p: 'You talk to the person who drives. No call centres, no middlemen.', i: 'chat' },
        { t: 'English spoken', p: 'Message us in English on WhatsApp. Falamos inglês.', i: 'globe' },
        { t: 'Legal, transparent fares', p: 'The fare is the taximeter amount, under the official taxi tariff.', i: 'shield' },
        { t: 'Across the country', p: 'Lisbon, the airport and pre-booked trips anywhere in Portugal.', i: 'pin' }
      ]
    },
    review: { title: 'Travelled with us?', p: 'Your Google review helps other travellers choose with confidence.', cta: 'Leave a review' },
    cta: { title: 'Tell us where and when.', p: 'Send a WhatsApp message and we will reply directly.' },
    faqTitle: 'Frequently asked questions',
    pages: {
      home: {
        title: 'Lisbon Taxi and Airport Transfers | Book Direct on WhatsApp — 691.pt',
        desc: 'Taxi in Lisbon, to the airport and across Portugal. Message us on WhatsApp and deal directly with the driver. English and Portuguese spoken.',
        imgAlt: 'The 25 de Abril Bridge and Lisbon rooftops at sunset',
        eyebrow: 'Taxi in Lisbon · Airport · Portugal',
        h1: 'Your Lisbon taxi, one message away.',
        sub: 'Airport, city and the whole country. Talk directly to your driver, with no apps and no middlemen.',
        chips: ['Direct booking', 'English spoken', 'Across the country'],
        servicesEyebrow: 'Services', servicesTitle: 'Where are we going today?',
        servicesSub: 'Choose your kind of trip and send us your request on WhatsApp.',
        cards: {
          lisbon: { t: 'Taxi in Lisbon', p: 'Work, appointments, restaurants, hotels and everything your day needs.', alt: 'The 25 de Abril Bridge at sunset' },
          airport: { t: 'Lisbon Airport', p: 'On-time departures and arrivals pickups, pre-booked.', alt: 'A plane taking off at sunset with a 691 taxi waiting' },
          portugal: { t: 'Trips across Portugal', p: 'Sintra, Fátima, Nazaré, Porto, Évora and more, from Lisbon.', alt: 'Pena Palace in Sintra' }
        },
        destEyebrow: 'Destinations', destTitle: 'From Lisbon to Portugal.',
        destSub: 'Pre-booked trips from Lisbon to the most popular destinations.',
        vehicle: {
          eyebrow: 'Our vehicle', title: 'Easy to recognise.',
          p: 'Look for the black taxi with a green top and the number 691. We always confirm the meeting point with you before the trip.',
          alt: 'Black taxi with a green top and the number 691, parked'
        },
        faq: [
          { q: 'How do I book?', a: 'Send us a WhatsApp message with your pickup location, destination, date and time. The driver replies directly.' },
          { q: 'Is the booking instant?', a: 'A booking request is subject to confirmation and availability. We confirm with you on WhatsApp.' },
          { q: 'How is the fare calculated?', a: 'By the taximeter, under the official taxi tariff in force. The final fare is the amount shown at the end of the trip, except where the law provides otherwise.' },
          { q: 'Do you travel outside Lisbon?', a: 'Yes: Sintra, Fátima, Nazaré, Porto, Évora and other destinations. For longer trips, contact us in advance to confirm availability.' },
          { q: 'Can I book an airport pickup?', a: 'Yes. Tell us your flight and arrival time, your destination and the number of passengers and bags so we can plan the pickup.' },
          { q: 'Do you speak English?', a: 'Yes. You can message us in English on WhatsApp.' }
        ]
      },
      airport: {
        title: 'Lisbon Airport Taxi | Book Direct on WhatsApp — 691.pt',
        desc: 'Taxi to and from Lisbon Airport (Humberto Delgado): on-time departures and arrivals pickups. Book on WhatsApp and talk to the driver directly.',
        imgAlt: 'A plane taking off from Lisbon airport at sunset, with a 691 taxi waiting',
        eyebrow: 'Lisbon Airport',
        h1: 'From the airport to your destination, no queues and no surprises.',
        sub: 'Pre-book your taxi to Humberto Delgado Airport or arrange a pickup on arrival. You talk directly to the driver.',
        sectionEyebrow: 'Transfers', sectionTitle: 'Airport travel made simple.',
        sectionSub: 'Tell us the date, time, pickup and destination. Bookings are subject to confirmation.',
        cards: [
          { t: 'On-time departures', p: 'Pickup at your address or hotel at the agreed time, planned around your flight.', i: 'plane' },
          { t: 'Stress-free arrivals', p: 'Arrange your pickup on arrival and go straight to your destination.', i: 'pin' },
          { t: 'Hotel ↔ Airport', p: 'A direct option for guests and visitors, in both directions.', i: 'compass' }
        ],
        tip: { t: 'Very early or overnight flights?', p: 'Book ahead. The earlier you tell us, the easier it is to secure your ride on time.' },
        faq: [
          { q: 'How long does it take from the airport to central Lisbon?', a: 'In normal conditions, about 20 to 30 minutes, depending on traffic and your destination.' },
          { q: 'What should I send?', a: 'Date and time, pickup location or destination, number of passengers and bags and, for arrivals, your flight and expected time.' },
          { q: 'How is the fare calculated?', a: 'By the taximeter, under the official taxi tariff in force. The final fare is the amount shown at the end of the trip, except where the law provides otherwise.' },
          { q: 'Can I book for someone else?', a: 'Yes. Send us the traveller’s name and contact and the meeting point.' }
        ]
      },
      lisbon: {
        title: 'Taxi in Lisbon | Book Direct on WhatsApp — 691.pt',
        desc: 'Taxi in Lisbon for work, appointments, restaurants, hotels and the airport. Book on WhatsApp and arrange everything directly with the driver.',
        imgAlt: 'The 25 de Abril Bridge and Lisbon rooftops at sunset',
        eyebrow: 'Taxi in Lisbon',
        h1: 'Lisbon at your pace: work, dinner, appointments or sightseeing.',
        sub: 'Book your ride on WhatsApp and arrange everything directly with the driver, from pickup to destination.',
        sectionEyebrow: 'In the city', sectionTitle: 'A simple service for Lisbon.',
        sectionSub: 'For everyday trips or a special night out, at a time you choose.',
        cards: [
          { t: 'Everyday trips', p: 'Home, work, appointments and meetings, without waiting for a vehicle.', i: 'clock' },
          { t: 'Hotels and restaurants', p: 'Arrive on time and skip the parking worries.', i: 'pin' },
          { t: 'Pre-booking', p: 'Pick the date and time and have your ride arranged.', i: 'calendar' }
        ],
        tip: { t: 'Heading to the airport?', p: 'Book the drop-off or pickup in advance and leave the rest to us.' },
        faq: [
          { q: 'Can I book a ride for right now?', a: 'You can ask, but the booking is subject to confirmation and availability. For set times, the earlier the better.' },
          { q: 'How is the fare calculated?', a: 'By the taximeter, under the official taxi tariff in force. The final fare is the amount shown at the end of the trip, except where the law provides otherwise.' },
          { q: 'Do you speak English?', a: 'Yes. You can message us in English on WhatsApp.' }
        ]
      },
      portugal: {
        title: 'Taxi Trips from Lisbon across Portugal | Book Direct — 691.pt',
        desc: 'Taxi trips from Lisbon to Sintra, Fátima, Nazaré, Porto, Évora and other destinations. Book on WhatsApp and talk to the driver directly.',
        imgAlt: 'Pena Palace on top of the Sintra hills',
        eyebrow: 'Lisbon → Portugal',
        h1: 'From Lisbon to anywhere in Portugal.',
        sub: 'Pre-booked trips from Lisbon, on your schedule and at your pace. Choose a destination and send us your request.',
        sectionEyebrow: 'Destinations', sectionTitle: 'Where would you like to go?',
        sectionSub: 'Approximate distances and times from Lisbon, without traffic.',
        more: { t: 'Other destinations', p: 'We also travel to Cascais, Óbidos and other places in Portugal. Tell us where you want to go.' },
        tip: { t: 'Longer journeys', p: 'Contact us in advance to confirm availability and arrange times and stops.' },
        faq: [
          { q: 'Can we make stops on the way?', a: 'You can ask. We arrange the route and stops with you before the trip.' },
          { q: 'Do you do same-day return trips?', a: 'Yes, subject to confirmation. Tell us the destination, departure time and when you want to come back.' },
          { q: 'How is the fare calculated?', a: 'By the taximeter, under the official taxi tariff in force. The final fare is the amount shown at the end of the trip, except where the law provides otherwise.' }
        ]
      }
    },
    dest: {
      sintra: {
        name: 'Sintra', km: '≈ 30 km', time: '≈ 40 min', teaser: 'Pena Palace, hills and historic town',
        title: 'Taxi from Lisbon to Sintra | Book Direct — 691.pt',
        desc: 'Taxi from Lisbon to Sintra, Pena Palace and the historic centre. Book on WhatsApp and skip the queues and the parking problems.',
        imgAlt: 'The yellow and red Pena Palace on top of the Sintra hills',
        h1: 'Sintra without bus queues or parking problems.',
        sub: 'A direct ride from Lisbon to the hills, Pena Palace and the historic town, with the driver arranging everything with you.',
        sectionTitle: 'The best of Sintra',
        highlights: [
          { t: 'Pena Palace', p: 'The colourful palace on the hilltop, one of Portugal’s icons.' },
          { t: 'Historic centre', p: 'Narrow streets, the National Palace and the town’s pastry shops.' },
          { t: 'Quinta da Regaleira and Moorish Castle', p: 'Gardens, wells and walls among the forest and the mist.' }
        ],
        tip: { t: 'Our suggestion', p: 'The hills get heavy traffic and little parking in summer. Arriving by taxi saves time and stress.' },
        faq: [
          { q: 'How long is the drive from Lisbon to Sintra?', a: 'About 40 minutes in normal conditions, depending on traffic.' },
          { q: 'Can you wait while I visit the monuments?', a: 'We can arrange a trip with waiting time or several stops. Tell us your plan when you book.' },
          { q: 'Can you also take us to Cabo da Roca or Cascais?', a: 'Yes, they are nearby and can be part of the same trip. Tell us the itinerary you have in mind.' }
        ]
      },
      fatima: {
        name: 'Fátima', km: '≈ 130 km', time: '≈ 1 h 20', teaser: 'Sanctuary and pilgrimage',
        title: 'Taxi from Lisbon to Fátima | Book Direct — 691.pt',
        desc: 'Taxi from Lisbon to the Sanctuary of Fátima. Pre-booked trips, same-day return, direct booking on WhatsApp.',
        imgAlt: 'The Sanctuary of Fátima at sunset',
        h1: 'Fátima in comfort, with a same-day return.',
        sub: 'Direct transport from Lisbon to the Sanctuary for pilgrimages, visits and scheduled trips.',
        sectionTitle: 'In Fátima',
        highlights: [
          { t: 'Sanctuary of Our Lady of Fátima', p: 'The prayer grounds, the Basilica and the great esplanade.' },
          { t: 'Chapel of the Apparitions', p: 'The most symbolic place in the Sanctuary, at the heart of the grounds.' },
          { t: 'Valinhos and Way of the Cross', p: 'Paths of prayer and remembrance around the Sanctuary.' }
        ],
        tip: { t: 'Peak pilgrimage dates', p: 'Around 12 and 13 May and October there are many pilgrims. Book as far in advance as you can.' },
        faq: [
          { q: 'How long is the drive from Lisbon to Fátima?', a: 'About 1 h 20 in normal conditions, depending on traffic.' },
          { q: 'Do you do same-day returns?', a: 'Yes, subject to confirmation. Tell us the departure time and when you want to return.' },
          { q: 'Can you pick up several people at different addresses?', a: 'We can arrange multiple pickups. Send us the addresses and the number of passengers.' }
        ]
      },
      nazare: {
        name: 'Nazaré', km: '≈ 120 km', time: '≈ 1 h 20', teaser: 'Beach, giant waves and the Atlantic coast',
        title: 'Taxi from Lisbon to Nazaré | Book Direct — 691.pt',
        desc: 'Taxi from Lisbon to Nazaré: the Sítio, São Miguel Arcanjo Fort and Praia do Norte. Book on WhatsApp with the driver.',
        imgAlt: 'A giant wave next to the cliff and the lighthouse at Nazaré',
        h1: 'Nazaré: from the Sítio to the giant waves of Praia do Norte.',
        sub: 'A direct ride from Lisbon to the Atlantic coast, for a day of viewpoints, sea and fresh fish.',
        sectionTitle: 'In Nazaré',
        highlights: [
          { t: 'Nazaré Beach', p: 'The seafront, a wide beach and the typical fishing-town atmosphere.' },
          { t: 'Sítio da Nazaré', p: 'The viewpoint over the town and the ocean, reached by funicular.' },
          { t: 'Lighthouse and Praia do Norte', p: 'Beside São Miguel Arcanjo Fort, where the sea produces giant waves.' }
        ],
        tip: { t: 'When to see the giant waves', p: 'They mostly happen between autumn and winter, when there are big swells. Check the forecast before choosing your day.' },
        faq: [
          { q: 'How long is the drive from Lisbon to Nazaré?', a: 'About 1 h 20 in normal conditions, depending on traffic.' },
          { q: 'Can we combine Nazaré with Óbidos?', a: 'Yes, they are close and the trip can include stops. Tell us the itinerary you have in mind.' },
          { q: 'Do you do same-day returns?', a: 'Yes, subject to confirmation. Tell us the departure and return times.' }
        ]
      },
      porto: {
        name: 'Porto', km: '≈ 315 km', time: '≈ 3 h', teaser: 'Ribeira, the Douro and the historic centre',
        title: 'Taxi from Lisbon to Porto | Book Direct — 691.pt',
        desc: 'Taxi from Lisbon to Porto: a direct, comfortable trip, pre-booked on WhatsApp. Ribeira, the Douro and the historic centre.',
        imgAlt: 'Porto’s Ribeira and the Douro river at dusk',
        h1: 'Lisbon to Porto in one direct trip, on your schedule.',
        sub: 'A long trip should be a comfortable one. Arrange departure, stops and destination with the driver.',
        sectionTitle: 'In Porto',
        highlights: [
          { t: 'Ribeira', p: 'The historic riverfront, with terraces and views over the Douro.' },
          { t: 'Douro and bridges', p: 'The Dom Luís I Bridge, the Vila Nova de Gaia cellars and the river.' },
          { t: 'Historic centre', p: 'A World Heritage area, with São Bento Station and its tiles.' }
        ],
        tip: { t: 'Book early', p: 'As it is a long trip, contact us in advance to confirm availability and arrange stops.' },
        faq: [
          { q: 'How long is the drive from Lisbon to Porto?', a: 'About 3 hours in normal conditions, not counting stops or traffic.' },
          { q: 'Can we stop on the way?', a: 'Yes, we arrange stops with you before the trip.' },
          { q: 'Do you also do Porto to Lisbon?', a: 'Yes, subject to confirmation. Send us the date, time and pickup address.' }
        ]
      },
      evora: {
        name: 'Évora', km: '≈ 135 km', time: '≈ 1 h 30', teaser: 'History and Alentejo tradition',
        title: 'Taxi from Lisbon to Évora | Book Direct — 691.pt',
        desc: 'Taxi from Lisbon to Évora: historic centre, Roman Temple and the Alentejo. Pre-booked trips with direct booking on WhatsApp.',
        imgAlt: 'The Roman Temple of Évora in the late afternoon',
        h1: 'Évora, the capital of the Alentejo, a short drive from Lisbon.',
        sub: 'A direct, comfortable ride to the historic centre, for day trips or scheduled journeys.',
        sectionTitle: 'In Évora',
        highlights: [
          { t: 'Roman Temple', p: 'One of the city’s best-known monuments, next to the cathedral.' },
          { t: 'Historic centre', p: 'A UNESCO World Heritage site, with old streets and squares.' },
          { t: 'Cathedral and Chapel of Bones', p: 'Two memorable visits in the heart of the city.' }
        ],
        tip: { t: 'A full day in the Alentejo', p: 'Évora pairs well with stops at wineries and Alentejo villages. Tell us what you have in mind.' },
        faq: [
          { q: 'How long is the drive from Lisbon to Évora?', a: 'About 1 h 30 in normal conditions, depending on traffic.' },
          { q: 'Can you wait during my visit?', a: 'We can arrange a trip with waiting time. Tell us your plan when you book.' },
          { q: 'Do you do same-day returns?', a: 'Yes, subject to confirmation. Tell us the departure and return times.' }
        ]
      }
    },
    notFound: {
      title: 'Page not found — 691.pt', h1: 'This page does not exist.', p: 'The address may be wrong or the page may have moved. Go back home or book directly on WhatsApp.'
    },
    offline: {
      title: 'Offline — 691.pt', h1: 'No internet connection.', p: 'It looks like you are offline. Check your connection and try again, or call us directly.', retry: 'Try again', contact: 'Bookings'
    }
  }
}

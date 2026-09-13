(()=>{
  'use strict'
  const slug=(document.body.dataset.destination||'').toLowerCase()
  const requested=(new URLSearchParams(location.search).get('lang')||'').toLowerCase()
  const browser=(navigator.language||'pt').toLowerCase()
  const lang=requested==='en'?'en':(requested==='pt'?'pt':(browser.startsWith('en')?'en':'pt'))
  const common={
    pt:{wa:'WhatsApp',legal:'Informação Legal',privacy:'Privacidade',complaints:'Livro de Reclamações',ctaTitle:'Pronto para reservar?',ctaSub:'Reserve online ou escreva diretamente no WhatsApp.'},
    en:{wa:'WhatsApp',legal:'Legal Information',privacy:'Privacy',complaints:'Complaints Book',ctaTitle:'Ready to book?',ctaSub:'Book online or message us directly on WhatsApp.'}
  }
  const pages={
    sintra:{
      pt:{title:'Lisboa → Sintra',eye:'LISBOA → SINTRA',sub:'Reserva direta de táxi para Sintra, Palácio da Pena, centro histórico e serra.',h2:'Sintra, diretamente a partir de Lisboa',p:'Uma opção confortável para turismo, hotéis e deslocações marcadas com antecedência.',c1:'Palácio da Pena',c1p:'Um dos principais ícones de Sintra.',c2:'Centro histórico',c2p:'Ruas, palácios e pontos de interesse da vila.',c3:'Reserva direta',c3p:'Defina recolha, horário e destino antes da viagem.',book:'Reservar viagem para Sintra'},
      en:{title:'Lisbon → Sintra',eye:'LISBON → SINTRA',sub:'Direct-booked taxi travel to Sintra, Pena Palace, the historic centre and the hills.',h2:'Sintra, directly from Lisbon',p:'A comfortable option for tourism, hotels and pre-arranged journeys.',c1:'Pena Palace',c1p:'One of Sintra’s best-known landmarks.',c2:'Historic centre',c2p:'Streets, palaces and points of interest around the town.',c3:'Direct booking',c3p:'Set pickup, time and destination before the trip.',book:'Book trip to Sintra'}
    },
    fatima:{
      pt:{title:'Lisboa → Fátima',eye:'LISBOA → FÁTIMA',sub:'Reserva direta de táxi para Fátima e o Santuário, com partida de Lisboa.',h2:'Fátima com viagem marcada',p:'Transporte direto para peregrinação, visitas e deslocações programadas.',c1:'Santuário de Fátima',c1p:'Chegada direta à principal zona do santuário.',c2:'Viagem planeada',c2p:'Data, hora e recolha combinadas antecipadamente.',c3:'Serviço direto',c3p:'Contacto e reserva diretamente com o motorista.',book:'Reservar viagem para Fátima'},
      en:{title:'Lisbon → Fátima',eye:'LISBON → FÁTIMA',sub:'Direct-booked taxi travel from Lisbon to Fátima and the Sanctuary.',h2:'Fátima with a pre-booked journey',p:'Direct transport for pilgrimage, visits and scheduled trips.',c1:'Fátima Sanctuary',c1p:'Direct arrival at the main sanctuary area.',c2:'Planned journey',c2p:'Date, time and pickup arranged in advance.',c3:'Direct service',c3p:'Contact and booking directly with the driver.',book:'Book trip to Fátima'}
    },
    nazare:{
      pt:{title:'Lisboa → Nazaré',eye:'LISBOA → NAZARÉ',sub:'Reserva direta de táxi para Nazaré, praia atlântica, miradouros e ondas gigantes.',h2:'Mar, falésias e ondas gigantes',p:'Ideal para viagens marcadas, turismo de costa e dias dedicados à Nazaré.',c1:'Praia da Nazaré',c1p:'Marginal, areia e ambiente costeiro.',c2:'Sítio da Nazaré',c2p:'Miradouros, forte e vista panorâmica.',c3:'Praia do Norte',c3p:'Acesso confortável a uma das zonas mais conhecidas pelas ondas gigantes.',book:'Reservar viagem para Nazaré'},
      en:{title:'Lisbon → Nazaré',eye:'LISBON → NAZARÉ',sub:'Direct-booked taxi travel to Nazaré, Atlantic beaches, viewpoints and giant waves.',h2:'Sea, cliffs and giant waves',p:'Ideal for scheduled rides, coastal tourism and day trips to Nazaré.',c1:'Nazaré Beach',c1p:'Seafront, sand and seaside atmosphere.',c2:'Sítio da Nazaré',c2p:'Viewpoints, fort and panoramic views.',c3:'Praia do Norte',c3p:'Comfortable access to one of the world’s best-known giant-wave locations.',book:'Book trip to Nazaré'}
    },
    porto:{
      pt:{title:'Lisboa → Porto',eye:'LISBOA → PORTO',sub:'Reserva direta de táxi para o Porto, Ribeira, Douro e centro histórico.',h2:'Uma grande viagem, um grande destino',p:'Para deslocações planeadas, hotéis, negócios ou turismo com serviço direto a partir de Lisboa.',c1:'Ribeira',c1p:'Frente ribeirinha, história e restauração.',c2:'Douro',c2p:'Pontes icónicas e vistas sobre o rio.',c3:'Centro histórico',c3p:'Chegue ao Porto com serviço direto e confortável.',book:'Reservar viagem para Porto'},
      en:{title:'Lisbon → Porto',eye:'LISBON → PORTO',sub:'Direct-booked taxi travel to Porto, Ribeira, the Douro and the historic centre.',h2:'A major trip, a major destination',p:'For planned journeys, hotels, business or tourism with direct service from Lisbon.',c1:'Ribeira',c1p:'Historic waterfront, restaurants and local atmosphere.',c2:'Douro',c2p:'Iconic bridges and river views.',c3:'Historic centre',c3p:'Arrive in Porto with direct, comfortable service.',book:'Book trip to Porto'}
    },
    evora:{
      pt:{title:'Lisboa → Évora',eye:'LISBOA → ÉVORA',sub:'Reserva direta para Évora, património alentejano, história e tradição.',h2:'História em cada pedra',p:'Uma opção confortável para turismo, hotéis e deslocações marcadas no Alentejo.',c1:'Templo romano',c1p:'Um dos monumentos mais reconhecidos da cidade.',c2:'Centro histórico',c2p:'Património, ruas antigas e cultura alentejana.',c3:'Serviço direto',c3p:'Defina a viagem e siga com conforto a partir de Lisboa.',book:'Reservar viagem para Évora'},
      en:{title:'Lisbon → Évora',eye:'LISBON → ÉVORA',sub:'Direct-booked travel to Évora, Alentejo heritage, history and tradition.',h2:'History in every stone',p:'A comfortable option for tourism, hotels and scheduled journeys in Alentejo.',c1:'Roman temple',c1p:'One of the city’s most recognisable landmarks.',c2:'Historic centre',c2p:'Heritage, old streets and Alentejo culture.',c3:'Direct service',c3p:'Set the journey and travel comfortably from Lisbon.',book:'Book trip to Évora'}
    }
  }
  const page=pages[slug]
  if(!page) return
  const values={...common[lang],...page[lang]}
  document.documentElement.lang=lang==='pt'?'pt-PT':'en'
  document.querySelectorAll('[data-lp]').forEach(el=>{
    const value=values[el.dataset.lp]
    if(value!==undefined) el.textContent=value
  })
  const title=document.querySelector('title')
  const desc=document.querySelector('meta[name="description"]')
  const ogTitle=document.querySelector('meta[property="og:title"]')
  const ogDesc=document.querySelector('meta[property="og:description"]')
  if(lang==='en'){
    if(title) title.textContent=`${values.title} | Direct Taxi Booking — 691.pt`
    if(desc) desc.content=values.sub
    if(ogTitle) ogTitle.content=`${values.title} | 691.pt`
    if(ogDesc) ogDesc.content=values.sub
  }
  const waMessage=lang==='pt'?`Olá, gostaria de reservar uma viagem para ${values.title.split('→').pop().trim()}.`:`Hello, I would like to book a trip to ${values.title.split('→').pop().trim()}.`
  document.querySelectorAll('.wa-link').forEach(a=>a.href='https://wa.me/351928158158?text='+encodeURIComponent(waMessage))
  document.querySelectorAll('a[data-lp="legal"]').forEach(a=>a.href='/legal.html?lang='+lang)
  document.querySelectorAll('a[data-lp="privacy"]').forEach(a=>a.href='/legal.html?lang='+lang+'#privacidade')
  document.querySelectorAll('a[data-lp="complaints"]').forEach(a=>a.href='https://www.livroreclamacoes.pt/Inicio/?lang='+(lang==='pt'?'PT':'EN'))
})()

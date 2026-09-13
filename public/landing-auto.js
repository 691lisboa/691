(()=>{
  'use strict'
  const params=new URLSearchParams(location.search)
  const requested=(params.get('lang')||'').toLowerCase()
  const browser=(navigator.language||'pt').toLowerCase()
  const lang=requested==='en'?'en':(requested==='pt'?'pt':(browser.startsWith('en')?'en':'pt'))
  const page=document.body.dataset.page||'lisbon'
  const msgMap={pt:'Olá, gostaria de reservar um táxi.',en:'Hello, I would like to book a taxi.'}
  const base={
    pt:{book:'Reservar táxi',wa:'WhatsApp',legal:'Informação Legal',privacy:'Privacidade',complaints:'Livro de Reclamações',ctaTitle:'Pronto para reservar?',ctaSub:'Reserve online ou escreva diretamente no WhatsApp.'},
    en:{book:'Book taxi',wa:'WhatsApp',legal:'Legal Information',privacy:'Privacy',complaints:'Complaints Book',ctaTitle:'Ready to book?',ctaSub:'Book online or message us directly on WhatsApp.'}
  }
  const pages={
    lisbon:{
      pt:{eye:'TÁXI EM LISBOA',title:'Lisboa, diretamente com o seu motorista.',sub:'Reservas diretas para deslocações locais, hotéis, restaurantes, consultas, trabalho e aeroporto.',h2:'Um serviço simples para Lisboa',p:'Reserve recolha e destino e trate diretamente com o motorista.',c1:'Deslocações locais',c1p:'Casa, trabalho, consultas, restaurantes, hotéis e muito mais.',c2:'Aeroporto',c2p:'Reserve a sua viagem para ou do Aeroporto de Lisboa.',c3:'Reserva antecipada',c3p:'Escolha data, hora, recolha e destino.'},
      en:{eye:'TAXI IN LISBON',title:'Lisbon, directly with your driver.',sub:'Direct bookings for local rides, hotels, restaurants, appointments, work and airport journeys.',h2:'A simple service for Lisbon',p:'Book your pickup and destination and deal directly with the driver.',c1:'Local rides',c1p:'Home, work, appointments, restaurants, hotels and more.',c2:'Airport',c2p:'Book your ride to or from Lisbon Airport.',c3:'Pre-booking',c3p:'Choose date, time, pickup and destination.'}
    },
    airport:{
      pt:{eye:'AEROPORTO DE LISBOA',title:'A sua viagem para o aeroporto começa aqui.',sub:'Reserve com antecedência o táxi para o Aeroporto de Lisboa ou organize uma recolha do aeroporto.',h2:'Aeroporto sem complicações',p:'Indique data, hora, origem e destino. A reserva fica sujeita a confirmação.',c1:'Casa → Aeroporto',c1p:'Recolha programada para a sua partida.',c2:'Hotel → Aeroporto',c2p:'Opção direta para hóspedes e visitantes.',c3:'Aeroporto → Destino',c3p:'Combine a recolha e o destino diretamente.'},
      en:{eye:'LISBON AIRPORT',title:'Your airport journey starts here.',sub:'Pre-book your taxi to Lisbon Airport or arrange a pickup from the airport.',h2:'Airport travel made simple',p:'Enter date, time, pickup and destination. Booking is subject to confirmation.',c1:'Home → Airport',c1p:'A scheduled pickup for your departure.',c2:'Hotel → Airport',c2p:'A direct option for guests and visitors.',c3:'Airport → Destination',c3p:'Arrange pickup and destination directly.'}
    },
    portugal:{
      pt:{eye:'LISBOA → PORTUGAL',title:'De Lisboa para Portugal.',sub:'Táxi com reserva direta para Lisboa, Sintra, Cascais, Fátima, Nazaré, Porto, Évora e outros destinos em Portugal.',h2:'Viagens para além de Lisboa',p:'Para viagens mais longas, contacte-nos com antecedência para confirmar disponibilidade.',c1:'Sintra e Cascais',c1p:'Serra, palácios, costa e destinos próximos.',c2:'Fátima e Óbidos',c2p:'Viagens marcadas para alguns dos destinos mais procurados.',c3:'Porto, Nazaré e mais',c3p:'Diga-nos onde e quando pretende ir.'},
      en:{eye:'LISBON → PORTUGAL',title:'From Lisbon to Portugal.',sub:'Direct-booked taxi transport to Lisbon, Sintra, Cascais, Fátima, Nazaré, Porto, Évora and other destinations in Portugal.',h2:'Trips beyond Lisbon',p:'For longer journeys, contact us in advance to confirm availability.',c1:'Sintra and Cascais',c1p:'Hills, palaces, coast and nearby destinations.',c2:'Fátima and Óbidos',c2p:'Pre-booked journeys to some of the most popular destinations.',c3:'Porto, Nazaré and more',c3p:'Tell us where and when you want to go.'}
    }
  }
  const values={...base[lang],...(pages[page]?.[lang]||pages.lisbon[lang])}
  document.documentElement.lang=lang==='pt'?'pt-PT':'en'
  document.querySelectorAll('[data-lp]').forEach(el=>{const v=values[el.dataset.lp];if(v!==undefined)el.textContent=v})
  document.querySelectorAll('.wa-link').forEach(a=>a.href='https://wa.me/351928158158?text='+encodeURIComponent(msgMap[lang]))
  document.querySelectorAll('a[data-lp="legal"]').forEach(a=>a.href='/legal.html?lang='+lang)
  document.querySelectorAll('a[data-lp="privacy"]').forEach(a=>a.href='/legal.html?lang='+lang+'#privacidade')
  document.querySelectorAll('a[data-lp="complaints"]').forEach(a=>a.href='https://www.livroreclamacoes.pt/Inicio/?lang='+(lang==='pt'?'PT':'EN'))
})()

(()=>{
 const params=new URLSearchParams(location.search);
 const rawLang=(params.get('lang')||document.documentElement.lang||'pt').toLowerCase();
 const lang=(rawLang==='en'||rawLang.startsWith('en'))?'en':'pt';
 const page=document.body.dataset.page||'lisbon';
 const slug=(params.get('destino')||params.get('destination')||'').toLowerCase().trim();
 const msgMap={pt:'Olá, gostaria de reservar um táxi.',en:'Hello, I would like to book a taxi.'};
 const base={
  pt:{back:'Início',book:'Reservar táxi',wa:'WhatsApp',legal:'Informação Legal',privacy:'Privacidade',complaints:'Livro de Reclamações',ctaTitle:'Pronto para reservar?',ctaSub:'Reserve online ou escreva diretamente no WhatsApp.'},
  en:{back:'Home',book:'Book taxi',wa:'WhatsApp',legal:'Legal Information',privacy:'Privacy',complaints:'Complaints Book',ctaTitle:'Ready to book?',ctaSub:'Book online or message us directly on WhatsApp.'},
  es:{back:'Inicio',book:'Reservar taxi',wa:'WhatsApp',legal:'Información Legal',privacy:'Privacidad',complaints:'Libro de Reclamaciones',ctaTitle:'¿Listo para reservar?',ctaSub:'Reserve online o escríbanos directamente por WhatsApp.'}
 };
 const pages={
  lisbon:{
   hero:'/assets/destinations/lisboa.webp',
   pt:{eye:'TÁXI EM LISBOA',title:'Lisboa, diretamente com o seu motorista.',sub:'Reservas diretas para deslocações locais, hotéis, restaurantes, consultas, trabalho e aeroporto.',h2:'Um serviço simples para Lisboa',p:'Reserve recolha e destino e trate diretamente com o motorista.',c1:'Deslocações locais',c1p:'Casa, trabalho, consultas, restaurantes, hotéis e muito mais.',c2:'Aeroporto',c2p:'Reserve a sua viagem para ou do Aeroporto de Lisboa.',c3:'Reserva antecipada',c3p:'Escolha data, hora, recolha e destino.'},
   en:{eye:'TAXI IN LISBON',title:'Lisbon, directly with your driver.',sub:'Direct bookings for local rides, hotels, restaurants, appointments, work and airport journeys.',h2:'A simple service for Lisbon',p:'Book your pickup and destination and deal directly with the driver.',c1:'Local rides',c1p:'Home, work, appointments, restaurants, hotels and more.',c2:'Airport',c2p:'Book your ride to or from Lisbon Airport.',c3:'Pre-booking',c3p:'Choose date, time, pickup and destination.'},
   es:{eye:'TAXI EN LISBOA',title:'Lisboa, directamente con su conductor.',sub:'Reservas directas para trayectos locales, hoteles, restaurantes, citas, trabajo y aeropuerto.',h2:'Un servicio sencillo para Lisboa',p:'Reserve la recogida y trate directamente con el conductor.',c1:'Trayectos locales',c1p:'Casa, trabajo, citas, restaurantes, hoteles y más.',c2:'Aeropuerto',c2p:'Reserve su viaje al o desde el aeropuerto de Lisboa.',c3:'Reserva anticipada',c3p:'Elija fecha, hora, recogida y destino.'}
  },
  airport:{
   hero:'/assets/taxi-691.webp',
   pt:{eye:'AEROPORTO DE LISBOA',title:'A sua viagem para o aeroporto começa aqui.',sub:'Reserve com antecedência o táxi para o Aeroporto de Lisboa ou organize uma recolha do aeroporto.',h2:'Aeroporto sem complicações',p:'Indique data, hora, origem e destino. A reserva fica sujeita a confirmação.',c1:'Casa → Aeroporto',c1p:'Recolha programada para a sua partida.',c2:'Hotel → Aeroporto',c2p:'Opção direta para hóspedes e visitantes.',c3:'Aeroporto → Destino',c3p:'Combine a recolha e o destino diretamente.'},
   en:{eye:'LISBON AIRPORT',title:'Your airport journey starts here.',sub:'Pre-book your taxi to Lisbon Airport or arrange a pickup from the airport.',h2:'Airport travel made simple',p:'Enter date, time, pickup and destination. Booking is subject to confirmation.',c1:'Home → Airport',c1p:'A scheduled pickup for your departure.',c2:'Hotel → Airport',c2p:'A direct option for guests and visitors.',c3:'Airport → Destination',c3p:'Arrange pickup and destination directly.'},
   es:{eye:'AEROPUERTO DE LISBOA',title:'Su viaje al aeropuerto empieza aquí.',sub:'Reserve con antelación su taxi al aeropuerto o una recogida.',h2:'Aeropuerto sin complicaciones',p:'Indique fecha, hora, origen y destino. Reserva sujeta a confirmación.',c1:'Casa → Aeropuerto',c1p:'Recogida programada para su salida.',c2:'Hotel → Aeropuerto',c2p:'Opción directa para huéspedes y visitantes.',c3:'Aeropuerto → Destino',c3p:'Combine directamente recogida y destino.'}
  },
  portugal:{
   hero:'/assets/destinations/sintra.webp',
   pt:{eye:'LISBOA → PORTUGAL',title:'De Lisboa para Portugal.',sub:'Táxi com reserva direta para Lisboa, Sintra, Cascais, Fátima, Nazaré, Porto, Évora e outros destinos em Portugal.',h2:'Viagens para além de Lisboa',p:'Para viagens mais longas, contacte-nos com antecedência para confirmar disponibilidade.',c1:'Sintra & Cascais',c1p:'Palácio da Pena, costa e destinos próximos.',c2:'Fátima & Óbidos',c2p:'Transporte reservado para dois destinos muito procurados.',c3:'Porto, Nazaré e mais',c3p:'Diga-nos onde e quando pretende ir.'},
   en:{eye:'LISBON → PORTUGAL',title:'From Lisbon to Portugal.',sub:'Direct-booked taxi transport to Lisbon, Sintra, Cascais, Fátima, Nazaré, Porto, Évora and other destinations in Portugal.',h2:'Trips beyond Lisbon',p:'For longer journeys, contact us in advance to confirm availability.',c1:'Sintra & Cascais',c1p:'Pena Palace, the coast and nearby destinations.',c2:'Fátima & Óbidos',c2p:'Pre-booked transport to two popular destinations.',c3:'Porto, Nazaré and more',c3p:'Tell us where and when you want to go.'},
   es:{eye:'LISBOA → PORTUGAL',title:'De Lisboa a Portugal.',sub:'Taxi con reserva directa para Lisboa, Sintra, Cascais, Fátima, Nazaré, Porto, Évora y otros destinos de Portugal.',h2:'Viajes más allá de Lisboa',p:'Para trayectos largos, contáctenos con antelación para confirmar disponibilidad.',c1:'Sintra & Cascais',c1p:'Palacio da Pena, costa y región.',c2:'Fátima & Óbidos',c2p:'Transporte reservado a dos destinos muy solicitados.',c3:'Porto, Nazaré y más',c3p:'Díganos dónde y cuándo quiere ir.'}
  }
 };
 const destinations={
  'sintra-cascais':{hero:'/assets/destinations/sintra.webp',titleQ:'Sintra & Cascais | 691.pt',
   pt:{eye:'LISBOA → SINTRA & CASCAIS',title:'Lisboa → Sintra & Cascais',sub:'Reserva direta de táxi para Sintra, Palácio da Pena, Cascais e costa atlântica.',h2:'Um destino, dois ícones',p:'Ideal para passeios marcados, hotéis, turismo e deslocações com hora combinada.',c1:'Sintra',c1p:'Palácio da Pena, centro histórico e serra.',c2:'Cascais',c2p:'Marina, praias e costa atlântica.',c3:'Reserva direta',c3p:'Defina recolha, horário e percurso.'},
   en:{eye:'LISBON → SINTRA & CASCAIS',title:'Lisbon → Sintra & Cascais',sub:'Direct-booked taxi travel to Sintra, Pena Palace, Cascais and the Atlantic coast.',h2:'One route, two highlights',p:'Ideal for planned trips, hotels, tourism and timed journeys.',c1:'Sintra',c1p:'Pena Palace, old town and hills.',c2:'Cascais',c2p:'Marina, beaches and Atlantic coastline.',c3:'Direct booking',c3p:'Choose pickup, schedule and route.'},
   es:{eye:'LISBOA → SINTRA & CASCAIS',title:'Lisboa → Sintra & Cascais',sub:'Taxi con reserva directa para Sintra, Palacio da Pena, Cascais y la costa atlántica.',h2:'Un trayecto, dos iconos',p:'Ideal para paseos programados, hoteles, turismo y traslados con hora marcada.',c1:'Sintra',c1p:'Palacio da Pena, centro histórico y sierra.',c2:'Cascais',c2p:'Marina, playas y costa atlántica.',c3:'Reserva directa',c3p:'Defina recogida, horario y recorrido.'}},
  'fatima-obidos':{hero:'/assets/destinations/fatima.webp',titleQ:'Fátima & Óbidos | 691.pt',
   pt:{eye:'LISBOA → FÁTIMA & ÓBIDOS',title:'Lisboa → Fátima & Óbidos',sub:'Reserva direta para o santuário de Fátima e a vila medieval de Óbidos.',h2:'Património e serenidade',p:'Uma solução confortável para peregrinação, turismo e viagens marcadas.',c1:'Fátima',c1p:'Santuário, devoção e recolhimento.',c2:'Óbidos',c2p:'Vila muralhada, história e charme.',c3:'Viagem reservada',c3p:'Tudo combinado antes da partida.'},
   en:{eye:'LISBON → FÁTIMA & ÓBIDOS',title:'Lisbon → Fátima & Óbidos',sub:'Direct-booked travel to the Fátima sanctuary and the medieval town of Óbidos.',h2:'Heritage and calm',p:'A comfortable solution for pilgrimage, tourism and pre-booked rides.',c1:'Fátima',c1p:'Sanctuary, devotion and reflection.',c2:'Óbidos',c2p:'Walled town, history and charm.',c3:'Pre-booked trip',c3p:'Everything arranged before departure.'},
   es:{eye:'LISBOA → FÁTIMA & ÓBIDOS',title:'Lisboa → Fátima & Óbidos',sub:'Taxi con reserva directa al santuario de Fátima y la villa medieval de Óbidos.',h2:'Patrimonio y serenidad',p:'Una solución cómoda para peregrinación, turismo y viajes programados.',c1:'Fátima',c1p:'Santuario, devoción y recogimiento.',c2:'Óbidos',c2p:'Villa amurallada, historia y encanto.',c3:'Viaje reservado',c3p:'Todo definido antes de salir.'}},
  'nazare':{hero:'/assets/destinations/nazare.webp',titleQ:'Nazaré | 691.pt',
   pt:{eye:'LISBOA → NAZARÉ',title:'Lisboa → Nazaré',sub:'Reserva direta de táxi para Nazaré, praia atlântica, miradouros e ondas gigantes.',h2:'Mar, falésias e ondas gigantes',p:'Ideal para viagens marcadas, turismo de costa e dias dedicados à Nazaré.',c1:'Praia da Nazaré',c1p:'Marginal, areia e ambiente costeiro.',c2:'Sítio',c2p:'Miradouros, forte e vista panorâmica.',c3:'Ondas gigantes',c3p:'Chegue com conforto aos melhores pontos de observação.'},
   en:{eye:'LISBON → NAZARÉ',title:'Lisbon → Nazaré',sub:'Direct-booked taxi travel to Nazaré, Atlantic beach viewpoints and giant waves.',h2:'Sea, cliffs and giant waves',p:'Ideal for scheduled rides, coastal tourism and day trips to Nazaré.',c1:'Nazaré Beach',c1p:'Seafront, sand and seaside atmosphere.',c2:'Sítio',c2p:'Viewpoints, fort and panoramic views.',c3:'Giant waves',c3p:'Arrive comfortably at the best viewing spots.'},
   es:{eye:'LISBOA → NAZARÉ',title:'Lisboa → Nazaré',sub:'Taxi con reserva directa a Nazaré, playa atlántica, miradores y olas gigantes.',h2:'Mar, acantilados y olas gigantes',p:'Ideal para viajes programados, turismo costero y excursiones a Nazaré.',c1:'Playa de Nazaré',c1p:'Paseo marítimo, arena y ambiente costero.',c2:'Sítio',c2p:'Miradores, fuerte y vistas panorámicas.',c3:'Olas gigantes',c3p:'Llegue cómodamente a los mejores puntos de observación.'}},
  'porto':{hero:'/assets/destinations/porto.webp',titleQ:'Porto | 691.pt',
   pt:{eye:'LISBOA → PORTO',title:'Lisboa → Porto',sub:'Reserva direta de táxi para o Porto, Ribeira, Douro e centro histórico.',h2:'Uma grande viagem, um grande destino',p:'Perfeito para deslocações planeadas, hotéis, negócios ou turismo com serviço direto.',c1:'Ribeira',c1p:'Frente ribeirinha, história e restaurantes.',c2:'Douro',c2p:'Pontes icónicas, vistas panorâmicas e margem do rio.',c3:'Centro histórico',c3p:'Chegue ao Porto com serviço direto e confortável.'},
   en:{eye:'LISBON → PORTO',title:'Lisbon → Porto',sub:'Direct-booked taxi travel to Porto, Ribeira, the Douro and the historic centre.',h2:'A major trip, a major destination',p:'Perfect for planned rides, hotels, business or tourism with direct service.',c1:'Ribeira',c1p:'Historic waterfront, restaurants and local atmosphere.',c2:'Douro',c2p:'Iconic bridges, panoramic views and riverfront scenery.',c3:'Historic centre',c3p:'Arrive in Porto with direct, comfortable service.'},
   es:{eye:'LISBOA → PORTO',title:'Lisboa → Porto',sub:'Taxi con reserva directa a Porto, Ribeira, Douro y centro histórico.',h2:'Un gran viaje, un gran destino',p:'Perfecto para traslados planificados, hoteles, negocios o turismo con servicio directo.',c1:'Ribeira',c1p:'Frente fluvial histórica, restaurantes y ambiente local.',c2:'Douro',c2p:'Puentes icónicos, vistas panorámicas y orillas del río.',c3:'Centro histórico',c3p:'Llegue a Porto con servicio directo y cómodo.'}},
  'evora':{hero:'/assets/destinations/evora.webp',titleQ:'Évora | 691.pt',
   pt:{eye:'LISBOA → ÉVORA',title:'Lisboa → Évora',sub:'Reserva direta para Évora, património alentejano, história e tradição.',h2:'História em cada pedra',p:'Uma opção confortável para turismo, hotéis e deslocações marcadas no Alentejo.',c1:'Templo romano',c1p:'Monumento icónico e centro histórico.',c2:'Alentejo',c2p:'Tradição, gastronomia e ritmo tranquilo.',c3:'Serviço direto',c3p:'Defina a viagem e siga com conforto.'},
   en:{eye:'LISBON → ÉVORA',title:'Lisbon → Évora',sub:'Direct-booked travel to Évora, Alentejo heritage, history and tradition.',h2:'History in every stone',p:'A comfortable option for tourism, hotels and scheduled rides in Alentejo.',c1:'Roman temple',c1p:'Iconic monument and historic centre.',c2:'Alentejo',c2p:'Tradition, gastronomy and a slower pace.',c3:'Direct service',c3p:'Set the journey and travel in comfort.'},
   es:{eye:'LISBOA → ÉVORA',title:'Lisboa → Évora',sub:'Taxi con reserva directa a Évora, patrimonio del Alentejo, historia y tradición.',h2:'Historia en cada piedra',p:'Una opción cómoda para turismo, hoteles y viajes programados en Alentejo.',c1:'Templo romano',c1p:'Monumento icónico y centro histórico.',c2:'Alentejo',c2p:'Tradición, gastronomía y un ritmo tranquilo.',c3:'Servicio directo',c3p:'Defina el viaje y avance con comodidad.'}}
 };
 const baseT=base[lang]||base.en;
 const pageT={...(pages[page]?.[lang]||pages[page]?.en||pages.lisbon.en)};
 const specific=(page==='portugal' && destinations[slug])? (destinations[slug][lang]||destinations[slug].en):null;
 const values={...baseT,...pageT,...(specific||{})};
 document.documentElement.lang=lang;
 document.querySelectorAll('[data-lp]').forEach(el=>{const key=el.dataset.lp; if(values[key]!=null) el.textContent=values[key]});
 const hero=document.getElementById('destination-hero')||document.querySelector('.lp-hero');
 if(hero){ hero.style.backgroundImage=`url('${(specific&&specific.hero)||pages[page]?.hero||pages.lisbon.hero}')`; }
 document.querySelectorAll('.wa-link').forEach(a=>a.href='https://wa.me/351928158158?text='+encodeURIComponent(msgMap[lang]||msgMap.en));
 document.querySelectorAll('a[data-lp="legal"]').forEach(a=>a.href='/legal.html?lang='+encodeURIComponent(lang));
 document.querySelectorAll('a[data-lp="privacy"]').forEach(a=>a.href='/legal.html?lang='+encodeURIComponent(lang)+'#privacidade');
 document.querySelectorAll('a[data-lp="complaints"]').forEach(a=>a.href='https://www.livroreclamacoes.pt/Inicio/?lang='+(lang==='pt'?'PT':'EN'));
 if(page==='portugal' && specific){
   const titleTag=document.querySelector('title');
   const desc=document.querySelector('meta[name="description"]');
   const ogTitle=document.querySelector('meta[property="og:title"]');
   const ogDesc=document.querySelector('meta[property="og:description"]');
   const canonical=document.querySelector('link[rel="canonical"]');
   const heroTitle=document.querySelector('h1[data-lp="title"]');
   const sub=document.querySelector('p[data-lp="sub"]');
   if(titleTag) titleTag.textContent=specific.titleQ;
   if(desc) desc.setAttribute('content', values.sub);
   if(ogTitle) ogTitle.setAttribute('content', specific.titleQ);
   if(ogDesc) ogDesc.setAttribute('content', values.sub);
   if(canonical) canonical.href='https://691.pt/viagens-portugal/?destino='+encodeURIComponent(slug);
   if(heroTitle) heroTitle.textContent=values.title;
   if(sub) sub.textContent=values.sub;
   document.querySelectorAll('a[href^="/?src=viagens-portugal"]').forEach(a=>{
      a.href='/?src='+encodeURIComponent(slug)+'&destino='+encodeURIComponent(slug)+'#reservar';
   });
 }
})();

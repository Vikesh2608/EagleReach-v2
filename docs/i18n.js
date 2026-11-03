'use strict';

// ---------------------------------------------------------------------------
// EagleReach translations (English / Spanish)
// The HTML is written in English. When Spanish is selected, this script swaps
// page text using the ES dictionary below, and app.js calls t() for messages
// it creates while the page is running. The choice is remembered in the
// browser and can also be set with ?lang=es in the link.
// ---------------------------------------------------------------------------

const SUPPORTED_LANGS = ['en', 'es'];

const LANG = (() => {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (SUPPORTED_LANGS.includes(fromUrl)) {
    try { localStorage.setItem('er-lang', fromUrl); } catch {}
    return fromUrl;
  }
  try {
    const saved = localStorage.getItem('er-lang');
    if (SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {}
  return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
})();

const LOCALE = LANG === 'es' ? 'es-US' : 'en-US';

const ES = {
  // --- Header, navigation and footer (all pages)
  'Your Community, Connected.': 'Su comunidad, conectada.',
  'Main navigation': 'Navegación principal',
  'Home': 'Inicio',
  'Services': 'Servicios',
  'News': 'Noticias',
  'About': 'Acerca de',
  'Founder & Team': 'Fundador y equipo',
  'Contact': 'Contacto',
  '⌖ Use My Location': '⌖ Usar mi ubicación',
  '⌕ Search your ZIP': '⌕ Buscar su código postal',
  'Voting': 'Votación',
  'Privacy': 'Privacidad',
  'Public Resources': 'Recursos públicos',

  // --- Home: hero
  'CIVIC INFORMATION · COMMUNITY RESOURCES · LOCAL NEWS': 'INFORMACIÓN CÍVICA · RECURSOS COMUNITARIOS · NOTICIAS LOCALES',
  'Discover civic information, healthcare, local assistance, weather updates and news — all in one place.':
    'Encuentre información cívica, atención médica, asistencia local, el pronóstico del tiempo y noticias, todo en un solo lugar.',
  'Enter ZIP code': 'Ingrese su código postal',
  'Enter a 5-digit ZIP code (e.g., 45202)': 'Código postal (p. ej., 45202)',
  '⌕ Search': '⌕ Buscar',
  '⌖ Use my current location': '⌖ Usar mi ubicación actual',
  'Weather near you': 'El tiempo cerca de usted',
  'Search a ZIP to see the forecast': 'Busque un código postal para ver el pronóstico',

  '👋 Start here: type your ZIP code, or let your phone find it for you.': '👋 Empiece aquí: escriba su código postal o deje que su teléfono lo encuentre.',
  'or': 'o',
  '📍 Use my location': '📍 Usar mi ubicación',
  'Your phone will ask permission first. EagleReach never saves your location.':
    'Su teléfono le pedirá permiso primero. EagleReach nunca guarda su ubicación.',
  'Find your representatives, weather & local news': 'Encuentre a sus representantes, el clima y noticias locales',
  'or type a ZIP': 'o escriba un código postal',
  'Finding you…': 'Buscando su ubicación…',
  'Location permission was turned off. Type your ZIP code instead, or allow location in your browser settings.':
    'El permiso de ubicación está desactivado. Escriba su código postal o permita la ubicación en la configuración del navegador.',

  // --- Home: services
  'Explore Community Services': 'Explore los servicios comunitarios',
  'Information and resources based on your location.': 'Información y recursos según su ubicación.',
  'Civic & Government': 'Gobierno e información cívica',
  'Representatives, voting information and civic resources': 'Representantes, información para votar y recursos cívicos',
  'Explore services →': 'Ver servicios →',
  'Weather & Safety': 'Clima y seguridad',
  '7-day forecasts, emergency numbers and safety resources': 'Pronóstico de 7 días, números de emergencia y recursos de seguridad',
  'Healthcare': 'Atención médica',
  'Clinics, hospitals and public health resources': 'Clínicas, hospitales y recursos de salud pública',
  'Benefits & Assistance': 'Beneficios y asistencia',
  'Food, housing and government benefit information': 'Información sobre alimentos, vivienda y beneficios del gobierno',
  'News & Community': 'Noticias y comunidad',
  'Local, U.S., world and technology news': 'Noticias locales, nacionales, internacionales y de tecnología',
  'Explore news →': 'Ver noticias →',

  // --- Home: emergency and care
  '🚑 Emergency & Healthcare Near You': '🚑 Emergencias y atención médica cerca de usted',
  'Immediate help, nearby care and trusted U.S. resources.': 'Ayuda inmediata, atención cercana y recursos confiables de EE. UU.',
  'Emergency Services': 'Servicios de emergencia',
  'Police, fire or medical emergencies. Call immediately if someone is in danger.':
    'Policía, bomberos o emergencias médicas. Llame de inmediato si alguien está en peligro.',
  'Call 911 emergency services': 'Llamar al 911, servicios de emergencia',
  '☎ Call 911': '☎ Llamar al 911',
  '988 Suicide & Crisis Lifeline': '988 Línea de Prevención del Suicidio y Crisis',
  'Free, confidential support for suicide, mental health or substance-use crises, 24/7.':
    'Apoyo gratuito y confidencial para crisis de suicidio, salud mental o consumo de sustancias, las 24 horas. Para hablar en español, marque 2.',
  'Call 988 crisis lifeline': 'Llamar a la línea de crisis 988',
  '☎ Call 988': '☎ Llamar al 988',
  'Text 988 ↗': 'Enviar mensaje de texto al 988 ↗',
  'Find Care Near You': 'Encuentre atención médica cerca de usted',
  'Enter a ZIP above or allow location access for more relevant map searches.':
    'Ingrese un código postal arriba o permita el acceso a su ubicación para búsquedas de mapas más precisas.',
  'Hospitals & ER': 'Hospitales y salas de emergencia',
  'Emergency departments and hospitals': 'Departamentos de emergencia y hospitales',
  'Find Hospitals & ER on Google Maps': 'Buscar hospitales y salas de emergencia en Google Maps',
  'Find Hospitals & ER on Apple Maps': 'Buscar hospitales y salas de emergencia en Apple Maps',
  'CVS Pharmacy': 'Farmacia CVS',
  'Find CVS locations and prescriptions': 'Encuentre sucursales de CVS y recetas',
  'Find CVS Pharmacy on Google Maps': 'Buscar Farmacia CVS en Google Maps',
  'Find CVS Pharmacy on Apple Maps': 'Buscar Farmacia CVS en Apple Maps',
  'Urgent Care': 'Atención de urgencia',
  'Non-emergency walk-in care': 'Atención sin cita para casos que no son emergencias',
  'Find Urgent Care on Google Maps': 'Buscar atención de urgencia en Google Maps',
  'Find Urgent Care on Apple Maps': 'Buscar atención de urgencia en Apple Maps',
  'Walgreens Pharmacy': 'Farmacia Walgreens',
  'Find Walgreens locations': 'Encuentre sucursales de Walgreens',
  'Find Walgreens Pharmacy on Google Maps': 'Buscar Farmacia Walgreens en Google Maps',
  'Find Walgreens Pharmacy on Apple Maps': 'Buscar Farmacia Walgreens en Apple Maps',
  "Map searches use your map provider's available location. For federally supported clinics,":
    'Las búsquedas usan la ubicación disponible en su aplicación de mapas. Para clínicas con apoyo federal,',
  'find a community health center ↗': 'busque un centro de salud comunitario ↗',
  'Additional U.S. Help Lines': 'Otras líneas de ayuda en EE. UU.',
  'Poison Control': 'Control de Intoxicaciones',
  'Community Resources': 'Recursos comunitarios',
  'Veterans Crisis Line': 'Línea de Crisis para Veteranos',
  '988, then press 1': '988, luego marque 1',
  'For immediate danger, call 911. Nearby-care links open external search services; EagleReach does not currently verify locations, hours or availability. U.S. numbers only.':
    'En caso de peligro inmediato, llame al 911. Los enlaces de atención cercana abren servicios de búsqueda externos; EagleReach todavía no verifica ubicaciones, horarios ni disponibilidad. Solo números de EE. UU.',

  // --- Home: results
  'Your community': 'Su comunidad',
  '🔗 Share these results': '🔗 Compartir estos resultados',
  '🏛️ Elected representatives': '🏛️ Representantes electos',
  'Search to load civic information.': 'Busque para ver la información cívica.',
  'ZIP codes can span multiple congressional districts. Confirm district assignments using your full address.':
    'Un código postal puede abarcar varios distritos del Congreso. Confirme su distrito con su dirección completa.',
  '🌤️ 7-day forecast': '🌤️ Pronóstico de 7 días',
  'Search to load the forecast.': 'Busque para ver el pronóstico.',

  // --- Home: news
  'News & Community Updates': 'Noticias y novedades de la comunidad',
  'Current headlines from external publishers.': 'Titulares actuales de medios externos.',
  'News categories': 'Categorías de noticias',
  'Local News': 'Noticias locales',
  'U.S. News': 'Noticias de EE. UU.',
  'World News': 'Noticias del mundo',
  'Technology & AI': 'Tecnología e IA',
  'Enter a ZIP code to load local news, or choose another news category.':
    'Ingrese un código postal para ver noticias locales o elija otra categoría.',

  // --- Home: popular services and resources
  'Popular Services': 'Servicios populares',
  'Quick access to commonly used resources.': 'Acceso rápido a los recursos más usados.',
  '🏥 Find a clinic ↗': '🏥 Buscar una clínica ↗',
  '⛈️ Weather alerts ↗': '⛈️ Alertas del tiempo ↗',
  '🥗 Food assistance ↗': '🥗 Ayuda con alimentos ↗',
  '👥 Representatives ↓': '👥 Representantes ↓',
  '🏠 Housing assistance ↗': '🏠 Ayuda con vivienda ↗',
  '🗳️ Voting information ↗': '🗳️ Información para votar ↗',
  '❤️ Healthcare resources': '❤️ Recursos de salud',
  'Find federally funded health centers and explore public health information. Services and eligibility depend on location and program.':
    'Encuentre centros de salud con fondos federales y consulte información de salud pública. Los servicios y requisitos dependen de la ubicación y del programa.',
  'Find a health center →': 'Buscar un centro de salud →',
  '🤝 Benefits & assistance': '🤝 Beneficios y asistencia',
  'Explore official information about food, housing, health and other assistance programs. A ZIP code alone does not determine eligibility.':
    'Consulte información oficial sobre programas de alimentos, vivienda, salud y otros tipos de asistencia. El código postal por sí solo no determina si usted califica.',
  'Explore government benefits →': 'Ver beneficios del gobierno →',
  'Built for people, powered by purpose.': 'Hecho para las personas, impulsado por un propósito.',
  'EagleReach is an independent, nonpartisan civic platform focused on making community information and public resources easier to discover.':
    'EagleReach es una plataforma cívica independiente y apartidista que facilita encontrar información comunitaria y recursos públicos.',
  'Meet the Team →': 'Conozca al equipo →',

  // --- How to Vote page
  'How to Vote': 'Cómo votar',
  'Registration deadlines, polling hours, ID rules and mail voting are set by each state. Use the official sources below to check the rules where you vote.':
    'Cada estado fija sus fechas límite de inscripción, horarios de votación, requisitos de identificación y reglas para votar por correo. Use las fuentes oficiales a continuación para consultar las reglas donde usted vota.',
  '📝 Register or check deadlines ↗': '📝 Inscribirse o consultar fechas límite ↗',
  'vote.gov — official U.S. government voter registration site': 'vote.gov — sitio oficial del gobierno de EE. UU. para inscribirse para votar',
  '📍 Find your polling place ↗': '📍 Encontrar su lugar de votación ↗',
  "Can I Vote — links to every state's election office": 'Can I Vote — enlaces a la oficina electoral de cada estado',
  '🗳️ Voting and elections guide ↗': '🗳️ Guía de votación y elecciones ↗',
  'USA.gov — absentee, early voting and voter ID basics': 'USA.gov — voto en ausencia, votación anticipada e identificación',
  '♿ Accessible voting & help ↗': '♿ Votación accesible y ayuda ↗',
  'U.S. Election Assistance Commission voter resources': 'Recursos para votantes de la Comisión de Asistencia Electoral de EE. UU.',
  'U.S. federal general elections are held on the Tuesday after the first Monday in November. EagleReach is nonpartisan and does not endorse candidates or parties.':
    'Las elecciones generales federales de EE. UU. se celebran el martes siguiente al primer lunes de noviembre. EagleReach es apartidista y no apoya a candidatos ni partidos.',

  // --- Contact page
  'Questions, feedback or ideas for EagleReach are welcome.': 'Sus preguntas, comentarios e ideas para EagleReach son bienvenidos.',
  '✉️ Email': '✉️ Correo electrónico',
  '🐞 Report a bug or suggest a feature ↗': '🐞 Reportar un error o sugerir una función ↗',
  'GitHub issues': 'Reportes en GitHub',
  "Please don't send medical records, ID numbers or other private information. For emergencies, call 911.":
    'No envíe expedientes médicos, números de identificación ni otra información privada. En caso de emergencia, llame al 911.',

  // --- Page titles
  'EagleReach | Your Community, Connected': 'EagleReach | Su comunidad, conectada',
  'About | EagleReach': 'Acerca de | EagleReach',
  'Founder & Team | EagleReach': 'Fundador y equipo | EagleReach',
  'How to Vote | EagleReach': 'Cómo votar | EagleReach',
  'Contact | EagleReach': 'Contacto | EagleReach',
  'Privacy | EagleReach': 'Privacidad | EagleReach',

  // --- Messages created by app.js
  'Waking up the EagleReach server — the first search can take up to a minute…':
    'Activando el servidor de EagleReach; la primera búsqueda puede tardar hasta un minuto…',
  'Using your permitted device location for map searches.': 'Usando la ubicación de su dispositivo (con su permiso) para las búsquedas de mapas.',
  'Showing map searches near ZIP {zip}.': 'Mostrando búsquedas de mapas cerca del código postal {zip}.',
  'Forecast updated {time}, refreshes every 10 min': 'Pronóstico actualizado a las {time}; se actualiza cada 10 min',
  'Current conditions': 'Condiciones actuales',
  'Forecast is temporarily unavailable.': 'El pronóstico no está disponible por el momento.',
  'No active weather alerts for this area.': 'No hay alertas meteorológicas activas para esta zona.',
  '{n} active weather alert': '{n} alerta meteorológica activa',
  '{n} active weather alerts': '{n} alertas meteorológicas activas',
  'Weather alert': 'Alerta meteorológica',
  'Until {time}': 'Hasta {time}',
  'Source: National Weather Service': 'Fuente: Servicio Meteorológico Nacional (en inglés)',
  'Details': 'Detalles',
  'Representative information is unavailable for this ZIP. Check your officials using your full street address at USA.gov.':
    'La información de representantes no está disponible para este código postal. Consulte a sus funcionarios con su dirección completa en USA.gov.',
  'Official': 'Funcionario',
  'Website': 'Sitio web',
  'Enter a valid 5-digit U.S. ZIP code.': 'Ingrese un código postal válido de 5 dígitos.',
  'Weather pending': 'Cargando el tiempo',
  'Loading forecast…': 'Cargando el pronóstico…',
  'Loading representatives…': 'Cargando representantes…',
  'Community resources for {zip}': 'Recursos comunitarios para {zip}',
  'Loading location, weather and civic information…': 'Cargando ubicación, clima e información cívica…',
  'Community {zip}': 'Comunidad {zip}',
  'House district based on {src}': 'Distrito de la Cámara según {src}',
  'device location': 'la ubicación de su dispositivo',
  'ZIP code centre': 'el centro del código postal',
  'Your area': 'Su zona',
  'Forecast location unavailable.': 'La ubicación para el pronóstico no está disponible.',
  'Location loaded.': 'Ubicación cargada.',
  'That ZIP code was not found.': 'No se encontró ese código postal.',
  'Civic data could not load: {msg}': 'No se pudo cargar la información cívica: {msg}',
  'Find your elected officials on USA.gov': 'Encuentre a sus funcionarios electos en USA.gov',
  'Location is not supported by this browser.': 'Este navegador no permite compartir la ubicación.',
  'Requesting location permission…': 'Solicitando permiso de ubicación…',
  'No U.S. ZIP code found': 'No se encontró un código postal de EE. UU.',
  'Unable to determine ZIP: {msg}': 'No se pudo determinar el código postal: {msg}',
  'Location unavailable: {msg}': 'Ubicación no disponible: {msg}',
  'just now': 'justo ahora',
  '{n} min ago': 'hace {n} min',
  '{n} h ago': 'hace {n} h',
  '{n} d ago': 'hace {n} d',
  'Enter a ZIP code above to see local headlines.': 'Ingrese un código postal arriba para ver titulares locales.',
  'Loading headlines…': 'Cargando titulares…',
  'Waking up the news server — this can take up to a minute…': 'Activando el servidor de noticias; puede tardar hasta un minuto…',
  'Read article': 'Leer artículo',
  'Headlines are temporarily unavailable.': 'Los titulares no están disponibles por el momento.',
  'Browse Google News': 'Ver Google Noticias',
  'in {city}': 'en {city}',
  'Representatives, weather alerts and local news for {place} on EagleReach':
    'Representantes, alertas del tiempo y noticias locales para {place} en EagleReach',
  'Link copied': 'Enlace copiado',

  // --- Values that come from the server
  'Democrat': 'Demócrata',
  'Republican': 'Republicano',
  'Independent': 'Independiente',
  'U.S. Senate': 'Senado de EE. UU.',
  'State & local': 'Estatal y local',
  'U.S. House · look up by full address': 'Cámara de Representantes · busque con su dirección completa',
  'Find your U.S. House Representative': 'Encuentre a su representante en la Cámara'
};

// Patterns for server text that contains a state, district or city.
const ES_PATTERNS = [
  [/^U\.S\. Senator · (.+)$/, 'Senador(a) de EE. UU. · $1'],
  [/^U\.S\. Representative · (.+) at-large$/, 'Representante de EE. UU. · $1, distrito único'],
  [/^U\.S\. Representative · (.+)$/, 'Representante de EE. UU. · $1'],
  [/^U\.S\. Delegate · (.+) at-large$/, 'Delegado(a) de EE. UU. · $1'],
  [/^Find U\.S\. Senators for (.+)$/, 'Encuentre a los senadores de EE. UU. de $1'],
  [/^Local government offices in (.+)$/, 'Oficinas del gobierno local en $1']
];

// Translate a message; {name} placeholders are filled from vars.
function t(text, vars = {}) {
  const out = (LANG === 'es' && ES[text]) || text;
  return out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// Translate text that came from the server (roles, parties, fallback links).
function trText(text) {
  if (LANG !== 'es') return text;
  if (ES[text]) return ES[text];
  for (const [re, out] of ES_PATTERNS) {
    if (re.test(text)) return text.replace(re, out);
  }
  return text;
}

// Swap the English text already on the page.
function translatePage() {
  document.documentElement.lang = LANG;
  if (LANG === 'en') return;

  document.title = t(document.title);

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const key = node.nodeValue.replace(/\s+/g, ' ').trim();
    if (key && ES[key]) {
      const lead = node.nodeValue.match(/^\s*/)[0];
      const trail = node.nodeValue.match(/\s*$/)[0];
      node.nodeValue = lead + ES[key] + trail;
    }
  });

  document.querySelectorAll('[placeholder],[aria-label]').forEach(el => {
    ['placeholder', 'aria-label'].forEach(attr => {
      const v = el.getAttribute(attr);
      if (v && ES[v]) el.setAttribute(attr, ES[v]);
    });
  });

  // Keep Spanish when moving between pages, even if the browser blocks storage.
  document.querySelectorAll('a[href^="./"]').forEach(a => {
    const [path, hash] = a.getAttribute('href').split('#');
    a.setAttribute('href', path + (path.includes('?') ? '&' : '?') + 'lang=es' + (hash ? '#' + hash : ''));
  });

  // Long pages that are not translated yet get a short notice.
  const enOnly = document.querySelector('[data-en-only]');
  if (enOnly) {
    const note = document.createElement('p');
    note.className = 'lang-note';
    note.textContent = 'Esta página todavía está disponible solo en inglés.';
    enOnly.prepend(note);
  }
}

// The "🌐 English | Español" switch in the header. The current language is
// highlighted; clicking the other one reloads the page in that language.
function setupLangToggle() {
  document.querySelectorAll('#langSwitch [data-lang]').forEach(btn => {
    const lang = btn.dataset.lang;
    const active = lang === LANG;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.title = lang === 'es' ? 'Ver en español' : 'View in English';
    btn.addEventListener('click', () => {
      if (lang === LANG) return;
      try { localStorage.setItem('er-lang', lang); } catch {}
      const u = new URL(location.href);
      if (lang === 'en') u.searchParams.delete('lang');
      else u.searchParams.set('lang', lang);
      location.href = u.href; // a ?zip= link re-runs the search in the new language
    });
  });
}

translatePage();
setupLangToggle();

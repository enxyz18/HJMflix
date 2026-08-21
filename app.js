/* ==========================================
   LOGIK NAVIGASI, UI & PLAYER WATCH PAGE
   ========================================== */

// Global State Variables
window.currentTmdbId = null;
window.currentMediaType = 'movie';
window.currentSeason = 1;
window.currentEpisode = 1;
window.currentProvider = 'vidlink';

window.currentPlatformKey = '';
window.currentPlatformTitle = '';
window.currentPlatformPage = 1;
window.currentSearchPage = 1;

// Sembunyikan semua seksyen sebelum tukar skrin
function hideAllSections() {
  document.getElementById('mainLayout')?.classList.add('hidden');
  document.getElementById('homepageSections')?.classList.add('hidden');
  document.getElementById('platformPageSection')?.classList.add('hidden');
  document.getElementById('searchResultsSection')?.classList.add('hidden');
  document.getElementById('watchPageSection')?.classList.add('hidden');
}

// Muat Laman Utama (Homepage)
async function loadHomepage() {
  hideAllSections();
  document.getElementById('mainLayout')?.classList.remove('hidden');
  document.getElementById('homepageSections')?.classList.remove('hidden');
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  fetchSection('netflix_movies', 'netflixMoviesGrid', 'movie', 1, 10);
  fetchSection('netflix_tv', 'netflixTvGrid', 'tv', 1, 10);
  fetchSection('prime_movies', 'primeMoviesGrid', 'movie', 1, 10);
  fetchSection('prime_tv', 'primeTvGrid', 'tv', 1, 10);
  fetchSection('disney_movies', 'disneyMoviesGrid', 'movie', 1, 10);
  fetchSection('disney_tv', 'disneyTvGrid', 'tv', 1, 10);
  fetchSection('hbo_movies', 'hboMoviesGrid', 'movie', 1, 10);
  fetchSection('hbo_tv', 'hboTvGrid', 'tv', 1, 10);
}

// Buka Halaman Khas Platform
async function openPlatformPage(platformKey, platformTitle, page = 1) {
  window.currentPlatformKey = platformKey;
  window.currentPlatformTitle = platformTitle;
  window.currentPlatformPage = page;

  hideAllSections();
  document.getElementById('mainLayout')?.classList.remove('hidden');
  const platformSection = document.getElementById('platformPageSection');
  platformSection?.classList.remove('hidden');
  
  document.getElementById('platformPageTitle').innerText = `${platformTitle} Hub — Page ${page}`;
  document.getElementById('platformPageNum').innerText = `Page ${page}`;
  document.getElementById('platformPrevBtn').disabled = page <= 1;

  fetchSection(`${platformKey}_movies`, 'platformMoviesGrid', 'movie', page, 20);
  fetchSection(`${platformKey}_tv`, 'platformTvGrid', 'tv', page, 20);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePlatformPage(delta) {
  const newPage = window.currentPlatformPage + delta;
  if (newPage >= 1) openPlatformPage(window.currentPlatformKey, window.currentPlatformTitle, newPage);
}

function changeSearchPage(delta) {
  const newPage = window.currentSearchPage + delta;
  if (newPage >= 1) searchMedia(newPage);
}

// Papar senarai kad dalam bentuk Grid
function displayGrid(items, gridElement, mediaType, showRank = false) {
  if (!gridElement) return;

  if (!items || items.length === 0) {
    gridElement.innerHTML = `<p class="col-span-full text-gray-500 text-xs py-4">Tiada kandungan.</p>`;
    return;
  }

  gridElement.innerHTML = items.map((m, index) => {
    const itemType = (mediaType && mediaType !== 'multi') ? mediaType : (m.media_type || 'movie');
    const title = m.title || m.name;
    const date = m.release_date || m.first_air_date || '';
    const year = date ? date.split('-')[0] : 'N/A';
    const typeLabel = itemType === 'tv' ? 'TV' : 'Movie';

    return `
      <div tabindex="0" 
           onclick="playMedia(${m.id}, '${itemType}', '${title.replace(/'/g, "\\'")}')" 
           onkeydown="if(event.key==='Enter') playMedia(${m.id}, '${itemType}', '${title.replace(/'/g, "\\'")}')"
           class="group cursor-pointer bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-red-600 transition duration-300 shadow-md relative focus:outline-none">
        
        ${showRank ? `
          <div class="absolute top-2 left-2 z-10 bg-red-600/90 backdrop-blur-sm text-white font-black text-xs px-2 py-0.5 rounded shadow">
            #${index + 1}
          </div>
        ` : ''}

        <div class="relative">
          <img src="${m.poster_path ? 'https://image.tmdb.org/t/p/w500' + m.poster_path : 'https://via.placeholder.com/500x750?text=No+Poster'}" 
               alt="${title}" class="w-full h-auto object-cover" loading="lazy">
          <span class="absolute top-2 right-2 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded border border-gray-700 font-bold uppercase ${itemType === 'tv' ? 'text-yellow-400' : 'text-white'}">
            ${typeLabel}
          </span>
        </div>
        <div class="p-3">
          <p class="text-xs font-bold truncate group-hover:text-red-500 transition">${title}</p>
          <p class="text-[10px] text-gray-400 mt-1">${year}</p>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================
   LOGIK HALAMAN KHAS TONTONAN (WATCH PAGE)
   ========================================== */

function playMedia(id, type, title) {
  window.currentTmdbId = id;
  window.currentMediaType = type;
  window.currentSeason = 1;
  window.currentEpisode = 1;
  window.currentProvider = 'vidlink';

  hideAllSections();
  document.getElementById('watchPageSection')?.classList.remove('hidden');
  document.getElementById('watchMediaTitle').innerText = title;

  const tvControls = document.getElementById('tvControls');
  if (type === 'tv') {
    tvControls?.classList.remove('hidden');
    document.getElementById('seasonVal').innerText = window.currentSeason;
    document.getElementById('episodeVal').innerText = window.currentEpisode;
  } else {
    tvControls?.classList.add('hidden');
  }

  updateStreamUrl();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  setTimeout(() => {
    document.getElementById('backBtn')?.focus();
  }, 100);
}

function adjustSeason(delta) {
  if (window.currentSeason + delta >= 1) {
    window.currentSeason += delta;
    document.getElementById('seasonVal').innerText = window.currentSeason;
    updateStreamUrl();
  }
}

function adjustEpisode(delta) {
  if (window.currentEpisode + delta >= 1) {
    window.currentEpisode += delta;
    document.getElementById('episodeVal').innerText = window.currentEpisode;
    updateStreamUrl();
  }
}

function changeProvider(provider) {
  window.currentProvider = provider;
  updateStreamUrl();

  document.querySelectorAll('.server-btn').forEach(btn => {
    btn.classList.remove('bg-red-600');
    btn.classList.add('bg-gray-800', 'hover:bg-gray-700');
  });
  const activeBtn = document.getElementById(`btn-${provider}`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-gray-800', 'hover:bg-gray-700');
    activeBtn.classList.add('bg-red-600');
  }
}

function updateStreamUrl() {
  const iframe = document.getElementById('videoPlayer');
  if (!iframe) return;

  if (window.currentMediaType === 'tv') {
    if (window.currentProvider === 'vidlink') iframe.src = `https://vidlink.pro/tv/${window.currentTmdbId}/${window.currentSeason}/${window.currentEpisode}`;
    else if (window.currentProvider === 'vidfast') iframe.src = `https://vidfast.vc/tv/${window.currentTmdbId}/${window.currentSeason}/${window.currentEpisode}`;
    else if (window.currentProvider === 'vidsrc') iframe.src = `https://vidsrcme.ru/embed/tv/${window.currentTmdbId}/${window.currentSeason}/${window.currentEpisode}`;
  } else {
    if (window.currentProvider === 'vidlink') iframe.src = `https://vidlink.pro/movie/${window.currentTmdbId}`;
    else if (window.currentProvider === 'vidfast') iframe.src = `https://vidfast.vc/movie/${window.currentTmdbId}`;
    else if (window.currentProvider === 'vidsrc') iframe.src = `https://vidsrcme.ru/embed/movie/${window.currentTmdbId}`;
  }
}

function closeWatchPage() {
  const iframe = document.getElementById('videoPlayer');
  if (iframe) iframe.src = '';
  hideAllSections();
  document.getElementById('mainLayout')?.classList.remove('hidden');
  document.getElementById('homepageSections')?.classList.remove('hidden');
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  loadHomepage();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      const watchSection = document.getElementById('watchPageSection');
      if (watchSection && !watchSection.classList.contains('hidden')) {
        closeWatchPage();
      }
    }
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchMedia(1);
    });
  }
});
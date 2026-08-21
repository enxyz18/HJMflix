/* ==========================================
   LOGIK NAVIGASI, UI, DETAILS & WATCH PAGE
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
  document.getElementById('detailsPageSection')?.classList.add('hidden');
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

// Papar senarai kad dalam bentuk Grid (Klik Kad akan buka Details Page)
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
           onclick="openDetailsPage(${m.id}, '${itemType}')" 
           onkeydown="if(event.key==='Enter') openDetailsPage(${m.id}, '${itemType}')"
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
   LOGIK MOVIE / TV DETAILS PAGE
   ========================================== */

async function openDetailsPage(id, type) {
  hideAllSections();
  document.getElementById('mainLayout')?.classList.remove('hidden');
  const detailsSection = document.getElementById('detailsPageSection');
  if (detailsSection) detailsSection.classList.remove('hidden');

  document.getElementById('detailTitleContainer').innerHTML = '<h1 class="text-xl font-bold text-gray-400">Memuatkan...</h1>';
  document.getElementById('detailOverview').innerText = '';
  document.getElementById('detailCast').innerHTML = '';
  document.getElementById('similarGrid').innerHTML = '';
  document.getElementById('recommendationsGrid').innerHTML = '';

  const data = await fetchMediaDetails(id, type);
  if (!data || !data.details) return;

  const details = data.details;
  const credits = data.credits;
  const images = data.images;
  const similar = data.similar;
  const recommendations = data.recommendations;

  // Banner Landscape
  const backdrop = details.backdrop_path || details.poster_path;
  document.getElementById('detailBanner').src = backdrop 
    ? `https://image.tmdb.org/t/p/w780${backdrop}` 
    : 'https://via.placeholder.com/780x440?text=No+Image';

  // Title / Logo
  const logo = images?.logos?.find(l => l.iso_639_1 === 'en' || l.iso_639_1 === null);
  const titleContainer = document.getElementById('detailTitleContainer');
  const titleText = details.title || details.name;

  if (logo && logo.file_path) {
    titleContainer.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${logo.file_path}" alt="${titleText}" class="h-14 sm:h-20 object-contain">`;
  } else {
    titleContainer.innerHTML = `<h1 class="text-2xl sm:text-4xl font-black text-white">${titleText}</h1>`;
  }

  // Metadata
  const date = details.release_date || details.first_air_date || '';
  document.getElementById('detailYear').innerText = date ? date.split('-')[0] : 'N/A';
  document.getElementById('detailRating').innerText = `⭐ ${details.vote_average ? details.vote_average.toFixed(1) : 'N/A'}`;
  
  const runtime = details.runtime || (details.episode_run_time ? details.episode_run_time[0] : null);
  document.getElementById('detailRuntime').innerText = runtime ? `${runtime} mins` : (type === 'tv' ? 'TV Series' : 'N/A');

  // Genres
  document.getElementById('detailGenres').innerHTML = (details.genres || []).map(g => 
    `<span class="bg-gray-800 text-gray-300 text-[10px] sm:text-xs px-2.5 py-1 rounded-full border border-gray-700 font-medium">${g.name}</span>`
  ).join('');

  // Watch Button
  const watchBtn = document.getElementById('detailWatchBtn');
  if (watchBtn) watchBtn.onclick = () => playMedia(id, type, titleText);

  // Overview
  document.getElementById('detailOverview').innerText = details.overview || 'Tiada sinopsis tersedia.';

  // Cast
  const topCast = (credits?.cast || []).slice(0, 8);
  document.getElementById('detailCast').innerHTML = topCast.map(c => `
    <div class="flex-shrink-0 w-16 text-center space-y-1">
      <img src="${c.profile_path ? 'https://image.tmdb.org/t/p/w185' + c.profile_path : 'https://via.placeholder.com/185x278?text=No+Pic'}" 
           alt="${c.name}" class="w-12 h-12 rounded-full object-cover mx-auto border border-gray-800">
      <p class="text-[10px] font-medium text-gray-300 truncate">${c.name}</p>
    </div>
  `).join('');

  // Render Horizontal Lists (Movies Like This & You May Also Like)
  renderHorizontalCards(similar?.results || [], 'similarGrid', type);
  renderHorizontalCards(recommendations?.results || [], 'recommendationsGrid', type);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHorizontalCards(items, elementId, defaultType) {
  const container = document.getElementById(elementId);
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-xs text-gray-500 py-2">Tiada cadangan.</p>';
    return;
  }

  container.innerHTML = items.slice(0, 10).map(m => {
    const itemType = m.media_type || defaultType;
    const title = m.title || m.name;

    return `
      <div tabindex="0" 
           onclick="openDetailsPage(${m.id}, '${itemType}')"
           onkeydown="if(event.key==='Enter') openDetailsPage(${m.id}, '${itemType}')"
           class="flex-shrink-0 w-28 sm:w-36 group cursor-pointer space-y-1.5 focus:outline-none">
        <div class="w-full aspect-[2/3] bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group-hover:border-red-600 transition">
          <img src="${m.poster_path ? 'https://image.tmdb.org/t/p/w342' + m.poster_path : 'https://via.placeholder.com/342x513?text=No+Poster'}" 
               alt="${title}" class="w-full h-full object-cover" loading="lazy">
        </div>
        <p class="text-[11px] font-bold text-gray-200 truncate group-hover:text-red-500 transition">${title}</p>
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
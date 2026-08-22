// ==========================================
// CONFIGURATION & GLOBAL VARIABLES
// ==========================================
const API_KEY = 'YOUR_TMDB_API_KEY'; // Gantikan dengan API key TMDB anda jika perlu
const BASE_URL = 'https://api.themoviedb.org/3';

let currentMedia = {
  type: 'movie', // 'movie' atau 'tv'
  id: null,
  season: 1,
  episode: 1,
  title: ''
};

let currentProvider = 'vidlink'; // 'vidlink', 'vidfast', 'vidsrc'
let currentSearchQuery = '';
let currentSearchPage = 1;
let currentPlatform = '';
let currentPlatformPage = 1;

// ==========================================
// PAGE NAVIGATION & SECTION TOGGLES
// ==========================================

/**
 * Menyembunyikan semua seksyen kandungan di dalam kawasan utama.
 * Memastikan mainLayout (Sidebar + Kandungan Kanan) kekal kelihatan.
 */
function hideAllSections() {
  // Kekalkan mainLayout supaya Sidebar di sebelah kiri tidak hilang
  document.getElementById('mainLayout')?.classList.remove('hidden');

  // Sembunyikan seksyen-seksyen anak
  document.getElementById('homepageSections')?.classList.add('hidden');
  document.getElementById('platformPageSection')?.classList.add('hidden');
  document.getElementById('searchResultsSection')?.classList.add('hidden');
  document.getElementById('detailsPageSection')?.classList.add('hidden');
  document.getElementById('watchPageSection')?.classList.add('hidden');
}

/**
 * Membuka Laman Utama (Homepage Top 10)
 */
function loadHomepage() {
  hideAllSections();
  document.getElementById('homepageSections')?.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Membuka skrin pemain video (Watch Page)
 * Memetakan paparan kepada skrin lebar dengan MENYEMBUNYIKAN sidebar mainLayout.
 */
function openWatchPage() {
  hideAllSections();
  
  // Sembunyikan mainLayout (Sidebar) khas semasa menonton sahaja
  document.getElementById('mainLayout')?.classList.add('hidden');
  
  // Tunjukkan seksyen pemain video
  document.getElementById('watchPageSection')?.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Menutup skrin pemain video dan kembali ke paparan Details
 */
function closeWatchPage() {
  const videoPlayer = document.getElementById('videoPlayer');
  if (videoPlayer) videoPlayer.src = ''; // Hentikan strim video

  document.getElementById('watchPageSection')?.classList.add('hidden');
  
  // Tunjukkan semula mainLayout (Sidebar + Details)
  document.getElementById('mainLayout')?.classList.remove('hidden');
  document.getElementById('detailsPageSection')?.classList.remove('hidden');
}

// ==========================================
// DETAILS PAGE & MEDIA LOADER
// ==========================================

/**
 * Membuka Laman Details bagi Movie atau TV Series
 */
async function openDetailsPage(mediaType, id) {
  hideAllSections();
  document.getElementById('detailsPageSection')?.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  currentMedia.type = mediaType;
  currentMedia.id = id;
  currentMedia.season = 1;
  currentMedia.episode = 1;

  try {
    // Ambil maklumat asas dari TMDB
    const res = await fetch(`${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits,similar,recommendations`);
    const data = await res.json();

    currentMedia.title = data.title || data.name;

    // Set Banner / Poster
    const bannerImg = document.getElementById('detailBanner');
    if (bannerImg) {
      bannerImg.src = data.poster_path 
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
        : 'https://via.placeholder.com/500x750?text=No+Image';
    }

    // Set Tajuk
    const titleContainer = document.getElementById('detailTitleContainer');
    if (titleContainer) {
      titleContainer.innerHTML = `<h1 class="text-2xl sm:text-3xl font-black text-white">${currentMedia.title}</h1>`;
    }

    // Set Tahun, Rating, Runtime
    const year = (data.release_date || data.first_air_date || '').split('-')[0];
    const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
    const runtime = mediaType === 'movie' 
      ? (data.runtime ? `${data.runtime} min` : '') 
      : (data.number_of_seasons ? `${data.number_of_seasons} Season(s)` : '');

    document.getElementById('detailYear').textContent = year;
    document.getElementById('detailRating').textContent = `★ ${rating}`;
    document.getElementById('detailRuntime').textContent = runtime;

    // Set Genre
    const genresContainer = document.getElementById('detailGenres');
    if (genresContainer) {
      genresContainer.innerHTML = (data.genres || []).map(g => 
        `<span class="bg-gray-800/80 text-gray-300 text-xs px-2.5 py-1 rounded-lg border border-gray-700/50">${g.name}</span>`
      ).join('');
    }

    // Set Sinopsis
    document.getElementById('detailOverview').textContent = data.overview || 'Tiada sinopsis tersedia.';

    // Set Cast
    const castContainer = document.getElementById('detailCast');
    if (castContainer && data.credits && data.credits.cast) {
      castContainer.innerHTML = data.credits.cast.slice(0, 10).map(c => `
        <div class="flex-shrink-0 w-20 text-center">
          <img src="${c.profile_path ? 'https://image.tmdb.org/t/p/w185' + c.profile_path : 'https://via.placeholder.com/185x278?text=No+Pic'}" 
               class="w-16 h-16 rounded-full object-cover mx-auto border border-gray-800 mb-1" />
          <p class="text-[10px] font-bold text-gray-200 truncate">${c.name}</p>
          <p class="text-[9px] text-gray-500 truncate">${c.character || ''}</p>
        </div>
      `).join('');
    }

    // Set Butang Watch Now
    const watchBtn = document.getElementById('detailWatchBtn');
    if (watchBtn) {
      watchBtn.onclick = () => playMedia(mediaType, id, 1, 1);
    }

    // Kawalan Khas TV Series vs Movie
    const tvSection = document.getElementById('tvSeriesEpisodesSection');
    const movieRecSection = document.getElementById('movieRecommendationsSection');

    if (mediaType === 'tv') {
      tvSection?.classList.remove('hidden');
      movieRecSection?.classList.add('hidden');
      setupSeasonDropdown(data.number_of_seasons || 1);
      loadEpisodes(id, 1);
    } else {
      tvSection?.classList.add('hidden');
      movieRecSection?.classList.remove('hidden');
      renderRecommendations(data.similar?.results || [], 'similarGrid');
      renderRecommendations(data.recommendations?.results || [], 'recommendationsGrid');
    }

  } catch (err) {
    console.error("Gagal memuatkan maklumat details:", err);
  }
}

// ==========================================
// PLAYER & PROVIDER ENGINE
// ==========================================

/**
 * Memulakan strim video
 */
function playMedia(type, id, season = 1, episode = 1) {
  currentMedia.type = type;
  currentMedia.id = id;
  currentMedia.season = season;
  currentMedia.episode = episode;

  // Tunjukkan kawalan TV jika siri TV
  const tvControls = document.getElementById('tvControls');
  if (tvControls) {
    if (type === 'tv') {
      tvControls.classList.remove('hidden');
      document.getElementById('seasonVal').textContent = season;
      document.getElementById('episodeVal').textContent = episode;
    } else {
      tvControls.classList.add('hidden');
    }
  }

  // Set tajuk pada skrin pemain
  const titleElem = document.getElementById('watchMediaTitle');
  if (titleElem) {
    titleElem.textContent = type === 'tv' 
      ? `${currentMedia.title} (S${season} E${episode})`
      : currentMedia.title;
  }

  // Kemaskini URL iframe dan buka skrin tontonan skrin penuh
  updatePlayerURL();
  openWatchPage();
}

/**
 * Penjanaan URL mengikut Provider
 */
function updatePlayerURL() {
  const { type, id, season, episode } = currentMedia;
  let url = '';

  if (currentProvider === 'vidlink') {
    url = type === 'movie'
      ? `https://vidlink.pro/movie/${id}?player=jw`
      : `https://vidlink.pro/tv/${id}/${season}/${episode}?player=jw`;
  } else if (currentProvider === 'vidfast') {
    url = type === 'movie'
      ? `https://vidfast.pro/movie/${id}?sub=en,my`
      : `https://vidfast.pro/tv/${id}/${season}/${episode}?sub=en,my`;
  } else if (currentProvider === 'vidsrc') {
    url = type === 'movie'
      ? `https://vidsrc.cc/v2/embed/movie/${id}?ds_lang=en,my`
      : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?ds_lang=en,my`;
  }

  const iframe = document.getElementById('videoPlayer');
  if (iframe) {
    iframe.src = url;
  }
}

/**
 * Tukar Server / Provider Video
 */
function changeProvider(providerName) {
  currentProvider = providerName;
  
  // Kemaskini gaya butang aktif
  document.querySelectorAll('.server-btn').forEach(btn => {
    btn.classList.remove('bg-red-600');
    btn.classList.add('bg-gray-800');
  });

  const activeBtn = document.getElementById(`btn-${providerName}`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-gray-800');
    activeBtn.classList.add('bg-red-600');
  }

  updatePlayerURL();
}

/**
 * Kawalan Musim & Episod semasa dalam skrin tontonan
 */
function adjustSeason(delta) {
  let newSeason = currentMedia.season + delta;
  if (newSeason < 1) newSeason = 1;
  currentMedia.season = newSeason;
  currentMedia.episode = 1; // Reset ke episod 1 bila tukar season
  
  document.getElementById('seasonVal').textContent = currentMedia.season;
  document.getElementById('episodeVal').textContent = currentMedia.episode;
  
  playMedia(currentMedia.type, currentMedia.id, currentMedia.season, currentMedia.episode);
}

function adjustEpisode(delta) {
  let newEp = currentMedia.episode + delta;
  if (newEp < 1) newEp = 1;
  currentMedia.episode = newEp;
  
  document.getElementById('episodeVal').textContent = currentMedia.episode;
  
  playMedia(currentMedia.type, currentMedia.id, currentMedia.season, currentMedia.episode);
}

// ==========================================
// TV EPISODES LOADER (DETAILS PAGE)
// ==========================================

function setupSeasonDropdown(totalSeasons) {
  const select = document.getElementById('seasonSelect');
  if (!select) return;
  select.innerHTML = '';
  for (let i = 1; i <= totalSeasons; i++) {
    select.innerHTML += `<option value="${i}">Season ${i}</option>`;
  }
}

function onSeasonChange(seasonNum) {
  currentMedia.season = parseInt(seasonNum);
  loadEpisodes(currentMedia.id, currentMedia.season);
}

async function loadEpisodes(tvId, seasonNum) {
  const grid = document.getElementById('episodesGrid');
  if (!grid) return;
  grid.innerHTML = '<p class="text-xs text-gray-500 col-span-full">Memuatkan episod...</p>';

  try {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNum}?api_key=${API_KEY}`);
    const data = await res.json();

    if (!data.episodes || data.episodes.length === 0) {
      grid.innerHTML = '<p class="text-xs text-gray-500 col-span-full">Tiada episod ditemui.</p>';
      return;
    }

    grid.innerHTML = data.episodes.map(ep => `
      <div onclick="playMedia('tv', ${tvId}, ${seasonNum}, ${ep.episode_number})" 
           class="bg-gray-900/80 hover:bg-red-600/20 border border-gray-800 hover:border-red-600/50 p-3 rounded-xl cursor-pointer transition group">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold text-red-500 group-hover:text-red-400">E${ep.episode_number}</span>
          <span class="text-[10px] text-gray-500">★ ${ep.vote_average ? ep.vote_average.toFixed(1) : 'N/A'}</span>
        </div>
        <p class="text-xs font-bold text-white truncate">${ep.name}</p>
      </div>
    `).join('');

  } catch (err) {
    console.error("Gagal memuatkan episod:", err);
    grid.innerHTML = '<p class="text-xs text-red-500 col-span-full">Gagal memuatkan episod.</p>';
  }
}

// ==========================================
// HELPER FUNCTIONS & RECOMMENDATIONS
// ==========================================

function renderRecommendations(list, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = '<p class="text-xs text-gray-500">Tiada cadangan.</p>';
    return;
  }

  container.innerHTML = list.slice(0, 10).map(item => `
    <div onclick="openDetailsPage('movie', ${item.id})" 
         class="flex-shrink-0 w-28 sm:w-32 cursor-pointer group">
      <div class="rounded-xl overflow-hidden border border-gray-800 group-hover:border-red-600/50 transition">
        <img src="${item.poster_path ? 'https://image.tmdb.org/t/p/w185' + item.poster_path : 'https://via.placeholder.com/185x278'}" 
             class="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition duration-300" />
      </div>
      <p class="text-xs font-bold text-gray-300 group-hover:text-red-500 truncate mt-1.5">${item.title || item.name}</p>
    </div>
  `).join('');
}
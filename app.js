/* ==========================================
   LOGIK NAVIGASI, UI, DETAILS & WATCH PAGE
   ========================================== */

window.currentTmdbId = null;
window.currentMediaType = 'movie';
window.currentSeason = 1;
window.currentEpisode = 1;
window.currentProvider = 'vidlink';

window.currentPlatformKey = '';
window.currentPlatformTitle = '';
window.currentPlatformPage = 1;
window.currentSearchPage = 1;
window.currentDetailsTvId = null;

function hideAllSections() {
  // PASTIKAN mainLayout SENTIASA DIPAPARKAN (sebab ia pegang Menu Sidebar)
  document.getElementById('mainLayout')?.classList.remove('hidden');

  // Sembunyikan seksyen kandungan di dalam sahaja
  document.getElementById('homepageSections')?.classList.add('hidden');
  document.getElementById('platformPageSection')?.classList.add('hidden');
  document.getElementById('searchResultsSection')?.classList.add('hidden');
  document.getElementById('detailsPageSection')?.classList.add('hidden');
  document.getElementById('watchPageSection')?.classList.add('hidden');
}

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
   LOGIK DETAILS PAGE (MOVIE VS TV SHOW)
   ========================================== */

async function openDetailsPage(id, type) {
  hideAllSections();
  document.getElementById('mainLayout')?.classList.remove('hidden');
  const detailsSection = document.getElementById('detailsPageSection');
  if (detailsSection) detailsSection.classList.remove('hidden');

  const isTv = type === 'tv';
  window.currentDetailsTvId = isTv ? id : null;

  const tvSection = document.getElementById('tvSeriesEpisodesSection');
  const movieSection = document.getElementById('movieRecommendationsSection');

  if (isTv) {
    tvSection?.classList.remove('hidden');
    movieSection?.classList.add('hidden');
  } else {
    tvSection?.classList.add('hidden');
    movieSection?.classList.remove('hidden');
  }

  document.getElementById('detailTitleContainer').innerHTML = '<h1 class="text-xl font-bold text-gray-400">Memuatkan...</h1>';
  document.getElementById('detailOverview').innerText = '';
  document.getElementById('detailCast').innerHTML = '';
  document.getElementById('episodesGrid').innerHTML = '';

  const data = await fetchMediaDetails(id, type);
  if (!data || !data.details) return;

  const details = data.details;
  const credits = data.credits;
  const images = data.images;

  const backdrop = details.backdrop_path || details.poster_path;
  document.getElementById('detailBanner').src = backdrop 
    ? `https://image.tmdb.org/t/p/w780${backdrop}` 
    : 'https://via.placeholder.com/780x440?text=No+Image';

  const logo = images?.logos?.find(l => l.iso_639_1 === 'en' || l.iso_639_1 === null);
  const titleContainer = document.getElementById('detailTitleContainer');
  const titleText = details.title || details.name;

  if (logo && logo.file_path) {
    titleContainer.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${logo.file_path}" alt="${titleText}" class="h-14 sm:h-20 object-contain">`;
  } else {
    titleContainer.innerHTML = `<h1 class="text-2xl sm:text-4xl font-black text-white">${titleText}</h1>`;
  }

  const date = details.release_date || details.first_air_date || '';
  document.getElementById('detailYear').innerText = date ? date.split('-')[0] : 'N/A';
  document.getElementById('detailRating').innerText = `⭐ ${details.vote_average ? details.vote_average.toFixed(1) : 'N/A'}`;
  
  const runtime = details.runtime || (details.episode_run_time ? details.episode_run_time[0] : null);
  document.getElementById('detailRuntime').innerText = runtime ? `${runtime} mins` : (isTv ? 'TV Series' : 'N/A');

  document.getElementById('detailGenres').innerHTML = (details.genres || []).map(g => 
    `<span class="bg-gray-800 text-gray-300 text-[10px] sm:text-xs px-2.5 py-1 rounded-full border border-gray-700 font-medium">${g.name}</span>`
  ).join('');

  document.getElementById('detailOverview').innerText = details.overview || 'Tiada sinopsis tersedia.';

  const topCast = (credits?.cast || []).slice(0, 8);
  document.getElementById('detailCast').innerHTML = topCast.map(c => `
    <div class="flex-shrink-0 w-16 text-center space-y-1">
      <img src="${c.profile_path ? 'https://image.tmdb.org/t/p/w185' + c.profile_path : 'https://via.placeholder.com/185x278?text=No+Pic'}" 
           alt="${c.name}" class="w-12 h-12 rounded-full object-cover mx-auto border border-gray-800">
      <p class="text-[10px] font-medium text-gray-300 truncate">${c.name}</p>
    </div>
  `).join('');

  if (isTv && details.seasons) {
    const seasonSelect = document.getElementById('seasonSelect');
    const validSeasons = details.seasons.filter(s => s.season_number > 0);
    
    seasonSelect.innerHTML = validSeasons.map(s => 
      `<option value="${s.season_number}">Season ${s.season_number} (${s.episode_count} Episod)</option>`
    ).join('');

    const initialSeason = validSeasons.length > 0 ? validSeasons[0].season_number : 1;
    seasonSelect.value = initialSeason;
    loadSeasonEpisodes(id, initialSeason, titleText);

    const watchBtn = document.getElementById('detailWatchBtn');
    if (watchBtn) {
      watchBtn.innerText = '▶ Watch Season 1 Ep 1';
      watchBtn.onclick = () => playMedia(id, 'tv', titleText, initialSeason, 1);
    }
  } else {
    renderHorizontalCards(data.similar?.results || [], 'similarGrid', 'movie');
    renderHorizontalCards(data.recommendations?.results || [], 'recommendationsGrid', 'movie');
    
    const watchBtn = document.getElementById('detailWatchBtn');
    if (watchBtn) {
      watchBtn.innerText = '▶ Watch Movie';
      watchBtn.onclick = () => playMedia(id, 'movie', titleText);
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadSeasonEpisodes(tvId, seasonNum, tvTitle) {
  const grid = document.getElementById('episodesGrid');
  if (!grid) return;
  grid.innerHTML = '<p class="col-span-full text-xs text-gray-500">Memuatkan episod...</p>';

  const data = await fetchSeasonEpisodes(tvId, seasonNum);
  if (!data || !data.episodes || data.episodes.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-xs text-gray-500">Tiada episod ditemui.</p>';
    return;
  }

  grid.innerHTML = data.episodes.map(ep => `
    <div tabindex="0" 
         onclick="playMedia(${tvId}, 'tv', '${tvTitle.replace(/'/g, "\\'")}', ${seasonNum}, ${ep.episode_number})"
         onkeydown="if(event.key==='Enter') playMedia(${tvId}, 'tv', '${tvTitle.replace(/'/g, "\\'")}', ${seasonNum}, ${ep.episode_number})"
         class="group cursor-pointer bg-gray-900/80 rounded-xl overflow-hidden border border-gray-800 hover:border-red-600 transition p-2 space-y-2 focus:outline-none">
      
      <div class="relative w-full aspect-video bg-gray-950 rounded-lg overflow-hidden">
        <img src="${ep.still_path ? 'https://image.tmdb.org/t/p/w300' + ep.still_path : 'https://via.placeholder.com/300x169?text=No+Thumbnail'}" 
             alt="${ep.name}" class="w-full h-full object-cover">
        <span class="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
          EP ${ep.episode_number}
        </span>
      </div>

      <div>
        <p class="text-xs font-bold text-gray-200 truncate group-hover:text-red-500 transition">${ep.episode_number}. ${ep.name}</p>
        <p class="text-[10px] text-gray-400 line-clamp-2 mt-1">${ep.overview || 'Tiada ringkasan episod.'}</p>
      </div>
    </div>
  `).join('');
}

function onSeasonChange(seasonNum) {
  if (window.currentDetailsTvId) {
    const titleText = document.getElementById('detailTitleContainer').innerText;
    loadSeasonEpisodes(window.currentDetailsTvId, seasonNum, titleText);
  }
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
   LOGIK WATCH PAGE & PROVIDER CONFIG
   ========================================== */

const STREAM_PROVIDERS = {
  vidlink: {
    allow: "autoplay; encrypted-media; fullscreen",
    buildUrl: (type, id, season, episode) => {
      const base = type === 'tv' 
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
        : `https://vidlink.pro/movie/${id}`;
      return `${base}?player=jw`;
    }
  },
  vidfast: {
    allow: "autoplay; fullscreen",
    buildUrl: (type, id, season, episode) => {
      const base = type === 'tv' 
        ? `https://vidfast.vc/tv/${id}/${season}/${episode}`
        : `https://vidfast.vc/movie/${id}`;
      return `${base}?sub=en,my`;
    }
  },
  vidsrc: {
    allow: "autoplay; fullscreen; encrypted-media",
    buildUrl: (type, id, season, episode) => {
      // Customization VidSrc
      return type === 'tv' 
        ? `https://vidsrcme.ru/embed/tv/${id}/${season}/${episode}?ds_lang=en,my`
        : `https://vidsrcme.ru/embed/movie/${id}?ds_lang=en,my`;      
    }
  }
};

function playMedia(id, type, title, season = 1, episode = 1) {
  window.currentTmdbId = id;
  window.currentMediaType = type;
  window.currentSeason = season;
  window.currentEpisode = episode;
  window.currentProvider = 'vidlink';

  hideAllSections();
  document.getElementById('watchPageSection')?.classList.remove('hidden');
  
  const displayTitle = type === 'tv' ? `${title} (S${season} E${episode})` : title;
  document.getElementById('watchMediaTitle').innerText = displayTitle;

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

function updateStreamUrl() {
  const iframe = document.getElementById('videoPlayer');
  if (!iframe) return;

  const providerConfig = STREAM_PROVIDERS[window.currentProvider] || STREAM_PROVIDERS.vidlink;

  iframe.setAttribute('allow', providerConfig.allow);

  const streamUrl = providerConfig.buildUrl(
    window.currentMediaType,
    window.currentTmdbId,
    window.currentSeason,
    window.currentEpisode
  );

  iframe.src = streamUrl;
}

function changeProvider(provider) {
  if (!STREAM_PROVIDERS[provider]) return;
  
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

function closeWatchPage() {
  const iframe = document.getElementById('videoPlayer');
  if (iframe) iframe.src = '';
  hideAllSections();
  document.getElementById('mainLayout')?.classList.remove('hidden');
  document.getElementById('homepageSections')?.classList.remove('hidden');
}

/* ==========================================
   INITIALIZATION & EVENT LISTENERS
   ========================================== */
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
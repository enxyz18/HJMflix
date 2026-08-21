/* ==========================================
   PANGGILAN API & FETCH DATA (TMDB / VERCEL)
   ========================================== */

// Fetch section grid homepage
async function fetchSection(category, gridId, mediaType, page = 1, limit = 20) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '<p class="col-span-full text-gray-500 text-xs py-4">Memuatkan...</p>';

  try {
    const res = await fetch(`/api/movies?category=${category}&page=${page}`);
    const data = await res.json();
    if (data.results) {
      displayGrid(data.results.slice(0, limit), grid, mediaType, limit === 10);
    } else {
      grid.innerHTML = `<p class="col-span-full text-gray-500 text-xs py-4">Tiada kandungan.</p>`;
    }
  } catch (err) {
    grid.innerHTML = `<p class="col-span-full text-red-500 text-xs">Gagal memuatkan data.</p>`;
  }
}

// Fetch details filem/TV show
async function fetchMediaDetails(id, type) {
  try {
    const res = await fetch(`/api/movies?type=details&id=${id}&media_type=${type}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Gagal fetch details:", err);
    return null;
  }
}

// Fetch senarai episod mengikut musim
async function fetchSeasonEpisodes(tvId, seasonNumber) {
  try {
    const res = await fetch(`/api/movies?type=season_episodes&id=${tvId}&season_number=${seasonNumber}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Gagal fetch episodes:", err);
    return null;
  }
}

// Carian
async function searchMedia(page = 1) {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput ? searchInput.value.trim() : '';
  if (!query) return loadHomepage();

  window.currentSearchPage = page;

  hideAllSections();
  document.getElementById('mainLayout')?.classList.remove('hidden');
  const searchSection = document.getElementById('searchResultsSection');
  const searchGrid = document.getElementById('searchGrid');
  
  if (searchSection) searchSection.classList.remove('hidden');
  document.getElementById('searchTitle').innerText = `Hasil Carian: "${query}" (Page ${page})`;
  document.getElementById('searchPageNum').innerText = `Page ${page}`;
  
  const prevBtn = document.getElementById('searchPrevBtn');
  if (prevBtn) prevBtn.disabled = page <= 1;

  if (searchGrid) searchGrid.innerHTML = '<p class="col-span-full text-gray-500 text-sm py-8">Mencari...</p>';

  try {
    const res = await fetch(`/api/movies?type=search&query=${encodeURIComponent(query)}&page=${page}`);
    const data = await res.json();
    displayGrid(data.results || [], searchGrid, 'multi', false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    if (searchGrid) searchGrid.innerHTML = '<p class="col-span-full text-red-500 text-sm">Gagal carian.</p>';
  }
}
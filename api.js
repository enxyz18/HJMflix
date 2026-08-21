/* ==========================================
   PANGGILAN API & FETCH DATA (TMDB / VERCEL)
   ========================================== */

// Memuatkan data mengikut kategori dan papar dalam grid
async function fetchSection(category, gridId, mediaType, page = 1, limit = 20) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '<p class="col-span-full text-gray-500 text-xs py-4">Memuatkan...</p>';

  try {
    const res = await fetch(`/api/movies?category=${category}&page=${page}`);
    const data = await res.json();
    if (data.results) {
      displayGrid(data.results.slice(0, limit), grid, mediaType, limit === 10);
    }
  } catch (err) {
    grid.innerHTML = `<p class="col-span-full text-red-500 text-xs">Gagal memuatkan data.</p>`;
  }
}

// Carian Filem / TV Series
async function searchMedia(page = 1) {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return loadHomepage();

  currentSearchPage = page;

  hideAllSections();
  document.getElementById('mainLayout').classList.remove('hidden');
  const searchSection = document.getElementById('searchResultsSection');
  const searchGrid = document.getElementById('searchGrid');
  
  searchSection.classList.remove('hidden');
  document.getElementById('searchTitle').innerText = `Hasil Carian: "${query}" (Page ${page})`;
  document.getElementById('searchPageNum').innerText = `Page ${page}`;
  document.getElementById('searchPrevBtn').disabled = page <= 1;

  searchGrid.innerHTML = '<p class="col-span-full text-gray-500 text-sm py-8">Mencari...</p>';

  try {
    const res = await fetch(`/api/movies?type=search&query=${encodeURIComponent(query)}&page=${page}`);
    const data = await res.json();
    displayGrid(data.results || [], searchGrid, 'multi', false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    searchGrid.innerHTML = '<p class="col-span-full text-red-500 text-sm">Gagal carian.</p>';
  }
}
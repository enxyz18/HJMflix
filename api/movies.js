export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const API_KEY = process.env.TMDB_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "TMDB_API_KEY belum ditetapkan di Vercel!" });
  }

  const { type, query, category, page = 1 } = req.query;

  // 1. Carian Pintar dengan Paginasi
  if (type === 'search' && query) {
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      let combinedResults = [];

      if (data.results) {
        for (const item of data.results) {
          if (item.media_type === 'movie' || item.media_type === 'tv') {
            combinedResults.push(item);
          } else if (item.media_type === 'person' && item.known_for) {
            item.known_for.forEach(work => {
              if (work.media_type === 'movie' || work.media_type === 'tv') {
                combinedResults.push(work);
              }
            });
          }
        }
      }

      const uniqueResults = Array.from(new Map(combinedResults.map(m => [m.id, m])).values());

      return res.status(200).json({ 
        results: uniqueResults, 
        page: data.page || 1, 
        total_pages: data.total_pages || 1 
      });
    } catch (error) {
      return res.status(500).json({ error: "Gagal memproses carian" });
    }
  } 

  // 2. Kategori Platform dengan Paginasi
  let url = '';
  switch (category) {
    case 'netflix_movies':
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=8&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
    case 'netflix_tv':
      url = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_watch_providers=8&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
    case 'prime_movies':
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=119&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
    case 'prime_tv':
      url = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_watch_providers=119&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
    case 'disney_movies':
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=122&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
    case 'disney_tv':
      url = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_watch_providers=122&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
    case 'hbo_movies':
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=1899&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
    case 'hbo_tv':
      url = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_watch_providers=1899&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
    default:
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=8&watch_region=MY&sort_by=popularity.desc&page=${page}`;
      break;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.status_message || "TMDB Error" });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Gagal menyambung ke pelayan TMDB" });
  }
}
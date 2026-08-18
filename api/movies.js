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

  const { type, query, category } = req.query;
  let url = '';

  // 1. Carian Filem & Siri TV
  if (type === 'search' && query) {
    url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  } 
  // 2. Kategori Top 10 mengikut Provider (Region: MY)
  else {
    switch (category) {
      case 'netflix_movies':
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=8&watch_region=MY&sort_by=popularity.desc`;
        break;
      case 'netflix_tv':
        url = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_watch_providers=8&watch_region=MY&sort_by=popularity.desc`;
        break;
      case 'prime_movies':
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=119&watch_region=MY&sort_by=popularity.desc`;
        break;
      case 'prime_tv':
        url = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_watch_providers=119&watch_region=MY&sort_by=popularity.desc`;
        break;
      default:
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_watch_providers=8&watch_region=MY&sort_by=popularity.desc`;
        break;
    }
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
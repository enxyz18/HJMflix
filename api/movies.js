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
  // 2. Kategori Homepage
  else {
    switch (category) {
      case 'top_rated_movies':
        url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`;
        break;
      case 'popular_tv':
        url = `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`;
        break;
      case 'top_rated_tv':
        url = `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`;
        break;
      case 'popular_movies':
      default:
        url = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;
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
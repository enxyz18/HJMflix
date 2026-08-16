export default async function handler(req, res) {
  // Ambil API key daripada Environment Variables Vercel (Penting!)
  const API_KEY = process.env.TMDB_API_KEY; 
  const { type, query } = req.query;

  let url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`;

  if (type === 'search' && query) {
    url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal mengambil data dari TMDB' });
  }
}
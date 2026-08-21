module.exports = async (req, res) => {
  const TMDB_API_KEY = process.env.TMDB_API_KEY || '6f4810fbefb85fb2fb5aebe5dc26f0f1';
  const { type, category, query, page = 1, id, media_type, season_number = 1 } = req.query;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. DATA TERPERINCI DETAILS PAGE
    if (type === 'details') {
      if (!id) return res.status(400).json({ error: 'ID filem tidak diberikan' });
      const mType = media_type || 'movie';

      const [detailsRes, creditsRes, imagesRes, similarRes, recsRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/${mType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/${mType}/${id}/credits?api_key=${TMDB_API_KEY}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/${mType}/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=en,null`),
        fetch(`https://api.themoviedb.org/3/${mType}/${id}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
        fetch(`https://api.themoviedb.org/3/${mType}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`)
      ]);

      const details = await detailsRes.json();
      const credits = await creditsRes.json();
      const images = await imagesRes.json();
      const similar = await similarRes.json();
      const recommendations = await recsRes.json();

      return res.status(200).json({ details, credits, images, similar, recommendations });
    }

    // 2. DATA EPISOD BAGI MUSIM TV
    if (type === 'season_episodes') {
      const resSeason = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season_number}?api_key=${TMDB_API_KEY}&language=en-US`);
      const seasonData = await resSeason.json();
      return res.status(200).json(seasonData);
    }

    // 3. CARIAN (SEARCH)
    if (type === 'search') {
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
      );
      const searchData = await searchRes.json();
      return res.status(200).json(searchData);
    }

    // 4. PLATFORM CATEGORIES
    let endpoint = '';
    if (category === 'netflix_movies') endpoint = `/discover/movie?with_watch_providers=8&watch_region=MY`;
    else if (category === 'netflix_tv') endpoint = `/discover/tv?with_watch_providers=8&watch_region=MY`;
    else if (category === 'prime_movies') endpoint = `/discover/movie?with_watch_providers=119&watch_region=MY`;
    else if (category === 'prime_tv') endpoint = `/discover/tv?with_watch_providers=119&watch_region=MY`;
    else if (category === 'disney_movies') endpoint = `/discover/movie?with_watch_providers=122&watch_region=MY`;
    else if (category === 'disney_tv') endpoint = `/discover/tv?with_watch_providers=122&watch_region=MY`;
    else if (category === 'hbo_movies') endpoint = `/discover/movie?with_watch_providers=1899&watch_region=MY`;
    else if (category === 'hbo_tv') endpoint = `/discover/tv?with_watch_providers=1899&watch_region=MY`;
    else endpoint = `/movie/popular`;

    const response = await fetch(`https://api.themoviedb.org/3${endpoint}&api_key=${TMDB_API_KEY}&page=${page}`);
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Ralat Server Backend', message: error.message });
  }
};
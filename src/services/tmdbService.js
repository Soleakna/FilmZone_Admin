
// Reads from .env (Vite) or user-saved key in localStorage
export const getTmdbApiKey = () => {
  return (
    import.meta.env.VITE_TMDB_API_READ_ACCESS_TOKEN ||
    import.meta.env.VITE_TMDB_ACCESS_TOKEN ||
    import.meta.env.VITE_TMDB_API_KEY ||
    localStorage.getItem("tmdb_admin_api_key") ||
    ""
  );
};

export const setTmdbApiKey = (key) => {
  if (key) {
    localStorage.setItem("tmdb_admin_api_key", key.trim());
  } else {
    localStorage.removeItem("tmdb_admin_api_key");
  }
};

/**
 * Live Dynamic Search on TMDB Cloud Database
 * @param {string} query Search keyword (e.g. "Avatar", "Deadpool", "Inception")
 * @param {number} page Page number (default 1)
 */
export async function searchLiveTmdb(query, page = 1) {
  if (!query || !query.trim()) return { results: [], total_results: 0 };

  const key = getTmdbApiKey();
  const isBearer = key.length > 50; // TMDB v4 Read Access Tokens are long JWT strings

  const url = isBearer
    ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`
    : `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;

  const headers = {
    "Content-Type": "application/json",
  };

  if (isBearer) {
    headers["Authorization"] = `Bearer ${key}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`TMDB error status: ${res.status}`);
    }
    const data = await res.json();
    return {
      results: (data.results || []).map((m) => ({
        id: m.id,
        tmdbId: m.id,
        title: m.title,
        overview: m.overview,
        release_date: m.release_date || "",
        year: m.release_date ? m.release_date.slice(0, 4) : "2026",
        poster_path: m.poster_path
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
        backdrop_path: m.backdrop_path
          ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
          : "https://image.tmdb.org/t/p/original/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg",
        vote_average: m.vote_average ? Number(m.vote_average.toFixed(1)) : 8.0,
        genre_ids: m.genre_ids || [],
      })),
      total_results: data.total_results || 0,
      total_pages: data.total_pages || 0,
    };
  } catch (err) {
    console.warn("Live TMDB search error:", err);
    return { error: err.message, results: [] };
  }
}

export async function fetchLiveTmdbDetails(tmdbId) {
  const key = getTmdbApiKey();
  const isBearer = key.length > 50;

  const url = isBearer
    ? `https://api.themoviedb.org/3/movie/${tmdbId}?append_to_response=credits,videos`
    : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${key}&append_to_response=credits,videos`;

  const headers = { "Content-Type": "application/json" };
  if (isBearer) headers["Authorization"] = `Bearer ${key}`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`TMDB details status: ${res.status}`);
    const data = await res.json();

    const hours = Math.floor((data.runtime || 120) / 60);
    const mins = (data.runtime || 120) % 60;
    const formattedDuration = `${hours}:${mins < 10 ? "0" : ""}${mins}:00`;

    return {
      title: data.title,
      year: data.release_date ? data.release_date.slice(0, 4) : "2026",
      duration: formattedDuration,
      genres: (data.genres || []).map((g) => g.name).join(", ") || "Action",
      poster_path: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      overview: data.overview,
      vote_average: data.vote_average
        ? Number(data.vote_average.toFixed(1))
        : 8.5,
      trailer_key:
        data.videos?.results?.find((v) => v.site === "YouTube")?.key || "",
    };
  } catch (err) {
    console.warn("Fetch details error:", err);
    return null;
  }
}

// Uses your cinema backend, not the TMDB base URL.
// Already set in your .env:  VITE_CINEMA_API_BASE_URL=https://cinema-booking-api.eunglyzhia.com/api/v1
const BASE_URL = import.meta.env.VITE_CINEMA_API_BASE_URL ?? "";

async function request(path, { headers, ...options } = {}) {
  // Your project has an `auth` folder and a `firebase` folder, so the
  // cinema API likely expects a bearer token from your own login, not the
  // TMDB token. Wire up whichever of these matches how you log admins in:
  //
  // Firebase:
  //   const token = await auth.currentUser?.getIdToken();
  // Custom JWT stored after login:
  //   const token = localStorage.getItem("token");
  //
  // then add `Authorization: `Bearer ${token}`` to the headers below.
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...headers },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // response had no JSON body
    }
    throw new Error(message);
  }

  return res.status === 204 ? null : res.json();
}

export const getConcessions = () => request("/concessions");

export const createConcession = (data) =>
  request("/concessions", { method: "POST", body: JSON.stringify(data) });

export const updateConcession = (uuid, data) =>
  request(`/concessions/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteConcession = (uuid) =>
  request(`/concessions/${uuid}`, { method: "DELETE" });
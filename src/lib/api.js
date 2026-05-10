const TOKEN_KEY = "crrsa-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const body = options.body;
  if (body !== undefined && !(body instanceof FormData)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  const data = text ? (() => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  })() : null;
  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText || "Request failed";
    const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function apiJson(path, options = {}) {
  const { body, ...rest } = options;
  const init = { ...rest };
  if (body !== undefined && !(body instanceof FormData)) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  } else if (body instanceof FormData) {
    init.body = body;
  }
  return apiFetch(path, init);
}

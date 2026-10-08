// Multipart upload with real progress and cancel.
//
// RTK Query's fetch-based baseQuery can't report upload progress, so large book
// PDFs go through XMLHttpRequest instead. Rejections use the same {status, data}
// shape as RTK errors so utils/apiError.js can describe them.

import { API_BASE_URL } from "../Api/api";
import { store } from "../Redux/store";
import { clearAuth, setAuth } from "../Redux/features/auth/authSlice";
import { markUploadEnd, markUploadStart } from "../lib/uploadActivity";

const readAuth = () => {
  const state = store.getState().auth || {};
  let access = state.accessToken;
  let refresh = state.refreshToken;
  if (!access || !refresh) {
    try {
      const stored = JSON.parse(localStorage.getItem("auth") || "null");
      access = access || stored?.access;
      refresh = refresh || stored?.refresh;
    } catch {
      /* ignore unreadable storage */
    }
  }
  return { access, refresh, role: state.role };
};

const tokenExpiresAt = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
};

let refreshing = null;

const refreshAccessToken = () => {
  if (refreshing) return refreshing;
  const { refresh, role } = readAuth();
  if (!refresh) return Promise.resolve(null);

  refreshing = fetch(`${API_BASE_URL}auth/jwt/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })
    .then(async (res) => {
      if (!res.ok) {
        store.dispatch(clearAuth());
        return null;
      }
      const data = await res.json();
      store.dispatch(setAuth({ access: data.access, refresh: data.refresh || refresh, role }));
      return data.access;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

// Access tokens last 15 minutes. Refresh before a long upload starts so it
// isn't rejected with a 401 after the whole file has already been sent.
const getFreshAccessToken = async () => {
  const { access } = readAuth();
  if (access && tokenExpiresAt(access) - Date.now() > 2 * 60 * 1000) return access;
  return (await refreshAccessToken()) || access;
};

const sendOnce = ({ url, method, formData, token, onProgress, signal }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (token) xhr.setRequestHeader("Authorization", `JWT ${token}`);
    xhr.setRequestHeader("Accept", "application/json");

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }

    xhr.onload = () => {
      let data = xhr.responseText;
      try {
        data = data ? JSON.parse(data) : null;
      } catch {
        /* non-JSON body (proxy error page): keep the text */
      }
      resolve({ status: xhr.status, data });
    };
    xhr.onerror = () => reject({ status: "FETCH_ERROR", data: null });
    xhr.ontimeout = () => reject({ status: "TIMEOUT_ERROR", data: null });
    xhr.onabort = () => reject({ status: "ABORTED", aborted: true, data: null });

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(formData);
  });

/**
 * @param {string} path  API path without a leading slash, e.g. "books/my-book/files/digital_file/"
 * @param {FormData} formData
 * @param {{onProgress?: (percent:number)=>void, signal?: AbortSignal, method?: string}} options
 * @returns {Promise<any>} parsed JSON body; rejects with {status, data, aborted?}
 */
export const uploadWithProgress = async (path, formData, { onProgress, signal, method = "POST" } = {}) => {
  const url = `${API_BASE_URL}${path}`;
  markUploadStart();
  try {
    let token = await getFreshAccessToken();
    let res = await sendOnce({ url, method, formData, token, onProgress, signal });

    if (res.status === 401) {
      token = await refreshAccessToken();
      if (token) res = await sendOnce({ url, method, formData, token, onProgress, signal });
    }

    if (res.status >= 200 && res.status < 300) return res.data;
    throw {
      status: res.status,
      // A non-JSON body (HTML error page) is reported through the status alone.
      data: typeof res.data === "object" ? res.data : null,
    };
  } finally {
    markUploadEnd();
  }
};

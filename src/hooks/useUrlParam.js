import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// React Router does not queue setSearchParams calls: two calls in one event
// (say "set the search" and "go back to page 1") each start from the same old
// params, and the second erases the first. So changes made in the same tick are
// collected here and written to the URL once.
let pending = null;
export const updateUrlParams = (searchParams, setSearchParams, mutate) => {
  if (!pending) {
    pending = new URLSearchParams(searchParams);
    queueMicrotask(() => {
      const params = pending;
      pending = null;
      setSearchParams(params, { replace: true });
    });
  }
  mutate(pending);
};

/**
 * Like useState, but the value lives in the URL (?search=abc&page=3).
 * Used for list filters and page numbers so that opening an item and coming
 * back (Back button, or a refresh) lands on the same list as before.
 * A value equal to the fallback is left out of the URL to keep it short.
 * Updates replace the history entry, so typing in a search box does not fill
 * the Back button with one entry per keystroke.
 *
 *   const [search, setSearch] = useUrlParam("search", "");
 *   const [page, setPage] = useUrlParam("page", 1);   // numbers stay numbers
 */
const useUrlParam = (key, fallback = "") => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const isNumber = typeof fallback === "number";

  let value = fallback;
  if (raw !== null && raw !== "") {
    if (isNumber) {
      const n = Number(raw);
      value = Number.isFinite(n) && n > 0 ? n : fallback;
    } else {
      value = raw;
    }
  }

  const setValue = useCallback(
    (next) => {
      updateUrlParams(searchParams, setSearchParams, (params) => {
        const resolved = typeof next === "function" ? next(value) : next;
        if (resolved === fallback || resolved === "" || resolved == null) {
          params.delete(key);
        } else {
          params.set(key, String(resolved));
        }
      });
    },
    [key, fallback, value, searchParams, setSearchParams],
  );

  return [value, setValue];
};

export default useUrlParam;

/**
 * Sends a list back to page 1 when its filters change, but not on first
 * render. (A plain effect would also fire on mount and throw away a ?page=3
 * that was just read from the URL.)
 *
 *   useResetPage(setPage, [search, category]);
 */
export const useResetPage = (setPage, filters) => {
  const key = JSON.stringify(filters);
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current !== key) {
      previous.current = key;
      setPage(1);
    }
  }, [key, setPage]);
};

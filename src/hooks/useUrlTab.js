import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { updateUrlParams } from "./useUrlParam";

/**
 * A tab (or sub-view) that lives in the URL as ?tab=value instead of in
 * component state. That way the tab survives a refresh, can be linked to,
 * and the browser Back button returns to the same tab.
 *
 * The first allowed value is the default and is kept out of the URL.
 * Switching tabs replaces the history entry, so Back still means "leave this
 * page" and not "step through every tab I clicked".
 * Other query params (like ?type=) are left alone.
 *
 *   const [tab, setTab] = useUrlTab(["blogs", "videos"]);
 */
const useUrlTab = (allowed, key = "tab") => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fallback = allowed[0];
  const raw = searchParams.get(key);
  const tab = allowed.includes(raw) ? raw : fallback;

  const setTab = useCallback(
    (next) => {
      updateUrlParams(searchParams, setSearchParams, (params) => {
        if (next === fallback) params.delete(key);
        else params.set(key, next);
      });
    },
    [fallback, key, searchParams, setSearchParams],
  );

  return [tab, setTab];
};

export default useUrlTab;

import React from "react";

const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Returns the 11-character YouTube video ID from either a bare ID or any
 * common YouTube link (watch, youtu.be, embed, shorts, live). Empty string
 * when the input isn't one.
 */
export function extractYouTubeId(input) {
  const value = (input || "").trim();
  if (ID_PATTERN.test(value)) return value;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id =
        url.searchParams.get("v") ||
        url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ||
        "";
    }
    return ID_PATTERN.test(id) ? id : "";
  } catch {
    return "";
  }
}

export const youTubeWatchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

/** Shows the video the way it will load for students, plus its link. */
const YouTubePreview = ({ videoId }) => {
  if (!ID_PATTERN.test(videoId || "")) return null;
  return (
    <div className="space-y-3">
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-stone-200 bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title="YouTube video preview"
          allow="encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
      <a
        href={youTubeWatchUrl(videoId)}
        target="_blank"
        rel="noopener noreferrer"
        className="block truncate text-sm font-bold text-blue-600 hover:underline inter-font"
      >
        {youTubeWatchUrl(videoId)}
      </a>
    </div>
  );
};

export default YouTubePreview;

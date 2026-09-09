// Tracks whether a video upload is actively transferring bytes in this tab,
// independent of any component's mount state — a background upload keeps
// running after its modal is closed, so this can't live in React state.
let activeUploads = 0;

export const markUploadStart = () => {
  activeUploads += 1;
};

export const markUploadEnd = () => {
  activeUploads = Math.max(0, activeUploads - 1);
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (activeUploads > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

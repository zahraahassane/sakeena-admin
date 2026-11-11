import { Download } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLazyGetSubmissionFileDownloadLinkQuery } from "../Api/adminApi";

// Download for a student's video stored on Bunny: asks the server for a
// short-lived link, then opens it.
const VideoDownloadButton = ({ submissionId, fileId, className = "", children }) => {
  const [getLink] = useLazyGetSubmissionFileDownloadLinkQuery();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const { url } = await getLink({ submissionId, fileId }).unwrap();
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Could not start the download. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={busy} className={className}>
      {children ?? <Download className="w-5 h-5" />}
    </button>
  );
};

export default VideoDownloadButton;

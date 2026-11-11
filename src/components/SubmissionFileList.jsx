import { Download, FileText } from "lucide-react";
import { mediaKind } from "../utils/submissionFiles";
import VideoDownloadButton from "./VideoDownloadButton";

// Every file of a submission, with an inline player for audio and video.
const SubmissionFileList = ({ files, showPlayers = true, empty = "No files submitted." }) => {
  if (!files || files.length === 0) {
    return <p className="text-sm text-neutral-500">{empty}</p>;
  }
  return (
    <div className="space-y-3">
      {files.map((file) => {
        const kind = showPlayers ? mediaKind(file.name || file.url) : null;
        return (
          <div key={file.id ?? file.url} className="space-y-2">
            <div className="flex items-center justify-between gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:border-[#7AA4A5] transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-[#7AA4A5]/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#7AA4A5]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{file.name}</p>
                  {file.size && <p className="text-xs text-neutral-500">{file.size}</p>}
                </div>
              </div>
              {file.embedUrl && (
                <VideoDownloadButton
                  submissionId={file.submissionId}
                  fileId={file.id}
                  className="shrink-0 px-4 py-2 rounded-xl bg-[#7AA4A5] text-white text-sm font-medium hover:bg-[#6b9192] transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  Download
                </VideoDownloadButton>
              )}
              {file.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-4 py-2 rounded-xl bg-[#7AA4A5] text-white text-sm font-medium hover:bg-[#6b9192] transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>
            {file.embedUrl && (
              <div className="rounded-xl overflow-hidden border border-neutral-200 bg-black aspect-video">
                <iframe
                  src={file.embedUrl}
                  title={file.name}
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {kind === "audio" && (
              <audio src={file.url} controls preload="metadata" className="w-full" />
            )}
            {kind === "video" && (
              <div className="rounded-xl overflow-hidden border border-neutral-200 bg-black aspect-video flex items-center justify-center">
                <video src={file.url} controls className="max-h-full max-w-full" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SubmissionFileList;

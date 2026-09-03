// ========================================
// PROBLEM EVIDENCE
// ========================================
// Shared renderer for a problem's photo / video / document
// evidence so citizens, admins and partners all see the same
// attachments. Renders nothing when there is nothing to show.

const ProblemEvidence = ({ problem, showPhotos = false, className = "" }) => {
  if (!problem) {
    return null;
  }

  const images = problem.images || [];

  const videos = problem.videos || [];

  const documents = problem.documents || [];

  const hasPhotos = showPhotos && images.length > 0;

  const hasVideos = videos.length > 0;

  const hasDocuments = documents.length > 0;

  if (!hasPhotos && !hasVideos && !hasDocuments) {
    return null;
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {/* PHOTOS */}

      {hasPhotos && (
        <div>
          <p className="mb-2 text-sm font-semibold text-[#315d56]">
            📷 Photos ({images.length})
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <a
                key={image.publicId || `image-${index}`}
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-xl border border-[#e3e9e3]"
              >
                <img
                  src={image.url}
                  alt={`Problem photo ${index + 1}`}
                  className="h-28 w-full object-cover transition duration-200 hover:scale-105"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* VIDEOS */}

      {hasVideos && (
        <div>
          <p className="mb-2 text-sm font-semibold text-[#315d56]">
            🎥 Video Evidence ({videos.length})
          </p>

          <div className="grid gap-3">
            {videos.map((video, index) => (
              <video
                key={video.publicId || `video-${index}`}
                src={video.url}
                controls
                preload="metadata"
                className="w-full rounded-xl border border-[#e3e9e3] bg-black"
              >
                Your browser does not support video playback.
              </video>
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENTS */}

      {hasDocuments && (
        <div>
          <p className="mb-2 text-sm font-semibold text-[#315d56]">
            📄 Supporting Documents ({documents.length})
          </p>

          <div className="space-y-2">
            {documents.map((document, index) => (
              <a
                key={document.publicId || `document-${index}`}
                href={document.url}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center justify-between gap-3 rounded-lg border border-[#e3e9e3] bg-[#f7f8f5] px-4 py-2.5 text-sm transition hover:bg-[#eef4f0]"
              >
                <span className="truncate font-medium text-[#315d56]">
                  {document.originalName || `Document ${index + 1}`}
                </span>

                <span className="shrink-0 text-xs font-semibold text-[#087f70]">
                  View / Download →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemEvidence;

import { useEffect, useState } from "react";
import { getProblemById } from "../services/problemService";
import ProblemEvidence from "../components/ProblemEvidence";
import LifecycleStepper from "../components/LifecycleStepper";
import ResolutionProof from "../components/ResolutionProof";
import ExportBriefButton from "../components/ExportBriefButton";
import CitizenVerificationModal from "../components/CitizenVerificationModal";

const ProblemDetails = ({
  problemId,
  setCurrentPage,
  backPage,
}) => {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Current logged in user
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // ========================================
  // PHOTO VIEWER
  // ========================================

  const [selectedImage, setSelectedImage] = useState(null);

  // ========================================
  // FETCH PROBLEM
  // ========================================

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        setMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Please login first.");
          return;
        }

        const data = await getProblemById(
          problemId,
          token,
        );

        setProblem(data.problem);
      } catch (error) {
        console.error(
          "Fetch problem details error:",
          error,
        );

        setMessage(
          error.response?.data?.message ||
            "Failed to fetch problem details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // ========================================
  // BACK BUTTON TEXT
  // ========================================

  const backButtonText =
    backPage === "all-problems"
      ? "← Back to Explore Problems"
      : "← Back to My Problems";

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-lg font-medium text-[#5c6f69]">
            Loading problem details...
          </p>
        </div>
      </main>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (message) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] px-4 py-10">
        <div className="mx-auto max-w-4xl">

          <button
            type="button"
            onClick={() =>
              setCurrentPage(backPage)
            }
            className="mb-6 text-sm font-semibold text-[#0b6b60] transition hover:text-[#087f70]"
          >
            {backButtonText}
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {message}
          </div>

        </div>
      </main>
    );
  }

  // ========================================
  // NO PROBLEM
  // ========================================

  if (!problem) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-4xl">

        {/* ========================================
            ACTION BAR (BACK + EXPORT BRIEF)
        ======================================== */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setCurrentPage(backPage)
            }
            className="text-sm font-semibold text-[#0b6b60] transition hover:text-[#087f70]"
          >
            {backButtonText}
          </button>

          <ExportBriefButton />
        </div>

        {/* ========================================
            LIFECYCLE PROGRESS STEPPER
        ======================================== */}

        <LifecycleStepper
          status={problem.status}
          assignedPartner={problem.assignedPartner}
          createdAt={problem.createdAt}
          updatedAt={problem.updatedAt}
          className="mb-6"
        />

        {/* ========================================
            CITIZEN RESOLUTION VERIFICATION BANNER
        ======================================== */}
        {user?._id &&
          problem?.submittedBy &&
          String(problem.submittedBy._id || problem.submittedBy) === String(user._id) &&
          (problem.status === "solved" || problem.resolutionSubmitted) && (
            <div className="mb-6">
              {!problem.citizenFeedback?.isVerified ? (
                <div className="overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white shadow-sm">
                        ⭐
                      </span>
                      <div>
                        <span className="inline-block rounded-md bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                          Action Required: Ground Resolution Verification
                        </span>
                        <h3 className="mt-1 text-base font-bold text-emerald-950">
                          Has this problem been satisfactorily resolved in your area?
                        </h3>
                        <p className="mt-0.5 text-xs text-emerald-800/80">
                          As the reporting citizen, your verification confirms official completion or reopens the issue for administrative inspection.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
                    >
                      Verify or Dispute Resolution →
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl border p-4 shadow-sm ${
                  problem.citizenFeedback.isSatisfied
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-amber-200 bg-amber-50/80"
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span>{problem.citizenFeedback.isSatisfied ? "✓" : "⚠️"}</span>
                      <span>
                        {problem.citizenFeedback.isSatisfied
                          ? `You verified this resolution on ${problem.citizenFeedback.verifiedAt ? new Date(problem.citizenFeedback.verifiedAt).toLocaleDateString() : "recently"}`
                          : `You disputed this resolution on ${problem.citizenFeedback.reopenedAt ? new Date(problem.citizenFeedback.reopenedAt).toLocaleDateString() : "recently"}`}
                      </span>
                    </span>

                    {problem.citizenFeedback.isSatisfied ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        ⭐ {problem.citizenFeedback.rating} / 5 Stars
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        Grievance Reopened
                      </span>
                    )}
                  </div>

                  {problem.citizenFeedback.comments && (
                    <p className="mt-2 text-xs italic text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/50">
                      "{problem.citizenFeedback.comments}"
                    </p>
                  )}

                  {problem.citizenFeedback.reopenReason && (
                    <p className="mt-2 text-xs text-amber-900 bg-white/70 p-2.5 rounded-xl border border-amber-200/50">
                      <strong>Dispute Note:</strong> "{problem.citizenFeedback.reopenReason}"
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        {/* ========================================
            DUPLICATE MERGE BANNER
        ======================================== */}

        {problem.aiReviewStatus === "confirmed_duplicate" && problem.parentProblem && (
          <div className="mb-6 rounded-2xl border border-[#bcd9cf] bg-[#e9f4f0] p-5">
            <p className="text-sm font-semibold text-[#0a4f47]">
              Your report has been merged with an active problem to prioritize its resolution.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.hash = `problem-details?id=${problem.parentProblem._id}`;
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a]"
            >
              View Merged Problem
            </button>
          </div>
        )}


        {/* ========================================
            PROBLEM DETAILS CARD
        ======================================== */}

        <article className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm sm:p-10">

          {/* ========================================
              CATEGORY
          ======================================== */}

          <span className="inline-block rounded-full bg-[#d8ebe4] px-3 py-1 text-sm font-medium text-[#087f70]">
            {problem.category}
          </span>


          {/* ========================================
              TITLE
          ======================================== */}

          <h1 className="mt-5 text-3xl font-bold text-[#173d3a]">
            {problem.title}
          </h1>


          {/* ========================================
              DESCRIPTION
          ======================================== */}

          <section className="mt-8">

            <h2 className="text-lg font-semibold text-[#173d3a]">
              Description
            </h2>

            <p className="mt-3 leading-relaxed text-[#5c6f69]">
              {problem.description}
            </p>

          </section>


          {/* ========================================
              PROBLEM PHOTOS
          ======================================== */}

          {problem.images &&
            problem.images.length > 0 && (

            <section className="mt-8">

              <div className="mb-4 flex items-center justify-between">

                <h2 className="text-lg font-semibold text-[#173d3a]">
                  Problem Photos
                </h2>

                <span className="text-sm text-[#71827c]">
                  {problem.images.length}{" "}
                  {problem.images.length === 1
                    ? "photo"
                    : "photos"}
                </span>

              </div>


              {/* ========================================
                  PHOTO GRID
              ======================================== */}

              <div
                className={`grid gap-4 ${
                  problem.images.length === 1
                    ? "grid-cols-1"
                    : problem.images.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-3"
                }`}
              >

                {problem.images.map(
                  (image, index) => (

                  <button
                    type="button"
                    key={
                      image.publicId ||
                      `${problem._id}-${index}`
                    }
                    onClick={() =>
                      setSelectedImage(image.url)
                    }
                    className="group relative overflow-hidden rounded-2xl border border-[#e3e9e3] bg-[#f7f8f5] text-left"
                  >

                    <img
                      src={image.url}
                      alt={`Problem photo ${
                        index + 1
                      }`}
                      className={`w-full object-cover transition duration-300 group-hover:scale-105 ${
                        problem.images.length === 1
                          ? "max-h-[500px]"
                          : "h-64"
                      }`}
                      loading="lazy"
                    />


                    {/* HOVER LABEL */}

                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">

                      <span className="p-4 text-sm font-semibold text-white">
                        Click to view
                      </span>

                    </div>

                  </button>

                ))}

              </div>

            </section>

          )}


          {/* ========================================
              NO PHOTOS
          ======================================== */}

          {(!problem.images ||
            problem.images.length === 0) && (

            <section className="mt-8">

              <div className="rounded-xl bg-[#f2f5f1] p-4 text-center">

                <p className="text-sm text-[#71827c]">
                  📷 No photos were uploaded for this problem.
                </p>

              </div>

            </section>

          )}


          {/* ========================================
              VIDEO + DOCUMENT EVIDENCE
          ======================================== */}

          <ProblemEvidence problem={problem} className="mt-8" />


          {/* ========================================
              INFORMATION GRID
          ======================================== */}

          <section className="mt-8 grid gap-5 sm:grid-cols-2">

            {/* LOCATION */}

            <div className="rounded-xl bg-[#f2f5f1] p-5">

              <p className="text-sm font-medium text-[#71827c]">
                Location
              </p>

              <p className="mt-2 font-semibold text-[#173d3a]">
                📍 {problem.location}
              </p>

            </div>


            {/* STATUS */}

            <div className="rounded-xl bg-[#f2f5f1] p-5">

              <p className="text-sm font-medium text-[#71827c]">
                Status
              </p>

              <p className="mt-2 font-semibold capitalize text-[#173d3a]">
                {problem.status?.replace(
                  "_",
                  " ",
                )}
              </p>

            </div>

          </section>


          {/* ========================================
              LOCATION DETAILS
          ======================================== */}

          {problem.locationDetails && (

            <section className="mt-5 grid gap-5 sm:grid-cols-3">

              {/* DISTRICT */}

              <div className="rounded-xl bg-[#f2f5f1] p-5">

                <p className="text-sm font-medium text-[#71827c]">
                  District
                </p>

                <p className="mt-2 font-semibold text-[#173d3a]">
                  {problem.locationDetails.district ||
                    "Not available"}
                </p>

              </div>


              {/* STATE */}

              <div className="rounded-xl bg-[#f2f5f1] p-5">

                <p className="text-sm font-medium text-[#71827c]">
                  State
                </p>

                <p className="mt-2 font-semibold text-[#173d3a]">
                  {problem.locationDetails.state ||
                    "Not available"}
                </p>

              </div>


              {/* PINCODE */}

              <div className="rounded-xl bg-[#f2f5f1] p-5">

                <p className="text-sm font-medium text-[#71827c]">
                  Pincode
                </p>

                <p className="mt-2 font-semibold text-[#173d3a]">
                  {problem.locationDetails.pincode ||
                    "Not available"}
                </p>

              </div>

            </section>

          )}


          {/* ========================================
              ASSIGNED PARTNER
          ======================================== */}

          {problem.assignedPartner && (

            <section className="mt-8 rounded-2xl border border-[#d5c9ea] bg-[#f0ecf8] p-6">

              <h2 className="text-lg font-bold text-[#3d2f63]">
                Assigned Organization
              </h2>


              <p className="mt-3 text-xl font-bold text-[#173d3a]">
                🏛️{" "}
                {problem.assignedPartner.name}
              </p>


              {problem.assignedPartner.type && (

                <p className="mt-2 text-[#5c6f69]">

                  <span className="font-semibold">
                    Type:
                  </span>{" "}

                  {problem.assignedPartner.type}

                </p>

              )}


              {problem.assignedPartner.description && (

                <p className="mt-3 leading-relaxed text-[#5c6f69]">
                  {problem.assignedPartner.description}
                </p>

              )}


              {problem.assignedPartner.location && (

                <p className="mt-3 text-[#5c6f69]">
                  📍{" "}
                  {problem.assignedPartner.location}
                </p>

              )}


              {problem.assignedPartner.email && (

                <p className="mt-2 text-[#5c6f69]">
                  📧{" "}
                  {problem.assignedPartner.email}
                </p>

              )}


              {problem.assignedPartner.website && (

                <a
                  href={
                    problem.assignedPartner.website
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block font-semibold text-[#0b6b60] hover:text-[#087f70]"
                >
                  Visit Organization Website →
                </a>

              )}

            </section>

          )}


          {/* ========================================
              SUBMISSION DATE
          ======================================== */}

          <section className="mt-8 border-t border-[#e3e9e3] pt-6">

            <p className="text-sm text-[#71827c]">

              Submitted on{" "}

              {problem.createdAt
                ? new Date(
                    problem.createdAt,
                  ).toLocaleDateString()
                : "Unknown date"}

            </p>

          </section>

        </article>

        {/* ========================================
            RESOLUTION PROOF (SOLVED CHALLENGES)
        ======================================== */}

        <ResolutionProof problem={problem} className="mt-8" />

      </div>


      {/* ========================================
          FULL SCREEN IMAGE VIEWER
      ======================================== */}

      {selectedImage && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() =>
            setSelectedImage(null)
          }
        >

          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={() =>
              setSelectedImage(null)
            }
            className="absolute right-5 top-5 z-10 rounded-full bg-white px-4 py-2 text-xl font-bold text-[#173d3a] shadow-lg transition hover:bg-[#f7f8f5]"
          >
            ✕
          </button>


          {/* LARGE IMAGE */}

          <img
            src={selectedImage}
            alt="Problem photo enlarged"
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
          />

        </div>

      )}

      {/* ========================================
          CITIZEN VERIFICATION & DISPUTE MODAL
      ======================================== */}
      <CitizenVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        problem={problem}
        onFeedbackSubmitted={(updated) => setProblem(updated)}
      />

    </main>
  );
};

export default ProblemDetails;
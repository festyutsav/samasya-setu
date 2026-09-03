import { useEffect, useState } from "react";

import {
  getMyProblems,
  deleteMyProblem,
} from "../services/myProblemService";


// ========================================
// STATUS STYLES
// ========================================

const statusStyles = {
  submitted:
    "bg-[#f7ebd8] text-[#a25a1b]",

  under_review:
    "bg-[#d8ebe4] text-[#087f70]",

  assigned:
    "bg-[#e5dcf2] text-[#564680]",

  in_progress:
    "bg-[#fbe5d8] text-[#b05c2d]",

  solved:
    "bg-[#e1f1ed] text-[#087f70]",
};


// ========================================
// STATUS ACCENT EDGE COLORS
// ========================================

const statusEdgeColors = {
  submitted: "#f3ce7a",

  under_review: "#62a99b",

  assigned: "#b49ade",

  in_progress: "#e9a06b",

  solved: "#7fc8b2",
};


// ========================================
// CATEGORY NAMES
// ========================================

const categoryNames = {
  agriculture: "Agriculture",

  healthcare: "Healthcare",

  education: "Education",

  water: "Water Management",

  environment: "Environment",

  transportation: "Transportation",

  energy: "Energy",

  waste: "Waste Management",

  public_safety: "Public Safety",

  technology: "Technology",

  other: "Other",
};


// ========================================
// MY PROBLEMS
// ========================================

const MyProblems = ({
  setCurrentPage,
  setSelectedProblemId,
  setBackPage,
}) => {

  // ========================================
  // PROBLEMS
  // ========================================

  const [problems, setProblems] =
    useState([]);


  // ========================================
  // LOADING
  // ========================================

  const [loading, setLoading] =
    useState(true);


  // ========================================
  // MESSAGE
  // ========================================

  const [message, setMessage] =
    useState("");


  // ========================================
  // DELETING PROBLEM
  // ========================================

  const [deletingId, setDeletingId] =
    useState(null);


  // ========================================
  // FETCH MY PROBLEMS
  // ========================================

  useEffect(() => {

    const fetchMyProblems = async () => {

      try {

        setLoading(true);

        setMessage("");


        // ========================================
        // GET TOKEN
        // ========================================

        const token =
          localStorage.getItem("token");


        if (!token) {

          setMessage(
            "Please login first."
          );

          return;

        }


        // ========================================
        // GET PROBLEMS
        // ========================================

        const data =
          await getMyProblems(token);


        setProblems(
          data.problems || []
        );

      } catch (error) {

        setMessage(

          error.response?.data?.message ||

          "Failed to fetch your problems."

        );

      } finally {

        setLoading(false);

      }

    };


    fetchMyProblems();

  }, []);


  // ========================================
  // OPEN PROBLEM DETAILS
  // ========================================

  const handleViewDetails = (
    problemId
  ) => {

    setSelectedProblemId(
      problemId
    );

    setBackPage(
      "my-problems"
    );

    setCurrentPage(
      "problem-details"
    );

  };


  // ========================================
  // DELETE PROBLEM
  // ========================================

  const handleDeleteProblem = async (
    problemId
  ) => {

    // ========================================
    // CONFIRM DELETE
    // ========================================

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this problem? This action cannot be undone."
      );


    if (!confirmed) {

      return;

    }


    try {

      // ========================================
      // START DELETE LOADING
      // ========================================

      setDeletingId(
        problemId
      );

      setMessage("");


      // ========================================
      // GET TOKEN
      // ========================================

      const token =
        localStorage.getItem("token");


      if (!token) {

        setMessage(
          "Please login first."
        );

        return;

      }


      // ========================================
      // DELETE FROM BACKEND
      // ========================================

      await deleteMyProblem(
        problemId,
        token
      );


      // ========================================
      // REMOVE FROM FRONTEND
      // ========================================

      setProblems(
        (currentProblems) =>
          currentProblems.filter(
            (problem) =>
              problem._id !== problemId
          )
      );


    } catch (error) {

      console.error(
        "Delete problem error:",
        error
      );


      setMessage(

        error.response?.data?.message ||

        "Failed to delete problem."

      );

    } finally {

      // ========================================
      // STOP DELETE LOADING
      // ========================================

      setDeletingId(
        null
      );

    }

  };


  // ========================================
  // STATUS FILTER (chip strip)
  // ========================================

  const [statusFilter, setStatusFilter] =
    useState("all");


  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8ebe4] border-t-[#0b514a]" />
          <p className="text-lg font-medium text-[#5c6f69]">
            Loading your problems...
          </p>
        </div>
      </main>
    );
  }

  // ========================================
  // STATUS COUNTS
  // ========================================

  const statusCounts = problems.reduce(
    (counts, problem) => {
      const key = problem.status?.toLowerCase() || "other";

      counts[key] = (counts[key] || 0) + 1;

      return counts;
    },
    { all: problems.length }
  );

  const visibleProblems =
    statusFilter === "all"
      ? problems
      : problems.filter(
          (problem) =>
            problem.status?.toLowerCase() === statusFilter
        );

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ========================================
            HERO HEADER
        ======================================== */}

        <section className="ss-dash-hero ss-enter mb-8 p-8 shadow-lg sm:p-10">
          <div className="ss-hero-ring right-24 top-6 h-40 w-40" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9c985]">
              Citizen Portal
            </p>

            <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
              My Submitted Problems
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Track and manage the problems you have submitted. Follow each one
              from review through resolution.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span
                  className="h-2 w-2 rounded-full bg-[#7ee2c4]"
                  style={{ animation: "ss-pulse-dot 2s ease-in-out infinite" }}
                />
                {problems.length} total submitted
              </span>

              {statusCounts.solved > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                  {statusCounts.solved} solved
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ========================================
            ERROR MESSAGE
        ======================================== */}

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        {/* ========================================
            STATUS FILTER STRIP
        ======================================== */}

        {problems.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {[
              ["all", "All"],
              ["submitted", "Submitted"],
              ["under_review", "Under Review"],
              ["assigned", "Assigned"],
              ["in_progress", "In Progress"],
              ["solved", "Solved"],
            ]
              .filter(
                ([key]) =>
                  key === "all" || statusCounts[key]
              )
              .map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === key
                      ? "border-[#0b514a] bg-[#0b514a] text-white shadow-sm"
                      : "border-[#e3e9e3] bg-white text-[#5c6f69] hover:border-[#9cc5ba] hover:text-[#173d3a]"
                  }`}
                >
                  {label}

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      statusFilter === key
                        ? "bg-white/20 text-white"
                        : "bg-[#f2f5f1] text-[#5c6f69]"
                    }`}
                  >
                    {statusCounts[key] || 0}
                  </span>
                </button>
              ))}
          </div>
        )}

        {/* ========================================
            EMPTY STATE
        ======================================== */}

        {!message && problems.length === 0 ? (
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f4f0] text-[#0b6b60]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-[#173d3a]">
              No problems submitted yet
            </h2>

            <p className="mt-3 text-[#71827c]">
              Start by submitting a problem from your community.
            </p>
          </div>
        ) : !message && visibleProblems.length === 0 ? (
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-[#315d56]">
              No problems with this status
            </h2>

            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="mt-4 rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a]"
            >
              Show all problems
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {visibleProblems.map((problem) => {
              const normalizedStatus =
                problem.status?.toLowerCase() || "";

              const edgeColor = statusEdgeColors[normalizedStatus] || "#d8ebe4";

              return (
                <article
                  key={problem._id}
                  style={{ "--ss-edge": edgeColor }}
                  className="ss-accent-edge flex flex-col rounded-2xl border border-[#e3e9e3] bg-white p-6 pl-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* TITLE + STATUS */}

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-xl font-bold leading-snug text-[#173d3a]">
                      {problem.title}
                    </h2>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusStyles[normalizedStatus] ||
                        "bg-[#f7f8f5] text-[#315d56]"
                      }`}
                    >
                      {problem.status?.replace("_", " ")}
                    </span>
                  </div>

                  {/* CATEGORY */}

                  <div className="mt-2">
                    <span className="inline-flex rounded-full bg-[#d8ebe4] px-3 py-1 text-xs font-medium text-[#087f70]">
                      {categoryNames[problem.category] || "Other"}
                    </span>
                  </div>

                  {/* AI SUMMARY */}

                  {problem.aiSummary &&
                    problem.aiSummary.trim() !==
                      problem.description.trim() && (
                      <p className="mt-4 rounded-xl border-l-4 border-[#62a99b] bg-[#f2f5f1] px-4 py-3 text-sm italic leading-relaxed text-[#5c6f69]">
                        {problem.aiSummary}
                      </p>
                    )}

                  {/* DESCRIPTION */}

                  <p className="mt-4 line-clamp-4 leading-relaxed text-[#5c6f69]">
                    {problem.description}
                  </p>

                  {/* PROBLEM PHOTOS */}

                  {problem.images && problem.images.length > 0 && (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#315d56]">
                          Problem Photos
                        </p>

                        <span className="text-xs text-[#71827c]">
                          {problem.images.length}/3
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {problem.images.map((image, index) => (
                          <div
                            key={
                              image.publicId ||
                              `${problem._id}-${index}`
                            }
                            className="group overflow-hidden rounded-xl border border-[#e3e9e3] bg-[#f7f8f5]"
                          >
                            <img
                              src={image.url}
                              alt={`Problem photo ${index + 1}`}
                              className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LOCATION */}

                  <div className="mt-5 flex items-center gap-2 border-t border-[#eef2ee] pt-4 text-sm text-[#5c6f69]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-[#8fb5ad]" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>

                    <p>
                      <span className="font-semibold text-[#315d56]">
                        Location:
                      </span>{" "}
                      {problem.location}
                    </p>
                  </div>

                  {/* ASSIGNED PARTNER */}

                  {problem.assignedPartner && (
                    <div className="mt-4 rounded-xl border border-[#e0d7ef] bg-[#f0ecf8] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5a94]">
                        Assigned Organization
                      </p>

                      <p className="mt-1 text-base font-bold text-[#173d3a]">
                        {problem.assignedPartner.name}
                      </p>

                      {problem.assignedPartner.type && (
                        <p className="mt-1 text-sm capitalize text-[#5c6f69]">
                          {problem.assignedPartner.type}
                        </p>
                      )}

                      {problem.assignedPartner.location && (
                        <p className="mt-1 text-sm text-[#5c6f69]">
                          {problem.assignedPartner.location}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ACTION BUTTONS */}

                  <div className="mt-auto flex gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(problem._id)}
                      className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b514a] px-4 py-3 font-semibold text-white transition hover:bg-[#073f3a] hover:shadow-md"
                    >
                      View Details

                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                        <path d="M5 12h14m-6-6 6 6-6 6" />
                      </svg>
                    </button>

                    {normalizedStatus === "submitted" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProblem(problem._id)}
                        disabled={deletingId === problem._id}
                        className="rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === problem._id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};



export default MyProblems;
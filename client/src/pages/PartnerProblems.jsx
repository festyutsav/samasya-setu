import { useEffect, useState } from "react";

import {
  getPartnerProblems,
  updatePartnerProblemStatus,
} from "../services/partnerService";

import ProblemEvidence from "../components/ProblemEvidence";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import CategoryBadge from "../components/CategoryBadge";
import StatusBadge from "../components/StatusBadge";

const PartnerProblems = ({ setPartnerPage }) => {
  // ========================================
  // STATE
  // ========================================

  const [problems, setProblems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [problemToSolve, setProblemToSolve] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("success");

  const [refreshing, setRefreshing] =
    useState(false);

  // ========================================
  // FETCH PARTNER PROBLEMS
  // ========================================

  const fetchProblems = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setMessage("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setMessageType("error");

        setMessage(
          "Authentication token not found. Please login again."
        );

        return;
      }

      const data =
        await getPartnerProblems(token);

      setProblems(
        data.problems || []
      );

    } catch (error) {
      console.error(
        "Fetch partner problems error:",
        error
      );

      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Failed to fetch assigned problems."
      );

    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  // ========================================
  // LOAD PROBLEMS
  // ========================================

  useEffect(() => {
    fetchProblems();
  }, []);

  // ========================================
  // UPDATE PROBLEM STATUS
  // ========================================

  const handleStatusUpdate = async (
    problemId,
    status
  ) => {
    try {
      // Prevent duplicate updates

      if (updatingId) {
        return;
      }

      setUpdatingId(problemId);

      setMessage("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setMessageType("error");

        setMessage(
          "Authentication token not found. Please login again."
        );

        return;
      }

      const data =
        await updatePartnerProblemStatus(
          problemId,
          status,
          token
        );

      // ========================================
      // UPDATE UI IMMEDIATELY
      // ========================================

      setProblems(
        (currentProblems) =>
          currentProblems.map(
            (problem) =>
              problem._id === problemId
                ? data.problem
                : problem
          )
      );

      setMessageType("success");

      setMessage(
        "Problem status updated successfully."
      );

    } catch (error) {
      console.error(
        "Update problem error:",
        error
      );

      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Failed to update problem status."
      );

    } finally {
      setUpdatingId(null);
    }
  };

  // ========================================
  // FORMAT STATUS
  // ========================================

  const formatStatus = (status) => {
    if (!status) {
      return "";
    }

    return status
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

  // ========================================
  // STATUS STYLE
  // ========================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "assigned":
        return "bg-[#f7ebd8] text-[#a25a1b]";

      case "in_progress":
        return "bg-[#d8ebe4] text-[#087f70]";

      case "solved":
        return "bg-[#e1f1ed] text-[#087f70]";

      default:
        return "bg-[#f7f8f5] text-[#315d56]";
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">

            <p className="text-[#71827c]">
              Loading assigned problems...
            </p>

          </div>

        </div>

      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ========================================
            HEADER
        ======================================== */}

        {setPartnerPage && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setPartnerPage("dashboard")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe5df] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0b514a] shadow-sm transition hover:border-[#0b514a] hover:bg-[#e9f4f0]"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-semibold text-[#0b6b60]">
              PARTNER PORTAL
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[#173d3a]">
              Assigned Problems
            </h1>

            <p className="mt-2 text-[#5c6f69]">
              Manage and track the progress of
              problems assigned to your organization.
            </p>

          </div>

          {/* REFRESH */}

          <button
            onClick={() => fetchProblems(true)}
            disabled={refreshing}
            className="rounded-lg border border-[#dbe5df] bg-white px-4 py-2 text-sm font-semibold text-[#315d56] transition hover:bg-[#f2f5f1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {/* ========================================
            MESSAGE
        ======================================== */}

        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm ${
              messageType === "success"
                ? "border-[#bcd9cf] bg-[#e9f4f0] text-[#087f70]"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* ========================================
            EMPTY STATE
        ======================================== */}

        {problems.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No Assigned Problems Yet"
            description="When state administration assigns crowdsourced civic challenges to your university or industry team, they will appear here with field photos, geolocation, and citizen context."
            actionText="Explore Problem Directory"
            onAction={() => setPartnerPage("directory")}
          />
        ) : (
          /* ========================================
              PROBLEMS LIST
          ======================================== */

          <div className="grid gap-6">

            {problems.map(
              (problem) => (

                <article
                  key={problem._id}
                  className="group rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b4d4cb] hover:shadow-md"
                >

                  {/* TITLE */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <h2 className="text-xl font-bold text-[#173d3a] group-hover:text-[#087f70] transition-colors">
                        {problem.title}
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-2">

                        {/* STATUS */}
                        <StatusBadge status={problem.status} />

                        {/* CATEGORY */}
                        {problem.category && (
                          <CategoryBadge category={problem.category} />
                        )}

                        {/* SEVERITY */}
                        {problem.severity && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                              problem.severity === "high" || problem.severity === "critical"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : problem.severity === "medium"
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span>⚡ Severity: {problem.severity.toUpperCase()}</span>
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* DESCRIPTION */}

                  <p className="mt-5 leading-relaxed text-[#5c6f69]">
                    {problem.description}
                  </p>

                  {/* DETAILS */}

                  <div className="mt-6 grid gap-3 border-t border-[#eef2ee] pt-5 text-sm text-[#5c6f69] sm:grid-cols-2">

                    <div>

                      <span className="font-semibold text-[#315d56]">
                        📍 Location:
                      </span>

                      {" "}

                      {problem.location}

                    </div>

                    {problem.submittedBy && (
                      <div>

                        <span className="font-semibold text-[#315d56]">
                          👤 Submitted by:
                        </span>

                        {" "}

                        {problem.submittedBy.name}

                      </div>
                    )}

                  </div>

                  {/* ========================================
                      EVIDENCE (PHOTOS / VIDEO / DOCUMENTS)
                  ======================================== */}

                  <ProblemEvidence
                    problem={problem}
                    showPhotos
                    className="mt-6 border-t border-[#eef2ee] pt-5"
                  />

                  {/* ========================================
                      STATUS ACTIONS
                  ======================================== */}

                  <div className="mt-6 border-t border-[#eef2ee] pt-5">

                    <p className="mb-3 text-sm font-semibold text-[#315d56]">
                      Update Problem Status
                    </p>

                    <div className="flex flex-wrap gap-3">

                      {/* START WORK */}

                      {problem.status ===
                        "assigned" && (

                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              problem._id,
                              "in_progress"
                            )
                          }
                          disabled={
                            updatingId ===
                            problem._id
                          }
                          className="rounded-lg bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#b3ccc6]"
                        >
                          {updatingId ===
                          problem._id
                            ? "Updating..."
                            : "Start Working"}
                        </button>

                      )}

                      {/* MARK SOLVED */}

                      {problem.status ===
                        "in_progress" && (

                        <button
                          onClick={() =>
                            setProblemToSolve(problem)
                          }
                          disabled={
                            updatingId ===
                            problem._id
                          }
                          className="rounded-lg bg-[#087f70] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#066a5d] disabled:cursor-not-allowed disabled:bg-[#a5ccc5]"
                        >
                          {updatingId ===
                          problem._id
                            ? "Updating..."
                            : "Mark as Solved"}
                        </button>

                      )}

                      {/* SOLVED */}

                      {problem.status ===
                        "solved" && (

                        <span className="rounded-lg bg-[#e9f4f0] px-4 py-2 text-sm font-semibold text-[#087f70]">

                          ✓ This problem has been solved.

                        </span>

                      )}

                    </div>

                  </div>

                </article>

              )
            )}

          </div>
        )}

      </div>

      {/* ========================================
          CONFIRMATION MODAL (SAFEGUARD)
      ======================================== */}
      <ConfirmationModal
        isOpen={Boolean(problemToSolve)}
        onClose={() => setProblemToSolve(null)}
        onConfirm={async () => {
          if (!problemToSolve) return;
          const id = problemToSolve._id;
          setProblemToSolve(null);
          await handleStatusUpdate(id, "solved");
        }}
        title="Mark Problem as Solved?"
        confirmText="Yes, Mark as Solved"
        cancelText="Keep Working / Cancel"
        confirmVariant="success"
        isLoading={updatingId === problemToSolve?._id}
      >
        <div className="space-y-3 text-left">
          <p className="text-xs text-[#5c6f69] leading-relaxed">
            Are you sure you want to mark <strong className="text-[#173d3a]">"{problemToSolve?.title}"</strong> as solved?
          </p>
          <div className="rounded-xl bg-[#f7f8f5] p-3 text-xs text-[#5c6f69] border border-[#e3e9e3]">
            Marking this problem as solved will notify the citizen and Government Administration that field work and solutions have concluded.
          </div>
        </div>
      </ConfirmationModal>

    </main>
  );
};

export default PartnerProblems;
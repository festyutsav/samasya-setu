import { useEffect, useState } from "react";

import {
  getPartnerDashboard,
  getPartnerProblems,
  updatePartnerProblemStatus,
} from "../services/partnerService";

const PartnerDashboard = () => {
  // ========================================
  // STATE
  // ========================================

  const [partner, setPartner] = useState(null);

  const [statistics, setStatistics] = useState(null);

  const [problems, setProblems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);

  // ========================================
  // FETCH DASHBOARD DATA
  // ========================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      setMessage("");

      const token =
        localStorage.getItem("token");

      const [
        dashboardData,
        problemsData,
      ] = await Promise.all([
        getPartnerDashboard(token),
        getPartnerProblems(token),
      ]);

      setPartner(
        dashboardData.partner
      );

      setStatistics(
        dashboardData.statistics
      );

      setProblems(
        problemsData.problems || []
      );
    } catch (error) {
      console.error(
        "Fetch partner dashboard error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to load partner dashboard."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOAD DATA
  // ========================================

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ========================================
  // UPDATE PROBLEM STATUS
  // ========================================

  const handleStatusUpdate = async (
    problemId,
    status
  ) => {
    try {
      setUpdatingId(problemId);

      setMessage("");

      const token =
        localStorage.getItem("token");

      const data =
        await updatePartnerProblemStatus(
          problemId,
          status,
          token
        );

      // ========================================
      // UPDATE PROBLEM LOCALLY
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

      // ========================================
      // REFRESH DASHBOARD STATISTICS
      // ========================================

      const dashboardData =
        await getPartnerDashboard(token);

      setPartner(
        dashboardData.partner
      );

      setStatistics(
        dashboardData.statistics
      );

      setMessage(
        "Problem status updated successfully."
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "Update partner problem error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to update problem status."
      );

      setMessageType("error");
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
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // ========================================
  // STATUS STYLE
  // ========================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "assigned":
        return "bg-yellow-100 text-yellow-700";

      case "in_progress":
        return "bg-blue-100 text-blue-700";

      case "solved":
        return "bg-green-100 text-green-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">

        <div className="mx-auto max-w-7xl">

          <p className="text-slate-500">
            Loading partner dashboard...
          </p>

        </div>

      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="mb-8">

          <p className="text-sm font-semibold text-blue-600">
            PARTNER DASHBOARD
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">

            {partner?.name ||
              "Partner Dashboard"}

          </h1>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">

            {/* PARTNER TYPE */}

            {partner?.type && (

              <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold capitalize text-blue-700">

                {partner.type}

              </span>

            )}

            {/* PARTNER LOCATION */}

            {partner?.location && (

              <span className="flex items-center">

                📍 {partner.location}

              </span>

            )}

          </div>

        </div>

        {/* ========================================
            MESSAGE
        ======================================== */}

        {message && (

          <div
            className={`mb-6 rounded-xl border p-4 text-sm ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >

            {message}

          </div>

        )}

        {/* ========================================
            STATISTICS
        ======================================== */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL ASSIGNED */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Total Assigned
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">

              {statistics?.totalProblems || 0}

            </p>

          </div>

          {/* NEWLY ASSIGNED */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Newly Assigned
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">

              {statistics?.assignedProblems || 0}

            </p>

          </div>

          {/* IN PROGRESS */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">

              {statistics?.inProgressProblems || 0}

            </p>

          </div>

          {/* SOLVED */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Solved
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">

              {statistics?.solvedProblems || 0}

            </p>

          </div>

        </section>

        {/* ========================================
            ASSIGNED PROBLEMS
        ======================================== */}

        <section>

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-slate-800">
              Assigned Problems
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Problems assigned to your organization.
            </p>

          </div>

          {/* EMPTY STATE */}

          {problems.length === 0 ? (

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

              <p className="text-slate-500">
                No problems have been assigned yet.
              </p>

            </div>

          ) : (

            <div className="grid gap-5 lg:grid-cols-2">

              {problems.map(
                (problem) => (

                  <article
                    key={problem._id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >

                    {/* PROBLEM HEADER */}

                    <div>

                      <h3 className="text-xl font-bold text-slate-800">

                        {problem.title}

                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">

                        {/* CATEGORY */}

                        {problem.category && (

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">

                            {problem.category}

                          </span>

                        )}

                        {/* STATUS */}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            problem.status
                          )}`}
                        >

                          {formatStatus(
                            problem.status
                          )}

                        </span>

                      </div>

                    </div>

                    {/* DESCRIPTION */}

                    <p className="mt-5 text-sm leading-relaxed text-slate-600">

                      {problem.description}

                    </p>

                    {/* DETAILS */}

                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">

                      {/* LOCATION */}

                      {problem.location && (

                        <p>
                          📍 {problem.location}
                        </p>

                      )}

                      {/* SUBMITTED BY */}

                      {problem.submittedBy && (

                        <p>

                          👤 Submitted by:{" "}

                          {problem.submittedBy.name}

                        </p>

                      )}

                    </div>

                    {/* STATUS ACTIONS */}

                    <div className="mt-6 flex flex-wrap gap-3">

                      {/* START WORKING */}

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
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                        >

                          {updatingId ===
                          problem._id
                            ? "Updating..."
                            : "Start Working"}

                        </button>

                      )}

                      {/* MARK AS SOLVED */}

                      {problem.status ===
                        "in_progress" && (

                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              problem._id,
                              "solved"
                            )
                          }
                          disabled={
                            updatingId ===
                            problem._id
                          }
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
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

                        <span className="rounded-xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">

                          ✓ Problem Solved

                        </span>

                      )}

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
};

export default PartnerDashboard;
import { useEffect, useState } from "react";

import { getProblemById } from "../services/problemService";

import {
  updateProblemStatus,
  assignPartnerToProblem,
} from "../services/adminService";

import { getAllPartners } from "../services/partnerService";

const statusStyles = {
  submitted: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  assigned: "bg-purple-100 text-purple-700",
  in_progress: "bg-orange-100 text-orange-700",
  solved: "bg-green-100 text-green-700",
};

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  solved: "Solved",
};

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

const AdminProblemDetails = ({ problemId, setAdminPage }) => {
  // ========================================
  // STATE
  // ========================================

  const [problem, setProblem] = useState(null);

  const [partners, setPartners] = useState([]);

  const [selectedPartner, setSelectedPartner] = useState("");

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [assigningPartner, setAssigningPartner] = useState(false);

  // ========================================
  // FETCH DATA
  // ========================================

  const fetchData = async () => {
    try {
      setLoading(true);

      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");

        return;
      }

      const [problemData, partnersData] = await Promise.all([
        getProblemById(problemId, token),

        getAllPartners(token),
      ]);

      setProblem(problemData.problem);

      setPartners(partnersData.partners || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch problem details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [problemId]);

  // ========================================
  // UPDATE STATUS
  // ========================================

  const handleStatusChange = async (status) => {
    try {
      setUpdatingStatus(true);

      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");

        return;
      }

      const data = await updateProblemStatus(problemId, status, token);

      const shouldRemovePartner =
        status === "submitted" || status === "under_review";

      setProblem({
        ...data.problem,

        assignedPartner: shouldRemovePartner
          ? null
          : data.problem.assignedPartner,
      });

      if (shouldRemovePartner) {
        setSelectedPartner("");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to update problem status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ========================================
  // ASSIGN PARTNER
  // ========================================

  const handleAssignPartner = async () => {
    try {
      if (!selectedPartner) {
        setMessage("Please select a partner first.");

        return;
      }

      setAssigningPartner(true);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await assignPartnerToProblem(
        problemId,
        selectedPartner,
        token,
      );

      // Update problem with backend response
      setProblem(data.problem);

      // Clear dropdown after assignment
      setSelectedPartner("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to assign partner.");
    } finally {
      setAssigningPartner(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-medium text-slate-600">
          Loading problem details...
        </p>
      </main>
    );
  }

  // ========================================
  // ERROR WITHOUT PROBLEM
  // ========================================

  if (!problem) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => setAdminPage("dashboard")}
            className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {message || "Problem not found."}
          </div>
        </div>
      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* BACK BUTTON */}

        <button
          onClick={() => setAdminPage("dashboard")}
          className="mb-8 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>

        {/* MESSAGE */}

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        {/* MAIN CARD */}

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {/* HEADER */}

          <div className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {categoryNames[problem.category?.toLowerCase()] || "Other"}
              </span>

              <h1 className="mt-4 text-3xl font-bold text-slate-800">
                {problem.title}
              </h1>
            </div>

            {/* STATUS BADGE */}

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                statusStyles[problem.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {statusLabels[problem.status] || problem.status}
            </span>
          </div>

          {/* DESCRIPTION */}

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-800">
              Problem Description
            </h2>

            <p className="mt-3 leading-relaxed text-slate-600">
              {problem.description}
            </p>
          </section>

          {/* ========================================
              PROBLEM PHOTOS
          ======================================== */}

          {problem.images && problem.images.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-800">
                Problem Photos
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {problem.images.map((image, index) => (
                  <div
                    key={image.publicId || `${problem._id}-${index}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={image.url}
                      alt={`Problem photo ${index + 1}`}
                      className="h-52 w-full object-cover transition duration-200 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {(!problem.images || problem.images.length === 0) && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-800">
                Problem Photos
              </h2>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                <p className="text-sm text-slate-500">
                  📷 No photos uploaded for this problem.
                </p>
              </div>
            </section>
          )}

          {/* INFORMATION GRID */}

          <section className="mt-8 grid gap-5 sm:grid-cols-2">
            <InfoCard label="Location" value={`📍 ${problem.location}`} />

            <InfoCard
              label="Category"
              value={`🏷️ ${
                categoryNames[problem.category?.toLowerCase()] || "Other"
              }`}
            />

            <InfoCard
              label="Submitted On"
              value={
                problem.createdAt
                  ? new Date(problem.createdAt).toLocaleDateString()
                  : "Unknown date"
              }
            />

            <InfoCard
              label="Submitted By"
              value={problem.submittedBy?.name || "Unknown citizen"}
              secondary={problem.submittedBy?.email}
            />
          </section>

          {/* ASSIGNED PARTNER */}

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-800">
              Assigned Partner
            </h2>

            {problem.assignedPartner ? (
              <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-5">
                <p className="text-lg font-bold text-purple-900">
                  🏢 {problem.assignedPartner.name}
                </p>

                <p className="mt-1 text-sm text-purple-700">
                  {problem.assignedPartner.type}
                </p>

                {problem.assignedPartner.location && (
                  <p className="mt-2 text-sm text-purple-700">
                    📍 {problem.assignedPartner.location}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
                No partner has been assigned yet.
              </div>
            )}
          </section>

          {/* MANAGEMENT */}

          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-800">Manage Problem</h2>

            <p className="mt-1 text-sm text-slate-500">
              Update the problem status or assign a partner organization.
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* STATUS MANAGEMENT */}

              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800">Update Status</h3>

                <select
                  value={problem.status}
                  disabled={updatingStatus}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="submitted">Submitted</option>

                  <option value="under_review">Under Review</option>

                  <option value="assigned">Assigned</option>

                  <option value="in_progress">In Progress</option>

                  <option value="solved">Solved</option>
                </select>

                {updatingStatus && (
                  <p className="mt-3 text-sm text-blue-600">
                    Updating status...
                  </p>
                )}
              </div>

              {/* PARTNER MANAGEMENT */}

              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800">
                  {problem.assignedPartner
                    ? "Change Partner"
                    : "Assign Partner"}
                </h3>

                <select
                  value={selectedPartner}
                  disabled={assigningPartner}
                  onChange={(event) => setSelectedPartner(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-purple-500"
                >
                  <option value="">Select Partner</option>

                  {partners.map((partner) => (
                    <option key={partner._id} value={partner._id}>
                      {partner.name} ({partner.type})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAssignPartner}
                  disabled={assigningPartner || !selectedPartner}
                  className="mt-4 w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigningPartner
                    ? "Assigning..."
                    : problem.assignedPartner
                      ? "Change Partner"
                      : "Assign Partner"}
                </button>
              </div>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
};

// ========================================
// INFO CARD
// ========================================

const InfoCard = ({ label, value, secondary }) => {
  return (
    <div className="rounded-xl bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 font-semibold text-slate-800">{value}</p>

      {secondary && <p className="mt-1 text-sm text-slate-500">{secondary}</p>}
    </div>
  );
};

export default AdminProblemDetails;

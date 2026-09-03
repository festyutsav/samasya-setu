import { useEffect, useState } from "react";

import {
  getMyProjects,
  respondToCollaboration,
  addCollaborationContribution,
} from "../services/partnerService";

// ========================================
// COLLABORATION BADGE STYLES
// ========================================

const getStatusStyle = (status) => {
  switch (status) {
    case "invited":
      return "bg-[#f7ebd8] text-[#a25a1b]";

    case "accepted":
      return "bg-[#d8ebe4] text-[#087f70]";

    case "declined":
    case "withdrawn":
      return "bg-[#f1f2f0] text-[#899892]";

    default:
      return "bg-[#f7f8f5] text-[#315d56]";
  }
};

const formatStatus = (status) =>
  (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatRole = (role) =>
  (role || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const emptyContribution = { title: "", detail: "" };

const PartnerCollaborations = ({ user }) => {
  // ========================================
  // STATE
  // ========================================

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  const [busyId, setBusyId] = useState(null);

  const [contributionForm, setContributionForm] = useState({
    projectId: null,
    ...emptyContribution,
  });

  // ========================================
  // FETCH PROJECTS
  // ========================================

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const data = await getMyProjects(token);

      setProjects(data.projects || []);
    } catch (error) {
      console.error("Fetch collaborations error:", error);

      setMessage(
        error.response?.data?.message || "Failed to load collaborations.",
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ========================================
  // MY COLLABORATION ON A PROJECT
  // ========================================

  const myCollaboration = (project) =>
    (project.collaborators || []).find(
      (collaborator) =>
        collaborator.partner &&
        collaborator.partner._id === user?.organization?.id,
    );

  const invitations = projects.filter(
    (project) => myCollaboration(project)?.status === "invited",
  );

  const activeCollaborations = projects.filter(
    (project) => myCollaboration(project)?.status === "accepted",
  );

  // ========================================
  // ACCEPT / DECLINE
  // ========================================

  const handleRespond = async (project, response) => {
    try {
      setBusyId(project._id);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await respondToCollaboration(
        project._id,
        myCollaboration(project)._id,
        response,
        token,
      );

      setProjects((current) =>
        current.map((entry) =>
          entry._id === project._id ? data.project : entry,
        ),
      );

      setMessage(
        response === "accepted"
          ? "Invitation accepted. You can now log contributions."
          : "Invitation declined.",
      );

      setMessageType("success");
    } catch (error) {
      console.error("Respond error:", error);

      setMessage(
        error.response?.data?.message || "Failed to update invitation.",
      );

      setMessageType("error");
    } finally {
      setBusyId(null);
    }
  };

  // ========================================
  // LOG A CONTRIBUTION
  // ========================================

  const handleContribution = async (event) => {
    event.preventDefault();

    const project = projects.find(
      (entry) => entry._id === contributionForm.projectId,
    );

    if (!project) return;

    try {
      setBusyId(project._id);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await addCollaborationContribution(
        project._id,
        myCollaboration(project)._id,
        {
          title: contributionForm.title,
          detail: contributionForm.detail,
        },
        token,
      );

      setProjects((current) =>
        current.map((entry) =>
          entry._id === project._id ? data.project : entry,
        ),
      );

      setMessage(data.message || "Contribution logged.");

      setMessageType("success");

      setContributionForm({
        projectId: null,
        ...emptyContribution,
      });
    } catch (error) {
      console.error("Contribution error:", error);

      setMessage(
        error.response?.data?.message || "Failed to log contribution.",
      );

      setMessageType("error");
    } finally {
      setBusyId(null);
    }
  };

  // ========================================
  // PROJECT CARD BODY
  // ========================================

  const renderProjectCard = (project, collaborator) => (
    <article
      key={project._id}
      className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm"
    >
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#173d3a]">
            {project.title}
          </h3>

          {project.problem && (
            <p className="mt-1 text-sm text-[#71827c]">
              Problem: {project.problem.title}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(collaborator.status)}`}
          >
            {formatStatus(collaborator.status)}
          </span>

          <span className="rounded-full bg-[#31527c]/10 px-3 py-1 text-xs font-semibold text-[#31527c]">
            {formatRole(collaborator.role)}
          </span>
        </div>
      </div>

      {/* LEAD UNIVERSITY */}

      {project.partner && (
        <p className="mt-3 text-sm text-[#5c6f69]">
          Lead university:{" "}
          <span className="font-semibold text-[#173d3a]">
            {project.partner.name}
          </span>
        </p>
      )}

      {/* DESCRIPTION */}

      <p className="mt-4 text-sm leading-relaxed text-[#5c6f69]">
        {project.description}
      </p>

      {/* PENDING INVITATION ACTIONS */}

      {collaborator.status === "invited" && (
        <div className="mt-6 flex flex-wrap gap-3 border-t border-[#eef2ee] pt-4">
          <button
            onClick={() => handleRespond(project, "accepted")}
            disabled={busyId === project._id}
            className="rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
          >
            {busyId === project._id ? "Responding..." : "Accept invitation"}
          </button>

          <button
            onClick={() => handleRespond(project, "declined")}
            disabled={busyId === project._id}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      )}

      {/* ACTIVE COLLABORATION: CONTRIBUTIONS */}

      {collaborator.status === "accepted" && (
        <div className="mt-5 border-t border-[#eef2ee] pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
              Your Contributions · {(collaborator.contributions || []).length}
            </p>

            <button
              type="button"
              onClick={() =>
                setContributionForm((current) =>
                  current.projectId === project._id
                    ? { projectId: null, ...emptyContribution }
                    : { projectId: project._id, ...emptyContribution },
                )
              }
              className="text-xs font-bold text-[#0b6b60] hover:underline"
            >
              {contributionForm.projectId === project._id
                ? "Cancel"
                : "+ Log contribution"}
            </button>
          </div>

          {/* CONTRIBUTION LIST */}

          <ul className="mt-3 space-y-2">
            {(collaborator.contributions || []).map((contribution, index) => (
              <li
                key={index}
                className="rounded-lg bg-[#f7f8f5] px-3 py-2 text-sm"
              >
                <p className="font-semibold text-[#173d3a]">
                  {contribution.title}
                </p>

                {contribution.detail && (
                  <p className="mt-0.5 text-[#5c6f69]">{contribution.detail}</p>
                )}

                <p className="mt-1 text-xs text-[#a1aca7]">
                  {new Date(contribution.date).toLocaleDateString()}
                </p>
              </li>
            ))}

            {(collaborator.contributions || []).length === 0 && (
              <li className="text-xs text-[#a1aca7]">
                No contributions logged yet. Record mentorship sessions,
                funding, prototypes or pilot deployments here.
              </li>
            )}
          </ul>

          {/* CONTRIBUTION FORM */}

          {contributionForm.projectId === project._id && (
            <form
              onSubmit={handleContribution}
              className="mt-3 space-y-3 rounded-xl border border-[#e3e9e3] bg-[#fbfcfa] p-4"
            >
              <input
                type="text"
                value={contributionForm.title}
                onChange={(event) =>
                  setContributionForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. Funded prototype development"
                required
                className="w-full rounded-lg border border-[#dbe5df] bg-white px-3 py-2 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              />

              <textarea
                value={contributionForm.detail}
                onChange={(event) =>
                  setContributionForm((current) => ({
                    ...current,
                    detail: event.target.value,
                  }))
                }
                placeholder="Details (optional)"
                rows={2}
                className="w-full rounded-lg border border-[#dbe5df] bg-white px-3 py-2 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busyId === project._id}
                  className="rounded-lg bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                >
                  {busyId === project._id ? "Saving..." : "Save contribution"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </article>
  );

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] p-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[#71827c]">Loading collaborations...</p>
        </div>
      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-[#0b6b60]">
            INDUSTRY COLLABORATION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#173d3a]">
            Collaborations
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[#71827c]">
            Join university-led projects as a mentor, funder, co-developer or
            adopter, and log the contributions your organization brings.
          </p>
        </div>

        {/* MESSAGE */}

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

        {/* PENDING INVITATIONS */}

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-[#173d3a]">
            Invitations{" "}
            <span className="text-base font-semibold text-[#a1aca7]">
              ({invitations.length})
            </span>
          </h2>

          {invitations.length === 0 ? (
            <div className="rounded-2xl border border-[#e3e9e3] bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-[#71827c]">
                No pending invitations. Universities will invite you when your
                expertise matches one of their projects.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {invitations.map((project) =>
                renderProjectCard(project, myCollaboration(project)),
              )}
            </div>
          )}
        </section>

        {/* ACTIVE COLLABORATIONS */}

        <section>
          <h2 className="mb-4 text-2xl font-bold text-[#173d3a]">
            Active Collaborations{" "}
            <span className="text-base font-semibold text-[#a1aca7]">
              ({activeCollaborations.length})
            </span>
          </h2>

          {activeCollaborations.length === 0 ? (
            <div className="rounded-2xl border border-[#e3e9e3] bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-[#71827c]">
                You are not collaborating on any projects yet. Accept an
                invitation above to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {activeCollaborations.map((project) =>
                renderProjectCard(project, myCollaboration(project)),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PartnerCollaborations;

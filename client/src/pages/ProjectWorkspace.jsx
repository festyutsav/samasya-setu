import { useEffect, useState } from "react";

import {
  getProjectById,
  updateProjectStatus,
  toggleProjectMilestone,
  setMilestoneDueDate,
  updateProjectOutcomes,
  respondToCollaboration,
  addCollaborationContribution,
} from "../services/partnerService";

import ExportBriefButton from "../components/ExportBriefButton";
import ResolutionProof from "../components/ResolutionProof";

// ========================================
// HELPERS
// ========================================

const formatStatus = (status) =>
  (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatRole = (role) =>
  (role || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusStyle = (status) => {
  switch (status) {
    case "planning":
      return "bg-[#f7ebd8] text-[#a25a1b]";

    case "active":
      return "bg-[#d8ebe4] text-[#087f70]";

    case "completed":
      return "bg-[#e1f1ed] text-[#0a4f47]";

    default:
      return "bg-[#f7f8f5] text-[#315d56]";
  }
};

const getCollaborationStyle = (status) => {
  switch (status) {
    case "invited":
      return "bg-[#f7ebd8] text-[#a25a1b]";

    case "requested":
      return "bg-[#e0d7ef] text-[#564680]";

    case "accepted":
      return "bg-[#d8ebe4] text-[#087f70]";

    case "declined":
    case "withdrawn":
      return "bg-[#f1f2f0] text-[#899892]";

    default:
      return "bg-[#f7f8f5] text-[#315d56]";
  }
};

const emptyContribution = { title: "", detail: "" };

const emptyOutcomes = {
  patents: 0,
  startups: 0,
  publications: 0,
  deployments: 0,
};

const ProjectWorkspace = ({
  projectId,
  user,
  setSelectedPartnerProjectId,
  setPartnerPage,
}) => {
  // ========================================
  // STATE
  // ========================================

  const [project, setProject] = useState(null);

  const [viewerRole, setViewerRole] = useState("collaborator");

  const [myCollaboration, setMyCollaboration] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  const [busy, setBusy] = useState(false);

  const [contributionForm, setContributionForm] = useState(emptyContribution);

  const [showContributionForm, setShowContributionForm] = useState(false);

  const [outcomesForm, setOutcomesForm] = useState(emptyOutcomes);

  const [showOutcomesForm, setShowOutcomesForm] = useState(false);

  // Inline due-date editing: index of the milestone being
  // edited (null = closed) and the pending date value.

  const [dueDateEditIndex, setDueDateEditIndex] = useState(null);

  const [dueDateValue, setDueDateValue] = useState("");

  // Captured after mount so the overdue check stays pure
  // during render (no Date.now() in the component body).

  const [now, setNow] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);

    return () => clearTimeout(timer);
  }, []);

  // ========================================
  // FETCH
  // ========================================

  const fetchProject = async () => {
    try {
      setLoading(true);

      setError("");

      const token = localStorage.getItem("token");

      const data = await getProjectById(projectId, token);

      setProject(data.project);

      setViewerRole(data.viewerRole);

      setMyCollaboration(data.myCollaboration);
    } catch (fetchError) {
      console.error("Fetch project error:", fetchError);

      setError(
        fetchError.response?.data?.message || "Failed to load the project.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const applyUpdate = (data) => {
    setProject(data.project);

    // viewerRole / myCollaboration stay the same across updates.
  };

  // ========================================
  // ACTIONS
  // ========================================

  const runAction = async (action) => {
    try {
      setBusy(true);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await action(token);

      applyUpdate(data);

      if (data.message) {
        setMessage(data.message);

        setMessageType("success");
      }
    } catch (actionError) {
      console.error("Workspace action error:", actionError);

      setMessage(
        actionError.response?.data?.message || "Action failed.",
      );

      setMessageType("error");
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = (status) =>
    runAction((token) => updateProjectStatus(projectId, status, token));

  const handleToggleMilestone = (index) =>
    runAction((token) => toggleProjectMilestone(projectId, index, token));

  const openDueDateEditor = (index, currentValue) => {
    setDueDateEditIndex(index);

    setDueDateValue(
      currentValue ? new Date(currentValue).toISOString().slice(0, 10) : "",
    );
  };

  const handleSaveDueDate = async (index) => {
    await runAction((token) =>
      setMilestoneDueDate(projectId, index, dueDateValue || null, token),
    );

    setDueDateEditIndex(null);

    setDueDateValue("");
  };

  const handleOutcomes = async (event) => {
    event.preventDefault();

    await runAction((token) =>
      updateProjectOutcomes(projectId, outcomesForm, token),
    );

    setShowOutcomesForm(false);
  };

  const openOutcomesForm = () => {
    setOutcomesForm({
      ...emptyOutcomes,

      ...(project?.outcomes || {}),
    });

    setShowOutcomesForm(true);
  };

  const handleRespond = (collaboratorId, response) =>
    runAction((token) =>
      respondToCollaboration(projectId, collaboratorId, response, token),
    );

  const handleContribution = async (event) => {
    event.preventDefault();

    if (!myCollaboration) return;

    await runAction((token) =>
      addCollaborationContribution(
        projectId,
        myCollaboration._id,
        contributionForm,
        token,
      ),
    );

    setContributionForm(emptyContribution);

    setShowContributionForm(false);
  };

  // ========================================
  // DERIVED
  // ========================================

  const isLead = viewerRole === "lead";

  const completedMilestones = (project?.milestones || []).filter(
    (milestone) => milestone.completed,
  ).length;

  const totalMilestones = (project?.milestones || []).length;

  // Unified contribution feed across the lead university and
  // all collaborators — the "merged" activity view.

  const contributionFeed = [
    ...((project?.collaborators || []) || []).flatMap((collaborator) =>
      (collaborator.contributions || []).map((contribution) => ({
        ...contribution,

        partnerName: collaborator.partner?.name,

        role: collaborator.role,
      })),
    ),
  ].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0),
  );

  const liveCollaborators = (project?.collaborators || []).filter(
    (collaborator) =>
      collaborator.partner &&
      ["invited", "requested", "accepted"].includes(collaborator.status),
  );

  const incomingRequests = liveCollaborators.filter(
    (collaborator) => collaborator.status === "requested",
  );

  const myCollaboratorEntry =
    !isLead && myCollaboration
      ? (project?.collaborators || []).find(
          (entry) => entry._id === myCollaboration._id,
        )
      : null;

  // ========================================
  // LOADING / ERROR
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8ebe4] border-t-[#0b514a]" />
          <p className="text-[#71827c]">Loading workspace...</p>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => {
                setSelectedPartnerProjectId(null);

                setPartnerPage(isLead ? "projects" : "collaborations");
              }}
              className="mt-4 rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a]"
            >
              Back to projects
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* BACK */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedPartnerProjectId(null);

              setPartnerPage(isLead ? "projects" : "collaborations");
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c6f69] transition hover:text-[#173d3a]"
          >
            ← Back to {isLead ? "my projects" : "my collaborations"}
          </button>

          <ExportBriefButton label="Export Project Brief (PDF)" />
        </div>

        {/* HERO HEADER */}

        <section className="ss-dash-hero ss-enter mb-8 p-8 shadow-lg sm:p-10">
          <div className="ss-hero-ring right-24 top-6 h-40 w-40" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-white backdrop-blur-sm">
                {isLead ? "You lead this project" : "Collaborator view"}
              </span>

              {!isLead && myCollaboration && (
                <span className="rounded-full bg-[#e9c985]/20 px-3 py-1 text-xs font-semibold capitalize text-[#f3dfae]">
                  {formatRole(myCollaboration.role)}
                </span>
              )}
            </div>

            <h1 className="font-display mt-3 text-2xl font-bold text-white sm:text-3xl">
              {project.title}
            </h1>

            {project.problem && (
              <p className="mt-2 text-sm text-white/80">
                <span className="font-semibold text-white/95">Linked Challenge:</span> {project.problem.title}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold capitalize text-white backdrop-blur-sm">
                {formatStatus(project.status)}
              </span>

              {project.partner && (
                <span className="text-sm text-white/70">
                  Led by{" "}
                  <span className="font-semibold text-white">
                    {project.partner.name}
                  </span>
                </span>
              )}
            </div>
          </div>
        </section>

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

        {/* PENDING MY INVITE */}

        {myCollaboratorEntry?.status === "invited" && (
          <div className="mb-8 rounded-2xl border border-[#f3ce7a] bg-[#fdf6e7] p-6">
            <h3 className="font-bold text-[#173d3a]">
              You have been invited to this project
            </h3>

            <p className="mt-1 text-sm text-[#5c6f69]">
              Accept to unlock contributions and the shared workspace.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => handleRespond(myCollaboratorEntry._id, "accepted")}
                disabled={busy}
                className="rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
              >
                Accept invitation
              </button>

              <button
                type="button"
                onClick={() => handleRespond(myCollaboratorEntry._id, "declined")}
                disabled={busy}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* MY REQUEST PENDING */}

        {myCollaboratorEntry?.status === "requested" && (
          <div className="mb-8 rounded-2xl border border-[#c9b8e8] bg-[#f0ecf8] p-6">
            <h3 className="font-bold text-[#173d3a]">
              Your collaboration request is pending
            </h3>

            <p className="mt-1 text-sm text-[#5c6f69]">
              The lead university will accept or decline your request to join
              as a {formatRole(myCollaboration.role)}.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* MAIN COLUMN */}

          <div className="space-y-6 lg:col-span-2">
            {/* DESCRIPTION */}

            <section className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                Approach & Description
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[#5c6f69]">
                {project.description}
              </p>
            </section>

            {/* INCOMING REQUESTS (LEAD ONLY) */}

            {isLead && incomingRequests.length > 0 && (
              <section className="rounded-2xl border border-[#c9b8e8] bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#564680]">
                  Incoming Requests ({incomingRequests.length})
                </h3>

                <div className="mt-4 space-y-3">
                  {incomingRequests.map((collaborator) => (
                    <div
                      key={collaborator._id}
                      className="rounded-xl bg-[#f0ecf8] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#173d3a]">
                            {collaborator.partner.name}
                          </p>

                          <p className="text-xs font-semibold capitalize text-[#564680]">
                            Wants to join as {formatRole(collaborator.role)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRespond(collaborator._id, "accepted")
                            }
                            disabled={busy}
                            className="rounded-lg bg-[#0b514a] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                          >
                            Accept
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleRespond(collaborator._id, "declined")
                            }
                            disabled={busy}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            Decline
                          </button>
                        </div>
                      </div>

                      {collaborator.message && (
                        <p className="mt-2 border-l-2 border-[#b49ade] pl-3 text-sm italic text-[#5c6f69]">
                          "{collaborator.message}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* UNIFIED CONTRIBUTION FEED */}

            <section className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                  Contribution Feed ({contributionFeed.length})
                </h3>

                {myCollaboratorEntry?.status === "accepted" && (
                  <button
                    type="button"
                    onClick={() => setShowContributionForm((current) => !current)}
                    className="text-xs font-bold text-[#0b6b60] hover:underline"
                  >
                    {showContributionForm ? "Cancel" : "+ Log contribution"}
                  </button>
                )}
              </div>

              {/* CONTRIBUTION FORM (ACTIVE COLLABORATOR) */}

              {showContributionForm &&
                myCollaboratorEntry?.status === "accepted" && (
                  <form
                    onSubmit={handleContribution}
                    className="mt-4 space-y-3 rounded-xl border border-[#e3e9e3] bg-[#fbfcfa] p-4"
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
                        disabled={busy}
                        className="rounded-lg bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                      >
                        {busy ? "Saving..." : "Save contribution"}
                      </button>
                    </div>
                  </form>
                )}

              {/* FEED */}

              <ul className="mt-4 space-y-3">
                {contributionFeed.map((contribution, index) => (
                  <li
                    key={index}
                    className="rounded-lg bg-[#f7f8f5] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-[#173d3a]">
                        {contribution.title}
                      </p>

                      <p className="text-xs text-[#a1aca7]">
                        {contribution.date
                          ? new Date(contribution.date).toLocaleDateString()
                          : ""}
                      </p>
                    </div>

                    {contribution.detail && (
                      <p className="mt-1 text-sm text-[#5c6f69]">
                        {contribution.detail}
                      </p>
                    )}

                    <p className="mt-1.5 text-xs font-semibold text-[#71827c]">
                      {contribution.partnerName}
                      {contribution.role
                        ? ` · ${formatRole(contribution.role)}`
                        : ""}
                    </p>
                  </li>
                ))}

                {contributionFeed.length === 0 && (
                  <li className="text-sm text-[#a1aca7]">
                    No contributions logged yet. Mentorship sessions, funding,
                    prototypes and pilot deployments appear here for everyone
                    in the project.
                  </li>
                )}
              </ul>
            </section>
          </div>

          {/* SIDE COLUMN */}

          <div className="space-y-6">
            {/* MILESTONES */}

            {totalMilestones > 0 && (
              <section className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                    Milestones
                  </h3>

                  <span className="text-xs font-bold text-[#0b6b60]">
                    {completedMilestones}/{totalMilestones}
                  </span>
                </div>

                <div className="ss-progress-track mt-3">
                  <div
                    className="ss-progress-fill"
                    style={{
                      width: `${totalMilestones ? (completedMilestones / totalMilestones) * 100 : 0}%`,
                    }}
                  />
                </div>

                <ul className="mt-4 space-y-2">
                  {project.milestones.map((milestone, index) => {
                    const canToggle = isLead && !busy;

                    const dueDate = milestone.dueDate
                      ? new Date(milestone.dueDate)
                      : null;

                    const isOverdue =
                      now !== null &&
                      dueDate &&
                      !milestone.completed &&
                      dueDate.getTime() < now;

                    return (
                      <li key={index}>
                        <div
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm ${
                            canToggle
                              ? "transition hover:bg-[#f7f8f5]"
                              : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              canToggle && handleToggleMilestone(index)
                            }
                            disabled={!canToggle}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                              milestone.completed
                                ? "border-[#087f70] bg-[#087f70] text-white"
                                : "border-[#c4d2cb] bg-white text-transparent"
                            }`}
                          >
                            ✓
                          </button>

                          <span
                            className={
                              milestone.completed
                                ? "text-[#a1aca7] line-through"
                                : "text-[#315d56]"
                            }
                          >
                            {milestone.title}
                          </span>

                          <span className="ml-auto flex shrink-0 items-center gap-1.5">
                            {dueDate && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  isOverdue
                                    ? "bg-[#fde5e0] text-[#b3402a]"
                                    : "bg-[#eef2ee] text-[#5c6f69]"
                                }`}
                              >
                                {isOverdue ? "Overdue · " : "Due "}
                                {dueDate.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            )}

                            {isLead && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDueDateEditor(index, milestone.dueDate)
                                }
                                disabled={busy}
                                title="Set due date"
                                className="rounded-md px-1.5 py-0.5 text-xs text-[#899892] transition hover:bg-[#eef2ee] hover:text-[#0b6b60]"
                              >
                                📅
                              </button>
                            )}
                          </span>
                        </div>

                        {isLead && dueDateEditIndex === index && (
                          <div className="mt-1 flex items-center gap-2 rounded-lg bg-[#f7f8f5] px-2 py-2">
                            <input
                              type="date"
                              value={dueDateValue}
                              onChange={(event) =>
                                setDueDateValue(event.target.value)
                              }
                              className="rounded-md border border-[#dbe5df] bg-white px-2 py-1 text-xs text-[#315d56]"
                            />

                            <button
                              type="button"
                              onClick={() => handleSaveDueDate(index)}
                              disabled={busy}
                              className="rounded-md bg-[#0b514a] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#0d6157] disabled:opacity-50"
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={() => setDueDateEditIndex(null)}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-[#5c6f69] transition hover:bg-[#e3e9e3]"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {!isLead && (
                  <p className="mt-3 text-xs text-[#a1aca7]">
                    Only the lead university can toggle milestones.
                  </p>
                )}
              </section>
            )}

            {/* INNOVATION OUTCOMES */}

            <section className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                  Innovation Outcomes
                </h3>

                {isLead && !showOutcomesForm && (
                  <button
                    type="button"
                    onClick={openOutcomesForm}
                    disabled={busy}
                    className="rounded-md border border-[#cfe4dc] px-3 py-1 text-xs font-semibold text-[#0b6b60] transition hover:bg-[#e9f4f0] disabled:opacity-50"
                  >
                    Update
                  </button>
                )}
              </div>

              {showOutcomesForm ? (
                <form onSubmit={handleOutcomes} className="mt-4 space-y-3">
                  {[
                    { key: "patents", label: "Patents" },
                    { key: "startups", label: "Startups created" },
                    { key: "publications", label: "Publications" },
                    { key: "deployments", label: "Deployments" },
                  ].map((field) => (
                    <label key={field.key} className="block text-sm">
                      <span className="text-[#5c6f69]">{field.label}</span>

                      <input
                        type="number"
                        min="0"
                        value={outcomesForm[field.key]}
                        onChange={(event) =>
                          setOutcomesForm((current) => ({
                            ...current,

                            [field.key]: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-[#dbe5df] px-3 py-2 text-sm outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                      />
                    </label>
                  ))}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-lg bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                    >
                      {busy ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOutcomesForm(false)}
                      disabled={busy}
                      className="rounded-lg border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-[#5c6f69] transition hover:bg-[#f7f8f5] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {[
                      { key: "patents", label: "Patents" },
                      { key: "startups", label: "Startups" },
                      { key: "publications", label: "Publications" },
                      { key: "deployments", label: "Deployments" },
                    ].map((field) => (
                      <div
                        key={field.key}
                        className="rounded-lg bg-[#f7f8f5] px-3 py-2"
                      >
                        <dt className="text-xs text-[#71827c]">{field.label}</dt>

                        <dd className="mt-0.5 text-lg font-bold text-[#173d3a]">
                          {project?.outcomes?.[field.key] || 0}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {!isLead && (
                    <p className="mt-3 text-xs text-[#a1aca7]">
                      Only the lead university can record outcomes.
                    </p>
                  )}
                </>
              )}
            </section>

            {/* TEAM */}

            {(project.team || []).length > 0 && (
              <section className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                  University Team
                </h3>

                <ul className="mt-3 space-y-2 text-sm">
                  {project.team.map((member, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-[#173d3a]">
                        {member.role === "professor" ? "Dr. " : ""}
                        {member.name}
                      </span>

                      <span className="text-xs capitalize text-[#71827c]">
                        {member.department || member.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* COLLABORATORS */}

            <section className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                Collaborators ({liveCollaborators.length})
              </h3>

              <ul className="mt-3 space-y-3">
                {liveCollaborators.map((collaborator) => (
                  <li
                    key={collaborator._id}
                    className="rounded-lg bg-[#f7f8f5] px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#173d3a]">
                        {collaborator.partner.name}
                      </p>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCollaborationStyle(collaborator.status)}`}
                      >
                        {formatStatus(collaborator.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs font-semibold capitalize text-[#71827c]">
                      {formatRole(collaborator.role)}
                    </p>
                  </li>
                ))}

                {liveCollaborators.length === 0 && (
                  <li className="text-xs text-[#a1aca7]">
                    No collaborators yet.
                  </li>
                )}
              </ul>
            </section>

            {/* STATUS ACTIONS (LEAD ONLY) */}

            {isLead && (
              <section className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                  Project Status
                </h3>

                <div className="mt-3 space-y-2">
                  {project.status === "planning" && (
                    <button
                      type="button"
                      onClick={() => handleStatus("active")}
                      disabled={busy}
                      className="w-full rounded-xl bg-[#0b514a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                    >
                      {busy ? "Updating..." : "Activate project"}
                    </button>
                  )}

                  {project.status === "active" && (
                    <button
                      type="button"
                      onClick={() => handleStatus("completed")}
                      disabled={busy}
                      className="w-full rounded-xl bg-[#087f70] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066a5d] disabled:cursor-not-allowed disabled:bg-[#7fb8ae]"
                    >
                      {busy ? "Updating..." : "Mark completed"}
                    </button>
                  )}

                  {project.status === "completed" && (
                    <p className="rounded-xl bg-[#e1f1ed] px-4 py-2.5 text-sm font-semibold text-[#087f70]">
                      ✓ Project completed
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* RESOLUTION PROOF (COMPLETED PROJECTS) */}
        {project.status === "completed" && (
          <ResolutionProof
            problem={project.problem}
            project={project}
            className="mt-8"
          />
        )}
      </div>
    </main>
  );
};

export default ProjectWorkspace;

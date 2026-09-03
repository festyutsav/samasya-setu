import { useEffect, useState } from "react";

import {
  getPartnerProblems,
  getMyProjects,
  createProject,
  updateProjectStatus,
  toggleProjectMilestone,
  getPartnerDirectory,
  inviteCollaborator,
  withdrawCollaborator,
} from "../services/partnerService";

// ========================================
// PROJECT STATUS STYLE
// ========================================

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

const formatStatus = (status) =>
  (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatRole = (role) =>
  (role || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Collaboration invite statuses get their own badge colors,
// distinct from project status badges.

const getCollaborationStyle = (status) => {
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

const COLLAB_ROLES = [
  { value: "mentor", label: "Mentor" },
  { value: "funder", label: "Funder / CSR" },
  { value: "co-developer", label: "Co-developer" },
  { value: "adopter", label: "Adopter / Pilot" },
];

// ========================================
// EMPTY TEAM MEMBER TEMPLATE
// ========================================

const emptyMember = {
  name: "",
  role: "student",
  department: "",
  email: "",
};

const emptyForm = {
  problem: "",
  title: "",
  description: "",
  milestones: "",
};

const PartnerProjects = () => {
  // ========================================
  // STATE
  // ========================================

  const [projects, setProjects] = useState([]);

  const [assignedProblems, setAssignedProblems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const [team, setTeam] = useState([{ ...emptyMember }]);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  const [updatingId, setUpdatingId] = useState(null);

  // ========================================
  // COLLABORATION STATE
  // ========================================

  const [directory, setDirectory] = useState([]);

  const [inviteForm, setInviteForm] = useState({
    projectId: null,
    partnerId: "",
    role: "mentor",
  });

  // ========================================
  // FETCH DATA
  // ========================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const [projectsData, problemsData, directoryData] = await Promise.all([
        getMyProjects(token),
        getPartnerProblems(token),
        getPartnerDirectory(token),
      ]);

      setProjects(projectsData.projects || []);

      setDirectory(directoryData.partners || []);

      // Problems that can still get a project: assigned or in
      // progress, and not already linked to one of my projects.

      const linkedProblemIds = new Set(
        (projectsData.projects || []).map((p) => p.problem?._id),
      );

      setAssignedProblems(
        (problemsData.problems || []).filter(
          (problem) =>
            problem.status !== "solved" &&
            !linkedProblemIds.has(problem._id),
        ),
      );
    } catch (error) {
      console.error("Fetch projects error:", error);

      setMessage(
        error.response?.data?.message || "Failed to load projects.",
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
  // FORM HANDLERS
  // ========================================

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleMemberChange = (index, field, value) => {
    setTeam((current) =>
      current.map((member, i) =>
        i === index ? { ...member, [field]: value } : member,
      ),
    );
  };

  const addMember = () => setTeam((current) => [...current, { ...emptyMember }]);

  const removeMember = (index) =>
    setTeam((current) => current.filter((_, i) => i !== index));

  // ========================================
  // CREATE PROJECT
  // ========================================

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      setMessage("");

      const token = localStorage.getItem("token");

      const milestones = form.milestones
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((title) => ({ title }));

      const data = await createProject(
        {
          title: form.title,
          description: form.description,
          problem: form.problem,
          team,
          milestones,
        },
        token,
      );

      setMessage(data.message || "Project created successfully.");

      setMessageType("success");

      setForm(emptyForm);

      setTeam([{ ...emptyMember }]);

      setShowForm(false);

      await fetchData();
    } catch (error) {
      console.error("Create project error:", error);

      setMessage(
        error.response?.data?.message || "Failed to create project.",
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // STATUS + MILESTONE ACTIONS
  // ========================================

  const handleStatusUpdate = async (projectId, status) => {
    try {
      setUpdatingId(projectId);

      const token = localStorage.getItem("token");

      const data = await updateProjectStatus(projectId, status, token);

      setProjects((current) =>
        current.map((project) =>
          project._id === projectId ? data.project : project,
        ),
      );
    } catch (error) {
      console.error("Update project status error:", error);

      setMessage(
        error.response?.data?.message || "Failed to update project.",
      );

      setMessageType("error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleMilestone = async (projectId, milestoneIndex) => {
    try {
      setUpdatingId(projectId);

      const token = localStorage.getItem("token");

      const data = await toggleProjectMilestone(
        projectId,
        milestoneIndex,
        token,
      );

      setProjects((current) =>
        current.map((project) =>
          project._id === projectId ? data.project : project,
        ),
      );
    } catch (error) {
      console.error("Toggle milestone error:", error);

      setMessage(
        error.response?.data?.message || "Failed to update milestone.",
      );

      setMessageType("error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ========================================
  // COLLABORATION ACTIONS
  // ========================================

  const handleInvite = async (event) => {
    event.preventDefault();

    try {
      setUpdatingId(inviteForm.projectId);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await inviteCollaborator(
        inviteForm.projectId,
        inviteForm.partnerId,
        inviteForm.role,
        token,
      );

      setProjects((current) =>
        current.map((project) =>
          project._id === inviteForm.projectId ? data.project : project,
        ),
      );

      setMessage(data.message || "Invitation sent.");

      setMessageType("success");

      setInviteForm({ projectId: null, partnerId: "", role: "mentor" });
    } catch (error) {
      console.error("Invite collaborator error:", error);

      setMessage(
        error.response?.data?.message || "Failed to send invitation.",
      );

      setMessageType("error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWithdrawCollaborator = async (projectId, collaboratorId) => {
    try {
      setUpdatingId(projectId);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await withdrawCollaborator(
        projectId,
        collaboratorId,
        token,
      );

      setProjects((current) =>
        current.map((project) =>
          project._id === projectId ? data.project : project,
        ),
      );

      setMessage(data.message || "Collaboration withdrawn.");

      setMessageType("success");
    } catch (error) {
      console.error("Withdraw collaborator error:", error);

      setMessage(
        error.response?.data?.message || "Failed to withdraw collaboration.",
      );

      setMessageType("error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] p-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[#71827c]">Loading projects...</p>
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

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0b6b60]">
              PROJECT WORKSPACE
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[#173d3a]">
              Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#71827c]">
              Form multidisciplinary teams of professors and students to work
              on the problems assigned to your university.
            </p>
          </div>

          <button
            onClick={() => setShowForm((current) => !current)}
            disabled={assignedProblems.length === 0 && !showForm}
            className="rounded-xl bg-[#0b514a] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0b514a]/15 transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
          >
            {showForm ? "Close form" : "+ New project"}
          </button>
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

        {/* CREATE FORM */}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-10 rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-xl font-bold text-[#173d3a]">
              Create a new project
            </h2>

            <p className="mt-1 text-sm text-[#71827c]">
              Link the problem, describe your approach, and build the team.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* LINKED PROBLEM */}

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[#173d3a]">
                  Problem to solve
                </span>

                <select
                  value={form.problem}
                  onChange={(event) =>
                    handleFormChange("problem", event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                >
                  <option value="">Select an assigned problem...</option>

                  {assignedProblems.map((problem) => (
                    <option key={problem._id} value={problem._id}>
                      {problem.title}
                    </option>
                  ))}
                </select>
              </label>

              {/* TITLE */}

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[#173d3a]">
                  Project title
                </span>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    handleFormChange("title", event.target.value)
                  }
                  placeholder="e.g. Solar street-light prototype for Dhanbad ward 12"
                  required
                  className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </label>

              {/* DESCRIPTION */}

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[#173d3a]">
                  Approach & description
                </span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleFormChange("description", event.target.value)
                  }
                  placeholder="What will the team study, build and test?"
                  rows={4}
                  required
                  className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </label>

              {/* MILESTONES */}

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[#173d3a]">
                  Milestones{" "}
                  <span className="font-normal text-[#a1aca7]">
                    (one per line, optional)
                  </span>
                </span>

                <textarea
                  value={form.milestones}
                  onChange={(event) =>
                    handleFormChange("milestones", event.target.value)
                  }
                  placeholder={"Field survey\nPrototype design\nPilot deployment"}
                  rows={3}
                  className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </label>
            </div>

            {/* TEAM */}

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#5c6f69]">
                  Project team
                </h3>

                <button
                  type="button"
                  onClick={addMember}
                  className="text-sm font-bold text-[#0b6b60] hover:underline"
                >
                  + Add member
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {team.map((member, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border border-[#eef2ee] bg-[#f7f8f5] p-4 sm:grid-cols-[1.2fr_0.8fr_1fr_1.2fr_auto]"
                  >
                    <input
                      type="text"
                      value={member.name}
                      onChange={(event) =>
                        handleMemberChange(index, "name", event.target.value)
                      }
                      placeholder="Full name"
                      required
                      className="rounded-lg border border-[#dbe5df] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                    />

                    <select
                      value={member.role}
                      onChange={(event) =>
                        handleMemberChange(index, "role", event.target.value)
                      }
                      className="rounded-lg border border-[#dbe5df] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                    >
                      <option value="professor">Professor (mentor)</option>

                      <option value="student">Student</option>
                    </select>

                    <input
                      type="text"
                      value={member.department}
                      onChange={(event) =>
                        handleMemberChange(
                          index,
                          "department",
                          event.target.value,
                        )
                      }
                      placeholder="Department"
                      className="rounded-lg border border-[#dbe5df] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                    />

                    <input
                      type="email"
                      value={member.email}
                      onChange={(event) =>
                        handleMemberChange(index, "email", event.target.value)
                      }
                      placeholder="Email (optional)"
                      className="rounded-lg border border-[#dbe5df] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                    />

                    {team.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="rounded-lg px-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SUBMIT */}

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#0b514a] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0b514a]/15 transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
              >
                {saving ? "Creating project..." : "Create project"}
              </button>
            </div>
          </form>
        )}

        {/* EMPTY STATE */}

        {projects.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#173d3a]">
              No projects yet
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#71827c]">
              Once the government assigns a problem to your university, create
              a project here to bring professors and students together around
              it.
            </p>
          </div>
        ) : (
          /* PROJECT LIST */

          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project) => {
              const completedMilestones = (project.milestones || []).filter(
                (milestone) => milestone.completed,
              ).length;

              const totalMilestones = (project.milestones || []).length;

              const professors = (project.team || []).filter(
                (member) => member.role === "professor",
              );

              const students = (project.team || []).filter(
                (member) => member.role === "student",
              );

              return (
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
                          For: {project.problem.title}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(project.status)}`}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  {/* DESCRIPTION */}

                  <p className="mt-4 text-sm leading-relaxed text-[#5c6f69]">
                    {project.description}
                  </p>

                  {/* TEAM SUMMARY */}

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-[#f7ebd8] px-3 py-1 text-[#a25a1b]">
                      {professors.length} professor
                      {professors.length === 1 ? "" : "s"}
                    </span>

                    <span className="rounded-full bg-[#d8ebe4] px-3 py-1 text-[#087f70]">
                      {students.length} student
                      {students.length === 1 ? "" : "s"}
                    </span>

                    {professors.slice(0, 2).map((member) => (
                      <span
                        key={member.name + member.email}
                        className="rounded-full bg-[#f7f8f5] px-3 py-1 font-medium text-[#5c6f69]"
                      >
                        Dr. {member.name}
                        {member.department ? ` · ${member.department}` : ""}
                      </span>
                    ))}
                  </div>

                  {/* COLLABORATORS */}

                  <div className="mt-5 border-t border-[#eef2ee] pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                        Industry Collaboration
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setInviteForm((current) =>
                            current.projectId === project._id
                              ? { projectId: null, partnerId: "", role: "mentor" }
                              : {
                                  projectId: project._id,
                                  partnerId: "",
                                  role: "mentor",
                                },
                          )
                        }
                        className="text-xs font-bold text-[#0b6b60] hover:underline"
                      >
                        {inviteForm.projectId === project._id
                          ? "Cancel"
                          : "+ Invite partner"}
                      </button>
                    </div>

                    {/* LIVE COLLABORATORS */}

                    <div className="mt-3 space-y-2">
                      {(project.collaborators || [])
                        .filter(
                          (collaborator) =>
                            collaborator.partner &&
                            ["invited", "accepted"].includes(
                              collaborator.status,
                            ),
                        )
                        .map((collaborator) => (
                          <div
                            key={collaborator._id}
                            className="flex flex-wrap items-center gap-2 rounded-lg bg-[#f7f8f5] px-3 py-2 text-sm"
                          >
                            <span className="font-semibold text-[#173d3a]">
                              {collaborator.partner.name}
                            </span>

                            <span className="rounded-full bg-[#31527c]/10 px-2.5 py-0.5 text-xs font-semibold text-[#31527c]">
                              {formatRole(collaborator.role)}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCollaborationStyle(collaborator.status)}`}
                            >
                              {formatStatus(collaborator.status)}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleWithdrawCollaborator(
                                  project._id,
                                  collaborator._id,
                                )
                              }
                              disabled={updatingId === project._id}
                              className="ml-auto text-xs font-semibold text-red-500 transition hover:underline disabled:opacity-50"
                            >
                              Withdraw
                            </button>
                          </div>
                        ))}

                      {(project.collaborators || []).filter(
                        (collaborator) =>
                          collaborator.partner &&
                          ["invited", "accepted"].includes(
                            collaborator.status,
                          ),
                      ).length === 0 && (
                        <p className="text-xs text-[#a1aca7]">
                          No industry partners yet. Invite one to mentor, fund,
                          co-develop or field-test the solution.
                        </p>
                      )}
                    </div>

                    {/* INVITE FORM */}

                    {inviteForm.projectId === project._id && (
                      <form
                        onSubmit={handleInvite}
                        className="mt-3 rounded-xl border border-[#e3e9e3] bg-[#fbfcfa] p-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_auto] sm:items-end">
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-[#5c6f69]">
                              Partner organization
                            </span>

                            <select
                              value={inviteForm.partnerId}
                              onChange={(event) =>
                                setInviteForm((current) => ({
                                  ...current,
                                  partnerId: event.target.value,
                                }))
                              }
                              required
                              className="w-full rounded-lg border border-[#dbe5df] bg-white px-3 py-2 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                            >
                              <option value="">Select a partner...</option>

                              {directory
                                .filter(
                                  (partner) =>
                                    partner.type !== "university" &&
                                    partner._id !== project.partner?._id,
                                )
                                .map((partner) => (
                                  <option key={partner._id} value={partner._id}>
                                    {partner.name} ({partner.type})
                                  </option>
                                ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-[#5c6f69]">
                              Role
                            </span>

                            <select
                              value={inviteForm.role}
                              onChange={(event) =>
                                setInviteForm((current) => ({
                                  ...current,
                                  role: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-[#dbe5df] bg-white px-3 py-2 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                            >
                              {COLLAB_ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <button
                            type="submit"
                            disabled={updatingId === project._id}
                            className="rounded-lg bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                          >
                            {updatingId === project._id
                              ? "Sending..."
                              : "Send invite"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* MILESTONES */}

                  {totalMilestones > 0 && (
                    <div className="mt-5 border-t border-[#eef2ee] pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                        Milestones · {completedMilestones}/{totalMilestones}
                      </p>

                      <ul className="mt-3 space-y-2">
                        {project.milestones.map((milestone, index) => (
                          <li key={index}>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleMilestone(project._id, index)
                              }
                              disabled={updatingId === project._id}
                              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-[#f7f8f5] disabled:opacity-60"
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                                  milestone.completed
                                    ? "border-[#087f70] bg-[#087f70] text-white"
                                    : "border-[#c4d2cb] bg-white text-transparent"
                                }`}
                              >
                                ✓
                              </span>

                              <span
                                className={
                                  milestone.completed
                                    ? "text-[#a1aca7] line-through"
                                    : "text-[#315d56]"
                                }
                              >
                                {milestone.title}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* STATUS ACTIONS */}

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-[#eef2ee] pt-4">
                    {project.status === "planning" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(project._id, "active")
                        }
                        disabled={updatingId === project._id}
                        className="rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                      >
                        {updatingId === project._id
                          ? "Updating..."
                          : "Activate project"}
                      </button>
                    )}

                    {project.status === "active" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(project._id, "completed")
                        }
                        disabled={updatingId === project._id}
                        className="rounded-xl bg-[#087f70] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#066a5d] disabled:cursor-not-allowed disabled:bg-[#7fb8ae]"
                      >
                        {updatingId === project._id
                          ? "Updating..."
                          : "Mark completed"}
                      </button>
                    )}

                    {project.status === "completed" && (
                      <span className="rounded-xl bg-[#e1f1ed] px-4 py-2 text-sm font-semibold text-[#087f70]">
                        ✓ Project completed
                      </span>
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

export default PartnerProjects;

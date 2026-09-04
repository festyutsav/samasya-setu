import { useEffect, useState } from "react";

import {
  getPartnerDashboard,
  getPartnerProblems,
  getMyProjects,
  updatePartnerProblemStatus,
} from "../services/partnerService";

// ========================================
// ICONS + STAT CARD
// ========================================

const Icon = ({ path, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {path}
  </svg>
);

const icons = {
  total: <path d="M12 2 2 7l10 5 10-5-10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5" />,
  assigned: <path d="M22 12h-6l-2 3h-4l-2-3H2m1.5-6h17l2.5 6v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-6l2.5-6Z" />,
  progress: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  solved: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />,
  location: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  person: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
};

const StatCard = ({ label, value, icon, accent, chipClass }) => (
  <div
    style={{ "--ss-accent": accent }}
    className="ss-stat-card p-4 sm:p-6"
  >
    <div className="flex items-center gap-3 sm:gap-4">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${chipClass}`}
      >
        <Icon path={icon} className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[#71827c] sm:text-sm">{label}</p>

        <p className="ss-stat-value mt-0.5 text-2xl font-bold text-[#173d3a] sm:mt-1 sm:text-3xl">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const PartnerDashboard = ({
  setPartnerPage,
  setSelectedPartnerProjectId,
}) => {
  // ========================================
  // STATE
  // ========================================

  const [partner, setPartner] = useState(null);

  const [statistics, setStatistics] = useState(null);

  const [problems, setProblems] = useState([]);

  const [projects, setProjects] = useState([]);

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
        projectsData,
      ] = await Promise.all([
        getPartnerDashboard(token),
        getPartnerProblems(token),
        getMyProjects(token).catch(() => ({ projects: [] })),
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

      setProjects(
        projectsData.projects || []
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
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8ebe4] border-t-[#0b514a]" />
          <p className="text-[#71827c]">Loading partner dashboard...</p>
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

        {/* ========================================
            HERO HEADER — university and industry portals
            carry different positioning
        ======================================== */}

        <section className="ss-dash-hero ss-enter mb-8 p-8 shadow-lg sm:p-10">
          <div className="ss-hero-ring right-24 top-6 h-40 w-40" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9c985]">
              {partner?.type === "university"
                ? "University Workspace"
                : partner?.type === "industry"
                  ? "Industry Workspace"
                  : "Partner Dashboard"}
            </p>

            <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
              {partner?.name || "Partner Dashboard"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              {partner?.type === "university"
                ? "Review the challenges assigned to your institution, form professor-and-student project teams, and take solutions from research to the field."
                : partner?.type === "industry"
                  ? "Bring mentorship, funding and field-deployment strength to the challenges assigned to your organization."
                  : "Problems assigned to your organization appear here."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {partner?.type && (
                <span className="rounded-full bg-[#e9c985]/20 px-4 py-1.5 text-sm font-semibold capitalize text-[#f3dfae] backdrop-blur-sm">
                  {partner.type}
                </span>
              )}

              {partner?.location && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                  <Icon path={icons.location} className="h-4 w-4" />
                  {partner.location}
                </span>
              )}
            </div>

            {partner?.expertise && partner.expertise.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {partner.expertise.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold capitalize text-white/80"
                  >
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

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
            STATISTICS
        ======================================== */}

        <section className="ss-enter mb-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4" style={{ "--ss-delay": "120ms" }}>
          <StatCard
            label="Total Assigned"
            value={statistics?.totalProblems || 0}
            icon={icons.total}
            accent="linear-gradient(90deg, #0b514a, #62a99b)"
            chipClass="bg-[#e9f4f0] text-[#0b6b60]"
          />

          <StatCard
            label="Newly Assigned"
            value={statistics?.assignedProblems || 0}
            icon={icons.assigned}
            accent="linear-gradient(90deg, #d99a2b, #f3ce7a)"
            chipClass="bg-[#f9f0dd] text-[#a2731b]"
          />

          <StatCard
            label="In Progress"
            value={statistics?.inProgressProblems || 0}
            icon={icons.progress}
            accent="linear-gradient(90deg, #c96a2d, #e9a06b)"
            chipClass="bg-[#faecdf] text-[#b05c2d]"
          />

          <StatCard
            label="Solved"
            value={statistics?.solvedProblems || 0}
            icon={icons.solved}
            accent="linear-gradient(90deg, #0b6b60, #7fc8b2)"
            chipClass="bg-[#e4f2ee] text-[#0b6b60]"
          />
        </section>

        {/* ========================================
            PROGRESS OVERVIEW
        ======================================== */}

        {statistics?.totalProblems > 0 && (
          <section
            className="ss-enter mb-8 rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm"
            style={{ "--ss-delay": "180ms" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#315d56]">
                Resolution Progress
              </h3>

              <p className="text-sm text-[#71827c]">
                <span className="font-bold text-[#0b6b60]">
                  {Math.round(
                    ((statistics?.solvedProblems || 0) /
                      statistics.totalProblems) *
                      100
                  )}
                  %
                </span>{" "}
                of assigned problems solved
              </p>
            </div>

            <div className="ss-progress-track mt-4">
              <div
                className="ss-progress-fill"
                style={{
                  width: `${Math.round(
                    ((statistics?.solvedProblems || 0) /
                      statistics.totalProblems) *
                      100
                  )}%`,
                }}
              />
            </div>
          </section>
        )}

        {/* ========================================
            ACTIVE PROJECTS & COLLABORATIONS
        ======================================== */}

        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#173d3a]">
                Projects & Collaborations
              </h2>
              <p className="mt-1 text-sm text-[#71827c]">
                Projects your organization leads or collaborates on.
              </p>
            </div>

            {setPartnerPage && (
              <button
                type="button"
                onClick={() => setPartnerPage("projects")}
                className="text-sm font-semibold text-[#0b6b60] hover:underline"
              >
                View all in Projects tab →
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-[#e3e9e3] bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-[#71827c]">
                No active projects or collaborations linked to your organization yet.
              </p>
              {setPartnerPage && (
                <button
                  type="button"
                  onClick={() => setPartnerPage("directory")}
                  className="mt-3 inline-block rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a]"
                >
                  Discover Projects to Collaborate
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {projects.map((project) => {
                const isLeadOrg = String(project.partner?._id || project.partner) === String(partner?._id);
                const completedMilestones = (project.milestones || []).filter((m) => m.completed).length;
                const totalMilestones = (project.milestones || []).length;

                return (
                  <article
                    key={project._id}
                    className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#173d3a]">
                          {project.title}
                        </h3>
                        {project.problem && (
                          <p className="mt-1 text-sm text-[#71827c]">
                            <span className="font-semibold text-[#5c6f69]">Linked Problem:</span> {project.problem.title}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(project.status)}`}
                      >
                        {formatStatus(project.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span
                        className={`rounded-full px-2.5 py-0.5 ${
                          isLeadOrg
                            ? "bg-[#0b514a]/10 text-[#0b514a]"
                            : "bg-[#31527c]/10 text-[#31527c]"
                        }`}
                      >
                        {isLeadOrg
                          ? "✦ Lead Organization"
                          : `Lead: ${project.partner?.name || "Partner"}`}
                      </span>

                      {totalMilestones > 0 && (
                        <span className="rounded-full bg-[#f7f8f5] px-2.5 py-0.5 text-[#5c6f69]">
                          Milestones: {completedMilestones}/{totalMilestones}
                        </span>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[#5c6f69]">
                      {project.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#eef2ee] pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (setSelectedPartnerProjectId) {
                            setSelectedPartnerProjectId(project._id);
                          }
                          if (setPartnerPage) {
                            setPartnerPage("workspace");
                          }
                        }}
                        className="rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a]"
                      >
                        Open Workspace
                      </button>

                      {setPartnerPage && (
                        <button
                          type="button"
                          onClick={() => setPartnerPage("projects")}
                          className="text-xs font-semibold text-[#0b6b60] hover:underline"
                        >
                          Manage details →
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================
            ASSIGNED PROBLEMS
        ======================================== */}

        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-[#173d3a]">
              Assigned Problems
            </h2>

            <p className="mt-1 text-sm text-[#71827c]">
              Problems assigned to your organization.
            </p>
          </div>

          {problems.length === 0 ? (
            <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f4f0] text-[#0b6b60]">
                <Icon path={icons.assigned} className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-[#315d56]">
                No problems have been assigned yet
              </h3>

              <p className="mt-2 text-sm text-[#71827c]">
                New assignments from the admin team will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {problems.map((problem) => {
                const edgeColor =
                  problem.status === "assigned"
                    ? "#f3ce7a"
                    : problem.status === "in_progress"
                      ? "#e9a06b"
                      : "#7fc8b2";

                return (
                  <article
                    key={problem._id}
                    style={{ "--ss-edge": edgeColor }}
                    className="ss-accent-edge rounded-2xl border border-[#e3e9e3] bg-white p-6 pl-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* PROBLEM HEADER */}

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-[#173d3a]">
                        {problem.title}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          problem.status
                        )}`}
                      >
                        {formatStatus(problem.status)}
                      </span>
                    </div>

                    {/* CATEGORY */}

                    {problem.category && (
                      <div className="mt-2">
                        <span className="rounded-full bg-[#f7f8f5] px-3 py-1 text-xs font-semibold capitalize text-[#5c6f69]">
                          {problem.category}
                        </span>
                      </div>
                    )}

                    {/* DESCRIPTION */}

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#5c6f69]">
                      {problem.description}
                    </p>

                    {/* DETAILS */}

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#eef2ee] pt-4 text-sm text-[#71827c]">
                      {problem.location && (
                        <p className="inline-flex items-center gap-1.5">
                          <Icon path={icons.location} className="h-4 w-4 text-[#8fb5ad]" />
                          {problem.location}
                        </p>
                      )}

                      {problem.submittedBy && (
                        <p className="inline-flex items-center gap-1.5">
                          <Icon path={icons.person} className="h-4 w-4 text-[#8fb5ad]" />
                          Submitted by: {problem.submittedBy.name}
                        </p>
                      )}
                    </div>

                    {/* STATUS ACTIONS */}

                    <div className="mt-6 flex flex-wrap gap-3">
                      {problem.status === "assigned" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(problem._id, "in_progress")
                          }
                          disabled={updatingId === problem._id}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] hover:shadow-md disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                        >
                          {updatingId === problem._id
                            ? "Updating..."
                            : "Start Working"}
                        </button>
                      )}

                      {problem.status === "in_progress" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(problem._id, "solved")
                          }
                          disabled={updatingId === problem._id}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#087f70] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#066a5d] hover:shadow-md disabled:cursor-not-allowed disabled:bg-[#7fb8ae]"
                        >
                          <Icon path={icons.solved} className="h-4 w-4" />
                          {updatingId === problem._id
                            ? "Updating..."
                            : "Mark as Solved"}
                        </button>
                      )}

                      {problem.status === "solved" && (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-[#e1f1ed] px-4 py-2 text-sm font-semibold text-[#087f70]">
                          <Icon path={icons.solved} className="h-4 w-4" />
                          Problem Solved
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </div>

    </main>
  );
};

export default PartnerDashboard;
import { useEffect, useMemo, useRef, useState } from "react";

import { getAllProblems } from "../services/problemService";
import { deleteProblemByAdmin } from "../services/adminService";
import { MiniLifecycleBar } from "../components/LifecycleStepper";

const statusStyles = {
  submitted: "bg-[#f7ebd8] text-[#a25a1b]",
  under_review: "bg-[#d8ebe4] text-[#087f70]",
  assigned: "bg-[#e5dcf2] text-[#564680]",
  in_progress: "bg-[#fbe5d8] text-[#b05c2d]",
  solved: "bg-[#e1f1ed] text-[#087f70]",
};

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  solved: "Solved",
};

const aiStatusStyles = {
  confirmed_duplicate: "bg-red-100 text-red-700",
  marked_recurring: "bg-[#e5dcf2] text-[#564680]",
  confirmed_separate: "bg-[#e1f1ed] text-[#087f70]",
  pending: "bg-[#f7ebd8] text-[#a25a1b]",
};

const aiStatusLabels = {
  confirmed_duplicate: "Duplicate",
  marked_recurring: "Recurring",
  confirmed_separate: "Separate",
  pending: "Pending AI Review",
};

// ========================================
// AI PRIORITY BANDS
// ========================================

const priorityStyles = {
  urgent: "bg-[#fbe5d8] text-[#b05c2d]",
  elevated: "bg-[#f7ebd8] text-[#a25a1b]",
  standard: "bg-[#f2f5f1] text-[#5c6f69]",
};

const priorityLabels = {
  urgent: "Urgent",
  elevated: "Elevated",
  standard: "Standard",
};

// Left accent edge colour per status for list rows.

const statusEdgeColors = {
  submitted: "#f3ce7a",
  under_review: "#62a99b",
  assigned: "#b49ade",
  in_progress: "#e9a06b",
  solved: "#7fc8b2",
};

// ========================================
// STAT CARD ICONS
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
  submitted: <path d="M22 12h-6l-2 3h-4l-2-3H2m1.5-6h17l2.5 6v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-6l2.5-6Z" />,
  review: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M8 11h6M11 8v6" /></>,
  assigned: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  progress: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  solved: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />,
  urgent: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />,
  elevated: <path d="M12 19V5M5 12l7-7 7 7" />,
};

const AdminDashboard = ({ setAdminPage, setSelectedAdminProblemId }) => {
  // ========================================
  // STATE
  // ========================================

  const [problems, setProblems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  // ========================================
  // SEARCH + FILTER STATE
  // ========================================

  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [locationFilter, setLocationFilter] = useState("all");

  const [assignmentFilter, setAssignmentFilter] = useState("all");

  // AI priority band filter + queue sort.

  const [priorityFilter, setPriorityFilter] = useState("all");

  const [sortOrder, setSortOrder] = useState("priority");

  const [deletingId, setDeletingId] = useState(null);

  const problemsSectionRef = useRef(null);

  // ========================================
  // FETCH PROBLEMS
  // ========================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login to view dashboard.");

        return;
      }

      const data = await getAllProblems(token);

      setProblems(data.problems || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);

      setMessage(
        error.response?.data?.message || "Failed to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ========================================
  // VIEW PROBLEM DETAILS
  // ========================================

  const handleViewDetails = (problemId) => {
    setSelectedAdminProblemId(problemId);

    setAdminPage("problem-details");
  };

  // ========================================
  // DELETE PROBLEM (ADMIN)
  // ========================================

  const handleDeleteProblem = async (event, problemId, problemTitle) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete this problem?\n\n"${problemTitle}"\n\nThis will remove all associated projects, proposals, and records.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(problemId);
      const token = localStorage.getItem("token");
      await deleteProblemByAdmin(problemId, token);

      // Remove from local list immediately
      setProblems((current) => current.filter((p) => p._id !== problemId));
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to delete problem."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================
  // STAT CARD FILTER + AUTO-SCROLL
  // ========================================

  const scrollToProblems = () => {
    requestAnimationFrame(() => {
      if (problemsSectionRef.current) {
        const navHeight = 75;
        const rect = problemsSectionRef.current.getBoundingClientRect();
        const targetY = window.pageYOffset + rect.top - navHeight;

        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth",
        });
      }
    });
  };

  const handleStatCardClick = (status) => {
    setStatusFilter(status);
    scrollToProblems();
  };

  // ========================================
  // FILTER OPTIONS
  // ========================================

  const categories = useMemo(() => {
    return [
      ...new Set(problems.map((problem) => problem.category).filter(Boolean)),
    ].sort();
  }, [problems]);

  const locations = useMemo(() => {
    return [
      ...new Set(problems.map((problem) => problem.location).filter(Boolean)),
    ].sort();
  }, [problems]);

  // ========================================
  // FILTERED PROBLEMS
  // ========================================

  const filteredProblems = useMemo(() => {
    const filtered = problems.filter((problem) => {
      const query = searchQuery.trim().toLowerCase();

      // SEARCH

      const searchableText = [
        problem.title,

        problem.description,

        problem.category,

        problem.location,

        problem.submittedBy?.name,

        problem.submittedBy?.email,

        problem.assignedPartner?.name,

        problem.assignedPartner?.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      // STATUS FILTER

      const matchesStatus =
        statusFilter === "all" || problem.status === statusFilter;

      // CATEGORY FILTER

      const matchesCategory =
        categoryFilter === "all" || problem.category === categoryFilter;

      // LOCATION FILTER

      const matchesLocation =
        locationFilter === "all" || problem.location === locationFilter;

      // ASSIGNMENT FILTER

      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && problem.assignedPartner) ||
        (assignmentFilter === "unassigned" && !problem.assignedPartner);

      // AI PRIORITY FILTER

      const band = problem.aiPriorityBand || "standard";

      const matchesPriority =
        priorityFilter === "all" || band === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesLocation &&
        matchesAssignment &&
        matchesPriority
      );
    });

    // SORT: priority (score desc, newest first on ties) or
    // newest first.

    return filtered.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      const scoreDiff =
        (b.aiPriorityScore || 0) - (a.aiPriorityScore || 0);

      if (scoreDiff !== 0) return scoreDiff;

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [
    problems,

    searchQuery,

    statusFilter,

    categoryFilter,

    locationFilter,

    assignmentFilter,

    priorityFilter,

    sortOrder,
  ]);

  // ========================================
  // CLEAR FILTERS
  // ========================================

  const handleClearFilters = () => {
    setSearchQuery("");

    setStatusFilter("all");

    setCategoryFilter("all");

    setLocationFilter("all");

    setAssignmentFilter("all");

    setPriorityFilter("all");
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    locationFilter !== "all" ||
    assignmentFilter !== "all" ||
    priorityFilter !== "all";

  // ========================================
  // DASHBOARD STATISTICS
  // ========================================

  const statistics = {
    total: problems.length,

    submitted: problems.filter((problem) => problem.status === "submitted")
      .length,

    underReview: problems.filter((problem) => problem.status === "under_review")
      .length,

    assigned: problems.filter((problem) => problem.status === "assigned")
      .length,

    inProgress: problems.filter((problem) => problem.status === "in_progress")
      .length,

    solved: problems.filter((problem) => problem.status === "solved").length,

    urgent: problems.filter(
      (problem) => (problem.aiPriorityBand || "standard") === "urgent",
    ).length,

    elevated: problems.filter(
      (problem) => (problem.aiPriorityBand || "standard") === "elevated",
    ).length,
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8ebe4] border-t-[#0b514a]" />
          <p className="text-lg font-medium text-[#5c6f69]">
            Loading admin dashboard...
          </p>
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
        {/* Hero Header */}

        <section className="ss-dash-hero ss-enter mb-8 p-8 shadow-lg sm:p-10">
          <div className="ss-hero-ring right-24 top-6 h-40 w-40" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9c985]">
              Government Admin Portal
            </p>

            <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Review, prioritise and route community problems. AI-scored urgency
              surfaces what needs your attention first.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span
                  className="h-2 w-2 rounded-full bg-[#7ee2c4]"
                  style={{ animation: "ss-pulse-dot 2s ease-in-out infinite" }}
                />
                {statistics.total} problems in the pipeline
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                <Icon path={icons.urgent} className="h-4 w-4 text-[#f5a26b]" />
                {statistics.urgent} urgent
              </span>
            </div>
          </div>
        </section>

        {/* Error */}

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        {/* Statistics */}

        <section className="ss-enter mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ "--ss-delay": "120ms" }}>
          <StatCard
            label="Total"
            value={statistics.total}
            icon={icons.total}
            accent="linear-gradient(90deg, #0b514a, #62a99b)"
            chipClass="bg-[#e9f4f0] text-[#0b6b60]"
            isActive={statusFilter === "all" && priorityFilter === "all"}
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              scrollToProblems();
            }}
          />

          <StatCard
            label="Submitted"
            value={statistics.submitted}
            icon={icons.submitted}
            accent="linear-gradient(90deg, #d99a2b, #f3ce7a)"
            chipClass="bg-[#f9f0dd] text-[#a2731b]"
            isActive={statusFilter === "submitted"}
            onClick={() => handleStatCardClick("submitted")}
          />

          <StatCard
            label="Under Review"
            value={statistics.underReview}
            icon={icons.review}
            accent="linear-gradient(90deg, #0d8a7a, #7fc8b2)"
            chipClass="bg-[#e4f2ee] text-[#087f70]"
            isActive={statusFilter === "under_review"}
            onClick={() => handleStatCardClick("under_review")}
          />

          <StatCard
            label="Assigned"
            value={statistics.assigned}
            icon={icons.assigned}
            accent="linear-gradient(90deg, #7c5cbf, #b49ade)"
            chipClass="bg-[#efeaf8] text-[#564680]"
            isActive={statusFilter === "assigned"}
            onClick={() => handleStatCardClick("assigned")}
          />

          <StatCard
            label="In Progress"
            value={statistics.inProgress}
            icon={icons.progress}
            accent="linear-gradient(90deg, #c96a2d, #e9a06b)"
            chipClass="bg-[#faecdf] text-[#b05c2d]"
            isActive={statusFilter === "in_progress"}
            onClick={() => handleStatCardClick("in_progress")}
          />

          <StatCard
            label="Solved"
            value={statistics.solved}
            icon={icons.solved}
            accent="linear-gradient(90deg, #0b6b60, #62a99b)"
            chipClass="bg-[#e4f2ee] text-[#0b6b60]"
            isActive={statusFilter === "solved"}
            onClick={() => handleStatCardClick("solved")}
          />

          <StatCard
            label="AI Urgent"
            value={statistics.urgent}
            icon={icons.urgent}
            accent="linear-gradient(90deg, #d64545, #f0938c)"
            chipClass="bg-[#fbe9e9] text-[#c03434]"
            isActive={priorityFilter === "urgent"}
            onClick={() => {
              setPriorityFilter((current) =>
                current === "urgent" ? "all" : "urgent",
              );
              scrollToProblems();
            }}
          />

          <StatCard
            label="AI Elevated"
            value={statistics.elevated}
            icon={icons.elevated}
            accent="linear-gradient(90deg, #b05c2d, #e9b06b)"
            chipClass="bg-[#faecdf] text-[#b05c2d]"
            isActive={priorityFilter === "elevated"}
            onClick={() => {
              setPriorityFilter((current) =>
                current === "elevated" ? "all" : "elevated",
              );
              scrollToProblems();
            }}
          />
        </section>

        {/* Problems */}

        <section
          ref={problemsSectionRef}
          id="problems-section"
          className="scroll-mt-20 rounded-2xl border border-[#e3e9e3] bg-white shadow-sm"
        >
          {/* Section Header */}

          <div className="border-b border-[#e3e9e3] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#173d3a]">
                  Manage Problems
                </h2>

                <p className="mt-1 text-sm text-[#71827c]">
                  Sorted by AI priority — urgent issues surface first. Open a
                  problem to review its complete details.
                </p>
              </div>

              {/* SORT */}

              <label className="flex items-center gap-2 text-sm text-[#5c6f69]">
                Sort by

                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="rounded-xl border border-[#dbe5df] bg-white px-3 py-2 text-sm text-[#315d56] outline-none focus:border-[#62a99b]"
                >
                  <option value="priority">AI priority</option>

                  <option value="newest">Newest first</option>
                </select>
              </label>
            </div>
          </div>

          {/* SEARCH + FILTERS */}

          <div className="border-b border-[#e3e9e3] bg-[#f2f5f1] p-6">
            <div className="flex flex-col gap-4">
              {/* Search */}

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title, description, category, location, citizen, or partner..."
                className="w-full rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#315d56] outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              />

              {/* Filters */}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Status */}

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#315d56] outline-none focus:border-[#62a99b]"
                >
                  <option value="all">All Statuses</option>

                  <option value="submitted">Submitted</option>

                  <option value="under_review">Under Review</option>

                  <option value="assigned">Assigned</option>

                  <option value="in_progress">In Progress</option>

                  <option value="solved">Solved</option>
                </select>

                {/* Category */}

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#315d56] outline-none focus:border-[#62a99b]"
                >
                  <option value="all">All Categories</option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {/* Location */}

                <select
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                  className="rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#315d56] outline-none focus:border-[#62a99b]"
                >
                  <option value="all">All Locations</option>

                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>

                {/* Assignment */}

                <select
                  value={assignmentFilter}
                  onChange={(event) => setAssignmentFilter(event.target.value)}
                  className="rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#315d56] outline-none focus:border-[#62a99b]"
                >
                  <option value="all">All Assignments</option>

                  <option value="assigned">Assigned</option>

                  <option value="unassigned">Unassigned</option>
                </select>
              </div>

              {/* Results + Clear */}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#71827c]">
                  Showing{" "}
                  <span className="font-semibold text-[#315d56]">
                    {filteredProblems.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#315d56]">
                    {problems.length}
                  </span>{" "}
                  problems
                </p>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="rounded-lg border border-[#dbe5df] bg-white px-4 py-2 text-sm font-semibold text-[#5c6f69] transition hover:bg-[#f7f8f5]"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Problem List */}

          <div className="divide-y divide-[#eef2ee]">
            {filteredProblems.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl">🔎</div>

                <h3 className="mt-4 text-lg font-semibold text-[#315d56]">
                  No problems found
                </h3>

                <p className="mt-2 text-sm text-[#71827c]">
                  Try changing your search or filter criteria.
                </p>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 rounded-xl bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a]"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <div
                  key={problem._id}
                  style={{
                    "--ss-edge":
                      statusEdgeColors[problem.status] || "#d8ebe4",
                  }}
                  className="ss-accent-edge flex flex-col gap-6 p-6 pl-7 transition-colors duration-200 hover:bg-[#fafbf9] lg:flex-row lg:items-center lg:justify-between"
                >
                  {/* Problem Information */}

                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-[#173d3a]">
                        {problem.title}
                      </h3>

                      {/* AI PRIORITY CHIP */}

                      {problem.aiPriorityScore > 0 && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            priorityStyles[
                              problem.aiPriorityBand || "standard"
                            ]
                          }`}
                          title={problem.aiPriorityBreakdown}
                        >
                          {priorityLabels[
                            problem.aiPriorityBand || "standard"
                          ]}{" "}
                          · {problem.aiPriorityScore}
                        </span>
                      )}

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[problem.status] ||
                          "bg-[#f7f8f5] text-[#315d56]"
                        }`}
                      >
                        {statusLabels[problem.status] || problem.status}
                      </span>

                      {problem.aiReviewStatus && problem.aiReviewStatus !== "pending" && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            aiStatusStyles[problem.aiReviewStatus] ||
                            "bg-[#f7f8f5] text-[#315d56]"
                          }`}
                        >
                          {aiStatusLabels[problem.aiReviewStatus] || problem.aiReviewStatus}
                        </span>
                      )}

                      {/* DUPLICATE CLUSTER BADGE */}

                      {(problem.clusterSize || 0) > 1 && (
                        <span
                          className="rounded-full bg-[#e5dcf2] px-3 py-1 text-xs font-semibold text-[#564680]"
                          title="Citizens reported this same issue multiple times in this area"
                        >
                          ⚡ {problem.clusterSize} reports in this area
                        </span>
                      )}

                    </div>

                    {/* AI SUMMARY — falls back to the raw description
                        for problems submitted before summarization
                        shipped. */}

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#5c6f69]">
                      {problem.aiSummary || problem.description}
                    </p>

                    {problem.aiSummary && (
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#899892]">
                        AI summary
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#71827c]">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon path={<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>} className="h-4 w-4 text-[#8fb5ad]" />
                        {problem.location}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Icon path={<path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82ZM7 7h.01" />} className="h-4 w-4 text-[#8fb5ad]" />
                        {problem.category}
                      </span>

                      {problem.submittedBy && (
                        <span className="inline-flex items-center gap-1.5">
                          <Icon path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} className="h-4 w-4 text-[#8fb5ad]" />
                          {problem.submittedBy.name}
                        </span>
                      )}
                    </div>

                    <MiniLifecycleBar status={problem.status} className="mt-3.5" />

                    {/* Assigned Partner */}

                    {/* Assigned Partner */}

                    {problem.assignedPartner &&
                      problem.status !== "submitted" &&
                      problem.status !== "under_review" && (
                        <div className="mt-4 rounded-xl bg-[#f0ecf8] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5a94]">
                            Assigned Partner
                          </p>

                          <p className="mt-1 font-semibold text-[#3d2f63]">
                            🏢 {problem.assignedPartner.name}
                          </p>

                          <p className="mt-1 text-sm text-[#564680]">
                            {problem.assignedPartner.type}

                            {problem.assignedPartner.location &&
                              ` • ${problem.assignedPartner.location}`}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Actions */}

                  <div className="flex flex-col gap-2 sm:flex-row lg:min-w-48 lg:items-center lg:justify-end">
                    <button
                      onClick={() => handleViewDetails(problem._id)}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b514a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#073f3a] hover:shadow-md lg:w-auto"
                    >
                      View Details

                      <Icon
                        path={<path d="M5 12h14m-6-6 6 6-6 6" />}
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(event) =>
                        handleDeleteProblem(event, problem._id, problem.title)
                      }
                      disabled={deletingId === problem._id}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50/70 p-3 text-red-600 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Permanently delete problem"
                    >
                      <Icon
                        path={
                          <>
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </>
                        }
                        className="h-4 w-4"
                      />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

// ========================================
// STAT CARD
// ========================================

const StatCard = ({
  label,
  value,
  icon,
  accent,
  chipClass,
  isActive,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ "--ss-accent": accent }}
      className={`ss-stat-card p-5 text-left focus:outline-none focus:ring-2 focus:ring-[#8fc0b4] ${
        isActive ? "is-active" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#71827c]">{label}</p>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${chipClass}`}
        >
          <Icon path={icon} />
        </span>
      </div>

      <p className="ss-stat-value mt-2 text-3xl font-bold text-[#173d3a]">
        {value}
      </p>
    </button>
  );
};

export default AdminDashboard;

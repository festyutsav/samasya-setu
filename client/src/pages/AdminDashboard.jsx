import { useEffect, useMemo, useState } from "react";

import { getAllProblems } from "../services/problemService";

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

  // ========================================
  // FETCH PROBLEMS
  // ========================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");

        return;
      }

      const problemsData = await getAllProblems(token);

      setProblems(problemsData.problems || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch dashboard data.",
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
  // STAT CARD FILTER
  // ========================================

  const handleStatCardClick = (status) => {
    setStatusFilter(status);
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
    return problems.filter((problem) => {
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

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesLocation &&
        matchesAssignment
      );
    });
  }, [
    problems,

    searchQuery,

    statusFilter,

    categoryFilter,

    locationFilter,

    assignmentFilter,
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
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    locationFilter !== "all" ||
    assignmentFilter !== "all";

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
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-medium text-slate-600">
          Loading admin dashboard...
        </p>
      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>

          <p className="mt-2 text-slate-600">
            Review and manage community problems.
          </p>
        </div>

        {/* Error */}

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        {/* Statistics */}

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Total"
            value={statistics.total}
            isActive={statusFilter === "all"}
            onClick={() => handleStatCardClick("all")}
          />

          <StatCard
            label="Submitted"
            value={statistics.submitted}
            isActive={statusFilter === "submitted"}
            onClick={() => handleStatCardClick("submitted")}
          />

          <StatCard
            label="Under Review"
            value={statistics.underReview}
            isActive={statusFilter === "under_review"}
            onClick={() => handleStatCardClick("under_review")}
          />

          <StatCard
            label="Assigned"
            value={statistics.assigned}
            isActive={statusFilter === "assigned"}
            onClick={() => handleStatCardClick("assigned")}
          />

          <StatCard
            label="In Progress"
            value={statistics.inProgress}
            isActive={statusFilter === "in_progress"}
            onClick={() => handleStatCardClick("in_progress")}
          />

          <StatCard
            label="Solved"
            value={statistics.solved}
            isActive={statusFilter === "solved"}
            onClick={() => handleStatCardClick("solved")}
          />
        </section>

        {/* Problems */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Section Header */}

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800">
              Manage Problems
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search and filter problems, then open a problem to review its
              complete details.
            </p>
          </div>

          {/* SEARCH + FILTERS */}

          <div className="border-b border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-4">
              {/* Search */}

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title, description, category, location, citizen, or partner..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {/* Filters */}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Status */}

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
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
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
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
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
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
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="all">All Assignments</option>

                  <option value="assigned">Assigned</option>

                  <option value="unassigned">Unassigned</option>
                </select>
              </div>

              {/* Results + Clear */}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredProblems.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {problems.length}
                  </span>{" "}
                  problems
                </p>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Problem List */}

          <div className="divide-y divide-slate-100">
            {filteredProblems.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl">🔎</div>

                <h3 className="mt-4 text-lg font-semibold text-slate-700">
                  No problems found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try changing your search or filter criteria.
                </p>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <div
                  key={problem._id}
                  className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  {/* Problem Information */}

                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-800">
                        {problem.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[problem.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabels[problem.status] || problem.status}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {problem.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>📍 {problem.location}</span>

                      <span>🏷️ {problem.category}</span>

                      {problem.submittedBy && (
                        <span>👤 {problem.submittedBy.name}</span>
                      )}
                    </div>

                    {/* Assigned Partner */}

                    {/* Assigned Partner */}

                    {problem.assignedPartner &&
                      problem.status !== "submitted" &&
                      problem.status !== "under_review" && (
                        <div className="mt-4 rounded-xl bg-purple-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                            Assigned Partner
                          </p>

                          <p className="mt-1 font-semibold text-purple-900">
                            🏢 {problem.assignedPartner.name}
                          </p>

                          <p className="mt-1 text-sm text-purple-700">
                            {problem.assignedPartner.type}

                            {problem.assignedPartner.location &&
                              ` • ${problem.assignedPartner.location}`}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* View Details */}

                  <div className="flex lg:min-w-40 lg:justify-end">
                    <button
                      onClick={() => handleViewDetails(problem._id)}
                      className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 lg:w-auto"
                    >
                      View Details
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

const StatCard = ({ label, value, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 ${
        isActive
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
          : "border-slate-200 bg-white hover:border-blue-300"
      }`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
    </button>
  );
};

export default AdminDashboard;

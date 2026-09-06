import { useEffect, useState } from "react";
import { getAllProblems } from "../services/problemService";

const statusStyles = {
  submitted: "bg-[#f7ebd8] text-[#a25a1b]",
  under_review: "bg-[#d8ebe4] text-[#087f70]",
  assigned: "bg-[#e5dcf2] text-[#564680]",
  in_progress: "bg-[#fbe5d8] text-[#b05c2d]",
  solved: "bg-[#e1f1ed] text-[#087f70]",
};

const AllProblems = ({
  setCurrentPage,
  setSelectedProblemId,
  setBackPage,
}) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");
  const [selectedStatus, setSelectedStatus] =
    useState("all");
  const [locationSearch, setLocationSearch] =
    useState("");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Please login first.");
          return;
        }

        const data = await getAllProblems(token);

        setProblems(data.problems || []);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Failed to fetch problems.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Get unique categories from problems
  const categories = [
    ...new Set(
      problems
        .map((problem) => problem.category)
        .filter(Boolean),
    ),
  ];

  // Filter problems
  const filteredProblems = problems.filter((problem) => {
    const search = searchTerm.toLowerCase().trim();
    const location = locationSearch.toLowerCase().trim();

    const matchesSearch =
      !search ||
      problem.title?.toLowerCase().includes(search) ||
      problem.description?.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === "all" ||
      problem.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" ||
      problem.status?.toLowerCase() ===
        selectedStatus.toLowerCase();

    const matchesLocation =
      !location ||
      problem.location?.toLowerCase().includes(location);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesLocation
    );
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setLocationSearch("");
  };

  const handleViewDetails = (problemId) => {
    setSelectedProblemId(problemId);

    // Remember where the user came from
    setBackPage("all-problems");

    setCurrentPage("problem-details");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <p className="text-lg font-medium text-[#5c6f69]">
          Loading problems...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-[#173d3a]">
            Explore Problems
          </h1>

          <p className="mt-3 text-lg text-[#5c6f69]">
            Discover challenges submitted by communities.
          </p>
        </div>

        {/* Error */}
        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        {/* Filters */}
        {!message && problems.length > 0 && (
          <div className="mb-8 rounded-2xl border border-[#e3e9e3] bg-white p-5 shadow-sm">

            <div className="mb-5 flex flex-col gap-4 md:flex-row">

              {/* Search */}
              <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                  Search Problems
                </label>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  placeholder="Search by title or description..."
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* Location */}
              <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                  Location
                </label>

                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) =>
                    setLocationSearch(e.target.value)
                  }
                  placeholder="Search location..."
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end">

              {/* Category Filter */}
              <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                  Category
                </label>

                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value)
                  }
                  className="w-full rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-[#315d56] outline-none transition focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                >
                  <option value="all">
                    All Categories
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                  Status
                </label>

                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value)
                  }
                  className="w-full rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-[#315d56] outline-none transition focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                >
                  <option value="all">
                    All Statuses
                  </option>

                  <option value="submitted">
                    Submitted
                  </option>

                  <option value="under_review">
                    Under Review
                  </option>

                  <option value="assigned">
                    Assigned
                  </option>

                  <option value="in_progress">
                    In Progress
                  </option>

                  <option value="solved">
                    Resolved
                  </option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={handleClearFilters}
                className="rounded-xl border border-[#dbe5df] px-5 py-3 font-semibold text-[#5c6f69] transition hover:bg-[#f7f8f5]"
              >
                Clear Filters
              </button>

            </div>

          </div>
        )}

        {/* Results Count */}
        {!message && problems.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-[#71827c]">
              Showing{" "}
              <span className="font-bold text-[#315d56]">
                {filteredProblems.length}
              </span>{" "}
              of {problems.length} problems
            </p>
          </div>
        )}

        {/* Empty Database State */}
        {!message && problems.length === 0 ? (
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
            <div className="mb-4 text-5xl">
              🌍
            </div>

            <h2 className="text-2xl font-semibold text-[#173d3a]">
              No problems available yet
            </h2>

            <p className="mt-3 text-[#71827c]">
              Be the first person to submit a community challenge.
            </p>
          </div>
        ) : filteredProblems.length === 0 && !message ? (

          /* No Search Results */
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
            <div className="mb-4 text-5xl">
              🔎
            </div>

            <h2 className="text-2xl font-semibold text-[#173d3a]">
              No matching problems found
            </h2>

            <p className="mt-3 text-[#71827c]">
              Try changing your search or filters.
            </p>

            <button
              onClick={handleClearFilters}
              className="mt-6 rounded-xl bg-[#0b514a] px-5 py-3 font-semibold text-white transition hover:bg-[#073f3a]"
            >
              Clear All Filters
            </button>
          </div>

        ) : (

          /* Problems Grid */
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProblems.map((problem) => {
              const normalizedStatus =
                problem.status?.toLowerCase() || "";

              return (
                <article
                  key={problem._id}
                  className="flex flex-col rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-[#173d3a]">
                    {problem.title}
                  </h2>

                  {/* Description */}
                  <p className="mt-4 leading-relaxed text-[#5c6f69]">
                    {problem.description}
                  </p>

                  {/* Category */}
                  <div className="mt-6">
                    <span className="inline-flex rounded-full bg-[#d8ebe4] px-3 py-1 text-sm font-medium text-[#087f70]">
                      {problem.category}
                    </span>
                  </div>

                  {/* Problem Information */}
                  <div className="mt-6 space-y-4 border-t border-[#eef2ee] pt-5">

                    {/* Location */}
                    <div className="flex items-center gap-2 text-[#5c6f69]">
                      <span>📍</span>

                      <p>
                        <span className="font-semibold text-[#315d56]">
                          Location:
                        </span>{" "}
                        {problem.location}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#315d56]">
                        Status:
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                          statusStyles[normalizedStatus] ||
                          "bg-[#f7f8f5] text-[#315d56]"
                        }`}
                      >
                        {problem.status?.replace("_", " ")}
                      </span>
                    </div>

                    {/* Submitted By */}
                    {problem.submittedBy && (
                      <div className="text-sm text-[#71827c]">
                        Submitted by{" "}
                        <span className="font-semibold text-[#315d56]">
                          {problem.submittedBy.name}
                        </span>
                      </div>
                    )}

                    {/* View Details */}
                    <button
                      onClick={() =>
                        handleViewDetails(problem._id)
                      }
                      className="mt-2 w-full rounded-xl border border-[#bcd9cf] bg-[#e9f4f0] px-4 py-2.5 font-semibold text-[#087f70] transition hover:bg-[#d8ebe4]"
                    >
                      View Details
                    </button>

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

export default AllProblems;
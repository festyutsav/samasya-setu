import { useEffect, useMemo, useState } from "react";

import {
  getPartnerDirectory,
  requestCollaboration,
} from "../services/partnerService";

// ========================================
// HELPERS
// ========================================

const formatStatus = (status) =>
  (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatRole = (role) =>
  (role || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getTypeStyle = (type) => {
  switch (type) {
    case "university":
      return "bg-[#d8ebe4] text-[#087f70]";

    case "industry":
      return "bg-[#e0d7ef] text-[#564680]";

    default:
      return "bg-[#f7f8f5] text-[#315d56]";
  }
};

const getProjectStatusStyle = (status) => {
  switch (status) {
    case "planning":
      return "bg-[#f7ebd8] text-[#a25a1b]";

    case "active":
      return "bg-[#d8ebe4] text-[#087f70]";

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

const PartnerDirectory = ({ user, setPartnerPage }) => {
  // ========================================
  // STATE
  // ========================================

  const [partners, setPartners] = useState([]);

  const [allPartners, setAllPartners] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  const [typeFilter, setTypeFilter] = useState("all");

  const [expertiseFilter, setExpertiseFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] = useState(null);

  const [requestForm, setRequestForm] = useState({
    projectId: null,
    role: "mentor",
    message: "",
  });

  const [requesting, setRequesting] = useState(false);

  // ========================================
  // FETCH
  // ========================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const params = { excludeSelf: "true" };

      if (typeFilter !== "all") params.type = typeFilter;

      if (expertiseFilter !== "all") params.expertise = expertiseFilter;

      if (search.trim()) params.q = search.trim();

      const data = await getPartnerDirectory(token, params);

      setPartners(data.partners || []);
    } catch (error) {
      console.error("Fetch directory error:", error);

      setMessage(
        error.response?.data?.message || "Failed to load partner directory.",
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, expertiseFilter]);

  // Debounce the search box.

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Expertise tags union across the full (unfiltered) list.

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");

        const data = await getPartnerDirectory(token, { excludeSelf: "true" });

        setAllPartners(data.partners || []);
      } catch {
        // Non-critical — filter dropdown stays empty.
      }
    };

    fetchAll();
  }, []);

  const expertiseOptions = useMemo(() => {
    const tags = new Set();

    allPartners.forEach((partner) =>
      (partner.expertise || []).forEach((tag) => tags.add(tag)),
    );

    return Array.from(tags).sort();
  }, [allPartners]);

  // ========================================
  // COLLABORATION REQUEST
  // ========================================

  const handleRequest = async (event) => {
    event.preventDefault();

    try {
      setRequesting(true);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await requestCollaboration(
        requestForm.projectId,
        requestForm.role,
        requestForm.message,
        token,
      );

      setMessage(data.message || "Request sent.");

      setMessageType("success");

      setRequestForm({ projectId: null, role: "mentor", message: "" });
    } catch (error) {
      console.error("Request collaboration error:", error);

      setMessage(
        error.response?.data?.message || "Failed to send request.",
      );

      setMessageType("error");
    } finally {
      setRequesting(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading && partners.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8ebe4] border-t-[#0b514a]" />
          <p className="text-[#71827c]">Loading partner directory...</p>
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

        <div className="mb-8">
          <p className="text-sm font-semibold text-[#0b6b60]">
            PARTNER NETWORK
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#173d3a]">
            Discover Partners
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[#71827c]">
            Browse universities and industries in the network — see their
            expertise and the problems they are working on, and ask to
            collaborate.
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

        {/* FILTERS */}

        <div className="mb-8 rounded-2xl border border-[#e3e9e3] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* TYPE CHIPS */}

            <div className="flex flex-wrap items-center gap-2">
              {[
                ["all", "All Partners"],
                ["university", "Universities"],
                ["industry", "Industries"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeFilter(value)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    typeFilter === value
                      ? "border-[#0b514a] bg-[#0b514a] text-white shadow-sm"
                      : "border-[#e3e9e3] bg-white text-[#5c6f69] hover:border-[#9cc5ba] hover:text-[#173d3a]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* SEARCH + EXPERTISE */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={expertiseFilter}
                onChange={(event) => setExpertiseFilter(event.target.value)}
                className="rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-3 py-2.5 text-sm text-[#315d56] outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
              >
                <option value="all">All expertise</option>

                {expertiseOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {formatStatus(tag)}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search organizations..."
                className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-2.5 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb] sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* EMPTY STATE */}

        {partners.length === 0 ? (
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#173d3a]">
              No partners found
            </p>

            <p className="mt-2 text-sm text-[#71827c]">
              Try clearing the filters or search with a different term.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {partners.map((partner) => {
              const isExpanded = expandedId === partner._id;

              const openProjects = partner.projects || [];

              return (
                <article
                  key={partner._id}
                  className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* HEADER */}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#173d3a]">
                        {partner.name}
                      </h3>

                      {partner.location && (
                        <p className="mt-1 text-sm text-[#71827c]">
                          {partner.location}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getTypeStyle(partner.type)}`}
                    >
                      {partner.type}
                    </span>
                  </div>

                  {/* DESCRIPTION */}

                  {partner.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#5c6f69]">
                      {partner.description}
                    </p>
                  )}

                  {/* EXPERTISE TAGS */}

                  {(partner.expertise || []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {partner.expertise.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#f2f5f1] px-3 py-1 text-xs font-semibold capitalize text-[#5c6f69]"
                        >
                          {formatStatus(tag)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ACTIVITY COUNTS */}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-[#e9f4f0] px-3 py-1 text-[#0b6b60]">
                      {partner.activeProjects} active project
                      {partner.activeProjects === 1 ? "" : "s"}
                    </span>

                    <span className="rounded-full bg-[#f7ebd8] px-3 py-1 text-[#a25a1b]">
                      {partner.assignedProblems} problem
                      {partner.assignedProblems === 1 ? "" : "s"} in progress
                    </span>
                  </div>

                  {/* EXPAND TOGGLE */}

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((current) =>
                        current === partner._id ? null : partner._id,
                      )
                    }
                    className="mt-4 text-sm font-bold text-[#0b6b60] hover:underline"
                  >
                    {isExpanded
                      ? "Hide details"
                      : `View projects & collaborate (${openProjects.length})`}
                  </button>

                  {/* EXPANDED: PROJECTS + REQUEST */}

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-[#eef2ee] pt-4">
                      {openProjects.length === 0 ? (
                        <p className="text-sm text-[#71827c]">
                          This organization has no open projects right now.
                        </p>
                      ) : (
                        openProjects.map((project) => {
                          const isRequestingThis =
                            requestForm.projectId === project._id;

                          return (
                            <div
                              key={project._id}
                              className="rounded-xl border border-[#e3e9e3] bg-[#fbfcfa] p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-[#173d3a]">
                                    {project.title}
                                  </p>

                                  {project.problemTitle && (
                                    <p className="mt-0.5 text-xs text-[#71827c]">
                                      Problem: {project.problemTitle}
                                    </p>
                                  )}
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getProjectStatusStyle(project.status)}`}
                                >
                                  {formatStatus(project.status)}
                                </span>
                              </div>

                              {/* REQUEST FORM */}

                              {isRequestingThis ? (
                                <form
                                  onSubmit={handleRequest}
                                  className="mt-3 space-y-3"
                                >
                                  <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr]">
                                    <select
                                      value={requestForm.role}
                                      onChange={(event) =>
                                        setRequestForm((current) => ({
                                          ...current,
                                          role: event.target.value,
                                        }))
                                      }
                                      className="rounded-lg border border-[#dbe5df] bg-white px-3 py-2 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                                    >
                                      {COLLAB_ROLES.map((role) => (
                                        <option
                                          key={role.value}
                                          value={role.value}
                                        >
                                          {role.label}
                                        </option>
                                      ))}
                                    </select>

                                    <input
                                      type="text"
                                      value={requestForm.message}
                                      onChange={(event) =>
                                        setRequestForm((current) => ({
                                          ...current,
                                          message: event.target.value,
                                        }))
                                      }
                                      placeholder="Short note (optional)"
                                      className="rounded-lg border border-[#dbe5df] bg-white px-3 py-2 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      disabled={requesting}
                                      className="rounded-lg bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                                    >
                                      {requesting
                                        ? "Sending..."
                                        : "Send request"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRequestForm({
                                          projectId: null,
                                          role: "mentor",
                                          message: "",
                                        })
                                      }
                                      className="rounded-lg border border-[#e3e9e3] px-4 py-2 text-sm font-semibold text-[#5c6f69] transition hover:bg-[#f7f8f5]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRequestForm({
                                      projectId: project._id,
                                      role: "mentor",
                                      message: "",
                                    })
                                  }
                                  className="mt-3 rounded-lg bg-[#0b514a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#073f3a]"
                                >
                                  Ask to collaborate
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}

                      {/* CAPABILITIES */}

                      {(partner.capabilities || []).length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#899892]">
                            Capabilities
                          </p>

                          <p className="mt-2 text-sm capitalize text-[#5c6f69]">
                            {partner.capabilities
                              .map((tag) => formatStatus(tag))
                              .join(" · ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default PartnerDirectory;

import { useEffect, useMemo, useState } from "react";

import {
  createPartner,
  getAllPartners,
  deletePartner,
} from "../services/partnerService";

// ========================================
// CANONICAL EXPERTISE OPTIONS
// ========================================
// Same keys the AI classifier + routing engine use.

const EXPERTISE_OPTIONS = [
  "agriculture",
  "healthcare",
  "education",
  "water",
  "environment",
  "transportation",
  "energy",
  "waste",
  "public_safety",
  "technology",
];

const TYPE_STYLES = {
  university: "bg-[#d8ebe4] text-[#087f70]",
  industry: "bg-[#f7ebd8] text-[#a25a1b]",
  ngo: "bg-[#e5dcf2] text-[#564680]",
  government: "bg-[#e2e9f4] text-[#31527c]",
};

const AdminPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState("");

  // ========================================
  // DIRECTORY FILTER STATE
  // ========================================

  const [typeFilter, setTypeFilter] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    // Organization
    name: "",
    type: "university",
    description: "",
    location: "",
    email: "",
    website: "",

    // AI routing profile (comma-separated in the form)
    expertise: "",
    capabilities: "",
    districtsServed: "",

    // Partner login account
    userName: "",
    userEmail: "",
    password: "",
  });

  // ========================================
  // FETCH PARTNERS
  // ========================================

  const fetchPartners = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const data = await getAllPartners(token);

      setPartners(data.partners || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch partners.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // ========================================
  // HANDLE INPUT
  // ========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    // Multi-select returns one value via .value; collect all
    // selected options instead.

    if (event.target.multiple) {
      const selected = Array.from(event.target.selectedOptions).map(
        (option) => option.value,
      );

      setFormData((currentData) => ({
        ...currentData,
        [name]: selected,
      }));

      return;
    }

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  // ========================================
  // CREATE PARTNER
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setMessage("");

      const token = localStorage.getItem("token");

      const data = await createPartner(formData, token);

      // Add new partner to UI immediately
      setPartners((currentPartners) => [data.partner, ...currentPartners]);

      // Reset form
      setFormData({
        name: "",
        type: "university",
        description: "",
        location: "",
        email: "",
        website: "",
        expertise: "",
        capabilities: "",
        districtsServed: "",
        userName: "",
        userEmail: "",
        password: "",
      });

      setMessage("Partner created successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to create partner.",
      );
    } finally {
      setCreating(false);
    }
  };

  // ========================================
  // DELETE PARTNER
  // ========================================

  const handleDelete = async (partnerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this partner?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(partnerId);
      setMessage("");

      const token = localStorage.getItem("token");

      await deletePartner(partnerId, token);

      // Remove partner from UI immediately
      setPartners((currentPartners) =>
        currentPartners.filter((partner) => partner._id !== partnerId),
      );

      setMessage("Partner deleted successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to delete partner.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================
  // DIRECTORY STATISTICS
  // ========================================

  const stats = useMemo(
    () => ({
      all: partners.length,
      university: partners.filter((p) => p.type === "university").length,
      industry: partners.filter((p) => p.type === "industry").length,
      ngo: partners.filter((p) => p.type === "ngo").length,
      government: partners.filter((p) => p.type === "government").length,
    }),
    [partners],
  );

  // ========================================
  // FILTERED PARTNERS
  // ========================================

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return partners.filter((partner) => {
      const matchesType = typeFilter === "all" || partner.type === typeFilter;

      const searchable = [partner.name, partner.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);

      return matchesType && matchesSearch;
    });
  }, [partners, typeFilter, searchQuery]);

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#0b6b60]">
            ADMIN MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#173d3a]">
            Partner Directory
          </h1>

          <p className="mt-2 max-w-2xl text-[#5c6f69]">
            Universities and industries the AI routing engine can recommend
            when a citizen submits a problem. Expertise and district tags power
            the matching.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm ${
              message.toLowerCase().includes("successfully")
                ? "border border-[#bcd9cf] bg-[#e9f4f0] text-[#087f70]"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* ========================================
            DIRECTORY STATS + FILTERS
        ======================================== */}

        <section className="mb-8 rounded-2xl border border-[#e3e9e3] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {[
              ["all", "All partners"],
              ["university", "Universities"],
              ["industry", "Industries"],
              ["ngo", "NGOs"],
              ["government", "Government"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  typeFilter === key
                    ? "bg-[#0b514a] text-white shadow-md shadow-[#0b514a]/15"
                    : "border border-[#e3e9e3] bg-[#f7f8f5] text-[#315d56] hover:border-[#9cc5ba]"
                }`}
              >
                {label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    typeFilter === key
                      ? "bg-white/20 text-white"
                      : "bg-[#e3e9e3] text-[#5c6f69]"
                  }`}
                >
                  {stats[key]}
                </span>
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or location..."
            className="mt-4 w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
          />
        </section>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ========================================
              CREATE PARTNER FORM
          ======================================== */}

          <section className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-xl font-bold text-[#173d3a]">
              Add New Partner
            </h2>

            <p className="mt-1 text-sm text-[#71827c]">
              Add an organization so the AI can route matching problems to it.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Organization Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter organization name"
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Partner Type *
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                >
                  <option value="university">University</option>

                  <option value="industry">Industry</option>

                  <option value="ngo">NGO</option>

                  <option value="government">Government</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="What does this organization do?"
                  className="w-full resize-none rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* Location */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City or region"
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* ========================================
                  AI ROUTING PROFILE
              ======================================== */}

              <div className="rounded-xl border border-[#e3e9e3] bg-[#f7f8f5] p-4">
                <h3 className="text-sm font-bold text-[#173d3a]">
                  AI Routing Profile
                </h3>

                <p className="mt-1 text-xs text-[#71827c]">
                  Tag the domains and districts this organization can work in —
                  the AI matches these when a problem is submitted.
                </p>

                {/* Expertise */}
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-[#315d56]">
                    Expertise domains
                  </span>

                  <select
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    multiple
                    size={5}
                    className="w-full rounded-xl border border-[#dbe5df] px-3 py-2 text-sm outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                  >
                    {EXPERTISE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>

                  <span className="mt-1 block text-xs text-[#a1aca7]">
                    Hold Ctrl / Cmd to select multiple
                  </span>
                </label>

                {/* Capabilities */}
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-[#315d56]">
                    Capabilities{" "}
                    <span className="font-normal text-[#a1aca7]">
                      (comma-separated)
                    </span>
                  </span>

                  <input
                    type="text"
                    name="capabilities"
                    value={formData.capabilities}
                    onChange={handleChange}
                    placeholder="research, prototyping, funding"
                    className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                  />
                </label>

                {/* Districts */}
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-[#315d56]">
                    Districts served{" "}
                    <span className="font-normal text-[#a1aca7]">
                      (comma-separated)
                    </span>
                  </span>

                  <input
                    type="text"
                    name="districtsServed"
                    value={formData.districtsServed}
                    onChange={handleChange}
                    placeholder="Ranchi, Dhanbad, Bokaro"
                    className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                  />
                </label>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* Website */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Website
                </label>

                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* ========================================
                  PARTNER LOGIN ACCOUNT
              ======================================== */}

              <div className="border-t border-[#e3e9e3] pt-5">
                <h3 className="text-sm font-bold text-[#173d3a]">
                  Partner Login Account
                </h3>

                <p className="mt-1 text-xs text-[#71827c]">
                  These credentials will be used by the organization to access
                  the Partner Dashboard.
                </p>
              </div>

              {/* Manager name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Manager Name *
                </label>

                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  required
                  placeholder="Enter manager name"
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* Login email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Login Email *
                </label>

                <input
                  type="email"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleChange}
                  required
                  placeholder="partner@example.com"
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#315d56]">
                  Login Password *
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 outline-none focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-[#0b514a] px-4 py-3 font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
              >
                {creating ? "Adding Partner..." : "Add Partner"}
              </button>
            </form>
          </section>

          {/* ========================================
              PARTNERS LIST
          ======================================== */}

          <section className="lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#173d3a]">
                  Registered Organizations
                </h2>

                <p className="mt-1 text-sm text-[#71827c]">
                  Showing {filteredPartners.length} of {partners.length}{" "}
                  organizations
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
                <p className="text-[#71827c]">Loading partners...</p>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
                <p className="text-[#71827c]">
                  No organizations match this filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredPartners.map((partner) => (
                  <article
                    key={partner._id}
                    className="flex flex-col rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#173d3a]">
                          {partner.name}
                        </h3>

                        <span
                          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            TYPE_STYLES[partner.type] ||
                            "bg-[#f2f5f1] text-[#315d56]"
                          }`}
                        >
                          {partner.type}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(partner._id)}
                        disabled={deletingId === partner._id}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:text-red-300"
                      >
                        {deletingId === partner._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>

                    {partner.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#5c6f69]">
                        {partner.description}
                      </p>
                    )}

                    {/* EXPERTISE TAGS */}

                    {partner.expertise && partner.expertise.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#899892]">
                          Expertise
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {partner.expertise.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#e9f4f0] px-2.5 py-1 text-xs font-medium capitalize text-[#087f70]"
                            >
                              {tag.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DISTRICTS */}

                    {partner.districtsServed &&
                      partner.districtsServed.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#899892]">
                            Districts served
                          </p>

                          <p className="mt-1 text-xs text-[#5c6f69]">
                            {partner.districtsServed.join(" · ")}
                          </p>
                        </div>
                      )}

                    {/* CONTACT */}

                    <div className="mt-auto space-y-1 border-t border-[#eef2ee] pt-4 text-sm text-[#71827c]">
                      {partner.location && (
                        <p className="pt-2">📍 {partner.location}</p>
                      )}

                      {partner.email && <p>✉️ {partner.email}</p>}

                      {partner.website && (
                        <p className="truncate">🌐 {partner.website}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminPartners;

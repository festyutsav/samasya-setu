import { useEffect, useState } from "react";

import {
  createPartner,
  getAllPartners,
  deletePartner,
} from "../services/partnerService";

const AdminPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({

  // Organization

  name: "",

  type: "university",

  description: "",

  location: "",

  email: "",

  website: "",


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
        error.response?.data?.message ||
          "Failed to fetch partners.",
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

      const data = await createPartner(
        formData,
        token,
      );

      // Add new partner to UI immediately
      setPartners((currentPartners) => [
        data.partner,
        ...currentPartners,
      ]);

      // Reset form
      setFormData({

  name: "",
  type: "university",
  description: "",
  location: "",
  email: "",
  website: "",

  userName: "",
  userEmail: "",
  password: "",

});

      setMessage("Partner created successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to create partner.",
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
        currentPartners.filter(
          (partner) =>
            partner._id !== partnerId,
        ),
      );

      setMessage("Partner deleted successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to delete partner.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            ADMIN MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Partner Management
          </h1>

          <p className="mt-2 text-slate-600">
            Manage universities, industries, NGOs, and
            government organizations that can help solve
            community problems.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm ${
              message
                .toLowerCase()
                .includes("successfully")
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ========================================
              CREATE PARTNER FORM
          ======================================== */}

          <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-xl font-bold text-slate-800">
              Add New Partner
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add an organization that can collaborate
              on solving problems.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Organization Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter organization name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Partner Type *
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="university">
                    University
                  </option>

                  <option value="industry">
                    Industry
                  </option>

                  <option value="ngo">
                    NGO
                  </option>

                  <option value="government">
                    Government
                  </option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="What does this organization do?"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Location */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City or region"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Website */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Website
                </label>

                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              {/* ========================================
    PARTNER LOGIN ACCOUNT
======================================== */}

<div className="border-t border-slate-200 pt-5">

  <h3 className="text-sm font-bold text-slate-800">
    Partner Login Account
  </h3>

  <p className="mt-1 text-xs text-slate-500">
    These credentials will be used by the
    organization to access the Partner Dashboard.
  </p>

</div>


{/* MANAGER NAME */}

<div>

  <label className="mb-2 block text-sm font-medium text-slate-700">
    Manager Name *
  </label>

  <input
    type="text"
    name="userName"
    value={formData.userName}
    onChange={handleChange}
    required
    placeholder="Enter manager name"
    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
  />

</div>


{/* LOGIN EMAIL */}

<div>

  <label className="mb-2 block text-sm font-medium text-slate-700">
    Login Email *
  </label>

  <input
    type="email"
    name="userEmail"
    value={formData.userEmail}
    onChange={handleChange}
    required
    placeholder="partner@example.com"
    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
  />

</div>


{/* LOGIN PASSWORD */}

<div>

  <label className="mb-2 block text-sm font-medium text-slate-700">
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
    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
  />

</div>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {creating
                  ? "Adding Partner..."
                  : "Add Partner"}
              </button>
            </form>
          </section>

          {/* ========================================
              PARTNERS LIST
          ======================================== */}

          <section className="lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Registered Partners
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {partners.length} partner
                  {partners.length !== 1 ? "s" : ""} registered
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-slate-500">
                  Loading partners...
                </p>
              </div>
            ) : partners.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-slate-500">
                  No partners have been added yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {partners.map((partner) => (
                  <article
                    key={partner._id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {partner.name}
                        </h3>

                        <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                          {partner.type}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleDelete(partner._id)
                        }
                        disabled={
                          deletingId === partner._id
                        }
                        className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:text-red-300"
                      >
                        {deletingId === partner._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>

                    {partner.description && (
                      <p className="mt-4 text-sm leading-relaxed text-slate-600">
                        {partner.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">

                      {partner.location && (
                        <p>
                          📍 {partner.location}
                        </p>
                      )}

                      {partner.email && (
                        <p>
                          ✉️ {partner.email}
                        </p>
                      )}

                      {partner.website && (
                        <p className="truncate">
                          🌐 {partner.website}
                        </p>
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
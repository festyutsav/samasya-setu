import { useEffect, useState } from "react";

import {
  createPartner,
  getAllPartners,
  deletePartner,
} from "../services/partnerService";

import {
  downloadPartnerCredentials,
} from "../services/adminService";


const PartnerManagement = ({ setAdminPage }) => {

  // ========================================
  // STATE
  // ========================================

  const [partners, setPartners] =
    useState([]);

  const [loading, setLoading] =
    useState(true);
  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [filterType, setFilterType] =
    useState("all");

  // One-time view of the credentials returned when a partner
  // is created — passwords are hashed in the DB, so this panel
  // and the credentials download are the only places the
  // plaintext ever appears.

  const [lastCredentials, setLastCredentials] =
    useState(null);

  const [revealedIds, setRevealedIds] =
    useState({});

  const [downloading, setDownloading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showAddForm, setShowAddForm] =
    useState(false);


  // ========================================
  // FORM DATA
  // ========================================

  const [formData, setFormData] =
    useState({

      // Organization details

      name: "",

      type: "university",

      description: "",

      location: "",

      email: "",

      website: "",


      // AI routing profile

      expertise: "",

      capabilities: "",

      districtsServed: "",


      // Partner login details

      userName: "",

      userEmail: "",

      password: "",

    });


  // ========================================
  // DOWNLOAD CREDENTIALS
  // ========================================
  // The credentials endpoint requires the admin Bearer token,
  // so the file is fetched as a Blob and saved via a temporary
  // anchor — window.open() would send an unauthenticated
  // request and always fail.

  const handleDownloadCredentials = async () => {

    const token =
      localStorage.getItem("token");

    if (!token) {

      setMessage("Please login as admin first.");

      setMessageType("error");

      return;

    }


    try {

      setDownloading(true);

      setMessage("");

      setMessageType("");


      const response =
        await downloadPartnerCredentials(token);


      const blob = new Blob([response.data], {

        type: "application/json",

      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = "partner_credentials.json";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);


      setMessage(

        "Partner credentials downloaded successfully."

      );

      setMessageType("success");

    } catch (error) {

      console.error(

        "Download credentials error:",

        error

      );


      setMessage(

        error.response?.status === 404

          ? "Credentials file not found on the server. Run the seed script first."

          : "Failed to download credentials."

      );

      setMessageType("error");

    } finally {

      setDownloading(false);

    }

  };


  // ========================================
  // TOGGLE PASSWORD VISIBILITY
  // ========================================

  const togglePasswordVisibility = (partnerId) => {

    setRevealedIds((current) => ({

      ...current,

      [partnerId]: !current[partnerId],

    }));

  };


  // ========================================
  // FETCH PARTNERS
  // ========================================

  const fetchPartners = async () => {

    try {

      setLoading(true);

      setMessage("");

      setMessageType("");


      const token =
        localStorage.getItem("token");


      if (!token) {

        setMessage(
          "Please login first."
        );

        return;

      }


      const data =
        await getAllPartners(token);


      setPartners(
        data.partners || []
      );

    } catch (error) {

      console.error(
        "Fetch partners error:",
        error
      );


      setMessage(

        error.response?.data?.message ||

        "Failed to fetch partners."

      );

      setMessageType("error");

    } finally {

      setLoading(false);

    }

  };


  // ========================================
  // FILTER LOGIC
  // ========================================

  const filteredPartners = partners
    .filter(
      (partner) =>
        partner.type === "university" || partner.type === "industry"
    )
    .filter((partner) => {
      const matchesSearch =
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" || partner.type === filterType;

      return matchesSearch && matchesType;
    });


  // ========================================
  // LOAD PARTNERS
  // ========================================

  useEffect(() => {

    fetchPartners();

  }, []);


  // ========================================
  // HANDLE INPUT
  // ========================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (currentData) => ({

        ...currentData,

        [name]: value,

      })
    );

  };


  // ========================================
  // CREATE PARTNER
  // ========================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    try {

      setSubmitting(true);

      setMessage("");

      setMessageType("");


      const token =
        localStorage.getItem("token");


      if (!token) {

        setMessage(
          "Please login first."
        );

        return;

      }


      const data =
        await createPartner(
          formData,
          token
        );


      // Add new partner to UI

      setPartners(
        (currentPartners) => [

          data.partner,

          ...currentPartners,

        ]
      );


      // One-time plaintext credentials for this partner

      if (data.credentials) {

        setLastCredentials({
          name: data.partner.name,
          ...data.credentials,
        });

      }


      // Reset form

      setFormData({

        // Organization details

        name: "",

        type: "university",

        description: "",

        location: "",

        email: "",

        website: "",


        // AI routing profile

        expertise: "",

        capabilities: "",

        districtsServed: "",


        // Login details

        userName: "",

        userEmail: "",

        password: "",

      });


      setMessage(
        "Partner and login account created successfully."
      );

      setMessageType("success");
      setShowAddForm(false);

    } catch (error) {

      console.error(
        "Create partner error:",
        error
      );


      setMessage(

        error.response?.data?.message ||

        "Failed to add partner."

      );

      setMessageType("error");

    } finally {

      setSubmitting(false);

    }

  };


  // ========================================
  // DELETE PARTNER
  // ========================================

  const handleDelete = async (
    partnerId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this partner?"
      );


    if (!confirmed) {

      return;

    }


    try {

      setMessage("");

      setMessageType("");


      const token =
        localStorage.getItem("token");


      await deletePartner(
        partnerId,
        token
      );


      // Remove partner from UI

      setPartners(
        (currentPartners) =>

          currentPartners.filter(
            (partner) =>

              partner._id !==
              partnerId

          )

      );


      setMessage(
        "Partner deleted successfully."
      );

      setMessageType("success");

    } catch (error) {

      console.error(
        "Delete partner error:",
        error
      );


      setMessage(

        error.response?.data?.message ||

        "Failed to delete partner."

      );

      setMessageType("error");

    }

  };


  // ========================================
  // UI
  // ========================================

  return (

    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">


        {/* ========================================
            HEADER
        ======================================== */}

        {setAdminPage && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setAdminPage("dashboard")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe5df] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0b514a] shadow-sm transition hover:border-[#0b514a] hover:bg-[#e9f4f0]"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-sm font-semibold text-[#0b6b60]">

              GOVERNMENT ADMIN PORTAL

            </p>


            <h1 className="mt-2 text-3xl font-bold text-[#173d3a]">

              Partner Management

            </h1>


            <p className="mt-2 text-[#5c6f69]">
              Manage universities and industry partners
              available for problem assignments and collaborative resolution.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0b514a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#073f3a] sm:self-auto lg:hidden"
          >
            <span>{showAddForm ? "✕ Hide Add Form" : "➕ Add Partner"}</span>
          </button>

        </div>


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
            ONE-TIME CREDENTIALS PANEL
        ======================================== */}

        {lastCredentials && (

          <div className="mb-6 rounded-xl border border-[#bcd9cf] bg-[#e9f4f0] p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <h3 className="text-sm font-bold text-[#0a4f47]">

                  🔑 Credentials for {lastCredentials.name}

                </h3>


                <p className="mt-1 text-xs text-[#087f70]">

                  The database stores only a hashed
                  password — this is the only time it
                  is shown here. It is also saved to
                  the credentials download.

                </p>

              </div>


              <button

                type="button"

                onClick={() => setLastCredentials(null)}

                className="shrink-0 rounded-lg px-3 py-1 text-sm font-semibold text-[#0a4f47] transition hover:bg-[#d8ebe4]"

              >

                ✕

              </button>

            </div>


            <div className="mt-3 grid gap-2 text-sm text-[#315d56] sm:grid-cols-2">

              <p>

                <span className="font-semibold">Login email:</span>{" "}

                {lastCredentials.loginEmail}

              </p>


              <p>

                <span className="font-semibold">Password:</span>{" "}

                <code className="rounded bg-white px-2 py-0.5 font-mono text-xs">

                  {lastCredentials.password}

                </code>

              </p>

            </div>

          </div>

        )}


        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* ========================================
              ADD PARTNER FORM (Visible on desktop, toggleable on mobile)
          ======================================== */}

          <section
            className={`rounded-2xl border border-[#e3e9e3] bg-white p-5 shadow-sm sm:p-6 lg:block ${
              showAddForm ? "block" : "hidden"
            }`}
          >

            <h2 className="text-xl font-bold text-[#173d3a]">

              Add New Partner

            </h2>


            <p className="mt-1 text-sm text-[#71827c]">

              Add an organization and create
              its partner login account.

            </p>


            <form

              onSubmit={handleSubmit}

              className="mt-6 space-y-5"

            >


              {/* ========================================
                  ORGANIZATION DETAILS
              ======================================== */}

              <div className="border-b border-[#e3e9e3] pb-4">

                <h3 className="text-sm font-bold text-[#173d3a]">

                  Organization Details

                </h3>

              </div>


              {/* ORGANIZATION NAME */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Organization Name *

                </label>


                <input

                  type="text"

                  name="name"

                  value={formData.name}

                  onChange={handleChange}

                  required

                  placeholder="Example: Tata Steel"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* ORGANIZATION TYPE */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Organization Type *

                </label>


                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#dbe5df] bg-white px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                >
                  <option value="university">University</option>
                  <option value="industry">Industry</option>
                </select>

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Description

                </label>


                <textarea

                  name="description"

                  value={formData.description}

                  onChange={handleChange}

                  rows="4"

                  placeholder="Briefly describe this organization..."

                  className="w-full resize-none rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* LOCATION */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Location

                </label>


                <input

                  type="text"

                  name="location"

                  value={formData.location}

                  onChange={handleChange}

                  placeholder="Example: Jamshedpur, Jharkhand"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* CONTACT EMAIL */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Organization Contact Email

                </label>


                <input

                  type="email"

                  name="email"

                  value={formData.email}

                  onChange={handleChange}

                  placeholder="contact@example.com"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* WEBSITE */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Website

                </label>


                <input

                  type="url"

                  name="website"

                  value={formData.website}

                  onChange={handleChange}

                  placeholder="https://example.com"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* ========================================
                  AI ROUTING PROFILE
              ======================================== */}

              <div className="border-b border-t border-[#e3e9e3] py-4">

                <h3 className="text-sm font-bold text-[#173d3a]">

                  AI Routing Profile

                </h3>


                <p className="mt-1 text-xs text-[#71827c]">

                  These tags power the AI recommendation
                  engine. Separate multiple values with
                  commas.

                </p>

              </div>


              {/* EXPERTISE */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Expertise Domains

                </label>


                <input

                  type="text"

                  name="expertise"

                  value={formData.expertise}

                  onChange={handleChange}

                  placeholder="e.g. water, energy, technology"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* CAPABILITIES */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Capabilities

                </label>


                <input

                  type="text"

                  name="capabilities"

                  value={formData.capabilities}

                  onChange={handleChange}

                  placeholder="e.g. prototyping, funding, field_surveys"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* DISTRICTS SERVED */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Districts Served

                </label>


                <input

                  type="text"

                  name="districtsServed"

                  value={formData.districtsServed}

                  onChange={handleChange}

                  placeholder="e.g. Ranchi, Khunti, Ramgarh"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* ========================================
                  PARTNER LOGIN DETAILS
              ======================================== */}

              <div className="border-b border-t border-[#e3e9e3] py-4">

                <h3 className="text-sm font-bold text-[#173d3a]">

                  Partner Login Details

                </h3>


                <p className="mt-1 text-xs text-[#71827c]">

                  These credentials will be used
                  to access the Partner Portal.

                </p>

              </div>


              {/* PARTNER USER NAME */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Partner User Name *

                </label>


                <input

                  type="text"

                  name="userName"

                  value={formData.userName}

                  onChange={handleChange}

                  required

                  placeholder="Example: Tata Steel Manager"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* LOGIN EMAIL */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">

                  Partner Login Email *

                </label>


                <input

                  type="email"

                  name="userEmail"

                  value={formData.userEmail}

                  onChange={handleChange}

                  required

                  placeholder="partner@example.com"

                  className="w-full rounded-xl border border-[#dbe5df] px-4 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                />

              </div>


              {/* PASSWORD */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-[#315d56]">
                  Partner Password *
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    placeholder="Create a secure password"
                    className="w-full rounded-xl border border-[#dbe5df] pl-4 pr-11 py-2.5 outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71827c] transition hover:text-[#0b514a] focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>


              {/* SUBMIT */}

              <button

                type="submit"

                disabled={submitting}

                className="w-full rounded-xl bg-[#0b514a] px-4 py-3 font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"

              >

                {submitting

                  ? "Creating Partner..."

                  : "Add Partner"}

              </button>


            </form>

          </section>


          {/* ========================================
              PARTNER LIST
          ======================================== */}

          <section className="lg:col-span-2">

            <div className="rounded-2xl border border-[#e3e9e3] bg-white shadow-sm">


              <div className="border-b border-[#e3e9e3] p-5 sm:p-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div>

                    <h2 className="text-xl font-bold text-[#173d3a]">

                      Available Partners

                    </h2>


                    <p className="mt-1 text-sm text-[#71827c]">

                      {filteredPartners.length} partner

                      {filteredPartners.length !== 1
                        ? "s"
                        : ""}

                      {" "}available for assignment.

                    </p>

                  </div>


                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddForm((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#0b514a] bg-[#e9f4f0] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0b514a] transition hover:bg-[#0b514a] hover:text-white lg:hidden"
                    >
                      <span>{showAddForm ? "✕ Close Add Form" : "➕ Add Partner"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadCredentials}
                      disabled={downloading}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0b514a] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
                    >
                      {downloading
                        ? "Downloading..."
                        : "📥 Download Credentials"}
                    </button>
                  </div>

                </div>


                {/* ========================================
                    SEARCH + FILTER
                ======================================== */}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                  <input

                    type="text"

                    value={searchTerm}

                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }

                    placeholder="Search by name, location or email..."

                    className="flex-1 rounded-xl border border-[#dbe5df] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"

                  />


                  <select
                    value={filterType}
                    onChange={(event) =>
                      setFilterType(event.target.value)
                    }
                    className="rounded-xl border border-[#dbe5df] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
                  >
                    <option value="all">
                      All Partners (Universities & Industries)
                    </option>

                    <option value="university">
                      Universities
                    </option>

                    <option value="industry">
                      Industries
                    </option>
                  </select>

                </div>

              </div>


              {loading ? (

                <div className="p-10 text-center text-[#71827c]">

                  Loading partners...

                </div>

              ) : filteredPartners.length === 0 ? (

                <div className="p-10 text-center text-[#71827c]">

                  No partners match your search.

                </div>

              ) : (

                <div className="divide-y divide-[#eef2ee]">


                  {filteredPartners.map(
                    (partner) => (

                      <div
                        key={partner._id}
                        className="p-5 sm:p-6"
                      >
                        <div>
                          {/* NAME + TYPE + DELETE HEADER */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="text-base font-bold text-[#173d3a] sm:text-lg">
                                {partner.name}
                              </h3>

                              <span className="rounded-full bg-[#d8ebe4] px-2.5 py-0.5 text-xs font-semibold capitalize text-[#087f70]">
                                {partner.type}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDelete(partner._id)}
                              className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>


                          {/* DESCRIPTION */}

                          {partner.description && (

                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5c6f69]">

                              {partner.description}

                            </p>

                          )}


                          {/* DETAILS */}

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#71827c]">


                            {partner.location && (

                              <span>

                                📍 {partner.location}

                              </span>

                            )}


                            {partner.email && (

                              <span>

                                ✉️ {partner.email}

                              </span>

                            )}

                          </div>


                          {/* LOGIN DETAILS */}

                          {partner.user && (

                            <div className="mt-3 rounded-lg bg-[#f2f5f1] p-3 text-sm">

                              <p className="font-semibold text-[#315d56]">

                                Partner Login Account

                              </p>


                              <p className="mt-1 text-[#71827c]">

                                👤 {partner.user.name}

                              </p>


                              <p className="text-[#71827c]">

                                ✉️ {partner.user.email}

                              </p>


                              {/* PASSWORD */}

                              {/* The DB stores only a bcrypt hash;
                                  the plaintext comes from the admin
                                  credentials vault when available. */}

                              {partner.credentials?.password ? (

                                <div className="mt-1 flex items-center gap-2 text-[#71827c]">

                                  <span>

                                    🔑{" "}

                                    {revealedIds[partner._id]

                                      ? partner.credentials.password

                                      : "••••••••"}

                                  </span>


                                  <button

                                    type="button"

                                    onClick={() =>

                                      togglePasswordVisibility(partner._id)

                                    }

                                    className="text-xs font-semibold text-[#0b6b60] hover:underline"

                                  >

                                    {revealedIds[partner._id]

                                      ? "Hide"

                                      : "Show"}

                                  </button>

                                </div>

                              ) : (

                                <p className="mt-1 text-xs italic text-[#a1aca7]">

                                  🔑 Password available in the

                                  credentials download.

                                </p>

                              )}

                            </div>

                          )}


                          {/* AI ROUTING PROFILE TAGS */}

                          {(partner.expertise?.length > 0 ||
                            partner.capabilities?.length > 0) && (

                            <div className="mt-3 flex flex-wrap gap-2">

                              {partner.expertise?.map((tag) => (

                                <span
                                  key={`exp-${tag}`}
                                  className="rounded-full bg-[#d8ebe4] px-3 py-1 text-xs font-semibold text-[#087f70]"
                                >

                                  {tag.replace(/_/g, " ")}

                                </span>

                              ))}

                              {partner.capabilities?.map((tag) => (

                                <span
                                  key={`cap-${tag}`}
                                  className="rounded-full bg-[#31527c]/10 px-3 py-1 text-xs font-semibold text-[#31527c]"
                                >

                                  {tag.replace(/_/g, " ")}

                                </span>

                              ))}

                            </div>

                          )}


                          {/* WEBSITE */}

                          {partner.website && (

                            <a

                              href={partner.website}

                              target="_blank"

                              rel="noreferrer"

                              className="mt-3 inline-block text-sm font-semibold text-[#0b6b60] hover:text-[#087f70]"

                            >

                              Visit Website →

                            </a>

                          )}

                        </div>

                      </div>

                    )

                  )}


                </div>

              )}


            </div>

          </section>


        </div>


      </div>

    </main>

  );

};


export default PartnerManagement;
import { useEffect, useState } from "react";

import {
  createPartner,
  getAllPartners,
  deletePartner,
} from "../services/partnerService";


const PartnerManagement = () => {

  // ========================================
  // STATE
  // ========================================

  const [partners, setPartners] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [submitting, setSubmitting] =
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


      // Partner login details

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

      setMessage("");


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

    } finally {

      setLoading(false);

    }

  };


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


      // Reset form

      setFormData({

        // Organization details

        name: "",

        type: "university",

        description: "",

        location: "",

        email: "",

        website: "",


        // Login details

        userName: "",

        userEmail: "",

        password: "",

      });


      setMessage(
        "Partner and login account created successfully."
      );

    } catch (error) {

      console.error(
        "Create partner error:",
        error
      );


      setMessage(

        error.response?.data?.message ||

        "Failed to add partner."

      );

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

    } catch (error) {

      console.error(
        "Delete partner error:",
        error
      );


      setMessage(

        error.response?.data?.message ||

        "Failed to delete partner."

      );

    }

  };


  // ========================================
  // UI
  // ========================================

  return (

    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">


        {/* ========================================
            HEADER
        ======================================== */}

        <div className="mb-8">

          <p className="text-sm font-semibold text-blue-600">

            GOVERNMENT ADMIN PORTAL

          </p>


          <h1 className="mt-2 text-3xl font-bold text-slate-800">

            Partner Management

          </h1>


          <p className="mt-2 text-slate-600">

            Manage universities, industry partners,
            NGOs, and government organizations
            available for problem assignments.

          </p>

        </div>


        {/* ========================================
            MESSAGE
        ======================================== */}

        {message && (

          <div

            className={`mb-6 rounded-xl border p-4 text-sm ${
              message
                .toLowerCase()
                .includes("success")
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}

          >

            {message}

          </div>

        )}


        <div className="grid gap-8 lg:grid-cols-3">


          {/* ========================================
              ADD PARTNER FORM
          ======================================== */}

          <section className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-800">

              Add New Partner

            </h2>


            <p className="mt-1 text-sm text-slate-500">

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

              <div className="border-b border-slate-200 pb-4">

                <h3 className="text-sm font-bold text-slate-800">

                  Organization Details

                </h3>

              </div>


              {/* ORGANIZATION NAME */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Organization Name *

                </label>


                <input

                  type="text"

                  name="name"

                  value={formData.name}

                  onChange={handleChange}

                  required

                  placeholder="Example: Tata Steel"

                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>


              {/* ORGANIZATION TYPE */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Organization Type *

                </label>


                <select

                  name="type"

                  value={formData.type}

                  onChange={handleChange}

                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

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


              {/* DESCRIPTION */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Description

                </label>


                <textarea

                  name="description"

                  value={formData.description}

                  onChange={handleChange}

                  rows="4"

                  placeholder="Briefly describe this organization..."

                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>


              {/* LOCATION */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Location

                </label>


                <input

                  type="text"

                  name="location"

                  value={formData.location}

                  onChange={handleChange}

                  placeholder="Example: Jamshedpur, Jharkhand"

                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>


              {/* CONTACT EMAIL */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Organization Contact Email

                </label>


                <input

                  type="email"

                  name="email"

                  value={formData.email}

                  onChange={handleChange}

                  placeholder="contact@example.com"

                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>


              {/* WEBSITE */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Website

                </label>


                <input

                  type="url"

                  name="website"

                  value={formData.website}

                  onChange={handleChange}

                  placeholder="https://example.com"

                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>


              {/* ========================================
                  PARTNER LOGIN DETAILS
              ======================================== */}

              <div className="border-b border-t border-slate-200 py-4">

                <h3 className="text-sm font-bold text-slate-800">

                  Partner Login Details

                </h3>


                <p className="mt-1 text-xs text-slate-500">

                  These credentials will be used
                  to access the Partner Portal.

                </p>

              </div>


              {/* PARTNER USER NAME */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Partner User Name *

                </label>


                <input

                  type="text"

                  name="userName"

                  value={formData.userName}

                  onChange={handleChange}

                  required

                  placeholder="Example: Tata Steel Manager"

                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>


              {/* LOGIN EMAIL */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Partner Login Email *

                </label>


                <input

                  type="email"

                  name="userEmail"

                  value={formData.userEmail}

                  onChange={handleChange}

                  required

                  placeholder="partner@example.com"

                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>


              {/* PASSWORD */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">

                  Partner Password *

                </label>


                <input

                  type="password"

                  name="password"

                  value={formData.password}

                  onChange={handleChange}

                  required

                  minLength="6"

                  placeholder="Create a secure password"

                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>


              {/* SUBMIT */}

              <button

                type="submit"

                disabled={submitting}

                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"

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

            <div className="rounded-2xl bg-white shadow-sm">


              <div className="border-b border-slate-200 p-6">

                <h2 className="text-xl font-bold text-slate-800">

                  Available Partners

                </h2>


                <p className="mt-1 text-sm text-slate-500">

                  {partners.length} partner

                  {partners.length !== 1
                    ? "s"
                    : ""}

                  {" "}available for assignment.

                </p>

              </div>


              {loading ? (

                <div className="p-10 text-center text-slate-500">

                  Loading partners...

                </div>

              ) : partners.length === 0 ? (

                <div className="p-10 text-center text-slate-500">

                  No partners have been added yet.

                </div>

              ) : (

                <div className="divide-y divide-slate-100">


                  {partners.map(
                    (partner) => (

                      <div

                        key={partner._id}

                        className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between"

                      >


                        <div>


                          {/* NAME + TYPE */}

                          <div className="flex flex-wrap items-center gap-3">

                            <h3 className="text-lg font-bold text-slate-800">

                              {partner.name}

                            </h3>


                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold capitalize text-blue-700">

                              {partner.type}

                            </span>

                          </div>


                          {/* DESCRIPTION */}

                          {partner.description && (

                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">

                              {partner.description}

                            </p>

                          )}


                          {/* DETAILS */}

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">


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

                            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">

                              <p className="font-semibold text-slate-700">

                                Partner Login Account

                              </p>


                              <p className="mt-1 text-slate-500">

                                👤 {partner.user.name}

                              </p>


                              <p className="text-slate-500">

                                ✉️ {partner.user.email}

                              </p>

                            </div>

                          )}


                          {/* WEBSITE */}

                          {partner.website && (

                            <a

                              href={partner.website}

                              target="_blank"

                              rel="noreferrer"

                              className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"

                            >

                              Visit Website →

                            </a>

                          )}


                        </div>


                        {/* DELETE */}

                        <button

                          onClick={() =>
                            handleDelete(
                              partner._id
                            )
                          }

                          className="shrink-0 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"

                        >

                          Delete

                        </button>


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
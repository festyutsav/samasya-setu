import { useEffect, useState } from "react";

import {
  getMyProblems,
  deleteMyProblem,
} from "../services/myProblemService";


// ========================================
// STATUS STYLES
// ========================================

const statusStyles = {
  submitted:
    "bg-yellow-100 text-yellow-700",

  under_review:
    "bg-blue-100 text-blue-700",

  assigned:
    "bg-purple-100 text-purple-700",

  in_progress:
    "bg-orange-100 text-orange-700",

  solved:
    "bg-green-100 text-green-700",
};


// ========================================
// CATEGORY NAMES
// ========================================

const categoryNames = {
  agriculture: "Agriculture",

  healthcare: "Healthcare",

  education: "Education",

  water: "Water Management",

  environment: "Environment",

  transportation: "Transportation",

  energy: "Energy",

  waste: "Waste Management",

  public_safety: "Public Safety",

  technology: "Technology",

  other: "Other",
};


// ========================================
// MY PROBLEMS
// ========================================

const MyProblems = ({
  setCurrentPage,
  setSelectedProblemId,
  setBackPage,
}) => {

  // ========================================
  // PROBLEMS
  // ========================================

  const [problems, setProblems] =
    useState([]);


  // ========================================
  // LOADING
  // ========================================

  const [loading, setLoading] =
    useState(true);


  // ========================================
  // MESSAGE
  // ========================================

  const [message, setMessage] =
    useState("");


  // ========================================
  // DELETING PROBLEM
  // ========================================

  const [deletingId, setDeletingId] =
    useState(null);


  // ========================================
  // FETCH MY PROBLEMS
  // ========================================

  useEffect(() => {

    const fetchMyProblems = async () => {

      try {

        setLoading(true);

        setMessage("");


        // ========================================
        // GET TOKEN
        // ========================================

        const token =
          localStorage.getItem("token");


        if (!token) {

          setMessage(
            "Please login first."
          );

          return;

        }


        // ========================================
        // GET PROBLEMS
        // ========================================

        const data =
          await getMyProblems(token);


        setProblems(
          data.problems || []
        );

      } catch (error) {

        setMessage(

          error.response?.data?.message ||

          "Failed to fetch your problems."

        );

      } finally {

        setLoading(false);

      }

    };


    fetchMyProblems();

  }, []);


  // ========================================
  // OPEN PROBLEM DETAILS
  // ========================================

  const handleViewDetails = (
    problemId
  ) => {

    setSelectedProblemId(
      problemId
    );

    setBackPage(
      "my-problems"
    );

    setCurrentPage(
      "problem-details"
    );

  };


  // ========================================
  // DELETE PROBLEM
  // ========================================

  const handleDeleteProblem = async (
    problemId
  ) => {

    // ========================================
    // CONFIRM DELETE
    // ========================================

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this problem? This action cannot be undone."
      );


    if (!confirmed) {

      return;

    }


    try {

      // ========================================
      // START DELETE LOADING
      // ========================================

      setDeletingId(
        problemId
      );

      setMessage("");


      // ========================================
      // GET TOKEN
      // ========================================

      const token =
        localStorage.getItem("token");


      if (!token) {

        setMessage(
          "Please login first."
        );

        return;

      }


      // ========================================
      // DELETE FROM BACKEND
      // ========================================

      await deleteMyProblem(
        problemId,
        token
      );


      // ========================================
      // REMOVE FROM FRONTEND
      // ========================================

      setProblems(
        (currentProblems) =>
          currentProblems.filter(
            (problem) =>
              problem._id !== problemId
          )
      );


    } catch (error) {

      console.error(
        "Delete problem error:",
        error
      );


      setMessage(

        error.response?.data?.message ||

        "Failed to delete problem."

      );

    } finally {

      // ========================================
      // STOP DELETE LOADING
      // ========================================

      setDeletingId(
        null
      );

    }

  };


  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-100">

        <div className="text-center">

          <p className="text-lg font-medium text-slate-600">

            Loading your problems...

          </p>

        </div>

      </main>

    );

  }


  // ========================================
  // UI
  // ========================================

  return (

    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">


        {/* ========================================
            PAGE HEADER
        ======================================== */}

        <div className="mb-10">

          <h1 className="text-4xl font-bold tracking-tight text-slate-800">

            My Submitted Problems

          </h1>


          <p className="mt-3 text-lg text-slate-600">

            Track and manage the problems you have submitted.

          </p>

        </div>


        {/* ========================================
            ERROR MESSAGE
        ======================================== */}

        {message && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

            {message}

          </div>

        )}


        {/* ========================================
            EMPTY STATE
        ======================================== */}

        {!message &&
        problems.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <div className="mb-4 text-5xl">
              📝
            </div>


            <h2 className="text-2xl font-semibold text-slate-800">

              No problems submitted yet

            </h2>


            <p className="mt-3 text-slate-500">

              Start by submitting a problem from your community.

            </p>

          </div>

        ) : (

          <div className="grid gap-6 md:grid-cols-2">

            {problems.map(
              (problem) => {

                const normalizedStatus =
                  problem.status?.toLowerCase() ||
                  "";


                return (

                  <article
                    key={problem._id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >


                    {/* ========================================
                        TITLE
                    ======================================== */}

                    <h2 className="text-2xl font-bold leading-snug text-slate-800">

                      {problem.title}

                    </h2>


                    {/* ========================================
                        DESCRIPTION
                    ======================================== */}

                    <p className="mt-4 leading-relaxed text-slate-600">

                      {problem.description}

                    </p>


                    {/* ========================================
                        CATEGORY
                    ======================================== */}

                    <div className="mt-6">

                      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">

                        {categoryNames[
                          problem.category
                        ] || "Other"}

                      </span>

                    </div>


                    {/* ========================================
                        PROBLEM PHOTOS
                    ======================================== */}

                    {problem.images &&
                    problem.images.length > 0 && (

                      <div className="mt-6">

                        <div className="mb-3 flex items-center justify-between">

                          <p className="text-sm font-semibold text-slate-700">

                            Problem Photos

                          </p>


                          <span className="text-xs text-slate-500">

                            {problem.images.length}/3

                          </span>

                        </div>


                        <div className="grid grid-cols-3 gap-3">

                          {problem.images.map(
                            (image, index) => (

                              <div
                                key={
                                  image.publicId ||
                                  `${problem._id}-${index}`
                                }
                                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                              >

                                <img
                                  src={image.url}
                                  alt={`Problem photo ${
                                    index + 1
                                  }`}
                                  className="h-32 w-full object-cover transition duration-200 hover:scale-105"
                                  loading="lazy"
                                />

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )}


                    {/* ========================================
                        NO PHOTOS
                    ======================================== */}

                    {(!problem.images ||
                      problem.images.length === 0) && (

                      <div className="mt-6 rounded-xl bg-slate-50 p-3 text-center">

                        <p className="text-sm text-slate-500">

                          📷 No photos uploaded

                        </p>

                      </div>

                    )}


                    {/* ========================================
                        BOTTOM INFORMATION
                    ======================================== */}

                    <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">


                      {/* ========================================
                          LOCATION
                      ======================================== */}

                      <div className="flex items-center gap-2 text-slate-600">

                        <span className="text-lg">
                          📍
                        </span>


                        <p>

                          <span className="font-semibold text-slate-700">

                            Location:

                          </span>{" "}

                          {problem.location}

                        </p>

                      </div>


                      {/* ========================================
                          STATUS
                      ======================================== */}

                      <div className="flex items-center gap-2">

                        <span className="font-semibold text-slate-700">

                          Status:

                        </span>


                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                            statusStyles[
                              normalizedStatus
                            ] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >

                          {problem.status?.replace(
                            "_",
                            " "
                          )}

                        </span>

                      </div>


                      {/* ========================================
                          ASSIGNED PARTNER
                      ======================================== */}

                      {problem.assignedPartner && (

                        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">

                          <p className="text-sm font-semibold text-purple-800">

                            Assigned Organization

                          </p>


                          <p className="mt-1 text-base font-bold text-slate-800">

                            🏛️{" "}
                            {problem.assignedPartner.name}

                          </p>


                          {problem.assignedPartner.type && (

                            <p className="mt-1 text-sm text-slate-600">

                              {problem.assignedPartner.type}

                            </p>

                          )}


                          {problem.assignedPartner.location && (

                            <p className="mt-1 text-sm text-slate-600">

                              📍{" "}
                              {problem.assignedPartner.location}

                            </p>

                          )}

                        </div>

                      )}


                      {/* ========================================
                          ACTION BUTTONS
                      ======================================== */}

                      <div className="flex gap-3">


                        {/* ========================================
                            VIEW DETAILS
                        ======================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            handleViewDetails(
                              problem._id
                            )
                          }
                          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                        >

                          View Details

                        </button>


                        {/* ========================================
                            DELETE
                            ONLY WHEN SUBMITTED
                        ======================================== */}

                        {normalizedStatus ===
                          "submitted" && (

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteProblem(
                                problem._id
                              )
                            }
                            disabled={
                              deletingId ===
                              problem._id
                            }
                            className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                          >

                            {deletingId ===
                            problem._id
                              ? "Deleting..."
                              : "Delete"}

                          </button>

                        )}

                      </div>

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </div>

    </main>

  );

};


export default MyProblems;
import { useEffect, useState } from "react";
import { getProblemById } from "../services/problemService";

const ProblemDetails = ({
  problemId,
  setCurrentPage,
  backPage,
}) => {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ========================================
  // PHOTO VIEWER
  // ========================================

  const [selectedImage, setSelectedImage] = useState(null);

  // ========================================
  // FETCH PROBLEM
  // ========================================

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        setMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Please login first.");
          return;
        }

        const data = await getProblemById(
          problemId,
          token,
        );

        setProblem(data.problem);
      } catch (error) {
        console.error(
          "Fetch problem details error:",
          error,
        );

        setMessage(
          error.response?.data?.message ||
            "Failed to fetch problem details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // ========================================
  // BACK BUTTON TEXT
  // ========================================

  const backButtonText =
    backPage === "all-problems"
      ? "← Back to Explore Problems"
      : "← Back to My Problems";

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-lg font-medium text-slate-600">
            Loading problem details...
          </p>
        </div>
      </main>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (message) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl">

          <button
            type="button"
            onClick={() =>
              setCurrentPage(backPage)
            }
            className="mb-6 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            {backButtonText}
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {message}
          </div>

        </div>
      </main>
    );
  }

  // ========================================
  // NO PROBLEM
  // ========================================

  if (!problem) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-4xl">

        {/* ========================================
            BACK BUTTON
        ======================================== */}

        <button
          type="button"
          onClick={() =>
            setCurrentPage(backPage)
          }
          className="mb-8 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          {backButtonText}
        </button>


        {/* ========================================
            PROBLEM DETAILS CARD
        ======================================== */}

        <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-10">

          {/* ========================================
              CATEGORY
          ======================================== */}

          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {problem.category}
          </span>


          {/* ========================================
              TITLE
          ======================================== */}

          <h1 className="mt-5 text-3xl font-bold text-slate-800">
            {problem.title}
          </h1>


          {/* ========================================
              DESCRIPTION
          ======================================== */}

          <section className="mt-8">

            <h2 className="text-lg font-semibold text-slate-800">
              Description
            </h2>

            <p className="mt-3 leading-relaxed text-slate-600">
              {problem.description}
            </p>

          </section>


          {/* ========================================
              PROBLEM PHOTOS
          ======================================== */}

          {problem.images &&
            problem.images.length > 0 && (

            <section className="mt-8">

              <div className="mb-4 flex items-center justify-between">

                <h2 className="text-lg font-semibold text-slate-800">
                  Problem Photos
                </h2>

                <span className="text-sm text-slate-500">
                  {problem.images.length}{" "}
                  {problem.images.length === 1
                    ? "photo"
                    : "photos"}
                </span>

              </div>


              {/* ========================================
                  PHOTO GRID
              ======================================== */}

              <div
                className={`grid gap-4 ${
                  problem.images.length === 1
                    ? "grid-cols-1"
                    : problem.images.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-3"
                }`}
              >

                {problem.images.map(
                  (image, index) => (

                  <button
                    type="button"
                    key={
                      image.publicId ||
                      `${problem._id}-${index}`
                    }
                    onClick={() =>
                      setSelectedImage(image.url)
                    }
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left"
                  >

                    <img
                      src={image.url}
                      alt={`Problem photo ${
                        index + 1
                      }`}
                      className={`w-full object-cover transition duration-300 group-hover:scale-105 ${
                        problem.images.length === 1
                          ? "max-h-[500px]"
                          : "h-64"
                      }`}
                      loading="lazy"
                    />


                    {/* HOVER LABEL */}

                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">

                      <span className="p-4 text-sm font-semibold text-white">
                        Click to view
                      </span>

                    </div>

                  </button>

                ))}

              </div>

            </section>

          )}


          {/* ========================================
              NO PHOTOS
          ======================================== */}

          {(!problem.images ||
            problem.images.length === 0) && (

            <section className="mt-8">

              <div className="rounded-xl bg-slate-50 p-4 text-center">

                <p className="text-sm text-slate-500">
                  📷 No photos were uploaded for this problem.
                </p>

              </div>

            </section>

          )}


          {/* ========================================
              INFORMATION GRID
          ======================================== */}

          <section className="mt-8 grid gap-5 sm:grid-cols-2">

            {/* LOCATION */}

            <div className="rounded-xl bg-slate-50 p-5">

              <p className="text-sm font-medium text-slate-500">
                Location
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                📍 {problem.location}
              </p>

            </div>


            {/* STATUS */}

            <div className="rounded-xl bg-slate-50 p-5">

              <p className="text-sm font-medium text-slate-500">
                Status
              </p>

              <p className="mt-2 font-semibold capitalize text-slate-800">
                {problem.status?.replace(
                  "_",
                  " ",
                )}
              </p>

            </div>

          </section>


          {/* ========================================
              LOCATION DETAILS
          ======================================== */}

          {problem.locationDetails && (

            <section className="mt-5 grid gap-5 sm:grid-cols-3">

              {/* DISTRICT */}

              <div className="rounded-xl bg-slate-50 p-5">

                <p className="text-sm font-medium text-slate-500">
                  District
                </p>

                <p className="mt-2 font-semibold text-slate-800">
                  {problem.locationDetails.district ||
                    "Not available"}
                </p>

              </div>


              {/* STATE */}

              <div className="rounded-xl bg-slate-50 p-5">

                <p className="text-sm font-medium text-slate-500">
                  State
                </p>

                <p className="mt-2 font-semibold text-slate-800">
                  {problem.locationDetails.state ||
                    "Not available"}
                </p>

              </div>


              {/* PINCODE */}

              <div className="rounded-xl bg-slate-50 p-5">

                <p className="text-sm font-medium text-slate-500">
                  Pincode
                </p>

                <p className="mt-2 font-semibold text-slate-800">
                  {problem.locationDetails.pincode ||
                    "Not available"}
                </p>

              </div>

            </section>

          )}


          {/* ========================================
              ASSIGNED PARTNER
          ======================================== */}

          {problem.assignedPartner && (

            <section className="mt-8 rounded-2xl border border-purple-200 bg-purple-50 p-6">

              <h2 className="text-lg font-bold text-purple-900">
                Assigned Organization
              </h2>


              <p className="mt-3 text-xl font-bold text-slate-800">
                🏛️{" "}
                {problem.assignedPartner.name}
              </p>


              {problem.assignedPartner.type && (

                <p className="mt-2 text-slate-600">

                  <span className="font-semibold">
                    Type:
                  </span>{" "}

                  {problem.assignedPartner.type}

                </p>

              )}


              {problem.assignedPartner.description && (

                <p className="mt-3 leading-relaxed text-slate-600">
                  {problem.assignedPartner.description}
                </p>

              )}


              {problem.assignedPartner.location && (

                <p className="mt-3 text-slate-600">
                  📍{" "}
                  {problem.assignedPartner.location}
                </p>

              )}


              {problem.assignedPartner.email && (

                <p className="mt-2 text-slate-600">
                  📧{" "}
                  {problem.assignedPartner.email}
                </p>

              )}


              {problem.assignedPartner.website && (

                <a
                  href={
                    problem.assignedPartner.website
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block font-semibold text-blue-600 hover:text-blue-700"
                >
                  Visit Organization Website →
                </a>

              )}

            </section>

          )}


          {/* ========================================
              SUBMISSION DATE
          ======================================== */}

          <section className="mt-8 border-t border-slate-200 pt-6">

            <p className="text-sm text-slate-500">

              Submitted on{" "}

              {problem.createdAt
                ? new Date(
                    problem.createdAt,
                  ).toLocaleDateString()
                : "Unknown date"}

            </p>

          </section>

        </article>

      </div>


      {/* ========================================
          FULL SCREEN IMAGE VIEWER
      ======================================== */}

      {selectedImage && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() =>
            setSelectedImage(null)
          }
        >

          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={() =>
              setSelectedImage(null)
            }
            className="absolute right-5 top-5 z-10 rounded-full bg-white px-4 py-2 text-xl font-bold text-slate-800 shadow-lg transition hover:bg-slate-100"
          >
            ✕
          </button>


          {/* LARGE IMAGE */}

          <img
            src={selectedImage}
            alt="Problem photo enlarged"
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
          />

        </div>

      )}

    </main>
  );
};

export default ProblemDetails;
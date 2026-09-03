import { useEffect, useState } from "react";

import { getPartnerProblems } from "../services/partnerService";

import ProposalList from "../components/ProposalList";

import ProposalForm from "../components/ProposalForm";

// ========================================
// UNIVERSITY DASHBOARD
// ========================================
// Shows assigned problems to the university
// partner and allows submitting proposals.

const UniversityDashboard = ({ setCurrentPage }) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedProblemId, setSelectedProblemId] =
    useState(null);

  // ========================================
  // FETCH PROBLEMS
  // ========================================

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");
        return;
      }

      const data = await getPartnerProblems(token);

      setProblems(data.problems || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch problems."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-[#0b6b60]">
            UNIVERSITY PORTAL
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#173d3a]">
            University Dashboard
          </h1>

          <p className="mt-2 text-[#5c6f69]">
            Review assigned societal challenges and submit solution proposals.
          </p>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        {/* SELECTED PROBLEM DETAILS */}

        {selectedProblemId && (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setSelectedProblemId(null)}
              className="mb-4 text-sm font-semibold text-[#0b6b60] transition hover:text-[#087f70]"
            >
              ← Back to Problems
            </button>

            <div className="grid gap-8 lg:grid-cols-2">
              <ProposalForm
                problemId={selectedProblemId}
                onProposalSubmitted={() => {
                  setSelectedProblemId(null);
                  fetchProblems();
                }}
              />

              <ProposalList
                isAdmin={false}
                problemId={selectedProblemId}
              />
            </div>
          </div>
        )}

        {/* PROBLEMS LIST */}

        {!selectedProblemId && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-[#173d3a]">
              Assigned Problems
            </h2>

            {loading ? (
              <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center text-[#71827c]">
                Loading problems...
              </div>
            ) : problems.length === 0 ? (
              <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center text-[#71827c]">
                No problems have been assigned to your university yet.
              </div>
            ) : (
              <div className="grid gap-6">
                {problems.map((problem) => (
                  <div
                    key={problem._id}
                    className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#173d3a]">
                          {problem.title}
                        </h3>

                        <p className="mt-2 text-sm text-[#5c6f69]">
                          {problem.description?.slice(0, 200)}
                          {problem.description?.length > 200 && "..."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#d8ebe4] px-3 py-1 text-xs font-semibold capitalize text-[#087f70]">
                            {problem.category}
                          </span>

                          <span className="rounded-full bg-[#f7ebd8] px-3 py-1 text-xs font-semibold text-[#a25a1b]">
                            {problem.status?.replace("_", " ")}
                          </span>
                        </div>

                        {problem.location && (
                          <p className="mt-2 text-sm text-[#71827c]">
                            📍 {problem.location}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProblemId(problem._id)
                        }
                        className="shrink-0 rounded-xl bg-[#0b514a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#073f3a]"
                      >
                        Submit Proposal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default UniversityDashboard;

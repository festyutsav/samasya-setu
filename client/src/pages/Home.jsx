import { useEffect, useState } from "react";
import { getMyProblems } from "../services/myProblemService";

const statusStyles = {
  submitted: "bg-[#f7ebd8] text-[#a25a1b]",
  under_review: "bg-[#d8ebe4] text-[#087f70]",
  assigned: "bg-[#e5dcf2] text-[#564680]",
  in_progress: "bg-[#fbe5d8] text-[#b05c2d]",
  solved: "bg-[#e1f1ed] text-[#087f70]",
};

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  solved: "Solved",
};



const Home = ({ user, setCurrentPage }) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          return;
        }

        const data = await getMyProblems(token);

        setProblems(data.problems || []);
      } catch (error) {
        console.error(
          "Failed to fetch dashboard data:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Count problems by status
  const getStatusCount = (status) => {
    return problems.filter(
      (problem) => problem.status === status
    ).length;
  };

  const totalProblems = problems.length;

  const submittedProblems =
    getStatusCount("submitted");

  const underReviewProblems =
    getStatusCount("under_review");

  const assignedProblems =
    getStatusCount("assigned");

  const inProgressProblems =
    getStatusCount("in_progress");

  const solvedProblems =
    getStatusCount("solved");

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Welcome Section */}
        <section className="mb-10">
          <p className="text-sm font-semibold text-[#0b6b60]">
            CITIZEN DASHBOARD
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#173d3a]">
            Welcome back, {user?.name} 👋
          </h1>

          <p className="mt-3 max-w-2xl text-lg text-[#5c6f69]">
            Track the challenges you have submitted and stay updated
            on their progress.
          </p>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-medium text-[#5c6f69]">
              Loading your dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* Statistics */}
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              <StatCard
                label="Total Problems"
                value={totalProblems}
                color="text-[#173d3a]"
              />

              <StatCard
                label="Submitted"
                value={submittedProblems}
                color="text-[#a25a1b]"
              />

              <StatCard
                label="Under Review"
                value={underReviewProblems}
                color="text-[#0b6b60]"
              />

              <StatCard
                label="Assigned"
                value={assignedProblems}
                color="text-[#6b5a94]"
              />

              <StatCard
                label="In Progress"
                value={inProgressProblems}
                color="text-[#b05c2d]"
              />

              <StatCard
                label="Solved"
                value={solvedProblems}
                color="text-[#087f70]"
              />

            </section>

            {/* Quick Actions */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-[#173d3a]">
                Quick Actions
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                {/* Submit Problem */}
                <div className="rounded-2xl bg-[#0b514a] p-7 text-white shadow-md">
                  <h3 className="text-xl font-bold">
                    Submit a New Problem
                  </h3>

                  <p className="mt-2 text-[#cfe4dc]">
                    Share a challenge from your community and help
                    connect it with potential solutions.
                  </p>

                  <button
                    onClick={() =>
                      setCurrentPage("submit")
                    }
                    className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-[#0b6b60] transition hover:bg-[#e9f4f0]"
                  >
                    Submit Problem
                  </button>
                </div>

                {/* My Problems */}
                <div className="rounded-2xl border border-[#e3e9e3] bg-white p-7 shadow-sm">
                  <h3 className="text-xl font-bold text-[#173d3a]">
                    View My Problems
                  </h3>

                  <p className="mt-2 text-[#5c6f69]">
                    Check all your submitted problems and track their
                    current status.
                  </p>

                  <button
                    onClick={() =>
                      setCurrentPage("my-problems")
                    }
                    className="mt-6 rounded-xl border border-[#dbe5df] px-5 py-3 font-semibold text-[#315d56] transition hover:bg-[#f2f5f1]"
                  >
                    View Problems
                  </button>
                </div>

              </div>
            </section>

            {/* Recent Problems */}
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#173d3a]">
                  Recent Problems
                </h2>

                {problems.length > 0 && (
                  <button
                    onClick={() =>
                      setCurrentPage("my-problems")
                    }
                    className="text-sm font-semibold text-[#0b6b60] hover:text-[#087f70]"
                  >
                    View All →
                  </button>
                )}
              </div>

              {problems.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-[#e3e9e3] bg-white p-8 text-center shadow-sm">
                  <p className="text-[#71827c]">
                    You haven't submitted any problems yet.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  {problems.slice(0, 3).map((problem) => (
                    <article
                      key={problem._id}
                      className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm"
                    >
                      {/* Category */}
                      <span className="inline-block rounded-full bg-[#d8ebe4] px-3 py-1 text-sm font-medium text-[#087f70]">
                        {problem.category}
                      </span>

                      {/* Title */}
                      <h3 className="mt-4 text-lg font-bold text-[#173d3a]">
                        {problem.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-2 line-clamp-2 text-sm text-[#5c6f69]">
                        {problem.description}
                      </p>

                      {/* Location and Status */}
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="text-sm text-[#71827c]">
                          📍 {problem.location}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[problem.status] ||
                            "bg-[#f7f8f5] text-[#315d56]"
                          }`}
                        >
                          {statusLabels[problem.status] ||
                            problem.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};


const StatCard = ({ label, value, color }) => {
  return (
    <div className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-[#71827c]">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${color}`}
      >
        {value}
      </p>
    </div>
  );
};


export default Home;
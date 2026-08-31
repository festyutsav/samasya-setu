import { useEffect, useState } from "react";
import { getMyProblems } from "../services/myProblemService";

const statusStyles = {
  submitted: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  assigned: "bg-purple-100 text-purple-700",
  in_progress: "bg-orange-100 text-orange-700",
  solved: "bg-green-100 text-green-700",
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
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Welcome Section */}
        <section className="mb-10">
          <p className="text-sm font-semibold text-blue-600">
            CITIZEN DASHBOARD
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-800">
            Welcome back, {user?.name} 👋
          </h1>

          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Track the challenges you have submitted and stay updated
            on their progress.
          </p>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-600">
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
                color="text-slate-800"
              />

              <StatCard
                label="Submitted"
                value={submittedProblems}
                color="text-yellow-600"
              />

              <StatCard
                label="Under Review"
                value={underReviewProblems}
                color="text-blue-600"
              />

              <StatCard
                label="Assigned"
                value={assignedProblems}
                color="text-purple-600"
              />

              <StatCard
                label="In Progress"
                value={inProgressProblems}
                color="text-orange-600"
              />

              <StatCard
                label="Solved"
                value={solvedProblems}
                color="text-green-600"
              />

            </section>

            {/* Quick Actions */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-slate-800">
                Quick Actions
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                {/* Submit Problem */}
                <div className="rounded-2xl bg-blue-600 p-7 text-white shadow-md">
                  <h3 className="text-xl font-bold">
                    Submit a New Problem
                  </h3>

                  <p className="mt-2 text-blue-100">
                    Share a challenge from your community and help
                    connect it with potential solutions.
                  </p>

                  <button
                    onClick={() =>
                      setCurrentPage("submit")
                    }
                    className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Submit Problem
                  </button>
                </div>

                {/* My Problems */}
                <div className="rounded-2xl bg-white p-7 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-800">
                    View My Problems
                  </h3>

                  <p className="mt-2 text-slate-600">
                    Check all your submitted problems and track their
                    current status.
                  </p>

                  <button
                    onClick={() =>
                      setCurrentPage("my-problems")
                    }
                    className="mt-6 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View Problems
                  </button>
                </div>

              </div>
            </section>

            {/* Recent Problems */}
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  Recent Problems
                </h2>

                {problems.length > 0 && (
                  <button
                    onClick={() =>
                      setCurrentPage("my-problems")
                    }
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All →
                  </button>
                )}
              </div>

              {problems.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-white p-8 text-center shadow-sm">
                  <p className="text-slate-500">
                    You haven't submitted any problems yet.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  {problems.slice(0, 3).map((problem) => (
                    <article
                      key={problem._id}
                      className="rounded-2xl bg-white p-6 shadow-sm"
                    >
                      {/* Category */}
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        {problem.category}
                      </span>

                      {/* Title */}
                      <h3 className="mt-4 text-lg font-bold text-slate-800">
                        {problem.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {problem.description}
                      </p>

                      {/* Location and Status */}
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          📍 {problem.location}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[problem.status] ||
                            "bg-slate-100 text-slate-700"
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
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
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
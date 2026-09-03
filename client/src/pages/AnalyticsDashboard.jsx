import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

import { getAdminAnalytics } from "../services/adminService";

// ========================================
// PALETTE
// ========================================
// Reused across charts so every visual shares the
// government portal's teal/gold identity.

const chartColors = [
  "#0b514a",
  "#62a99b",
  "#d99a2b",
  "#b49ade",
  "#e9a06b",
  "#7fc8b2",
  "#c96a2d",
  "#8fb5ad",
  "#564680",
  "#f3ce7a",
];

const statusColors = {
  submitted: "#f3ce7a",
  under_review: "#62a99b",
  assigned: "#b49ade",
  in_progress: "#e9a06b",
  solved: "#0b6b60",
};

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  solved: "Solved",
};

const projectStatusColors = {
  planning: "#d99a2b",
  active: "#62a99b",
  completed: "#0b6b60",
};

const projectStatusLabels = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
};

const roleLabels = {
  mentor: "Mentor",
  funder: "Funder",
  "co-developer": "Co-developer",
  adopter: "Adopter",
};

const severityColors = {
  low: "#7fc8b2",
  medium: "#d99a2b",
  high: "#e9a06b",
  critical: "#d64545",
};

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ========================================
// SHARED CHART HELPERS
// ========================================

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e3e9e3",
  boxShadow: "0 4px 16px rgba(11, 81, 74, 0.12)",
  fontSize: "13px",
};

const Icon = ({ path, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {path}
  </svg>
);

const icons = {
  total: <path d="M12 2 2 7l10 5 10-5-10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5" />,
  solved: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />,
  map: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  partners: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></>,
  projects: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  milestone: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z" /><path d="M4 22v-7" /></>,
  handshake: <><path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" /><path d="M13 17a4 4 0 0 0 8 0V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2" /><path d="M8 21h8" /></>,
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  award: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></>,
};

// ========================================
// EMPTY CHART PLACEHOLDER
// ========================================

const EmptyChart = ({ label }) => (
  <div className="flex h-full min-h-56 items-center justify-center rounded-xl bg-[#f7f8f5] text-sm text-[#71827c]">
    {label}
  </div>
);

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  // Live auto-refresh state: pill toggle + last successful fetch.

  const [live, setLive] = useState(true);

  const [lastUpdated, setLastUpdated] = useState(null);

  // ========================================
  // FETCH ANALYTICS
  // ========================================
  // The initial load runs while `loading` is already true, so
  // no state is set synchronously inside the mount effect.

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);

      setMessage("");
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const data = await getAdminAnalytics(token);

      setAnalytics(data);

      setLastUpdated(new Date());
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch analytics data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchAnalytics(), 0);

    return () => clearTimeout(timer);
  }, []);

  // ========================================
  // LIVE AUTO-REFRESH
  // ========================================
  // The PS asks for "real-time insights". A quiet 20s poll
  // keeps the charts current during a demo without any user
  // action; it pauses while the tab is hidden. Toggled by the
  // Live pill in the header.

  useEffect(() => {
    if (!live) return undefined;

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchAnalytics();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [live]);

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8ebe4] border-t-[#0b514a]" />
          <p className="text-lg font-medium text-[#5c6f69]">
            Loading analytics...
          </p>
        </div>
      </main>
    );
  }

  const summary = analytics?.summary || {};

  const categoryData = (analytics?.categoryWise || []).filter(
    (entry) => entry.category,
  );

  const districtData = analytics?.districtWise || [];

  const statusData = (analytics?.statusWise || []).map((entry) => ({
    name: statusLabels[entry._id] || entry._id,

    value: entry.count,

    fill: statusColors[entry._id] || "#8fb5ad",
  }));

  const partnerData = analytics?.partnerWise || [];

  const trendData = (analytics?.monthlyTrend || []).map((entry) => ({
    month: `${monthNames[entry.month - 1]} ${String(entry.year).slice(2)}`,

    Submitted: entry.submitted,

    Solved: entry.solved,
  }));

  const severityData = (analytics?.severityWise || []).map((entry) => ({
    name: entry._id ? entry._id.charAt(0).toUpperCase() + entry._id.slice(1) : "Unknown",

    value: entry.count,

    fill: severityColors[entry._id] || "#8fb5ad",
  }));

  const projectStatusData = (analytics?.projectStatusWise || []).map((entry) => ({
    name: projectStatusLabels[entry._id] || entry._id,

    value: entry.count,

    fill: projectStatusColors[entry._id] || "#8fb5ad",
  }));

  const collaboratorData = (analytics?.collaboratorRoleWise || []).map((entry) => ({
    name: roleLabels[entry.role] || entry.role,

    value: entry.count,
  }));

  const outcomes = analytics?.projectOutcomes || {
    patents: 0,
    startups: 0,
    publications: 0,
    deployments: 0,
  };

  const outcomesData = [
    { name: "Patents", value: outcomes.patents || 0 },

    { name: "Startups", value: outcomes.startups || 0 },

    { name: "Publications", value: outcomes.publications || 0 },

    { name: "Deployments", value: outcomes.deployments || 0 },
  ];

  // ========================================
  // SECTOR x DISTRICT HEATMAP
  // ========================================
  // Cross-tab of problems per district per category. Cell
  // colour intensity scales with the count relative to the
  // busiest cell.

  const districtCategory = analytics?.districtCategoryWise || [];

  const heatmapDistricts = [
    ...new Set(districtCategory.map((row) => row.district)),
  ];

  const heatmapCategories = [
    ...new Set(districtCategory.map((row) => row.category)),
  ];

  const heatmapCounts = districtCategory.reduce((map, row) => {
    map[`${row.district}|${row.category}`] = row.count;

    return map;
  }, {});

  const heatmapMax = Math.max(
    1,
    ...districtCategory.map((row) => row.count),
  );

  // ========================================
  // CSV EXPORT
  // ========================================
  // Exports the aggregated analytics as a single CSV file so
  // government departments can file reports from the raw data.

  const exportCsv = () => {
    const escape = (value) => {
      const text = String(value ?? "");

      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const lines = [];

    lines.push("SamasyaSetu Analytics Export");

    lines.push("");

    lines.push("Summary");

    Object.entries(summary).forEach(([key, value]) => {
      lines.push(`${escape(key)},${escape(value)}`);
    });

    lines.push("");

    lines.push("Domain-wise Distribution");

    lines.push("Category,Total,Solved,Affected People");

    categoryData.forEach((row) => {
      lines.push(
        [escape(row.category), row.total, row.solved, row.affectedPeople].join(","),
      );
    });

    lines.push("");

    lines.push("District Coverage");

    lines.push("District,Total,Solved,Affected People");

    districtData.forEach((row) => {
      lines.push(
        [escape(row.district), row.total, row.solved, row.affectedPeople].join(","),
      );
    });

    lines.push("");

    lines.push("Partner Participation");

    lines.push("Partner,Type,Assigned,Solved");

    partnerData.forEach((row) => {
      lines.push(
        [escape(row.name), escape(row.type), row.total, row.solved].join(","),
      );
    });

    lines.push("");

    lines.push("Innovation Outcomes");

    lines.push("Metric,Count");

    outcomesData.forEach((row) => {
      lines.push(`${row.name},${row.value}`);
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "samasyasetu-analytics.csv";

    link.click();

    URL.revokeObjectURL(url);
  };

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero Header */}

        <section className="ss-dash-hero ss-enter mb-8 p-8 shadow-lg sm:p-10">
          <div className="ss-hero-ring right-24 top-6 h-40 w-40" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9c985]">
              Government Admin Portal
            </p>

            <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
              Analytics Dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Domain-wise distribution, district coverage, partner
              participation and completion rates — the full picture of the
              problem pipeline at a glance.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setLive((prev) => !prev)}
                title={
                  live
                    ? "Auto-refreshing every 20s — click to pause"
                    : "Auto-refresh paused — click to resume"
                }
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  live
                    ? "bg-[#0d8a7a]/40 text-white ring-1 ring-[#7fd6c7]/60"
                    : "bg-white/10 text-white/70 ring-1 ring-white/20"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    live ? "animate-pulse bg-[#7fd6c7]" : "bg-white/40"
                  }`}
                />
                {live ? "Live" : "Paused"}
                {live && lastUpdated && (
                  <span className="text-xs font-normal text-white/70">
                    · updated{" "}
                    {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
              </button>

              <button
                onClick={() => fetchAnalytics(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Icon path={icons.refresh} className="h-4 w-4" />
                Refresh data
              </button>

              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Icon path={icons.download} className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </section>

        {/* Error */}

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        {/* KPI CARDS */}

        <section
          className="ss-enter mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ "--ss-delay": "120ms" }}
        >
          <KpiCard
            label="Total Problems"
            value={summary.totalProblems ?? 0}
            sub="reported by citizens"
            icon={icons.total}
            accent="linear-gradient(90deg, #0b514a, #62a99b)"
            chipClass="bg-[#e9f4f0] text-[#0b6b60]"
          />

          <KpiCard
            label="Completion Rate"
            value={`${summary.completionRate ?? 0}%`}
            sub={`${summary.solvedProblems ?? 0} problems solved`}
            icon={icons.solved}
            accent="linear-gradient(90deg, #0b6b60, #7fc8b2)"
            chipClass="bg-[#e4f2ee] text-[#087f70]"
          />

          <KpiCard
            label="Districts Covered"
            value={summary.districtsCovered ?? 0}
            sub="districts with reported problems"
            icon={icons.map}
            accent="linear-gradient(90deg, #d99a2b, #f3ce7a)"
            chipClass="bg-[#f9f0dd] text-[#a2731b]"
          />

          <KpiCard
            label="Partner Participation"
            value={`${summary.activePartners ?? 0}/${summary.totalPartners ?? 0}`}
            sub="partners handling problems"
            icon={icons.partners}
            accent="linear-gradient(90deg, #7c5cbf, #b49ade)"
            chipClass="bg-[#efeaf8] text-[#564680]"
          />
        </section>

        {/* PROJECT & IMPACT KPI CARDS */}

        <section
          className="ss-enter mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ "--ss-delay": "200ms" }}
        >
          <KpiCard
            label="Research Projects"
            value={`${summary.activeProjects ?? 0} active / ${summary.totalProjects ?? 0}`}
            sub={`${summary.completedProjects ?? 0} completed so far`}
            icon={icons.projects}
            accent="linear-gradient(90deg, #0d8a7a, #7fc8b2)"
            chipClass="bg-[#e4f2ee] text-[#087f70]"
          />

          <KpiCard
            label="Project Completion"
            value={`${summary.projectCompletionRate ?? 0}%`}
            sub={`${summary.milestoneProgress ?? 0}% milestones done`}
            icon={icons.milestone}
            accent="linear-gradient(90deg, #0b6b60, #62a99b)"
            chipClass="bg-[#e9f4f0] text-[#0b6b60]"
          />

          <KpiCard
            label="Industry Engagements"
            value={summary.industryEngagements ?? 0}
            sub="active industry collaborations"
            icon={icons.handshake}
            accent="linear-gradient(90deg, #c96a2d, #e9a06b)"
            chipClass="bg-[#faecdf] text-[#b05c2d]"
          />

          <KpiCard
            label="People Impacted"
            value={(summary.peopleAffected ?? 0).toLocaleString("en-IN")}
            sub="citizens affected by reported problems"
            icon={icons.heart}
            accent="linear-gradient(90deg, #b05c2d, #e9b06b)"
            chipClass="bg-[#faecdf] text-[#b05c2d]"
          />
        </section>

        {/* DOMAIN-WISE + STATUS */}

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Domain-wise Distribution"
            subtitle="Problems by category"
          >
            {categoryData.length === 0 ? (
              <EmptyChart label="No problem data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip contentStyle={tooltipStyle} />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Status Pipeline"
            subtitle="Where problems sit in the workflow"
          >
            {statusData.length === 0 ? (
              <EmptyChart label="No problem data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Bar dataKey="value" name="Problems" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* DISTRICT COVERAGE + SEVERITY */}

        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCard
              title="District Coverage"
              subtitle="Reported vs solved problems per district"
            >
              {districtData.length === 0 ? (
                <EmptyChart label="No location data yet." />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={districtData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" />

                    <XAxis
                      dataKey="district"
                      tick={{ fontSize: 11, fill: "#5c6f69" }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={70}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#5c6f69" }}
                    />

                    <Tooltip contentStyle={tooltipStyle} />

                    <Legend
                      verticalAlign="top"
                      height={30}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "13px" }}
                    />

                    <Bar
                      dataKey="total"
                      name="Reported"
                      fill="#0b514a"
                      radius={[6, 6, 0, 0]}
                    />

                    <Bar
                      dataKey="solved"
                      name="Solved"
                      fill="#7fc8b2"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <ChartCard
            title="Severity Mix"
            subtitle="Impact assessment across problems"
          >
            {severityData.length === 0 ? (
              <EmptyChart label="No severity data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>

                  <Tooltip contentStyle={tooltipStyle} />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* TREND + PARTNER PARTICIPATION */}

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Submission Trend"
            subtitle="Monthly submitted vs solved (last 6 months)"
          >
            {trendData.length === 0 ? (
              <EmptyChart label="No submissions in the last 6 months." />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="ssSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0b514a" stopOpacity={0.35} />

                      <stop offset="100%" stopColor="#0b514a" stopOpacity={0.02} />
                    </linearGradient>

                    <linearGradient id="ssSolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7fc8b2" stopOpacity={0.4} />

                      <stop offset="100%" stopColor="#7fc8b2" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Legend
                    verticalAlign="top"
                    height={30}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "13px" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Submitted"
                    stroke="#0b514a"
                    strokeWidth={2}
                    fill="url(#ssSubmitted)"
                  />

                  <Area
                    type="monotone"
                    dataKey="Solved"
                    stroke="#62a99b"
                    strokeWidth={2}
                    fill="url(#ssSolved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Partner Participation"
            subtitle="Problems assigned per partner organization"
          >
            {partnerData.length === 0 ? (
              <EmptyChart label="No problems assigned to partners yet." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(280, partnerData.length * 48)}>
                <BarChart
                  data={partnerData}
                  layout="vertical"
                  margin={{ left: 24, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={180}
                    tick={{ fontSize: 11, fill: "#315d56" }}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Legend
                    verticalAlign="top"
                    height={30}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "13px" }}
                  />

                  <Bar
                    dataKey="total"
                    name="Assigned"
                    fill="#7c5cbf"
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                  />

                  <Bar
                    dataKey="solved"
                    name="Solved"
                    fill="#b49ade"
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* PROJECT LIFECYCLE + INDUSTRY ENGAGEMENT */}

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Project Lifecycle"
            subtitle="University research projects by stage"
          >
            {projectStatusData.length === 0 ? (
              <EmptyChart label="No research projects created yet." />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Bar dataKey="value" name="Projects" radius={[8, 8, 0, 0]}>
                    {projectStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Industry Engagement by Role"
            subtitle="Accepted industry collaborations per contribution type"
          >
            {collaboratorData.length === 0 ? (
              <EmptyChart label="No industry collaborations yet." />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={collaboratorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#5c6f69" }}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Bar
                    dataKey="value"
                    name="Collaborations"
                    fill="#c96a2d"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* INNOVATION OUTCOMES + COVERAGE MATRIX */}

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Innovation Outcomes"
            subtitle="Patents, startups, publications and deployments from projects"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={outcomesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" />

                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5c6f69" }} />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#5c6f69" }}
                />

                <Tooltip contentStyle={tooltipStyle} />

                <Bar
                  dataKey="value"
                  name="Outcomes"
                  fill="#d99a2b"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Coverage Matrix"
            subtitle="Problems per district per sector — darker means more reported"
          >
            {heatmapDistricts.length === 0 ||
            heatmapCategories.length === 0 ? (
              <EmptyChart label="No location data yet." />
            ) : (
              <div className="max-h-[300px] overflow-auto rounded-xl border border-[#e3e9e3]">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-[#f2f5f1]">
                    <tr>
                      <th className="border-b border-[#e3e9e3] px-3 py-2 text-left font-semibold text-[#315d56]">
                        District
                      </th>

                      {heatmapCategories.map((category) => (
                        <th
                          key={category}
                          className="border-b border-[#e3e9e3] px-3 py-2 text-center text-xs font-semibold text-[#315d56]"
                          title={category}
                        >
                          {category.length > 10
                            ? `${category.slice(0, 9)}…`
                            : category}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {heatmapDistricts.map((district) => (
                      <tr key={district}>
                        <td className="border-b border-[#eef2ee] px-3 py-2 font-medium text-[#315d56]">
                          {district}
                        </td>

                        {heatmapCategories.map((category) => {
                          const count =
                            heatmapCounts[`${district}|${category}`] || 0;

                          const intensity =
                            count > 0 ? 0.12 + (count / heatmapMax) * 0.78 : 0;

                          return (
                            <td
                              key={`${district}|${category}`}
                              className="border-b border-[#eef2ee] px-3 py-2 text-center font-semibold"
                              style={{
                                backgroundColor:
                                  count > 0
                                    ? `rgba(11, 81, 74, ${intensity.toFixed(2)})`
                                    : "transparent",
                                color:
                                  intensity > 0.5 ? "#ffffff" : "#315d56",
                              }}
                            >
                              {count > 0 ? count : "·"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </section>
      </div>
    </main>
  );
};

// ========================================
// KPI CARD
// ========================================

const KpiCard = ({ label, value, sub, icon, accent, chipClass }) => (
  <div
    style={{ "--ss-accent": accent }}
    className="ss-stat-card p-5"
  >
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-[#71827c]">{label}</p>

      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${chipClass}`}
      >
        <Icon path={icon} />
      </span>
    </div>

    <p className="ss-stat-value mt-2 text-3xl font-bold text-[#173d3a]">
      {value}
    </p>

    <p className="mt-1 text-xs text-[#899892]">{sub}</p>
  </div>
);

// ========================================
// CHART CARD
// ========================================

const ChartCard = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
    <div className="mb-4">
      <h2 className="text-lg font-bold text-[#173d3a]">{title}</h2>

      <p className="mt-0.5 text-sm text-[#71827c]">{subtitle}</p>
    </div>

    {children}
  </div>
);

export default AnalyticsDashboard;

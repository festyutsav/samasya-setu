import { useState, useEffect, lazy, Suspense } from "react";

// ================= AUTH PAGES (LAZY) =================

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const PortalSelection = lazy(() => import("./pages/PortalSelection"));

// ================= CITIZEN PAGES (LAZY) =================

const Home = lazy(() => import("./pages/Home"));
const SubmitProblem = lazy(() => import("./pages/SubmitProblem"));
const MyProblems = lazy(() => import("./pages/MyProblems"));
const ProblemDetails = lazy(() => import("./pages/ProblemDetails"));
const AllProblems = lazy(() => import("./pages/AllProblems"));

// ================= ADMIN PAGES (LAZY) =================

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProposals = lazy(() => import("./pages/AdminProposals"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const PartnerManagement = lazy(() => import("./pages/PartnerManagement"));
const AdminProblemDetails = lazy(() => import("./pages/AdminProblemDetails"));

// ================= PARTNER PAGES (LAZY) =================

const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const PartnerProblems = lazy(() => import("./pages/PartnerProblems"));
const PartnerProjects = lazy(() => import("./pages/PartnerProjects"));
const PartnerCollaborations = lazy(() => import("./pages/PartnerCollaborations"));
const PartnerDirectory = lazy(() => import("./pages/PartnerDirectory"));
const ProjectWorkspace = lazy(() => import("./pages/ProjectWorkspace"));
const UniversityDashboard = lazy(() => import("./pages/UniversityDashboard"));

// ================= PAGE LOADING FALLBACK =================

const PageLoadingFallback = () => (
  <div className="flex min-h-[50vh] w-full items-center justify-center py-16">
    <div className="flex flex-col items-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#d8ebe4] border-t-[#0b514a]" />
      <span className="text-xs font-medium uppercase tracking-wider text-[#71827c]">
        Loading...
      </span>
    </div>
  </div>
);
// ================= COMPONENTS =================

import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";
import PartnerNavbar from "./components/PartnerNavbar";
import InstallAppBanner from "./components/InstallAppBanner";
import { API_BASE_URL } from "./config/api";
import { getAuthUser, clearAuthSession } from "./utils/authStorage";
import { syncOfflineQueue } from "./utils/offlineStorage";
import { createProblem } from "./services/problemService";

function App() {
  // ==================================================
  // WARM UP SERVER & GLOBAL OFFLINE AUTO-SYNC
  // ==================================================

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`).catch(() => {});

    const handleGlobalOnline = async () => {
      try {
        await syncOfflineQueue(createProblem);
      } catch (err) {
        console.warn("[AutoSync] Failed to sync offline queue:", err);
      }
    };

    window.addEventListener("online", handleGlobalOnline);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      handleGlobalOnline();
    }

    return () => window.removeEventListener("online", handleGlobalOnline);
  }, []);
  // ==================================================
  // AUTH USER
  // ==================================================

  const [user, setUser] = useState(() => {
    return getAuthUser();
  });

  // ==================================================
  // AUTH STATE
  // ==================================================

  const [authPage, setAuthPage] =
    useState("login");

  const [registeredEmail, setRegisteredEmail] =
    useState("");

  const [
    selectedPortal,
    setSelectedPortal,
  ] = useState(null);

  // ==================================================
  // CITIZEN STATE
  // ==================================================

  const [
    currentPage,
    setCurrentPage,
  ] = useState("home");

  const [
    selectedProblemId,
    setSelectedProblemId,
  ] = useState(null);

  const [
    backPage,
    setBackPage,
  ] = useState("home");

  // ==================================================
  // ADMIN STATE
  // ==================================================

  const [
    adminPage,
    setAdminPage,
  ] = useState("dashboard");

  const [
    selectedAdminProblemId,
    setSelectedAdminProblemId,
  ] = useState(null);

  // ==================================================
  // PARTNER STATE
  // ==================================================

  const [
    partnerPage,
    setPartnerPage,
  ] = useState("dashboard");

  const [
    selectedPartnerProjectId,
    setSelectedPartnerProjectId,
  ] = useState(null);

  // ==================================================
  // BROWSER HISTORY / ROUTING RESILIENCE
  // ==================================================

  useEffect(() => {
    if (!user) return;

    const handleHashChange = () => {
      const hash = window.location.hash || "";
      if (!hash) return;

      const [pagePart, queryPart] = hash.slice(1).split("?");
      const params = new URLSearchParams(queryPart || "");
      const idParam = params.get("id");

      if (user.role === "admin") {
        if (pagePart === "admin-partners") {
          setAdminPage("partners");
        } else if (pagePart === "admin-proposals") {
          setAdminPage("proposals");
        } else if (pagePart === "admin-analytics") {
          setAdminPage("analytics");
        } else if (pagePart === "admin-problem-details" && idParam) {
          setSelectedAdminProblemId(idParam);
          setAdminPage("problem-details");
        } else {
          setAdminPage("dashboard");
        }
      } else if (user.role === "partner") {
        if (pagePart === "partner-problems") {
          setPartnerPage("problems");
        } else if (pagePart === "partner-projects") {
          setPartnerPage("projects");
        } else if (pagePart === "workspace") {
          if (idParam) {
            setSelectedPartnerProjectId(idParam);
          } else {
            const savedId = sessionStorage.getItem("selectedPartnerProjectId");
            if (savedId) setSelectedPartnerProjectId(savedId);
          }
          setPartnerPage("workspace");
        } else if (pagePart === "collaborations") {
          setPartnerPage("collaborations");
        } else if (pagePart === "directory") {
          setPartnerPage("directory");
        } else if (pagePart === "university") {
          setPartnerPage("university");
        } else {
          setPartnerPage("dashboard");
        }
      } else {
        // Citizen pages
        if (pagePart === "all-problems") {
          setCurrentPage("all-problems");
        } else if (pagePart === "submit") {
          setCurrentPage("submit");
        } else if (pagePart === "my-problems") {
          setCurrentPage("my-problems");
        } else if (pagePart === "problem-details" && idParam) {
          setSelectedProblemId(idParam);
          setCurrentPage("problem-details");
        } else {
          setCurrentPage("home");
        }
      }
    };

    // Load initial hash on component mount / login
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [user]);

  // Update hash when active page/state changes
  useEffect(() => {
    if (!user) {
      if (window.location.hash) {
        window.history.replaceState(null, "", " ");
      }
      return;
    }

    let newHash;
    if (user.role === "admin") {
      if (adminPage === "partners") {
        newHash = "admin-partners";
      } else if (adminPage === "proposals") {
        newHash = "admin-proposals";
      } else if (adminPage === "analytics") {
        newHash = "admin-analytics";
      } else if (adminPage === "problem-details" && selectedAdminProblemId) {
        newHash = `admin-problem-details?id=${selectedAdminProblemId}`;
      } else {
        newHash = "admin-dashboard";
      }
    } else if (user.role === "partner") {
      if (partnerPage === "problems") {
        newHash = "partner-problems";
      } else if (partnerPage === "university") {
        newHash = "university";
      } else {
        newHash = "partner-dashboard";
      }
    } else {
      if (currentPage === "all-problems") {
        newHash = "all-problems";
      } else if (currentPage === "submit") {
        newHash = "submit";
      } else if (currentPage === "my-problems") {
        newHash = "my-problems";
      } else if (currentPage === "problem-details" && selectedProblemId) {
        newHash = `problem-details?id=${selectedProblemId}`;
      } else {
        newHash = "home";
      }
    }

    if (window.location.hash !== `#${newHash}`) {
      window.history.pushState(null, "", `#${newHash}`);
    }
  }, [user, currentPage, selectedProblemId, adminPage, selectedAdminProblemId, partnerPage]);

  // ==================================================
  // LOGIN
  // ==================================================

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);

    // ================= ADMIN =================

    if (loggedInUser.role === "admin") {
      setAdminPage("dashboard");

      setSelectedAdminProblemId(null);
    }

    // ================= PARTNER =================

    else if (
      loggedInUser.role === "partner"
    ) {
      setPartnerPage("dashboard");
    }

    // ================= CITIZEN =================

    else {
      setCurrentPage("home");

      setSelectedProblemId(null);

      setBackPage("home");
    }
  };

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {
    // ================= REMOVE AUTH =================

    clearAuthSession();

    setUser(null);

    // ================= RESET AUTH =================

    setAuthPage("login");

    setRegisteredEmail("");

    setSelectedPortal(null);

    // ================= RESET CITIZEN =================

    setCurrentPage("home");

    setSelectedProblemId(null);

    setBackPage("home");

    // ================= RESET ADMIN =================

    setAdminPage("dashboard");

    setSelectedAdminProblemId(null);

    // ================= RESET PARTNER =================

    setPartnerPage("dashboard");
  };

  // ==================================================
  // AUTHENTICATION FLOW
  // ==================================================

  if (!user) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        {!selectedPortal ? (
          <PortalSelection
            onSelectPortal={(portal) => {
              setSelectedPortal(portal);
              setAuthPage("login");
            }}
          />
        ) : authPage === "register" && selectedPortal === "citizen" ? (
          <Register
            onSwitchToLogin={(email) => {
              if (email) setRegisteredEmail(email);
              setAuthPage("login");
            }}
            onBack={() => {
              setSelectedPortal(null);
              setAuthPage("login");
            }}
          />
        ) : (
          <Login
            portal={selectedPortal}
            initialEmail={registeredEmail}
            onLogin={handleLogin}
            onSwitchToRegister={() => {
              if (selectedPortal === "citizen") {
                setAuthPage("register");
              }
            }}
            onBack={() => {
              setSelectedPortal(null);
              setAuthPage("login");
            }}
          />
        )}
      </Suspense>
    );
  }

  // ==================================================
  // ADMIN APPLICATION
  // ==================================================

  if (user.role === "admin") {
    return (
      <div className="min-h-screen bg-[#f7f8f5]">

        <AdminNavbar
          user={user}
          handleLogout={handleLogout}
          currentPage={adminPage}
          setCurrentPage={setAdminPage}
          setSelectedAdminProblemId={setSelectedAdminProblemId}
        />

        <Suspense fallback={<PageLoadingFallback />}>
          {/* ADMIN DASHBOARD */}

          {adminPage === "dashboard" && (
            <AdminDashboard
              setAdminPage={setAdminPage}
              setSelectedAdminProblemId={
                setSelectedAdminProblemId
              }
            />
          )}

          {/* ADMIN PROPOSALS */}

          {adminPage === "proposals" && (
            <AdminProposals
              setAdminPage={setAdminPage}
              setSelectedAdminProblemId={
                setSelectedAdminProblemId
              }
            />
          )}

          {/* PARTNER MANAGEMENT */}

          {adminPage === "partners" && (
            <PartnerManagement setAdminPage={setAdminPage} />
          )}

          {/* ANALYTICS DASHBOARD */}

          {adminPage === "analytics" && (
            <AnalyticsDashboard setAdminPage={setAdminPage} />
          )}

          {/* ADMIN PROBLEM DETAILS */}

          {adminPage === "problem-details" &&
            selectedAdminProblemId && (
              <AdminProblemDetails
                problemId={
                  selectedAdminProblemId
                }
                setAdminPage={setAdminPage}
              />
            )}
        </Suspense>

      </div>
    );
  }

  // ==================================================
  // PARTNER APPLICATION
  // ==================================================

  if (user.role === "partner") {
    return (
      <div className="min-h-screen bg-[#f7f8f5]">

        {/* ========================================
            PARTNER NAVBAR
        ======================================== */}

        <PartnerNavbar
          user={user}
          currentPage={partnerPage}
          setCurrentPage={setPartnerPage}
          handleLogout={handleLogout}
        />

        {/* ========================================
            PARTNER DASHBOARD
        ======================================== */}

        <Suspense fallback={<PageLoadingFallback />}>
          {partnerPage === "dashboard" && (
            <PartnerDashboard
              setPartnerPage={setPartnerPage}
              setSelectedPartnerProjectId={setSelectedPartnerProjectId}
            />
          )}


          {/* ========================================
              PARTNER PROBLEMS
          ======================================== */}

          {partnerPage === "problems" && (
            <PartnerProblems setPartnerPage={setPartnerPage} />
          )}


          {/* ========================================
              PARTNER PROJECTS
          ======================================== */}

          {partnerPage === "projects" && (
            <PartnerProjects
              user={user}
              setPartnerPage={setPartnerPage}
              setSelectedPartnerProjectId={setSelectedPartnerProjectId}
            />
          )}

          {/* ========================================
              INDUSTRY COLLABORATIONS
          ======================================== */}

          {partnerPage === "collaborations" && (
            <PartnerCollaborations
              user={user}
              setPartnerPage={setPartnerPage}
              setSelectedPartnerProjectId={setSelectedPartnerProjectId}
            />
          )}

          {/* ========================================
              PARTNER DIRECTORY (DISCOVER)
          ======================================== */}

          {partnerPage === "directory" && (
            <PartnerDirectory user={user} setPartnerPage={setPartnerPage} />
          )}

          {/* ========================================
              SHARED PROJECT WORKSPACE
          ======================================== */}

          {partnerPage === "workspace" &&
            selectedPartnerProjectId && (
              <ProjectWorkspace
                projectId={selectedPartnerProjectId}
                user={user}
                setSelectedPartnerProjectId={
                  setSelectedPartnerProjectId
                }
                setPartnerPage={setPartnerPage}
              />
            )}


          {/* ========================================
              UNIVERSITY DASHBOARD
          ======================================== */}

          {partnerPage === "university" && (
            <UniversityDashboard
              setCurrentPage={setPartnerPage}
              setSelectedPartnerProjectId={setSelectedPartnerProjectId}
            />
          )}
        </Suspense>

      </div>
    );
  }

  // ==================================================
  // CITIZEN APPLICATION
  // ==================================================

  return (
    <div className="min-h-screen bg-[#f7f8f5]">

      {/* NAVBAR */}

      <Navbar
        user={user}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        handleLogout={handleLogout}
      />


      <Suspense fallback={<PageLoadingFallback />}>
        {/* HOME */}

        {currentPage === "home" && (
          <Home
            user={user}
            setCurrentPage={setCurrentPage}
          />
        )}


        {/* EXPLORE PROBLEMS */}

        {currentPage === "all-problems" && (
          <AllProblems
            setCurrentPage={setCurrentPage}
            setSelectedProblemId={
              setSelectedProblemId
            }
            setBackPage={setBackPage}
          />
        )}


        {/* SUBMIT PROBLEM */}

        {currentPage === "submit" && (
          <SubmitProblem setCurrentPage={setCurrentPage} />
        )}


        {/* MY PROBLEMS */}

        {currentPage === "my-problems" && (
          <MyProblems
            setCurrentPage={setCurrentPage}
            setSelectedProblemId={
              setSelectedProblemId
            }
            setBackPage={setBackPage}
          />
        )}


        {/* PROBLEM DETAILS */}

        {currentPage === "problem-details" &&
          selectedProblemId && (
            <ProblemDetails
              problemId={selectedProblemId}
              setCurrentPage={setCurrentPage}
              backPage={backPage}
            />
          )}
      </Suspense>

      {/* PWA 1-CLICK INSTALL BANNER */}
      <InstallAppBanner />

    </div>
  );
}

export default App;
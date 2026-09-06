import { useState, useEffect } from "react";

// ================= AUTH PAGES =================

import Login from "./pages/Login";
import Register from "./pages/Register";
import PortalSelection from "./pages/PortalSelection";

// ================= CITIZEN PAGES =================

import Home from "./pages/Home";
import SubmitProblem from "./pages/SubmitProblem";
import MyProblems from "./pages/MyProblems";
import ProblemDetails from "./pages/ProblemDetails";
import AllProblems from "./pages/AllProblems";

// ================= ADMIN PAGES =================

import AdminDashboard from "./pages/AdminDashboard";
import AdminProposals from "./pages/AdminProposals";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PartnerManagement from "./pages/PartnerManagement";
import AdminProblemDetails from "./pages/AdminProblemDetails";
// ================= PARTNER PAGES =================

import PartnerDashboard from "./pages/PartnerDashboard";

import PartnerProblems from "./pages/PartnerProblems";

import PartnerProjects from "./pages/PartnerProjects";

import PartnerCollaborations from "./pages/PartnerCollaborations";
import PartnerDirectory from "./pages/PartnerDirectory";
import ProjectWorkspace from "./pages/ProjectWorkspace";

import UniversityDashboard from "./pages/UniversityDashboard";
// ================= COMPONENTS =================

import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";
import PartnerNavbar from "./components/PartnerNavbar";
import InstallAppBanner from "./components/InstallAppBanner";
import { API_BASE_URL } from "./config/api";
import { getAuthUser, clearAuthSession } from "./utils/authStorage";

function App() {
  // ==================================================
  // WARM UP SERVER IMMEDIATELY ON VISIT (Eliminates Render cold start)
  // ==================================================

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`).catch(() => {});
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
    // ================= PORTAL SELECTION =================

    if (!selectedPortal) {
      return (
        <PortalSelection
          onSelectPortal={(portal) => {
            setSelectedPortal(portal);

            setAuthPage("login");
          }}
        />
      );
    }

    // ================= CITIZEN REGISTER =================

    if (
      authPage === "register" &&
      selectedPortal === "citizen"
    ) {
      return (
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
      );
    }

    // ================= LOGIN =================

    return (
      <Login
        portal={selectedPortal}
        initialEmail={registeredEmail}
        onLogin={handleLogin}
        onSwitchToRegister={() => {
          if (
            selectedPortal === "citizen"
          ) {
            setAuthPage("register");
          }
        }}
        onBack={() => {
          setSelectedPortal(null);

          setAuthPage("login");
        }}
      />
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
          />
        )}

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

      {/* PWA 1-CLICK INSTALL BANNER */}
      <InstallAppBanner />

    </div>
  );
}

export default App;
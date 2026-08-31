import { useState } from "react";

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
import PartnerManagement from "./pages/PartnerManagement";
import AdminProblemDetails from "./pages/AdminProblemDetails";

// ================= PARTNER PAGES =================

import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerProblems from "./pages/PartnerProblems";

// ================= COMPONENTS =================

import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";

function App() {
  // ==================================================
  // AUTH USER
  // ==================================================

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  // ==================================================
  // AUTH STATE
  // ==================================================

  const [authPage, setAuthPage] =
    useState("login");

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

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setUser(null);

    // ================= RESET AUTH =================

    setAuthPage("login");

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
          onSwitchToLogin={() =>
            setAuthPage("login")
          }
        />
      );
    }

    // ================= LOGIN =================

    return (
      <Login
        portal={selectedPortal}
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
      <div className="min-h-screen bg-slate-100">

        <AdminNavbar
          user={user}
          handleLogout={handleLogout}
          currentPage={adminPage}
          setCurrentPage={setAdminPage}
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

        {/* PARTNER MANAGEMENT */}

        {adminPage === "partners" && (
          <PartnerManagement />
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
      <div className="min-h-screen bg-slate-100">

        {/* ========================================
            PARTNER NAVBAR
        ======================================== */}

        <header className="border-b bg-white shadow-sm">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

            {/* PARTNER INFORMATION */}

            <div>

              <h1 className="text-xl font-bold text-slate-800">

                Partner Portal

              </h1>

              <p className="text-sm text-slate-500">

                {user.name}

              </p>

            </div>


            {/* NAVIGATION */}

            <div className="flex items-center gap-4">

              {/* DASHBOARD */}

              <button
                onClick={() =>
                  setPartnerPage("dashboard")
                }
                className={`text-sm font-semibold transition ${
                  partnerPage === "dashboard"
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >

                Dashboard

              </button>


              {/* ASSIGNED PROBLEMS */}

              <button
                onClick={() =>
                  setPartnerPage("problems")
                }
                className={`text-sm font-semibold transition ${
                  partnerPage === "problems"
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >

                Assigned Problems

              </button>


              {/* LOGOUT */}

              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >

                Logout

              </button>

            </div>

          </div>

        </header>


        {/* ========================================
            PARTNER DASHBOARD
        ======================================== */}

        {partnerPage === "dashboard" && (
  <PartnerDashboard
    setPartnerPage={setPartnerPage}
  />
)}


        {/* ========================================
            PARTNER PROBLEMS
        ======================================== */}

        {partnerPage === "problems" && (
          <PartnerProblems />
        )}

      </div>
    );
  }

  // ==================================================
  // CITIZEN APPLICATION
  // ==================================================

  return (
    <div className="min-h-screen bg-slate-100">

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
        <SubmitProblem />
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

    </div>
  );
}

export default App;
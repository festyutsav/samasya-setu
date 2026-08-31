import { useState } from "react";

import { loginUser } from "../services/authService";


const Login = ({
  portal,
  onLogin,
  onSwitchToRegister,
  onBack,
}) => {

  // ========================================
  // STATE
  // ========================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ========================================
  // PORTAL TYPES
  // ========================================

  const isAdminPortal =
    portal === "admin";

  // Internal name remains "partner"
  // UI name is "Organization Portal"

  const isPartnerPortal =
    portal === "partner";

  const isCitizenPortal =
    portal === "citizen";


  // ========================================
  // LOGIN
  // ========================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    try {

      setLoading(true);

      setMessage("");


      // ========================================
      // LOGIN REQUEST
      // ========================================

      const data =
        await loginUser(
          email,
          password
        );


      // ========================================
      // ROLE VALIDATION
      // ========================================


      // ADMIN PORTAL

      if (
        isAdminPortal &&
        data.user.role !== "admin"
      ) {

        setMessage(
          "This account does not have access to the Government Admin Portal."
        );

        return;

      }


      // ========================================
      // ORGANIZATION PORTAL
      // Internal role remains "partner"
      // ========================================

      if (
        isPartnerPortal &&
        data.user.role !== "partner"
      ) {

        setMessage(
          "This account does not have access to the Organization Portal."
        );

        return;

      }


      // ========================================
      // CHECK ORGANIZATION INFORMATION
      // Backend field is still "partner"
      // ========================================

      if (
        isPartnerPortal &&
        !data.user.organization
      ) {

        setMessage(
          "No organization is linked to this account."
        );

        return;

      }


      // ========================================
      // CITIZEN PORTAL
      // ========================================

      if (
        isCitizenPortal &&
        data.user.role !== "citizen"
      ) {

        setMessage(
          "Please select the correct portal for this account."
        );

        return;

      }


      // ========================================
      // SAVE LOGIN DATA
      // ========================================

      localStorage.setItem(
        "token",
        data.token
      );


      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user
        )
      );


      // ========================================
      // SUCCESS
      // ========================================

      onLogin(
        data.user
      );


    } catch (error) {

      setMessage(
        error.response?.data?.message ||
        "Login failed."
      );


    } finally {

      setLoading(false);

    }

  };


  // ========================================
  // PORTAL CONFIGURATION
  // ========================================

  const portalConfig = {

    // ========================================
    // CITIZEN
    // ========================================

    citizen: {

      name:
        "Citizen Portal",

      icon:
        "👥",

      description:
        "Login to SamasyaSetu and continue making an impact.",

      heading:
        "Login to your account",

      button:
        "Login",

      logoColor:
        "bg-blue-600",

      indicatorStyle:
        "border-blue-200 bg-blue-50",

      buttonStyle:
        "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400",

    },


    // ========================================
    // ADMIN
    // ========================================

    admin: {

      name:
        "Government Admin Portal",

      icon:
        "🏛️",

      description:
        "Login to the Government Admin Portal.",

      heading:
        "Government Portal Login",

      button:
        "Login to Government Portal",

      logoColor:
        "bg-slate-800",

      indicatorStyle:
        "border-slate-300 bg-slate-50",

      buttonStyle:
        "bg-slate-800 hover:bg-slate-900 disabled:bg-slate-500",

    },


    // ========================================
    // ORGANIZATION
    // Internal portal key remains "partner"
    // ========================================

    partner: {

      name:
        "Organization Portal",

      icon:
        "🏢",

      description:
        "Login to access your organization's collaboration workspace.",

      heading:
        "Organization Portal Login",

      button:
        "Login to Organization Portal",

      logoColor:
        "bg-green-600",

      indicatorStyle:
        "border-green-200 bg-green-50",

      buttonStyle:
        "bg-green-600 hover:bg-green-700 disabled:bg-green-400",

    },

  };


  // ========================================
  // CURRENT PORTAL
  // ========================================

  const currentPortal =
    portalConfig[portal] ||
    portalConfig.citizen;


  // ========================================
  // UI
  // ========================================

  return (

    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">


      <div className="w-full max-w-md">


        {/* ========================================
            BACK BUTTON
        ======================================== */}

        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >

          ← Back to portal selection

        </button>


        {/* ========================================
            LOGO AND HEADING
        ======================================== */}

        <div className="mb-8 text-center">


          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg ${

              currentPortal.logoColor

            }`}
          >

            S

          </div>


          <h1 className="text-3xl font-bold text-slate-800">

            Welcome back

          </h1>


          <p className="mt-2 text-slate-500">

            {currentPortal.description}

          </p>


        </div>


        {/* ========================================
            LOGIN CARD
        ======================================== */}

        <div className="rounded-2xl bg-white p-8 shadow-xl">


          {/* ========================================
              SELECTED PORTAL
          ======================================== */}

          <div
            className={`mb-6 rounded-xl border p-4 ${

              currentPortal.indicatorStyle

            }`}
          >


            <p className="text-sm text-slate-500">

              Selected Portal

            </p>


            <p className="mt-1 font-semibold text-slate-800">

              {currentPortal.icon}{" "}

              {currentPortal.name}

            </p>


          </div>


          {/* ========================================
              LOGIN HEADING
          ======================================== */}

          <h2 className="mb-6 text-xl font-semibold text-slate-800">

            {currentPortal.heading}

          </h2>


          {/* ========================================
              LOGIN FORM
          ======================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >


            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">

                Email Address

              </label>


              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your email"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>


            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">

                Password

              </label>


              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-4 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed ${

                currentPortal.buttonStyle

              }`}
            >

              {loading
                ? "Logging in..."
                : currentPortal.button}

            </button>


          </form>


          {/* ========================================
              ERROR MESSAGE
          ======================================== */}

          {message && (

            <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">

              {message}

            </p>

          )}


          {/* ========================================
              CITIZEN REGISTRATION
          ======================================== */}

          {isCitizenPortal && (

            <div className="mt-6 text-center text-sm text-slate-600">

              Don't have an account?{" "}

              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >

                Create Account

              </button>

            </div>

          )}


          {/* ========================================
              ADMIN INFORMATION
          ======================================== */}

          {isAdminPortal && (

            <p className="mt-6 text-center text-sm text-slate-500">

              Government access is restricted to
              authorized administrators.

            </p>

          )}


          {/* ========================================
              ORGANIZATION INFORMATION
          ======================================== */}

          {isPartnerPortal && (

            <p className="mt-6 text-center text-sm text-slate-500">

              Organization access is available only to
              authorized universities, industries, NGOs,
              and government organizations.

            </p>

          )}


        </div>


        {/* ========================================
            FOOTER
        ======================================== */}

        <p className="mt-6 text-center text-sm text-slate-500">

          SamasyaSetu · Connecting challenges with solutions

        </p>


      </div>


    </div>

  );

};


export default Login;
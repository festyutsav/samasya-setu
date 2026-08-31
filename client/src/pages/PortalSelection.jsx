

const PortalSelection = ({
  onSelectPortal,
}) => {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">

      <div className="mx-auto max-w-6xl">

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="mb-12 text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-3xl font-bold text-white shadow-lg">
            S
          </div>

          <h1 className="mt-8 text-4xl font-bold text-slate-800">
            Welcome to SamasyaSetu
          </h1>

          <p className="mt-4 text-xl text-slate-600">
            Choose the portal you want to access.
          </p>

        </div>


        {/* ========================================
            PORTALS
        ======================================== */}

        <div className="grid gap-8 md:grid-cols-3">


          {/* ========================================
              CITIZEN PORTAL
          ======================================== */}

          <button
            onClick={() =>
              onSelectPortal("citizen")
            }
            className="rounded-3xl border border-slate-200 bg-white p-10 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
              👥
            </div>

            <h2 className="mt-8 text-3xl font-bold text-slate-800">
              Citizen Portal
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Submit community problems, explore
              challenges, and track the progress of
              your submissions.
            </p>

            <p className="mt-8 text-lg font-semibold text-blue-600">
              Continue as Citizen →
            </p>

          </button>


          {/* ========================================
              GOVERNMENT ADMIN PORTAL
          ======================================== */}

          <button
            onClick={() =>
              onSelectPortal("admin")
            }
            className="rounded-3xl border border-slate-200 bg-white p-10 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
              🏛️
            </div>

            <h2 className="mt-8 text-3xl font-bold text-slate-800">
              Government Admin Portal
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Review community problems, manage
              challenges, assign organizations, and
              monitor progress across the innovation
              ecosystem.
            </p>

            <p className="mt-8 text-lg font-semibold text-slate-800">
              Continue as Administrator →
            </p>

          </button>


          {/* ========================================
              ORGANIZATION PORTAL
          ======================================== */}

          <button
            onClick={() =>
              onSelectPortal("partner")
            }
            className="rounded-3xl border border-slate-200 bg-white p-10 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              🏢
            </div>

            <h2 className="mt-8 text-3xl font-bold text-slate-800">
              Organization Portal
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Access challenges assigned to your
              organization and collaborate on
              solutions, research, implementation,
              and project development.
            </p>

            <p className="mt-8 text-lg font-semibold text-green-600">
              Continue as Organization →
            </p>

          </button>

        </div>


        {/* ========================================
            ORGANIZATION TYPES INFO
        ======================================== */}

        <div className="mt-10 text-center">

          <p className="text-sm text-slate-500">
            Organization access is available for
            universities, industries, NGOs, and
            government institutions.
          </p>

        </div>

      </div>

    </main>
  );
};


export default PortalSelection;
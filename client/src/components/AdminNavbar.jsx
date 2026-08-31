const AdminNavbar = ({
  user,
  handleLogout,
  currentPage,
  setCurrentPage,
}) => {
  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">

        {/* Left Section */}
        <div className="flex items-center gap-8">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold text-white">
              S
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-800">
                SamasyaSetu
              </h1>

              <p className="text-xs text-slate-500">
                Government Admin Portal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden items-center gap-2 md:flex">

            <button
              onClick={() =>
                setCurrentPage("dashboard")
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                currentPage === "dashboard"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                setCurrentPage("partners")
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                currentPage === "partners"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Partners
            </button>

          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">

          {/* Admin Information */}
          <div className="hidden border-r border-slate-200 pr-4 sm:block">
            <p className="text-sm font-semibold text-slate-700">
              {user.name}
            </p>

            <p className="text-xs capitalize text-slate-500">
              {user.role}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>

        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
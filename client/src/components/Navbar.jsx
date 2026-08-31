import { useState } from "react";

const Navbar = ({
  user,
  currentPage,
  setCurrentPage,
  handleLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // Check user role
  const isAdmin = user.role === "admin";

  // Navigation items based on user role
  const navItems = isAdmin
    ? [
        {
          label: "Dashboard",
          page: "admin-dashboard",
        },
        {
          label: "Explore",
          page: "all-problems",
        },
      ]
    : [
        {
          label: "Home",
          page: "home",
        },
        {
          label: "Explore",
          page: "all-problems",
        },
        {
          label: "Submit",
          page: "submit",
        },
        {
          label: "My Problems",
          page: "my-problems",
        },
      ];

  const handleNavigation = (page) => {
    setCurrentPage(page);

    // Close mobile menu after navigation
    setMobileMenuOpen(false);
  };

  return (
    <nav className="relative border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-20 w-full items-center px-4 lg:px-8">

        {/* Logo */}
        <button
          onClick={() =>
            handleNavigation(
              isAdmin ? "admin-dashboard" : "home"
            )
          }
          className="flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-sm">
            S
          </div>

          <div className="hidden text-left sm:block">
            <h1 className="whitespace-nowrap text-xl font-bold text-slate-800">
              SamasyaSetu
            </h1>

            <p className="hidden whitespace-nowrap text-xs text-slate-500 2xl:block">
              Connecting challenges with solutions
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden flex-1 items-center justify-center gap-8 lg:flex xl:gap-14">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() =>
                handleNavigation(item.page)
              }
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition xl:px-4 ${
                currentPage === item.page
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop User Section */}
        <div className="hidden shrink-0 items-center gap-3 border-l border-slate-200 pl-4 lg:flex">

          {/* User Info */}
          <div className="hidden xl:block">
            <p className="max-w-28 truncate whitespace-nowrap text-sm font-semibold text-slate-700">
              {user.name}
            </p>

            <p className="whitespace-nowrap text-xs capitalize text-slate-500">
              {user.role}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="shrink-0 whitespace-nowrap rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 xl:px-4"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() =>
            setMobileMenuOpen(!mobileMenuOpen)
          }
          className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-700 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white p-4 lg:hidden">
          <div className="flex flex-col gap-2">

            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() =>
                  handleNavigation(item.page)
                }
                className={`rounded-lg px-4 py-3 text-left font-semibold transition ${
                  currentPage === item.page
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}

          </div>

          {/* Divider */}
          <div className="my-4 border-t border-slate-200" />

          {/* User Information */}
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="font-semibold text-slate-800">
              {user.name}
            </p>

            <p className="mt-1 text-sm capitalize text-slate-500">
              {user.role}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-lg border border-red-200 py-3 font-semibold text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
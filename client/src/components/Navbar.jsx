import { useState } from "react";
import NotificationBell from "./NotificationBell";

const Navbar = ({
  user,
  currentPage,
  setCurrentPage,
  handleLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user.role === "admin";

  const navItems = isAdmin
    ? [
        { label: "Dashboard", page: "admin-dashboard" },
        { label: "Explore", page: "all-problems" },
      ]
    : [
        { label: "Home", page: "home" },
        { label: "Explore", page: "all-problems" },
        { label: "Submit", page: "submit" },
        { label: "My Problems", page: "my-problems" },
      ];

  const handleNavigation = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[#e3e9e3] bg-white shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <button
          onClick={() => handleNavigation(isAdmin ? "admin-dashboard" : "home")}
          className="flex shrink-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b514a] text-lg font-bold text-[#e9c985] shadow-sm">
            S
          </div>

          <div className="hidden text-left sm:block">
            <h1 className="whitespace-nowrap text-base font-bold leading-tight text-[#173d3a]">
              SamasyaSetu
            </h1>

            <p className="hidden whitespace-nowrap text-[11px] leading-tight text-[#71827c] xl:block">
              Connecting challenges with solutions
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1.5 md:flex">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => handleNavigation(item.page)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                currentPage === item.page
                  ? "bg-[#0b514a] text-white shadow-sm"
                  : "text-[#5c6f69] hover:bg-[#f7f8f5] hover:text-[#173d3a]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop User Section */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">

          <NotificationBell user={user} />

          <div className="hidden border-l border-[#e3e9e3] pl-3 text-left xl:block">
            <p className="max-w-32 truncate text-sm font-semibold leading-tight text-[#315d56]">
              {user.name}
            </p>

            <p className="text-[11px] capitalize leading-tight text-[#71827c]">
              {user.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="whitespace-nowrap rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="flex shrink-0 items-center gap-2.5 md:hidden">
          <NotificationBell user={user} />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e3e9e3] text-lg text-[#315d56] transition hover:bg-[#f7f8f5]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#e3e9e3] bg-white p-4 md:hidden">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavigation(item.page)}
                className={`rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition ${
                  currentPage === item.page
                    ? "bg-[#0b514a] text-white"
                    : "text-[#315d56] hover:bg-[#f7f8f5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="my-3 border-t border-[#e3e9e3]" />

          <div className="rounded-lg bg-[#f2f5f1] px-4 py-3">
            <p className="text-sm font-semibold text-[#173d3a]">
              {user.name}
            </p>

            <p className="mt-0.5 text-xs capitalize text-[#71827c]">
              {user.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

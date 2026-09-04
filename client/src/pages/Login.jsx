import { useState } from "react";
import { loginUser } from "../services/authService";
import JharkhandEmblem from "../components/JharkhandEmblem";

const Login = ({ portal, onLogin, onSwitchToRegister, onBack, initialEmail = "" }) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const config = {
    citizen: { name: "Citizen Portal", title: "Welcome back, changemaker.", copy: "Your community has a voice. Continue building a better Jharkhand together.", icon: "◎", tint: "bg-[#e1f1ed] text-[#087f70]", button: "Continue to Citizen Portal" },
    partner: { name: "University & Industry Portal", title: "Welcome to the workspace.", copy: "Turn meaningful challenges into research, prototypes, and solutions that reach people.", icon: "✦", tint: "bg-[#f7ebd8] text-[#a25a1b]", button: "Enter Collaboration Workspace" },
    admin: { name: "Government Portal", title: "Lead the change.", copy: "Coordinate the ecosystem and keep every challenge moving toward impact.", icon: "⌂", tint: "bg-[#e2e9f4] text-[#31527c]", button: "Continue to Government Portal" },
  }[portal] || {};

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true); setMessage("");
      const data = await loginUser(email, password);
      if (portal === "admin" && data.user.role !== "admin") return setMessage("This account does not have access to the Government Portal.");
      if (portal === "partner" && (data.user.role !== "partner" || !data.user.organization)) return setMessage(data.user.role !== "partner" ? "This account does not have access to the Organization Portal." : "No organization is linked to this account.");
      if (portal === "citizen" && data.user.role !== "citizen") return setMessage("Please select the correct portal for this account.");
      localStorage.setItem("token", data.token); localStorage.setItem("user", JSON.stringify(data.user)); onLogin(data.user);
    } catch (error) { setMessage(error.response?.data?.message || "Login failed. Please check your details."); } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#173d3a]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[.9fr_1.1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#073f3a] p-12 text-[#f7f8f5] lg:flex">
          <div className="relative z-10">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider backdrop-blur hover:bg-white/20 transition">
              ← Switch Portal
            </button>
          </div>
          <div className="relative z-10 max-w-md">
            <div className="mb-6 flex items-center gap-3">
              <JharkhandEmblem className="h-14 w-14 drop-shadow" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[.25em] text-[#d8ebe4]">Government of Jharkhand</p>
                <h1 className="text-2xl font-bold tracking-tight">SamasyaSetu</h1>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight text-white">{config.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#cde3dc]">{config.copy}</p>
          </div>
          <div className="relative z-10 border-t border-white/15 pt-6 text-xs text-[#a9ccc4]">
            Smart India Hackathon • Problem Resolution Bridge
          </div>
        </section>
        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Top Back to Portals Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-[#dbe5df] bg-white px-4 py-2 text-xs font-bold text-[#315d56] shadow-sm transition hover:border-[#0b514a] hover:bg-[#f0f6f4] hover:text-[#0b514a]"
              >
                <span>← Back to Portals</span>
              </button>

              <span className="text-xs font-bold uppercase tracking-widest text-[#71827c]">
                SamasyaSetu
              </span>
            </div>

            <div className="mb-8">
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${config.tint}`}>
                {config.icon}
              </div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#a25a1b]">{config.name}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to continue</h2>
              <p className="mt-2 text-sm text-[#71827c]">Access your SamasyaSetu workspace.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-[#e1e8e2] bg-white p-7 shadow-xl shadow-[#164f47]/5 sm:p-9">
              <div>
                <label className="mb-2 block text-sm font-semibold">Email address</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] pl-4 pr-11 py-3.5 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71827c] transition hover:text-[#0b514a] focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#0b514a] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0b514a]/15 transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Signing you in..." : config.button}
              </button>
              {message && <p className="rounded-xl bg-[#fff2ee] px-4 py-3 text-sm text-[#b24e38]">{message}</p>}
            </form>
            {portal === "citizen" && <p className="mt-6 text-center text-sm text-[#71827c]">New to SamasyaSetu? <button type="button" onClick={onSwitchToRegister} className="font-bold text-[#0b6b60] hover:underline">Create an account</button></p>}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
import { useState } from "react";
import { loginUser } from "../services/authService";

const Login = ({ portal, onLogin, onSwitchToRegister, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const config = {
    citizen: { name: "Citizen portal", title: "Welcome back, changemaker.", copy: "Your community has a voice. Continue building a better Jharkhand together.", icon: "◎", tint: "bg-[#e1f1ed] text-[#087f70]", button: "Continue to citizen portal" },
    partner: { name: "University & industry", title: "Welcome to the workspace.", copy: "Turn meaningful challenges into research, prototypes, and solutions that reach people.", icon: "✦", tint: "bg-[#f7ebd8] text-[#a25a1b]", button: "Enter collaboration workspace" },
    admin: { name: "Government portal", title: "Lead the change.", copy: "Coordinate the ecosystem and keep every challenge moving toward impact.", icon: "⌂", tint: "bg-[#e2e9f4] text-[#31527c]", button: "Continue to government portal" },
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
        <aside className="relative hidden overflow-hidden bg-[#0b514a] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-[#237b6b] opacity-50 blur-3xl" />
          <div className="relative"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9c985] text-xl font-bold text-[#0b514a]">S</div><p className="text-lg font-bold">SamasyaSetu</p></div><p className="mt-28 text-xs font-bold uppercase tracking-[.25em] text-[#a9d0c3]">Your role in the ecosystem</p><h1 className="mt-5 max-w-md text-5xl font-semibold leading-[1.05] tracking-[-.04em]">{config.title}</h1><p className="mt-6 max-w-sm text-base leading-7 text-[#c0d8d1]">{config.copy}</p></div>
          <div className="relative border-t border-white/15 pt-6 text-sm text-[#b5cec6]">Connect. Collaborate. Create impact.<span className="float-right text-[#e9c985]">✦</span></div>
        </aside>
        <section className="flex items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-md"><button type="button" onClick={onBack} className="mb-12 text-sm font-semibold text-[#688078] transition hover:text-[#0b6b60]">← Back to portal selection</button><div className="mb-8 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b514a] font-bold text-[#e9c985]">S</div><p className="font-bold">SamasyaSetu</p></div><div className="mb-8"><div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${config.tint}`}>{config.icon}</div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#a25a1b]">{config.name}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to continue</h2><p className="mt-2 text-sm text-[#71827c]">Access your SamasyaSetu workspace.</p></div>
            <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-[#e1e8e2] bg-white p-7 shadow-xl shadow-[#164f47]/5 sm:p-9"><div><label className="mb-2 block text-sm font-semibold">Email address</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]" /></div><div><label className="mb-2 block text-sm font-semibold">Password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]" /></div><button type="submit" disabled={loading} className="w-full rounded-xl bg-[#0b514a] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0b514a]/15 transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing you in..." : config.button}</button>{message && <p className="rounded-xl bg-[#fff2ee] px-4 py-3 text-sm text-[#b24e38]">{message}</p>}</form>
            {portal === "citizen" && <p className="mt-6 text-center text-sm text-[#71827c]">New to SamasyaSetu? <button type="button" onClick={onSwitchToRegister} className="font-bold text-[#0b6b60] hover:underline">Create an account</button></p>}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
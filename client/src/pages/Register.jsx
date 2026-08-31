import { useState } from "react";
import { registerUser } from "../services/authService";

const Register = ({ onSwitchToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setSuccess(false);

      const data = await registerUser(name, email, password);

      setSuccess(true);
      setMessage(
        data.message || "Registration successful. Please login.",
      );

      // Clear form
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setSuccess(false);

      setMessage(
        error.response?.data?.message ||
          "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo and heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg">
            S
          </div>

          <h1 className="text-3xl font-bold text-slate-800">
            Create an account
          </h1>

          <p className="mt-2 text-slate-500">
            Join SamasyaSetu and help bring challenges closer to solutions.
          </p>
        </div>

        {/* Register card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-slate-800">
            Register
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength="6"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Message */}
          {message && (
            <p
              className={`mt-5 rounded-lg px-4 py-3 text-sm ${
                success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          {/* Switch to Login */}
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
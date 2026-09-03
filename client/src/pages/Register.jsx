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
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo and heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b514a] text-2xl font-bold text-white shadow-lg">
            S
          </div>

          <h1 className="text-3xl font-bold text-[#173d3a]">
            Create an account
          </h1>

          <p className="mt-2 text-[#71827c]">
            Join SamasyaSetu and help bring challenges closer to solutions.
          </p>
        </div>

        {/* Register card */}
        <div className="rounded-2xl border border-[#e3e9e3] bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-[#173d3a]">
            Register
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#315d56]">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength="6"
                className="w-full rounded-xl border border-[#dbe5df] px-4 py-3 text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
              />
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0b514a] px-4 py-3 font-semibold text-white shadow-md transition hover:bg-[#073f3a] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Message */}
          {message && (
            <p
              className={`mt-5 rounded-lg px-4 py-3 text-sm ${
                success
                  ? "bg-[#e9f4f0] text-[#087f70]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          {/* Switch to Login */}
          <div className="mt-6 text-center text-sm text-[#5c6f69]">
            Already have an account?{" "}

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-[#0b6b60] transition hover:text-[#087f70]"
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
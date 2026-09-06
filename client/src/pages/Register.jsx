import { useEffect, useRef, useState } from "react";
import { sendRegistrationOtp, verifyOtpAndRegister } from "../services/authService";
import JharkhandEmblem from "../components/JharkhandEmblem";

const Register = ({ onSwitchToLogin, onRegisterSuccess, onBack }) => {
  // ========================================
  // STATE
  // ========================================

  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP Verification

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [demoOtp, setDemoOtp] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"
  const [loading, setLoading] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef([]);

  // ========================================
  // RESEND COOLDOWN TIMER
  // ========================================

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // ========================================
  // STEP 1: SEND OTP
  // ========================================

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const data = await sendRegistrationOtp(name, email, password);

      setStep(2);
      setResendCooldown(30);
      if (data.demoOtp) {
        setDemoOtp(data.demoOtp);
      }
      setMessage(data.message || "Verification code sent to your email.");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to send verification code. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // RESEND OTP
  // ========================================

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const data = await sendRegistrationOtp(name, email, password);

      setResendCooldown(30);
      if (data.demoOtp) {
        setDemoOtp(data.demoOtp);
      }
      setMessage("New verification code sent to your email.");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to resend code."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // OTP INPUT HANDLERS
  // ========================================

  const handleOtpChange = (index, value) => {
    // Only accept numeric characters
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = sanitized ? sanitized.slice(-1) : "";
    setOtp(newOtp);

    // Auto-advance to next input
    if (sanitized && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    const nextFocusIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextFocusIndex]?.focus();
  };

  const handleAutofillDemo = () => {
    if (!demoOtp) return;
    const digits = demoOtp.split("").slice(0, 6);
    setOtp(digits);
    otpInputsRef.current[5]?.focus();
  };

  // ========================================
  // STEP 2: VERIFY OTP & REGISTER
  // ========================================

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setMessage("Please enter the complete 6-digit verification code.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      await verifyOtpAndRegister(name, email, password, fullOtp);

      setMessage("Email verified & registered successfully! Redirecting to login...");
      setMessageType("success");

      // Redirect user to login page
      setTimeout(() => {
        if (onSwitchToLogin) {
          onSwitchToLogin(email);
        }
      }, 1200);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Invalid verification code. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-4 py-10">
      <div className="w-full max-w-md">
        {/* TOP NAVIGATION BACK BUTTON */}
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack || onSwitchToLogin}
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe5df] bg-white px-4 py-2 text-xs font-bold text-[#315d56] shadow-sm transition hover:border-[#0b514a] hover:bg-[#f0f6f4] hover:text-[#0b514a]"
          >
            <span>← Back to Portals</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchToLogin()}
            className="text-xs font-semibold text-[#0b6b60] hover:underline"
          >
            Sign in instead →
          </button>
        </div>

        {/* LOGO AND EMBLEM */}
        <div className="mb-6 text-center">
          <JharkhandEmblem className="mx-auto mb-3 h-16 w-16 drop-shadow-sm" />

          <p className="text-xs font-bold uppercase tracking-widest text-[#0b6b60]">
            Government of Jharkhand
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[#173d3a]">
            {step === 1 ? "Create Citizen Account" : "Verify Your Email"}
          </h1>

          <p className="mt-1.5 text-sm text-[#71827c]">
            {step === 1
              ? "Join SamasyaSetu to report community challenges and track solutions."
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span
            className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
              step === 1
                ? "bg-[#0b514a] text-white"
                : "bg-[#d8ebe4] text-[#087f70]"
            }`}
          >
            <span>1</span> Details
          </span>

          <span className="h-0.5 w-6 bg-[#dbe5df]" />

          <span
            className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
              step === 2
                ? "bg-[#0b514a] text-white"
                : "bg-[#e2e8f0] text-[#94a3b8]"
            }`}
          >
            <span>2</span> Verification
          </span>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-2xl border border-[#e3e9e3] bg-white p-7 shadow-xl sm:p-8">
          {/* ========================================
              STEP 1: ACCOUNT DETAILS FORM
          ======================================== */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#315d56]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Mahto"
                  required
                  className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#315d56]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
                />
                <p className="mt-1 text-xs text-[#71827c]">
                  A 6-digit OTP code will be sent to verify your email.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#315d56]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] pl-4 pr-11 py-3 text-sm text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[#0b514a] px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#073f3a] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
              >
                {loading ? "Sending verification code..." : "Send Verification Code →"}
              </button>
            </form>
          )}

          {/* ========================================
              STEP 2: OTP VERIFICATION FORM
          ======================================== */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              {/* RECIPIENT BANNER */}
              <div className="flex items-center justify-between rounded-xl bg-[#f7fbf9] border border-[#d8ebe4] p-3 text-xs text-[#5c6f69]">
                <div>
                  Code sent to <strong className="text-[#173d3a]">{email}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setMessage("");
                    setMessageType("");
                  }}
                  className="font-bold text-[#0b6b60] hover:underline"
                >
                  Change
                </button>
              </div>

              {/* DEMO MODE OTP CHIP */}
              {demoOtp && (
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <div>
                    <span className="font-bold">⚡ Demo Code:</span>{" "}
                    <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold tracking-wider text-amber-800 border border-amber-200">
                      {demoOtp}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutofillDemo}
                    className="rounded-lg bg-amber-200 px-2 py-1 font-semibold text-amber-900 hover:bg-amber-300"
                  >
                    Autofill
                  </button>
                </div>
              )}

              {/* 6-DIGIT OTP BOXES */}
              <div>
                <label className="mb-2 block text-center text-xs font-bold uppercase tracking-wider text-[#71827c]">
                  Enter 6-Digit One-Time Password
                </label>

                <div className="flex justify-between gap-2" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="h-13 w-12 rounded-xl border border-[#dbe5df] bg-[#fbfcfa] text-center text-2xl font-extrabold text-[#0b514a] outline-none transition focus:border-[#0b6b60] focus:ring-4 focus:ring-[#dff1eb]"
                    />
                  ))}
                </div>
              </div>

              {/* VERIFY BUTTON */}
              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full rounded-xl bg-[#0b514a] px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#073f3a] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
              >
                {loading ? "Verifying code..." : "Verify & Complete Registration"}
              </button>

              {/* RESEND CONTROLS */}
              <div className="text-center text-xs text-[#71827c]">
                {resendCooldown > 0 ? (
                  <p>
                    Didn't receive code? Resend available in{" "}
                    <span className="font-bold text-[#0b6b60]">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-bold text-[#0b6b60] hover:underline"
                  >
                    Resend Verification Code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* MESSAGE BANNER */}
          {message && (
            <div
              className={`mt-5 rounded-xl p-3.5 text-xs font-medium ${
                messageType === "success"
                  ? "bg-[#e9f4f0] text-[#087f70] border border-[#bcd9cf]"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* SWITCH TO LOGIN */}
          <div className="mt-6 border-t border-[#eef2ee] pt-4 text-center text-xs text-[#5c6f69]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-[#0b6b60] transition hover:text-[#087f70]"
            >
              Login here
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;
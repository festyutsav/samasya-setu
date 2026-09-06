import { useEffect, useRef, useState } from "react";
import {
sendRegistrationOtp,
verifyOtpAndRegister,
} from "../services/authService";
import JharkhandEmblem from "../components/JharkhandEmblem";

const Register = ({ onSwitchToLogin, onRegisterSuccess, onBack }) => {
const [step, setStep] = useState(1);

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [otp, setOtp] = useState(["", "", "", "", "", ""]);

const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState("");
const [loading, setLoading] = useState(false);
const [resendCooldown, setResendCooldown] = useState(0);

const otpInputsRef = useRef([]);

useEffect(() => {
if (resendCooldown <= 0) return;

const interval = setInterval(() => {
  setResendCooldown((prev) => prev - 1);
}, 1000);

return () => clearInterval(interval);

}, [resendCooldown]);

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

  console.log("Sending registration OTP to:", email);

  const data = await sendRegistrationOtp(name, email, password);

  console.log("OTP response:", data);

  setStep(2);
  setResendCooldown(30);

  setMessage(
    data?.message || "Verification code sent to your email."
  );
  setMessageType("success");
} catch (error) {
  console.error("Send OTP error:", error);

  setMessage(
    error?.response?.data?.message ||
      error?.message ||
      "Failed to send verification code. Please try again."
  );
  setMessageType("error");
} finally {
  setLoading(false);
}

};

const handleResendOtp = async () => {
if (resendCooldown > 0) return;

try {
  setLoading(true);
  setMessage("");
  setMessageType("");

  console.log("Resending OTP to:", email);

  const data = await sendRegistrationOtp(name, email, password);

  console.log("Resend OTP response:", data);

  setResendCooldown(30);

  setMessage(
    data?.message || "New verification code sent to your email."
  );
  setMessageType("success");
} catch (error) {
  console.error("Resend OTP error:", error);

  setMessage(
    error?.response?.data?.message ||
      error?.message ||
      "Failed to resend verification code."
  );
  setMessageType("error");
} finally {
  setLoading(false);
}

};

const handleOtpChange = (index, value) => {
const sanitized = value.replace(/\D/g, "");

if (!sanitized && value !== "") return;

const newOtp = [...otp];

newOtp[index] = sanitized
  ? sanitized.slice(-1)
  : "";

setOtp(newOtp);

if (sanitized && index < 5) {
  otpInputsRef.current[index + 1]?.focus();
}

};

const handleKeyDown = (index, e) => {
if (
e.key === "Backspace" &&
!otp[index] &&
index > 0
) {
otpInputsRef.current[index - 1]?.focus();
}
};

const handlePaste = (e) => {
e.preventDefault();

const pastedData = e.clipboardData
  .getData("text")
  .replace(/\D/g, "")
  .slice(0, 6);

if (!pastedData) return;

const newOtp = ["", "", "", "", "", ""];

for (let i = 0; i < pastedData.length; i++) {
  newOtp[i] = pastedData[i];
}

setOtp(newOtp);

const focusIndex = Math.min(
  pastedData.length,
  5
);

otpInputsRef.current[focusIndex]?.focus();

};

const handleVerifyAndRegister = async (e) => {
e.preventDefault();

const fullOtp = otp.join("");

if (fullOtp.length !== 6) {
  setMessage(
    "Please enter the complete 6-digit verification code."
  );
  setMessageType("error");
  return;
}

try {
  setLoading(true);
  setMessage("");
  setMessageType("");

  console.log("Verifying OTP for:", email);

  await verifyOtpAndRegister(
    name,
    email,
    password,
    fullOtp
  );

  setMessage(
    "Email verified and registration successful! Redirecting to login..."
  );
  setMessageType("success");

  setTimeout(() => {
    if (onSwitchToLogin) {
      onSwitchToLogin(email);
    }
  }, 1200);
} catch (error) {
  console.error("Verify OTP error:", error);

  setMessage(
    error?.response?.data?.message ||
      error?.message ||
      "Invalid verification code. Please try again."
  );
  setMessageType("error");
} finally {
  setLoading(false);
}

};

return (
<main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-4 py-10">
<div className="w-full max-w-md">

    <div className="mb-5 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack || onSwitchToLogin}
        className="inline-flex items-center gap-2 rounded-full border border-[#dbe5df] bg-white px-4 py-2 text-xs font-bold text-[#315d56] shadow-sm transition hover:border-[#0b514a] hover:bg-[#f0f6f4] hover:text-[#0b514a]"
      >
        ← Back to Portals
      </button>

      <button
        type="button"
        onClick={() => onSwitchToLogin()}
        className="text-xs font-semibold text-[#0b6b60] hover:underline"
      >
        Sign in instead →
      </button>
    </div>

    <div className="mb-6 text-center">
      <JharkhandEmblem
        className="mx-auto mb-3 h-16 w-16 drop-shadow-sm"
      />

      <p className="text-xs font-bold uppercase tracking-widest text-[#0b6b60]">
        Government of Jharkhand
      </p>

      <h1 className="mt-1 text-2xl font-bold text-[#173d3a]">
        {step === 1
          ? "Create Citizen Account"
          : "Verify Your Email"}
      </h1>

      <p className="mt-1.5 text-sm text-[#71827c]">
        {step === 1
          ? "Join SamasyaSetu to report community challenges and track solutions."
          : `Enter the 6-digit code sent to ${email}`}
      </p>
    </div>

    <div className="mb-6 flex items-center justify-center gap-2">
      <span
        className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
          step === 1
            ? "bg-[#0b514a] text-white"
            : "bg-[#d8ebe4] text-[#087f70]"
        }`}
      >
        <span>1</span>
        Details
      </span>

      <span className="h-0.5 w-6 bg-[#dbe5df]" />

      <span
        className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
          step === 2
            ? "bg-[#0b514a] text-white"
            : "bg-[#e2e8f0] text-[#94a3b8]"
        }`}
      >
        <span>2</span>
        Verification
      </span>
    </div>

    <div className="rounded-2xl border border-[#e3e9e3] bg-white p-7 shadow-xl sm:p-8">

      {step === 1 && (
        <form
          onSubmit={handleSendOtp}
          className="space-y-4"
        >

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#315d56]">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. Ramesh Kumar Mahto"
              required
              className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#315d56]">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="your.email@example.com"
              required
              className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] px-4 py-3 text-sm text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
            />

            <p className="mt-1 text-xs text-[#71827c]">
              A 6-digit OTP code will be sent to verify your email.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#315d56]">
              Password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create a password (min 6 characters)"
                required
                minLength={6}
                className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] pl-4 pr-11 py-3 text-sm text-[#315d56] outline-none transition placeholder:text-[#a1aca7] focus:border-[#62a99b] focus:ring-4 focus:ring-[#dff1eb]"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71827c] hover:text-[#0b514a]"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#0b514a] px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
          >
            {loading
              ? "Sending verification code..."
              : "Send Verification Code →"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={handleVerifyAndRegister}
          className="space-y-5"
        >

          <div className="flex items-center justify-between rounded-xl border border-[#d8ebe4] bg-[#f7fbf9] p-3 text-xs text-[#5c6f69]">
            <div>
              Code sent to{" "}
              <strong className="text-[#173d3a]">
                {email}
              </strong>
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

          <div>
            <label className="mb-2 block text-center text-xs font-bold uppercase tracking-wider text-[#71827c]">
              Enter 6-Digit One-Time Password
            </label>

            <div
              className="flex justify-between gap-2"
              onPaste={handlePaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] =
                      el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(
                      idx,
                      e.target.value
                    )
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(idx, e)
                  }
                  className="h-13 w-12 rounded-xl border border-[#dbe5df] bg-[#fbfcfa] text-center text-2xl font-extrabold text-[#0b514a] outline-none transition focus:border-[#0b6b60] focus:ring-4 focus:ring-[#dff1eb]"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              otp.join("").length !== 6
            }
            className="w-full rounded-xl bg-[#0b514a] px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad]"
          >
            {loading
              ? "Verifying code..."
              : "Verify & Complete Registration"}
          </button>

          <div className="text-center text-xs text-[#71827c]">
            {resendCooldown > 0 ? (
              <p>
                Didn't receive code? Resend available in{" "}
                <span className="font-bold text-[#0b6b60]">
                  {resendCooldown}s
                </span>
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

      {message && (
        <div
          className={`mt-5 rounded-xl p-3.5 text-xs font-medium ${
            messageType === "success"
              ? "border border-[#bcd9cf] bg-[#e9f4f0] text-[#087f70]"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

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
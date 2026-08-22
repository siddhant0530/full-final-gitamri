"use client";

import { useState } from "react";

type Tab = "email" | "mobile";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("email");
  const [mode, setMode] = useState<"login" | "signup">("login");

  // --- Email/password form state ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // --- Mobile OTP state ---
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [message, setMessage] = useState("");

  /**
   * SOCIAL LOGIN (Google / Facebook)
   * --------------------------------------------------------------
   * These buttons are wired up to call your auth backend once you
   * configure it. The recommended approach is NextAuth.js:
   *   1. npm install next-auth
   *   2. Create app/api/auth/[...nextauth]/route.ts with Google and
   *      Facebook providers, using client ID/secret from:
   *        - Google Cloud Console -> OAuth consent screen
   *        - Meta for Developers -> Facebook Login product
   *   3. Replace the onClick handlers below with:
   *        signIn("google")  /  signIn("facebook")
   */
  function handleGoogleLogin() {
    setMessage(
      "Google login isn't connected yet. Add your Google OAuth client ID/secret and wire this button to NextAuth's signIn('google')."
    );
  }

  function handleFacebookLogin() {
    setMessage(
      "Facebook login isn't connected yet. Add your Meta app ID/secret and wire this button to NextAuth's signIn('facebook')."
    );
  }

  /**
   * MOBILE OTP LOGIN
   * --------------------------------------------------------------
   * Needs an SMS/OTP provider such as Twilio Verify, MSG91, or
   * Firebase Phone Auth. Typical flow:
   *   POST /api/auth/otp/send   { phone }   -> provider sends OTP
   *   POST /api/auth/otp/verify { phone, otp } -> provider verifies
   * Replace the two handlers below with real fetch() calls once
   * you've created those API routes with your provider's credentials.
   */
  async function handleSendOtp() {
    if (!phone || phone.length < 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    setMessage(
      `OTP provider isn't connected yet. Once configured (e.g. Twilio Verify), an OTP would be sent to +91 ${phone} now.`
    );
    setOtpSent(true);
  }

  async function handleVerifyOtp() {
    if (!otp) {
      setMessage("Enter the OTP you received.");
      return;
    }
    setMessage(
      "OTP verification isn't connected to a real provider yet — this is a placeholder. Once wired up, a successful verification would log the user in here."
    );
  }

  /**
   * EMAIL LOGIN / SIGNUP
   * --------------------------------------------------------------
   * Needs a backend auth route (e.g. app/api/auth/email/route.ts)
   * that checks/creates a user in your database and issues a
   * session (NextAuth Credentials provider, or your own JWT/cookie).
   */
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || (mode === "signup" && !name)) {
      setMessage("Please fill in all fields.");
      return;
    }
    setMessage(
      `Email ${mode === "signup" ? "sign up" : "login"} isn't connected to a real backend yet. Once you add a users database and an /api/auth/email route, this form will ${mode === "signup" ? "create an account" : "log the user in"}.`
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
      <h1 className="text-3xl font-bold text-zinc-900">
        {mode === "login" ? "Log In" : "Create Account"}
      </h1>
      <p className="mt-2 text-center text-zinc-600">
        Access your orders, track deliveries, and check out faster.
      </p>

      <div className="mt-8 w-full space-y-3">
        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 py-3 font-medium hover:bg-gray-50"
        >
          Continue with Google
        </button>
        <button
          onClick={handleFacebookLogin}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1877F2] py-3 font-medium text-white hover:bg-[#166fe0]"
        >
          Continue with Facebook
        </button>
      </div>

      <div className="my-6 flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-zinc-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="flex w-full rounded-full bg-gray-100 p-1">
        <button
          onClick={() => setTab("email")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            tab === "email" ? "bg-white shadow" : "text-zinc-500"
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setTab("mobile")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            tab === "mobile" ? "bg-white shadow" : "text-zinc-500"
          }`}
        >
          Mobile OTP
        </button>
      </div>

      {tab === "email" && (
        <form onSubmit={handleEmailSubmit} className="mt-6 w-full space-y-4">
          {mode === "signup" && (
            <input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-green-700 py-3 font-semibold text-white hover:bg-green-800"
          >
            {mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
      )}

      {tab === "mobile" && (
        <div className="mt-6 w-full space-y-4">
          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            <span className="flex items-center bg-gray-50 px-4 text-zinc-600">+91</span>
            <input
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full px-4 py-3"
            />
          </div>
          {!otpSent ? (
            <button
              onClick={handleSendOtp}
              className="w-full rounded-full bg-green-700 py-3 font-semibold text-white hover:bg-green-800"
            >
              Send OTP
            </button>
          ) : (
            <>
              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              />
              <button
                onClick={handleVerifyOtp}
                className="w-full rounded-full bg-green-700 py-3 font-semibold text-white hover:bg-green-800"
              >
                Verify & Continue
              </button>
            </>
          )}
        </div>
      )}

      {message && (
        <p className="mt-6 rounded-lg bg-sage p-4 text-sm text-olive">{message}</p>
      )}

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-6 text-sm text-zinc-600 underline"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleGoogleLogin() {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/account` },
    });
  }

  function handleFacebookLogin() {
    supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/account` },
    });
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!email || !password || (mode === "signup" && !name)) {
      setMessage("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          },
        });
        if (error) throw error;
        setMessage("Almost done — check your email to confirm your account, then log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Link this login to any past guest orders under the same email
        // (or create a fresh account row) before heading to /account.
        await fetch("/api/account/sync", { method: "POST" });
        router.push("/account");
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

      <form onSubmit={handleEmailSubmit} className="w-full space-y-4">
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
          disabled={submitting}
          className="w-full rounded-full bg-green-700 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
        >
          {submitting ? "Please wait…" : mode === "login" ? "Log In" : "Sign Up"}
        </button>
      </form>

      {message && (
        <p className="mt-6 rounded-lg bg-sage p-4 text-sm text-olive">{message}</p>
      )}

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage("");
        }}
        className="mt-6 text-sm text-zinc-600 underline"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </main>
  );
}

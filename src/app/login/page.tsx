"use client";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = identifier.includes("@")
      ? await authClient.signIn.email({ email: identifier.trim(), password })
      : await authClient.signIn.username({
          username: identifier.trim(),
          password,
        });
    if (result.error) {
      setError(
        result.error.status === 500
          ? "The server could not complete sign-in. This is usually a database connection problem, not a wrong password."
          : "Username/email or password is incorrect, or this user is inactive.",
      );
      setLoading(false);
      return;
    }
    window.location.href =
      new URLSearchParams(window.location.search).get("next") || "/";
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            M
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            Matariya OMS
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to Order Management
          </p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Username or Email
            <input
              autoFocus
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-600"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-600"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

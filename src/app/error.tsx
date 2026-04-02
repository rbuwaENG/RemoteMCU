"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Navbar />
      <main className="flex flex-center" style={{ minHeight: "calc(100vh - var(--navbar-height) - 200px)" }}>
        <div className="text-center">
          <div style={{ fontSize: "120px", marginBottom: "var(--space-4)" }}>⚠️</div>
          <h1 style={{ fontSize: "var(--display-md)", marginBottom: "var(--space-4)" }}>Oops!</h1>
          <h2 style={{ fontSize: "var(--headline-md)", marginBottom: "var(--space-4)" }}>Something went wrong</h2>
          <p style={{ color: "var(--on-surface-variant)", marginBottom: "var(--space-8)", maxWidth: "400px", margin: "0 auto var(--space-8)" }}>
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <div className="flex gap-4" style={{ justifyContent: "center" }}>
            <button onClick={reset} className="btn btn-primary">
              Try Again
            </button>
            <Link href="/" className="btn btn-secondary">
              Go Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

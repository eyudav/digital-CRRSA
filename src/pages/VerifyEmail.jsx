import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [search] = useSearchParams();
  const [state, setState] = useState({ loading: true, ok: false, message: "" });

  useEffect(() => {
    const token = search.get("token");
    if (!token) {
      setState({ loading: false, ok: false, message: "Verification token is missing." });
      return;
    }
    apiJson(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setState({ loading: false, ok: true, message: "Email verified successfully. You can now sign in." }))
      .catch((e) => setState({ loading: false, ok: false, message: e.message || "Verification failed." }));
  }, [search]);

  return (
    <div className="min-h-screen bg-cream-grad p-6">
      <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-border bg-card p-8 shadow-soft">
        <h1 className="font-display text-2xl font-semibold">Email verification</h1>
        <p className={`mt-3 text-sm ${state.ok ? "text-emerald-700" : "text-muted-foreground"}`}>
          {state.loading ? "Verifying your email..." : state.message}
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

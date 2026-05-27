import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl font-semibold">Email verification</CardTitle>
          <CardDescription>
            {state.loading ? "Verifying your email..." : state.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-2">
          {!state.loading && (
            <Button asChild>
              <Link to="/login">Go to login</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

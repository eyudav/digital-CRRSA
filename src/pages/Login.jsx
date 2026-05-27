import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { apiJson } from "@/lib/api";
const schema = z.object({
    email: z.string().trim().min(1, "Enter a valid email or username").max(255),
    password: z.string().min(8, "At least 8 characters").max(100),
});
const Login = () => {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        if (p.get("verified") === "1") {
            toast({ title: "Email verified", description: "Your account is now verified. Please sign in." });
        }
    }, []);
    const onSubmit = async (e) => {
        e.preventDefault();
        const parsed = schema.safeParse({ email, password });
        if (!parsed.success) {
            const fe = parsed.error.flatten().fieldErrors;
            setErrors({ email: fe.email?.[0], password: fe.password?.[0] });
            return;
        }
        setErrors({});
        setSubmitting(true);
        const res = await login(email, password);
        setSubmitting(false);
        if (!res.ok) {
            toast({ title: "Sign in failed", description: res.message, variant: "destructive" });
            return;
        }
        toast({ title: "Welcome back" });
        const dest = res.user?.role === "super_admin"
            ? "/super-admin"
            : res.user?.role === "admin"
                ? "/staff/admin/users"
                : res.user?.role === "staff"
                    ? "/staff"
                    : "/citizen";
        nav(dest);
    };
    const resendVerification = async () => {
        if (!email.trim()) {
            toast({ title: "Email required", description: "Enter your email first.", variant: "destructive" });
            return;
        }
        setResending(true);
        try {
            const out = await apiJson("/api/auth/resend-verification", {
                method: "POST",
                body: { email },
            });
            toast({ title: "Verification email", description: out?.message || "Verification email sent." });
        }
        catch (e) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        }
        finally {
            setResending(false);
        }
    };
    return (<div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-hero p-12 text-primary-foreground lg:flex">
        <Logo variant="light"/>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Welcome back</p>
          <h1 className="mt-4 max-w-md font-display text-4xl font-semibold leading-tight">Your civil services, organized in one secure place.</h1>
          <p className="mt-4 max-w-md text-primary-foreground/75">Track applications, manage appointments and download certificates without visiting a single office.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
          <ShieldCheck className="h-4 w-4 text-accent"/> Protected by role-based access and audit logging
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-12">
        <Card className="w-full max-w-md border-border shadow-elegant">
          <CardHeader className="space-y-2">
            <div className="mb-4 lg:hidden"><Logo /></div>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight">Sign in</CardTitle>
            <CardDescription className="text-sm">Use your Digital CRRSA account to continue.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="text" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Username or email"/>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
              <Button type="button" variant="outline" onClick={resendVerification} disabled={resending} className="w-full">
                {resending ? "Sending..." : "Resend verification email"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default Login;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
const schema = z.object({
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "At least 8 characters").max(100),
});
const Login = () => {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
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
        const dest = ["staff", "admin", "super_admin"].includes(res.user?.role) ? "/staff" : "/citizen";
        nav(dest);
    };
    const fillDemo = (kind) => {
        setEmail(kind === "citizen" ? "citizen@crrsa.gov" : "staff@crrsa.gov");
        setPassword("demo1234");
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
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-muted-foreground">Use your Digital CRRSA account to continue.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}/>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Sign in</Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Demo accounts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fillDemo("citizen")}>Citizen demo</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillDemo("staff")}>Staff demo</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Password for both: <span className="font-mono">demo1234</span></p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>);
};
export default Login;

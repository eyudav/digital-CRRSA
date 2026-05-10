import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADDIS_SUBCITIES, getWoredasForSubCity } from "@/data/addisLocations";
const schema = z.object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "At least 8 characters").max(100),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    subCity: z.string().trim().min(2, "Select sub-city"),
    woreda: z.string().trim().min(2, "Select woreda"),
    role: z.enum(["citizen", "staff"]),
});
const Register = () => {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", address: "", subCity: "", woreda: "", role: "citizen" });
    const [errors, setErrors] = useState({});
    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const onSubmit = async (e) => {
        e.preventDefault();
        const parsed = schema.safeParse(form);
        if (!parsed.success) {
            const fe = parsed.error.flatten().fieldErrors;
            const e = {};
            Object.entries(fe).forEach(([k, v]) => { if (v?.[0])
                e[k] = v[0]; });
            setErrors(e);
            return;
        }
        setErrors({});
        const d = parsed.data;
        const res = await register({
            fullName: d.fullName,
            email: d.email,
            password: d.password,
            role: d.role,
            phone: d.phone || undefined,
            address: d.address || undefined,
            subCity: d.subCity,
            woreda: d.woreda,
        });
        if (!res.ok) {
            toast({ title: "Registration failed", description: res.message, variant: "destructive" });
            return;
        }
        if (res.verificationRequired) {
            toast({ title: "Verify your email", description: res.message || "Check your email for the verification link." });
            nav("/login");
            return;
        }
        toast({ title: "Account created", description: "Welcome to Digital CRRSA." });
        nav(["staff", "admin", "super_admin"].includes(res.user?.role) ? "/staff" : "/citizen");
    };
    return (<div className="min-h-screen bg-cream-grad">
      <div className="container py-8">
        <Logo />
      </div>
      <div className="container max-w-2xl pb-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant md:p-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Register once to access all civil registration services.</p>

          <form onSubmit={onSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>I am registering as</Label>
              <RadioGroup value={form.role} onValueChange={(v) => update("role", v)} className="grid grid-cols-2 gap-3">
                {["citizen", "staff"].map((r) => (<Label key={r} htmlFor={`role-${r}`} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${form.role === r ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                    <RadioGroupItem id={`role-${r}`} value={r} className="mt-0.5"/>
                    <div>
                      <p className="font-medium capitalize">{r}</p>
                      <p className="text-xs text-muted-foreground">{r === "citizen" ? "Apply for and track services." : "Review applications and issue certificates."}</p>
                    </div>
                  </Label>))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)}/>
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)}/>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)}/>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {form.role === "citizen" && (<>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+251 ..."/>
                </div>
                <div className="space-y-1.5">
                  <Label>Sub-City</Label>
                  <Select value={form.subCity} onValueChange={(v) => setForm((f) => ({ ...f, subCity: v, woreda: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Select sub-city" /></SelectTrigger>
                    <SelectContent>
                      {ADDIS_SUBCITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.subCity && <p className="text-xs text-destructive">{errors.subCity}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Woreda</Label>
                  <Select
                    value={form.woreda}
                    onValueChange={(v) => update("woreda", v)}
                    disabled={!form.subCity}
                  >
                    <SelectTrigger><SelectValue placeholder="Select woreda" /></SelectTrigger>
                    <SelectContent>
                      {getWoredasForSubCity(form.subCity).map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.woreda && <p className="text-xs text-destructive">{errors.woreda}</p>}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)}/>
                </div>
              </>)}

            <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-muted-foreground">By registering you agree to the Digital CRRSA terms of service.</p>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Create account</Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>);
};
export default Register;

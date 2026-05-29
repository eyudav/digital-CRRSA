import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADDIS_SUBCITIES, getWoredasForSubCity } from "@/data/addisLocations";
import { passwordFieldSchema, PASSWORD_HINT } from "@/lib/passwordValidation";

const schema = z.object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: passwordFieldSchema.max(100),
    phone: z.string().trim().min(3, "Phone is required").max(30),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    subCity: z.string().trim().min(2, "Select sub-city"),
    woreda: z.string().trim().min(2, "Select woreda"),
    sex: z.enum(["Male", "Female"], { required_error: "Select sex" }),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    motherName: z.string().trim().min(2, "Mother's name is required").max(100),
    fatherName: z.string().trim().min(2, "Father's name is required").max(100),
    nationality: z.string().trim().min(2, "Nationality is required").max(100),
    residenceIdNumber: z.string().trim().max(100).optional().or(z.literal("")),
});

const Register = () => {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({
        fullName: "", email: "", password: "", phone: "", address: "",
        subCity: "", woreda: "", sex: "", dateOfBirth: "",
        motherName: "", fatherName: "", nationality: "", residenceIdNumber: "",
    });
    const [errors, setErrors] = useState({});
    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const onSubmit = async (e) => {
        e.preventDefault();
        const parsed = schema.safeParse(form);
        if (!parsed.success) {
            const fe = parsed.error.flatten().fieldErrors;
            const e = {};
            Object.entries(fe).forEach(([k, v]) => { if (v?.[0]) e[k] = v[0]; });
            setErrors(e);
            return;
        }
        setErrors({});
        const d = parsed.data;
        const res = await register({
            fullName: d.fullName, email: d.email, password: d.password,
            role: "citizen", phone: d.phone, address: d.address || undefined,
            subCity: d.subCity, woreda: d.woreda, sex: d.sex,
            dateOfBirth: d.dateOfBirth, motherName: d.motherName,
            fatherName: d.fatherName, nationality: d.nationality,
            residenceIdNumber: d.residenceIdNumber || undefined,
        });
        if (!res.ok) {
            if (res.fieldErrors?.length) {
                const next = {};
                res.fieldErrors.forEach(({ path, message }) => {
                    if (path && message) next[path] = message;
                });
                setErrors((prev) => ({ ...prev, ...next }));
            }
            toast({ title: "Registration failed", description: res.message, variant: "destructive" });
            return;
        }
        toast({ title: "Account created", description: "Welcome to Digital CRRSA." });
        nav(["staff", "admin", "super_admin"].includes(res.user?.role) ? "/staff" : "/citizen");
    };

    return (
        <div className="min-h-screen bg-cream-grad">
            <div className="container py-8"><Logo /></div>
            <div className="container max-w-2xl pb-16">
                <Card className="border-border shadow-elegant">
                    <CardHeader className="p-8 pb-0 md:p-10 md:pb-0">
                        <CardTitle className="font-display text-3xl font-semibold tracking-tight">Create your account</CardTitle>
                        <CardDescription className="text-sm">Register once to access all civil registration services.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 md:p-10 pt-4 md:pt-4">

                    <form onSubmit={onSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="fullName">Full name</Label>
                            <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
                            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} />
                            <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
                            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+251 ..." />
                            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="dateOfBirth">Date of birth</Label>
                            <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
                            {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Sex</Label>
                            <Select value={form.sex} onValueChange={(v) => update("sex", v)}>
                                <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="nationality">Nationality</Label>
                            <Input id="nationality" value={form.nationality} onChange={(e) => update("nationality", e.target.value)} />
                            {errors.nationality && <p className="text-xs text-destructive">{errors.nationality}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="fatherName">Father's full name</Label>
                            <Input id="fatherName" value={form.fatherName} onChange={(e) => update("fatherName", e.target.value)} />
                            {errors.fatherName && <p className="text-xs text-destructive">{errors.fatherName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="motherName">Mother's full name</Label>
                            <Input id="motherName" value={form.motherName} onChange={(e) => update("motherName", e.target.value)} />
                            {errors.motherName && <p className="text-xs text-destructive">{errors.motherName}</p>}
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
                            <Select value={form.woreda} onValueChange={(v) => update("woreda", v)} disabled={!form.subCity}>
                                <SelectTrigger><SelectValue placeholder="Select woreda" /></SelectTrigger>
                                <SelectContent>
                                    {getWoredasForSubCity(form.subCity).map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.woreda && <p className="text-xs text-destructive">{errors.woreda}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="residenceIdNumber">Residence ID Number (Optional)</Label>
                            <Input id="residenceIdNumber" value={form.residenceIdNumber} onChange={(e) => update("residenceIdNumber", e.target.value)} placeholder="e.g., ETH-1234-5678 (leave blank if you don't have one)" />
                            {errors.residenceIdNumber && <p className="text-xs text-destructive">{errors.residenceIdNumber}</p>}
                        </div>

                        <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
                            <p className="text-xs text-muted-foreground">By registering you agree to the Digital CRRSA terms of service.</p>
                            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Create account</Button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
                    </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
export default Register;

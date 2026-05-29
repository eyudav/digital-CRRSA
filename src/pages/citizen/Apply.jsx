import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, FileUp, CalendarCheck, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SERVICES, OFFICES } from "@/data/seed";
import { uid } from "@/data/store";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/api";
import { slotLabel } from "@/lib/applicationMap";

const Apply = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const qc = useQueryClient();
    const service = useMemo(() => SERVICES.find((s) => s.slug === slug), [slug]);

    const isIdService = slug === "id-services";

    const [step, setStep] = useState(0);
    const [details, setDetails] = useState({});
    const [errors, setErrors] = useState({});
    
    /** @type {{ id: string, file: File, name: string, sizeKb: number, type: string }[]} */
    const [docs, setDocs] = useState([]);
    const [office, setOffice] = useState(OFFICES[0]);
    const [date, setDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
    const [slotId, setSlotId] = useState(null);

    // Appointment fields
    const [apptFields, setApptFields] = useState({
        courtCaseNumber: "",
        courtDate: "",
        confirmRulingUploaded: false,
        verificationDateTime: "",
        confirmDelayedProof: false,
        confirmNotByProxy: false,
        confirmReturnOldId: false,
        transferReason: "",
        certificatePurpose: "",
        confirmValiditySixMonths: false,
        confirmOathAffidavit: false,
        periodOfStayToConfirm: "",
    });

    // Prefill form details from user profile when page loads
    useEffect(() => {
        if (user) {
            setDetails((prev) => ({
                ...prev,
                // General applicant pre-fills
                applicantName: user.fullName || "",
                applicantSex: user.sex || "",
                applicantDob: user.dateOfBirth || "",
                applicantPhone: user.phone || "",
                applicantEmail: user.email || "",
                applicantAddress: user.address || "",
                applicantNationality: user.nationality || "Ethiopian",
                applicantSubCity: user.subCity || "",
                applicantWoreda: user.woreda || "",
                applicantResidenceIdNo: user.residenceIdNumber || "",
                
                // For ID Service specifically
                fullName: user.fullName || "",
                sex: user.sex || "",
                dateOfBirth: user.dateOfBirth || "",
                motherName: user.motherName || "",
                fatherName: user.fatherName || "",
                phone: user.phone || "",
                email: user.email || "",
                address: user.address || "",
                subCity: user.subCity || "",
                woreda: user.woreda || "",
                nationality: user.nationality || "Ethiopian",
            }));
            if (user.subCity) {
                const matchedOffice = OFFICES.find((o) =>
                    o.toLowerCase().includes(user.subCity.toLowerCase())
                );
                if (matchedOffice) {
                    setOffice(matchedOffice);
                }
            }
        }
    }, [user]);

    const { data: slotRows = [] } = useQuery({
        queryKey: ["appointment-slots", office, date],
        queryFn: () =>
            apiJson(`/api/appointments/available?officeCode=${encodeURIComponent(office)}&date=${date}`),
        enabled: !!office && !!date && step >= 2,
    });

    useEffect(() => {
        if (!slotRows.length) {
            setSlotId(null);
            return;
        }
        setSlotId((prev) => {
            if (prev && slotRows.some((s) => Number(s.id) === Number(prev)))
                return prev;
            return slotRows[0].id;
        });
    }, [slotRows]);

    // Dynamic supporting documents checklist based on form inputs
    const requiredDocs = useMemo(() => {
        if (!service) return [];
        const base = [...service.requiredDocuments];
        
        if (slug === "birth-certificate") {
            if (details.applicantRole === "Guardian" || details.applicantRole === "Proxy") {
                if (!base.includes("Court guardianship document (if proxy)")) {
                    base.push("Court guardianship document (if proxy)");
                }
            }
            if (details.birthRegistrationType === "Delayed") {
                base.push("Institutional birth proof / church letter");
            }
            if (details.isForeignNationalBornInEthiopia === "Yes") {
                base.push("Foreign national birth authorization letter");
            }
            if (details.applicantRole === "Surviving parent") {
                base.push("Death certificate of deceased parent");
            }
        }
        
        if (slug === "marriage-certificate") {
            if (details.groomPreviousMaritalStatus && details.groomPreviousMaritalStatus !== "Single") {
                base.push("Groom divorce decree or former spouse death cert");
            }
            if (details.bridePreviousMaritalStatus && details.bridePreviousMaritalStatus !== "Single") {
                base.push("Bride divorce decree or former spouse death cert");
            }
        }

        if (slug === "divorce-certificate") {
            if (details.applicantRole === "Proxy" || details.applicantRole === "Lawyer") {
                base.push("Legal proxy/lawyer authorization documents");
            }
        }

        if (slug === "death-certificate") {
            if (details.deathRegistrationType === "Delayed") {
                base.push("Institutional proof from church/mosque for delayed death");
            }
            if (details.deathCause === "Accidental") {
                base.push("Police accident investigation report");
            }
        }

        if (slug === "residency-transfer") {
            if (details.hasGovtHousing === "Yes") {
                base.push("Government housing allocation proof");
            }
            if (details.isOldIdLost === "Yes") {
                base.push("Police report for lost residence ID");
            }
        }

        return base;
    }, [service, slug, details]);

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!service)
                throw new Error("Service not found.");
            
            // Collect form data and appointment metadata
            const finalFormData = {
                ...details,
                appointmentMetadata: { ...apptFields }
            };

            const created = await apiJson("/api/applications", {
                method: "POST",
                body: {
                    serviceType: service.name,
                    officeCode: office,
                    formData: finalFormData,
                },
            });
            const appId = created.id;

            if (docs.length) {
                const fd = new FormData();
                docs.forEach((d) => fd.append("documents", d.file));
                await apiJson(`/api/applications/${appId}/documents`, { method: "POST", body: fd });
            }

            if (!slotId)
                throw new Error("Choose an available time slot.");
            
            await apiJson("/api/appointments", {
                method: "POST",
                body: {
                    applicationId: Number(appId),
                    slotId: Number(slotId),
                    officeCode: office,
                },
            });
            return appId;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["applications", "my", user?.id] });
            qc.invalidateQueries({ queryKey: ["staff", "applications"] });
            toast({ title: "Application submitted successfully." });
            navigate("/citizen/applications");
        },
        onError: (e) => toast({ title: "Submission failed", description: e.message, variant: "destructive" }),
    });

    const steps = ["Service details", "Upload documents", "Appointment", "Review & submit"];

    const validateDetails = () => {
        const empties = {};
        
        // Custom validations based on service slug
        if (slug === "birth-certificate") {
            if (!details.applicantRole) empties.applicantRole = "Required";
            if (!details.childFullName) empties.childFullName = "Required";
            if (!details.childSex) empties.childSex = "Required";
            if (!details.childDob) empties.childDob = "Required";
            if (!details.childPlaceOfBirth) empties.childPlaceOfBirth = "Required";
            if (!details.motherFullName) empties.motherFullName = "Required";
            // mother's and father's phone numbers required and must match +251 format
            if (!details.motherPhoneNumber) {
                empties.motherPhoneNumber = "Required";
            } else {
                const p = String(details.motherPhoneNumber).replace(/\s+/g, "");
                if (!/^\+251\d{9}$/.test(p)) empties.motherPhoneNumber = "Invalid phone format (+251...)";
            }
            if (!details.fatherPhoneNumber) {
                empties.fatherPhoneNumber = "Required";
            } else {
                const p2 = String(details.fatherPhoneNumber).replace(/\s+/g, "");
                if (!/^\+251\d{9}$/.test(p2)) empties.fatherPhoneNumber = "Invalid phone format (+251...)";
            }
            if (!details.fatherFullName) empties.fatherFullName = "Required";
            if ((details.applicantRole === "Guardian" || details.applicantRole === "Proxy") && !details.guardianDocNo) {
                empties.guardianDocNo = "Required for guardian/proxy";
            }
        } else if (slug === "marriage-certificate") {
            if (!details.groomFullName) empties.groomFullName = "Required";
            if (!details.groomDob) empties.groomDob = "Required";
            if (!details.brideFullName) empties.brideFullName = "Required";
            if (!details.brideDob) empties.brideDob = "Required";
            if (!details.marriageType) empties.marriageType = "Required";
            if (!details.proposedWeddingDate) empties.proposedWeddingDate = "Required";
        } else if (slug === "divorce-certificate") {
            if (!details.applicantRole) empties.applicantRole = "Required";
            if (!details.spouseOneFullName) empties.spouseOneFullName = "Required";
            if (!details.spouseTwoFullName) empties.spouseTwoFullName = "Required";
            if (!details.marriageCertNumber) empties.marriageCertNumber = "Required";
            if (!details.divorceReasonCode) empties.divorceReasonCode = "Required";
        } else if (slug === "death-certificate") {
            if (!details.applicantRelation) empties.applicantRelation = "Required";
            if (!details.deceasedFullName) empties.deceasedFullName = "Required";
            if (!details.deceasedSex) empties.deceasedSex = "Required";
            if (!details.dateOfDeath) empties.dateOfDeath = "Required";
            if (!details.placeOfDeath) empties.placeOfDeath = "Required";
        } else if (slug === "id-services") {
            if (!details.fullName) empties.fullName = "Required";
            if (!details.sex) empties.sex = "Required";
            if (!details.dateOfBirth) empties.dateOfBirth = "Required";
            if (!details.motherName) empties.motherName = "Required";
            if (!details.fatherName) empties.fatherName = "Required";
            if (!details.kebele) empties.kebele = "Required";
            if (!details.houseNumber) empties.houseNumber = "Required";
            if (!details.yearsLivedAtAddress) empties.yearsLivedAtAddress = "Required";
            // residenceForm001No removed per requirements
        } else if (slug === "residency-transfer") {
            if (!details.currentAddress) empties.currentAddress = "Required";
            if (!details.newAddress) empties.newAddress = "Required";
            if (!details.transferReason) empties.transferReason = "Required";
            if (!details.familyRecordNo) empties.familyRecordNo = "Required";
        } else if (slug === "certificate-of-no-impediment") {
            if (!details.durationOfResidency) empties.durationOfResidency = "Required";
            if (!details.maritalStatusDecl) empties.maritalStatusDecl = "Required";
            if (!details.certificatePurpose) empties.certificatePurpose = "Required";
        } else if (slug === "residency-proof-letter") {
            if (!details.familyFormNo) empties.familyFormNo = "Required";
            if (!details.durationOfStay) empties.durationOfStay = "Required";
            if (!details.verificationPurpose) empties.verificationPurpose = "Required";
        }

        setErrors(empties);
        return Object.keys(empties).length === 0;
    };

    const validateAppointment = () => {
        const empties = {};
        if (slug === "divorce-certificate") {
            if (!apptFields.courtCaseNumber.trim()) empties.courtCaseNumber = "Required";
            if (!apptFields.courtDate) empties.courtDate = "Required";
            if (!apptFields.confirmRulingUploaded) empties.confirmRulingUploaded = "Must upload ruling & confirm";
        }
        if (slug === "death-certificate") {
            if (details.deathRegistrationType === "Delayed" && !apptFields.confirmDelayedProof) {
                empties.confirmDelayedProof = "Delayed registration requires checking this box";
            }
        }
        if (slug === "id-services") {
            if (!apptFields.confirmNotByProxy) empties.confirmNotByProxy = "Must confirm in-person attendance";
        }
        if (slug === "residency-transfer") {
            if (!apptFields.transferReason.trim()) empties.transferReason = "Required";
            if (!apptFields.confirmReturnOldId) empties.confirmReturnOldId = "Must agree to return old ID";
        }
        if (slug === "certificate-of-no-impediment") {
            if (!apptFields.certificatePurpose.trim()) empties.certificatePurpose = "Required";
            if (!apptFields.confirmValiditySixMonths) empties.confirmValiditySixMonths = "Must acknowledge 6-month validity";
            if (!apptFields.confirmOathAffidavit) empties.confirmOathAffidavit = "Must confirm affidavit oath";
        }
        if (slug === "residency-proof-letter") {
            if (!apptFields.periodOfStayToConfirm.trim()) empties.periodOfStayToConfirm = "Required";
        }

        setErrors(empties);
        return Object.keys(empties).length === 0;
    };

    const onFiles = (files) => {
        if (!files) return;
        const next = [];
        Array.from(files).forEach((f) => {
            if (f.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", description: `${f.name} exceeds 5 MB.`, variant: "destructive" });
                return;
            }
            const allowed = ["image/jpeg", "image/png", "application/pdf"];
            if (!allowed.includes(f.type)) {
                toast({ title: "Unsupported type", description: `${f.name} must be JPG, PNG or PDF.`, variant: "destructive" });
                return;
            }
            next.push({
                id: uid("doc"),
                file: f,
                name: f.name,
                sizeKb: Math.round(f.size / 1024),
                type: f.type,
            });
        });
        setDocs((d) => [...d, ...next]);
    };

    const onSubmit = () => { submitMutation.mutate(); };
    const next = () => {
        if (step === 0 && !validateDetails()) {
            toast({ title: "Validation Error", description: "Please enter all required form fields.", variant: "destructive" });
            return;
        }
        if (step === 2) {
            if (!validateAppointment()) {
                toast({ title: "Appointment Details Required", description: "Please complete the mandatory scheduling fields.", variant: "destructive" });
                return;
            }
            if (!slotRows.length || !slotId) {
                toast({ title: "No slots available", description: "Pick another office or date.", variant: "destructive" });
                return;
            }
        }
        setStep((s) => Math.min(3, s + 1));
    };

    const selectedSlot = slotRows.find((s) => Number(s.id) === Number(slotId));
    const slotDisplay = selectedSlot ? slotLabel(selectedSlot) : "—";

    if (!service)
        return <p>Service not found. <Link to="/citizen/services" className="text-primary underline">Back to services</Link></p>;


    return (<>
      <PageHeader eyebrow={service.category} title={`Apply: ${service.name}`} description={service.description}/>

      <ol className="mb-8 flex flex-wrap gap-3">
        {steps.map((label, i) => (<li key={label} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium", i < step ? "border-success/40 bg-success/10 text-success" : i === step ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-background/20 text-[10px]">{i < step ? <Check className="h-3 w-3"/> : i + 1}</span>
            {label}
          </li>))}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
        
        {/* STEP 0: DETAILS FORMS */}
        {step === 0 && (
            <div className="space-y-8">
                {/* Prefill informational paragraph removed; prefill logic remains */}

                {/* BIRTH REGISTRATION FORM */}
                {slug === "birth-certificate" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 border-b border-border pb-3">
                            <h3 className="font-display font-semibold text-lg">1. Applicant Relationship Info</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="applicantRole">Who is applying?</Label>
                            <Select value={details.applicantRole || ""} onValueChange={(v) => setDetails({ ...details, applicantRole: v })}>
                                <SelectTrigger><SelectValue placeholder="Select applicant relationship" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Parent">Parent</SelectItem>
                                    <SelectItem value="Surviving parent">Surviving parent</SelectItem>
                                    <SelectItem value="Guardian">Guardian / Caregiver</SelectItem>
                                    <SelectItem value="Proxy">Authorized Legal Proxy</SelectItem>
                                    <SelectItem value="Self">The Applicant themselves (18+)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.applicantRole && <p className="text-xs text-destructive">{errors.applicantRole}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="birthRegistrationType">Registration Timing</Label>
                            <Select value={details.birthRegistrationType || "Normal"} onValueChange={(v) => setDetails({ ...details, birthRegistrationType: v })}>
                                <SelectTrigger><SelectValue placeholder="Select timing" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Normal">Normal Registration (Within 90 days)</SelectItem>
                                    <SelectItem value="Delayed">Delayed Registration (After 90 days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Guardian / Proxy Section */}
                        {["Guardian", "Proxy"].includes(details.applicantRole) && (
                            <div className="md:col-span-2 grid gap-6 md:grid-cols-2 bg-secondary/20 p-5 rounded-2xl border border-border">
                                <div className="md:col-span-2 border-b border-border/60 pb-1">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Proxy / Guardian Credentials</h4>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="guardianName">Guardian/Proxy Full Name</Label>
                                    <Input id="guardianName" value={details.guardianName || ""} onChange={(e) => setDetails({ ...details, guardianName: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="guardianDocNo">Guardianship / Proxy Document Number</Label>
                                    <Input id="guardianDocNo" value={details.guardianDocNo || ""} onChange={(e) => setDetails({ ...details, guardianDocNo: e.target.value })} placeholder="e.g. CRT-990-21" />
                                    {errors.guardianDocNo && <p className="text-xs text-destructive">{errors.guardianDocNo}</p>}
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 border-b border-border pb-3 pt-4">
                            <h3 className="font-display font-semibold text-lg">2. Child Details (Civil Record Info)</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="childFullName">Child's Full Name (Including Grandfather)</Label>
                            <Input id="childFullName" value={details.childFullName || ""} onChange={(e) => setDetails({ ...details, childFullName: e.target.value })} />
                            {errors.childFullName && <p className="text-xs text-destructive">{errors.childFullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Child Sex</Label>
                            <Select value={details.childSex || ""} onValueChange={(v) => setDetails({ ...details, childSex: v })}>
                                <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.childSex && <p className="text-xs text-destructive">{errors.childSex}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="childDob">Child Birth Date & Time</Label>
                            <Input id="childDob" type="datetime-local" value={details.childDob || ""} onChange={(e) => setDetails({ ...details, childDob: e.target.value })} />
                            {errors.childDob && <p className="text-xs text-destructive">{errors.childDob}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="childPlaceOfBirth">Place of Birth (City / Region)</Label>
                            <Input id="childPlaceOfBirth" value={details.childPlaceOfBirth || ""} onChange={(e) => setDetails({ ...details, childPlaceOfBirth: e.target.value })} />
                            {errors.childPlaceOfBirth && <p className="text-xs text-destructive">{errors.childPlaceOfBirth}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="hospitalBirthName">Hospital / Health Facility Name</Label>
                            <Input id="hospitalBirthName" value={details.hospitalBirthName || ""} onChange={(e) => setDetails({ ...details, hospitalBirthName: e.target.value })} placeholder="e.g. Black Lion Hospital" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="birthOrder">Birth Order (e.g. 1st, 2nd child)</Label>
                            <Input id="birthOrder" value={details.birthOrder || ""} onChange={(e) => setDetails({ ...details, birthOrder: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Is Child a Foreign National Born in Ethiopia?</Label>
                            <Select value={details.isForeignNationalBornInEthiopia || "No"} onValueChange={(v) => setDetails({ ...details, isForeignNationalBornInEthiopia: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="No">No (Citizen)</SelectItem>
                                    <SelectItem value="Yes">Yes (Foreign National)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2 border-b border-border pb-3 pt-4">
                            <h3 className="font-display font-semibold text-lg">3. Parents Info</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="motherFullName">Mother's Full Name</Label>
                            <Input id="motherFullName" value={details.motherFullName || ""} onChange={(e) => setDetails({ ...details, motherFullName: e.target.value })} />
                            {errors.motherFullName && <p className="text-xs text-destructive">{errors.motherFullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="motherPhoneNumber">Mother's Phone Number</Label>
                            <Input id="motherPhoneNumber" value={details.motherPhoneNumber || ""} onChange={(e) => setDetails({ ...details, motherPhoneNumber: e.target.value })} placeholder="+251 ..." />
                            {errors.motherPhoneNumber && <p className="text-xs text-destructive">{errors.motherPhoneNumber}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="fatherFullName">Father's Full Name</Label>
                            <Input id="fatherFullName" value={details.fatherFullName || ""} onChange={(e) => setDetails({ ...details, fatherFullName: e.target.value })} />
                            {errors.fatherFullName && <p className="text-xs text-destructive">{errors.fatherFullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="fatherPhoneNumber">Father's Phone Number</Label>
                            <Input id="fatherPhoneNumber" value={details.fatherPhoneNumber || ""} onChange={(e) => setDetails({ ...details, fatherPhoneNumber: e.target.value })} placeholder="+251 ..." />
                            {errors.fatherPhoneNumber && <p className="text-xs text-destructive">{errors.fatherPhoneNumber}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="parentsMaritalStatus">Parents Marital Status</Label>
                            <Select value={details.parentsMaritalStatus || "Married"} onValueChange={(v) => setDetails({ ...details, parentsMaritalStatus: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Married">Married</SelectItem>
                                    <SelectItem value="Divorced">Divorced</SelectItem>
                                    <SelectItem value="Widowed">Widowed</SelectItem>
                                    <SelectItem value="Single">Single</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* MARRIAGE REGISTRATION FORM */}
                {slug === "marriage-certificate" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 border-b border-border pb-3">
                            <h3 className="font-display font-semibold text-lg">1. Groom Info</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="groomFullName">Groom Full Name</Label>
                            <Input id="groomFullName" value={details.groomFullName || ""} onChange={(e) => setDetails({ ...details, groomFullName: e.target.value })} />
                            {errors.groomFullName && <p className="text-xs text-destructive">{errors.groomFullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="groomDob">Groom Date of Birth</Label>
                            <Input id="groomDob" type="date" value={details.groomDob || ""} onChange={(e) => setDetails({ ...details, groomDob: e.target.value })} />
                            {errors.groomDob && <p className="text-xs text-destructive">{errors.groomDob}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="groomFatherName">Groom Father Name</Label>
                            <Input id="groomFatherName" value={details.groomFatherName || ""} onChange={(e) => setDetails({ ...details, groomFatherName: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="groomMotherName">Groom Mother Name</Label>
                            <Input id="groomMotherName" value={details.groomMotherName || ""} onChange={(e) => setDetails({ ...details, groomMotherName: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="groomIdNumber">Groom Residence ID Number</Label>
                            <Input id="groomIdNumber" value={details.groomIdNumber || ""} onChange={(e) => setDetails({ ...details, groomIdNumber: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Groom Previous Marital Status</Label>
                            <Select value={details.groomPreviousMaritalStatus || "Single"} onValueChange={(v) => setDetails({ ...details, groomPreviousMaritalStatus: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Single">Single</SelectItem>
                                    <SelectItem value="Divorced">Divorced</SelectItem>
                                    <SelectItem value="Widowed">Widowed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2 border-b border-border pb-3 pt-4">
                            <h3 className="font-display font-semibold text-lg">2. Bride Info</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="brideFullName">Bride Full Name</Label>
                            <Input id="brideFullName" value={details.brideFullName || ""} onChange={(e) => setDetails({ ...details, brideFullName: e.target.value })} />
                            {errors.brideFullName && <p className="text-xs text-destructive">{errors.brideFullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="brideDob">Bride Date of Birth</Label>
                            <Input id="brideDob" type="date" value={details.brideDob || ""} onChange={(e) => setDetails({ ...details, brideDob: e.target.value })} />
                            {errors.brideDob && <p className="text-xs text-destructive">{errors.brideDob}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="brideFatherName">Bride Father Name</Label>
                            <Input id="brideFatherName" value={details.brideFatherName || ""} onChange={(e) => setDetails({ ...details, brideFatherName: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="brideMotherName">Bride Mother Name</Label>
                            <Input id="brideMotherName" value={details.brideMotherName || ""} onChange={(e) => setDetails({ ...details, brideMotherName: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="brideIdNumber">Bride Residence ID Number</Label>
                            <Input id="brideIdNumber" value={details.brideIdNumber || ""} onChange={(e) => setDetails({ ...details, brideIdNumber: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Bride Previous Marital Status</Label>
                            <Select value={details.bridePreviousMaritalStatus || "Single"} onValueChange={(v) => setDetails({ ...details, bridePreviousMaritalStatus: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Single">Single</SelectItem>
                                    <SelectItem value="Divorced">Divorced</SelectItem>
                                    <SelectItem value="Widowed">Widowed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2 border-b border-border pb-3 pt-4">
                            <h3 className="font-display font-semibold text-lg">3. Marriage Arrangement Details</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Marriage Ceremony Type</Label>
                            <Select value={details.marriageType || ""} onValueChange={(v) => setDetails({ ...details, marriageType: v })}>
                                <SelectTrigger><SelectValue placeholder="Select ceremony type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Civil">Civil Registration Ceremony</SelectItem>
                                    <SelectItem value="Religious">Religious Ceremony</SelectItem>
                                    <SelectItem value="Traditional">Traditional / Customary Ceremony</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.marriageType && <p className="text-xs text-destructive">{errors.marriageType}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="proposedWeddingDate">Proposed Wedding Date</Label>
                            <Input id="proposedWeddingDate" type="date" value={details.proposedWeddingDate || ""} onChange={(e) => setDetails({ ...details, proposedWeddingDate: e.target.value })} />
                            {errors.proposedWeddingDate && <p className="text-xs text-destructive">{errors.proposedWeddingDate}</p>}
                        </div>
                    </div>
                )}

                {/* DIVORCE REGISTRATION FORM */}
                {slug === "divorce-certificate" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 border-b border-border pb-3">
                            <h3 className="font-display font-semibold text-lg">1. Applicant Identity & Role</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="applicantRole">Applicant Role</Label>
                            <Select value={details.applicantRole || ""} onValueChange={(v) => setDetails({ ...details, applicantRole: v })}>
                                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Husband">Husband</SelectItem>
                                    <SelectItem value="Wife">Wife</SelectItem>
                                    <SelectItem value="Proxy">Authorized Proxy Representative</SelectItem>
                                    <SelectItem value="Lawyer">Legal Council / Attorney</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.applicantRole && <p className="text-xs text-destructive">{errors.applicantRole}</p>}
                        </div>

                        {["Proxy", "Lawyer"].includes(details.applicantRole) && (
                            <div className="space-y-1.5">
                                <Label htmlFor="repAuthorizationDoc">Representative Power of Attorney Doc No</Label>
                                <Input id="repAuthorizationDoc" value={details.repAuthorizationDoc || ""} onChange={(e) => setDetails({ ...details, repAuthorizationDoc: e.target.value })} placeholder="e.g. POA-8721-AA" />
                            </div>
                        )}

                        <div className="md:col-span-2 border-b border-border pb-3 pt-4">
                            <h3 className="font-display font-semibold text-lg">2. Spouse Registration Profiles</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="spouseOneFullName">Spouse 1 (Husband) Full Name</Label>
                            <Input id="spouseOneFullName" value={details.spouseOneFullName || ""} onChange={(e) => setDetails({ ...details, spouseOneFullName: e.target.value })} />
                            {errors.spouseOneFullName && <p className="text-xs text-destructive">{errors.spouseOneFullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="spouseTwoFullName">Spouse 2 (Wife) Full Name</Label>
                            <Input id="spouseTwoFullName" value={details.spouseTwoFullName || ""} onChange={(e) => setDetails({ ...details, spouseTwoFullName: e.target.value })} />
                            {errors.spouseTwoFullName && <p className="text-xs text-destructive">{errors.spouseTwoFullName}</p>}
                        </div>

                        <div className="md:col-span-2 border-b border-border pb-3 pt-4">
                            <h3 className="font-display font-semibold text-lg">3. Marriage & Dissolution Details</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="marriageCertNumber">Original Marriage Certificate Number</Label>
                            <Input id="marriageCertNumber" value={details.marriageCertNumber || ""} onChange={(e) => setDetails({ ...details, marriageCertNumber: e.target.value })} placeholder="e.g. MC-990-20" />
                            {errors.marriageCertNumber && <p className="text-xs text-destructive">{errors.marriageCertNumber}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="marriageDate">Original Wedding Date</Label>
                            <Input id="marriageDate" type="date" value={details.marriageDate || ""} onChange={(e) => setDetails({ ...details, marriageDate: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Divorce Authority Type</Label>
                            <Select value={details.divorceType || "Court"} onValueChange={(v) => setDetails({ ...details, divorceType: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Court">Federal / Regional Court Decree</SelectItem>
                                    <SelectItem value="Administrative">Administrative Registry Update</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="divorceReasonCode">Court Ruling / Reference Number</Label>
                            <Input id="divorceReasonCode" value={details.divorceReasonCode || ""} onChange={(e) => setDetails({ ...details, divorceReasonCode: e.target.value })} placeholder="e.g. CIV-CASE-992-05" />
                            {errors.divorceReasonCode && <p className="text-xs text-destructive">{errors.divorceReasonCode}</p>}
                        </div>
                    </div>
                )}

                {/* DEATH REGISTRATION FORM */}
                {slug === "death-certificate" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 border-b border-border pb-3">
                            <h3 className="font-display font-semibold text-lg">1. Informant / Applicant Relationship</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="applicantRelation">Your Relationship to Deceased</Label>
                            <Select value={details.applicantRelation || ""} onValueChange={(v) => setDetails({ ...details, applicantRelation: v })}>
                                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Relative">Relative / Family Member</SelectItem>
                                    <SelectItem value="Cohabitant">Co-habitant (Lived in same house)</SelectItem>
                                    <SelectItem value="Neighbor">Nearest Neighbor</SelectItem>
                                    <SelectItem value="InstitutionHead">Head of Burying Institution</SelectItem>
                                    <SelectItem value="Police">Police officer / Accident Authority</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.applicantRelation && <p className="text-xs text-destructive">{errors.applicantRelation}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Registration Type</Label>
                            <Select value={details.deathRegistrationType || "Normal"} onValueChange={(v) => setDetails({ ...details, deathRegistrationType: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Normal">Normal Registration (Within 30 days)</SelectItem>
                                    <SelectItem value="Delayed">Delayed Registration (After 30 days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2 border-b border-border pb-3 pt-4">
                            <h3 className="font-display font-semibold text-lg">2. Deceased Profile</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="deceasedFullName">Deceased Full Name</Label>
                            <Input id="deceasedFullName" value={details.deceasedFullName || ""} onChange={(e) => setDetails({ ...details, deceasedFullName: e.target.value })} />
                            {errors.deceasedFullName && <p className="text-xs text-destructive">{errors.deceasedFullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Deceased Sex</Label>
                            <Select value={details.deceasedSex || ""} onValueChange={(v) => setDetails({ ...details, deceasedSex: v })}>
                                <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.deceasedSex && <p className="text-xs text-destructive">{errors.deceasedSex}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="deceasedDob">Deceased Date of Birth</Label>
                            <Input id="deceasedDob" type="date" value={details.deceasedDob || ""} onChange={(e) => setDetails({ ...details, deceasedDob: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="deceasedAge">Deceased Age at Death</Label>
                            <Input id="deceasedAge" type="number" value={details.deceasedAge || ""} onChange={(e) => setDetails({ ...details, deceasedAge: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="dateOfDeath">Date & Time of Death</Label>
                            <Input id="dateOfDeath" type="datetime-local" value={details.dateOfDeath || ""} onChange={(e) => setDetails({ ...details, dateOfDeath: e.target.value })} />
                            {errors.dateOfDeath && <p className="text-xs text-destructive">{errors.dateOfDeath}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="placeOfDeath">Place of Death (City / Facility)</Label>
                            <Input id="placeOfDeath" value={details.placeOfDeath || ""} onChange={(e) => setDetails({ ...details, placeOfDeath: e.target.value })} />
                            {errors.placeOfDeath && <p className="text-xs text-destructive">{errors.placeOfDeath}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Cause of Death</Label>
                            <Select value={details.deathCause || "Natural"} onValueChange={(v) => setDetails({ ...details, deathCause: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Natural">Natural Causes</SelectItem>
                                    <SelectItem value="Illness">Illness / Disease</SelectItem>
                                    <SelectItem value="Accidental">Accident / Non-Natural</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="burialPlace">Burial Cemetery / Place</Label>
                            <Input id="burialPlace" value={details.burialPlace || ""} onChange={(e) => setDetails({ ...details, burialPlace: e.target.value })} placeholder="e.g. Holy Trinity Cemetery" />
                        </div>
                    </div>
                )}

                {/* RESIDENCE ID SERVICE FORM */}
                {slug === "id-services" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 border-b border-border pb-3">
                            <h3 className="font-display font-semibold text-lg">1. Basic Identity Credentials (Locked)</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Full Name</Label>
                            <Input value={details.fullName || ""} disabled className="bg-muted font-medium" />
                            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Sex</Label>
                            <Input value={details.sex || ""} disabled className="bg-muted" />
                            {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date of Birth</Label>
                            <Input value={details.dateOfBirth || ""} disabled className="bg-muted" />
                            {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Mother's Name</Label>
                            <Input value={details.motherName || ""} disabled className="bg-muted" />
                            {errors.motherName && <p className="text-xs text-destructive">{errors.motherName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Father's Name</Label>
                            <Input value={details.fatherName || ""} disabled className="bg-muted" />
                            {errors.fatherName && <p className="text-xs text-destructive">{errors.fatherName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Sub-City</Label>
                            <Input value={details.subCity || ""} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Woreda</Label>
                            <Input value={details.woreda || ""} disabled className="bg-muted" />
                        </div>

                        <div className="md:col-span-2 border-b border-border pb-3 pt-4">
                            <h3 className="font-display font-semibold text-lg">2. Household Address registration</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="kebele">Kebele</Label>
                            <Input id="kebele" value={details.kebele || ""} onChange={(e) => setDetails({ ...details, kebele: e.target.value })} />
                            {errors.kebele && <p className="text-xs text-destructive">{errors.kebele}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="houseNumber">House Number</Label>
                            <Input id="houseNumber" value={details.houseNumber || ""} onChange={(e) => setDetails({ ...details, houseNumber: e.target.value })} />
                            {errors.houseNumber && <p className="text-xs text-destructive">{errors.houseNumber}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="yearsLivedAtAddress">Years Lived at Current Address</Label>
                            <Input id="yearsLivedAtAddress" type="number" value={details.yearsLivedAtAddress || ""} onChange={(e) => setDetails({ ...details, yearsLivedAtAddress: e.target.value })} />
                            {errors.yearsLivedAtAddress && <p className="text-xs text-destructive">{errors.yearsLivedAtAddress}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="residenceForm001No">Residence Registration Form No. (Form 001)</Label>
                            <Input id="residenceForm001No" value={details.residenceForm001No || ""} onChange={(e) => setDetails({ ...details, residenceForm001No: e.target.value })} placeholder="e.g. FORM-001-9921" />
                            {errors.residenceForm001No && <p className="text-xs text-destructive">{errors.residenceForm001No}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="occupation">Occupation / Job Title</Label>
                            <Input id="occupation" value={details.occupation || ""} onChange={(e) => setDetails({ ...details, occupation: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="householdFile">Household File Reference Name</Label>
                            <Input id="householdFile" value={details.householdFile || ""} onChange={(e) => setDetails({ ...details, householdFile: e.target.value })} placeholder="e.g. Mekonnen Family File" />
                        </div>
                    </div>
                )}

                {/* RESIDENCY TRANSFER FORM */}
                {slug === "residency-transfer" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 border-b border-border pb-3">
                            <h3 className="font-display font-semibold text-lg">1. Address Transfer Specification</h3>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="currentAddress">Current Residence Address (Registered)</Label>
                            <Input id="currentAddress" value={details.currentAddress || ""} onChange={(e) => setDetails({ ...details, currentAddress: e.target.value })} />
                            {errors.currentAddress && <p className="text-xs text-destructive">{errors.currentAddress}</p>}
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="newAddress">New Residence Address (Destination)</Label>
                            <Input id="newAddress" value={details.newAddress || ""} onChange={(e) => setDetails({ ...details, newAddress: e.target.value })} placeholder="e.g. Bole Sub-City, Woreda 03, Kebele 02, House 889" />
                            {errors.newAddress && <p className="text-xs text-destructive">{errors.newAddress}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="transferReason">Reason for Transfer</Label>
                            <Input id="transferReason" value={details.transferReason || ""} onChange={(e) => setDetails({ ...details, transferReason: e.target.value })} placeholder="e.g. Employment relocation, house purchase" />
                            {errors.transferReason && <p className="text-xs text-destructive">{errors.transferReason}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="familyRecordNo">Family Record Book Number</Label>
                            <Input id="familyRecordNo" value={details.familyRecordNo || ""} onChange={(e) => setDetails({ ...details, familyRecordNo: e.target.value })} placeholder="e.g. FR-9921-22" />
                            {errors.familyRecordNo && <p className="text-xs text-destructive">{errors.familyRecordNo}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Is the old ID lost?</Label>
                            <Select value={details.isOldIdLost || "No"} onValueChange={(v) => setDetails({ ...details, isOldIdLost: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="No">No (Still in possession)</SelectItem>
                                    <SelectItem value="Yes">Yes (Lost)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Moving into Government Allocated Housing?</Label>
                            <Select value={details.hasGovtHousing || "No"} onValueChange={(v) => setDetails({ ...details, hasGovtHousing: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="No">No (Private / Lease)</SelectItem>
                                    <SelectItem value="Yes">Yes (Government Housing)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="householdMembersIncluded">List Household Members Transferring Together</Label>
                            <Textarea id="householdMembersIncluded" value={details.householdMembersIncluded || ""} onChange={(e) => setDetails({ ...details, householdMembersIncluded: e.target.value })} placeholder="Enter names, DOBs, and ID numbers of family members moving together (if any)..." />
                        </div>
                    </div>
                )}

                {/* NON-MARITAL (SINGLE STATUS) CERTIFICATE FORM */}
                {slug === "certificate-of-no-impediment" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 border-b border-border pb-3">
                            <h3 className="font-display font-semibold text-lg">1. Residency & Marital Declaration</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="durationOfResidency">Duration of Stay at Current Residence</Label>
                            <Input id="durationOfResidency" value={details.durationOfResidency || ""} onChange={(e) => setDetails({ ...details, durationOfResidency: e.target.value })} placeholder="e.g. 5 Years" />
                            {errors.durationOfResidency && <p className="text-xs text-destructive">{errors.durationOfResidency}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Marital Status Declared</Label>
                            <Select value={details.maritalStatusDecl || "Single"} onValueChange={(v) => setDetails({ ...details, maritalStatusDecl: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Single">Single (Never Married)</SelectItem>
                                    <SelectItem value="Divorced">Divorced</SelectItem>
                                    <SelectItem value="Widowed">Widowed</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.maritalStatusDecl && <p className="text-xs text-destructive">{errors.maritalStatusDecl}</p>}
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="certificatePurpose">Purpose of Single Status Certificate</Label>
                            <Input id="certificatePurpose" value={details.certificatePurpose || ""} onChange={(e) => setDetails({ ...details, certificatePurpose: e.target.value })} placeholder="e.g. Marriage Registration Abroad, Foreign Visa Request" />
                            {errors.certificatePurpose && <p className="text-xs text-destructive">{errors.certificatePurpose}</p>}
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="swornDeclarationText">Sworn Personal Declaration / Affidavit Note</Label>
                            <Textarea id="swornDeclarationText" rows={3} value={details.swornDeclarationText || ""} onChange={(e) => setDetails({ ...details, swornDeclarationText: e.target.value })} placeholder="Write your sworn affidavit statement here..." />
                        </div>
                    </div>
                )}

                {/* RESIDENCY VERIFICATION LETTER FORM */}
                {slug === "residency-proof-letter" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 border-b border-border pb-3">
                            <h3 className="font-display font-semibold text-lg">1. Residence Record Details</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="familyFormNo">Family Form Registration Book Reference No.</Label>
                            <Input id="familyFormNo" value={details.familyFormNo || ""} onChange={(e) => setDetails({ ...details, familyFormNo: e.target.value })} placeholder="e.g. FAM-8821" />
                            {errors.familyFormNo && <p className="text-xs text-destructive">{errors.familyFormNo}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="durationOfStay">Duration of Stay at Current Location</Label>
                            <Input id="durationOfStay" value={details.durationOfStay || ""} onChange={(e) => setDetails({ ...details, durationOfStay: e.target.value })} placeholder="e.g. 10 Years" />
                            {errors.durationOfStay && <p className="text-xs text-destructive">{errors.durationOfStay}</p>}
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="verificationPurpose">Purpose of Verification Letter</Label>
                            <Input id="verificationPurpose" value={details.verificationPurpose || ""} onChange={(e) => setDetails({ ...details, verificationPurpose: e.target.value })} placeholder="e.g. Bank Account Opening, Passport Request, Educational Registration" />
                            {errors.verificationPurpose && <p className="text-xs text-destructive">{errors.verificationPurpose}</p>}
                        </div>
                    </div>
                )}

                {/* Core identity prefill verification card removed (UI only). Prefill/population remains. */}
            </div>
        )}

        {/* STEP 1: UPLOAD DOCUMENTS */}
        {step === 1 && (<div>
            <h3 className="font-display text-lg font-semibold">Upload supporting documents</h3>
            <p className="mt-1 text-sm text-muted-foreground">The following documents are dynamically required based on your form selections. JPG, PNG or PDF. Max 5 MB each.</p>
            
            {/* DYNAMIC CHECKLIST DISPLAY */}
            <div className="my-5 p-4 rounded-xl bg-primary/5 border border-primary/15 text-xs">
                <span className="font-semibold text-primary uppercase tracking-wider block mb-2">Required Checklist:</span>
                <ul className="space-y-1.5 list-disc pl-4 text-muted-foreground">
                    {requiredDocs.map((docName) => (
                        <li key={docName} className="font-medium text-foreground">{docName}</li>
                    ))}
                </ul>
            </div>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center transition-colors hover:border-primary hover:bg-secondary/50">
              <FileUp className="h-6 w-6 text-primary"/>
              <p className="mt-2 font-medium">Click to upload or drag and drop</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Multiple files supported</p>
              <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => onFiles(e.target.files)}/>
            </label>
            
            {docs.length > 0 && (<ul className="mt-5 divide-y divide-border rounded-xl border border-border">
                {docs.map((d) => (<li key={d.id} className="flex items-center justify-between p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.sizeKb} KB · {d.type.split("/")[1].toUpperCase()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDocs((arr) => arr.filter((x) => x.id !== d.id))}><Trash2 className="h-4 w-4"/></Button>
                  </li>))}
              </ul>)}
          </div>)}

        {/* STEP 2: APPOINTMENT DETAILS & SPECIFIC FIELDS */}
        {step === 2 && (<div className="grid gap-6 md:grid-cols-2">
            
            {/* SERVICE SPECIFIC APPOINTMENT FIELDS */}
            <div className="md:col-span-2 border-b border-border pb-3">
                <h3 className="font-display font-semibold text-lg">Appointment Configuration</h3>
                <p className="text-xs text-muted-foreground">CRRSA requires specific confirmations and inputs when booking appointments for this service type.</p>
            </div>

            {/* DIVORCE SCHEDULING DETAILS */}
            {slug === "divorce-certificate" && (
                <div className="md:col-span-2 grid gap-5 p-5 bg-secondary/20 rounded-2xl border border-border">
                    <div className="space-y-1.5">
                        <Label htmlFor="courtCaseNumber">Divorcing Court Case Number</Label>
                        <Input id="courtCaseNumber" value={apptFields.courtCaseNumber} onChange={(e) => setApptFields({ ...apptFields, courtCaseNumber: e.target.value })} placeholder="e.g. CIV-COURT-992-12" />
                        {errors.courtCaseNumber && <p className="text-xs text-destructive">{errors.courtCaseNumber}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="courtDate">Court Ruling / Settlement Date</Label>
                        <Input id="courtDate" type="date" value={apptFields.courtDate} onChange={(e) => setApptFields({ ...apptFields, courtDate: e.target.value })} />
                        {errors.courtDate && <p className="text-xs text-destructive">{errors.courtDate}</p>}
                    </div>
                    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={apptFields.confirmRulingUploaded} onChange={(e) => setApptFields({ ...apptFields, confirmRulingUploaded: e.target.checked })} className="mt-1" />
                        <div>
                            <span className="font-semibold text-foreground">Ruling Upload Confirmation</span>
                            <p className="text-xs text-muted-foreground mt-0.5">I certify that I have uploaded the official scanned court divorce decree in Step 1.</p>
                            {errors.confirmRulingUploaded && <p className="text-xs text-destructive font-semibold mt-1">{errors.confirmRulingUploaded}</p>}
                        </div>
                    </label>
                </div>
            )}

            {/* DEATH CERTIFICATE SCHEDULING DETAILS */}
            {slug === "death-certificate" && details.deathRegistrationType === "Delayed" && (
                <div className="md:col-span-2 grid gap-5 p-5 bg-secondary/20 rounded-2xl border border-border">
                    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={apptFields.confirmDelayedProof} onChange={(e) => setApptFields({ ...apptFields, confirmDelayedProof: e.target.checked })} className="mt-1" />
                        <div>
                            <span className="font-semibold text-foreground">Acknowledge Delayed Registration Proofs</span>
                            <p className="text-xs text-muted-foreground mt-0.5">I confirm that I am registering a death after the 30-day limit and have uploaded institutional / church proof of death.</p>
                            {errors.confirmDelayedProof && <p className="text-xs text-destructive font-semibold mt-1">{errors.confirmDelayedProof}</p>}
                        </div>
                    </label>
                </div>
            )}

            {/* RESIDENCE ID SERVICE SCHEDULING DETAILS */}
            {slug === "id-services" && (
                <div className="md:col-span-2 grid gap-5 p-5 bg-secondary/20 rounded-2xl border border-border">
                    <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-medium flex gap-3">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <div>
                            <span className="font-bold">IN-PERSON ATTENDANCE REQUIRED:</span> Residence ID applications must be completed in-person by the primary applicant. NO proxies, guardians, or third-party representatives can collect or verify Residence IDs.
                        </div>
                    </div>
                    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={apptFields.confirmNotByProxy} onChange={(e) => setApptFields({ ...apptFields, confirmNotByProxy: e.target.checked })} className="mt-1" />
                        <div>
                            <span className="font-semibold text-foreground">Confirm In-Person Attendance (No Proxy)</span>
                            <p className="text-xs text-muted-foreground mt-0.5">I certify that I am the primary applicant (age 18+) and will appear in-person at the CRRSA office with physical proof documents.</p>
                            {errors.confirmNotByProxy && <p className="text-xs text-destructive font-semibold mt-1">{errors.confirmNotByProxy}</p>}
                        </div>
                    </label>
                </div>
            )}

            {/* RESIDENCY TRANSFER SCHEDULING DETAILS */}
            {slug === "residency-transfer" && (
                <div className="md:col-span-2 grid gap-5 p-5 bg-secondary/20 rounded-2xl border border-border">
                    <div className="space-y-1.5">
                        <Label htmlFor="transferReasonAppt">Reason for Residency Transfer</Label>
                        <Input id="transferReasonAppt" value={apptFields.transferReason} onChange={(e) => setApptFields({ ...apptFields, transferReason: e.target.value })} placeholder="e.g. Permanent employment move" />
                        {errors.transferReason && <p className="text-xs text-destructive">{errors.transferReason}</p>}
                    </div>
                    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={apptFields.confirmReturnOldId} onChange={(e) => setApptFields({ ...apptFields, confirmReturnOldId: e.target.checked })} className="mt-1" />
                        <div>
                            <span className="font-semibold text-foreground">Agree to Return Old Residence ID Card</span>
                            <p className="text-xs text-muted-foreground mt-0.5">I agree to surrender my old, physical Residence ID card to the CRRSA desk agent upon receiving my new transfer card.</p>
                            {errors.confirmReturnOldId && <p className="text-xs text-destructive font-semibold mt-1">{errors.confirmReturnOldId}</p>}
                        </div>
                    </label>
                </div>
            )}

            {/* SINGLE STATUS SCHEDULING DETAILS */}
            {slug === "certificate-of-no-impediment" && (
                <div className="md:col-span-2 grid gap-5 p-5 bg-secondary/20 rounded-2xl border border-border">
                    <div className="space-y-1.5">
                        <Label htmlFor="certificatePurposeAppt">Purpose of Certificate</Label>
                        <Input id="certificatePurposeAppt" value={apptFields.certificatePurpose} onChange={(e) => setApptFields({ ...apptFields, certificatePurpose: e.target.value })} placeholder="e.g. Visa request or marriage registry abroad" />
                        {errors.certificatePurpose && <p className="text-xs text-destructive">{errors.certificatePurpose}</p>}
                    </div>
                    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={apptFields.confirmValiditySixMonths} onChange={(e) => setApptFields({ ...apptFields, confirmValiditySixMonths: e.target.checked })} className="mt-1" />
                        <div>
                            <span className="font-semibold text-foreground">Acknowledge 6-Month Certificate Validity Limit</span>
                            <p className="text-xs text-muted-foreground mt-0.5">I acknowledge that the Single Status (No Impediment) Certificate is legally valid for exactly six (6) months from its date of issuance.</p>
                            {errors.confirmValiditySixMonths && <p className="text-xs text-destructive font-semibold mt-1">{errors.confirmValiditySixMonths}</p>}
                        </div>
                    </label>
                    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={apptFields.confirmOathAffidavit} onChange={(e) => setApptFields({ ...apptFields, confirmOathAffidavit: e.target.checked })} className="mt-1" />
                        <div>
                            <span className="font-semibold text-foreground">Confirm Oath of Marital Affidavit</span>
                            <p className="text-xs text-muted-foreground mt-0.5">I swear under penalty of perjury that my declared marital status is accurate and single.</p>
                            {errors.confirmOathAffidavit && <p className="text-xs text-destructive font-semibold mt-1">{errors.confirmOathAffidavit}</p>}
                        </div>
                    </label>
                </div>
            )}

            {/* VERIFICATION LETTER SCHEDULING DETAILS */}
            {slug === "residency-proof-letter" && (
                <div className="md:col-span-2 grid gap-5 p-5 bg-secondary/20 rounded-2xl border border-border">
                    <div className="space-y-1.5">
                        <Label htmlFor="periodOfStayToConfirm">Period of Stay to Be Confirmed (in years/months)</Label>
                        <Input id="periodOfStayToConfirm" value={apptFields.periodOfStayToConfirm} onChange={(e) => setApptFields({ ...apptFields, periodOfStayToConfirm: e.target.value })} placeholder="e.g. 5 Years (from 2021 to 2026)" />
                        {errors.periodOfStayToConfirm && <p className="text-xs text-destructive">{errors.periodOfStayToConfirm}</p>}
                    </div>
                </div>
            )}

            <div className="md:col-span-2 border-b border-border pb-3 pt-3">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">CRRSA Office & Date Slot</h3>
            </div>
            
            <div className="space-y-1.5">
              <Label>Sub-City Office</Label>
              <div className="rounded-xl border border-border bg-muted p-2.5 text-sm font-medium">
                {office}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Select Appointment Date</Label>
              <Input type="date" value={date} min={format(addDays(new Date(), 1), "yyyy-MM-dd")} onChange={(e) => setDate(e.target.value)}/>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Time Slot</Label>
              {!slotRows.length ? (<p className="text-sm text-muted-foreground">No openings for this office and date. Try another date.</p>) : (<Select value={slotId != null ? String(slotId) : ""} onValueChange={(v) => setSlotId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Select a slot"/></SelectTrigger>
                  <SelectContent>{slotRows.map((s) => (<SelectItem key={s.id} value={String(s.id)}>{slotLabel(s)} ({s.available ?? "?"} places)</SelectItem>))}</SelectContent>
                </Select>)}
            </div>
            <div className="md:col-span-2 rounded-xl bg-secondary/40 p-4 text-sm">
              <CalendarCheck className="mr-2 inline h-4 w-4 text-primary"/>
              You'll receive a queue number once submitted.
            </div>
          </div>)}

        {/* STEP 3: REVIEW AND SUBMIT */}
        {step === 3 && (<div className="space-y-5">
            <ReviewBlock title="Service">
              <p>{service.name} · <span className="text-muted-foreground">{service.fee} ETB · ~{service.processingDays} days</span></p>
            </ReviewBlock>
            
            <ReviewBlock title="Form Details">
              <dl className="grid gap-4 text-sm md:grid-cols-2">
                {Object.entries(details).map(([k, v]) => {
                    if (typeof v === "object" || !v || k.startsWith("applicant")) return null;
                    // Format label nicely
                    const formattedKey = k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
                    return (
                        <div key={k}>
                            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{formattedKey}</dt>
                            <dd className="font-semibold text-foreground">{v}</dd>
                        </div>
                    );
                })}
              </dl>
            </ReviewBlock>

            <ReviewBlock title="Documents Checklist">
              {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> : (<ul className="text-sm space-y-1">{docs.map((d) => <li key={d.id} className="font-medium">• {d.name}</li>)}</ul>)}
            </ReviewBlock>
            
            <ReviewBlock title="Appointment Slot">
              <p className="font-semibold text-foreground">{office}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(date), "EEEE, MMMM d")} · {slotDisplay}</p>
            </ReviewBlock>
          </div>)}

        {/* BOTTOM STEP CONTROLS */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="mr-1 h-4 w-4"/> Back
          </Button>
          {step < 3 ? (<Button onClick={next} className="bg-primary text-primary-foreground hover:bg-primary/90">Next <ArrowRight className="ml-1 h-4 w-4"/></Button>) : (<Button onClick={onSubmit} disabled={submitMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">Submit application</Button>)}
        </div>
      </div>
    </>);
};

function ReviewBlock({ title, children }) {
    return (<div className="rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="mt-2">{children}</div>
    </div>);
}

export default Apply;

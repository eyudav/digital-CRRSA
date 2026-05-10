import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADDIS_SUBCITIES, getWoredasForSubCity } from "@/data/addisLocations";
const StaffSettings = () => {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.fullName || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [address, setAddress] = useState(user?.address || "");
    const [subCity, setSubCity] = useState(user?.subCity || "");
    const [woreda, setWoreda] = useState(user?.woreda || "");
    const save = async () => {
        const res = await updateProfile({ fullName: name, phone, address, subCity, woreda });
        if (!res?.ok) {
            toast({ title: "Update failed", description: res?.message, variant: "destructive" });
            return;
        }
        toast({ title: "Profile updated" });
    };
    return (<>
      <PageHeader title="Settings" description="Manage your account information."/>
      <div className="max-w-xl rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)}/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}/>
          </div>
          <div className="space-y-1.5">
            <Label>Sub-City</Label>
            <Select value={subCity} onValueChange={(v) => { setSubCity(v); setWoreda(""); }}>
              <SelectTrigger><SelectValue placeholder="Select sub-city" /></SelectTrigger>
              <SelectContent>
                {ADDIS_SUBCITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Woreda</Label>
            <Select value={woreda} onValueChange={setWoreda} disabled={!subCity}>
              <SelectTrigger><SelectValue placeholder="Select woreda" /></SelectTrigger>
              <SelectContent>
                {getWoredasForSubCity(subCity).map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email} disabled/>
          </div>
          <div className="pt-2">
            <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">Save changes</Button>
          </div>
        </div>
      </div>
    </>);
};
export default StaffSettings;

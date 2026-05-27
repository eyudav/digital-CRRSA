import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADDIS_SUBCITIES, getWoredasForSubCity } from "@/data/addisLocations";
const StaffSettings = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const [name, setName] = useState(user?.fullName || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [address, setAddress] = useState(user?.address || "");
    const [subCity, setSubCity] = useState(user?.subCity || "");
    const [woreda, setWoreda] = useState(user?.woreda || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const save = async () => {
        const res = await updateProfile({ fullName: name, phone, address, subCity, woreda });
        if (!res?.ok) {
            toast({ title: "Update failed", description: res?.message, variant: "destructive" });
            return;
        }
        toast({ title: "Profile updated" });
    };
    const savePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({ title: "Password mismatch", description: "New password and confirmation do not match.", variant: "destructive" });
            return;
        }
        const passOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
        if (!passOk) {
            toast({ title: "Weak password", description: "Use at least 8 characters with upper, lower, and number.", variant: "destructive" });
            return;
        }
        const res = await changePassword({ currentPassword, newPassword, confirmPassword });
        if (!res?.ok) {
            toast({ title: "Password update failed", description: res?.message, variant: "destructive" });
            return;
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({ title: "Password changed successfully" });
    };
    return (<>
      <PageHeader title="Settings" description="Manage your account information."/>
      <div className="max-w-xl">
        <ContentCard>
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
        </ContentCard>
      </div>
      <div className="mt-5 max-w-xl">
        <ContentCard title="Change password">
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
            <Button onClick={savePassword}>Update password</Button>
          </div>
        </ContentCard>
      </div>
    </>);
};
export default StaffSettings;

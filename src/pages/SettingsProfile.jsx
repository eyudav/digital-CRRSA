import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADDIS_SUBCITIES, getWoredasForSubCity } from "@/data/addisLocations";

export default function SettingsProfile() {
  const { user, updateProfile } = useAuth();
  const role = user?.role;
  const isCitizen = role === "citizen";
  const settingsBase =
    role === "citizen" ? "/citizen/settings" : "/staff/settings";

  const [name, setName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [subCity, setSubCity] = useState(user?.subCity || "");
  const [woreda, setWoreda] = useState(user?.woreda || "");

  const description =
    role === "super_admin"
      ? "Update your account details. City-wide administrators are not assigned to a sub-city or woreda."
      : role === "admin" || role === "staff"
        ? "Update your account details. Location is assigned by an administrator and cannot be changed here."
        : "Update your account details, sub-city, and woreda.";

  const save = async () => {
    const patch = {
      fullName: name,
      phone,
      address: role === "super_admin" ? undefined : address,
    };
    if (isCitizen) {
      patch.subCity = subCity;
      patch.woreda = woreda;
    }
    const res = await updateProfile(patch);
    if (!res?.ok) {
      toast({
        title: "Update failed",
        description: res?.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Profile updated" });
  };

  return (
    <>
      <PageHeader
        title="Manage profile information"
        description={description}
      />
      <div className="max-w-xl">
        <ContentCard>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {isCitizen && (
              <>
                <div className="space-y-1.5">
                  <Label>Sub-City</Label>
                  <Select
                    value={subCity}
                    onValueChange={(v) => {
                      setSubCity(v);
                      setWoreda("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-city" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADDIS_SUBCITIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Woreda</Label>
                  <Select
                    value={woreda}
                    onValueChange={setWoreda}
                    disabled={!subCity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select woreda" />
                    </SelectTrigger>
                    <SelectContent>
                      {getWoredasForSubCity(subCity).map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {role !== "super_admin" && (
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            )}
            {(role === "admin" || role === "staff") && user?.subCity && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Assigned sub-city:{" "}
                <span className="font-medium text-foreground">
                  {user.subCity}
                  {role === "staff" && user.woreda
                    ? ` · ${user.woreda}`
                    : ""}
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email} disabled />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={save}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save changes
              </Button>
              <Link
                to={`${settingsBase}/password`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Go to change password
              </Link>
            </div>
          </div>
        </ContentCard>
      </div>
    </>
  );
}

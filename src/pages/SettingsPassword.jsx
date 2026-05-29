import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Eye, EyeOff } from "lucide-react";

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPassword() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const settingsBase =
    user?.role === "citizen" ? "/citizen/settings" : "/staff/settings";

  const savePassword = async () => {
    if (!currentPassword.trim()) {
      toast({
        title: "Current password required",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }
    const passOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
    if (!passOk) {
      toast({
        title: "Weak password",
        description: "Use at least 8 characters with upper, lower, and number.",
        variant: "destructive",
      });
      return;
    }
    const res = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!res?.ok) {
      toast({
        title: "Password update failed",
        description: res?.message,
        variant: "destructive",
      });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Password changed successfully" });
  };

  return (
    <>
      <PageHeader
        title="Change password"
        description="Update your account password."
      />
      <div className="mt-5 max-w-xl">
        <ContentCard>
          <div className="mt-4 space-y-4">
            <PasswordField
              id="currentPassword"
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="off"
            />
            <PasswordField
              id="newPassword"
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button onClick={savePassword}>Update password</Button>
              <Link
                to={settingsBase}
                className="text-sm text-primary hover:underline"
              >
                Back to profile information
              </Link>
            </div>
          </div>
        </ContentCard>
      </div>
    </>
  );
}

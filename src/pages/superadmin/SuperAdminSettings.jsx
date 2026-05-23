import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiJson } from "@/lib/api";

const SuperAdminSettings = () => {
    const [settings, setSettings] = useState({ maintenanceMode: false, maxUploadSizeMb: 5, applicationLimits: 10 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiJson("/api/super-admin/settings")
            .then((data) => {
                setSettings(data);
                setLoading(false);
            })
            .catch(() => {
                toast({ title: "Failed to load settings", variant: "destructive" });
                setLoading(false);
            });
    }, []);

    const saveSettings = async () => {
        try {
            await apiJson("/api/super-admin/settings", {
                method: "PATCH",
                body: settings
            });
            toast({ title: "Settings saved successfully" });
        } catch (e) {
            toast({ title: "Failed to save settings", description: e.message, variant: "destructive" });
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <>
            <PageHeader
                eyebrow="Super Admin"
                title="System Settings"
                description="Configure global platform settings, limits, and maintenance mode."
            />
            
            <div className="mt-8 max-w-xl rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Max Upload Size (MB)</Label>
                        <Input 
                            type="number" 
                            value={settings.maxUploadSizeMb} 
                            onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Application Limits</Label>
                        <Input 
                            type="number" 
                            value={settings.applicationLimits} 
                            onChange={(e) => setSettings({ ...settings, applicationLimits: Number(e.target.value) })}
                        />
                    </div>
                    <div className="pt-4 border-t border-border">
                        <Button onClick={saveSettings} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Save Settings
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SuperAdminSettings;

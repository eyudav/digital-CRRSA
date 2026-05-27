import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ContentCard({ title, icon: Icon, children, className }) {
  return (
    <Card className={`rounded-2xl border-border shadow-soft ${className || ""}`}>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

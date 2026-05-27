import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const NotFound = () => {
    const location = useLocation();
    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border shadow-soft text-center p-8">
          <CardContent className="space-y-4 pt-4">
            <h1 className="text-6xl font-display font-bold text-muted-foreground/30">404</h1>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h2>
            <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
            <Button asChild className="mt-6" variant="default">
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
};
export default NotFound;

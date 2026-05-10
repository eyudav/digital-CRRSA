import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
export function RequireRole({ role, children }) {
    const { user } = useAuth();
    if (!user)
        return <Navigate to="/login" replace/>;
    const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;
    if (!allowed) {
        const home = user.role === "staff" ? "/staff" : user.role === "admin" || user.role === "super_admin" ? "/staff" : "/citizen";
        return <Navigate to={home} replace/>;
    }
    return <>{children}</>;
}

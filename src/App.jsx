import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/components/RequireRole";
import Index from "./pages/Index.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import Services from "./pages/citizen/Services";
import Apply from "./pages/citizen/Apply";
import Applications from "./pages/citizen/Applications";
import ApplicationDetail from "./pages/citizen/ApplicationDetail";
import Appointments from "./pages/citizen/Appointments";
import Notifications from "./pages/citizen/Notifications";
import Announcements from "./pages/citizen/Announcements";
import Complaints from "./pages/citizen/Complaints";
import Certificates from "./pages/citizen/Certificates";
import StaffDashboard from "./pages/staff/StaffDashboard";
import Queue from "./pages/staff/Queue";
import StaffApplicationDetail from "./pages/staff/StaffApplicationDetail";
import StaffAnnouncements from "./pages/staff/StaffAnnouncements";
import StaffComplaints from "./pages/staff/StaffComplaints";
import StaffSettings from "./pages/staff/StaffSettings";
import AdminUsers from "./pages/admin/AdminUsers";
const queryClient = new QueryClient();
const App = () => (<QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />}/>
            <Route path="/login" element={<Login />}/>
            <Route path="/register" element={<Register />}/>

            <Route element={<RequireRole role="citizen"><AppShell /></RequireRole>}>
              <Route path="/citizen" element={<CitizenDashboard />}/>
              <Route path="/citizen/services" element={<Services />}/>
              <Route path="/citizen/apply/:slug" element={<Apply />}/>
              <Route path="/citizen/applications" element={<Applications />}/>
              <Route path="/citizen/applications/:id" element={<ApplicationDetail />}/>
              <Route path="/citizen/appointments" element={<Appointments />}/>
              <Route path="/citizen/notifications" element={<Notifications />}/>
              <Route path="/citizen/announcements" element={<Announcements />}/>
              <Route path="/citizen/complaints" element={<Complaints />}/>
              <Route path="/citizen/certificates" element={<Certificates />}/>
            </Route>

            <Route element={<RequireRole role={["staff", "admin", "super_admin"]}><AppShell /></RequireRole>}>
              <Route path="/staff" element={<StaffDashboard />}/>
              <Route path="/staff/queue" element={<Queue />}/>
              <Route path="/staff/queue/:id" element={<StaffApplicationDetail />}/>
              <Route path="/staff/announcements" element={<RequireRole role={["admin", "super_admin"]}><StaffAnnouncements /></RequireRole>} />
              <Route path="/staff/complaints" element={<StaffComplaints />}/>
              <Route path="/staff/settings" element={<StaffSettings />}/>
              <Route path="/staff/admin/users" element={<RequireRole role={["admin", "super_admin"]}><AdminUsers /></RequireRole>} />
            </Route>

            <Route path="*" element={<NotFound />}/>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>);
export default App;

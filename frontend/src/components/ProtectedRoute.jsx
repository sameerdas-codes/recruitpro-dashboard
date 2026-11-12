import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("access_token");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const verifyRole = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/accounts/me/");
        const userRole = response.data.role;
        const hasRole =
          role === "any"
            ? ["candidate", "hr", "admin", "interviewer"].includes(userRole)
            : userRole === role || (role === "hr" && userRole === "admin");

        if (!hasRole) {
          navigate("/login", { replace: true });
          return;
        }

        if (active) {
          setAuthorized(true);
        }
      } catch (error) {
        console.error("Unable to verify the current user:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login", { replace: true });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    verifyRole();

    return () => {
      active = false;
    };
  }, [navigate, role, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p>Verifying access...</p>
      </div>
    );
  }

  return authorized ? children : null;
}

export default ProtectedRoute;

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin" && !user.is_superuser) {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    role === "staff" &&
    (!user.is_staff || user.is_superuser)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

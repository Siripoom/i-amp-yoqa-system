import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import PropTypes from "prop-types";

// Role-based protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Use jwt-decode to parse the token
        const tokenPayload = jwtDecode(token);

        // Check if token is valid (not expired)
        const currentTime = Date.now() / 1000;
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          // Token expired
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
          setUserRole(tokenPayload.role);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    // You could return a loading spinner here
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to sign in if not authenticated
    return <Navigate to="/auth/signin" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to home if not authorized
    return <Navigate to="/" />;
  }

  return children;
};

// Admin-only routes
const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["Admin"]}>{children}</ProtectedRoute>
);

// Member-only routes (accessible by Member and Admin)
const MemberRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["Member", "Admin"]}>{children}</ProtectedRoute>
);
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

MemberRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export { ProtectedRoute, AdminRoute, MemberRoute };

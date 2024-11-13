import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DashboardPage from "./pages/Dashboard";
import UserPage from "./pages/Users";
import ProductPage from "./pages/Products";
import CoursesPage from "./pages/Courses";
import OrderPage from "./pages/Order";

const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/users" element={<UserPage />} />
      <Route path="/products" element={<ProductPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/orders" element={<OrderPage />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  </Router>
);

export default AppRouter;

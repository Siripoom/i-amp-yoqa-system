import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/admin/Dashboard";
import UserPage from "./pages/admin/Users";
import ProductPage from "./pages/admin/ProductManage";
import CoursesPage from "./pages/admin/Courses";
import OrderPage from "./pages/admin/Order";
import HomePage from "./pages/Home";
import Course from "./pages/Course";
import Product from "./pages/Product";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import CartSuccess from "./pages/CartSuccess";
import CheckOut from "./pages/CheckOut";
import CourseDetail from "./pages/CourseDetail";
import Contact from "./pages/Contact";
import PageNotFound from "./pages/404page";
const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/users" element={<UserPage />} />
      <Route path="/admin/productManage" element={<ProductPage />} />
      <Route path="/admin/courses" element={<CoursesPage />} />
      <Route path="/admin/orders" element={<OrderPage />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/cartSuccess" element={<CartSuccess />} />
      <Route path="/checkout" element={<CheckOut />} />
      <Route path="/course" element={<Course />} />
      {/* <Route path="/course/:id" element={<CourseDetail />} /> */}
      <Route path="/course/id" element={<CourseDetail />} />
      <Route path="/product" element={<Product />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  </Router>
);

export default AppRouter;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/Dashboard";
import UserPage from "./pages/Users";
import ProductPage from "./pages/ProductManage";
import CoursesPage from "./pages/Courses";
import OrderPage from "./pages/Order";
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
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/users" element={<UserPage />} />
      <Route path="/productManage" element={<ProductPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/orders" element={<OrderPage />} />
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

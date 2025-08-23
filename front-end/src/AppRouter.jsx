import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AdminRoute, MemberRoute } from "./ProtectedRoute";
import DashboardPage from "./pages/admin/Dashboard";
import UserPage from "./pages/admin/Users";
import ProductPage from "./pages/admin/ProductManage";
import CoursesPage from "./pages/admin/Courses";
import Schedule from "./pages/admin/ClassSchedule";
import OrderPage from "./pages/admin/Order";
import ScheduleTeacher from "./pages/Instructor/ClassSchedule";
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
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { ResetPassword } from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Myplane from "./pages/Myplane";
import MyOrders from "./pages/MyOder";
import Booking from "./pages/Booking";
import Class from "./pages/Class";
import ImageSetup from "./pages/admin/ImageSetup";
import Line from "./pages/Line";
import InstructorReport from "./pages/admin/InstructorReport";
import AutoLogoutProvider from "./components/AutoLogoutProvider";
import Term from "./pages/Term";
import UserTerms from "./pages/admin/Terms"
import GoodsPages from "./pages/admin/Goods";
import Finance from "./pages/admin/Finance";
import TestFinancePage from "./pages/TestFinancePage";

const AppRouter = () => (
  <Router>
    <AutoLogoutProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/term" element={<Term />} />
        <Route path="/auth/line" element={<Line />} />
        <Route path="/course" element={<Course />} />
        <Route path="/course/id" element={<CourseDetail />} />
        <Route path="/product" element={<Product />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/class" element={<Class />} />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/master-report"
          element={
            <AdminRoute>
              <InstructorReport />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/productManage"
          element={
            <AdminRoute>
              <ProductPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/goods"
          element={
            <AdminRoute>
              <GoodsPages />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <AdminRoute>
              <CoursesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <OrderPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <AdminRoute>
              <Schedule />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/imageSetup"
          element={
            <AdminRoute>
              <ImageSetup />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/terms"
          element={
            <AdminRoute>
              <UserTerms />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <AdminRoute>
              <Finance />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/test-finance"
          element={
            <AdminRoute>
              <TestFinancePage />
            </AdminRoute>
          }
        />
        <Route
          path="/teacher/schedule"
          element={
            <AdminRoute>
              <ScheduleTeacher />
            </AdminRoute>
          }
        />

        {/* Member routes (accessible by Member and Admin) */}
        <Route
          path="/profile"
          element={
            <MemberRoute>
              <Profile />
            </MemberRoute>
          }
        />

        <Route
          path="/my-plane"
          element={
            <MemberRoute>
              <Myplane />
            </MemberRoute>
          }
        />

        <Route
          path="/my-orders"
          element={
            <MemberRoute>
              <MyOrders />
            </MemberRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <MemberRoute>
              <Cart />
            </MemberRoute>
          }
        />
        <Route
          path="/cartSuccess"
          element={
            <MemberRoute>
              <CartSuccess />
            </MemberRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <MemberRoute>
              <CheckOut />
            </MemberRoute>
          }
        />

        {/* 404 route */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AutoLogoutProvider>
  </Router>
);

export default AppRouter;

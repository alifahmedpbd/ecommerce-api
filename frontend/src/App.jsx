
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import RoleRoute from "./components/common/RoleRoute";

import Home from "./pages/customer/Home";
import Shop from "./pages/customer/Shop";
import ProductDetails from "./pages/customer/ProductDetails";
import Cart from "./pages/customer/Cart";
import PaymentSuccess from "./pages/customer/PaymentSuccess";
import PaymentCancel from "./pages/customer/PaymentCancel";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrderDetails from "./pages/staff/StaffOrderDetails";


import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminReviews from "./pages/admin/AdminReviews";

import Wishlist from "./pages/customer/Wishlist";

import ForgotPassword from './pages/auth/ForgotPassword'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/products/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/success" element={<PaymentSuccess />} />
          <Route path="/cancel" element={<PaymentCancel />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/wishlist" element={<Wishlist />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/admin/*"
            element={
              <RoleRoute role="admin">
                <AdminDashboard />
              </RoleRoute>
            }
          />

          <Route
            path="/staff/*"
            element={
              <RoleRoute role="staff">
                <StaffDashboard />
              </RoleRoute>
            }
          />

          <Route
  path="/staff/orders/:id"
  element={
    <RoleRoute role="staff">
      <StaffOrderDetails />
    </RoleRoute>
  }
/>

<Route
  path="/admin"
  element={
    <RoleRoute role="admin">
      <AdminDashboard />
    </RoleRoute>
  }
/>

<Route
  path="/admin/products"
  element={
    <RoleRoute role="admin">
      <AdminProducts />
    </RoleRoute>
  }
/>

<Route
  path="/admin/categories"
  element={
    <RoleRoute role="admin">
      <AdminCategories />
    </RoleRoute>
  }
/>

<Route
  path="/admin/orders"
  element={
    <RoleRoute role="admin">
      <AdminOrders />
    </RoleRoute>
  }
/>

<Route
  path="/admin/orders/:id"
  element={
    <RoleRoute role="admin">
      <StaffOrderDetails />
    </RoleRoute>
  }
/>

<Route
  path="/admin/staff"
  element={
    <RoleRoute role="admin">
      <AdminStaff />
    </RoleRoute>
  }
/>

<Route
  path="/admin/reviews"
  element={
    <RoleRoute role="admin">
      <AdminReviews />
    </RoleRoute>
  }
/>


        </Routes>

        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

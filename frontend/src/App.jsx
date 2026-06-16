import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./components/pages/Dashboard";
import Buildings from "./components/pages/Buildings";
import Doors from "./components/pages/Doors";
import Users from "./components/pages/Users";
import Logs from "./components/pages/Logs";
import AdminLogin from "./components/pages/AdminLogin";
import Toast from "./components/layout/Toast";
import { api } from "./services/api";
import Tenants from "./components/pages/Tenants";

function App() {
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const validateStoredAdmin = async () => {
      const storedAdminId = api.getStoredAdminId();

      if (!storedAdminId) {
        setAuthChecking(false);
        return;
      }

      try {
        const profile = await api.getCurrentAdmin(storedAdminId);
        api.setAdminSession(storedAdminId, profile);
        setAdminProfile(profile);
      } catch (error) {
        api.clearAdminSession();
        setAdminProfile(null);
      } finally {
        setAuthChecking(false);
      }
    };

    validateStoredAdmin();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogin = (profile) => {
    setAdminProfile(profile);
  };

  const handleLogout = () => {
    api.clearAdminSession();
    setAdminProfile(null);
    setSidebarOpen(false);
    showToast("Logged out successfully", "success");
  };

  if (authChecking) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-logo">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <h1>Checking session...</h1>
          <p>Please wait.</p>
        </div>
      </div>
    );
  }

  if (!adminProfile) {
    return (
      <>
        <AdminLogin onLogin={handleLogin} showToast={showToast} />
        <Toast toasts={toasts} />
      </>
    );
  }

  return (
    <Router>
      <div className="app">
        <button className="mobile-menu-toggle" onClick={toggleSidebar}>
          <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>

        <div
          className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
          onClick={closeSidebar}
        ></div>

        <Sidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          adminProfile={adminProfile}
          onLogout={handleLogout}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard showToast={showToast} />} />

            <Route
              path="/buildings"
              element={<Buildings showToast={showToast} />}
            />

            <Route path="/doors" element={<Doors showToast={showToast} />} />

            <Route path="/users" element={<Users showToast={showToast} />} />

            <Route path="/logs" element={<Logs showToast={showToast} />} />

            <Route
              path="/tenants"
              element={<Tenants showToast={showToast} />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Toast toasts={toasts} />
      </div>
    </Router>
  );
}

export default App;
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../../services/api";

function Sidebar({ isOpen, onClose, adminProfile, onLogout }) {
  const [configInfo, setConfigInfo] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(adminProfile || null);

  useEffect(() => {
    api
      .getConfig()
      .then((data) => setConfigInfo(data))
      .catch((err) => console.error("Failed to load config:", err));
  }, []);

  useEffect(() => {
    setCurrentAdmin(adminProfile || api.getStoredAdminProfile());
  }, [adminProfile]);

  const isSuperAdmin = currentAdmin?.role === "super_admin";

  const getRoleLabel = () => {
    if (currentAdmin?.role === "super_admin") return "Super Admin";
    if (currentAdmin?.role === "tenant_admin") return "Tenant Admin";
    if (currentAdmin?.role === "building_admin") return "Building Admin";
    return "Admin";
  };

  const getScopeLabel = () => {
    if (!currentAdmin) return "Admin";

    if (currentAdmin.role === "super_admin") {
      return "Super Admin";
    }

    if (currentAdmin.role === "tenant_admin") {
      return (
        currentAdmin.tenant_name ||
        currentAdmin.tenant_code ||
        "Tenant Scope"
      );
    }

    if (currentAdmin.role === "building_admin") {
      return (
        currentAdmin.building_name ||
        currentAdmin.tenant_name ||
        currentAdmin.tenant_code ||
        "Building Scope"
      );
    }

    return currentAdmin.name || "Admin";
  };

  const getScopeIcon = () => {
    if (currentAdmin?.role === "super_admin") return "fas fa-crown";
    if (currentAdmin?.role === "tenant_admin") return "fas fa-sitemap";
    if (currentAdmin?.role === "building_admin") return "fas fa-building";
    return "fas fa-user-circle";
  };

  const handleLogoutClick = () => {
    onClose?.();
    onLogout?.();
  };

  return (
    <nav className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="logo-container">
          <img src="/logo.png" alt="Visage Edge Logo" className="logo-image" />
        </div>
        <small className="brand-subtitle">BUILDING ACCESS CONTROL</small>
      </div>

      <ul className="nav flex-column mt-3">
        <li className="nav-item">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            end
            onClick={onClose}
          >
            <i className="fas fa-th-large"></i>
            <span>Dashboard</span>
          </NavLink>
        </li>

        {isSuperAdmin && (
          <li className="nav-item">
            <NavLink
              to="/tenants"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <i className="fas fa-sitemap"></i>
              <span>Tenants</span>
            </NavLink>
          </li>
        )}

        <li className="nav-item">
          <NavLink
            to="/buildings"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <i className="fas fa-building"></i>
            <span>Buildings</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/doors"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <i className="fas fa-door-open"></i>
            <span>Doors</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/users"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <i className="fas fa-users"></i>
            <span>Employees</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/logs"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <i className="fas fa-history"></i>
            <span>Access Logs</span>
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-top">
            <div className="config-icon">
              <i className={getScopeIcon()}></i>
            </div>

            <div className="config-info">
              <div className="config-label">{getRoleLabel()}</div>
              <div className="config-value">{getScopeLabel()}</div>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogoutClick}
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>

        {configInfo && (
          <div className="config-version">
            <small>
              {configInfo.app_name} v{configInfo.app_version}
            </small>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Sidebar;
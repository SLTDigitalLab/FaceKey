import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../../services/api";

function Sidebar({ isOpen, onClose }) {
  const [configInfo, setConfigInfo] = useState(null);

  useEffect(() => {
    api
      .getConfig()
      .then((data) => setConfigInfo(data))
      .catch((err) => console.error("Failed to load config:", err));
  }, []);

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

      {configInfo && (
        <div className="sidebar-footer">
          <div className="config-card">
            <div className="config-icon">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="config-info">
              <div className="config-label">API User</div>
              <div className="config-value">{configInfo.api_user}</div>
            </div>
          </div>
          <div className="config-version">
            <small>
              {configInfo.app_name} v{configInfo.app_version}
            </small>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Sidebar;

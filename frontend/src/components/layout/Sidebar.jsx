import React from 'react'
import { NavLink } from 'react-router-dom'

function Sidebar() {
    return (
        <nav className="sidebar">
            <div className="sidebar-brand">
                <div className="logo-container">
                    <img src="/logo.png" alt="Visage Edge Logo" className="logo-image" />
                </div>
                <small className="brand-subtitle">
                    BUILDING ACCESS CONTROL
                </small>
            </div>
            <ul className="nav flex-column mt-3">
                <li className="nav-item">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        end
                    >
                        <i className="fas fa-th-large"></i>
                        <span>Dashboard</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink
                        to="/buildings"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <i className="fas fa-building"></i>
                        <span>Buildings</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink
                        to="/doors"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <i className="fas fa-door-open"></i>
                        <span>Doors</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink
                        to="/users"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <i className="fas fa-users"></i>
                        <span>Employees</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink
                        to="/logs"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <i className="fas fa-history"></i>
                        <span>Access Logs</span>
                    </NavLink>
                </li>
            </ul>
        </nav>
    )
}

export default Sidebar

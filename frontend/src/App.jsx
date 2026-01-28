import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './components/pages/Dashboard'
import Buildings from './components/pages/Buildings'
import Doors from './components/pages/Doors'
import Users from './components/pages/Users'
import Logs from './components/pages/Logs'
import Toast from './components/layout/Toast'

function App() {
    const [toasts, setToasts] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const showToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <Router>
            <div className="app">
                <button className="mobile-menu-toggle" onClick={toggleSidebar}>
                    <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
                <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
                <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard showToast={showToast} />} />
                        <Route path="/buildings" element={<Buildings showToast={showToast} />} />
                        <Route path="/doors" element={<Doors showToast={showToast} />} />
                        <Route path="/users" element={<Users showToast={showToast} />} />
                        <Route path="/logs" element={<Logs showToast={showToast} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
                <Toast toasts={toasts} />
            </div>
        </Router>
    )
}

export default App

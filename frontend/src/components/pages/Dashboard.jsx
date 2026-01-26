import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import PageHeader from '../layout/PageHeader'
import StatCard from '../cards/StatCard'
import BuildingCard from '../cards/BuildingCard'
import LogItem from '../cards/LogItem'
import BuildingDetailsModal from '../modals/BuildingDetailsModal'
import AddBuildingModal from '../modals/AddBuildingModal'

function Dashboard({ showToast }) {
    const [groups, setGroups] = useState([]);
    const [doors, setDoors] = useState([]);
    const [users, setUsers] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(loadDashboard, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            const [groupsData, doorsData, usersData, logsData] = await Promise.all([
                api.getGroups(),
                api.getDoors(),
                api.getUsers(),
                api.getAccessLogs()
            ]);
            setGroups(groupsData);
            setDoors(doorsData);
            setUsers(usersData);
            setAccessLogs(logsData);
        } catch (error) {
            showToast('Failed to load dashboard data', 'error');
        }
    };

    const handleBuildingClick = async (group) => {
        setSelectedGroup(group);
        setShowModal(true);
    };

    const handleDeleteGroup = async (groupId) => {
        try {
            await api.deleteGroup(groupId);
            showToast('Building deleted successfully', 'success');
            setShowModal(false);
            loadDashboard();
        } catch (error) {
            showToast('Failed to delete building', 'error');
        }
    };

    const handleAddBuilding = async (buildingData) => {
        try {
            await api.createGroup(buildingData);
            showToast('Building created successfully', 'success');
            setShowAddModal(false);
            loadDashboard();
        } catch (error) {
            showToast('Failed to create building', 'error');
        }
    };

    const todaysAccessCount = accessLogs.filter(log => {
        const today = new Date().toDateString();
        const logDate = new Date(log.timestamp).toDateString();
        return today === logDate;
    }).length;

    return (
        <div>
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Welcome to Visage Edge Door Access Control</p>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <span className="live-badge">LIVE</span>
                    <button className="btn btn-outline-light" onClick={loadDashboard}>
                        <i className="fas fa-sync-alt me-2"></i>Refresh
                    </button>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <StatCard
                        icon="fas fa-building"
                        value={groups.length}
                        label="Buildings"
                        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    />
                </div>
                <div className="col-md-3">
                    <StatCard
                        icon="fas fa-door-open"
                        value={doors.length}
                        label="Total Doors"
                        gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                    />
                </div>
                <div className="col-md-3">
                    <StatCard
                        icon="fas fa-users"
                        value={users.length}
                        label="Linked Employees"
                        gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                    />
                </div>
                <div className="col-md-3">
                    <StatCard
                        icon="fas fa-lock"
                        value={todaysAccessCount}
                        label="Today's Access Events"
                        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                    />
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="section-header">
                        <h5><i className="fas fa-building me-2"></i>Buildings</h5>
                        <button className="btn btn-gradient btn-sm" onClick={() => setShowAddModal(true)}>
                            <i className="fas fa-plus me-2"></i>Add Building
                        </button>
                    </div>
                    {groups.length === 0 ? (
                        <div className="empty-state">
                            <p className="text-secondary">No buildings added yet</p>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {groups.slice(0, 6).map((group, idx) => (
                                <div key={group.id} className="col-md-6 col-lg-4">
                                    <BuildingCard
                                        group={group}
                                        onClick={() => handleBuildingClick(group)}
                                        color={idx % 4}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-lg-5">
                    <div className="section-header">
                        <h5><i className="fas fa-clock me-2"></i>Recent Activity</h5>
                        <a href="#/logs" className="view-all-link">View All</a>
                    </div>
                    <div className="activity-container">
                        {accessLogs.length === 0 ? (
                            <div className="empty-state">
                                <p className="text-secondary">No recent activity</p>
                            </div>
                        ) : (
                            accessLogs.slice(0, 8).map(log => (
                                <LogItem key={log.id} log={log} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showModal && selectedGroup && (
                <BuildingDetailsModal
                    group={selectedGroup}
                    doors={doors}
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    onDelete={handleDeleteGroup}
                />
            )}

            <AddBuildingModal
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                onSubmit={handleAddBuilding}
            />
        </div>
    )
}

export default Dashboard

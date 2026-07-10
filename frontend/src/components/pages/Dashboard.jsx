import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import BuildingDetailsModal from "../modals/BuildingDetailsModal";
import AddBuildingModal from "../modals/AddBuildingModal";

function Dashboard({ showToast }) {
  const [groups, setGroups] = useState([]);
  const [doors, setDoors] = useState([]);
  const [users, setUsers] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const currentAdmin = api.getStoredAdminProfile();
  const canCreateBuilding = currentAdmin?.role !== "building_admin";

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const shouldLoadTenants = currentAdmin?.role === "super_admin";

      const [groupsData, doorsData, usersData, logsData, tenantsData] =
        await Promise.all([
          api.getGroups(),
          api.getDoors(),
          api.getUsers(),
          api.getAccessLogs(),
          shouldLoadTenants && api.getTenants
            ? api.getTenants()
            : Promise.resolve([]),
        ]);

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setDoors(Array.isArray(doorsData) ? doorsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAccessLogs(Array.isArray(logsData) ? logsData : []);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);

      setIsOnline(true);
      setLastUpdated(new Date());
    } catch (error) {
      setIsOnline(false);
      showToast(error.message || "Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingClick = (group) => {
    setSelectedGroup(group);
    setShowModal(true);
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.deleteGroup(groupId);

      showToast("Building deleted successfully", "success");
      setShowModal(false);
      setSelectedGroup(null);
      loadDashboard();
    } catch (error) {
      showToast(error.message || "Failed to delete building", "error");
    }
  };

  const handleAddBuilding = async (buildingData) => {
    try {
      await api.createGroup(buildingData);

      showToast("Building created successfully", "success");
      setShowAddModal(false);
      loadDashboard();
    } catch (error) {
      showToast(error.message || "Failed to create building", "error");
    }
  };

  const getLogTimeValue = (log) => {
    return log.timestamp || log.created_at || log.time || "";
  };

  const getLogStatus = (log) => {
    const rawStatus = String(
      log.status || log.result || log.access_result || ""
    ).toLowerCase();

    if (log.access_granted === true) return "granted";
    if (log.access_granted === false) return "denied";
    if (rawStatus.includes("grant") || rawStatus.includes("success")) {
      return "granted";
    }
    if (rawStatus.includes("denied") || rawStatus.includes("fail")) {
      return "denied";
    }

    return "info";
  };

  const getTodayAccessCount = () => {
    const today = new Date().toDateString();

    return accessLogs.filter((log) => {
      const value = getLogTimeValue(log);
      if (!value) return false;

      const logDate = new Date(value);
      if (Number.isNaN(logDate.getTime())) return false;

      return today === logDate.toDateString();
    }).length;
  };

  const getGrantedAccessCount = () => {
    return accessLogs.filter((log) => getLogStatus(log) === "granted").length;
  };

  const getDeniedAccessCount = () => {
    return accessLogs.filter((log) => getLogStatus(log) === "denied").length;
  };

  const getRoleLabel = (role) => {
    if (role === "super_admin") return "Super Admin";
    if (role === "tenant_admin") return "Tenant Admin";
    if (role === "building_admin") return "Building Admin";
    return "Admin";
  };

  const getRoleScopeText = () => {
    if (currentAdmin?.role === "super_admin") return "All tenants";
    if (currentAdmin?.role === "tenant_admin") return "Tenant scope";
    if (currentAdmin?.role === "building_admin") return "Assigned building scope";
    return "Admin scope";
  };

  const getDoorCountForBuilding = (buildingId) => {
    return doors.filter((door) => door.building_id === buildingId).length;
  };

  const getUserCountForBuilding = (buildingId) => {
    const buildingDoorIds = doors
      .filter((door) => door.building_id === buildingId)
      .map((door) => door.id);

    const uniqueUsers = new Set();

    users.forEach((user) => {
      if (
        Array.isArray(user.authorized_doors) &&
        user.authorized_doors.some((doorId) => buildingDoorIds.includes(doorId))
      ) {
        uniqueUsers.add(user.id);
      }
    });

    return uniqueUsers.size;
  };

  const getLogTitle = (log) => {
    return (
      log.message ||
      log.event_type ||
      log.action ||
      (getLogStatus(log) === "granted"
        ? "Access granted"
        : getLogStatus(log) === "denied"
        ? "Access denied"
        : "Access event")
    );
  };

  const getUserLabel = (log) => {
    return log.user_name || log.name || log.user_id || "Unknown user";
  };

  const getDoorLabel = (log) => {
    return log.door_name || log.door?.name || log.door_id || "Unknown door";
  };

  const getLogTime = (log) => {
    const value = getLogTimeValue(log);

    if (!value) return "Unknown time";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString();
  };

  const visibleBuildings = groups.slice(0, 6);
  const recentLogs = accessLogs.slice(0, 8);
  const todaysAccessCount = getTodayAccessCount();

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div>
          <div className="pro-kicker">
            <i className="fas fa-shield-alt me-2"></i>
            Visage Edge Access Control
          </div>

          <h1>Dashboard</h1>

          <p>
            Monitor buildings, doors, employees, and access events from one
            secure control center using the same admin permission scope.
          </p>
        </div>

        <div className="pro-hero-actions">
          <div className={`dashboard-pro-status ${isOnline ? "online" : "offline"}`}>
            <span></span>
            <div>
              <strong>{isOnline ? "System Online" : "System Offline"}</strong>
              <small>
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString()}`
                  : "Waiting for update"}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-light"
            onClick={loadDashboard}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt me-2 ${loading ? "fa-spin" : ""}`}></i>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="pro-scope-banner">
        <div>
          <span>Current scope</span>
          <strong>{getRoleScopeText()}</strong>
        </div>

        <div>
          <span>Logged in as</span>
          <strong>{currentAdmin?.name || "Admin User"}</strong>
        </div>

        <div>
          <span>Admin role</span>
          <strong>{getRoleLabel(currentAdmin?.role)}</strong>
        </div>
      </div>

      <div className="pro-stats-grid">
        <div className="pro-stat-card">
          <div className="pro-stat-icon blue">
            <i className="fas fa-building"></i>
          </div>
          <div>
            <div className="pro-stat-value">{groups.length}</div>
            <div className="pro-stat-label">Buildings</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon cyan">
            <i className="fas fa-door-open"></i>
          </div>
          <div>
            <div className="pro-stat-value">{doors.length}</div>
            <div className="pro-stat-label">Total Doors</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon green">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div className="pro-stat-value">{users.length}</div>
            <div className="pro-stat-label">Linked Employees</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon purple">
            <i className="fas fa-fingerprint"></i>
          </div>
          <div>
            <div className="pro-stat-value">{todaysAccessCount}</div>
            <div className="pro-stat-label">Today’s Access</div>
          </div>
        </div>
      </div>

      <div className="dashboard-pro-grid">
        <section className="pro-section">
          <div className="pro-section-header">
            <div>
              <span>Overview</span>
              <h3>Buildings Overview</h3>
            </div>

            <div className="dashboard-section-actions">
              <Link to="/buildings" className="btn btn-outline-light btn-sm">
                View All
              </Link>

              {canCreateBuilding && (
                <button
                  type="button"
                  className="btn btn-gradient btn-sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>Add Building
                </button>
              )}
            </div>
          </div>

          {visibleBuildings.length === 0 ? (
            <div className="pro-empty-state dashboard-small-empty">
              <div>
                <div className="pro-empty-icon mx-auto">
                  <i className="fas fa-building"></i>
                </div>
                <h5>No buildings available</h5>
                <p>No buildings are available under your current scope.</p>
              </div>
            </div>
          ) : (
            <div className="dashboard-building-grid">
              {visibleBuildings.map((group) => {
                const doorCount = getDoorCountForBuilding(group.id);
                const userCount = getUserCountForBuilding(group.id);

                return (
                  <div
                    key={group.id}
                    className="pro-card dashboard-building-card"
                    onClick={() => handleBuildingClick(group)}
                  >
                    <div className="pro-card-top">
                      <div
                        className="pro-card-icon"
                        style={{
                          background:
                            group.color ||
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        }}
                      >
                        <i className={group.icon || "fas fa-building"}></i>
                      </div>

                      <span className="pro-status-badge active">Active</span>
                    </div>

                    <div className="pro-card-body">
                      <h3>{group.name}</h3>
                      <p className="pro-card-code">{group.id}</p>

                      <div className="pro-meta-box">
                        <div>
                          <span>Doors</span>
                          <strong>{doorCount}</strong>
                        </div>

                        <div>
                          <span>Employees</span>
                          <strong>{userCount}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pro-card-footer">
                      <button
                        type="button"
                        className="pro-primary-card-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleBuildingClick(group);
                        }}
                      >
                        <i className="fas fa-sliders me-2"></i>
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="pro-section">
          <div className="pro-section-header">
            <div>
              <span>Summary</span>
              <h3>Access Summary</h3>
            </div>
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-item">
              <div className="pro-stat-icon green">
                <i className="fas fa-check"></i>
              </div>
              <div>
                <strong>{getGrantedAccessCount()}</strong>
                <span>Granted Events</span>
              </div>
            </div>

            <div className="dashboard-summary-item">
              <div className="pro-stat-icon red">
                <i className="fas fa-times"></i>
              </div>
              <div>
                <strong>{getDeniedAccessCount()}</strong>
                <span>Denied Events</span>
              </div>
            </div>

            <div className="dashboard-summary-item">
              <div className="pro-stat-icon purple">
                <i className="fas fa-calendar-day"></i>
              </div>
              <div>
                <strong>{todaysAccessCount}</strong>
                <span>Today</span>
              </div>
            </div>

            {currentAdmin?.role === "super_admin" && (
              <div className="dashboard-summary-item">
                <div className="pro-stat-icon blue">
                  <i className="fas fa-sitemap"></i>
                </div>
                <div>
                  <strong>{tenants.length}</strong>
                  <span>Tenants</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="pro-section mt-4">
        <div className="pro-section-header">
          <div>
            <span>Recent activity</span>
            <h3>Latest Access Events</h3>
          </div>

          <Link to="/logs" className="btn btn-outline-light btn-sm">
            View All
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="pro-empty-state dashboard-small-empty">
            <div>
              <div className="pro-empty-icon mx-auto">
                <i className="fas fa-clock"></i>
              </div>
              <h5>No recent activity</h5>
              <p>No access events are available yet.</p>
            </div>
          </div>
        ) : (
          <div className="pro-log-list">
            {recentLogs.map((log) => {
              const status = getLogStatus(log);

              return (
                <div key={log.id} className="pro-log-row">
                  <div className={`pro-log-status ${status}`}>
                    <i
                      className={
                        status === "granted"
                          ? "fas fa-check"
                          : status === "denied"
                          ? "fas fa-times"
                          : "fas fa-info"
                      }
                    ></i>
                  </div>

                  <div className="pro-log-main">
                    <div className="pro-log-title-row">
                      <h4>{getLogTitle(log)}</h4>
                      <span className={`pro-log-badge ${status}`}>
                        {status === "granted"
                          ? "Granted"
                          : status === "denied"
                          ? "Denied"
                          : "Event"}
                      </span>
                    </div>

                    <div className="pro-log-meta">
                      <span>
                        <i className="fas fa-user me-1"></i>
                        {getUserLabel(log)}
                      </span>

                      <span>
                        <i className="fas fa-door-open me-1"></i>
                        {getDoorLabel(log)}
                      </span>
                    </div>
                  </div>

                  <div className="pro-log-time">
                    <i className="fas fa-clock me-1"></i>
                    {getLogTime(log)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showModal && selectedGroup && (
        <BuildingDetailsModal
          group={selectedGroup}
          doors={doors}
          show={showModal}
          onHide={() => {
            setShowModal(false);
            setSelectedGroup(null);
          }}
          onDelete={handleDeleteGroup}
          showToast={showToast}
        />
      )}

      <AddBuildingModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddBuilding}
        tenants={tenants}
        currentAdmin={currentAdmin}
      />
    </div>
  );
}

export default Dashboard;
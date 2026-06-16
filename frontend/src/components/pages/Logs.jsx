import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

function Logs({ showToast }) {
  const [accessLogs, setAccessLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [loading, setLoading] = useState(false);

  const currentAdmin = api.getStoredAdminProfile();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [accessLogs, selectedBuilding]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [logsData, groupsData] = await Promise.all([
        api.getAccessLogs(),
        api.getGroups(),
      ]);

      setAccessLogs(Array.isArray(logsData) ? logsData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      showToast(error.message || "Failed to load access logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const getLogBuildingId = (log) => {
    return (
      log.building_id ||
      log.group_id ||
      log.door_building_id ||
      log.door?.building_id ||
      ""
    );
  };

  const applyFilters = () => {
    let filtered = [...accessLogs];

    if (selectedBuilding !== "all") {
      filtered = filtered.filter(
        (log) => String(getLogBuildingId(log)) === String(selectedBuilding)
      );
    }

    setFilteredLogs(filtered);
  };

  const getRoleScopeText = () => {
    if (currentAdmin?.role === "super_admin") return "All tenant access logs";
    if (currentAdmin?.role === "tenant_admin") return "Your tenant access logs";
    if (currentAdmin?.role === "building_admin") return "Assigned building logs";
    return "Visible access logs";
  };

  const getLogStatus = (log) => {
    const rawStatus = String(
      log.event_type ||
        log.status ||
        log.result ||
        log.access_result ||
        log.action ||
        log.message ||
        ""
    ).toLowerCase();

    if (log.access_granted === true) return "granted";
    if (log.access_granted === false) return "denied";

    if (
      rawStatus.includes("granted") ||
      rawStatus.includes("grant") ||
      rawStatus.includes("success") ||
      rawStatus.includes("opened")
    ) {
      return "granted";
    }

    if (
      rawStatus.includes("denied") ||
      rawStatus.includes("deny") ||
      rawStatus.includes("failed") ||
      rawStatus.includes("fail") ||
      rawStatus.includes("unauthorized") ||
      rawStatus.includes("not authorized")
    ) {
      return "denied";
    }

    return "info";
  };

  const getStatusLabel = (status) => {
    if (status === "granted") return "Granted";
    if (status === "denied") return "Denied";
    return "Event";
  };

  const getLogTime = (log) => {
    const value = log.timestamp || log.created_at || log.time;

    if (!value) return "Unknown time";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString();
  };

  const getTodayCount = () => {
    const today = new Date().toDateString();

    return accessLogs.filter((log) => {
      const value = log.timestamp || log.created_at || log.time;
      if (!value) return false;

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;

      return date.toDateString() === today;
    }).length;
  };

  const grantedCount = accessLogs.filter(
    (log) => getLogStatus(log) === "granted"
  ).length;

  const deniedCount = accessLogs.filter(
    (log) => getLogStatus(log) === "denied"
  ).length;

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

  const getBuildingLabel = (log) => {
    return (
      log.building_name ||
      log.group_name ||
      log.door?.building_name ||
      groups.find((group) => String(group.id) === String(getLogBuildingId(log)))
        ?.name ||
      "Unknown building"
    );
  };

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div>
          <div className="pro-kicker">
            <i className="fas fa-history me-2"></i>
            Access Activity Monitoring
          </div>

          <h1>Access Logs</h1>

          <p>
            Review door unlock requests, granted access events, denied attempts,
            and access activity under your current admin scope.
          </p>
        </div>

        <div className="pro-hero-actions">
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={loadData}
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
          <strong>{currentAdmin?.name || "Admin"}</strong>
        </div>
      </div>

      <div className="pro-stats-grid">
        <div className="pro-stat-card">
          <div className="pro-stat-icon blue">
            <i className="fas fa-list"></i>
          </div>
          <div>
            <div className="pro-stat-value">{accessLogs.length}</div>
            <div className="pro-stat-label">Total Logs</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon green">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div className="pro-stat-value">{grantedCount}</div>
            <div className="pro-stat-label">Granted</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon red">
            <i className="fas fa-times-circle"></i>
          </div>
          <div>
            <div className="pro-stat-value">{deniedCount}</div>
            <div className="pro-stat-label">Denied</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon purple">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div>
            <div className="pro-stat-value">{getTodayCount()}</div>
            <div className="pro-stat-label">Today</div>
          </div>
        </div>
      </div>

      <div className="pro-toolbar">
        <div>
          <h5>Activity Records</h5>
          <p>Filter and review access events visible to this admin account.</p>
        </div>

        <div className="pro-toolbar-actions">
          <select
            className="form-select"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="all">All Buildings</option>

            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="pro-empty-state">
          <div>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading access logs...</p>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="pro-empty-state">
          <div>
            <div className="pro-empty-icon mx-auto">
              <i className="fas fa-history"></i>
            </div>
            <h5>No access logs found</h5>
            <p>No access activity is available for the selected building.</p>
          </div>
        </div>
      ) : (
        <div className="pro-log-list">
          {filteredLogs.map((log) => {
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
                      {getStatusLabel(status)}
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

                    <span>
                      <i className="fas fa-building me-1"></i>
                      {getBuildingLabel(log)}
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
    </div>
  );
}

export default Logs;
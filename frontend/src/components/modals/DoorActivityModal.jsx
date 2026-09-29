import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

function DoorActivityModal({ show, door, onHide, showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (show && door) {
      loadDoorLogs();
      setFilterType("all");
    }
  }, [show, door]);

  useEffect(() => {
    if (!show) return;

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onHide();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [show, onHide]);

  const loadDoorLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAccessLogs({ door_id: door.id, limit: 200 });
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      if (showToast) {
        showToast(error.message || "Failed to load door activity", "error");
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onHide();
    }
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
      rawStatus.includes("opened") ||
      rawStatus.includes("manual_unlock")
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

  const getStatusIcon = (status) => {
    if (status === "granted") return "fas fa-check-circle";
    if (status === "denied") return "fas fa-times-circle";
    return "fas fa-info-circle";
  };

  const getLogTime = (log) => {
    const value = log.timestamp || log.created_at || log.time;
    if (!value) return "Unknown time";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
  };

  const getRelativeTime = (log) => {
    const value = log.timestamp || log.created_at || log.time;
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return "";
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

  const getFilteredLogs = () => {
    if (filterType === "all") return logs;
    return logs.filter((log) => getLogStatus(log) === filterType);
  };

  const grantedCount = logs.filter((l) => getLogStatus(l) === "granted").length;
  const deniedCount = logs.filter((l) => getLogStatus(l) === "denied").length;

  const getTodayCount = () => {
    const today = new Date().toDateString();
    return logs.filter((log) => {
      const value = log.timestamp || log.created_at || log.time;
      if (!value) return false;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      return date.toDateString() === today;
    }).length;
  };

  const filteredLogs = getFilteredLogs();

  if (!show || !door) return null;

  return (
    <>
      <div
        className="modal fade show tenant-detail-modal"
        style={{ display: "block" }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={handleBackdropClick}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content door-activity-modal">
            {/* Header */}
            <div className="modal-header">
              <div>
                <h5 className="modal-title">
                  <i className="fas fa-chart-line me-2"></i>
                  Door Activity
                </h5>
                <small>{door.name}</small>
              </div>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onHide}
              ></button>
            </div>

            <div className="modal-body">
              {/* Stats Summary */}
              <div className="door-activity-stats">
                <div className="door-activity-stat-card">
                  <div className="door-activity-stat-icon total">
                    <i className="fas fa-list"></i>
                  </div>
                  <div className="door-activity-stat-info">
                    <div className="door-activity-stat-value">{logs.length}</div>
                    <div className="door-activity-stat-label">Total</div>
                  </div>
                </div>

                <div className="door-activity-stat-card">
                  <div className="door-activity-stat-icon granted">
                    <i className="fas fa-check"></i>
                  </div>
                  <div className="door-activity-stat-info">
                    <div className="door-activity-stat-value">{grantedCount}</div>
                    <div className="door-activity-stat-label">Granted</div>
                  </div>
                </div>

                <div className="door-activity-stat-card">
                  <div className="door-activity-stat-icon denied">
                    <i className="fas fa-times"></i>
                  </div>
                  <div className="door-activity-stat-info">
                    <div className="door-activity-stat-value">{deniedCount}</div>
                    <div className="door-activity-stat-label">Denied</div>
                  </div>
                </div>

                <div className="door-activity-stat-card">
                  <div className="door-activity-stat-icon today">
                    <i className="fas fa-calendar-day"></i>
                  </div>
                  <div className="door-activity-stat-info">
                    <div className="door-activity-stat-value">{getTodayCount()}</div>
                    <div className="door-activity-stat-label">Today</div>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="door-activity-toolbar">
                <div className="door-activity-filters">
                  <button
                    type="button"
                    className={`door-activity-filter-btn ${filterType === "all" ? "active" : ""}`}
                    onClick={() => setFilterType("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`door-activity-filter-btn granted ${filterType === "granted" ? "active" : ""}`}
                    onClick={() => setFilterType("granted")}
                  >
                    <i className="fas fa-check me-1"></i>Granted
                  </button>
                  <button
                    type="button"
                    className={`door-activity-filter-btn denied ${filterType === "denied" ? "active" : ""}`}
                    onClick={() => setFilterType("denied")}
                  >
                    <i className="fas fa-times me-1"></i>Denied
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-light"
                  onClick={loadDoorLogs}
                  disabled={loading}
                >
                  <i className={`fas fa-sync-alt me-1 ${loading ? "fa-spin" : ""}`}></i>
                  Refresh
                </button>
              </div>

              {/* Logs List */}
              {loading ? (
                <div className="door-activity-empty">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Loading activity records...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="door-activity-empty">
                  <div className="door-activity-empty-icon">
                    <i className={filterType !== "all" ? "fas fa-filter" : "fas fa-clock"}></i>
                  </div>
                  <h6>
                    {filterType !== "all"
                      ? `No ${filterType} events found`
                      : "No activity records"}
                  </h6>
                  <p>
                    {filterType !== "all"
                      ? "Try selecting a different filter."
                      : "No access events have been recorded for this door yet."}
                  </p>
                </div>
              ) : (
                <div className="door-activity-list">
                  {filteredLogs.map((log) => {
                    const status = getLogStatus(log);
                    const relTime = getRelativeTime(log);

                    return (
                      <div key={log.id} className={`door-activity-row ${status}`}>
                        <div className={`door-activity-indicator ${status}`}>
                          <i className={getStatusIcon(status)}></i>
                        </div>

                        <div className="door-activity-content">
                          <div className="door-activity-header">
                            <span className="door-activity-title">
                              {getLogTitle(log)}
                            </span>
                            <span className={`door-activity-badge ${status}`}>
                              {getStatusLabel(status)}
                            </span>
                          </div>

                          <div className="door-activity-meta">
                            <span>
                              <i className="fas fa-user me-1"></i>
                              {getUserLabel(log)}
                            </span>

                            {log.similarity_score != null && (
                              <span>
                                <i className="fas fa-percentage me-1"></i>
                                {(log.similarity_score * 100).toFixed(1)}% match
                              </span>
                            )}

                            {log.details && (
                              <span className="door-activity-details-text">
                                <i className="fas fa-info-circle me-1"></i>
                                {log.details}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="door-activity-time">
                          {relTime && (
                            <span className="door-activity-relative">{relTime}</span>
                          )}
                          <span className="door-activity-absolute">
                            {getLogTime(log)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="door-activity-footer-info">
                <i className="fas fa-info-circle me-1"></i>
                Showing {filteredLogs.length} of {logs.length} records
              </div>
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={onHide}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
}

export default DoorActivityModal;

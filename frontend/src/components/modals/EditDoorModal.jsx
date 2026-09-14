import React, { useEffect, useState } from "react";

function EditDoorModal({ show, door, groups, onHide, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    ip_address: "",
    port: 80,
    status: "online",
  });

  useEffect(() => {
    if (show && door) {
      setFormData({
        name: door.name || "",
        location: door.location || "",
        ip_address: door.ip_address || "",
        port: door.port || 80,
        status: door.status || "online",
      });
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

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(door.id, formData);
  };

  if (!show || !door) return null;

  const statusOptions = [
    { value: "online", label: "Online", icon: "fa-circle-check", color: "#22c55e" },
    { value: "offline", label: "Offline", icon: "fa-circle-xmark", color: "#ef4444" },
    { value: "locked", label: "Locked", icon: "fa-lock", color: "#f59e0b" },
    { value: "unlocked", label: "Unlocked", icon: "fa-lock-open", color: "#3b82f6" },
    { value: "error", label: "Error", icon: "fa-triangle-exclamation", color: "#dc2626" },
  ];

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-pen-to-square me-2"></i>Edit Door
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onHide}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label text-muted small">Door ID</label>
                  <div className="form-control" style={{ opacity: 0.7, cursor: "not-allowed" }}>
                    {door.id}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Door Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Main Entrance"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({ ...formData, name: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Ground Floor"
                    value={formData.location}
                    onChange={(event) =>
                      setFormData({ ...formData, location: event.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-signal me-1"></i>
                    Door Status
                  </label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(event) =>
                      setFormData({ ...formData, status: event.target.value })
                    }
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <small className="form-text text-muted">
                    Access is denied when status is <strong>offline</strong> or <strong>error</strong>.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-network-wired me-1"></i>
                    Controller IP Address
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 192.168.1.100"
                    value={formData.ip_address}
                    onChange={(event) =>
                      setFormData({ ...formData, ip_address: event.target.value })
                    }
                  />
                  <small className="form-text text-muted">
                    IP address of the physical door controller. Leave empty to simulate.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-plug me-1"></i>
                    Controller Port
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="80"
                    min="1"
                    max="65535"
                    value={formData.port}
                    onChange={(event) =>
                      setFormData({ ...formData, port: parseInt(event.target.value) || 80 })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={onHide}
                >
                  Cancel
                </button>

                <button type="submit" className="btn btn-gradient">
                  <i className="fas fa-save me-2"></i>Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
}

export default EditDoorModal;

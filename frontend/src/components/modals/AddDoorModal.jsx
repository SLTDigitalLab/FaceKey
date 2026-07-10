import React, { useEffect, useState } from "react";

function AddDoorModal({ show, groups, onHide, onSubmit }) {
  const getInitialFormData = () => ({
    name: "",
    location: "",
    group_id: "",
    ip_address: "",
    port: "80",
  });

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (show) {
      setFormData(getInitialFormData());
    }
  }, [show]);

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

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onHide();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
    setFormData(getInitialFormData());
  };

  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={handleBackdropClick}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-door-open me-2"></i>Add Door
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
                  <label className="form-label">Building</label>
                  <select
                    className="form-select"
                    value={formData.group_id}
                    onChange={(event) =>
                      setFormData({ ...formData, group_id: event.target.value })
                    }
                    required
                  >
                    <option value="">Select a building</option>

                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-7 mb-3">
                    <label className="form-label">IP Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="192.168.1.100"
                      value={formData.ip_address}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          ip_address: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-md-5 mb-3">
                    <label className="form-label">Port</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="80"
                      value={formData.port}
                      onChange={(event) =>
                        setFormData({ ...formData, port: event.target.value })
                      }
                    />
                  </div>
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
                  Add Door
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

export default AddDoorModal;
import React, { useEffect, useState } from "react";

function AddBuildingModal({
  show,
  onHide,
  onSubmit,
  tenants = [],
  currentAdmin = null,
}) {
  const getInitialFormData = () => ({
    name: "",
    description: "",
    color: "#667eea",
    icon: "Office Building",
    tenant_id: "",

    default_admin: {
      company_user_id: "",
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  const [formData, setFormData] = useState(getInitialFormData());



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

  const iconOptions = [
    "Office Building",
    "Apartment",
    "Factory",
    "Warehouse",
    "School",
    "Hospital",
    "Hotel",
    "Shopping Mall",
  ];

  const isSuperAdmin = currentAdmin?.role === "super_admin";


  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onHide();
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDefaultAdminChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      default_admin: {
        ...prev.default_admin,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSuperAdmin && !formData.tenant_id) {
      alert("Please select a tenant for this building");
      return;
    }

    const cleanCompanyUserId = formData.default_admin.company_user_id.trim();

    if (!cleanCompanyUserId) {
      alert("Please enter a company user ID");
      return;
    }

    if (!formData.default_admin.name.trim()) {
      alert("Please enter building admin name");
      return;
    }

    if (!formData.default_admin.username.trim()) {
      alert("Please enter building admin username");
      return;
    }

    if (!formData.default_admin.password) {
      alert("Please enter building admin password");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
      icon: formData.icon,
      tenant_id: isSuperAdmin ? formData.tenant_id : null,
      default_admin: {
        company_user_id: cleanCompanyUserId,
        name: formData.default_admin.name.trim(),
        email: formData.default_admin.email.trim(),
        username: formData.default_admin.username.trim(),
        password: formData.default_admin.password,
      },
    };

    onSubmit(payload);
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
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-building me-2"></i>Add Building
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onHide}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <h6 className="mb-3">Building Details</h6>

                {isSuperAdmin && (
                  <div className="mb-3">
                    <label className="form-label">Tenant</label>
                    <select
                      className="form-select"
                      value={formData.tenant_id}
                      onChange={(e) => handleChange("tenant_id", e.target.value)}
                      required
                    >
                      <option value="">Select tenant</option>

                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Building Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Main Office"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Color</label>
                    <div className="color-picker-wrapper">
                      <input
                        type="color"
                        className="form-control color-picker-input"
                        value={formData.color}
                        onChange={(e) => handleChange("color", e.target.value)}
                      />

                      <div
                        className="color-preview"
                        style={{ background: formData.color }}
                      ></div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Icon</label>
                    <select
                      className="form-select"
                      value={formData.icon}
                      onChange={(e) => handleChange("icon", e.target.value)}
                    >
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr className="my-4" />

                <h6 className="mb-3">Default Building Admin</h6>

                <div className="mb-3">
                  <label className="form-label">Company User ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., EMP001"
                    value={formData.default_admin.company_user_id}
                    onChange={(e) =>
                      handleDefaultAdminChange("company_user_id", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Admin Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Senath"
                    value={formData.default_admin.name}
                    onChange={(e) =>
                      handleDefaultAdminChange("name", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Admin Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g., buildingadmin@slt.lk"
                    value={formData.default_admin.email}
                    onChange={(e) =>
                      handleDefaultAdminChange("email", e.target.value)
                    }
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., buildingadminmain"
                      value={formData.default_admin.username}
                      onChange={(e) =>
                        handleDefaultAdminChange("username", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter password"
                      value={formData.default_admin.password}
                      onChange={(e) =>
                        handleDefaultAdminChange("password", e.target.value)
                      }
                      required
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
                  Create Building
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

export default AddBuildingModal;
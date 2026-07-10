import React, { useEffect, useState } from "react";

function AddTenantModal({ show, onHide, onSubmit }) {
  const getInitialFormData = () => ({
    name: "",
    code: "",
    description: "",
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

  const normalizeTenantCode = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const tenantCode = normalizeTenantCode(formData.code);

    if (!formData.name.trim()) {
      alert("Please enter tenant name");
      return;
    }

    if (!tenantCode) {
      alert("Please enter tenant code");
      return;
    }

    if (!formData.default_admin.company_user_id.trim()) {
      alert("Please enter default tenant admin company user ID");
      return;
    }

    if (!formData.default_admin.name.trim()) {
      alert("Please enter default tenant admin name");
      return;
    }

    if (!formData.default_admin.username.trim()) {
      alert("Please enter default tenant admin username");
      return;
    }

    if (!formData.default_admin.password) {
      alert("Please enter default tenant admin password");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: tenantCode,
      description: formData.description.trim(),
      default_admin: {
        company_user_id: formData.default_admin.company_user_id.trim(),
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
        onClick={handleBackdropClick}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-sitemap me-2"></i>Add Tenant
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onHide}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <h6 className="mb-3">Tenant Details</h6>

                <div className="mb-3">
                  <label className="form-label">Tenant Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., SLT Interns"
                    value={formData.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Tenant Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., slt_interns"
                    value={formData.code}
                    onChange={(event) => handleChange("code", event.target.value)}
                    required
                  />
                  <small className="text-muted">
                    Spaces will be converted to underscores automatically.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(event) =>
                      handleChange("description", event.target.value)
                    }
                  />
                </div>

                <hr className="my-4" />

                <h6 className="mb-3">Default Tenant Admin</h6>

                <div className="mb-3">
                  <label className="form-label">Company User ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., TENANT-ADMIN-001"
                    value={formData.default_admin.company_user_id}
                    onChange={(event) =>
                      handleDefaultAdminChange(
                        "company_user_id",
                        event.target.value
                      )
                    }
                    required
                  />
                  <small className="text-muted">
                    Tenant admin company ID can be any company ID. InSP format is
                    not required here.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Admin Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Default Tenant Admin"
                    value={formData.default_admin.name}
                    onChange={(event) =>
                      handleDefaultAdminChange("name", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Admin Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g., tenantadmin@slt.lk"
                    value={formData.default_admin.email}
                    onChange={(event) =>
                      handleDefaultAdminChange("email", event.target.value)
                    }
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., tenantadminmain"
                      value={formData.default_admin.username}
                      onChange={(event) =>
                        handleDefaultAdminChange("username", event.target.value)
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
                      onChange={(event) =>
                        handleDefaultAdminChange("password", event.target.value)
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
                  Create Tenant
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

export default AddTenantModal;
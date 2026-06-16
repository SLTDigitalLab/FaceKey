import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import AddTenantModal from "../modals/AddTenantModal";

function Tenants({ showToast }) {
  const [tenants, setTenants] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showAdminsModal, setShowAdminsModal] = useState(false);
  const [tenantAdmins, setTenantAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [adminForm, setAdminForm] = useState({
    company_user_id: "",
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const currentAdmin = api.getStoredAdminProfile();
  const isSuperAdmin = currentAdmin?.role === "super_admin";

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (!showAdminsModal) return;

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        closeAdminsModal();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showAdminsModal]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await api.getTenants();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast(error.message || "Failed to load tenants", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetAdminForm = () => {
    setAdminForm({
      company_user_id: "",
      name: "",
      email: "",
      username: "",
      password: "",
    });
  };

  const handleCreateTenant = async (data) => {
    try {
      const result = await api.createTenant(data);

      if (result.success) {
        showToast("Tenant created successfully", "success");
        setShowAddModal(false);
        loadTenants();
      }
    } catch (error) {
      showToast(error.message || "Failed to create tenant", "error");
    }
  };

  const openAdminsModal = async (tenant) => {
    setSelectedTenant(tenant);
    setShowAdminsModal(true);
    resetAdminForm();
    await loadTenantAdmins(tenant.id);
  };

  const closeAdminsModal = () => {
    setShowAdminsModal(false);
    setSelectedTenant(null);
    setTenantAdmins([]);
    resetAdminForm();
  };

  const handleAdminsBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      closeAdminsModal();
    }
  };

  const loadTenantAdmins = async (tenantId) => {
    try {
      setAdminsLoading(true);
      const admins = await api.getTenantAdmins(tenantId);
      setTenantAdmins(Array.isArray(admins) ? admins : []);
    } catch (error) {
      showToast(error.message || "Failed to load tenant admins", "error");
      setTenantAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleAdminFormChange = (field, value) => {
    setAdminForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateTenantAdmin = async (event) => {
    event.preventDefault();

    if (!selectedTenant) return;

    if (!adminForm.company_user_id.trim()) {
      alert("Please enter company user ID");
      return;
    }

    if (!adminForm.name.trim()) {
      alert("Please enter admin name");
      return;
    }

    if (!adminForm.username.trim()) {
      alert("Please enter username");
      return;
    }

    if (!adminForm.password) {
      alert("Please enter password");
      return;
    }

    try {
      setAdminSaving(true);

      const result = await api.createTenantAdmin(selectedTenant.id, {
        company_user_id: adminForm.company_user_id.trim(),
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        username: adminForm.username.trim(),
        password: adminForm.password,
      });

      if (result.success) {
        showToast("Tenant admin created successfully", "success");
        resetAdminForm();
        loadTenantAdmins(selectedTenant.id);
      }
    } catch (error) {
      showToast(error.message || "Failed to create tenant admin", "error");
    } finally {
      setAdminSaving(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admin.is_default_admin) {
      alert("Default tenant admin cannot be deleted directly");
      return;
    }

    if (admin.id === currentAdmin?.id) {
      alert("You cannot delete your own admin account");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete admin "${admin.name}"?`
    );

    if (!confirmed) return;

    try {
      await api.deleteAdmin(admin.id);
      showToast("Tenant admin deleted successfully", "success");

      if (selectedTenant) {
        loadTenantAdmins(selectedTenant.id);
      }
    } catch (error) {
      showToast(error.message || "Failed to delete tenant admin", "error");
    }
  };

  const getActiveTenantsCount = () => {
    return tenants.filter((tenant) => tenant.is_active).length;
  };

  if (!isSuperAdmin) {
    return (
      <div className="tenant-access-denied">
        <div className="tenant-access-icon">
          <i className="fas fa-lock"></i>
        </div>
        <h4>Access Denied</h4>
        <p>Only super admin can manage tenants.</p>
      </div>
    );
  }

  return (
    <div className="tenants-page-pro">
      <div className="tenant-hero-pro">
        <div>
          <div className="tenant-kicker">
            <i className="fas fa-sitemap me-2"></i>
            Multi-Tenant Administration
          </div>

          <h1>Tenants</h1>

          <p>
            Manage tenant organizations, default tenant admins, and admin access
            ownership from one secure workspace.
          </p>
        </div>

        <div className="tenant-hero-actions">
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={loadTenants}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt me-2 ${loading ? "fa-spin" : ""}`}></i>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="btn btn-gradient"
            onClick={() => setShowAddModal(true)}
          >
            <i className="fas fa-plus me-2"></i>Add Tenant
          </button>
        </div>
      </div>

      <div className="tenant-stats-grid">
        <div className="tenant-stat-card">
          <div className="tenant-stat-icon blue">
            <i className="fas fa-sitemap"></i>
          </div>
          <div>
            <div className="tenant-stat-value">{tenants.length}</div>
            <div className="tenant-stat-label">Total Tenants</div>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-icon green">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div className="tenant-stat-value">{getActiveTenantsCount()}</div>
            <div className="tenant-stat-label">Active Tenants</div>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-icon purple">
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <div className="tenant-stat-value">
              {tenants.filter((tenant) => tenant.default_admin_id).length}
            </div>
            <div className="tenant-stat-label">Default Admins</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="tenant-empty-pro">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading tenants...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="tenant-empty-pro">
          <div className="tenant-empty-icon">
            <i className="fas fa-sitemap"></i>
          </div>
          <h5>No tenants found</h5>
          <p>Create your first tenant to start managing building access.</p>
        </div>
      ) : (
        <div className="tenant-card-grid-pro">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="tenant-card-pro">
              <div className="tenant-card-top">
                <div className="tenant-card-icon">
                  <i className="fas fa-building-user"></i>
                </div>

                <span
                  className={`tenant-status-badge ${
                    tenant.is_active ? "active" : "inactive"
                  }`}
                >
                  {tenant.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="tenant-card-body">
                <h3>{tenant.name}</h3>
                <p className="tenant-code">{tenant.code}</p>

                <p className="tenant-description">
                  {tenant.description || "No description provided for this tenant."}
                </p>

                <div className="tenant-meta-box">
                  <div>
                    <span>Tenant ID</span>
                    <strong>{tenant.id}</strong>
                  </div>

                  <div>
                    <span>Default Admin</span>
                    <strong>{tenant.default_admin_id || "Not assigned"}</strong>
                  </div>
                </div>
              </div>

              <div className="tenant-card-footer">
                <button
                  type="button"
                  className="tenant-manage-btn"
                  onClick={() => openAdminsModal(tenant)}
                >
                  <i className="fas fa-user-shield me-2"></i>
                  Manage Admins
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddTenantModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleCreateTenant}
      />

      {showAdminsModal && selectedTenant && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            onClick={handleAdminsBackdropClick}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content tenant-admin-modal-pro">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">
                      <i className="fas fa-user-shield me-2"></i>
                      Tenant Admins
                    </h5>
                    <small>{selectedTenant.name}</small>
                  </div>

                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeAdminsModal}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row g-4">
                    <div className="col-lg-5">
                      <div className="tenant-form-panel">
                        <h6>
                          <i className="fas fa-user-plus me-2"></i>
                          Add Tenant Admin
                        </h6>

                        <form onSubmit={handleCreateTenantAdmin}>
                          <div className="mb-3">
                            <label className="form-label">Company User ID</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., TENANT-ADMIN-002"
                              value={adminForm.company_user_id}
                              onChange={(e) =>
                                handleAdminFormChange(
                                  "company_user_id",
                                  e.target.value
                                )
                              }
                              required
                            />
                            <small className="text-muted">
                              Tenant admin ID can be any company ID. InSP format
                              is not required.
                            </small>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Admin Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., HR Admin"
                              value={adminForm.name}
                              onChange={(e) =>
                                handleAdminFormChange("name", e.target.value)
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
                              value={adminForm.email}
                              onChange={(e) =>
                                handleAdminFormChange("email", e.target.value)
                              }
                            />
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Username</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., hradmin"
                                value={adminForm.username}
                                onChange={(e) =>
                                  handleAdminFormChange(
                                    "username",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>

                            <div className="col-md-6 mb-3">
                              <label className="form-label">Password</label>
                              <input
                                type="password"
                                className="form-control"
                                placeholder="Password"
                                value={adminForm.password}
                                onChange={(e) =>
                                  handleAdminFormChange(
                                    "password",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn btn-gradient w-100"
                            disabled={adminSaving}
                          >
                            {adminSaving ? "Creating..." : "Create Admin"}
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="col-lg-7">
                      <div className="tenant-admin-list-panel">
                        <div className="tenant-admin-list-header">
                          <h6>
                            <i className="fas fa-users-cog me-2"></i>
                            Admin Accounts
                          </h6>
                          <span>{tenantAdmins.length} admins</span>
                        </div>

                        {adminsLoading ? (
                          <div className="tenant-empty-pro compact">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : tenantAdmins.length === 0 ? (
                          <div className="tenant-empty-pro compact">
                            <p>No tenant admins found.</p>
                          </div>
                        ) : (
                          <div className="tenant-admin-list">
                            {tenantAdmins.map((admin) => (
                              <div key={admin.id} className="tenant-admin-row">
                                <div className="tenant-admin-avatar">
                                  {admin.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase() || "A"}
                                </div>

                                <div className="tenant-admin-info">
                                  <div className="tenant-admin-name">
                                    {admin.name}
                                    {admin.is_default_admin && (
                                      <span className="tenant-default-badge">
                                        Default
                                      </span>
                                    )}
                                  </div>

                                  <div className="tenant-admin-meta">
                                    {admin.company_user_id} • @{admin.username}
                                  </div>

                                  <div className="tenant-admin-email">
                                    {admin.email || "No email"}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={
                                    admin.is_default_admin ||
                                    admin.id === currentAdmin?.id
                                  }
                                  onClick={() => handleDeleteAdmin(admin)}
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    onClick={closeAdminsModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}

export default Tenants;
// import React, { useEffect, useState } from "react";
// import { api } from "../../services/api";
// import AddTenantModal from "../modals/AddTenantModal";

// function Tenants({ showToast }) {
//   const [tenants, setTenants] = useState([]);
//   const [showAddModal, setShowAddModal] = useState(false);

//   const [selectedTenant, setSelectedTenant] = useState(null);
//   const [showAdminsModal, setShowAdminsModal] = useState(false);
//   const [tenantAdmins, setTenantAdmins] = useState([]);
//   const [adminsLoading, setAdminsLoading] = useState(false);
//   const [adminSaving, setAdminSaving] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const [adminForm, setAdminForm] = useState({
//     company_user_id: "",
//     name: "",
//     email: "",
//     username: "",
//     password: "",
//   });

//   const currentAdmin = api.getStoredAdminProfile();
//   const isSuperAdmin = currentAdmin?.role === "super_admin";

//   useEffect(() => {
//     loadTenants();
//   }, []);

//   useEffect(() => {
//     if (!showAdminsModal) return;

//     const handleEscapeKey = (event) => {
//       if (event.key === "Escape") {
//         closeAdminsModal();
//       }
//     };

//     document.addEventListener("keydown", handleEscapeKey);

//     return () => {
//       document.removeEventListener("keydown", handleEscapeKey);
//     };
//   }, [showAdminsModal]);

//   const loadTenants = async () => {
//     try {
//       setLoading(true);
//       const data = await api.getTenants();
//       setTenants(Array.isArray(data) ? data : []);
//     } catch (error) {
//       showToast(error.message || "Failed to load tenants", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetAdminForm = () => {
//     setAdminForm({
//       company_user_id: "",
//       name: "",
//       email: "",
//       username: "",
//       password: "",
//     });
//   };

//   const handleCreateTenant = async (data) => {
//     try {
//       const result = await api.createTenant(data);

//       if (result.success) {
//         showToast("Tenant created successfully", "success");
//         setShowAddModal(false);
//         loadTenants();
//       }
//     } catch (error) {
//       showToast(error.message || "Failed to create tenant", "error");
//     }
//   };

//   const openAdminsModal = async (tenant) => {
//     setSelectedTenant(tenant);
//     setShowAdminsModal(true);
//     resetAdminForm();
//     await loadTenantAdmins(tenant.id);
//   };

//   const closeAdminsModal = () => {
//     setShowAdminsModal(false);
//     setSelectedTenant(null);
//     setTenantAdmins([]);
//     resetAdminForm();
//   };

//   const handleAdminsBackdropClick = (event) => {
//     if (event.target === event.currentTarget) {
//       closeAdminsModal();
//     }
//   };

//   const loadTenantAdmins = async (tenantId) => {
//     try {
//       setAdminsLoading(true);
//       const admins = await api.getTenantAdmins(tenantId);
//       setTenantAdmins(Array.isArray(admins) ? admins : []);
//     } catch (error) {
//       showToast(error.message || "Failed to load tenant admins", "error");
//       setTenantAdmins([]);
//     } finally {
//       setAdminsLoading(false);
//     }
//   };

//   const handleAdminFormChange = (field, value) => {
//     setAdminForm((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleCreateTenantAdmin = async (event) => {
//     event.preventDefault();

//     if (!selectedTenant) return;

//     if (!adminForm.company_user_id.trim()) {
//       alert("Please enter company user ID");
//       return;
//     }

//     if (!adminForm.name.trim()) {
//       alert("Please enter admin name");
//       return;
//     }

//     if (!adminForm.username.trim()) {
//       alert("Please enter username");
//       return;
//     }

//     if (!adminForm.password) {
//       alert("Please enter password");
//       return;
//     }

//     try {
//       setAdminSaving(true);

//       const result = await api.createTenantAdmin(selectedTenant.id, {
//         company_user_id: adminForm.company_user_id.trim(),
//         name: adminForm.name.trim(),
//         email: adminForm.email.trim(),
//         username: adminForm.username.trim(),
//         password: adminForm.password,
//       });

//       if (result.success) {
//         showToast("Tenant admin created successfully", "success");
//         resetAdminForm();
//         loadTenantAdmins(selectedTenant.id);
//       }
//     } catch (error) {
//       showToast(error.message || "Failed to create tenant admin", "error");
//     } finally {
//       setAdminSaving(false);
//     }
//   };

//   const handleDeleteAdmin = async (admin) => {
//     if (admin.is_default_admin) {
//       alert("Default tenant admin cannot be deleted directly");
//       return;
//     }

//     if (admin.id === currentAdmin?.id) {
//       alert("You cannot delete your own admin account");
//       return;
//     }

//     const confirmed = window.confirm(
//       `Are you sure you want to delete admin "${admin.name}"?`
//     );

//     if (!confirmed) return;

//     try {
//       await api.deleteAdmin(admin.id);
//       showToast("Tenant admin deleted successfully", "success");

//       if (selectedTenant) {
//         loadTenantAdmins(selectedTenant.id);
//       }
//     } catch (error) {
//       showToast(error.message || "Failed to delete tenant admin", "error");
//     }
//   };

//   const getActiveTenantsCount = () => {
//     return tenants.filter((tenant) => tenant.is_active).length;
//   };

//   if (!isSuperAdmin) {
//     return (
//       <div className="tenant-access-denied">
//         <div className="tenant-access-icon">
//           <i className="fas fa-lock"></i>
//         </div>
//         <h4>Access Denied</h4>
//         <p>Only super admin can manage tenants.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="tenants-page-pro">
//       <div className="tenant-hero-pro">
//         <div>
//           <div className="tenant-kicker">
//             <i className="fas fa-sitemap me-2"></i>
//             Multi-Tenant Administration
//           </div>

//           <h1>Tenants</h1>

//           <p>
//             Manage tenant organizations, default tenant admins, and admin access
//             ownership from one secure workspace.
//           </p>
//         </div>

//         <div className="tenant-hero-actions">
//           <button
//             type="button"
//             className="btn btn-outline-light"
//             onClick={loadTenants}
//             disabled={loading}
//           >
//             <i className={`fas fa-sync-alt me-2 ${loading ? "fa-spin" : ""}`}></i>
//             {loading ? "Refreshing..." : "Refresh"}
//           </button>

//           <button
//             type="button"
//             className="btn btn-gradient"
//             onClick={() => setShowAddModal(true)}
//           >
//             <i className="fas fa-plus me-2"></i>Add Tenant
//           </button>
//         </div>
//       </div>

//       <div className="tenant-stats-grid">
//         <div className="tenant-stat-card">
//           <div className="tenant-stat-icon blue">
//             <i className="fas fa-sitemap"></i>
//           </div>
//           <div>
//             <div className="tenant-stat-value">{tenants.length}</div>
//             <div className="tenant-stat-label">Total Tenants</div>
//           </div>
//         </div>

//         <div className="tenant-stat-card">
//           <div className="tenant-stat-icon green">
//             <i className="fas fa-check-circle"></i>
//           </div>
//           <div>
//             <div className="tenant-stat-value">{getActiveTenantsCount()}</div>
//             <div className="tenant-stat-label">Active Tenants</div>
//           </div>
//         </div>

//         <div className="tenant-stat-card">
//           <div className="tenant-stat-icon purple">
//             <i className="fas fa-user-shield"></i>
//           </div>
//           <div>
//             <div className="tenant-stat-value">
//               {tenants.filter((tenant) => tenant.default_admin_id).length}
//             </div>
//             <div className="tenant-stat-label">Default Admins</div>
//           </div>
//         </div>
//       </div>

//       {loading ? (
//         <div className="tenant-empty-pro">
//           <div className="spinner-border text-primary" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p>Loading tenants...</p>
//         </div>
//       ) : tenants.length === 0 ? (
//         <div className="tenant-empty-pro">
//           <div className="tenant-empty-icon">
//             <i className="fas fa-sitemap"></i>
//           </div>
//           <h5>No tenants found</h5>
//           <p>Create your first tenant to start managing building access.</p>
//         </div>
//       ) : (
//         <div className="tenant-card-grid-pro">
//           {tenants.map((tenant) => (
//             <div key={tenant.id} className="tenant-card-pro">
//               <div className="tenant-card-top">
//                 <div className="tenant-card-icon">
//                   <i className="fas fa-building-user"></i>
//                 </div>

//                 <span
//                   className={`tenant-status-badge ${
//                     tenant.is_active ? "active" : "inactive"
//                   }`}
//                 >
//                   {tenant.is_active ? "Active" : "Inactive"}
//                 </span>
//               </div>

//               <div className="tenant-card-body">
//                 <h3>{tenant.name}</h3>
//                 <p className="tenant-code">{tenant.code}</p>

//                 <p className="tenant-description">
//                   {tenant.description || "No description provided for this tenant."}
//                 </p>

//                 <div className="tenant-meta-box">
//                   <div>
//                     <span>Tenant ID</span>
//                     <strong>{tenant.id}</strong>
//                   </div>

//                   <div>
//                     <span>Default Admin</span>
//                     <strong>{tenant.default_admin_id || "Not assigned"}</strong>
//                   </div>
//                 </div>
//               </div>

//               <div className="tenant-card-footer">
//                 <button
//                   type="button"
//                   className="tenant-manage-btn"
//                   onClick={() => openAdminsModal(tenant)}
//                 >
//                   <i className="fas fa-user-shield me-2"></i>
//                   Manage
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       <AddTenantModal
//         show={showAddModal}
//         onHide={() => setShowAddModal(false)}
//         onSubmit={handleCreateTenant}
//       />

//       {showAdminsModal && selectedTenant && (
//         <>
//           <div
//             className="modal fade show"
//             style={{ display: "block" }}
//             tabIndex="-1"
//             role="dialog"
//             aria-modal="true"
//             onClick={handleAdminsBackdropClick}
//           >
//             <div className="modal-dialog modal-xl modal-dialog-centered">
//               <div className="modal-content tenant-admin-modal-pro">
//                 <div className="modal-header">
//                   <div>
//                     <h5 className="modal-title">
//                       <i className="fas fa-user-shield me-2"></i>
//                       Tenant Admins
//                     </h5>
//                     <small>{selectedTenant.name}</small>
//                   </div>

//                   <button
//                     type="button"
//                     className="btn-close btn-close-white"
//                     onClick={closeAdminsModal}
//                   ></button>
//                 </div>

//                 <div className="modal-body">
//                   <div className="row g-4">
//                     <div className="col-lg-5">
//                       <div className="tenant-form-panel">
//                         <h6>
//                           <i className="fas fa-user-plus me-2"></i>
//                           Add Tenant Admin
//                         </h6>

//                         <form onSubmit={handleCreateTenantAdmin}>
//                           <div className="mb-3">
//                             <label className="form-label">Company User ID</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               placeholder="e.g., TENANT-ADMIN-002"
//                               value={adminForm.company_user_id}
//                               onChange={(e) =>
//                                 handleAdminFormChange(
//                                   "company_user_id",
//                                   e.target.value
//                                 )
//                               }
//                               required
//                             />
//                             <small className="text-muted">
//                               Tenant admin ID can be any company ID. InSP format
//                               is not required.
//                             </small>
//                           </div>

//                           <div className="mb-3">
//                             <label className="form-label">Admin Name</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               placeholder="e.g., HR Admin"
//                               value={adminForm.name}
//                               onChange={(e) =>
//                                 handleAdminFormChange("name", e.target.value)
//                               }
//                               required
//                             />
//                           </div>

//                           <div className="mb-3">
//                             <label className="form-label">Admin Email</label>
//                             <input
//                               type="email"
//                               className="form-control"
//                               placeholder="e.g., tenantadmin@slt.lk"
//                               value={adminForm.email}
//                               onChange={(e) =>
//                                 handleAdminFormChange("email", e.target.value)
//                               }
//                             />
//                           </div>

//                           <div className="row">
//                             <div className="col-md-6 mb-3">
//                               <label className="form-label">Username</label>
//                               <input
//                                 type="text"
//                                 className="form-control"
//                                 placeholder="e.g., hradmin"
//                                 value={adminForm.username}
//                                 onChange={(e) =>
//                                   handleAdminFormChange(
//                                     "username",
//                                     e.target.value
//                                   )
//                                 }
//                                 required
//                               />
//                             </div>

//                             <div className="col-md-6 mb-3">
//                               <label className="form-label">Password</label>
//                               <input
//                                 type="password"
//                                 className="form-control"
//                                 placeholder="Password"
//                                 value={adminForm.password}
//                                 onChange={(e) =>
//                                   handleAdminFormChange(
//                                     "password",
//                                     e.target.value
//                                   )
//                                 }
//                                 required
//                               />
//                             </div>
//                           </div>

//                           <button
//                             type="submit"
//                             className="btn btn-gradient w-100"
//                             disabled={adminSaving}
//                           >
//                             {adminSaving ? "Creating..." : "Create Admin"}
//                           </button>
//                         </form>
//                       </div>
//                     </div>

//                     <div className="col-lg-7">
//                       <div className="tenant-admin-list-panel">
//                         <div className="tenant-admin-list-header">
//                           <h6>
//                             <i className="fas fa-users-cog me-2"></i>
//                             Admin Accounts
//                           </h6>
//                           <span>{tenantAdmins.length} admins</span>
//                         </div>

//                         {adminsLoading ? (
//                           <div className="tenant-empty-pro compact">
//                             <div
//                               className="spinner-border text-primary"
//                               role="status"
//                             >
//                               <span className="visually-hidden">Loading...</span>
//                             </div>
//                           </div>
//                         ) : tenantAdmins.length === 0 ? (
//                           <div className="tenant-empty-pro compact">
//                             <p>No tenant admins found.</p>
//                           </div>
//                         ) : (
//                           <div className="tenant-admin-list">
//                             {tenantAdmins.map((admin) => (
//                               <div key={admin.id} className="tenant-admin-row">
//                                 <div className="tenant-admin-avatar">
//                                   {admin.name
//                                     ?.split(" ")
//                                     .map((n) => n[0])
//                                     .join("")
//                                     .slice(0, 2)
//                                     .toUpperCase() || "A"}
//                                 </div>

//                                 <div className="tenant-admin-info">
//                                   <div className="tenant-admin-name">
//                                     {admin.name}
//                                     {admin.is_default_admin && (
//                                       <span className="tenant-default-badge">
//                                         Default
//                                       </span>
//                                     )}
//                                   </div>

//                                   <div className="tenant-admin-meta">
//                                     {admin.company_user_id} • @{admin.username}
//                                   </div>

//                                   <div className="tenant-admin-email">
//                                     {admin.email || "No email"}
//                                   </div>
//                                 </div>

//                                 <button
//                                   type="button"
//                                   className="btn btn-sm btn-outline-danger"
//                                   disabled={
//                                     admin.is_default_admin ||
//                                     admin.id === currentAdmin?.id
//                                   }
//                                   onClick={() => handleDeleteAdmin(admin)}
//                                 >
//                                   Delete
//                                 </button>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="modal-footer">
//                   <button
//                     type="button"
//                     className="btn btn-outline-light"
//                     onClick={closeAdminsModal}
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="modal-backdrop fade show"></div>
//         </>
//       )}
//     </div>
//   );
// }

// export default Tenants;


//2nd code
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

  // New state for tenant details
  const [tenantBuildings, setTenantBuildings] = useState([]);
  const [tenantDoors, setTenantDoors] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('admins');

  // New state for search
  const [searchQuery, setSearchQuery] = useState('');

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
    setActiveTab('admins');
    setSearchQuery(''); // Reset search when modal opens
    resetAdminForm();
    
    // Load all tenant data
    await loadAllTenantData(tenant.id);
  };

  const loadAllTenantData = async (tenantId) => {
    setLoadingDetails(true);
    try {
      // Load admins
      await loadTenantAdmins(tenantId);
      
      // Load buildings
      await loadTenantBuildings(tenantId);
      
      // Load doors
      await loadTenantDoors(tenantId);
      
      // Load users
      await loadTenantUsers(tenantId);
    } catch (error) {
      showToast(error.message || "Failed to load tenant details", "error");
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeAdminsModal = () => {
    setShowAdminsModal(false);
    setSelectedTenant(null);
    setTenantAdmins([]);
    setTenantBuildings([]);
    setTenantDoors([]);
    setTenantUsers([]);
    setActiveTab('admins');
    setSearchQuery('');
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

  // New: Load tenant buildings
  const loadTenantBuildings = async (tenantId) => {
    try {
      const buildings = await api.getBuildingsByTenant(tenantId);
      setTenantBuildings(Array.isArray(buildings) ? buildings : []);
    } catch (error) {
      showToast(error.message || "Failed to load tenant buildings", "error");
      setTenantBuildings([]);
    }
  };

  // New: Load tenant doors
  const loadTenantDoors = async (tenantId) => {
    try {
      const doors = await api.getDoorsByTenant(tenantId);
      setTenantDoors(Array.isArray(doors) ? doors : []);
    } catch (error) {
      showToast(error.message || "Failed to load tenant doors", "error");
      setTenantDoors([]);
    }
  };

  // New: Load tenant users
  const loadTenantUsers = async (tenantId) => {
    try {
      const users = await api.getUsersByTenant(tenantId);
      setTenantUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      showToast(error.message || "Failed to load tenant users", "error");
      setTenantUsers([]);
    }
  };

  // Search filter function for tenants
  const filterTenantsBySearch = (items) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      // Search in tenant name
      if (item.name && item.name.toLowerCase().includes(query)) return true;
      // Search in tenant code
      if (item.code && item.code.toLowerCase().includes(query)) return true;
      // Search in description
      if (item.description && item.description.toLowerCase().includes(query)) return true;
      // Search in ID
      if (item.id && String(item.id).toLowerCase().includes(query)) return true;
      return false;
    });
  };

  // Get filtered tenants
  const getFilteredTenants = () => {
    return filterTenantsBySearch(tenants);
  };

  // Get count for display
  const getFilteredCount = () => getFilteredTenants().length;

  // Search filter functions for modal
  const filterBySearch = (items, searchFields) => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (!value) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  };

  // Get filtered data based on active tab
  const getFilteredAdmins = () => {
    return filterBySearch(tenantAdmins, ['name', 'email', 'username', 'company_user_id']);
  };

  const getFilteredBuildings = () => {
    return filterBySearch(tenantBuildings, ['name', 'description', 'id']);
  };

  const getFilteredDoors = () => {
    return filterBySearch(tenantDoors, ['name', 'location', 'building_name', 'ip_address', 'id']);
  };

  const getFilteredUsers = () => {
    return filterBySearch(tenantUsers, ['name', 'email', 'department', 'id']);
  };

  // Get count for each tab with search
  const getAdminsCount = () => getFilteredAdmins().length;
  const getBuildingsCount = () => getFilteredBuildings().length;
  const getDoorsCount = () => getFilteredDoors().length;
  const getUsersCount = () => getFilteredUsers().length;

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

      {/* Search Bar - Added here */}
      <div className="tenant-search-bar-main">
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search tenants by name, code, description, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              type="button"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="search-results-info">
            <i className="fas fa-filter me-1"></i>
            Showing {getFilteredCount()} of {tenants.length} tenants
          </div>
        )}
      </div>

      {loading ? (
        <div className="tenant-empty-pro">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading tenants...</p>
        </div>
      ) : getFilteredTenants().length === 0 ? (
        <div className="tenant-empty-pro">
          <div className="tenant-empty-icon">
            <i className={searchQuery ? "fas fa-search" : "fas fa-sitemap"}></i>
          </div>
          <h5>{searchQuery ? "No matching tenants found" : "No tenants found"}</h5>
          <p>
            {searchQuery
              ? "Try adjusting your search terms."
              : "Create your first tenant to start managing building access."}
          </p>
        </div>
      ) : (
        <div className="tenant-card-grid-pro">
          {getFilteredTenants().map((tenant) => (
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
                  Manage
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
            className="modal fade show tenant-detail-modal"
            style={{ display: "block" }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            onClick={handleAdminsBackdropClick}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">
                      <i className="fas fa-building-user me-2"></i>
                      Tenant Details
                    </h5>
                    <small>{selectedTenant.name} ({selectedTenant.code})</small>
                  </div>

                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeAdminsModal}
                  ></button>
                </div>

                <div className="modal-body">
                  {/* Search Bar - Existing modal search */}
                  <div className="tenant-search-bar">
                    <div className="search-input-wrapper">
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Search by name, ID, email, location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          className="search-clear-btn"
                          onClick={() => setSearchQuery('')}
                          type="button"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <div className="search-results-info">
                        <i className="fas fa-filter me-1"></i>
                        Filtered results shown
                      </div>
                    )}
                  </div>

                  {/* Tab Navigation */}
                  <ul className="nav nav-tabs tenant-detail-tabs" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'admins' ? 'active' : ''}`}
                        onClick={() => setActiveTab('admins')}
                        type="button"
                      >
                        <i className="fas fa-user-shield me-2"></i>
                        Admins <span className="tab-count">{getAdminsCount()}</span>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'buildings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('buildings')}
                        type="button"
                      >
                        <i className="fas fa-building me-2"></i>
                        Buildings <span className="tab-count">{getBuildingsCount()}</span>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'doors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('doors')}
                        type="button"
                      >
                        <i className="fas fa-door-open me-2"></i>
                        Doors <span className="tab-count">{getDoorsCount()}</span>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                        type="button"
                      >
                        <i className="fas fa-users me-2"></i>
                        Users <span className="tab-count">{getUsersCount()}</span>
                      </button>
                    </li>
                  </ul>

                  {/* Tab Content */}
                  <div className="tab-content tenant-detail-content">
                    {/* Admins Tab */}
                    {activeTab === 'admins' && (
                      <div className="tab-pane fade show active">
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
                                <span>{getAdminsCount()} admins</span>
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
                              ) : getFilteredAdmins().length === 0 ? (
                                <div className="tenant-empty-pro compact">
                                  {searchQuery ? (
                                    <>
                                      <div className="tenant-empty-icon">
                                        <i className="fas fa-search"></i>
                                      </div>
                                      <h6>No matching admins found</h6>
                                      <p>Try adjusting your search terms.</p>
                                    </>
                                  ) : (
                                    <p>No tenant admins found.</p>
                                  )}
                                </div>
                              ) : (
                                <div className="tenant-admin-list">
                                  {getFilteredAdmins().map((admin) => (
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
                    )}

                    {/* Buildings Tab */}
                    {activeTab === 'buildings' && (
                      <div className="tab-pane fade show active">
                        {loadingDetails ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading buildings...</p>
                          </div>
                        ) : getFilteredBuildings().length === 0 ? (
                          <div className="tenant-empty-pro compact">
                            <div className="tenant-empty-icon">
                              {searchQuery ? <i className="fas fa-search"></i> : <i className="fas fa-building"></i>}
                            </div>
                            <h6>{searchQuery ? "No matching buildings found" : "No buildings found"}</h6>
                            <p>{searchQuery ? "Try adjusting your search terms." : "This tenant doesn't have any buildings yet."}</p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {getFilteredBuildings().map((building) => (
                              <div key={building.id} className="col-md-6">
                                <div className="tenant-detail-card" style={{ borderLeft: `4px solid ${building.color || '#6c757d'}` }}>
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="card-title">
                                        <i className="fas fa-building me-2" style={{ color: building.color || '#6c757d' }}></i>
                                        {building.name}
                                      </h6>
                                      <div className="card-id">ID: {building.id}</div>
                                      {building.description && (
                                        <div className="card-description">{building.description}</div>
                                      )}
                                    </div>
                                    <span className={`badge ${building.is_active !== false ? 'bg-success' : 'bg-secondary'}`}>
                                      {building.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  <div className="card-meta">
                                    <span className="card-meta-item">
                                      <i className="fas fa-door-open"></i>
                                      {building.door_count || 0} doors
                                    </span>
                                    <span className="card-meta-item">
                                      <i className="fas fa-users"></i>
                                      {building.user_count || 0} users
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Doors Tab */}
                    {activeTab === 'doors' && (
                      <div className="tab-pane fade show active">
                        {loadingDetails ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading doors...</p>
                          </div>
                        ) : getFilteredDoors().length === 0 ? (
                          <div className="tenant-empty-pro compact">
                            <div className="tenant-empty-icon">
                              {searchQuery ? <i className="fas fa-search"></i> : <i className="fas fa-door-open"></i>}
                            </div>
                            <h6>{searchQuery ? "No matching doors found" : "No doors found"}</h6>
                            <p>{searchQuery ? "Try adjusting your search terms." : "This tenant doesn't have any doors yet."}</p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {getFilteredDoors().map((door) => (
                              <div key={door.id} className="col-md-6">
                                <div className="tenant-detail-card">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="card-title">
                                        <i className="fas fa-door-open me-2"></i>
                                        {door.name}
                                      </h6>
                                      <div className="card-id">Building: {door.building_name || 'N/A'}</div>
                                      {door.location && (
                                        <div className="card-description">
                                          <i className="fas fa-map-marker-alt me-1"></i>
                                          {door.location}
                                        </div>
                                      )}
                                    </div>
                                    <span className={`badge ${door.status === 'online' ? 'bg-success' : 'bg-danger'}`}>
                                      <i className={`fas fa-circle me-1 ${door.status === 'online' ? 'text-light' : ''}`}></i>
                                      {door.status || 'unknown'}
                                    </span>
                                  </div>
                                  <div className="card-meta">
                                    <span className="card-meta-item">
                                      <i className="fas fa-network-wired"></i>
                                      {door.ip_address || 'No IP'}
                                    </span>
                                    <span className="card-meta-item">
                                      <i className="fas fa-lock"></i>
                                      {door.is_locked !== undefined ? (door.is_locked ? 'Locked' : 'Unlocked') : 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                      <div className="tab-pane fade show active">
                        {loadingDetails ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading users...</p>
                          </div>
                        ) : getFilteredUsers().length === 0 ? (
                          <div className="tenant-empty-pro compact">
                            <div className="tenant-empty-icon">
                              {searchQuery ? <i className="fas fa-search"></i> : <i className="fas fa-users"></i>}
                            </div>
                            <h6>{searchQuery ? "No matching users found" : "No users found"}</h6>
                            <p>{searchQuery ? "Try adjusting your search terms." : "This tenant doesn't have any authorized users yet."}</p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {getFilteredUsers().map((user) => (
                              <div key={user.id} className="col-md-6">
                                <div className="tenant-detail-card">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="card-title">
                                        <i className="fas fa-user me-2"></i>
                                        {user.name}
                                      </h6>
                                      <div className="card-id">ID: {user.id}</div>
                                      {user.department && (
                                        <div className="card-description">
                                          <i className="fas fa-building me-1"></i>
                                          {user.department}
                                        </div>
                                      )}
                                    </div>
                                    <div className="d-flex gap-2">
                                      <span className={`badge ${user.is_active !== false ? 'bg-success' : 'bg-secondary'}`}>
                                        {user.is_active !== false ? 'Active' : 'Inactive'}
                                      </span>
                                      <span className={`badge ${user.face_registered ? 'bg-info' : 'bg-warning'}`}>
                                        <i className={`fas ${user.face_registered ? 'fa-check-circle' : 'fa-exclamation-circle'} me-1`}></i>
                                        {user.face_registered ? 'Face Registered' : 'No Face'}
                                      </span>
                                    </div>
                                  </div>
                                  {user.email && (
                                    <div className="card-meta" style={{ borderTop: 'none', paddingTop: 0, marginTop: '0.25rem' }}>
                                      <span className="card-meta-item">
                                        <i className="fas fa-envelope"></i>
                                        {user.email}
                                      </span>
                                    </div>
                                  )}
                                  {user.authorized_doors && user.authorized_doors.length > 0 && (
                                    <div className="card-meta">
                                      <span className="card-meta-item">
                                        <i className="fas fa-door-open"></i>
                                        Authorized for {user.authorized_doors.length} door(s)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
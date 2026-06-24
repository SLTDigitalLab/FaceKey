// import React, { useState, useEffect } from "react";
// import { api } from "../../services/api";

// function BuildingDetailsModal({
//   group,
//   doors,
//   show,
//   onHide,
//   onDelete,
//   showToast,
// }) {
//   const [activeTab, setActiveTab] = useState("doors");
//   const [buildingDoors, setBuildingDoors] = useState([]);
//   const [authorizedUsers, setAuthorizedUsers] = useState([]);
//   const [buildingAdmins, setBuildingAdmins] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [adminLoading, setAdminLoading] = useState(false);

//   const [adminForm, setAdminForm] = useState({
//     company_user_id: "",
//     name: "",
//     email: "",
//     username: "",
//     password: "",
//   });

//   const currentAdmin = api.getStoredAdminProfile();

//   useEffect(() => {
//     if (show && group) {
//       loadBuildingDetails();
//       loadBuildingAdmins();
//       resetAdminForm();
//       setActiveTab("doors");
//     }
//   }, [show, group]);

//   useEffect(() => {
//     if (!show) return;

//     const handleEscapeKey = (event) => {
//       if (event.key === "Escape") {
//         onHide();
//       }
//     };

//     document.addEventListener("keydown", handleEscapeKey);

//     return () => {
//       document.removeEventListener("keydown", handleEscapeKey);
//     };
//   }, [show, onHide]);

//   const handleBackdropClick = (event) => {
//     if (event.target === event.currentTarget) {
//       onHide();
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

//   const isValidInspFormat = (value) => {
//     const cleanValue = String(value || "").trim();
//     return /^InSP\/\d{4}\/\d+\/\d+$/.test(cleanValue);
//   };

//   const loadBuildingDetails = async () => {
//     try {
//       setLoading(true);

//       const data = await api.getBuildingDetails(group.id);

//       setBuildingDoors(data.doors_detail || []);
//       setAuthorizedUsers(data.users_detail || []);
//     } catch (error) {
//       console.error("Failed to load building details:", error);

//       if (showToast) {
//         showToast(error.message || "Failed to load building details", "error");
//       }

//       const groupDoors = doors.filter((door) => door.building_id === group.id);
//       setBuildingDoors(groupDoors);
//       setAuthorizedUsers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadBuildingAdmins = async () => {
//     try {
//       const admins = await api.getBuildingAdmins(group.id);
//       setBuildingAdmins(admins || []);
//     } catch (error) {
//       console.error("Failed to load building admins:", error);

//       if (showToast) {
//         showToast(error.message || "Failed to load building admins", "error");
//       }

//       setBuildingAdmins([]);
//     }
//   };

//   const handleAdminFormChange = (field, value) => {
//     setAdminForm((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleCreateBuildingAdmin = async (event) => {
//     event.preventDefault();

//     const cleanCompanyUserId = adminForm.company_user_id.trim();

//     if (!isValidInspFormat(cleanCompanyUserId)) {
//       alert(
//         "Building admin company user ID must be a valid InSP format. Example: InSP/2025/6953/566"
//       );
//       return;
//     }

//     if (!adminForm.name.trim()) {
//       alert("Please enter admin name");
//       return;
//     }

//     if (!adminForm.username.trim()) {
//       alert("Please enter admin username");
//       return;
//     }

//     if (!adminForm.password) {
//       alert("Please enter admin password");
//       return;
//     }

//     try {
//       setAdminLoading(true);

//       const result = await api.createBuildingAdmin(group.id, {
//         company_user_id: cleanCompanyUserId,
//         name: adminForm.name.trim(),
//         email: adminForm.email.trim(),
//         username: adminForm.username.trim(),
//         password: adminForm.password,
//       });

//       if (result.success) {
//         if (showToast) {
//           showToast("Building admin created successfully", "success");
//         }

//         resetAdminForm();
//         loadBuildingAdmins();
//       }
//     } catch (error) {
//       if (showToast) {
//         showToast(error.message || "Failed to create building admin", "error");
//       }
//     } finally {
//       setAdminLoading(false);
//     }
//   };

//   const handleDeleteAdmin = async (admin) => {
//     if (admin.is_default_admin) {
//       alert("Default building admin cannot be deleted directly");
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

//       if (showToast) {
//         showToast("Admin deleted successfully", "success");
//       }

//       loadBuildingAdmins();
//     } catch (error) {
//       if (showToast) {
//         showToast(error.message || "Failed to delete admin", "error");
//       }
//     }
//   };

//   const handleUnlockDoor = async (doorId, doorName) => {
//     try {
//       await api.unlockDoor(doorId);

//       if (showToast) {
//         showToast(`Door "${doorName}" unlocked successfully`, "success");
//       }
//     } catch (error) {
//       if (showToast) {
//         showToast(error.message || `Failed to unlock door "${doorName}"`, "error");
//       }
//     }
//   };

//   if (!show) return null;

//   return (
//     <>
//       <div
//         className="modal fade show"
//         style={{ display: "block" }}
//         tabIndex="-1"
//         role="dialog"
//         aria-modal="true"
//         onClick={handleBackdropClick}
//       >
//         <div className="modal-dialog modal-xl modal-dialog-centered">
//           <div className="modal-content building-details-modal">
//             <div className="modal-header">
//               <h5 className="modal-title text-white">
//                 <i className="fas fa-building me-2"></i>
//                 {group.name}
//               </h5>

//               <button
//                 type="button"
//                 className="btn-close btn-close-white"
//                 onClick={onHide}
//               ></button>
//             </div>

//             <div className="building-tabs">
//               <button
//                 type="button"
//                 className={`tab-button ${activeTab === "doors" ? "active" : ""}`}
//                 onClick={() => setActiveTab("doors")}
//               >
//                 <i className="fas fa-door-closed me-2"></i>Doors
//               </button>

//               <button
//                 type="button"
//                 className={`tab-button ${activeTab === "users" ? "active" : ""}`}
//                 onClick={() => setActiveTab("users")}
//               >
//                 <i className="fas fa-users me-2"></i>Authorized Users
//               </button>

//               <button
//                 type="button"
//                 className={`tab-button ${activeTab === "admins" ? "active" : ""}`}
//                 onClick={() => setActiveTab("admins")}
//               >
//                 <i className="fas fa-user-shield me-2"></i>Building Admins
//               </button>
//             </div>

//             <div className="modal-body">
//               {loading ? (
//                 <div className="text-center py-4">
//                   <div className="spinner-border text-primary" role="status">
//                     <span className="visually-hidden">Loading...</span>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   {activeTab === "doors" && (
//                     <div className="tab-content-doors">
//                       {buildingDoors.length === 0 ? (
//                         <p className="text-secondary text-center py-4">
//                           No doors configured for this building.
//                         </p>
//                       ) : (
//                         <div className="doors-grid">
//                           {buildingDoors.map((door) => (
//                             <div key={door.id} className="door-card-modal">
//                               <div className="door-card-icon">
//                                 <i className="fas fa-door-closed"></i>
//                               </div>

//                               <div className="door-card-info">
//                                 <div className="door-card-name">{door.name}</div>
//                                 <div className="door-card-location">
//                                   {door.location || "No location"}
//                                 </div>
//                               </div>

//                               <button
//                                 type="button"
//                                 className="btn-unlock"
//                                 onClick={() =>
//                                   handleUnlockDoor(door.id, door.name)
//                                 }
//                               >
//                                 <i className="fas fa-unlock me-1"></i>Unlock
//                               </button>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {activeTab === "users" && (
//                     <div className="tab-content-users">
//                       {authorizedUsers.length === 0 ? (
//                         <p className="text-secondary text-center py-4">
//                           No users authorized for this building.
//                         </p>
//                       ) : (
//                         <div className="users-list">
//                           {authorizedUsers.map((user) => (
//                             <div key={user.id} className="user-item-card">
//                               <div className="user-item-avatar">
//                                 {user.name
//                                   ?.split(" ")
//                                   .map((n) => n[0])
//                                   .join("")
//                                   .slice(0, 2)
//                                   .toUpperCase() || "U"}
//                               </div>

//                               <div className="user-item-info">
//                                 <div className="user-item-name">{user.name}</div>
//                                 <div className="user-item-details">
//                                   {user.id}{" "}
//                                   {user.department ? `• ${user.department}` : ""}
//                                 </div>
//                               </div>

//                               <div className="user-item-badge-active">Active</div>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {activeTab === "admins" && (
//                     <div className="tab-content-admins">
//                       <div className="row g-4">
//                         <div className="col-lg-5">
//                           <div className="glass-card p-3">
//                             <h6 className="mb-3">
//                               <i className="fas fa-user-plus me-2"></i>
//                               Add Building Admin
//                             </h6>

//                             <form onSubmit={handleCreateBuildingAdmin}>
//                               <div className="mb-3">
//                                 <label className="form-label">
//                                   Company User ID / InSP ID
//                                 </label>
//                                 <input
//                                   type="text"
//                                   className="form-control"
//                                   placeholder="e.g., InSP/2025/6953/566"
//                                   value={adminForm.company_user_id}
//                                   onChange={(e) =>
//                                     handleAdminFormChange(
//                                       "company_user_id",
//                                       e.target.value
//                                     )
//                                   }
//                                   required
//                                 />
//                                 <small className="text-muted">
//                                   Must be valid InSP format only.
//                                 </small>
//                               </div>

//                               <div className="mb-3">
//                                 <label className="form-label">Admin Name</label>
//                                 <input
//                                   type="text"
//                                   className="form-control"
//                                   placeholder="e.g., Senath"
//                                   value={adminForm.name}
//                                   onChange={(e) =>
//                                     handleAdminFormChange("name", e.target.value)
//                                   }
//                                   required
//                                 />
//                               </div>

//                               <div className="mb-3">
//                                 <label className="form-label">Admin Email</label>
//                                 <input
//                                   type="email"
//                                   className="form-control"
//                                   placeholder="e.g., buildingadmin@slt.lk"
//                                   value={adminForm.email}
//                                   onChange={(e) =>
//                                     handleAdminFormChange("email", e.target.value)
//                                   }
//                                 />
//                               </div>

//                               <div className="mb-3">
//                                 <label className="form-label">Username</label>
//                                 <input
//                                   type="text"
//                                   className="form-control"
//                                   placeholder="e.g., buildingadmin2"
//                                   value={adminForm.username}
//                                   onChange={(e) =>
//                                     handleAdminFormChange(
//                                       "username",
//                                       e.target.value
//                                     )
//                                   }
//                                   required
//                                 />
//                               </div>

//                               <div className="mb-3">
//                                 <label className="form-label">Password</label>
//                                 <input
//                                   type="password"
//                                   className="form-control"
//                                   placeholder="Enter password"
//                                   value={adminForm.password}
//                                   onChange={(e) =>
//                                     handleAdminFormChange(
//                                       "password",
//                                       e.target.value
//                                     )
//                                   }
//                                   required
//                                 />
//                               </div>

//                               <button
//                                 type="submit"
//                                 className="btn btn-gradient w-100"
//                                 disabled={adminLoading}
//                               >
//                                 {adminLoading ? "Creating..." : "Create Admin"}
//                               </button>
//                             </form>
//                           </div>
//                         </div>

//                         <div className="col-lg-7">
//                           <div className="glass-card p-3">
//                             <h6 className="mb-3">
//                               <i className="fas fa-users-cog me-2"></i>
//                               Building Admins
//                             </h6>

//                             {buildingAdmins.length === 0 ? (
//                               <p className="text-secondary text-center py-4">
//                                 No building admins found.
//                               </p>
//                             ) : (
//                               <div className="users-list">
//                                 {buildingAdmins.map((admin) => (
//                                   <div key={admin.id} className="user-item-card">
//                                     <div className="user-item-avatar">
//                                       {admin.name
//                                         ?.split(" ")
//                                         .map((n) => n[0])
//                                         .join("")
//                                         .slice(0, 2)
//                                         .toUpperCase() || "A"}
//                                     </div>

//                                     <div className="user-item-info">
//                                       <div className="user-item-name">
//                                         {admin.name}
//                                         {admin.is_default_admin && (
//                                           <span className="badge bg-primary ms-2">
//                                             Default
//                                           </span>
//                                         )}
//                                       </div>

//                                       <div className="user-item-details">
//                                         {admin.company_user_id} • @{admin.username}
//                                       </div>

//                                       <div className="user-item-details">
//                                         {admin.email || "No email"}
//                                       </div>
//                                     </div>

//                                     <button
//                                       type="button"
//                                       className="btn btn-sm btn-outline-danger"
//                                       disabled={
//                                         admin.is_default_admin ||
//                                         admin.id === currentAdmin?.id
//                                       }
//                                       onClick={() => handleDeleteAdmin(admin)}
//                                     >
//                                       Delete
//                                     </button>
//                                   </div>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>

//             <div className="modal-footer">
//               <button
//                 type="button"
//                 className="btn btn-outline-light"
//                 onClick={onHide}
//               >
//                 Close
//               </button>

//               {currentAdmin?.role !== "building_admin" && (
//                 <button
//                   type="button"
//                   className="btn btn-danger"
//                   onClick={() => onDelete(group.id)}
//                 >
//                   Delete Building
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="modal-backdrop fade show"></div>
//     </>
//   );
// }

// export default BuildingDetailsModal;


//2nd code
import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

function BuildingDetailsModal({
  group,
  doors,
  show,
  onHide,
  onDelete,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState("admins"); // Changed from "doors" to "admins"
  const [buildingDoors, setBuildingDoors] = useState([]);
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [buildingAdmins, setBuildingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);

  // New state for search
  const [searchQuery, setSearchQuery] = useState("");

  const [adminForm, setAdminForm] = useState({
    company_user_id: "",
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const currentAdmin = api.getStoredAdminProfile();

  useEffect(() => {
    if (show && group) {
      loadBuildingDetails();
      loadBuildingAdmins();
      resetAdminForm();
      setActiveTab("admins"); // Changed from "doors" to "admins"
      setSearchQuery("");
    }
  }, [show, group]);

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

  const resetAdminForm = () => {
    setAdminForm({
      company_user_id: "",
      name: "",
      email: "",
      username: "",
      password: "",
    });
  };

  const isValidInspFormat = (value) => {
    const cleanValue = String(value || "").trim();
    return /^InSP\/\d{4}\/\d+\/\d+$/.test(cleanValue);
  };

  const loadBuildingDetails = async () => {
    try {
      setLoading(true);

      const data = await api.getBuildingDetails(group.id);

      setBuildingDoors(data.doors_detail || []);
      setAuthorizedUsers(data.users_detail || []);
    } catch (error) {
      console.error("Failed to load building details:", error);

      if (showToast) {
        showToast(error.message || "Failed to load building details", "error");
      }

      const groupDoors = doors.filter((door) => door.building_id === group.id);
      setBuildingDoors(groupDoors);
      setAuthorizedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBuildingAdmins = async () => {
    try {
      const admins = await api.getBuildingAdmins(group.id);
      setBuildingAdmins(admins || []);
    } catch (error) {
      console.error("Failed to load building admins:", error);

      if (showToast) {
        showToast(error.message || "Failed to load building admins", "error");
      }

      setBuildingAdmins([]);
    }
  };

  // Search filter functions
  const filterBySearch = (items, searchFields) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (!value) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  };

  // Get filtered data based on active tab
  const getFilteredAdmins = () => {
    return filterBySearch(buildingAdmins, ["name", "email", "username", "company_user_id"]);
  };

  const getFilteredDoors = () => {
    return filterBySearch(buildingDoors, ["name", "location", "id", "ip_address"]);
  };

  const getFilteredUsers = () => {
    return filterBySearch(authorizedUsers, ["name", "email", "department", "id"]);
  };

  // Get count for each tab with search
  const getAdminsCount = () => getFilteredAdmins().length;
  const getDoorsCount = () => getFilteredDoors().length;
  const getUsersCount = () => getFilteredUsers().length;

  const handleAdminFormChange = (field, value) => {
    setAdminForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateBuildingAdmin = async (event) => {
    event.preventDefault();

    const cleanCompanyUserId = adminForm.company_user_id.trim();

    if (!isValidInspFormat(cleanCompanyUserId)) {
      alert(
        "Building admin company user ID must be a valid InSP format. Example: InSP/2025/6953/566"
      );
      return;
    }

    if (!adminForm.name.trim()) {
      alert("Please enter admin name");
      return;
    }

    if (!adminForm.username.trim()) {
      alert("Please enter admin username");
      return;
    }

    if (!adminForm.password) {
      alert("Please enter admin password");
      return;
    }

    try {
      setAdminLoading(true);

      const result = await api.createBuildingAdmin(group.id, {
        company_user_id: cleanCompanyUserId,
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        username: adminForm.username.trim(),
        password: adminForm.password,
      });

      if (result.success) {
        if (showToast) {
          showToast("Building admin created successfully", "success");
        }

        resetAdminForm();
        loadBuildingAdmins();
      }
    } catch (error) {
      if (showToast) {
        showToast(error.message || "Failed to create building admin", "error");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admin.is_default_admin) {
      alert("Default building admin cannot be deleted directly");
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

      if (showToast) {
        showToast("Admin deleted successfully", "success");
      }

      loadBuildingAdmins();
    } catch (error) {
      if (showToast) {
        showToast(error.message || "Failed to delete admin", "error");
      }
    }
  };

  const handleUnlockDoor = async (doorId, doorName) => {
    try {
      await api.unlockDoor(doorId);

      if (showToast) {
        showToast(`Door "${doorName}" unlocked successfully`, "success");
      }
    } catch (error) {
      if (showToast) {
        showToast(error.message || `Failed to unlock door "${doorName}"`, "error");
      }
    }
  };

  if (!show) return null;

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
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">
                  <i className="fas fa-building me-2"></i>
                  Building Details
                </h5>
                <small>{group.name}</small>
              </div>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onHide}
              ></button>
            </div>

            <div className="modal-body">
              {/* Search Bar */}
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
                      onClick={() => setSearchQuery("")}
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

              {/* Tab Navigation - Reordered: Admins, Doors, Users */}
              <ul className="nav nav-tabs tenant-detail-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === "admins" ? "active" : ""}`}
                    onClick={() => setActiveTab("admins")}
                    type="button"
                  >
                    <i className="fas fa-user-shield me-2"></i>
                    Admins <span className="tab-count">{getAdminsCount()}</span>
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === "doors" ? "active" : ""}`}
                    onClick={() => setActiveTab("doors")}
                    type="button"
                  >
                    <i className="fas fa-door-open me-2"></i>
                    Doors <span className="tab-count">{getDoorsCount()}</span>
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                    type="button"
                  >
                    <i className="fas fa-users me-2"></i>
                    Users <span className="tab-count">{getUsersCount()}</span>
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content tenant-detail-content">
                {/* Admins Tab - Now First */}
                {activeTab === "admins" && (
                  <div className="tab-pane fade show active">
                    <div className="row g-4">
                      <div className="col-lg-5">
                        <div className="tenant-form-panel">
                          <h6>
                            <i className="fas fa-user-plus me-2"></i>
                            Add Building Admin
                          </h6>

                          <form onSubmit={handleCreateBuildingAdmin}>
                            <div className="mb-3">
                              <label className="form-label">Company User ID / InSP ID</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., InSP/2025/6953/566"
                                value={adminForm.company_user_id}
                                onChange={(e) =>
                                  handleAdminFormChange("company_user_id", e.target.value)
                                }
                                required
                              />
                              <small className="text-muted">
                                Must be valid InSP format only.
                              </small>
                            </div>

                            <div className="mb-3">
                              <label className="form-label">Admin Name</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., Senath"
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
                                placeholder="e.g., buildingadmin@slt.lk"
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
                                  placeholder="e.g., buildingadmin2"
                                  value={adminForm.username}
                                  onChange={(e) =>
                                    handleAdminFormChange("username", e.target.value)
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
                                  value={adminForm.password}
                                  onChange={(e) =>
                                    handleAdminFormChange("password", e.target.value)
                                  }
                                  required
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="btn btn-gradient w-100"
                              disabled={adminLoading}
                            >
                              {adminLoading ? "Creating..." : "Create Admin"}
                            </button>
                          </form>
                        </div>
                      </div>

                      <div className="col-lg-7">
                        <div className="tenant-admin-list-panel">
                          <div className="tenant-admin-list-header">
                            <h6>
                              <i className="fas fa-users-cog me-2"></i>
                              Building Admins
                            </h6>
                            <span>{getAdminsCount()} admins</span>
                          </div>

                          {getFilteredAdmins().length === 0 ? (
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
                                <p>No building admins found.</p>
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
                                        <span className="tenant-default-badge">Default</span>
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
                                      admin.is_default_admin || admin.id === currentAdmin?.id
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

                {/* Doors Tab - Now Second */}
                {activeTab === "doors" && (
                  <div className="tab-pane fade show active">
                    {loading ? (
                      <div className="tenant-detail-loading">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p>Loading doors...</p>
                      </div>
                    ) : getFilteredDoors().length === 0 ? (
                      <div className="tenant-detail-empty">
                        <i className={searchQuery ? "fas fa-search" : "fas fa-door-open"}></i>
                        <h6>{searchQuery ? "No matching doors found" : "No doors found"}</h6>
                        <p>
                          {searchQuery
                            ? "Try adjusting your search terms."
                            : "This building doesn't have any doors yet."}
                        </p>
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
                                  <div className="card-id">ID: {door.id}</div>
                                  {door.location && (
                                    <div className="card-description">
                                      <i className="fas fa-map-marker-alt me-1"></i>
                                      {door.location}
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`badge ${
                                    door.status === "online" ? "bg-success" : "bg-danger"
                                  }`}
                                >
                                  <i
                                    className={`fas fa-circle me-1 ${
                                      door.status === "online" ? "text-light" : ""
                                    }`}
                                  ></i>
                                  {door.status || "unknown"}
                                </span>
                              </div>
                              <div className="card-meta">
                                <span className="card-meta-item">
                                  <i className="fas fa-network-wired"></i>
                                  {door.ip_address || "No IP"}
                                </span>
                                <span className="card-meta-item">
                                  <i className="fas fa-lock"></i>
                                  {door.is_locked !== undefined
                                    ? door.is_locked
                                      ? "Locked"
                                      : "Unlocked"
                                    : "Unknown"}
                                </span>
                                <button
                                  type="button"
                                  className="btn-unlock ms-auto"
                                  onClick={() => handleUnlockDoor(door.id, door.name)}
                                >
                                  <i className="fas fa-unlock me-1"></i>Unlock
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Users Tab - Now Third */}
                {activeTab === "users" && (
                  <div className="tab-pane fade show active">
                    {loading ? (
                      <div className="tenant-detail-loading">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p>Loading users...</p>
                      </div>
                    ) : getFilteredUsers().length === 0 ? (
                      <div className="tenant-detail-empty">
                        <i className={searchQuery ? "fas fa-search" : "fas fa-users"}></i>
                        <h6>{searchQuery ? "No matching users found" : "No users found"}</h6>
                        <p>
                          {searchQuery
                            ? "Try adjusting your search terms."
                            : "No users authorized for this building."}
                        </p>
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
                                  <span
                                    className={`badge ${
                                      user.is_active !== false ? "bg-success" : "bg-secondary"
                                    }`}
                                  >
                                    {user.is_active !== false ? "Active" : "Inactive"}
                                  </span>
                                  <span
                                    className={`badge ${
                                      user.face_registered ? "bg-info" : "bg-warning"
                                    }`}
                                  >
                                    <i
                                      className={`fas ${
                                        user.face_registered
                                          ? "fa-check-circle"
                                          : "fa-exclamation-circle"
                                      } me-1`}
                                    ></i>
                                    {user.face_registered ? "Face Registered" : "No Face"}
                                  </span>
                                </div>
                              </div>
                              {user.email && (
                                <div
                                  className="card-meta"
                                  style={{ borderTop: "none", paddingTop: 0, marginTop: "0.25rem" }}
                                >
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
              <button type="button" className="btn btn-outline-light" onClick={onHide}>
                Close
              </button>

              {currentAdmin?.role !== "building_admin" && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onDelete(group.id)}
                >
                  Delete Building
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
}

export default BuildingDetailsModal;
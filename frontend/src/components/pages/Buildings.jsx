// import React, { useEffect, useState } from "react";
// import { api } from "../../services/api";
// import AddBuildingModal from "../modals/AddBuildingModal";
// import BuildingDetailsModal from "../modals/BuildingDetailsModal";
// import ConfirmationModal from "../modals/ConfirmationModal";

// function Buildings({ showToast }) {
//   const [groups, setGroups] = useState([]);
//   const [doors, setDoors] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [tenants, setTenants] = useState([]);
//   const [currentAdmin, setCurrentAdmin] = useState(null);

//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [buildingToDelete, setBuildingToDelete] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);

//       const adminProfile = api.getStoredAdminProfile();
//       setCurrentAdmin(adminProfile);

//       const shouldLoadTenants = adminProfile?.role === "super_admin";

//       const [groupsData, doorsData, usersData, tenantsData] = await Promise.all([
//         api.getGroups(),
//         api.getDoors(),
//         api.getUsers(),
//         shouldLoadTenants ? api.getTenants() : Promise.resolve([]),
//       ]);

//       setGroups(Array.isArray(groupsData) ? groupsData : []);
//       setDoors(Array.isArray(doorsData) ? doorsData : []);
//       setUsers(Array.isArray(usersData) ? usersData : []);
//       setTenants(Array.isArray(tenantsData) ? tenantsData : []);
//     } catch (error) {
//       showToast(error.message || "Failed to load buildings", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateGroup = async (data) => {
//     try {
//       const result = await api.createGroup(data);

//       if (result.success || result.building) {
//         showToast("Building created successfully", "success");
//       } else {
//         showToast("Building created successfully", "success");
//       }

//       setShowAddModal(false);
//       loadData();
//     } catch (error) {
//       showToast(error.message || "Failed to create building", "error");
//     }
//   };

//   const handleDeleteGroup = async (groupId) => {
//     try {
//       await api.deleteGroup(groupId);

//       showToast("Building deleted successfully", "success");
//       setShowDetailsModal(false);
//       setSelectedGroup(null);
//       loadData();
//     } catch (error) {
//       showToast(error.message || "Failed to delete building", "error");
//     }
//   };

//   const handleBuildingClick = (group) => {
//     setSelectedGroup(group);
//     setShowDetailsModal(true);
//   };

//   const handleDeleteClick = (event, group) => {
//     event.stopPropagation();
//     setBuildingToDelete(group);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = async () => {
//     if (!buildingToDelete) return;

//     await handleDeleteGroup(buildingToDelete.id);
//     setShowDeleteModal(false);
//     setBuildingToDelete(null);
//   };

//   const getDoorCountForBuilding = (buildingId) => {
//     return doors.filter((door) => door.building_id === buildingId).length;
//   };

//   const getUserCountForBuilding = (buildingId) => {
//     const buildingDoorIds = doors
//       .filter((door) => door.building_id === buildingId)
//       .map((door) => door.id);

//     const uniqueUsers = new Set();

//     users.forEach((user) => {
//       if (
//         Array.isArray(user.authorized_doors) &&
//         user.authorized_doors.some((doorId) => buildingDoorIds.includes(doorId))
//       ) {
//         uniqueUsers.add(user.id);
//       }
//     });

//     return uniqueUsers.size;
//   };

//   const getTenantName = (tenantId) => {
//     if (!tenantId) return "Current tenant";

//     const tenant = tenants.find((item) => item.id === tenantId);
//     return tenant?.name || tenantId;
//   };

//   const getRoleScopeText = () => {
//     if (currentAdmin?.role === "super_admin") return "All tenant buildings";
//     if (currentAdmin?.role === "tenant_admin") return "Your tenant buildings";
//     if (currentAdmin?.role === "building_admin") return "Assigned building";
//     return "Available buildings";
//   };

//   const canCreateBuilding = currentAdmin?.role !== "building_admin";
//   const canDeleteBuilding = currentAdmin?.role !== "building_admin";

//   const activeBuildings = groups.filter((group) => group.is_active !== false).length;

//   return (
//     <div className="pro-page">
//       <div className="pro-hero">
//         <div>
//           <div className="pro-kicker">
//             <i className="fas fa-building-shield me-2"></i>
//             Building Access Management
//           </div>

//           <h1>Buildings</h1>

//           <p>
//             Manage building access zones, door controllers, assigned employees,
//             and building admin ownership under your current role scope.
//           </p>
//         </div>

//         <div className="pro-hero-actions">
//           <button
//             type="button"
//             className="btn btn-outline-light"
//             onClick={loadData}
//             disabled={loading}
//           >
//             <i className={`fas fa-sync-alt me-2 ${loading ? "fa-spin" : ""}`}></i>
//             {loading ? "Refreshing..." : "Refresh"}
//           </button>

//           {canCreateBuilding && (
//             <button
//               type="button"
//               className="btn btn-gradient"
//               onClick={() => setShowAddModal(true)}
//             >
//               <i className="fas fa-plus me-2"></i>Add Building
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="pro-scope-banner">
//         <div>
//           <span>Current scope</span>
//           <strong>{getRoleScopeText()}</strong>
//         </div>

//         <div>
//           <span>Logged in as</span>
//           <strong>{currentAdmin?.name || "Admin"}</strong>
//         </div>
//       </div>

//       <div className="pro-stats-grid">
//         <div className="pro-stat-card">
//           <div className="pro-stat-icon blue">
//             <i className="fas fa-building"></i>
//           </div>
//           <div>
//             <div className="pro-stat-value">{groups.length}</div>
//             <div className="pro-stat-label">Total Buildings</div>
//           </div>
//         </div>

//         <div className="pro-stat-card">
//           <div className="pro-stat-icon green">
//             <i className="fas fa-circle-check"></i>
//           </div>
//           <div>
//             <div className="pro-stat-value">{activeBuildings}</div>
//             <div className="pro-stat-label">Active Buildings</div>
//           </div>
//         </div>

//         <div className="pro-stat-card">
//           <div className="pro-stat-icon cyan">
//             <i className="fas fa-door-open"></i>
//           </div>
//           <div>
//             <div className="pro-stat-value">{doors.length}</div>
//             <div className="pro-stat-label">Total Doors</div>
//           </div>
//         </div>

//         <div className="pro-stat-card">
//           <div className="pro-stat-icon purple">
//             <i className="fas fa-users"></i>
//           </div>
//           <div>
//             <div className="pro-stat-value">{users.length}</div>
//             <div className="pro-stat-label">Visible Employees</div>
//           </div>
//         </div>
//       </div>

//       {loading ? (
//         <div className="pro-empty-state">
//           <div className="spinner-border text-primary" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p>Loading buildings...</p>
//         </div>
//       ) : groups.length === 0 ? (
//         <div className="pro-empty-state">
//           <div>
//             <div className="pro-empty-icon mx-auto">
//               <i className="fas fa-building"></i>
//             </div>
//             <h5>No buildings found</h5>
//             <p>
//               {canCreateBuilding
//                 ? "Create your first building to start managing doors and admins."
//                 : "No building has been assigned to this account yet."}
//             </p>
//           </div>
//         </div>
//       ) : (
//         <div className="pro-card-grid">
//           {groups.map((group) => {
//             const doorCount = getDoorCountForBuilding(group.id);
//             const userCount = getUserCountForBuilding(group.id);

//             return (
//               <div
//                 key={group.id}
//                 className="pro-card"
//                 onClick={() => handleBuildingClick(group)}
//                 style={{ cursor: "pointer" }}
//               >
//                 <div className="pro-card-top">
//                   <div
//                     className="pro-card-icon"
//                     style={{
//                       background:
//                         group.color ||
//                         "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//                     }}
//                   >
//                     <i className={group.icon || "fas fa-building"}></i>
//                   </div>

//                   <span className="pro-status-badge active">Active</span>
//                 </div>

//                 <div className="pro-card-body">
//                   <h3>{group.name}</h3>

//                   <p className="pro-card-code">{group.id}</p>

//                   <p className="pro-card-description">
//                     {group.description ||
//                       "No description provided for this building."}
//                   </p>

//                   <div className="pro-meta-box">
//                     <div>
//                       <span>Doors</span>
//                       <strong>{doorCount}</strong>
//                     </div>

//                     <div>
//                       <span>Employees</span>
//                       <strong>{userCount}</strong>
//                     </div>

//                     {currentAdmin?.role === "super_admin" && (
//                       <div>
//                         <span>Tenant</span>
//                         <strong>{getTenantName(group.tenant_id)}</strong>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="pro-card-footer">
//                   <button
//                     type="button"
//                     className="pro-primary-card-btn"
//                     onClick={(event) => {
//                       event.stopPropagation();
//                       handleBuildingClick(group);
//                     }}
//                   >
//                     <i className="fas fa-sliders me-2"></i>
//                     Manage
//                   </button>

//                   {canDeleteBuilding && (
//                     <button
//                       type="button"
//                       className="pro-danger-card-btn"
//                       onClick={(event) => handleDeleteClick(event, group)}
//                     >
//                       <i className="fas fa-trash"></i>
//                     </button>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       <AddBuildingModal
//         show={showAddModal}
//         onHide={() => setShowAddModal(false)}
//         onSubmit={handleCreateGroup}
//         tenants={tenants}
//         currentAdmin={currentAdmin}
//       />

//       {showDetailsModal && selectedGroup && (
//         <BuildingDetailsModal
//           group={selectedGroup}
//           doors={doors}
//           show={showDetailsModal}
//           onHide={() => {
//             setShowDetailsModal(false);
//             setSelectedGroup(null);
//           }}
//           onDelete={handleDeleteGroup}
//           showToast={showToast}
//         />
//       )}

//       <ConfirmationModal
//         show={showDeleteModal}
//         title="Delete Building"
//         message={`Are you sure you want to delete "${
//           buildingToDelete?.name || "this building"
//         }"? All doors in this building will also be deleted.`}
//         confirmText="Start Deletion"
//         type="danger"
//         onHide={() => {
//           setShowDeleteModal(false);
//           setBuildingToDelete(null);
//         }}
//         onConfirm={confirmDelete}
//       />
//     </div>
//   );
// }

// export default Buildings;


//2nd code
import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import AddBuildingModal from "../modals/AddBuildingModal";
import BuildingDetailsModal from "../modals/BuildingDetailsModal";
import ConfirmationModal from "../modals/ConfirmationModal";

function Buildings({ showToast }) {
  const [groups, setGroups] = useState([]);
  const [doors, setDoors] = useState([]);
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  // New state for search
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const adminProfile = api.getStoredAdminProfile();
      setCurrentAdmin(adminProfile);

      const shouldLoadTenants = adminProfile?.role === "super_admin";

      const [groupsData, doorsData, usersData, tenantsData] = await Promise.all([
        api.getGroups(),
        api.getDoors(),
        api.getUsers(),
        shouldLoadTenants ? api.getTenants() : Promise.resolve([]),
      ]);

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setDoors(Array.isArray(doorsData) ? doorsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
    } catch (error) {
      showToast(error.message || "Failed to load buildings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (data) => {
    try {
      const result = await api.createGroup(data);

      if (result.success || result.building) {
        showToast("Building created successfully", "success");
      } else {
        showToast("Building created successfully", "success");
      }

      setShowAddModal(false);
      loadData();
    } catch (error) {
      showToast(error.message || "Failed to create building", "error");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.deleteGroup(groupId);

      showToast("Building deleted successfully", "success");
      setShowDetailsModal(false);
      setSelectedGroup(null);
      loadData();
    } catch (error) {
      showToast(error.message || "Failed to delete building", "error");
    }
  };

  const handleBuildingClick = (group) => {
    setSelectedGroup(group);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (event, group) => {
    event.stopPropagation();
    setBuildingToDelete(group);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!buildingToDelete) return;

    await handleDeleteGroup(buildingToDelete.id);
    setShowDeleteModal(false);
    setBuildingToDelete(null);
  };

  // Search filter function
  const filterBySearch = (items) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      // Search in building name
      if (item.name && item.name.toLowerCase().includes(query)) return true;
      // Search in building ID
      if (item.id && String(item.id).toLowerCase().includes(query)) return true;
      // Search in description
      if (item.description && item.description.toLowerCase().includes(query)) return true;
      // Search in tenant name (if available)
      if (item.tenant_id) {
        const tenant = tenants.find((t) => t.id === item.tenant_id);
        if (tenant && tenant.name && tenant.name.toLowerCase().includes(query)) return true;
      }
      return false;
    });
  };

  // Get filtered buildings
  const getFilteredBuildings = () => {
    return filterBySearch(groups);
  };

  // Get count for display
  const getFilteredCount = () => getFilteredBuildings().length;

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

  const getTenantName = (tenantId) => {
    if (!tenantId) return "Current tenant";

    const tenant = tenants.find((item) => item.id === tenantId);
    return tenant?.name || tenantId;
  };

  const getRoleScopeText = () => {
    if (currentAdmin?.role === "super_admin") return "All tenant buildings";
    if (currentAdmin?.role === "tenant_admin") return "Your tenant buildings";
    if (currentAdmin?.role === "building_admin") return "Assigned building";
    return "Available buildings";
  };

  const canCreateBuilding = currentAdmin?.role !== "building_admin";
  const canDeleteBuilding = currentAdmin?.role !== "building_admin";

  const activeBuildings = groups.filter((group) => group.is_active !== false).length;

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div>
          <div className="pro-kicker">
            <i className="fas fa-building-shield me-2"></i>
            Building Access Management
          </div>

          <h1>Buildings</h1>

          <p>
            Manage building access zones, door controllers, assigned employees,
            and building admin ownership under your current role scope.
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

          {canCreateBuilding && (
            <button
              type="button"
              className="btn btn-gradient"
              onClick={() => setShowAddModal(true)}
            >
              <i className="fas fa-plus me-2"></i>Add Building
            </button>
          )}
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
            <i className="fas fa-building"></i>
          </div>
          <div>
            <div className="pro-stat-value">{groups.length}</div>
            <div className="pro-stat-label">Total Buildings</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon green">
            <i className="fas fa-circle-check"></i>
          </div>
          <div>
            <div className="pro-stat-value">{activeBuildings}</div>
            <div className="pro-stat-label">Active Buildings</div>
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
          <div className="pro-stat-icon purple">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div className="pro-stat-value">{users.length}</div>
            <div className="pro-stat-label">Visible Employees</div>
          </div>
        </div>
      </div>

      {/* Search Bar - Added here */}
      <div className="building-search-bar">
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search buildings by name, ID, description, or tenant..."
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
            Showing {getFilteredCount()} of {groups.length} buildings
          </div>
        )}
      </div>

      {loading ? (
        <div className="pro-empty-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading buildings...</p>
        </div>
      ) : getFilteredBuildings().length === 0 ? (
        <div className="pro-empty-state">
          <div>
            <div className="pro-empty-icon mx-auto">
              <i className={searchQuery ? "fas fa-search" : "fas fa-building"}></i>
            </div>
            <h5>{searchQuery ? "No matching buildings found" : "No buildings found"}</h5>
            <p>
              {searchQuery
                ? "Try adjusting your search terms."
                : canCreateBuilding
                ? "Create your first building to start managing doors and admins."
                : "No building has been assigned to this account yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="pro-card-grid">
          {getFilteredBuildings().map((group) => {
            const doorCount = getDoorCountForBuilding(group.id);
            const userCount = getUserCountForBuilding(group.id);

            return (
              <div
                key={group.id}
                className="pro-card"
                onClick={() => handleBuildingClick(group)}
                style={{ cursor: "pointer" }}
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

                  <p className="pro-card-description">
                    {group.description ||
                      "No description provided for this building."}
                  </p>

                  <div className="pro-meta-box">
                    <div>
                      <span>Doors</span>
                      <strong>{doorCount}</strong>
                    </div>

                    <div>
                      <span>Employees</span>
                      <strong>{userCount}</strong>
                    </div>

                    {currentAdmin?.role === "super_admin" && (
                      <div>
                        <span>Tenant</span>
                        <strong>{getTenantName(group.tenant_id)}</strong>
                      </div>
                    )}
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

                  {canDeleteBuilding && (
                    <button
                      type="button"
                      className="pro-danger-card-btn"
                      onClick={(event) => handleDeleteClick(event, group)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddBuildingModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleCreateGroup}
        tenants={tenants}
        currentAdmin={currentAdmin}
      />

      {showDetailsModal && selectedGroup && (
        <BuildingDetailsModal
          group={selectedGroup}
          doors={doors}
          show={showDetailsModal}
          onHide={() => {
            setShowDetailsModal(false);
            setSelectedGroup(null);
          }}
          onDelete={handleDeleteGroup}
          showToast={showToast}
        />
      )}

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Building"
        message={`Are you sure you want to delete "${
          buildingToDelete?.name || "this building"
        }"? All doors in this building will also be deleted.`}
        confirmText="Start Deletion"
        type="danger"
        onHide={() => {
          setShowDeleteModal(false);
          setBuildingToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Buildings;
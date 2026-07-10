// import React, { useEffect, useState } from "react";
// import { api } from "../../services/api";
// import AddUserModal from "../modals/AddUserModal";
// import AuthorizeUserModal from "../modals/AuthorizeUserModal";
// import ConfirmationModal from "../modals/ConfirmationModal";

// function Users({ showToast }) {
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [doors, setDoors] = useState([]);

//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [confirmModal, setConfirmModal] = useState({
//     show: false,
//     title: "",
//     message: "",
//     onConfirm: null,
//   });

//   const currentAdmin = api.getStoredAdminProfile();
//   const canDeleteUsers = currentAdmin?.role !== "building_admin";

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);

//       const [usersData, groupsData, doorsData] = await Promise.all([
//         api.getUsers(),
//         api.getGroups(),
//         api.getDoors(),
//       ]);

//       setUsers(Array.isArray(usersData) ? usersData : []);
//       setGroups(Array.isArray(groupsData) ? groupsData : []);
//       setDoors(Array.isArray(doorsData) ? doorsData : []);
//     } catch (error) {
//       showToast(error.message || "Failed to load users", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateUser = async (data) => {
//     try {
//       const rawUserId = String(data.user_id || "").trim();
//       const cleanUserId = rawUserId.split(" - ")[0].trim();

//       const nameFromUserId = rawUserId.includes(" - ")
//         ? rawUserId.split(" - ").slice(1).join(" - ").trim()
//         : "";

//       const fullName =
//         `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
//         nameFromUserId ||
//         cleanUserId;

//       const userData = {
//         id: cleanUserId,
//         name: fullName,
//         email: data.email || "",
//         department: data.department || "",
//         role: data.role || "employee",
//       };

//       const result = await api.createUser(userData);

//       if (result.success || result.user) {
//         const createdUser = result.user || {
//           ...userData,
//           authorized_doors: [],
//         };

//         showToast("User created successfully. Now assign door access.", "success");
//         setShowAddModal(false);

//         setSelectedUser(createdUser);
//         setShowAuthModal(true);

//         loadData();
//       }
//     } catch (error) {
//       showToast(error.message || "Failed to create user", "error");
//     }
//   };

//   const handleDeleteUser = (userId, userName) => {
//     setConfirmModal({
//       show: true,
//       title: "Delete Employee",
//       message: `Are you sure you want to delete "${userName}"? This will revoke all door access for this employee.`,
//       onConfirm: async () => {
//         try {
//           await api.deleteUser(userId);
//           showToast("Employee deleted successfully", "success");

//           setConfirmModal({
//             show: false,
//             title: "",
//             message: "",
//             onConfirm: null,
//           });

//           loadData();
//         } catch (error) {
//           showToast(error.message || "Failed to delete employee", "error");
//         }
//       },
//     });
//   };

//   const handleAuthorizeUser = (user) => {
//     setSelectedUser(user);
//     setShowAuthModal(true);
//   };

//   const handleSaveAuthorization = async (userId, doorIds) => {
//     try {
//       const visibleDoorIds = new Set(doors.map((door) => door.id));

//       const existingAuthorizedDoors = Array.isArray(selectedUser?.authorized_doors)
//         ? selectedUser.authorized_doors
//         : [];

//       const outsideScopeDoorIds = existingAuthorizedDoors.filter(
//         (doorId) => !visibleDoorIds.has(doorId)
//       );

//       const finalDoorIds = Array.from(
//         new Set([...outsideScopeDoorIds, ...doorIds])
//       );

//       const result = await api.authorizeUserDoors(userId, finalDoorIds);

//       if (result.success || result.message) {
//         showToast("Door access updated successfully", "success");
//         setShowAuthModal(false);
//         setSelectedUser(null);
//         loadData();
//       }
//     } catch (error) {
//       showToast(error.message || "Failed to update door access", "error");
//     }
//   };

//   const getUserAuthorizedDoors = (user) => {
//     if (!Array.isArray(user.authorized_doors) || user.authorized_doors.length === 0) {
//       return [];
//     }

//     return user.authorized_doors
//       .map((doorId) => doors.find((door) => door.id === doorId))
//       .filter((door) => door !== undefined);
//   };

//   const getInitials = (name) => {
//     return (
//       name
//         ?.split(" ")
//         .map((item) => item[0])
//         .join("")
//         .slice(0, 2)
//         .toUpperCase() || "U"
//     );
//   };

//   const getRoleScopeText = () => {
//     if (currentAdmin?.role === "super_admin") return "All tenant employees";
//     if (currentAdmin?.role === "tenant_admin") return "Your tenant employees";
//     if (currentAdmin?.role === "building_admin") return "Assigned building employees";
//     return "Visible employees";
//   };

//   const faceRegisteredCount = users.filter((user) => user.face_registered).length;

//   const employeesWithAccessCount = users.filter(
//     (user) =>
//       Array.isArray(user.authorized_doors) && user.authorized_doors.length > 0
//   ).length;

//   return (
//     <div className="pro-page">
//       <div className="pro-hero">
//         <div>
//           <div className="pro-kicker">
//             <i className="fas fa-users me-2"></i>
//             Employee Access Management
//           </div>

//           <h1>Employees</h1>

//           <p>
//             Link employees, manage door permissions, and control building access
//             under your current admin role scope.
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

//           <button
//             type="button"
//             className="btn btn-gradient"
//             onClick={() => setShowAddModal(true)}
//           >
//             <i className="fas fa-plus me-2"></i>Link Employee
//           </button>
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
//             <i className="fas fa-users"></i>
//           </div>
//           <div>
//             <div className="pro-stat-value">{users.length}</div>
//             <div className="pro-stat-label">Visible Employees</div>
//           </div>
//         </div>

//         <div className="pro-stat-card">
//           <div className="pro-stat-icon green">
//             <i className="fas fa-door-open"></i>
//           </div>
//           <div>
//             <div className="pro-stat-value">{employeesWithAccessCount}</div>
//             <div className="pro-stat-label">With Door Access</div>
//           </div>
//         </div>

//         <div className="pro-stat-card">
//           <div className="pro-stat-icon purple">
//             <i className="fas fa-fingerprint"></i>
//           </div>
//           <div>
//             <div className="pro-stat-value">{faceRegisteredCount}</div>
//             <div className="pro-stat-label">Face Registered</div>
//           </div>
//         </div>

//         <div className="pro-stat-card">
//           <div className="pro-stat-icon cyan">
//             <i className="fas fa-building"></i>
//           </div>
//           <div>
//             <div className="pro-stat-value">{groups.length}</div>
//             <div className="pro-stat-label">Visible Buildings</div>
//           </div>
//         </div>
//       </div>

//       {loading ? (
//         <div className="pro-empty-state">
//           <div>
//             <div className="spinner-border text-primary" role="status">
//               <span className="visually-hidden">Loading...</span>
//             </div>
//             <p className="mt-3">Loading employees...</p>
//           </div>
//         </div>
//       ) : users.length === 0 ? (
//         <div className="pro-empty-state">
//           <div>
//             <div className="pro-empty-icon mx-auto">
//               <i className="fas fa-user-plus"></i>
//             </div>
//             <h5>No employees linked</h5>
//             <p>Link an employee to start assigning door access permissions.</p>
//           </div>
//         </div>
//       ) : (
//         <div className="pro-card-grid">
//           {users.map((user) => {
//             const authorizedDoors = getUserAuthorizedDoors(user);

//             return (
//               <div key={user.id} className="pro-card">
//                 <div className="pro-card-top">
//                   <div className="pro-card-icon">
//                     <span style={{ fontWeight: 900 }}>{getInitials(user.name)}</span>
//                   </div>

//                   {user.face_registered ? (
//                     <span className="pro-status-badge active">
//                       <i className="fas fa-fingerprint me-1"></i>
//                       Registered
//                     </span>
//                   ) : (
//                     <span className="pro-status-badge warning">Not Registered</span>
//                   )}
//                 </div>

//                 <div className="pro-card-body">
//                   <h3>{user.name || "Unnamed Employee"}</h3>

//                   <p className="pro-card-code">{user.id}</p>

//                   <p className="pro-card-description">
//                     {user.department
//                       ? `${user.department} department employee.`
//                       : "Employee linked for access permission management."}
//                   </p>

//                   <div className="pro-meta-box">
//                     <div>
//                       <span>Department</span>
//                       <strong>{user.department || "Not assigned"}</strong>
//                     </div>

//                     <div>
//                       <span>Email</span>
//                       <strong>{user.email || "No email"}</strong>
//                     </div>

//                     <div>
//                       <span>Door Access</span>
//                       <strong>{authorizedDoors.length} doors</strong>
//                     </div>
//                   </div>

//                   {authorizedDoors.length > 0 ? (
//                     <div className="pro-chip-list">
//                       {authorizedDoors.slice(0, 4).map((door) => (
//                         <span key={door.id} className="pro-chip">
//                           <i className="fas fa-door-closed me-1"></i>
//                           {door.name}
//                         </span>
//                       ))}

//                       {authorizedDoors.length > 4 && (
//                         <span className="pro-chip">
//                           +{authorizedDoors.length - 4} more
//                         </span>
//                       )}
//                     </div>
//                   ) : (
//                     <div className="pro-muted-note">No door access assigned</div>
//                   )}
//                 </div>

//                 <div className="pro-card-footer">
//                   <button
//                     type="button"
//                     className="pro-primary-card-btn"
//                     onClick={() => handleAuthorizeUser(user)}
//                   >
//                     <i className="fas fa-door-open me-2"></i>
//                     Door Access
//                   </button>

//                   {canDeleteUsers && (
//                     <button
//                       type="button"
//                       className="pro-danger-card-btn"
//                       onClick={() => handleDeleteUser(user.id, user.name)}
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

//       <AddUserModal
//         show={showAddModal}
//         onHide={() => setShowAddModal(false)}
//         onSubmit={handleCreateUser}
//         showToast={showToast}
//       />

//       {showAuthModal && selectedUser && (
//         <AuthorizeUserModal
//           show={showAuthModal}
//           user={selectedUser}
//           groups={groups}
//           doors={doors}
//           onHide={() => {
//             setShowAuthModal(false);
//             setSelectedUser(null);
//           }}
//           onSubmit={handleSaveAuthorization}
//           showToast={showToast}
//         />
//       )}

//       <ConfirmationModal
//         show={confirmModal.show}
//         title={confirmModal.title}
//         message={confirmModal.message}
//         onHide={() =>
//           setConfirmModal({
//             show: false,
//             title: "",
//             message: "",
//             onConfirm: null,
//           })
//         }
//         onConfirm={confirmModal.onConfirm}
//       />
//     </div>
//   );
// }

// export default Users;


//2nd code
import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import AddUserModal from "../modals/AddUserModal";
import AuthorizeUserModal from "../modals/AuthorizeUserModal";
import ConfirmationModal from "../modals/ConfirmationModal";

function Users({ showToast }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [doors, setDoors] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // New state for search
  const [searchQuery, setSearchQuery] = useState("");

  const currentAdmin = api.getStoredAdminProfile();
  const canDeleteUsers = currentAdmin?.role !== "building_admin";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [usersData, groupsData, doorsData] = await Promise.all([
        api.getUsers(),
        api.getGroups(),
        api.getDoors(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setDoors(Array.isArray(doorsData) ? doorsData : []);
    } catch (error) {
      showToast(error.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data) => {
    try {
      const rawUserId = String(data.user_id || "").trim();
      const cleanUserId = rawUserId.split(" - ")[0].trim();

      const nameFromUserId = rawUserId.includes(" - ")
        ? rawUserId.split(" - ").slice(1).join(" - ").trim()
        : "";

      const fullName =
        `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
        nameFromUserId ||
        cleanUserId;

      const userData = {
        id: cleanUserId,
        name: fullName,
        email: data.email || "",
        department: data.department || "",
        role: data.role || "employee",
      };

      const result = await api.createUser(userData);

      if (result.success || result.user) {
        const createdUser = result.user || {
          ...userData,
          authorized_doors: [],
        };

        showToast("User created successfully. Now assign door access.", "success");
        setShowAddModal(false);

        setSelectedUser(createdUser);
        setShowAuthModal(true);

        loadData();
      }
    } catch (error) {
      showToast(error.message || "Failed to create user", "error");
    }
  };

  const handleDeleteUser = (userId, userName) => {
    setConfirmModal({
      show: true,
      title: "Delete Employee",
      message: `Are you sure you want to delete "${userName}"? This will revoke all door access for this employee.`,
      onConfirm: async () => {
        try {
          await api.deleteUser(userId);
          showToast("Employee deleted successfully", "success");

          setConfirmModal({
            show: false,
            title: "",
            message: "",
            onConfirm: null,
          });

          loadData();
        } catch (error) {
          showToast(error.message || "Failed to delete employee", "error");
        }
      },
    });
  };

  const handleAuthorizeUser = (user) => {
    setSelectedUser(user);
    setShowAuthModal(true);
  };

  const handleSaveAuthorization = async (userId, doorIds) => {
    try {
      const visibleDoorIds = new Set(doors.map((door) => door.id));

      const existingAuthorizedDoors = Array.isArray(selectedUser?.authorized_doors)
        ? selectedUser.authorized_doors
        : [];

      const outsideScopeDoorIds = existingAuthorizedDoors.filter(
        (doorId) => !visibleDoorIds.has(doorId)
      );

      const finalDoorIds = Array.from(
        new Set([...outsideScopeDoorIds, ...doorIds])
      );

      const result = await api.authorizeUserDoors(userId, finalDoorIds);

      if (result.success || result.message) {
        showToast("Door access updated successfully", "success");
        setShowAuthModal(false);
        setSelectedUser(null);
        loadData();
      }
    } catch (error) {
      showToast(error.message || "Failed to update door access", "error");
    }
  };

  // Search filter function
  const filterBySearch = (items) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      // Search in user name
      if (item.name && item.name.toLowerCase().includes(query)) return true;
      // Search in user ID
      if (item.id && String(item.id).toLowerCase().includes(query)) return true;
      // Search in email
      if (item.email && item.email.toLowerCase().includes(query)) return true;
      // Search in department
      if (item.department && item.department.toLowerCase().includes(query)) return true;
      // Search in role
      if (item.role && item.role.toLowerCase().includes(query)) return true;
      return false;
    });
  };

  // Get filtered users
  const getFilteredUsers = () => {
    return filterBySearch(users);
  };

  // Get count for display
  const getFilteredCount = () => getFilteredUsers().length;

  const getUserAuthorizedDoors = (user) => {
    if (!Array.isArray(user.authorized_doors) || user.authorized_doors.length === 0) {
      return [];
    }

    return user.authorized_doors
      .map((doorId) => doors.find((door) => door.id === doorId))
      .filter((door) => door !== undefined);
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((item) => item[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U"
    );
  };

  const getRoleScopeText = () => {
    if (currentAdmin?.role === "super_admin") return "All tenant employees";
    if (currentAdmin?.role === "tenant_admin") return "Your tenant employees";
    if (currentAdmin?.role === "building_admin") return "Assigned building employees";
    return "Visible employees";
  };

  const faceRegisteredCount = users.filter((user) => user.face_registered).length;

  const employeesWithAccessCount = users.filter(
    (user) =>
      Array.isArray(user.authorized_doors) && user.authorized_doors.length > 0
  ).length;

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div>
          <div className="pro-kicker">
            <i className="fas fa-users me-2"></i>
            Employee Access Management
          </div>

          <h1>Employees</h1>

          <p>
            Link employees, manage door permissions, and control building access
            under your current admin role scope.
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

          <button
            type="button"
            className="btn btn-gradient"
            onClick={() => setShowAddModal(true)}
          >
            <i className="fas fa-plus me-2"></i>Link Employee
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
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div className="pro-stat-value">{users.length}</div>
            <div className="pro-stat-label">Visible Employees</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon green">
            <i className="fas fa-door-open"></i>
          </div>
          <div>
            <div className="pro-stat-value">{employeesWithAccessCount}</div>
            <div className="pro-stat-label">With Door Access</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon purple">
            <i className="fas fa-fingerprint"></i>
          </div>
          <div>
            <div className="pro-stat-value">{faceRegisteredCount}</div>
            <div className="pro-stat-label">Face Registered</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon cyan">
            <i className="fas fa-building"></i>
          </div>
          <div>
            <div className="pro-stat-value">{groups.length}</div>
            <div className="pro-stat-label">Visible Buildings</div>
          </div>
        </div>
      </div>

      {/* Search Bar - Added here */}
      <div className="user-search-bar">
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search employees by name, ID, email, department, or role..."
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
            Showing {getFilteredCount()} of {users.length} employees
          </div>
        )}
      </div>

      {loading ? (
        <div className="pro-empty-state">
          <div>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading employees...</p>
          </div>
        </div>
      ) : getFilteredUsers().length === 0 ? (
        <div className="pro-empty-state">
          <div>
            <div className="pro-empty-icon mx-auto">
              <i className={searchQuery ? "fas fa-search" : "fas fa-user-plus"}></i>
            </div>
            <h5>{searchQuery ? "No matching employees found" : "No employees linked"}</h5>
            <p>
              {searchQuery
                ? "Try adjusting your search terms."
                : "Link an employee to start assigning door access permissions."}
            </p>
          </div>
        </div>
      ) : (
        <div className="pro-card-grid">
          {getFilteredUsers().map((user) => {
            const authorizedDoors = getUserAuthorizedDoors(user);

            return (
              <div key={user.id} className="pro-card">
                <div className="pro-card-top">
                  <div className="pro-card-icon">
                    <span style={{ fontWeight: 900 }}>{getInitials(user.name)}</span>
                  </div>

                  {user.face_registered ? (
                    <span className="pro-status-badge active">
                      <i className="fas fa-fingerprint me-1"></i>
                      Registered
                    </span>
                  ) : (
                    <span className="pro-status-badge warning">Not Registered</span>
                  )}
                </div>

                <div className="pro-card-body">
                  <h3>{user.name || "Unnamed Employee"}</h3>

                  <p className="pro-card-code">{user.id}</p>

                  <p className="pro-card-description">
                    {user.department
                      ? `${user.department} department employee.`
                      : "Employee linked for access permission management."}
                  </p>

                  <div className="pro-meta-box">
                    <div>
                      <span>Department</span>
                      <strong>{user.department || "Not assigned"}</strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>{user.email || "No email"}</strong>
                    </div>

                    <div>
                      <span>Door Access</span>
                      <strong>{authorizedDoors.length} doors</strong>
                    </div>
                  </div>

                  {authorizedDoors.length > 0 ? (
                    <div className="pro-chip-list">
                      {authorizedDoors.slice(0, 4).map((door) => (
                        <span key={door.id} className="pro-chip">
                          <i className="fas fa-door-closed me-1"></i>
                          {door.name}
                        </span>
                      ))}

                      {authorizedDoors.length > 4 && (
                        <span className="pro-chip">
                          +{authorizedDoors.length - 4} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="pro-muted-note">No door access assigned</div>
                  )}
                </div>

                <div className="pro-card-footer">
                  <button
                    type="button"
                    className="pro-primary-card-btn"
                    onClick={() => handleAuthorizeUser(user)}
                  >
                    <i className="fas fa-door-open me-2"></i>
                    Door Access
                  </button>

                  {canDeleteUsers && (
                    <button
                      type="button"
                      className="pro-danger-card-btn"
                      onClick={() => handleDeleteUser(user.id, user.name)}
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

      <AddUserModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleCreateUser}
        showToast={showToast}
      />

      {showAuthModal && selectedUser && (
        <AuthorizeUserModal
          show={showAuthModal}
          user={selectedUser}
          groups={groups}
          doors={doors}
          onHide={() => {
            setShowAuthModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleSaveAuthorization}
          showToast={showToast}
        />
      )}

      <ConfirmationModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onHide={() =>
          setConfirmModal({
            show: false,
            title: "",
            message: "",
            onConfirm: null,
          })
        }
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}

export default Users;
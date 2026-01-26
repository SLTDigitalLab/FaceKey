import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import PageHeader from "../layout/PageHeader";
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
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, groupsData, doorsData] = await Promise.all([
        api.getUsers(),
        api.getGroups(),
        api.getDoors(),
      ]);
      setUsers(usersData);
      setGroups(groupsData);
      setDoors(doorsData);
    } catch (error) {
      showToast("Failed to load users", "error");
    }
  };

  const handleCreateUser = async (data) => {
    try {
      // Transform data to match backend API
      const userData = {
        id: data.user_id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email || "",
        department: data.department || "",
        role: data.role || "employee",
      };
      const result = await api.createUser(userData);
      if (result.success) {
        showToast("User created successfully", "success");
        setShowAddModal(false);
        loadData();
      }
    } catch (error) {
      showToast("Failed to create user", "error");
    }
  };

  const handleDeleteUser = (userId, userName) => {
    setConfirmModal({
      show: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${userName}"? This will revoke all door access for this user.`,
      onConfirm: async () => {
        try {
          await api.deleteUser(userId);
          showToast("User deleted successfully", "success");
          setConfirmModal({ ...confirmModal, show: false });
          loadData();
        } catch (error) {
          showToast("Failed to delete user", "error");
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
      const result = await api.updateUserDoors(userId, doorIds);
      if (result.success) {
        showToast("Door access updated successfully", "success");
        setShowAuthModal(false);
        loadData();
      }
    } catch (error) {
      showToast("Failed to update door access", "error");
    }
  };

  // Get user's authorized doors with names
  const getUserAuthorizedDoors = (user) => {
    if (!user.authorized_doors || user.authorized_doors.length === 0) return [];
    return user.authorized_doors
      .map((doorId) => doors.find((d) => d.id === doorId))
      .filter((door) => door !== undefined);
  };

  return (
    <div>
      <div className="page-header-custom">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            Manage employee door access permissions
          </p>
        </div>
        <button
          className="btn btn-gradient"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Link Employee
        </button>
      </div>

      <div className="row g-3">
        {users.map((user) => {
          const authorizedDoors = getUserAuthorizedDoors(user);
          return (
            <div key={user.user_id} className="col-lg-4">
              <div className="employee-card">
                <div className="employee-card-header">
                  <div className="employee-avatar">
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "U"}
                  </div>
                  <div className="employee-info">
                    <div className="employee-name-row">
                      <h3 className="employee-name">{user.name}</h3>
                      {user.face_registered && (
                        <span className="badge-face-registered">
                          Face Registered
                        </span>
                      )}
                    </div>
                    <div className="employee-id">{user.id}</div>
                    {user.department && (
                      <div className="employee-doors-info">
                        • {user.department}
                      </div>
                    )}
                  </div>
                </div>

                {authorizedDoors.length > 0 && (
                  <div className="employee-door-badges">
                    {authorizedDoors.map((door) => (
                      <span key={door.id} className="door-badge">
                        <i className="fas fa-door-closed me-1"></i>
                        {door.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="employee-card-footer">
                  <button
                    className="btn-door-access"
                    onClick={() => handleAuthorizeUser(user)}
                  >
                    <i className="fas fa-door-closed me-2"></i>Door Access
                  </button>
                  <button
                    className="btn-delete-user"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
          onHide={() => setShowAuthModal(false)}
          onSubmit={handleSaveAuthorization}
          showToast={showToast}
        />
      )}

      <ConfirmationModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onHide={() => setConfirmModal({ ...confirmModal, show: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}

export default Users;

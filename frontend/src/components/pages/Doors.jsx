import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import AddDoorModal from "../modals/AddDoorModal";
import ConfirmationModal from "../modals/ConfirmationModal";
import AddUserModal from "../modals/AddUserModal";
import DoorAuthorizedUsersModal from "../modals/DoorAuthorizedUsersModal";

function Doors({ showToast }) {
  const [groups, setGroups] = useState([]);
  const [doors, setDoors] = useState([]);
  const [users, setUsers] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "",
    onConfirm: null,
  });

  const [selectedDoor, setSelectedDoor] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDoorUsersModal, setShowDoorUsersModal] = useState(false);
  const [selectedDoorForUsers, setSelectedDoorForUsers] = useState(null);

  const [loading, setLoading] = useState(false);

  const currentAdmin = api.getStoredAdminProfile();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [groupsData, doorsData, usersData] = await Promise.all([
        api.getGroups(),
        api.getDoors(),
        api.getUsers(),
      ]);

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setDoors(Array.isArray(doorsData) ? doorsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      showToast(error.message || "Failed to load doors", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoor = async (data) => {
    try {
      const doorData = {
        name: data.name,
        building_id: data.group_id,
        location: data.location || "",
        ip_address: data.ip_address || "",
        port: data.port || 80,
      };

      const result = await api.createDoor(doorData);

      if (result.success || result.door) {
        showToast("Door added successfully", "success");
        setShowAddModal(false);
        loadData();
      }
    } catch (error) {
      showToast(error.message || "Failed to add door", "error");
    }
  };

  const handleUnlock = async (doorId) => {
    try {
      const result = await api.unlockDoor(doorId);

      showToast(
        result.message || "Door unlock request sent",
        result.success ? "success" : "error"
      );

      loadData();
    } catch (error) {
      showToast(error.message || "Failed to unlock door", "error");
    }
  };

  const handleDeleteDoor = (doorId, doorName) => {
    setConfirmModal({
      show: true,
      title: "Delete Door",
      message: `Are you sure you want to delete "${doorName || "this door"}"?`,
      confirmText: "Delete Door",
      onConfirm: async () => {
        try {
          await api.deleteDoor(doorId);
          showToast("Door deleted successfully", "success");

          setConfirmModal({
            show: false,
            title: "",
            message: "",
            confirmText: "",
            onConfirm: null,
          });

          loadData();
        } catch (error) {
          showToast(error.message || "Failed to delete door", "error");
        }
      },
    });
  };

  const handleAssignEmployees = (door) => {
    setSelectedDoor(door);
    setShowAssignModal(true);
  };

  const handleViewDoorUsers = (door) => {
    setSelectedDoorForUsers(door);
    setShowDoorUsersModal(true);
  };

  const handleRemoveDoorAccess = (user) => {
    if (!selectedDoorForUsers) return;

    setConfirmModal({
      show: true,
      title: "Remove Door Access",
      message: `Are you sure you want to remove "${
        user.name || user.id
      }" access from "${selectedDoorForUsers.name}"?`,
      confirmText: "Remove Access",
      onConfirm: async () => {
        try {
          const updatedDoorIds = Array.isArray(user.authorized_doors)
            ? user.authorized_doors.filter(
                (doorId) => doorId !== selectedDoorForUsers.id
              )
            : [];

          await api.authorizeUserDoors(user.id, updatedDoorIds);

          showToast("Door access removed successfully", "success");

          setUsers((prevUsers) =>
            prevUsers.map((item) =>
              item.id === user.id
                ? { ...item, authorized_doors: updatedDoorIds }
                : item
            )
          );

          setConfirmModal({
            show: false,
            title: "",
            message: "",
            confirmText: "",
            onConfirm: null,
          });

          loadData();
        } catch (error) {
          showToast(error.message || "Failed to remove door access", "error");
        }
      },
    });
  };

  const handleAssignSubmit = async (formData) => {
    try {
      const rawUserId = String(formData.user_id || "").trim();
      const cleanUserId = rawUserId.split(" - ")[0].trim();

      const nameFromUserId = rawUserId.includes(" - ")
        ? rawUserId.split(" - ").slice(1).join(" - ").trim()
        : "";

      const fullName =
        `${formData.first_name || ""} ${formData.last_name || ""}`.trim() ||
        nameFromUserId ||
        cleanUserId;

      const existingUsers = await api.getUsers();

      const existingUser = existingUsers.find((user) => {
        const existingCleanId = String(user.id || "").split(" - ")[0].trim();

        return (
          user.id === rawUserId ||
          user.id === cleanUserId ||
          existingCleanId === cleanUserId
        );
      });

      let userIdForAuthorization = existingUser?.id;

      if (!existingUser) {
        const createResult = await api.createUser({
          id: cleanUserId,
          name: fullName,
          email: formData.email || "",
          department: formData.department || "",
          role: "employee",
        });

        userIdForAuthorization = createResult.user?.id || cleanUserId;
      }

      const currentDoorIds = existingUser?.authorized_doors || [];
      const updatedDoorIds = Array.from(
        new Set([...currentDoorIds, selectedDoor.id])
      );

      const result = await api.authorizeUserDoors(
        userIdForAuthorization,
        updatedDoorIds
      );

      if (result.success || result.message) {
        showToast("Employee assigned to door successfully", "success");
        setShowAssignModal(false);
        setSelectedDoor(null);
        loadData();
      }
    } catch (error) {
      showToast(error.message || "Failed to assign employee", "error");
    }
  };

  const getGroupedDoors = () => {
    return groups
      .map((group) => ({
        group,
        doors: doors.filter((door) => door.building_id === group.id),
      }))
      .filter((item) => item.doors.length > 0);
  };

  const getDoorUserCount = (doorId) => {
    return users.filter(
      (user) =>
        Array.isArray(user.authorized_doors) &&
        user.authorized_doors.includes(doorId)
    ).length;
  };

  const getRoleScopeText = () => {
    if (currentAdmin?.role === "super_admin") return "All tenant doors";
    if (currentAdmin?.role === "tenant_admin") return "Your tenant doors";
    if (currentAdmin?.role === "building_admin") return "Assigned building doors";
    return "Available doors";
  };

  const groupedDoors = getGroupedDoors();

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div>
          <div className="pro-kicker">
            <i className="fas fa-door-open me-2"></i>
            Door Access Control
          </div>

          <h1>Doors</h1>

          <p>
            Manage physical access points, unlock requests, and employee door
            permissions under your current admin scope.
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
            <i className="fas fa-plus me-2"></i>Add Door
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

      <div className="pro-stats-grid pro-stats-3">
        <div className="pro-stat-card">
          <div className="pro-stat-icon blue">
            <i className="fas fa-building"></i>
          </div>
          <div>
            <div className="pro-stat-value">{groups.length}</div>
            <div className="pro-stat-label">Visible Buildings</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon cyan">
            <i className="fas fa-door-open"></i>
          </div>
          <div>
            <div className="pro-stat-value">{doors.length}</div>
            <div className="pro-stat-label">Configured Doors</div>
          </div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-icon green">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div className="pro-stat-value">{users.length}</div>
            <div className="pro-stat-label">Visible Employees</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="pro-empty-state">
          <div>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading doors...</p>
          </div>
        </div>
      ) : groupedDoors.length === 0 ? (
        <div className="pro-empty-state">
          <div>
            <div className="pro-empty-icon mx-auto">
              <i className="fas fa-door-closed"></i>
            </div>
            <h5>No doors configured</h5>
            <p>Add a door to connect access permissions with a building.</p>
          </div>
        </div>
      ) : (
        <div className="pro-section-list">
          {groupedDoors.map(({ group, doors: groupDoors }) => (
            <section key={group.id} className="pro-section">
              <div className="pro-section-header">
                <div>
                  <span>Building</span>
                  <h3>{group.name}</h3>
                </div>

                <div className="pro-section-count">
                  <strong>{groupDoors.length}</strong>
                  <small>{groupDoors.length === 1 ? "Door" : "Doors"}</small>
                </div>
              </div>

              <div className="pro-card-grid">
                {groupDoors.map((door) => {
                  const userCount = getDoorUserCount(door.id);

                  return (
                    <div key={door.id} className="pro-card">
                      <div className="pro-card-top">
                        <div
                          className="pro-card-icon"
                          style={{
                            background:
                              group.color ||
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          }}
                        >
                          <i className="fas fa-door-open"></i>
                        </div>

                        <span className="pro-status-badge active">
                          Configured
                        </span>
                      </div>

                      <div className="pro-card-body">
                        <h3>{door.name}</h3>

                        <p className="pro-card-code">
                          {door.location || "No location provided"}
                        </p>

                        <p className="pro-card-description">
                          This door belongs to {group.name}. Manage unlock
                          actions and employee access permissions here.
                        </p>

                        <div className="pro-meta-box">
                          <div>
                            <span>Building</span>
                            <strong>{group.name}</strong>
                          </div>

                          <div>
                            <span>Linked Employees</span>
                            <strong>{userCount}</strong>
                          </div>

                          <div>
                            <span>IP Address</span>
                            <strong>{door.ip_address || "Not configured"}</strong>
                          </div>

                          <div>
                            <span>Port</span>
                            <strong>{door.port || 80}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pro-card-footer">
                        <button
                          type="button"
                          className="pro-success-card-btn"
                          onClick={() => handleUnlock(door.id)}
                        >
                          <i className="fas fa-unlock me-2"></i>
                          Unlock
                        </button>

                        <button
                          type="button"
                          className="pro-icon-card-btn"
                          title="Assign employee"
                          onClick={() => handleAssignEmployees(door)}
                        >
                          <i className="fas fa-user-plus"></i>
                        </button>

                        <button
                          type="button"
                          className="pro-icon-card-btn"
                          title="View users"
                          onClick={() => handleViewDoorUsers(door)}
                        >
                          <i className="fas fa-users"></i>
                        </button>

                        <button
                          type="button"
                          className="pro-danger-card-btn"
                          title="Delete door"
                          onClick={() => handleDeleteDoor(door.id, door.name)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <AddDoorModal
        show={showAddModal}
        groups={groups}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleCreateDoor}
      />

      <ConfirmationModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onHide={() =>
          setConfirmModal({
            show: false,
            title: "",
            message: "",
            confirmText: "",
            onConfirm: null,
          })
        }
        onConfirm={confirmModal.onConfirm}
        stacked={showDoorUsersModal}
      />

      <AddUserModal
        show={showAssignModal}
        onHide={() => {
          setShowAssignModal(false);
          setSelectedDoor(null);
        }}
        onSubmit={handleAssignSubmit}
        showToast={showToast}
      />

      <DoorAuthorizedUsersModal
        show={showDoorUsersModal}
        door={selectedDoorForUsers}
        users={users}
        onRemoveAccess={handleRemoveDoorAccess}
        onHide={() => {
          setShowDoorUsersModal(false);
          setSelectedDoorForUsers(null);
        }}
      />
    </div>
  );
}

export default Doors;
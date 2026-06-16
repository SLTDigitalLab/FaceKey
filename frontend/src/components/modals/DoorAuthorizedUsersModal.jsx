import React, { useEffect, useMemo, useState } from "react";

function DoorAuthorizedUsersModal({ show, door, users, onHide, onRemoveAccess }) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (show) {
      setSearchTerm("");
    }
  }, [show, door]);

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

  const authorizedUsers = useMemo(() => {
    if (!door || !Array.isArray(users)) {
      return [];
    }

    return users.filter(
      (user) =>
        Array.isArray(user.authorized_doors) &&
        user.authorized_doors.includes(door.id)
    );
  }, [door, users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return authorizedUsers;
    }

    return authorizedUsers.filter((user) => {
      const searchableText = [
        user.name,
        user.id,
        user.email,
        user.department,
        user.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [authorizedUsers, searchTerm]);

  const getInitials = (name, id) => {
    const source = name || id || "User";

    return source
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (!show || !door) return null;

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
        <div className="modal-dialog modal-lg modal-dialog-centered door-users-dialog">
          <div className="modal-content door-users-modal">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">
                  <i className="fas fa-door-closed me-2"></i>
                  {door.name}
                </h5>

                <small className="text-secondary">
                  {authorizedUsers.length} authorized employee
                  {authorizedUsers.length !== 1 ? "s" : ""}
                </small>
              </div>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onHide}
              ></button>
            </div>

            <div className="modal-body">
              <div className="door-users-search-wrap mb-3">
                <i className="fas fa-search"></i>

                <input
                  type="text"
                  className="form-control door-users-search"
                  placeholder="Search by employee name, ID, email, department..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              {authorizedUsers.length === 0 ? (
                <div className="door-users-empty">
                  <i className="fas fa-users-slash"></i>
                  <h6>No authorized employees</h6>
                  <p>No employee currently has access to this door.</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="door-users-empty">
                  <i className="fas fa-search"></i>
                  <h6>No matching employees</h6>
                  <p>Try searching by another name, ID, or department.</p>
                </div>
              ) : (
                <div className="door-users-list">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="door-user-card">
                      <div className="door-user-avatar">
                        {getInitials(user.name, user.id)}
                      </div>

                      <div className="door-user-info">
                        <div className="door-user-name">
                          {user.name || "Unnamed Employee"}
                        </div>

                        <div className="door-user-meta">{user.id}</div>

                        {(user.department || user.email) && (
                          <div className="door-user-sub-meta">
                            {user.department && (
                              <span>
                                <i className="fas fa-building me-1"></i>
                                {user.department}
                              </span>
                            )}

                            {user.email && (
                              <span>
                                <i className="fas fa-envelope me-1"></i>
                                {user.email}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="door-user-actions">
                        <span className="door-user-status">
                          <i className="fas fa-check-circle me-1"></i>
                          Access
                        </span>

                        <button
                          type="button"
                          className="door-user-remove-btn"
                          onClick={() => onRemoveAccess(user)}
                          title="Remove access from this door"
                        >
                          <i className="fas fa-user-minus me-1"></i>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={onHide}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
}

export default DoorAuthorizedUsersModal;
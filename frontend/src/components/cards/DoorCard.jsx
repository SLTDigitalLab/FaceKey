import React from "react";

function DoorCard({
  door,
  groupName,
  groupColor,
  onUnlock,
  onDelete,
  onAssign,
  onViewAccess,
}) {
  const statusClass = door.is_locked ? "locked" : "online";

  const handleCardClick = () => {
    if (onViewAccess) {
      onViewAccess(door);
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      className="door-card-new"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      title="View employees who can access this door"
    >
      <div className="door-info-new">
        <div
          className="door-icon-new"
          style={{ backgroundColor: `${groupColor}33` }}
        >
          <i className="fas fa-door-closed" style={{ color: groupColor }}></i>
        </div>

        <div>
          <div className="door-name">{door.name}</div>
          <div className="door-location">{door.location || "No location"}</div>
        </div>
      </div>

      <div className="door-actions">
        <div className={`door-status-indicator ${statusClass}`}></div>

        <button
          className="door-action-btn unlock-btn"
          onClick={(event) => {
            event.stopPropagation();
            onUnlock(door.id);
          }}
          title="Unlock door"
        >
          <i className="fas fa-unlock"></i>
        </button>

        <button
          className="door-action-btn assign-btn"
          onClick={(event) => {
            event.stopPropagation();
            onAssign(door);
          }}
          title="Assign Employees"
        >
          <i className="fas fa-user-plus"></i>
        </button>

        <button
          className="door-action-btn delete-btn"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(door.id, door.name);
          }}
          title="Delete door"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}

export default DoorCard;
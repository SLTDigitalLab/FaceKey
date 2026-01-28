import React from 'react'

function DoorCard({ door, groupName, groupColor, onUnlock, onDelete }) {
    const statusClass = door.is_locked ? 'locked' : 'online';

    return (
        <div className="door-card-new">
            <div className="door-info-new">
                <div className="door-icon-new" style={{ backgroundColor: `${groupColor}33` }}>
                    <i className="fas fa-door-closed" style={{ color: groupColor }}></i>
                </div>
                <div>
                    <div className="door-name">{door.name}</div>
                    <div className="door-location">{door.location || 'No location'}</div>
                </div>
            </div>
            <div className="door-actions">
                <div className={`door-status-indicator ${statusClass}`}></div>
                <button
                    className="door-action-btn unlock-btn"
                    onClick={() => onUnlock(door.id)}
                    title="Unlock door"
                >
                    <i className="fas fa-unlock"></i>
                </button>
                <button
                    className="door-action-btn delete-btn"
                    onClick={() => onDelete(door.id, door.name)}
                    title="Delete door"
                >
                    <i className="fas fa-trash"></i>
                </button>
            </div>
        </div>
    )
}

export default DoorCard

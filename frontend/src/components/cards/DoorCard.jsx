import React from 'react'

function DoorCard({ door, groupName, onUnlock, onDelete }) {
    const statusClass = door.is_locked ? 'locked' : 'online';

    return (
        <div className="door-card">
            <div className="door-info">
                <div className="door-icon" style={{ background: 'rgba(102, 126, 234, 0.2)' }}>
                    <i className="fas fa-door-closed" style={{ color: '#667eea' }}></i>
                </div>
                <div>
                    <div className="fw-semibold">{door.name}</div>
                    <div className="small text-secondary">{door.location || groupName}</div>
                </div>
            </div>
            <div className="d-flex align-items-center gap-2">
                <div className={`door-status ${statusClass}`}></div>
                <button
                    className="btn btn-unlock btn-sm"
                    onClick={() => onUnlock(door.id)}
                >
                    <i className="fas fa-lock-open"></i>
                </button>
                <button
                    className="btn btn-delete btn-sm"
                    onClick={() => onDelete(door.id, door.name)}
                >
                    <i className="fas fa-trash"></i>
                </button>
            </div>
        </div>
    )
}

export default DoorCard

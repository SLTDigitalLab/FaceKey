import React from 'react'

function DoorCard({ door, groupName, onUnlock }) {
    const statusClass = door.is_locked ? 'locked' : 'online';

    return (
        <div className="door-card">
            <div className="door-info">
                <div className="door-icon" style={{ background: 'rgba(102, 126, 234, 0.2)' }}>
                    <i className="fas fa-door-open" style={{ color: '#667eea' }}></i>
                </div>
                <div>
                    <div className="fw-semibold">{door.name}</div>
                    <div className="small text-secondary">{groupName}</div>
                </div>
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className={`door-status ${statusClass}`}></div>
                <button
                    className="btn btn-unlock btn-sm"
                    onClick={() => onUnlock(door.id)}
                >
                    <i className="fas fa-lock-open me-1"></i>
                    Unlock
                </button>
            </div>
        </div>
    )
}

export default DoorCard

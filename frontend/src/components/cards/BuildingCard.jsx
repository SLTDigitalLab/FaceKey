import React from 'react'

function BuildingCard({ group, onManage, onDelete, onClick, userCount, doorCount }) {
    // Use the color from the group object, fallback to purple gradient
    const iconBg = group.color || '#667eea';
    const showFooter = onManage || onDelete;

    return (
        <div
            className="building-card-new"
            style={{ '--building-color': iconBg, cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <div className="building-card-header">
                <div className="group-icon" style={{ background: iconBg }}>
                    <i className="fas fa-building text-white"></i>
                </div>
            </div>
            <div className="building-card-body">
                <h3 className="building-name">{group.name}</h3>
                <p className="building-description">{group.description || 'No description'}</p>
                <div className="building-stats">
                    <span className="building-stat">
                        <i className="fas fa-door-open"></i>
                        {doorCount} {doorCount === 1 ? 'door' : 'doors'}
                    </span>
                    <span className="building-stat">
                        <i className="fas fa-users"></i>
                        {userCount} {userCount === 1 ? 'user' : 'users'}
                    </span>
                </div>
            </div>
            {showFooter && (
                <div className="building-card-footer">
                    {onManage && (
                        <button className="btn-manage-building" onClick={(e) => { e.stopPropagation(); onManage(); }}>
                            Manage Building
                        </button>
                    )}
                    {onDelete && (
                        <button className="btn-delete-building" onClick={(e) => { e.stopPropagation(); onDelete(e); }}>
                            <i className="fas fa-trash"></i>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default BuildingCard

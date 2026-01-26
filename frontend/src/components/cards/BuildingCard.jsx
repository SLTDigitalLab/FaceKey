import React from 'react'

function BuildingCard({ group, onClick, color }) {
    const colorMap = {
        0: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        3: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    };

    const iconBg = colorMap[color] || colorMap[0];

    return (
        <div
            className="building-card"
            onClick={onClick}
            style={{ '--building-color': iconBg }}
        >
            <div className="group-icon" style={{ background: iconBg }}>
                <i className="fas fa-building text-white"></i>
            </div>
            <div className="group-name">{group.name}</div>
            <div className="group-stats">
                <span>
                    <i className="fas fa-door-open me-1"></i>
                    {group.doors?.length || 0} Doors
                </span>
            </div>
        </div>
    )
}

export default BuildingCard

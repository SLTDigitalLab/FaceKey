import React from 'react'

function StatCard({ icon, value, label, gradient }) {
    return (
        <div className="stat-card">
            <div className="icon-wrapper" style={{ background: gradient }}>
                <i className={icon}></i>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    )
}

export default StatCard

import React from 'react'

function LogItem({ log }) {
    const isGranted = log.event_type === 'granted' || log.access_granted;
    const iconClass = isGranted ? 'granted' : 'denied';
    const icon = isGranted ? 'fa-check' : 'fa-times';

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const diff = new Date() - date;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="log-item">
            <div className={`log-icon ${iconClass}`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div className="flex-grow-1">
                <div className="fw-semibold">{log.user_name || log.user_id || 'Unknown'}</div>
                <div className="small text-secondary">{log.door_name || 'Unknown Door'}</div>
            </div>
            <div className="text-end">
                <div className="small">
                    <span className={`badge ${log.event_type === 'granted' || log.access_granted ? 'bg-success' : 'bg-danger'}`}>
                        {log.event_type === 'granted' || log.access_granted ? 'Granted' : 'Denied'}
                    </span>
                </div>
                <div className="small text-secondary">{formatTime(log.timestamp)}</div>
            </div>
        </div>
    )
}

export default LogItem

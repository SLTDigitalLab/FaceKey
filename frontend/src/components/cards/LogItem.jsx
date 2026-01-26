import React from 'react'

function LogItem({ log }) {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const getEventBadgeClass = (eventType) => {
        switch(eventType) {
            case 'granted':
            case 'face_recognition':
                return 'bg-success';
            case 'denied':
                return 'bg-danger';
            case 'manual_unlock':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <div className="log-item">
            <div className="log-icon">
                <i className="fas fa-door-open"></i>
            </div>
            <div className="flex-grow-1">
                <div className="fw-semibold">{log.user_name || 'Unknown User'}</div>
                <div className="small text-secondary">
                    <i className="fas fa-door-closed me-1"></i>
                    {log.door_id}
                    {log.building_name && (
                        <>
                            <span className="mx-2">•</span>
                            <i className="fas fa-building me-1"></i>
                            {log.building_name}
                        </>
                    )}
                </div>
            </div>
            <div className="text-end">
                <div className="mb-1">
                    <span className={`badge ${getEventBadgeClass(log.event_type)}`}>
                        {log.event_type}
                    </span>
                </div>
                <div className="small text-secondary">{formatTime(log.timestamp)}</div>
            </div>
        </div>
    )
}

export default LogItem

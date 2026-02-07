import React from 'react'

function Toast({ toasts }) {
    const bgClass = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    };

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast show ${bgClass[toast.type] || 'bg-info'}`}
                    role="alert"
                >
                    <div className="toast-body text-white">
                        {toast.message}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Toast

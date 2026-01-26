import React from 'react'

function ConfirmationModal({ show, title, message, onHide, onConfirm, confirmText = "Confirm", type = "danger" }) {
    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-sm">
                    <div className="modal-content confirmation-modal">
                        <div className="confirmation-header">
                            <div className="confirmation-icon">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h5 className="confirmation-title">{title}</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                        </div>
                        <div className="confirmation-body">
                            <p className="confirmation-message">{message}</p>
                        </div>
                        <div className="confirmation-footer">
                            <button type="button" className="btn-cancel" onClick={onHide}>
                                Cancel
                            </button>
                            <button type="button" className={`btn-confirm btn-confirm-${type}`} onClick={onConfirm}>
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}

export default ConfirmationModal

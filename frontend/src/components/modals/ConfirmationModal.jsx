import React from 'react'

function ConfirmationModal({ show, title, message, onHide, onConfirm }) {
    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                                {title}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            <p>{message}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-light" onClick={onHide}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-gradient-danger" onClick={onConfirm}>
                                <i className="fas fa-check me-2"></i>Confirm
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

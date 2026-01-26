import React, { useState } from 'react'
import { api } from '../../services/api'

function AddUserModal({ show, onHide, onSubmit, showToast }) {
    const [formData, setFormData] = useState({
        user_id: ''
    });
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        if (!formData.user_id.trim()) {
            showToast('Please enter an Employee ID', 'warning');
            return;
        }

        setIsVerifying(true);
        try {
            const result = await api.verifyEmployee(formData.user_id);
            if (result.exists) {
                showToast('Employee verified successfully', 'success');
            } else {
                showToast('Employee ID not found in system', 'error');
            }
        } catch (error) {
            showToast('Error verifying employee. Please check the ID and try again.', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.user_id.trim()) {
            showToast('Please enter an Employee ID', 'warning');
            return;
        }
        onSubmit(formData);
        setFormData({ user_id: '' });
    };

    const handleClose = () => {
        setFormData({ user_id: '' });
        onHide();
    };

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-user-plus me-2"></i>Link Employee
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="alert alert-info mb-3">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Enter an Employee ID that is already registered in the central Visage system. The employee details will be fetched automatically.
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Employee ID</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g., InSP/2025/4593/526"
                                            value={formData.user_id}
                                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-light"
                                            onClick={handleVerify}
                                            disabled={isVerifying}
                                        >
                                            {isVerifying ? (
                                                <i className="fas fa-spinner fa-spin"></i>
                                            ) : (
                                                <>
                                                    <i className="fas fa-search me-1"></i>Verify
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <small className="form-text text-muted">
                                        Format: InSPYYYY/XXXX/XXX or InSPYYYY/XXXX/XXX - Name
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-light" onClick={handleClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-gradient">
                                    Link Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}

export default AddUserModal

import React, { useState } from 'react'
import { api } from '../../services/api'

function AddUserModal({ show, onHide, onSubmit, showToast }) {
    const [formData, setFormData] = useState({
        user_id: '',
        first_name: '',
        last_name: '',
        department: '',
        email: ''
    });
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [employeeData, setEmployeeData] = useState(null);

    const handleVerify = async () => {
        if (!formData.user_id.trim()) {
            showToast('Please enter an Employee ID', 'warning');
            return;
        }

        setIsVerifying(true);
        try {
            const result = await api.verifyEmployee(formData.user_id);
            if (result.exists) {
                setIsVerified(true);
                setEmployeeData(result.data);
                // Update form data with employee name if available
                if (result.data?.name) {
                    const nameParts = result.data.name.split(' ');
                    setFormData({
                        ...formData,
                        user_id: `${formData.user_id} - ${result.data.name}`,
                        first_name: nameParts[0] || '',
                        last_name: nameParts.slice(1).join(' ') || '',
                        department: result.data.department || '',
                        email: result.data.email || ''
                    });
                }
                showToast('Employee verified successfully!', 'success');
            } else {
                showToast('Employee ID not found in system', 'error');
                setIsVerified(false);
            }
        } catch (error) {
            showToast('Error verifying employee. Please check the ID and try again.', 'error');
            setIsVerified(false);
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
        if (!isVerified) {
            showToast('Please verify the Employee ID first', 'warning');
            return;
        }
        onSubmit(formData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({ 
            user_id: '',
            first_name: '',
            last_name: '',
            department: '',
            email: ''
        });
        setIsVerified(false);
        setEmployeeData(null);
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
                                            disabled={isVerified}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-light"
                                            onClick={handleVerify}
                                            disabled={isVerifying || isVerified}
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
                                        Format: InSP/YYYY/XXXX/XXX or InSP/YYYY/XXXX/XXX - Name
                                    </small>
                                </div>

                                {isVerified && (
                                    <>
                                        <div className="alert alert-success mb-3">
                                            <i className="fas fa-check-circle me-2"></i>
                                            Employee ID Verified
                                        </div>
                                        
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">First Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="First Name"
                                                    value={formData.first_name}
                                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Last Name"
                                                    value={formData.last_name}
                                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Department</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Department"
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Email (Optional)</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="email@company.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
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

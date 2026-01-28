import React, { useState } from 'react'

function AddDoorModal({ show, groups, onHide, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        group_id: '',
        ip_address: '',
        port: '80'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({ name: '', location: '', group_id: '', ip_address: '', port: '80' });
    };

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-door-open me-2"></i>Add Door
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Door Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., Main Entrance"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., Ground Floor"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Building</label>
                                    <select
                                        className="form-select"
                                        value={formData.group_id}
                                        onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a building</option>
                                        {groups.map(group => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="row">
                                    <div className="col-md-7 mb-3">
                                        <label className="form-label">IP Address</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="192.168.1.100"
                                            value={formData.ip_address}
                                            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-5 mb-3">
                                        <label className="form-label">Port</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="80"
                                            value={formData.port}
                                            onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-light" onClick={onHide}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-gradient">
                                    Add Door
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

export default AddDoorModal

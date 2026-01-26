import React, { useState } from 'react'

function AddBuildingModal({ show, onHide, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#667eea',
        icon: 'Office Building'
    });
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({ name: '', description: '', color: '#667eea', icon: 'Office Building' });
    };

    const iconOptions = [
        'Office Building',
        'Apartment',
        'Factory',
        'Warehouse',
        'School',
        'Hospital',
        'Hotel',
        'Shopping Mall'
    ];

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-building me-2"></i>Add Building
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Building Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., A Building"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Optional description (e.g., location, address)"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Color</label>
                                        <div className="color-picker-wrapper">
                                            <input
                                                type="color"
                                                className="form-control color-picker-input"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            />
                                            <div 
                                                className="color-preview"
                                                style={{ background: formData.color }}
                                                onClick={() => setShowColorPicker(!showColorPicker)}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Icon</label>
                                        <select
                                            className="form-select"
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        >
                                            {iconOptions.map(icon => (
                                                <option key={icon} value={icon}>{icon}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-light" onClick={onHide}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-gradient">
                                    Create Building
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

export default AddBuildingModal

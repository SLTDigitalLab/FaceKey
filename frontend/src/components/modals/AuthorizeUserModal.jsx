import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'

function AuthorizeUserModal({ show, user, groups, doors, onHide, onSubmit, showToast }) {
    const [selectedDoors, setSelectedDoors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (show && user) {
            loadUserDoors();
        }
    }, [show, user]);

    const loadUserDoors = async () => {
        try {
            const userDoors = await api.getUserDoors(user.id);
            // userDoors is now an array of door IDs
            setSelectedDoors(userDoors);
        } catch (error) {
            setSelectedDoors([]);
        }
    };

    const handleToggleDoor = (doorId) => {
        setSelectedDoors(prev =>
            prev.includes(doorId)
                ? prev.filter(id => id !== doorId)
                : [...prev, doorId]
        );
    };

    const handleSubmit = () => {
        onSubmit(user.id, selectedDoors);
    };

    const filteredGroups = groups.map(group => ({
        group,
        doors: doors.filter(door =>
            door.building_id === group.id &&
            door.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(item => item.doors.length > 0);

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-key me-2"></i>Manage Door Access
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-secondary mb-3">
                                Select which doors <strong>{user?.name || user?.id}</strong> can access
                            </p>
                            
                            <div className="mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search doors..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {filteredGroups.length === 0 ? (
                                    <div className="text-center py-4">
                                        <i className="fas fa-door-open fa-3x text-secondary mb-3"></i>
                                        <p className="text-secondary">No doors available. Add doors to buildings first.</p>
                                    </div>
                                ) : (
                                    filteredGroups.map(({ group, doors: groupDoors }) => (
                                        <div key={group.id} className="mb-4">
                                            <div className="d-flex align-items-center mb-3">
                                                <i className="fas fa-building text-primary me-2"></i>
                                                <h6 className="mb-0">{group.name}</h6>
                                            </div>
                                            <div className="ms-4">
                                                {groupDoors.map(door => (
                                                    <div key={door.id} className="form-check mb-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`door-${door.id}`}
                                                            checked={selectedDoors.includes(door.id)}
                                                            onChange={() => handleToggleDoor(door.id)}
                                                        />
                                                        <label className="form-check-label d-flex align-items-center" htmlFor={`door-${door.id}`}>
                                                            <i className="fas fa-door-closed me-2 text-secondary"></i>
                                                            <span>{door.name}</span>
                                                            {door.location && <span className="text-secondary ms-2">({door.location})</span>}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-light" onClick={onHide}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-gradient" onClick={handleSubmit}>
                                Save Permissions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}

export default AuthorizeUserModal

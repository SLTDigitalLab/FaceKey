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
            door.group_id === group.id &&
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
                                <i className="fas fa-key me-2"></i>Authorize Doors - {user.name}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
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
                                    <p className="text-secondary">No doors available. Add doors to buildings first.</p>
                                ) : (
                                    filteredGroups.map(({ group, doors: groupDoors }) => (
                                        <div key={group.id} className="building-section">
                                            <h6 className="mb-3">{group.name}</h6>
                                            <div className="row g-2 mb-3">
                                                {groupDoors.map(door => (
                                                    <div key={door.id} className="col-md-6">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input door-checkbox"
                                                                type="checkbox"
                                                                id={`door-${door.id}`}
                                                                checked={selectedDoors.includes(door.id)}
                                                                onChange={() => handleToggleDoor(door.id)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`door-${door.id}`}>
                                                                {door.name}
                                                            </label>
                                                        </div>
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
                                <i className="fas fa-save me-2"></i>Save Authorization
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

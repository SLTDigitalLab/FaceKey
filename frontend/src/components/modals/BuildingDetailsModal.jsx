import React from 'react'

function BuildingDetailsModal({ group, doors, show, onHide, onDelete }) {
    const groupDoors = doors.filter(door => door.group_id === group.id);

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-building me-2"></i>{group.name}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <strong>Description:</strong>
                                <p className="text-secondary mb-0">{group.description || 'No description'}</p>
                            </div>
                            <div className="mb-3">
                                <strong>Location:</strong>
                                <p className="text-secondary mb-0">{group.location || 'No location specified'}</p>
                            </div>

                            <hr className="border-secondary" />

                            <h6 className="mb-3">Doors in this Building</h6>
                            {groupDoors.length === 0 ? (
                                <p className="text-secondary">No doors configured for this building.</p>
                            ) : (
                                <div className="row g-2">
                                    {groupDoors.map(door => (
                                        <div key={door.id} className="col-md-6">
                                            <div className="stat-card py-2 px-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="fas fa-door-open text-primary"></i>
                                                    <div>
                                                        <div className="fw-semibold">{door.name}</div>
                                                        <small className="text-secondary">{door.location || 'No location'}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-gradient-danger"
                                onClick={() => onDelete(group.id)}
                            >
                                <i className="fas fa-trash me-2"></i>Delete Building
                            </button>
                            <button type="button" className="btn btn-outline-light" onClick={onHide}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}

export default BuildingDetailsModal

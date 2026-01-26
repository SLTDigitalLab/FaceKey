import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'

function BuildingDetailsModal({ group, doors, show, onHide, onDelete, showToast }) {
    const [activeTab, setActiveTab] = useState('doors');
    const [buildingDoors, setBuildingDoors] = useState([]);
    const [authorizedUsers, setAuthorizedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (show && group) {
            loadBuildingDetails();
        }
    }, [show, group]);

    const loadBuildingDetails = async () => {
        try {
            setLoading(true);
            // Get building details with doors and users
            const response = await fetch(`/api/v1/door-access/buildings/${group.id}`);
            const data = await response.json();
            
            setBuildingDoors(data.doors_detail || []);
            setAuthorizedUsers(data.users_detail || []);
        } catch (error) {
            console.error('Failed to load building details:', error);
            // Fallback to the doors passed in props
            const groupDoors = doors.filter(door => door.building_id === group.id);
            setBuildingDoors(groupDoors);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlockDoor = async (doorId, doorName) => {
        try {
            await api.unlockDoor(doorId);
            if (showToast) {
                showToast(`Door "${doorName}" unlocked successfully`, 'success');
            }
        } catch (error) {
            if (showToast) {
                showToast(`Failed to unlock door "${doorName}"`, 'error');
            }
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content building-details-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-building me-2"></i>{group.name}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                        </div>
                        
                        {/* Tabs Navigation */}
                        <div className="building-tabs">
                            <button 
                                className={`tab-button ${activeTab === 'doors' ? 'active' : ''}`}
                                onClick={() => setActiveTab('doors')}
                            >
                                <i className="fas fa-door-open me-2"></i>Doors
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <i className="fas fa-users me-2"></i>Authorized Users
                            </button>
                        </div>

                        <div className="modal-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Doors Tab Content */}
                                    {activeTab === 'doors' && (
                                        <div className="tab-content-doors">
                                            {buildingDoors.length === 0 ? (
                                                <p className="text-secondary text-center py-4">No doors configured for this building.</p>
                                            ) : (
                                                <div className="doors-list">
                                                    {buildingDoors.map(door => (
                                                        <div key={door.id} className="door-item">
                                                            <div className="door-item-icon">
                                                                <i className="fas fa-door-closed"></i>
                                                            </div>
                                                            <div className="door-item-info">
                                                                <div className="door-item-name">{door.name}</div>
                                                                <div className="door-item-details">
                                                                    {door.location || 'No details'}
                                                                </div>
                                                            </div>
                                                            <button 
                                                                className="btn-unlock"
                                                                onClick={() => handleUnlockDoor(door.id, door.name)}
                                                            >
                                                                <i className="fas fa-unlock me-2"></i>Unlock
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Authorized Users Tab Content */}
                                    {activeTab === 'users' && (
                                        <div className="tab-content-users">
                                            {authorizedUsers.length === 0 ? (
                                                <p className="text-secondary text-center py-4">No users authorized for this building.</p>
                                            ) : (
                                                <div className="users-list">
                                                    {authorizedUsers.map(user => (
                                                        <div key={user.id} className="user-item">
                                                            <div className="user-item-icon">
                                                                <i className="fas fa-user"></i>
                                                            </div>
                                                            <div className="user-item-info">
                                                                <div className="user-item-name">{user.name}</div>
                                                                <div className="user-item-details">
                                                                    {user.email || user.id}
                                                                </div>
                                                            </div>
                                                            <div className="user-item-badge">
                                                                <i className="fas fa-check-circle me-1"></i>
                                                                {user.authorized_doors?.filter(doorId => 
                                                                    buildingDoors.some(d => d.id === doorId)
                                                                ).length || 0} doors
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}

export default BuildingDetailsModal

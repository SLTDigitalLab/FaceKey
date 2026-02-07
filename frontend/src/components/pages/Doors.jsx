import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import PageHeader from '../layout/PageHeader'
import DoorCard from '../cards/DoorCard'
import AddDoorModal from '../modals/AddDoorModal'
import ConfirmationModal from '../modals/ConfirmationModal'

function Doors({ showToast }) {
    const [groups, setGroups] = useState([]);
    const [doors, setDoors] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [groupsData, doorsData] = await Promise.all([
                api.getGroups(),
                api.getDoors()
            ]);
            setGroups(groupsData);
            setDoors(doorsData);
        } catch (error) {
            showToast('Failed to load doors', 'error');
        }
    };

    const handleCreateDoor = async (data) => {
        try {
            // Transform data to match backend API
            const doorData = {
                name: data.name,
                building_id: data.group_id,
                location: data.location || '',
                ip_address: data.ip_address || '',
                port: data.port || 80
            };
            const result = await api.createDoor(doorData);
            if (result.success) {
                showToast('Door added successfully', 'success');
                setShowAddModal(false);
                loadData();
            }
        } catch (error) {
            showToast(error.message || 'Failed to add door', 'error');
        }
    };

    const handleUnlock = async (doorId) => {
        try {
            const result = await api.unlockDoor(doorId);
            showToast(result.message, result.success ? 'success' : 'error');
        } catch (error) {
            showToast('Failed to unlock door', 'error');
        }
    };

    const handleDeleteDoor = (doorId, doorName) => {
        setConfirmModal({
            show: true,
            title: 'Delete Door',
            message: 'Are you sure you want to delete this door?',
            confirmText: 'Start Deletion',
            onConfirm: async () => {
                try {
                    await api.deleteDoor(doorId);
                    showToast('Door deleted successfully', 'success');
                    setConfirmModal({ ...confirmModal, show: false });
                    loadData();
                } catch (error) {
                    showToast('Failed to delete door', 'error');
                }
            }
        });
    };

    const groupedDoors = groups.map(group => ({
        group,
        doors: doors.filter(door => door.building_id === group.id)
    })).filter(item => item.doors.length > 0);

    return (
        <div>
            <div className="page-header-custom">
                <div>
                    <h1 className="page-title">Doors</h1>
                    <p className="page-subtitle">Manage physical doors and user access permissions</p>
                </div>
                <button className="btn btn-gradient" onClick={() => setShowAddModal(true)}>
                    <i className="fas fa-plus me-2"></i>Add Door
                </button>
            </div>

            {groupedDoors.length === 0 ? (
                <p className="text-secondary text-center py-4">No doors configured</p>
            ) : (
                groupedDoors.map(({ group, doors: groupDoors }) => (
                    <div key={group.id} className="mb-5">
                        <div className="building-section-header">
                            <h3 className="building-section-title" style={{ color: group.color || '#667eea' }}>{group.name}</h3>
                            <span className="building-section-count">{groupDoors.length} door{groupDoors.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="doors-grid">
                            {groupDoors.map(door => (
                                <DoorCard
                                    key={door.id}
                                    door={door}
                                    groupName={group.name}
                                    groupColor={group.color || '#667eea'}
                                    onUnlock={handleUnlock}
                                    onDelete={handleDeleteDoor}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}

            <AddDoorModal
                show={showAddModal}
                groups={groups}
                onHide={() => setShowAddModal(false)}
                onSubmit={handleCreateDoor}
            />

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                onHide={() => setConfirmModal({ ...confirmModal, show: false })}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    )
}

export default Doors

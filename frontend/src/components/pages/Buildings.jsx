import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import PageHeader from '../layout/PageHeader'
import BuildingCard from '../cards/BuildingCard'
import AddBuildingModal from '../modals/AddBuildingModal'
import BuildingDetailsModal from '../modals/BuildingDetailsModal'
import ConfirmationModal from '../modals/ConfirmationModal'

function Buildings({ showToast }) {
    const [groups, setGroups] = useState([]);
    const [doors, setDoors] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [buildingToDelete, setBuildingToDelete] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [groupsData, doorsData, usersData] = await Promise.all([
                api.getGroups(),
                api.getDoors(),
                api.getUsers()
            ]);
            setGroups(groupsData);
            setDoors(doorsData);
            setUsers(usersData);
        } catch (error) {
            showToast('Failed to load buildings', 'error');
        }
    };

    const handleCreateGroup = async (data) => {
        try {
            const result = await api.createGroup(data);
            if (result.success) {
                showToast('Building created successfully', 'success');
                setShowAddModal(false);
                loadData();
            }
        } catch (error) {
            showToast(error.message || 'Failed to create building', 'error');
        }
    };

    const handleDeleteGroup = async (groupId) => {
        try {
            await api.deleteGroup(groupId);
            showToast('Building deleted successfully', 'success');
            setShowDetailsModal(false);
            loadData();
        } catch (error) {
            showToast('Failed to delete building', 'error');
        }
    };

    const handleBuildingClick = (group) => {
        setSelectedGroup(group);
        setShowDetailsModal(true);
    };

    const handleDeleteClick = (e, group) => {
        e.stopPropagation();
        setBuildingToDelete(group);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (buildingToDelete) {
            await handleDeleteGroup(buildingToDelete.id);
            setShowDeleteModal(false);
            setBuildingToDelete(null);
        }
    };

    // Calculate user count for each building
    const getUserCountForBuilding = (buildingId) => {
        const buildingDoorIds = doors
            .filter(door => door.building_id === buildingId)
            .map(door => door.id);
        
        const uniqueUsers = new Set();
        users.forEach(user => {
            if (user.authorized_doors && user.authorized_doors.some(doorId => buildingDoorIds.includes(doorId))) {
                uniqueUsers.add(user.id);
            }
        });
        return uniqueUsers.size;
    };

    return (
        <div>
            <div className="page-header-custom">
                <div>
                    <h1 className="page-title">Buildings</h1>
                    <p className="page-subtitle">Manage buildings and their doors</p>
                </div>
                <button className="btn btn-gradient" onClick={() => setShowAddModal(true)}>
                    <i className="fas fa-plus me-2"></i>Add Building
                </button>
            </div>

            <div className="row g-4">
                {groups.map((group, idx) => (
                    <div key={group.id} className="col-md-6 col-lg-4 col-xl-3">
                        <BuildingCard
                            group={group}
                            onManage={() => handleBuildingClick(group)}
                            onDelete={(e) => handleDeleteClick(e, group)}
                            userCount={getUserCountForBuilding(group.id)}
                            doorCount={group.doors?.length || 0}
                            color={idx % 4}
                        />
                    </div>
                ))}
            </div>

            <AddBuildingModal
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                onSubmit={handleCreateGroup}
            />

            {showDetailsModal && selectedGroup && (
                <BuildingDetailsModal
                    group={selectedGroup}
                    doors={doors}
                    show={showDetailsModal}
                    onHide={() => setShowDetailsModal(false)}
                    onDelete={handleDeleteGroup}
                    showToast={showToast}
                />
            )}

            <ConfirmationModal
                show={showDeleteModal}
                title="Delete Building"
                message="Are you sure you want to delete this building? All doors in this building will also be deleted."
                confirmText="Start Deletion"
                type="danger"
                onHide={() => {
                    setShowDeleteModal(false);
                    setBuildingToDelete(null);
                }}
                onConfirm={confirmDelete}
            />
        </div>
    )
}

export default Buildings

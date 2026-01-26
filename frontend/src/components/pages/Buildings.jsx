import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import PageHeader from '../layout/PageHeader'
import BuildingCard from '../cards/BuildingCard'
import AddBuildingModal from '../modals/AddBuildingModal'
import BuildingDetailsModal from '../modals/BuildingDetailsModal'

function Buildings({ showToast }) {
    const [groups, setGroups] = useState([]);
    const [doors, setDoors] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

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
                            onClick={() => handleBuildingClick(group)}
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
                />
            )}
        </div>
    )
}

export default Buildings

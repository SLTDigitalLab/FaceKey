import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import PageHeader from '../layout/PageHeader'
import AddUserModal from '../modals/AddUserModal'
import AuthorizeUserModal from '../modals/AuthorizeUserModal'
import ConfirmationModal from '../modals/ConfirmationModal'

function Users({ showToast }) {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [doors, setDoors] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersData, groupsData, doorsData] = await Promise.all([
                api.getUsers(),
                api.getGroups(),
                api.getDoors()
            ]);
            setUsers(usersData);
            setGroups(groupsData);
            setDoors(doorsData);
        } catch (error) {
            showToast('Failed to load users', 'error');
        }
    };

    const handleCreateUser = async (data) => {
        try {
            // Transform data to match backend API
            const userData = {
                id: data.user_id,
                name: `${data.first_name} ${data.last_name}`,
                email: data.email || '',
                department: data.department || '',
                role: data.role || 'employee'
            };
            const result = await api.createUser(userData);
            if (result.success) {
                showToast('User created successfully', 'success');
                setShowAddModal(false);
                loadData();
            }
        } catch (error) {
            showToast('Failed to create user', 'error');
        }
    };

    const handleDeleteUser = (userId, userName) => {
        setConfirmModal({
            show: true,
            title: 'Delete User',
            message: `Are you sure you want to delete "${userName}"? This will revoke all door access for this user.`,
            onConfirm: async () => {
                try {
                    await api.deleteUser(userId);
                    showToast('User deleted successfully', 'success');
                    setConfirmModal({ ...confirmModal, show: false });
                    loadData();
                } catch (error) {
                    showToast('Failed to delete user', 'error');
                }
            }
        });
    };

    const handleAuthorizeUser = (user) => {
        setSelectedUser(user);
        setShowAuthModal(true);
    };

    const handleSaveAuthorization = async (userId, doorIds) => {
        try {
            const result = await api.updateUserDoors(userId, doorIds);
            if (result.success) {
                showToast('Door access updated successfully', 'success');
                setShowAuthModal(false);
                loadData();
            }
        } catch (error) {
            showToast('Failed to update door access', 'error');
        }
    };

    return (
        <div>
            <div className="page-header-custom">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">Manage employee door access permissions</p>
                </div>
                <button className="btn btn-gradient" onClick={() => setShowAddModal(true)}>
                    <i className="fas fa-plus me-2"></i>Link Employee
                </button>
            </div>

            <div className="row g-3">
                {users.map(user => (
                    <div key={user.user_id} className="col-12">
                        <div className="stat-card">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="user-avatar">
                                        {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="fw-semibold">{user.name}</div>
                                        <div className="small text-secondary">ID: {user.id}</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-gradient btn-sm"
                                        onClick={() => handleAuthorizeUser(user)}
                                    >
                                        <i className="fas fa-key me-1"></i>Authorize Doors
                                    </button>
                                    <button
                                        className="btn btn-gradient-danger btn-sm"
                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                    >
                                        <i className="fas fa-trash me-1"></i>Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AddUserModal
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                onSubmit={handleCreateUser}
                showToast={showToast}
            />

            {showAuthModal && selectedUser && (
                <AuthorizeUserModal
                    show={showAuthModal}
                    user={selectedUser}
                    groups={groups}
                    doors={doors}
                    onHide={() => setShowAuthModal(false)}
                    onSubmit={handleSaveAuthorization}
                    showToast={showToast}
                />
            )}

            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                onHide={() => setConfirmModal({ ...confirmModal, show: false })}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    )
}

export default Users

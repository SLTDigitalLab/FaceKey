import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import PageHeader from '../layout/PageHeader'
import LogItem from '../cards/LogItem'

function Logs({ showToast }) {
    const [accessLogs, setAccessLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [accessLogs, selectedBuilding]);

    const loadData = async () => {
        try {
            const [logsData, groupsData] = await Promise.all([
                api.getAccessLogs(),
                api.getGroups()
            ]);
            setAccessLogs(logsData);
            setGroups(groupsData);
        } catch (error) {
            showToast('Failed to load access logs', 'error');
        }
    };

    const applyFilters = () => {
        let filtered = [...accessLogs];

        if (selectedBuilding !== 'all') {
            filtered = filtered.filter(log => log.group_id === parseInt(selectedBuilding));
        }

        setFilteredLogs(filtered);
    };

    return (
        <div>
            <div className="page-header-custom">
                <div>
                    <h1 className="page-title">Access Logs</h1>
                    <p className="page-subtitle">View all access events and activity</p>
                </div>
                <div className="d-flex gap-2">
                    <select
                        className="form-select"
                        value={selectedBuilding}
                        onChange={(e) => setSelectedBuilding(e.target.value)}
                        style={{ width: 'auto', minWidth: '180px' }}
                    >
                        <option value="all">All Buildings</option>
                        {groups.map(group => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                    </select>
                    <button className="btn btn-outline-light" onClick={loadData}>
                        <i className="fas fa-sync-alt me-2"></i>Refresh
                    </button>
                </div>
            </div>

            <div>
                {filteredLogs.length === 0 ? (
                    <div className="empty-state-large">
                        <p className="text-secondary">No access logs found</p>
                    </div>
                ) : (
                    filteredLogs.map(log => (
                        <LogItem key={log.id} log={log} />
                    ))
                )}
            </div>
        </div>
    )
}

export default Logs

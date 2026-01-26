const API_BASE = '/api/v1/door-access';

export const api = {
  // Buildings (called groups in UI)
  async getGroups() {
    const res = await fetch(`${API_BASE}/buildings`);
    if (!res.ok) throw new Error('Failed to fetch buildings');
    return res.json();
  },

  async createGroup(data) {
    const res = await fetch(`${API_BASE}/buildings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create building');
    return res.json();
  },

  async deleteGroup(groupId) {
    const res = await fetch(`${API_BASE}/buildings/${groupId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete building');
    return res.json();
  },

  // Doors
  async getDoors() {
    const res = await fetch(`${API_BASE}/doors`);
    if (!res.ok) throw new Error('Failed to fetch doors');
    return res.json();
  },

  async createDoor(data) {
    const res = await fetch(`${API_BASE}/doors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create door');
    return res.json();
  },

  async deleteDoor(doorId) {
    const res = await fetch(`${API_BASE}/doors/${doorId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete door');
    return res.json();
  },

  async unlockDoor(doorId) {
    const res = await fetch(`${API_BASE}/doors/${doorId}/open`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to unlock door');
    return res.json();
  },

  // Users
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async verifyEmployee(empId) {
    const res = await fetch(`${API_BASE}/users/verify/${empId}`);
    if (!res.ok) throw new Error('Failed to verify employee');
    return res.json();
  },

  async createUser(data) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },

  async deleteUser(userId) {
    const encodedUserId = encodeURIComponent(userId);
    const res = await fetch(`${API_BASE}/users/${encodedUserId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  async getUserDoors(userId) {
    const encodedUserId = encodeURIComponent(userId);
    const res = await fetch(`${API_BASE}/users/${encodedUserId}`);
    if (!res.ok) throw new Error('Failed to fetch user doors');
    const user = await res.json();
    // Return authorized_doors array from user object
    return user.authorized_doors || [];
  },

  async updateUserDoors(userId, doorIds) {
    const encodedUserId = encodeURIComponent(userId);
    const res = await fetch(`${API_BASE}/users/${encodedUserId}/authorize-doors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ door_ids: doorIds })
    });
    if (!res.ok) throw new Error('Failed to update user doors');
    return res.json();
  },

  // Access Logs
  async getAccessLogs() {
    const res = await fetch(`${API_BASE}/access-logs`);
    if (!res.ok) throw new Error('Failed to fetch access logs');
    return res.json();
  }
};

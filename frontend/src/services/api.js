// const API_BASE = "/api/v1/door-access";

// const ADMIN_STORAGE_KEY = "facekey_admin_id";
// const ADMIN_PROFILE_KEY = "facekey_admin_profile";

// function getStoredAdminId() {
//   return localStorage.getItem(ADMIN_STORAGE_KEY);
// }

// function getAuthHeaders(extraHeaders = {}) {
//   const adminId = getStoredAdminId();

//   return {
//     ...extraHeaders,
//     ...(adminId ? { "X-Admin-Id": adminId } : {}),
//   };
// }

// async function handleResponse(res, fallbackMessage) {
//   if (!res.ok) {
//     let message = fallbackMessage;

//     try {
//       const data = await res.json();
//       message = data.detail || data.message || fallbackMessage;
//     } catch {
//       const text = await res.text();
//       message = text || fallbackMessage;
//     }

//     throw new Error(message);
//   }

//   return res.json();
// }

// export const api = {
//   // Temporary admin session helpers
//   getStoredAdminId() {
//     return getStoredAdminId();
//   },

//   setAdminSession(adminId, adminProfile = null) {
//     localStorage.setItem(ADMIN_STORAGE_KEY, adminId);

//     if (adminProfile) {
//       localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminProfile));
//     }
//   },

//   clearAdminSession() {
//     localStorage.removeItem(ADMIN_STORAGE_KEY);
//     localStorage.removeItem(ADMIN_PROFILE_KEY);
//   },

//   getStoredAdminProfile() {
//     const rawProfile = localStorage.getItem(ADMIN_PROFILE_KEY);

//     if (!rawProfile) return null;

//     try {
//       return JSON.parse(rawProfile);
//     } catch {
//       return null;
//     }
//   },

//   async getCurrentAdmin(adminId = null) {
//     const headers = adminId
//       ? { "X-Admin-Id": adminId }
//       : getAuthHeaders();

//     const res = await fetch(`${API_BASE}/admin/me`, { headers });
//     return handleResponse(res, "Failed to fetch current admin");
//   },

//   async loginAdmin(username, password) {
//   const res = await fetch(`${API_BASE}/auth/admin/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       username,
//       password,
//     }),
//   });

//   return handleResponse(res, "Failed to login");
// },

//   // Admin / tenant management
//   async getTenants() {
//     const res = await fetch(`${API_BASE}/admin/tenants`, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch tenants");
//   },

//   async createTenant(data) {
//     const res = await fetch(`${API_BASE}/admin/tenants`, {
//       method: "POST",
//       headers: getAuthHeaders({ "Content-Type": "application/json" }),
//       body: JSON.stringify(data),
//     });

//     return handleResponse(res, "Failed to create tenant");
//   },

//   async getTenantAdmins(tenantId) {
//     const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/admins`, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch tenant admins");
//   },

//   async createTenantAdmin(tenantId, data) {
//     const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/admins`, {
//       method: "POST",
//       headers: getAuthHeaders({ "Content-Type": "application/json" }),
//       body: JSON.stringify(data),
//     });

//     return handleResponse(res, "Failed to create tenant admin");
//   },

//   async getBuildingAdmins(buildingId) {
//     const res = await fetch(`${API_BASE}/admin/buildings/${buildingId}/admins`, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch building admins");
//   },

//   async createBuildingAdmin(buildingId, data) {
//     const res = await fetch(`${API_BASE}/admin/buildings/${buildingId}/admins`, {
//       method: "POST",
//       headers: getAuthHeaders({ "Content-Type": "application/json" }),
//       body: JSON.stringify(data),
//     });

//     return handleResponse(res, "Failed to create building admin");
//   },

//   async deleteAdmin(adminId) {
//     const res = await fetch(`${API_BASE}/admin/admins/${adminId}`, {
//       method: "DELETE",
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to delete admin");
//   },

//   // Dashboard
//   async getStats() {
//     const res = await fetch(`${API_BASE}/stats`, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch dashboard stats");
//   },

//   // Buildings / Groups
//   async getGroups() {
//     const res = await fetch(`${API_BASE}/buildings`, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch buildings");
//   },

//   async getBuildingDetails(buildingId) {
//     const res = await fetch(`${API_BASE}/buildings/${buildingId}`, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch building details");
//   },

//   async createGroup(data) {
//     // New backend requires tenant + default building admin.
//     // This uses the new secure endpoint.
//     const res = await fetch(`${API_BASE}/admin/buildings`, {
//       method: "POST",
//       headers: getAuthHeaders({ "Content-Type": "application/json" }),
//       body: JSON.stringify(data),
//     });

//     return handleResponse(res, "Failed to create building");
//   },

//   async deleteGroup(groupId) {
//     const res = await fetch(`${API_BASE}/buildings/${groupId}`, {
//       method: "DELETE",
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to delete building");
//   },

//   // Doors
//   async getDoors(buildingId = null) {
//     const url = buildingId
//       ? `${API_BASE}/doors?building_id=${encodeURIComponent(buildingId)}`
//       : `${API_BASE}/doors`;

//     const res = await fetch(url, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch doors");
//   },

//   async createDoor(data) {
//     const res = await fetch(`${API_BASE}/doors`, {
//       method: "POST",
//       headers: getAuthHeaders({ "Content-Type": "application/json" }),
//       body: JSON.stringify(data),
//     });

//     return handleResponse(res, "Failed to create door");
//   },

//   async deleteDoor(doorId) {
//     const res = await fetch(`${API_BASE}/doors/${doorId}`, {
//       method: "DELETE",
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to delete door");
//   },

//   async unlockDoor(doorId, reason = "manual") {
//     const res = await fetch(`${API_BASE}/doors/${doorId}/open`, {
//       method: "POST",
//       headers: getAuthHeaders({ "Content-Type": "application/json" }),
//       body: JSON.stringify({ reason }),
//     });

//     return handleResponse(res, "Failed to unlock door");
//   },

//   // Users
//   async getUsers(buildingId = null) {
//     const url = buildingId
//       ? `${API_BASE}/users?building_id=${encodeURIComponent(buildingId)}`
//       : `${API_BASE}/users`;

//     const res = await fetch(url, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch users");
//   },

//   async verifyEmployee(empId) {
//     const encodedEmpId = encodeURIComponent(String(empId).trim());

//     const res = await fetch(`${API_BASE}/users/verify/${encodedEmpId}`, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to verify employee");
//   },

//   async createUser(data) {
//     const res = await fetch(`${API_BASE}/users`, {
//       method: "POST",
//       headers: getAuthHeaders({ "Content-Type": "application/json" }),
//       body: JSON.stringify(data),
//     });

//     return handleResponse(res, "Failed to create user");
//   },

//   async deleteUser(userId) {
//     const encodedUserId = encodeURIComponent(userId);

//     const res = await fetch(`${API_BASE}/users/${encodedUserId}`, {
//       method: "DELETE",
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to delete user");
//   },

//   async getUserDoors(userId) {
//     const encodedUserId = encodeURIComponent(userId);

//     const res = await fetch(`${API_BASE}/users/${encodedUserId}`, {
//       headers: getAuthHeaders(),
//     });

//     const user = await handleResponse(res, "Failed to fetch user doors");
//     return user.authorized_doors || [];
//   },

//   async authorizeUserDoors(userId, doorIds) {
//     const safeUserId = encodeURIComponent(String(userId).trim());

//     const res = await fetch(`${API_BASE}/users/${safeUserId}/authorize-doors`, {
//       method: "POST",
//       headers: getAuthHeaders({ "Content-Type": "application/json" }),
//       body: JSON.stringify({ door_ids: doorIds }),
//     });

//     return handleResponse(res, "Failed to authorize user for door");
//   },

//   // Access Logs
//   async getAccessLogs(filters = {}) {
//     const params = new URLSearchParams();

//     Object.entries(filters).forEach(([key, value]) => {
//       if (value !== undefined && value !== null && value !== "") {
//         params.append(key, value);
//       }
//     });

//     const query = params.toString();
//     const url = query ? `${API_BASE}/access-logs?${query}` : `${API_BASE}/access-logs`;

//     const res = await fetch(url, {
//       headers: getAuthHeaders(),
//     });

//     return handleResponse(res, "Failed to fetch access logs");
//   },

//   // System Config
//   async getConfig() {
//     const res = await fetch(`${API_BASE}/config`);
//     return handleResponse(res, "Failed to fetch config");
//   },
// };


//2nd code 
const API_BASE = "/api/v1/door-access";

const ADMIN_STORAGE_KEY = "facekey_admin_id";
const ADMIN_PROFILE_KEY = "facekey_admin_profile";

function getStoredAdminId() {
  return localStorage.getItem(ADMIN_STORAGE_KEY);
}

function getAuthHeaders(extraHeaders = {}) {
  const adminId = getStoredAdminId();

  return {
    ...extraHeaders,
    ...(adminId ? { "X-Admin-Id": adminId } : {}),
  };
}

async function handleResponse(res, fallbackMessage) {
  if (!res.ok) {
    let message = fallbackMessage;

    try {
      const data = await res.json();
      message = data.detail || data.message || fallbackMessage;
    } catch {
      const text = await res.text();
      message = text || fallbackMessage;
    }

    throw new Error(message);
  }

  return res.json();
}

export const api = {
  // Temporary admin session helpers
  getStoredAdminId() {
    return getStoredAdminId();
  },

  setAdminSession(adminId, adminProfile = null) {
    localStorage.setItem(ADMIN_STORAGE_KEY, adminId);

    if (adminProfile) {
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminProfile));
    }
  },

  clearAdminSession() {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_PROFILE_KEY);
  },

  getStoredAdminProfile() {
    const rawProfile = localStorage.getItem(ADMIN_PROFILE_KEY);

    if (!rawProfile) return null;

    try {
      return JSON.parse(rawProfile);
    } catch {
      return null;
    }
  },

  async getCurrentAdmin(adminId = null) {
    const headers = adminId
      ? { "X-Admin-Id": adminId }
      : getAuthHeaders();

    const res = await fetch(`${API_BASE}/admin/me`, { headers });
    return handleResponse(res, "Failed to fetch current admin");
  },

  async loginAdmin(username, password) {
  const res = await fetch(`${API_BASE}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return handleResponse(res, "Failed to login");
},

  // Admin / tenant management
  async getTenants() {
    const res = await fetch(`${API_BASE}/admin/tenants`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch tenants");
  },

  async createTenant(data) {
    const res = await fetch(`${API_BASE}/admin/tenants`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });

    return handleResponse(res, "Failed to create tenant");
  },

  async getTenantAdmins(tenantId) {
    const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/admins`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch tenant admins");
  },

  async createTenantAdmin(tenantId, data) {
    const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/admins`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });

    return handleResponse(res, "Failed to create tenant admin");
  },

  async getBuildingAdmins(buildingId) {
    const res = await fetch(`${API_BASE}/admin/buildings/${buildingId}/admins`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch building admins");
  },

  // Add these methods to the api object in api.js

  // Get buildings by tenant
  async getBuildingsByTenant(tenantId) {
    // First get all buildings, then filter by tenant_id
    const res = await fetch(`${API_BASE}/admin/buildings`, {
      headers: getAuthHeaders(),
    });
    
    const buildings = await handleResponse(res, "Failed to fetch buildings");
    
    // Filter buildings by tenant_id
    return Array.isArray(buildings) 
      ? buildings.filter(building => building.tenant_id === tenantId)
      : [];
  },

  // Get doors by tenant (through buildings)
  async getDoorsByTenant(tenantId) {
    // First get all buildings for this tenant
    const buildings = await this.getBuildingsByTenant(tenantId);
    
    if (!buildings || buildings.length === 0) {
      return [];
    }
    
    // Get doors for each building
    const allDoors = [];
    for (const building of buildings) {
      const doors = await this.getDoors(building.id);
      if (Array.isArray(doors)) {
        // Add building info to each door
        doors.forEach(door => {
          door.building_name = building.name;
          door.building_color = building.color || '#6c757d';
        });
        allDoors.push(...doors);
      }
    }
    
    return allDoors;
  },

  // Get users by tenant (users who have access to doors in this tenant)
  async getUsersByTenant(tenantId) {
    // First get all buildings for this tenant
    const buildings = await this.getBuildingsByTenant(tenantId);
    
    if (!buildings || buildings.length === 0) {
      return [];
    }
    
    // Get users for each building
    const allUsers = [];
    const seenUserIds = new Set();
    
    for (const building of buildings) {
      const users = await this.getUsers(building.id);
      if (Array.isArray(users)) {
        for (const user of users) {
          // Avoid duplicates
          if (!seenUserIds.has(user.id)) {
            seenUserIds.add(user.id);
            // Add building info
            user.building_name = building.name;
            allUsers.push(user);
          }
        }
      }
    }
    
    return allUsers;
  },

  async createBuildingAdmin(buildingId, data) {
    const res = await fetch(`${API_BASE}/admin/buildings/${buildingId}/admins`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });

    return handleResponse(res, "Failed to create building admin");
  },

  async deleteAdmin(adminId) {
    const res = await fetch(`${API_BASE}/admin/admins/${adminId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to delete admin");
  },

  // Dashboard
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch dashboard stats");
  },

  // Buildings / Groups
  async getGroups() {
    const res = await fetch(`${API_BASE}/buildings`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch buildings");
  },

  async getBuildingDetails(buildingId) {
    const res = await fetch(`${API_BASE}/buildings/${buildingId}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch building details");
  },

  async createGroup(data) {
    // New backend requires tenant + default building admin.
    // This uses the new secure endpoint.
    const res = await fetch(`${API_BASE}/admin/buildings`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });

    return handleResponse(res, "Failed to create building");
  },

  async deleteGroup(groupId) {
    const res = await fetch(`${API_BASE}/buildings/${groupId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to delete building");
  },

  // Doors
  async getDoors(buildingId = null) {
    const url = buildingId
      ? `${API_BASE}/doors?building_id=${encodeURIComponent(buildingId)}`
      : `${API_BASE}/doors`;

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch doors");
  },

  async createDoor(data) {
    const res = await fetch(`${API_BASE}/doors`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });

    return handleResponse(res, "Failed to create door");
  },

  async deleteDoor(doorId) {
    const res = await fetch(`${API_BASE}/doors/${doorId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to delete door");
  },

  async unlockDoor(doorId, reason = "manual") {
    const res = await fetch(`${API_BASE}/doors/${doorId}/open`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ reason }),
    });

    return handleResponse(res, "Failed to unlock door");
  },

  // Users
  async getUsers(buildingId = null) {
    const url = buildingId
      ? `${API_BASE}/users?building_id=${encodeURIComponent(buildingId)}`
      : `${API_BASE}/users`;

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch users");
  },

  async verifyEmployee(empId) {
    const encodedEmpId = encodeURIComponent(String(empId).trim());

    const res = await fetch(`${API_BASE}/users/verify/${encodedEmpId}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to verify employee");
  },

  async createUser(data) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });

    return handleResponse(res, "Failed to create user");
  },

  async deleteUser(userId) {
    const encodedUserId = encodeURIComponent(userId);

    const res = await fetch(`${API_BASE}/users/${encodedUserId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to delete user");
  },

  async getUserDoors(userId) {
    const encodedUserId = encodeURIComponent(userId);

    const res = await fetch(`${API_BASE}/users/${encodedUserId}`, {
      headers: getAuthHeaders(),
    });

    const user = await handleResponse(res, "Failed to fetch user doors");
    return user.authorized_doors || [];
  },

  async authorizeUserDoors(userId, doorIds) {
    const safeUserId = encodeURIComponent(String(userId).trim());

    const res = await fetch(`${API_BASE}/users/${safeUserId}/authorize-doors`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ door_ids: doorIds }),
    });

    return handleResponse(res, "Failed to authorize user for door");
  },

  // Access Logs
  async getAccessLogs(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });

    const query = params.toString();
    const url = query ? `${API_BASE}/access-logs?${query}` : `${API_BASE}/access-logs`;

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    return handleResponse(res, "Failed to fetch access logs");
  },

  // System Config
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    return handleResponse(res, "Failed to fetch config");
  },
};
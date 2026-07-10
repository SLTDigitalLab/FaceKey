import React, { useState } from "react";
import { api } from "../../services/api";

function AdminLogin({ onLogin, showToast }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      showToast("Please enter username and password", "error");
      return;
    }

    try {
      setLoading(true);

      const result = await api.loginAdmin(cleanUsername, password);

      api.setAdminSession(result.admin_id, result.admin);

      showToast(`Logged in as ${result.admin.name}`, "success");
      onLogin(result.admin);
    } catch (error) {
      api.clearAdminSession();
      showToast(error.message || "Invalid username or password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <i className="fas fa-key"></i>
        </div>

        <h1>FaceKey Admin Login</h1>
        <p>Enter your admin username and password to continue.</p>

        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Example: superadmin"
            autoFocus
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Login"}
          </button>
        </form>

        <div className="admin-login-hint">
          <strong>Local test login:</strong>
          <span>Username: superadmin</span>
          <span>Password: SuperAdmin@123</span>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

function GuestOtps({ showToast }) {
  const [otps, setOtps] = useState([]);
  const [doors, setDoors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [isnpNumber, setIsnpNumber] = useState("");
  const [selectedDoorId, setSelectedDoorId] = useState("");
  const [hours, setHours] = useState(24);
  const [oneTime, setOneTime] = useState(false);
  
  // Just generated OTP state
  const [lastGenerated, setLastGenerated] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [otpsData, doorsData] = await Promise.all([
        api.getGuestOtps(),
        api.getDoors(),
      ]);

      setOtps(Array.isArray(otpsData) ? otpsData : []);
      setDoors(Array.isArray(doorsData) ? doorsData : []);
      
      if (Array.isArray(doorsData) && doorsData.length > 0 && !selectedDoorId) {
        setSelectedDoorId(doorsData[0].id);
      }
    } catch (error) {
      showToast(error.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!isnpNumber || !selectedDoorId) {
      showToast("Please enter an ISNP number and select a door", "error");
      return;
    }

    try {
      setGenerating(true);
      const response = await api.createGuestOtp(isnpNumber, selectedDoorId, hours, oneTime);
      
      if (response && response.otp) {
        setLastGenerated(response.otp);
        setTimeout(() => {
          setLastGenerated((current) => current?.otp === response.otp.otp ? null : current);
        }, 30000); // 30 seconds auto dismiss
        showToast("Guest OTP generated successfully", "success");
        setIsnpNumber("");
        setOneTime(false);
        setHours(24);
        loadData();
      }
    } catch (error) {
      showToast(error.message || "Failed to generate OTP", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (otpId) => {
    if (!window.confirm("Are you sure you want to revoke this OTP?")) return;
    
    try {
      await api.deleteGuestOtp(otpId);
      showToast("OTP revoked successfully", "success");
      if (lastGenerated && lastGenerated.id === otpId) {
        setLastGenerated(null);
      }
      loadData();
    } catch (error) {
      showToast(error.message || "Failed to revoke OTP", "error");
    }
  };

  const handleCopy = (otpCode) => {
    navigator.clipboard.writeText(otpCode);
    showToast("OTP copied to clipboard", "success");
  };

  const getDoorName = (doorId) => {
    const door = doors.find(d => d.id === doorId);
    return door ? door.name : doorId;
  };

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div>
          <div className="pro-kicker">
            <i className="fas fa-key me-2"></i>
            Temporary Access
          </div>
          <h1>Guest OTPs</h1>
          <p>Generate one-time or time-limited access codes for unregistered persons and guests.</p>
        </div>
        <div className="pro-hero-actions">
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={loadData}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt me-2 ${loading ? "fa-spin" : ""}`}></i>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="row g-4 mt-2">
        {/* Left Column: Generator Form */}
        <div className="col-12 col-lg-5">
          <div className="pro-card" style={{ background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)", border: "1px solid #334155" }}>
            <div className="pro-card-header border-bottom border-secondary mb-4 pb-3">
              <h3 className="pro-card-title m-0 text-white">Generate Guest OTP</h3>
            </div>
            
            <form onSubmit={handleGenerate}>
              <div className="mb-4">
                <label className="form-label text-light fw-bold">ISNP Number / Visitor ID</label>
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  value={isnpNumber}
                  onChange={(e) => setIsnpNumber(e.target.value)}
                  placeholder="Enter ISNP or National ID"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-light fw-bold">Select Door</label>
                <select
                  className="form-select bg-dark text-light border-secondary"
                  value={selectedDoorId}
                  onChange={(e) => setSelectedDoorId(e.target.value)}
                  required
                >
                  {doors.length === 0 && <option value="">No doors available</option>}
                  {doors.map((door) => (
                    <option key={door.id} value={door.id}>
                      {door.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label text-light fw-bold">Validity Period (Hours)</label>
                <select 
                  className="form-select bg-dark text-light border-secondary"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value))}
                >
                  <option value={5 / 60}>5 Minutes</option>
                  <option value={15 / 60}>15 Minutes</option>
                  <option value={30 / 60}>30 Minutes</option>
                  <option value={1}>1 Hour</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={72}>72 Hours (3 Days)</option>
                  <option value={168}>168 Hours (7 Days)</option>
                </select>
              </div>

              <div className="mb-4 form-check form-switch d-flex align-items-center gap-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="oneTimeCheck"
                  checked={oneTime}
                  onChange={(e) => setOneTime(e.target.checked)}
                  style={{ cursor: "pointer", width: "3em", height: "1.5em" }}
                />
                <label className="form-check-label text-light ms-2 pt-1" htmlFor="oneTimeCheck" style={{ cursor: "pointer" }}>
                  One-Time Use Only
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-warning w-100 py-3 fw-bold fs-5 rounded-3 shadow-sm"
                disabled={generating || !selectedDoorId || !isnpNumber}
              >
                {generating ? (
                  <><i className="fas fa-spinner fa-spin me-2"></i>Generating...</>
                ) : (
                  <><i className="fas fa-key me-2"></i>Generate OTP</>
                )}
              </button>
            </form>
          </div>

          {lastGenerated && (
            <div className="mt-4 pro-card text-center position-relative" style={{ background: "#132143", border: "1px solid #3b82f6" }}>
              <button 
                className="btn btn-sm text-light position-absolute top-0 end-0 m-2"
                style={{ border: "none", opacity: 0.7 }}
                onClick={() => setLastGenerated(null)}
                title="Dismiss"
              >
                <i className="fas fa-times fs-5"></i>
              </button>
              <div className="text-primary mb-2 fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Newly Generated OTP</div>
              <div className="fs-1 fw-bold font-monospace text-white mb-3" style={{ letterSpacing: '6px' }}>
                {lastGenerated.otp}
              </div>
              <div className="text-muted small mb-3">
                For: {lastGenerated.isnp_number} <br/>
                Door: {getDoorName(lastGenerated.door_id)}
              </div>
              <button 
                className="btn btn-primary px-4 py-2 rounded-pill shadow"
                onClick={() => handleCopy(lastGenerated.otp)}
              >
                <i className="fas fa-copy me-2"></i>Copy to Clipboard
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Active OTPs List */}
        <div className="col-12 col-lg-7">
          <div className="pro-card h-100">
            <h3 className="pro-card-title mb-4">Active Guest OTPs</h3>
            
            {otps.length === 0 ? (
              <div className="text-center text-muted p-5 bg-dark rounded border border-secondary border-opacity-25">
                <i className="fas fa-folder-open fa-3x mb-3 opacity-25"></i>
                <h5>No Active OTPs</h5>
                <p className="mb-0">Generated OTPs will appear here until they expire or are used.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle custom-table">
                  <thead>
                    <tr>
                      <th>ISNP / Visitor ID</th>
                      <th>Door</th>
                      <th>OTP</th>
                      <th>Type</th>
                      <th>Expires</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otps.map((otp) => (
                      <tr key={otp.id}>
                        <td className="fw-bold text-white">{otp.isnp_number}</td>
                        <td>{getDoorName(otp.door_id)}</td>
                        <td>
                          <span className="badge bg-secondary font-monospace fs-6 text-white py-2 px-3">
                            {otp.otp}
                          </span>
                        </td>
                        <td>
                          {otp.is_one_time ? (
                            <span className="badge bg-info text-dark">One-Time</span>
                          ) : (
                            <span className="badge bg-success">Multi-Use</span>
                          )}
                        </td>
                        <td className="text-light small" style={{ whiteSpace: "nowrap" }}>
                          <div>{new Date(otp.expires_at).toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' })},</div>
                          <div className="text-white-50 mt-1">{new Date(otp.expires_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-light me-2"
                            onClick={() => handleCopy(otp.otp)}
                            title="Copy OTP"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(otp.id)}
                            title="Revoke OTP"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestOtps;

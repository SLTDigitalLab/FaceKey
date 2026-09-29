import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

function DoorOtpModal({ show, door, onHide, showToast }) {
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [currentOtp, setCurrentOtp] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    if (show && door) {
      setCurrentOtp(door.temporary_otp || "");
      setExpiresAt(door.temporary_otp_expires_at || null);
    }
  }, [show, door]);

  const handleGenerateOtp = async () => {
    try {
      setGeneratingOtp(true);
      const response = await api.generateTemporaryOtp(door.id);
      if (response && response.door) {
        setCurrentOtp(response.door.temporary_otp);
        setExpiresAt(response.door.temporary_otp_expires_at);
        if (showToast) showToast("Temporary OTP generated successfully", "success");
      }
    } catch (error) {
      console.error("Failed to generate OTP", error);
      if (showToast) showToast(error.message || "Failed to generate OTP", "error");
    } finally {
      setGeneratingOtp(false);
    }
  };

  const handleCopy = () => {
    if (currentOtp) {
      navigator.clipboard.writeText(currentOtp);
      if (showToast) showToast("OTP copied to clipboard", "success");
    }
  };

  if (!show || !door) return null;

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-custom modal-md">
        <div className="modal-content-custom">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-key me-2 text-warning"></i>
              Temporary OTP for {door.name}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onHide}
            ></button>
          </div>

          <div className="modal-body">
            <p className="text-muted mb-4">
              Generate a 24-hour temporary OTP for unregistered persons. They can enter this on the device to access the door.
            </p>
            
            <div className="p-4 bg-dark rounded border border-secondary text-center mb-4">
              {currentOtp ? (
                <>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <div className="fs-1 fw-bold font-monospace text-primary me-3" style={{ letterSpacing: '4px' }}>
                      {currentOtp}
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-secondary rounded-circle" 
                      style={{ width: "40px", height: "40px" }}
                      onClick={handleCopy}
                      title="Copy OTP"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                  <div className="text-muted small">
                    Expires: {expiresAt ? new Date(expiresAt).toLocaleString('en-US', { timeZone: 'Asia/Colombo' }) : 'N/A'}
                  </div>
                </>
              ) : (
                <div className="text-muted my-3">
                  <i className="fas fa-lock fa-2x mb-2 opacity-50"></i>
                  <br />
                  No active OTP for this door.
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-warning w-100 py-2 fw-bold"
              onClick={handleGenerateOtp}
              disabled={generatingOtp}
            >
              {generatingOtp ? (
                <><i className="fas fa-spinner fa-spin me-2"></i>Generating...</>
              ) : (
                <><i className="fas fa-redo-alt me-2"></i>{currentOtp ? "Generate New OTP" : "Generate OTP"}</>
              )}
            </button>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-light w-100"
              onClick={onHide}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoorOtpModal;

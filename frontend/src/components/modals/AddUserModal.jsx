import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

function AddUserModal({ show, onHide, onSubmit, showToast }) {
  const getInitialFormData = () => ({
    user_id: "",
    first_name: "",
    last_name: "",
    department: "",
    email: "",
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);

  useEffect(() => {
    if (show) {
      setFormData(getInitialFormData());
      setIsVerified(false);
      setEmployeeData(null);
      setIsVerifying(false);
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [show]);

  const handleClose = () => {
    setFormData(getInitialFormData());
    setIsVerified(false);
    setEmployeeData(null);
    setIsVerifying(false);
    onHide();
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleVerify = async () => {
    if (!formData.user_id.trim()) {
      showToast("Please enter an Employee ID", "warning");
      return;
    }

    const parseEmployeeInput = (value) => {
      const rawId = String(value || "").trim();
      const cleanId = rawId.split(" - ")[0].trim();
      const nameFromInput = rawId.includes(" - ")
        ? rawId.split(" - ").slice(1).join(" - ").trim()
        : "";

      return { rawId, cleanId, nameFromInput };
    };

    const splitName = (fullName) => {
      const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);

      return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      };
    };

    setIsVerifying(true);

    try {
      const result = await api.verifyEmployee(formData.user_id);

      if (result.exists) {
        const { rawId, cleanId, nameFromInput } = parseEmployeeInput(
          formData.user_id
        );

        const employeeInfo = result.data || {};

        const employeeName = employeeInfo.name || nameFromInput || "";

        const nameParts = splitName(employeeName);

        setIsVerified(true);
        setEmployeeData(employeeInfo);

        setFormData((prev) => ({
          ...prev,
          user_id: employeeInfo.clean_id || employeeInfo.id || cleanId || rawId,
          first_name: employeeInfo.first_name || nameParts.firstName || "",
          last_name: employeeInfo.last_name || nameParts.lastName || "",
          department: employeeInfo.department || "",
          email: employeeInfo.email || "",
        }));

        if (!employeeName) {
          showToast(
            "Employee verified, but name details were not returned. Please enter the name manually.",
            "warning"
          );
        } else {
          showToast("Employee verified successfully!", "success");
        }
      } else {
        showToast(result.message || "Employee ID not found in system", "error");
        setIsVerified(false);
        setEmployeeData(null);
      }
    } catch (error) {
      showToast(
        "Error verifying employee. Please check the ID and try again.",
        "error"
      );
      setIsVerified(false);
      setEmployeeData(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.user_id.trim()) {
      showToast("Please enter an Employee ID", "warning");
      return;
    }

    if (!isVerified) {
      showToast("Please verify the Employee ID first", "warning");
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={handleBackdropClick}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-user-plus me-2"></i>Link Employee
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleClose}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="alert alert-info mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Enter an Employee ID that is already registered in the central
                  Visage system. The employee details will be fetched
                  automatically.
                </div>

                <div className="mb-3">
                  <label className="form-label">Employee ID</label>

                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., InSP/2025/4593/526"
                      value={formData.user_id}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          user_id: event.target.value,
                        })
                      }
                      required
                      disabled={isVerified}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={handleVerify}
                      disabled={isVerifying || isVerified}
                    >
                      {isVerifying ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <>
                          <i className="fas fa-search me-1"></i>Verify
                        </>
                      )}
                    </button>
                  </div>

                  <small className="form-text text-muted">
                    Format: InSP/YYYY/XXXX/XXX or InSP/YYYY/XXXX/XXX - Name
                  </small>
                </div>

                {isVerified && (
                  <>
                    <div className="alert alert-success mb-3">
                      <i className="fas fa-check-circle me-2"></i>
                      Employee ID Verified
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="First Name"
                          value={formData.first_name}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              first_name: event.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Last Name"
                          value={formData.last_name}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              last_name: event.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Department</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Department"
                          value={formData.department}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              department: event.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email (Optional)</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="email@company.com"
                          value={formData.email}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              email: event.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={handleClose}
                >
                  Cancel
                </button>

                <button type="submit" className="btn btn-gradient">
                  Link Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
}

export default AddUserModal;
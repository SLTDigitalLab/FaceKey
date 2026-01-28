import React from "react";

function ConfirmationModal({
  show,
  title,
  message,
  onHide,
  onConfirm,
  confirmText = "Confirm",
  type = "danger",
}) {
  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2 text-white">
                <i
                  className="fas fa-exclamation-triangle"
                  style={{ color: "#ffc107" }}
                ></i>
                {title}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onHide}
              ></button>
            </div>
            <div className="modal-body">
              <p className="text-secondary mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={onHide}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-${type}`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}

export default ConfirmationModal;

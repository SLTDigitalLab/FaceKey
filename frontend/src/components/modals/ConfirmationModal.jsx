import React, { useEffect } from "react";

function ConfirmationModal({
  show,
  title,
  message,
  onHide,
  onConfirm,
  confirmText = "Confirm",
  type = "danger",
  stacked = false,
}) {
  useEffect(() => {
    if (!show) return;

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onHide();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [show, onHide]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onHide();
    }
  };

  if (!show) return null;

  return (
    <>
      <div
        className={`modal fade show confirmation-modal ${
          stacked ? "confirmation-modal-stacked" : ""
        }`}
        style={{ display: "block" }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={handleBackdropClick}
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

      <div
        className={`modal-backdrop fade show ${
          stacked ? "confirmation-backdrop-stacked" : ""
        }`}
      ></div>
    </>
  );
}

export default ConfirmationModal;
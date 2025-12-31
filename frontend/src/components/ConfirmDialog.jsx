import React from 'react';
import ReactDOM from 'react-dom';
import './ConfirmDialog.css';

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    // Use React Portal to render modal directly in document.body
    // This completely avoids stacking context issues
    return ReactDOM.createPortal(
        <div className="confirm-overlay" onClick={handleCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-header">
                    <h3 className="confirm-title">{title}</h3>
                </div>

                <div className="confirm-body">
                    <p className="confirm-message">{message}</p>
                </div>

                <div className="confirm-actions">
                    <button className="confirm-btn confirm-btn-cancel" onClick={handleCancel}>
                        {cancelText || 'Cancel'}
                    </button>
                    <button className="confirm-btn confirm-btn-confirm" onClick={handleConfirm}>
                        {confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>,
        document.body // Portal renders directly in body - bypasses app-container
    );
}

export default ConfirmDialog;

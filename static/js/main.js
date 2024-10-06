document.addEventListener('DOMContentLoaded', function() {
    const checkInForm = document.getElementById('check-in-form');
    const checkOutForm = document.getElementById('check-out-form');
    const scanForm = document.getElementById('scan-form');
    const barcodeInput = document.getElementById('barcode-input');
    const scanResult = document.getElementById('scan-result');
    const employeeIdInput = document.getElementById('employee-id');
    const taskBarcodeInput = document.getElementById('task-barcode');
    const lunchBreakForm = document.getElementById('lunch-break-form');
    const lunchBreakStatus = document.getElementById('lunch-break-status');
    const lunchBreakEmployeeId = document.getElementById('lunch-break-employee-id');
    const lunchBreakAction = document.getElementById('lunch-break-action');

    // Focus on Employee ID input when the page loads
    if (employeeIdInput) {
        employeeIdInput.focus();
    }

    if (scanForm) {
        scanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const scannedValue = barcodeInput.value.trim();
            if (scannedValue) {
                sendScanToServer(scannedValue);
            }
        });
    }

    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const scannedValue = this.value.trim();
                if (scannedValue.startsWith('E')) {
                    employeeIdInput.value = scannedValue;
                    taskBarcodeInput.focus();
                } else {
                    taskBarcodeInput.value = scannedValue;
                    employeeIdInput.focus();
                }
                this.value = '';
            }
        });
    }

    if (checkInForm) {
        checkInForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const employeeId = employeeIdInput.value;
            const taskBarcode = taskBarcodeInput.value;
            checkIn(employeeId, taskBarcode);
        });
    }

    if (checkOutForm) {
        checkOutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const employeeId = document.getElementById('employee-id-out').value;
            checkOut(employeeId);
        });
    }

    if (lunchBreakForm) {
        lunchBreakForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const employeeId = lunchBreakEmployeeId.value;
            const action = lunchBreakAction.value.toUpperCase();
            if (action === 'IN' || action === 'OUT') {
                handleLunchBreak(employeeId, action);
            } else {
                showNotification('Invalid lunch break action. Please scan "IN" or "OUT".', 'error');
            }
        });
    }
});

function sendScanToServer(scannedValue) {
    fetch('/api/scan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scanned_value: scannedValue }),
    })
    .then(response => response.json())
    .then(data => {
        const scanResult = document.getElementById('scan-result');
        scanResult.textContent = data.message;
        document.getElementById('barcode-input').value = ''; // Clear the input field
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function checkIn(employeeId, taskBarcode) {
    fetch('/api/employee/check_in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employeeId, task_barcode: taskBarcode }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            document.getElementById('employee-id').value = '';
            document.getElementById('task-barcode').value = '';
            document.getElementById('employee-id').focus();
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        showNotification('An error occurred during check-in. Please try again.', 'error');
    });
}

function checkOut(employeeId) {
    fetch('/api/employee/check_out', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employeeId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            document.getElementById('employee-id-out').value = '';
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        showNotification('An error occurred during check-out. Please try again.', 'error');
    });
}

function handleLunchBreak(employeeId, action) {
    fetch('/api/employee/lunch_break', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employeeId, action: action }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            document.getElementById('lunch-break-employee-id').value = '';
            document.getElementById('lunch-break-action').value = '';
            updateLunchBreakStatus(data.lunch_break_status);
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        showNotification('An error occurred during lunch break action. Please try again.', 'error');
    });
}

function updateLunchBreakStatus(status) {
    const lunchBreakStatus = document.getElementById('lunch-break-status');
    lunchBreakStatus.textContent = `Current status: ${status}`;
    lunchBreakStatus.className = status === 'In' ? 'status-in' : 'status-out';
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

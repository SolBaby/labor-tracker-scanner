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
    const bathroomBreakForm = document.getElementById('bathroom-break-form');
    const bathroomBreakStatus = document.getElementById('bathroom-break-status');

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
                sendScanToServer(scannedValue);
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
            const employeeId = document.getElementById('lunch-break-employee-id').value;
            handleLunchBreak(employeeId);
        });
    }

    if (bathroomBreakForm) {
        bathroomBreakForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const employeeId = document.getElementById('bathroom-break-employee-id').value;
            handleBathroomBreak(employeeId);
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
        if (data.status === 'success') {
            handleScan(scannedValue, data.type);
        } else {
            showNotification(data.message, 'error');
        }
        document.getElementById('barcode-input').value = '';
    })
    .catch((error) => {
        console.error('Error:', error);
        showNotification('An error occurred while processing the scan', 'error');
    });
}

function handleScan(scannedValue, type) {
    if (type === 'employee') {
        window.location.href = `/employee_history/${scannedValue}`;
    } else if (type === 'task') {
        window.location.href = `/task_history/${scannedValue}`;
    } else {
        showNotification('Invalid barcode scanned', 'error');
    }
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

function handleLunchBreak(employeeId) {
    fetch('/api/employee/lunch_break', {
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
            document.getElementById('lunch-break-employee-id').value = '';
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

function handleBathroomBreak(employeeId) {
    fetch('/api/employee/bathroom_break', {
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
            document.getElementById('bathroom-break-employee-id').value = '';
            updateBathroomBreakStatus(data.bathroom_break_status);
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        showNotification('An error occurred during bathroom break action. Please try again.', 'error');
    });
}

function updateBathroomBreakStatus(status) {
    const bathroomBreakStatus = document.getElementById('bathroom-break-status');
    bathroomBreakStatus.textContent = `Current status: ${status}`;
    bathroomBreakStatus.className = status === 'In' ? 'status-in' : 'status-out';
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
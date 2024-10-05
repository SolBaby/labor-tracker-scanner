document.addEventListener('DOMContentLoaded', function() {
    const checkInForm = document.getElementById('check-in-form');
    const checkOutForm = document.getElementById('check-out-form');
    const scanForm = document.getElementById('scan-form');
    const barcodeInput = document.getElementById('barcode-input');
    const scanResult = document.getElementById('scan-result');
    const employeeIdInput = document.getElementById('employee-id');
    const taskBarcodeInput = document.getElementById('task-barcode');
    const lunchBreakForm = document.getElementById('lunch-break-form');

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
            const employeeId = document.getElementById('lunch-break-employee-id').value;
            handleLunchBreak(employeeId);
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
            alert(data.message);
            document.getElementById('employee-id').value = '';
            document.getElementById('task-barcode').value = '';
            document.getElementById('employee-id').focus();
        } else {
            alert(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred during check-in. Please try again.');
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
            alert(data.message);
            document.getElementById('employee-id-out').value = '';
        } else {
            alert(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred during check-out. Please try again.');
    });
}

function handleLunchBreak(employeeId) {
    fetch('/api/employee/lunch_check_in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employeeId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
            document.getElementById('lunch-break-employee-id').value = '';
        } else if (data.message === 'No active lunch break found') {
            // If no active lunch break, try to check out
            return fetch('/api/employee/lunch_check_out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ employee_id: employeeId }),
            });
        } else {
            alert(data.message);
        }
    })
    .then(response => response ? response.json() : null)
    .then(data => {
        if (data && data.status === 'success') {
            alert(data.message);
            document.getElementById('lunch-break-employee-id').value = '';
        } else if (data) {
            alert(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred during lunch break action. Please try again.');
    });
}

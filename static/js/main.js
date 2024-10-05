document.addEventListener('DOMContentLoaded', function() {
    const checkInForm = document.getElementById('check-in-form');
    const checkOutForm = document.getElementById('check-out-form');
    const scanForm = document.getElementById('scan-form');
    const barcodeInput = document.getElementById('barcode-input');
    const scanResult = document.getElementById('scan-result');

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
                    document.getElementById('employee-id').value = scannedValue;
                    document.getElementById('employee-id-out').value = scannedValue;
                } else if (scannedValue.startsWith('T')) {
                    document.getElementById('task-id').value = scannedValue;
                }
                this.value = '';
            }
        });
    }

    if (checkInForm) {
        checkInForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const employeeId = document.getElementById('employee-id').value;
            const taskId = document.getElementById('task-id').value;
            checkIn(employeeId, taskId);
        });
    }

    if (checkOutForm) {
        checkOutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const employeeId = document.getElementById('employee-id-out').value;
            checkOut(employeeId);
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
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function checkIn(employeeId, taskId) {
    fetch('/api/employee/check_in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employeeId, task_id: taskId }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch((error) => {
        console.error('Error:', error);
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
        alert(data.message);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

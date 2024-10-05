document.addEventListener('DOMContentLoaded', function() {
    const checkInForm = document.getElementById('check-in-form');
    const checkOutForm = document.getElementById('check-out-form');
    const barcodeInput = document.getElementById('barcode-input');

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

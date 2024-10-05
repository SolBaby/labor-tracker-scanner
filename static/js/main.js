document.addEventListener('DOMContentLoaded', function() {
    const checkInForm = document.getElementById('check-in-form');
    const checkOutForm = document.getElementById('check-out-form');

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

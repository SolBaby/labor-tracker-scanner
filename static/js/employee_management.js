document.addEventListener('DOMContentLoaded', function() {
    const addEmployeeForm = document.getElementById('add-employee-form');
    const employeeTable = document.querySelector('table tbody');

    addEmployeeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('new-employee-name').value;
        const employeeId = document.getElementById('new-employee-id').value;
        addEmployee(name, employeeId);
    });

    employeeTable.addEventListener('click', function(e) {
        const target = e.target;
        const row = target.closest('tr');
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            toggleEditMode(row, true);
        } else if (target.classList.contains('save-btn')) {
            const newName = row.querySelector('.edit-employee-name').value;
            updateEmployee(id, newName);
        } else if (target.classList.contains('delete-btn')) {
            deleteEmployee(id);
        }
    });
});

function addEmployee(name, employeeId) {
    fetch('/api/employee/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name, employee_id: employeeId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function updateEmployee(id, newName) {
    fetch(`/api/employee/update/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        fetch(`/api/employee/delete/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                location.reload();
            } else {
                alert(data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
}

function toggleEditMode(row, editable) {
    const nameSpan = row.querySelector('.employee-name');
    const nameInput = row.querySelector('.edit-employee-name');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');

    nameSpan.style.display = editable ? 'none' : 'inline';
    nameInput.style.display = editable ? 'inline' : 'none';
    editBtn.style.display = editable ? 'none' : 'inline';
    saveBtn.style.display = editable ? 'inline' : 'none';
}

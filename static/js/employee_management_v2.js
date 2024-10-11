function addEmployee(name, employeeId, department, phoneNumber) {
    fetch('/api/employee/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name, 
            employee_id: employeeId, 
            department,
            phone_number: phoneNumber
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeModal();
            searchEmployees();
            showNotification('Employee added successfully', 'success');
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while adding the employee', 'error');
    });
}

function updateReports() {
    fetch('/api/reports/data')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('table tbody');
            tbody.innerHTML = '';
            data.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.employee_name}</td>
                    <td>${record.task_name}</td>
                    <td>${record.task_location}</td>
                    <td>${record.total_minutes} minutes, ${record.total_seconds} seconds</td>
                    <td>
                        <button class="btn edit-btn" onclick="editReport('${record.id}', '${record.employee_name}', '${record.task_name}', '${record.task_location}', ${record.total_minutes}, ${record.total_seconds})">Edit</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error:', error));
}

function editReport(id, employeeName, taskName, taskLocation, totalMinutes, totalSeconds) {
    // Populate and show edit modal
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-employee-name').value = employeeName;
    document.getElementById('edit-task-name').value = taskName;
    document.getElementById('edit-task-location').value = taskLocation;
    document.getElementById('edit-total-minutes').value = totalMinutes;
    document.getElementById('edit-total-seconds').value = totalSeconds;
    document.getElementById('edit-modal').style.display = 'block';
}

function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const totalMinutes = document.getElementById('edit-total-minutes').value;
    const totalSeconds = document.getElementById('edit-total-seconds').value;

    fetch('/api/reports/edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, total_minutes: totalMinutes, total_seconds: totalSeconds }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            document.getElementById('edit-modal').style.display = 'none';
            updateReports();
        } else {
            alert(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while updating the report. Please try again.');
    });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    const editModal = document.getElementById('edit-modal');
    const closeBtn = editModal.querySelector('.close');
    const editForm = document.getElementById('edit-form');

    closeBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveEdit();
    });

    // Update reports every 30 seconds
    setInterval(updateReports, 30000);

    // Initial update
    updateReports();
});

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
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error:', error));
}

// Update reports every 30 seconds
setInterval(updateReports, 30000);

// Initial update
updateReports();

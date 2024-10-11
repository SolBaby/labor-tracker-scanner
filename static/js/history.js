document.addEventListener('DOMContentLoaded', function() {
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const employeeIdFilter = document.getElementById('employee-id-filter');
    const taskIdFilter = document.getElementById('task-id-filter');
    const startDateFilter = document.getElementById('start-date-filter');
    const endDateFilter = document.getElementById('end-date-filter');

    applyFiltersBtn.addEventListener('click', fetchData);

    function fetchData() {
        const employeeId = employeeIdFilter.value;
        const taskId = taskIdFilter.value;
        const startDate = startDateFilter.value;
        const endDate = endDateFilter.value;

        // Fetch summary data
        fetch(`/api/history/summary?employee_id=${employeeId}&start_date=${startDate}&end_date=${endDate}`)
            .then(response => response.json())
            .then(data => updateSummaryTable(data))
            .catch(error => console.error('Error fetching summary data:', error));

        // Fetch detailed history data
        fetch(`/api/history/data?employee_id=${employeeId}&task_id=${taskId}&start_date=${startDate}&end_date=${endDate}`)
            .then(response => response.json())
            .then(data => updateHistoryTable(data))
            .catch(error => console.error('Error fetching history data:', error));
    }

    function updateSummaryTable(data) {
        const tbody = document.querySelector('#summary-table tbody');
        tbody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.employee_name}</td>
                <td>${row.employee_id}</td>
                <td>${row.total_work_hours}</td>
                <td>${row.total_lunch_break}</td>
                <td>${row.total_bathroom_break}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updateHistoryTable(data) {
        const tbody = document.querySelector('#history-table tbody');
        tbody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.employee_name}</td>
                <td>${row.employee_id}</td>
                <td>${row.task_name}</td>
                <td>${row.task_id}</td>
                <td>${formatDateTime(row.check_in_time)}</td>
                <td>${formatDateTime(row.check_out_time)}</td>
                <td>${formatDateTime(row.lunch_break_start)}</td>
                <td>${formatDateTime(row.lunch_break_end)}</td>
                <td>${formatDateTime(row.bathroom_break_start)}</td>
                <td>${formatDateTime(row.bathroom_break_end)}</td>
                <td>${row.duration}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString();
    }

    // Initial data fetch
    fetchData();
});

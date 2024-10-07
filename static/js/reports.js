let currentSort = { field: null, order: null };
let cachedData = null;

function updateReports() {
    const sortParams = currentSort.field ? `sort_field=${currentSort.field}&sort_order=${currentSort.order}` : '';
    
    fetch(`/api/reports/data?${sortParams}`)
        .then(response => response.json())
        .then(data => {
            cachedData = data;
            renderReports(data);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while fetching reports', 'error');
        });
}

function renderReports(data) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
    data.forEach(record => {
        const row = document.createElement('tr');
        row.dataset.id = record.id;
        row.innerHTML = `
            <td><input type="checkbox" class="report-checkbox" data-id="${record.id}"></td>
            <td>${record.employee_name}</td>
            <td>${record.task_name}</td>
            <td>${record.task_location}</td>
            <td>${record.check_in_time ? new Date(record.check_in_time).toLocaleString() : 'N/A'}</td>
            <td>${record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'N/A'}</td>
            <td>${record.lunch_break_start ? new Date(record.lunch_break_start).toLocaleString() : 'N/A'}</td>
            <td>${record.lunch_break_end ? new Date(record.lunch_break_end).toLocaleString() : 'N/A'}</td>
            <td>${record.bathroom_break_duration !== null ? record.bathroom_break_duration.toFixed(2) + ' minutes' : 'N/A'}</td>
            <td>${record.total_hours} hours, ${record.total_minutes} minutes</td>
            <td>
                <button class="btn edit-btn" data-id="${record.id}">Edit</button>
                <button class="btn delete-btn" data-id="${record.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateSortIndicators();
}

function updateSortIndicators() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        const arrow = btn.querySelector('.sort-arrow');
        if (btn.dataset.sort === currentSort.field) {
            btn.classList.add('active');
            arrow.textContent = currentSort.order === 'asc' ? '▲' : '▼';
        } else {
            btn.classList.remove('active');
            arrow.textContent = '▲';
        }
    });
}

function resetSorting() {
    currentSort = { field: null, order: null };
    cachedData = null;
    updateReports();
}

function deleteSelectedReports() {
    const selectedIds = Array.from(document.querySelectorAll('.report-checkbox:checked'))
        .map(checkbox => checkbox.dataset.id);
    
    if (selectedIds.length === 0) {
        showNotification('No reports selected for deletion', 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected reports?`)) {
        fetch('/api/reports/delete_multiple', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: selectedIds }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showNotification(`${selectedIds.length} reports deleted successfully`, 'success');
                updateReports();
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while deleting reports', 'error');
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const editModal = document.getElementById('edit-modal');
    const closeBtn = editModal.querySelector('.close');
    const editForm = document.getElementById('edit-form');
    const resetSortBtn = document.getElementById('reset-sort-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');

    document.querySelector('table thead').addEventListener('click', function(e) {
        const sortBtn = e.target.closest('.sort-btn');
        if (sortBtn) {
            const field = sortBtn.dataset.sort;
            if (currentSort.field === field) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort = { field, order: 'asc' };
            }
            cachedData = null;
            updateReports();
        }
    });

    closeBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveEdit();
    });

    resetSortBtn.addEventListener('click', resetSorting);

    deleteSelectedBtn.addEventListener('click', deleteSelectedReports);

    selectAllCheckbox.addEventListener('change', function() {
        document.querySelectorAll('.report-checkbox').forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    document.querySelector('table tbody').addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            editReport(id);
        } else if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            deleteReport(id);
        }
    });

    updateReports();
});

function editReport(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const editModal = document.getElementById('edit-modal');
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-employee-name').value = row.cells[1].textContent;
    document.getElementById('edit-task-name').value = row.cells[2].textContent;
    document.getElementById('edit-task-location').value = row.cells[3].textContent;
    
    const timeParts = row.cells[9].textContent.split(',');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    
    document.getElementById('edit-total-hours').value = hours;
    document.getElementById('edit-total-minutes').value = minutes;
    
    editModal.style.display = 'block';
}

function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const totalHours = document.getElementById('edit-total-hours').value;
    const totalMinutes = document.getElementById('edit-total-minutes').value;

    fetch('/api/reports/edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, total_hours: totalHours, total_minutes: totalMinutes }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            document.getElementById('edit-modal').style.display = 'none';
            cachedData = null;
            updateReports();
            showNotification('Report updated successfully', 'success');
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while updating the report', 'error');
    });
}

function deleteReport(id) {
    if (confirm('Are you sure you want to delete this report?')) {
        fetch(`/api/reports/delete/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    row.remove();
                }
                showNotification('Report deleted successfully', 'success');
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while deleting the report', 'error');
        });
    }
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

updateReports();

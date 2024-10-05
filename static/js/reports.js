let currentSort = { field: null, order: null };
let cachedData = null;

function updateReports() {
    const sortParams = currentSort.field ? `sort_field=${currentSort.field}&sort_order=${currentSort.order}` : '';
    
    if (cachedData && currentSort.field) {
        renderReports(cachedData);
        return;
    }

    fetch(`/api/reports/data?${sortParams}`)
        .then(response => response.json())
        .then(data => {
            cachedData = data;
            renderReports(data);
        })
        .catch(error => console.error('Error:', error));
}

function renderReports(data) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
    data.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.employee_name}</td>
            <td>${record.task_name}</td>
            <td>${record.task_location}</td>
            <td>${record.check_in_time ? new Date(record.check_in_time).toLocaleString() : 'N/A'}</td>
            <td>${record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'N/A'}</td>
            <td>${record.lunch_break_start ? new Date(record.lunch_break_start).toLocaleString() : 'N/A'}</td>
            <td>${record.lunch_break_end ? new Date(record.lunch_break_end).toLocaleString() : 'N/A'}</td>
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

document.addEventListener('DOMContentLoaded', function() {
    const editModal = document.getElementById('edit-modal');
    const closeBtn = editModal.querySelector('.close');
    const editForm = document.getElementById('edit-form');
    const resetSortBtn = document.getElementById('reset-sort-btn');

    closeBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveEdit();
    });

    resetSortBtn.addEventListener('click', resetSorting);

    // Add event delegation for edit and delete buttons
    document.querySelector('table tbody').addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            editReport(id);
        } else if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            deleteReport(id);
        }
    });

    // Initial update
    updateReports();
});

function editReport(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const editModal = document.getElementById('edit-modal');
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-employee-name').value = row.cells[0].textContent;
    document.getElementById('edit-task-name').value = row.cells[1].textContent;
    document.getElementById('edit-task-location').value = row.cells[2].textContent;
    
    const timeParts = row.cells[7].textContent.split(',');
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
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

function deleteReport(id) {
    if (confirm('Are you sure you want to delete this report?')) {
        fetch(`/api/reports/delete/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                cachedData = null;
                updateReports();
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

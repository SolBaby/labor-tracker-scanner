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
            <td>${record.total_hours} hours, ${record.total_minutes} minutes</td>
            <td>
                <button class="btn edit-btn" onclick="editReport('${record.id}', '${record.employee_name}', '${record.task_name}', '${record.task_location}', ${record.total_hours}, ${record.total_minutes})">Edit</button>
                <button class="btn delete-btn" onclick="deleteReport('${record.id}')">Delete</button>
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

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    const editModal = document.getElementById('edit-modal');
    const closeBtn = editModal.querySelector('.close');
    const editForm = document.getElementById('edit-form');
    const resetSortBtn = document.createElement('button');
    resetSortBtn.textContent = 'Reset Sorting';
    resetSortBtn.classList.add('btn');
    resetSortBtn.addEventListener('click', resetSorting);
    document.querySelector('.controls').appendChild(resetSortBtn);

    closeBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveEdit();
    });

    // Initial update
    updateReports();
});

// Keep the existing editReport, saveEdit, and deleteReport functions

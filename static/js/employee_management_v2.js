document.addEventListener('DOMContentLoaded', function() {
    const employeeTable = document.getElementById('employee-table');
    const searchInput = document.getElementById('employee-search');
    const searchBtn = document.getElementById('search-btn');
    const taskIdFilter = document.getElementById('task-id-filter');
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    const employeeModal = document.getElementById('employee-modal');
    const employeeForm = document.getElementById('employee-form');
    const closeBtn = employeeModal.querySelector('.close');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');

    let currentPage = 1;
    let currentSort = { field: 'id', order: 'asc' };
    const itemsPerPage = 10;

    function showModal(title, id = '', name = '', employeeId = '', taskId = '', phoneNumber = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('employee-id').value = id;
        document.getElementById('employee-name').value = name;
        document.getElementById('employee-id-input').value = employeeId;
        document.getElementById('employee-task-id').value = taskId;
        document.getElementById('employee-phone').value = phoneNumber;
        employeeModal.style.display = 'block';
    }

    function closeModal() {
        employeeModal.style.display = 'none';
    }

    addEmployeeBtn.addEventListener('click', () => showModal('Add New Employee'));
    closeBtn.addEventListener('click', closeModal);

    employeeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('employee-id').value;
        const name = document.getElementById('employee-name').value;
        const employeeId = document.getElementById('employee-id-input').value;
        const taskId = document.getElementById('employee-task-id').value;
        const phoneNumber = document.getElementById('employee-phone').value;

        if (id) {
            updateEmployee(id, name, employeeId, taskId, phoneNumber);
        } else {
            addEmployee(name, employeeId, taskId, phoneNumber);
        }
    });

    employeeTable.addEventListener('click', function(e) {
        const target = e.target;
        if (target.classList.contains('sortable')) {
            const field = target.dataset.sort;
            if (currentSort.field === field) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort = { field, order: 'asc' };
            }
            searchEmployees();
        } else if (target.classList.contains('edit-btn')) {
            const row = target.closest('tr');
            const id = target.dataset.id;
            const name = row.querySelector('.employee-name').textContent;
            const employeeId = row.cells[2].textContent;
            const taskId = row.cells[3].textContent;
            const phoneNumber = row.cells[4].textContent;
            showModal('Edit Employee', id, name, employeeId, taskId, phoneNumber);
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this employee?')) {
                deleteEmployee(target.dataset.id);
            }
        }
    });

    searchBtn.addEventListener('click', searchEmployees);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchEmployees();
        }
    });

    taskIdFilter.addEventListener('change', searchEmployees);

    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));

    function searchEmployees() {
        const searchTerm = searchInput.value.toLowerCase();
        const taskId = taskIdFilter.value;
        fetch(`/api/employees/search?term=${searchTerm}&task_id=${taskId}&page=${currentPage}&sort_field=${currentSort.field}&sort_order=${currentSort.order}`)
            .then(response => response.json())
            .then(data => {
                updateEmployeeTable(data.employees);
                updatePagination(data.total_pages, data.current_page);
            })
            .catch(error => console.error('Error:', error));
    }

    function updateEmployeeTable(employees) {
        const tbody = employeeTable.querySelector('tbody');
        tbody.innerHTML = '';
        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.id}</td>
                <td class="employee-name">${employee.name}</td>
                <td>${employee.employee_id}</td>
                <td>${employee.task_id}</td>
                <td>${employee.phone_number}</td>
                <td>
                    <button class="btn edit-btn" data-id="${employee.id}">Edit</button>
                    <button class="btn delete-btn" data-id="${employee.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function updatePagination(totalPages, currentPageNum) {
        currentPage = currentPageNum;
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    function changePage(direction) {
        currentPage += direction;
        searchEmployees();
    }

    function addEmployee(name, employeeId, taskId, phoneNumber) {
        fetch('/api/employee/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, employee_id: employeeId, task_id: taskId, phone_number: phoneNumber }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeModal();
                searchEmployees();
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function updateEmployee(id, name, employeeId, taskId, phoneNumber) {
        fetch(`/api/employee/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, employee_id: employeeId, task_id: taskId, phone_number: phoneNumber }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeModal();
                searchEmployees();
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function deleteEmployee(id) {
        fetch(`/api/employee/delete/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                searchEmployees();
                showNotification('Employee deleted successfully', 'success');
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while deleting the employee', 'error');
        });
    }

    searchEmployees();
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
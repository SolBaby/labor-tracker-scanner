document.addEventListener('DOMContentLoaded', function() {
    const employeeTable = document.getElementById('employee-table');
    const searchInput = document.getElementById('employee-search');
    const searchBtn = document.getElementById('search-btn');
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    const employeeModal = document.getElementById('employee-modal');
    const employeeForm = document.getElementById('employee-form');
    const closeBtn = employeeModal.querySelector('.close');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');

    let currentPage = 1;
    const itemsPerPage = 10;

    function showModal(title, id = '', name = '', employeeId = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('employee-id').value = id;
        document.getElementById('employee-name').value = name;
        document.getElementById('employee-id-input').value = employeeId;
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

        if (id) {
            updateEmployee(id, name, employeeId);
        } else {
            addEmployee(name, employeeId);
        }
    });

    employeeTable.addEventListener('click', function(e) {
        const target = e.target;
        const row = target.closest('tr');
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const name = row.querySelector('.employee-name').textContent;
            const employeeId = row.querySelector('td:nth-child(3)').textContent;
            showModal('Edit Employee', id, name, employeeId);
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this employee?')) {
                deleteEmployee(id);
            }
        }
    });

    searchBtn.addEventListener('click', searchEmployees);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchEmployees();
        }
    });

    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));

    function searchEmployees() {
        const searchTerm = searchInput.value.toLowerCase();
        fetch(`/api/employees/search?term=${searchTerm}&page=${currentPage}`)
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

    function addEmployee(name, employeeId) {
        fetch('/api/employee/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, employee_id: employeeId }),
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

    function updateEmployee(id, name, employeeId) {
        fetch(`/api/employee/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, employee_id: employeeId }),
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
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Initialize employee list
    searchEmployees();
});

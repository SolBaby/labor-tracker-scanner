document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('add-task-form');
    const barcodeInput = document.getElementById('barcode-input');
    const taskTable = document.querySelector('table');
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const closeBtn = taskModal.querySelector('.close');

    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const scannedValue = this.value.trim();
                document.getElementById('new-task-barcode').value = scannedValue;
                this.value = '';
            }
        });
    }

    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('new-task-name').value;
            const taskId = document.getElementById('new-task-id').value;
            const barcode = document.getElementById('new-task-barcode').value;
            const location = document.getElementById('new-task-location').value;
            addTask(name, taskId, barcode, location);
        });
    }

    if (taskTable) {
        taskTable.addEventListener('click', function(e) {
            const target = e.target;
            if (target.classList.contains('edit-btn')) {
                const row = target.closest('tr');
                const id = target.dataset.id;
                const name = row.cells[1].textContent;
                const taskId = row.cells[2].textContent;
                const barcode = row.cells[3].textContent;
                const location = row.cells[4].textContent;
                showModal('Edit Task', id, name, taskId, barcode, location);
            } else if (target.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this task?')) {
                    deleteTask(target.dataset.id);
                }
            }
        });
    }

    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('task-id').value;
            const name = document.getElementById('task-name').value;
            const taskId = document.getElementById('task-id-input').value;
            const barcode = document.getElementById('task-barcode').value;
            const location = document.getElementById('task-location').value;
            if (id) {
                updateTask(id, name, taskId, barcode, location);
            } else {
                addTask(name, taskId, barcode, location);
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    function showModal(title, id = '', name = '', taskId = '', barcode = '', location = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('task-id').value = id;
        document.getElementById('task-name').value = name;
        document.getElementById('task-id-input').value = taskId;
        document.getElementById('task-barcode').value = barcode;
        document.getElementById('task-location').value = location;
        taskModal.style.display = 'block';
    }

    function closeModal() {
        taskModal.style.display = 'none';
    }

    function addTask(name, taskId, barcode, location) {
        fetch('/api/task/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name, task_id: taskId, barcode: barcode, location: location }),
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

    function updateTask(id, name, taskId, barcode, location) {
        fetch(`/api/task/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name, task_id: taskId, barcode: barcode, location: location }),
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

    function deleteTask(id) {
        fetch(`/api/task/delete/${id}`, {
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
});

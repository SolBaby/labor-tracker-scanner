document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('add-task-form');
    const barcodeInput = document.getElementById('barcode-input');

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
            addTask(name, taskId, barcode);
        });
    }
});

function addTask(name, taskId, barcode) {
    fetch('/api/task/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name, task_id: taskId, barcode: barcode }),
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

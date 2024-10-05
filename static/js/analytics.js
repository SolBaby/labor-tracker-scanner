let productivityChart;
let taskCompletionChart;

function fetchProductivityData() {
    fetch('/api/analytics/productivity')
        .then(response => response.json())
        .then(data => {
            const labels = data.map(item => item.employee_name);
            const avgDurations = data.map(item => item.avg_task_duration);
            const completedTasks = data.map(item => item.completed_tasks);

            if (productivityChart) {
                productivityChart.destroy();
            }

            const ctx = document.getElementById('productivityChart').getContext('2d');
            productivityChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Average Task Duration (minutes)',
                            data: avgDurations,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Completed Tasks',
                            data: completedTasks,
                            backgroundColor: 'rgba(153, 102, 255, 0.6)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });
}

function fetchTaskCompletionData() {
    fetch('/api/analytics/task_completion')
        .then(response => response.json())
        .then(data => {
            const labels = data.map(item => item.task_name);
            const completionCounts = data.map(item => item.completion_count);
            const avgDurations = data.map(item => item.avg_duration);

            if (taskCompletionChart) {
                taskCompletionChart.destroy();
            }

            const ctx = document.getElementById('taskCompletionChart').getContext('2d');
            taskCompletionChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Completion Count',
                            data: completionCounts,
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Average Duration (minutes)',
                            data: avgDurations,
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });
}

function updateCharts() {
    fetchProductivityData();
    fetchTaskCompletionData();
}

document.addEventListener('DOMContentLoaded', function() {
    updateCharts();
    // Update charts every 30 seconds
    setInterval(updateCharts, 30000);
});

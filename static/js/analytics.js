let productivityChart;
let taskCompletionChart;
let departmentPerformanceChart;
let socket;

function initWebSocket() {
    socket = new WebSocket('ws://' + location.host + '/ws/analytics');
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        updateCharts(data);
    };

    socket.onclose = function(event) {
        console.log('WebSocket closed. Reconnecting...');
        setTimeout(initWebSocket, 1000);
    };

    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

function fetchProductivityData() {
    fetch('/api/analytics/productivity')
        .then(response => response.json())
        .then(data => updateProductivityChart(data));
}

function fetchTaskCompletionData() {
    fetch('/api/analytics/task_completion')
        .then(response => response.json())
        .then(data => updateTaskCompletionChart(data));
}

function fetchDepartmentPerformanceData() {
    fetch('/api/analytics/department_performance')
        .then(response => response.json())
        .then(data => updateDepartmentPerformanceChart(data));
}

function updateProductivityChart(data) {
    const labels = data.map(item => item.employee_name);
    const avgDurations = data.map(item => item.avg_task_duration);
    const completedTasks = data.map(item => item.completed_tasks);
    const departments = data.map(item => item.department);

    if (productivityChart) {
        productivityChart.data.labels = labels;
        productivityChart.data.datasets[0].data = avgDurations;
        productivityChart.data.datasets[1].data = completedTasks;
        productivityChart.update();
    } else {
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
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterBody: function(context) {
                                return `Department: ${departments[context[0].dataIndex]}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateTaskCompletionChart(data) {
    const labels = data.map(item => item.task_name);
    const completionCounts = data.map(item => item.completion_count);
    const avgDurations = data.map(item => item.avg_duration);
    const locations = data.map(item => item.location);

    if (taskCompletionChart) {
        taskCompletionChart.data.labels = labels;
        taskCompletionChart.data.datasets[0].data = completionCounts;
        taskCompletionChart.data.datasets[1].data = avgDurations;
        taskCompletionChart.update();
    } else {
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
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterBody: function(context) {
                                return `Location: ${locations[context[0].dataIndex]}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateDepartmentPerformanceChart(data) {
    const labels = data.map(item => item.department);
    const employeeCounts = data.map(item => item.employee_count);
    const avgTaskDurations = data.map(item => item.avg_task_duration);
    const totalTasksCompleted = data.map(item => item.total_tasks_completed);

    if (departmentPerformanceChart) {
        departmentPerformanceChart.data.labels = labels;
        departmentPerformanceChart.data.datasets[0].data = employeeCounts;
        departmentPerformanceChart.data.datasets[1].data = avgTaskDurations;
        departmentPerformanceChart.data.datasets[2].data = totalTasksCompleted;
        departmentPerformanceChart.update();
    } else {
        const ctx = document.getElementById('departmentPerformanceChart').getContext('2d');
        departmentPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Employee Count',
                        data: employeeCounts,
                        backgroundColor: 'rgba(255, 206, 86, 0.6)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Average Task Duration (minutes)',
                        data: avgTaskDurations,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Total Tasks Completed',
                        data: totalTasksCompleted,
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
    }
}

function updateCharts(data) {
    if (data.productivity) {
        updateProductivityChart(data.productivity);
    }
    if (data.task_completion) {
        updateTaskCompletionChart(data.task_completion);
    }
    if (data.department_performance) {
        updateDepartmentPerformanceChart(data.department_performance);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetchProductivityData();
    fetchTaskCompletionData();
    fetchDepartmentPerformanceData();
    initWebSocket();
});

let productivityChart;
let taskCompletionChart;
let departmentPerformanceChart;
let realTimeChart;
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
    if (data.real_time) {
        updateRealTimeChart(data.real_time);
    }
}

function updateProductivityChart(data) {
    const labels = data.map(item => item.employee_name);
    const avgDurations = data.map(item => item.avg_task_duration);
    const completedTasks = data.map(item => item.completed_tasks);

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
                }
            }
        });
    }
}

function updateTaskCompletionChart(data) {
    const labels = data.map(item => item.task_name);
    const completionCounts = data.map(item => item.completion_count);
    const avgDurations = data.map(item => item.avg_duration);

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
                }
            }
        });
    }
}

function updateDepartmentPerformanceChart(data) {
    const labels = data.map(item => item.department);
    const avgTaskDurations = data.map(item => item.avg_task_duration);
    const totalTasksCompleted = data.map(item => item.total_tasks_completed);

    if (departmentPerformanceChart) {
        departmentPerformanceChart.data.labels = labels;
        departmentPerformanceChart.data.datasets[0].data = avgTaskDurations;
        departmentPerformanceChart.data.datasets[1].data = totalTasksCompleted;
        departmentPerformanceChart.update();
    } else {
        const ctx = document.getElementById('departmentPerformanceChart').getContext('2d');
        departmentPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
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

function updateRealTimeChart(data) {
    const labels = data.map(item => `${item.employee_name} - ${item.task_name}`);
    const statuses = data.map(item => item.status === 'checked_in' ? 1 : 0);

    if (realTimeChart) {
        realTimeChart.data.labels = labels;
        realTimeChart.data.datasets[0].data = statuses;
        realTimeChart.update();
    } else {
        const ctx = document.getElementById('realTimeChart').getContext('2d');
        realTimeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Current Status',
                        data: statuses,
                        backgroundColor: statuses.map(status => status === 1 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
                        borderColor: statuses.map(status => status === 1 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value === 0 ? 'Checked Out' : 'Checked In';
                            }
                        }
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initWebSocket();
});

let productivityChart;
let taskCompletionChart;
let departmentPerformanceChart;
let realTimeChart;
let socket;

function initWebSocket() {
    socket = io();
    
    socket.on('connect', function() {
        console.log('Connected to analytics websocket');
    });

    socket.on('analytics_update', function(data) {
        updateCharts(data);
    });

    socket.on('disconnect', function() {
        console.log('Disconnected from analytics websocket');
    });
}

// ... (rest of the file remains unchanged)

document.addEventListener('DOMContentLoaded', function() {
    initWebSocket();
});

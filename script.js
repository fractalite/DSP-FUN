// Timer functionality
let timerInterval;
let startTime;

function updateTimer() {
    const currentTime = new Date().getTime();
    const elapsedTime = new Date(currentTime - startTime);
    const hours = String(elapsedTime.getUTCHours()).padStart(2, '0');
    const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, '0');
    document.getElementById('session-timer').textContent = `${hours}:${minutes}:${seconds}`;
}

document.getElementById('start-session').addEventListener('click', function() {
    startTime = new Date().getTime();
    timerInterval = setInterval(updateTimer, 1000);
    this.disabled = true;
    document.getElementById('stop-session').disabled = false;
    document.getElementById('session-status').textContent = 'Session in Progress';
});

document.getElementById('stop-session').addEventListener('click', function() {
    clearInterval(timerInterval);
    document.getElementById('session-timer').textContent = '00:00:00';
    this.disabled = true;
    document.getElementById('start-session').disabled = false;
    document.getElementById('session-status').textContent = 'Session Ended';
});

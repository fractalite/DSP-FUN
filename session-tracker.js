// Session tracking functionality
let sessionStats = {
    weeklyData: Array(7).fill(0),  // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    totalSessions: 0,
    totalTime: 0
};

// Load stats from localStorage
function loadSessionStats() {
    const saved = localStorage.getItem('sessionStats');
    if (saved) {
        sessionStats = JSON.parse(saved);
        updateUI();
    }
}

// Save stats to localStorage
function saveSessionStats() {
    localStorage.setItem('sessionStats', JSON.stringify(sessionStats));
}

// Update the UI with current stats
function updateUI() {
    // Update total sessions
    document.querySelector('#session-stats .stat-item:first-child p').textContent = sessionStats.totalSessions;
    
    // Update weekly bars
    sessionStats.weeklyData.forEach((sessions, index) => {
        const bar = document.querySelector(`.day-bar:nth-child(${index + 1}) .bar`);
        if (bar) {
            bar.style.height = sessions === 0 ? '4px' : `${Math.min(sessions * 20, 100)}px`;
            bar.setAttribute('data-sessions', sessions);
        }
    });
}

// Record a completed session
function recordSession(duration) {
    const today = new Date().getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    const dayIndex = today === 0 ? 6 : today - 1;
    
    sessionStats.weeklyData[dayIndex]++;
    sessionStats.totalSessions++;
    sessionStats.totalTime += duration;
    
    saveSessionStats();
    updateUI();
}

// Reset weekly stats (call this at the start of each week)
function resetWeeklyStats() {
    sessionStats.weeklyData = Array(7).fill(0);
    saveSessionStats();
    updateUI();
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadSessionStats();
    
    // Check if we need to reset weekly stats (e.g., if it's a new week)
    const lastReset = localStorage.getItem('lastWeeklyReset');
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
    
    if (!lastReset || new Date(lastReset) < weekStart) {
        resetWeeklyStats();
        localStorage.setItem('lastWeeklyReset', weekStart.toISOString());
    }
});

// Listen for session completion
document.getElementById('stop-session').addEventListener('click', function() {
    if (startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        recordSession(duration);
    }
});

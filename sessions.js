// Session stats and history management
class SessionManager {
    constructor() {
        this.sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        this.currentSession = null;
        this.initializeUI();
    }

    initializeUI() {
        // Update stats display
        this.updateStatsDisplay();
        
        // Initialize event listeners
        const startBtn = document.getElementById('start-session');
        const stopBtn = document.getElementById('stop-session');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startSession());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopSession());
    }

    startSession() {
        this.currentSession = {
            startTime: new Date(),
            binauralFrequency: document.querySelector('#frequency-display span')?.textContent || '0',
            hasVoiceRecording: false,
            affirmations: document.getElementById('affirmations-area')?.value || ''
        };
        
        // Update UI to show session is active
        const statusEl = document.getElementById('session-status');
        const startBtn = document.getElementById('start-session');
        const stopBtn = document.getElementById('stop-session');
        
        if (statusEl) statusEl.textContent = 'Session Active';
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
    }

    stopSession() {
        if (!this.currentSession) return;
        
        // Complete session data
        this.currentSession.endTime = new Date();
        this.currentSession.duration = (this.currentSession.endTime - this.currentSession.startTime) / 1000; // in seconds
        this.currentSession.hasVoiceRecording = !!document.getElementById('play-btn')?.getAttribute('data-recording');
        
        // Save session
        this.sessions.push(this.currentSession);
        localStorage.setItem('sessions', JSON.stringify(this.sessions));
        
        // Reset current session
        this.currentSession = null;
        
        // Update UI
        this.updateStatsDisplay();
        const statusEl = document.getElementById('session-status');
        const startBtn = document.getElementById('start-session');
        const stopBtn = document.getElementById('stop-session');
        
        if (statusEl) statusEl.textContent = 'Session Complete';
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
    }

    updateStatsDisplay() {
        const stats = this.calculateStats();
        const statsContainer = document.getElementById('session-stats');
        
        if (statsContainer) statsContainer.innerHTML = `
            <div class="stat-item">
                <h3>Total Sessions</h3>
                <p>${stats.totalSessions}</p>
            </div>
            <div class="stat-item">
                <h3>Total Time</h3>
                <p>${this.formatDuration(stats.totalDuration)}</p>
            </div>
            <div class="stat-item">
                <h3>Average Duration</h3>
                <p>${this.formatDuration(stats.averageDuration)}</p>
            </div>
            <div class="stat-item">
                <h3>Most Used Frequency</h3>
                <p>${stats.mostUsedFrequency} Hz</p>
            </div>
        `;

        // Update history visualization
        this.updateHistoryVisualization();
    }

    calculateStats() {
        if (this.sessions.length === 0) {
            return {
                totalSessions: 0,
                totalDuration: 0,
                averageDuration: 0,
                mostUsedFrequency: 'N/A'
            };
        }

        const totalDuration = this.sessions.reduce((acc, session) => acc + session.duration, 0);
        
        // Calculate most used frequency
        const frequencyCount = {};
        this.sessions.forEach(session => {
            const freq = session.binauralFrequency;
            frequencyCount[freq] = (frequencyCount[freq] || 0) + 1;
        });
        const mostUsedFrequency = Object.entries(frequencyCount)
            .sort((a, b) => b[1] - a[1])[0][0];

        return {
            totalSessions: this.sessions.length,
            totalDuration: totalDuration,
            averageDuration: totalDuration / this.sessions.length,
            mostUsedFrequency: mostUsedFrequency
        };
    }

    updateHistoryVisualization() {
        const historyContainer = document.getElementById('session-history');
        if (this.sessions.length === 0) {
            if (historyContainer) historyContainer.innerHTML = '<p>No sessions recorded yet</p>';
            return;
        }

        // Create a weekly view of sessions
        const weeklyData = this.getWeeklySessionData();
        
        // Create visualization
        if (historyContainer) historyContainer.innerHTML = `
            <div class="weekly-history">
                ${weeklyData.map(day => `
                    <div class="history-day" style="height: ${day.sessionCount * 20}px">
                        <span class="day-label">${day.label}</span>
                        <span class="session-count">${day.sessionCount}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getWeeklySessionData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const weekData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dayCount = this.sessions.filter(session => {
                const sessionDate = new Date(session.startTime);
                return sessionDate.toDateString() === date.toDateString();
            }).length;

            weekData.push({
                label: days[date.getDay()],
                sessionCount: dayCount
            });
        }

        return weekData;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
}

// Initialize session manager when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.sessionManager = new SessionManager();
});

// CSP Diagnostic Script
function testCSPCompliance() {
    const tests = {
        googleFonts: {
            url: 'https://fonts.googleapis.com/css2?family=Fraunces',
            description: 'Google Fonts CSS Loading'
        },
        gstaticFonts: {
            url: 'https://fonts.gstatic.com/s/fraunces/v31/6NVf8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJdt9vIVYX9G37lvd9sPEKsxx664UJf1jiSs7RrU9kMz3lR24.woff2',
            description: 'Google Fonts WOFF2 Loading'
        }
    };

    Object.entries(tests).forEach(([key, test]) => {
        fetch(test.url)
            .then(response => {
                console.log(`✅ ${test.description} successful:`, response.status);
            })
            .catch(error => {
                console.error(`❌ ${test.description} failed:`, error);
            });
    });
}

// Run tests on load
window.addEventListener('load', testCSPCompliance);

// Logging for service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker registered successfully:', registration);
    }).catch(error => {
        console.error('Service Worker registration failed:', error);
    });
}

// AudioContext initialization diagnostic
function testAudioContextInitialization() {
    try {
        const audioContext = new AudioContext();
        console.log('AudioContext created successfully');
        
        // Immediate suspend to prevent unwanted audio
        audioContext.suspend();
    } catch (error) {
        console.error('AudioContext initialization failed:', error);
    }
}

// Add interaction listener for AudioContext
document.addEventListener('DOMContentLoaded', () => {
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Audio Initialization';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '9999';
    
    testButton.addEventListener('click', () => {
        console.log('Interaction button clicked');
        testAudioContextInitialization();
    });
    
    document.body.appendChild(testButton);
});

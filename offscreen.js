chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'play-sound') {
        const audio = new Audio(msg.url);
        audio.play()
            .then(() => sendResponse({ status: 'playing' }))
            .catch(error => {
                console.error('Offscreen audio play error:', error);
                sendResponse({ status: 'error', error: error.message });
            });
        return true;
    }
});

function updateStats() {
    chrome.storage.local.get(['lastSpawn', 'failCount', 'sessionCount'], (result) => {
        const lastSpawn = result.lastSpawn || Date.now();
        const failCount = result.failCount || 0;
        const sessionCount = result.sessionCount || 0;
        const totalSpawns = result.totalSpawns || 0;

        // Last spawn time
        const diffMs = Date.now() - lastSpawn;
        const minutes = Math.floor(diffMs / 60000);
        const minAgoText = chrome.i18n.getMessage("minAgo");
        document.getElementById('lastSpawn').textContent = `${minutes} ${minAgoText}`;

        // Pity/Chance
        const currentChance = 0.01 + (failCount * 0.001);
        document.getElementById('pity').textContent = `${(currentChance * 100).toFixed(1)}%`;

        // Session count
        document.getElementById('sessionCount').textContent = sessionCount;

        // Total Spawns (Record)
        document.getElementById('totalSpawns').textContent = totalSpawns;
    });
}

function initI18n() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const message = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
        if (message) {
            element.textContent = message;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const message = chrome.i18n.getMessage(element.getAttribute('data-i18n-title'));
        if (message) {
            element.title = message;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    updateStats();
});

// Refresh every 30 seconds while open
setInterval(updateStats, 30000);

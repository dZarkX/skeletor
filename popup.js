function updateStats() {
    chrome.storage.local.get(['lastSpawn', 'failCount', 'sessionCount'], (result) => {
        const lastSpawn = result.lastSpawn || Date.now();
        const failCount = result.failCount || 0;
        const sessionCount = result.sessionCount || 0;

        // Last spawn time
        const diffMs = Date.now() - lastSpawn;
        const minutes = Math.floor(diffMs / 60000);
        document.getElementById('lastSpawn').textContent = `${minutes} min ago`;

        // Pity/Chance
        const currentChance = 0.01 + (failCount * 0.001);
        document.getElementById('pity').textContent = `${(currentChance * 100).toFixed(1)}%`;

        // Session count
        document.getElementById('sessionCount').textContent = sessionCount;
    });
}

document.addEventListener('DOMContentLoaded', updateStats);
// Refresh every 30 seconds while open
setInterval(updateStats, 30000);

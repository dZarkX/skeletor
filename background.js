// Constants
const ALARM_NAME = 'skeletonChance';
const BASE_CHANCE = 0.005; // 0.5%
const PITY_INCREMENT = 0.001; // +0.1% per minute

// Set up alarm to fire every minute
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    initializeState();
    console.log('Skeleton extension installed. Alarm created.');
});

// Initialize storage if empty
function initializeState() {
    chrome.storage.local.get(['lastSpawn', 'failCount', 'sessionCount'], (result) => {
        if (!result.lastSpawn) {
            chrome.storage.local.set({
                lastSpawn: Date.now(),
                failCount: 0,
                sessionCount: 0
            }, () => updateBadge(Date.now(), BASE_CHANCE));
        } else {
            // Calculate chance based on existing failCount
            const currentChance = BASE_CHANCE + ((result.failCount || 0) * PITY_INCREMENT);
            updateBadge(result.lastSpawn, currentChance);
        }
    });
}

// Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        checkAndTrigger();
    }
});

function checkAndTrigger() {
    chrome.storage.local.get(['lastSpawn', 'failCount'], (result) => {
        const lastSpawn = result.lastSpawn || Date.now();
        const failCount = result.failCount || 0;

        // Calculate dynamic chance
        const currentChance = BASE_CHANCE + (failCount * PITY_INCREMENT);
        const roll = Math.random();

        console.log(`Skeleton RNG: Rolled ${roll.toFixed(4)} vs Chance ${currentChance.toFixed(4)} (Streak: ${failCount})`);

        if (roll < currentChance) {
            triggerSkeleton();
            resetState();
        } else {
            // Increment fail count
            chrome.storage.local.set({ failCount: failCount + 1 });
            updateBadge(lastSpawn, currentChance);
        }
    });
}

// Reset state after spawn
function resetState() {
    chrome.storage.local.get(['sessionCount'], (result) => {
        const newCount = (result.sessionCount || 0) + 1;
        const now = Date.now();
        chrome.storage.local.set({
            lastSpawn: now,
            failCount: 0,
            sessionCount: newCount
        });
        updateBadge(now, BASE_CHANCE);
    });
}

// Update Badge Tooltip
function updateBadge(lastSpawnTime, currentChance) {
    const now = Date.now();
    const diffMs = now - lastSpawnTime;
    const minutes = Math.floor(diffMs / 60000);
    const probabilityPercent = (currentChance * 100).toFixed(1);

    const titleText = `Last executed: ${minutes} min ago\nCurrent Chance: ${probabilityPercent}%`;
    chrome.action.setTitle({ title: titleText });
}

// Listen for the shortcut command
chrome.commands.onCommand.addListener((command) => {
    if (command === 'trigger-skeleton') {
        triggerSkeleton();
        resetState();
    }
});

function triggerSkeleton() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            const tabId = tabs[0].id;
            const url = tabs[0].url;

            if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('edge://')) {
                console.log('Cannot run extension on internal/protected pages:', url);
                return;
            }

            console.log(`Attempting to trigger skeleton on tab ${tabId} (${url})`);

            chrome.tabs.sendMessage(tabId, { action: 'spawnSkeleton' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Message failed, attempting injection:', chrome.runtime.lastError.message);
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['content.js']
                    }).then(() => {
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tabId, { action: 'spawnSkeleton' });
                        }, 100);
                    }).catch(err => console.error('Injection failed:', err));
                }
            });
        }
    });
}

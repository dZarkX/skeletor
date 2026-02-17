const ALARM_NAME = 'skeletonChance';
const BASE_CHANCE = 0.0025; // 0.25%
const PITY_INCREMENT = 0.001; // +0.1% per minute
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// Set up alarm to fire every minute
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    initializeState();
    setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
    console.log('Skeleton extension installed. Alarm created.');
});

// Reset session count on browser startup
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.set({ sessionCount: 0 });
    setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
});

async function setupOffscreenDocument(path) {
    if (!(await chrome.offscreen.hasDocument())) {
        await chrome.offscreen.createDocument({
            url: path,
            reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
            justification: 'To play notification sounds when the skeleton appears'
        });
    }
}

// Initialize storage if empty
function initializeState() {
    chrome.storage.local.get(['lastSpawn', 'failCount', 'sessionCount', 'bestRecord'], (result) => {
        let updates = {};

        // Initialize bestRecord if missing
        if (result.bestRecord === undefined) {
            updates.bestRecord = result.sessionCount || 0;
        }

        if (!result.lastSpawn) {
            updates.lastSpawn = Date.now();
            updates.failCount = 0;
            if (updates.sessionCount === undefined) updates.sessionCount = 0;

            chrome.storage.local.set(updates, () => updateBadge(Date.now(), BASE_CHANCE));
        } else {
            // Apply any initialization updates
            if (Object.keys(updates).length > 0) {
                chrome.storage.local.set(updates);
            }

            // Calculate chance based on existing failCount
            const currentChance = BASE_CHANCE + ((result.failCount || 0) * PITY_INCREMENT);
            updateBadge(result.lastSpawn, currentChance);
        }
    });
}

// Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        chrome.windows.getAll({ populate: false }, (windows) => {
            const visibleWindows = windows.filter(w => w.state !== 'minimized');

            if (visibleWindows.length > 0) {
                // Prioritize focused window, otherwise pick the first visible one
                const targetWindow = visibleWindows.find(w => w.focused) || visibleWindows[0];
                checkAndTrigger(targetWindow.id);
            } else {
                console.log("Skipping spawn check: All windows minimized.");
            }
        });
    }
});

function checkAndTrigger(targetWindowId) {
    // First, verify if the target window/tab is ACTUALLY visible (rendering)
    // We need to find the active tab in that window to query it
    chrome.tabs.query({ active: true, windowId: targetWindowId }, (tabs) => {
        if (!tabs[0]) return;
        const tabId = tabs[0].id;

        // Skip internal or restricted pages immediately to avoid errors
        const url = tabs[0].url;
        if (!url ||
            url.startsWith('chrome://') ||
            url.startsWith('edge://') ||
            url.startsWith('brave://') ||
            url.startsWith('about:') ||
            url.includes('chrome.google.com/webstore')) {
            console.log("Skipping internal/restricted page:", url);
            return;
        }

        chrome.tabs.sendMessage(tabId, { action: 'checkVisibility' }, (response) => {
            // If we get an error (e.g. content script not loaded), we might want to skip or try injecting
            if (chrome.runtime.lastError) {
                console.log("Visibility check failed (script not likely loaded):", chrome.runtime.lastError.message);
                // Optional: Try injecting here, but for now let's just skip to avoid spam errors
                return;
            }

            if (response && response.isVisible) {
                // proceed with RNG
                performRngCheck(targetWindowId);
            } else {
                console.log(`Skipping spawn/tick: Tab reports not visible (${response ? response.reason : 'no response'})`);
            }
        });
    });
}

function performRngCheck(targetWindowId) {
    chrome.storage.local.get(['lastSpawn', 'failCount'], (result) => {
        const lastSpawn = result.lastSpawn || Date.now();
        const failCount = result.failCount || 0;

        // Calculate dynamic chance
        const currentChance = BASE_CHANCE + (failCount * PITY_INCREMENT);
        const roll = Math.random();

        console.log(`Skeleton RNG: Rolled ${roll.toFixed(4)} vs Chance ${currentChance.toFixed(4)} (Streak: ${failCount})`);

        if (roll < currentChance) {
            triggerSkeleton(targetWindowId, () => {
                resetState();
            });
        } else {
            // Increment fail count
            chrome.storage.local.set({ failCount: failCount + 1 });
            updateBadge(lastSpawn, currentChance);
        }
    });
}


// Reset state after spawn
function resetState() {
    chrome.storage.local.get(['sessionCount', 'bestRecord'], (result) => {
        const currentSession = (result.sessionCount || 0) + 1;
        let bestRecord = result.bestRecord || 0;

        // Update High Score if current session exceeds it
        if (currentSession > bestRecord) {
            bestRecord = currentSession;
        }

        const now = Date.now();

        chrome.storage.local.set({
            lastSpawn: now,
            failCount: 0,
            sessionCount: currentSession,
            bestRecord: bestRecord
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
        // For command, we rely on Chrome's default behavior of targeting the active window
        // But we can explicitly find the focused window to be safe/consistent
        chrome.windows.getLastFocused((window) => {
            if (window) {
                triggerSkeleton(window.id, () => {
                    resetState();
                });
            }
        });
    }
});

function triggerSkeleton(targetWindowId, onSuccess) {
    const queryOptions = { active: true };
    if (targetWindowId) {
        queryOptions.windowId = targetWindowId;
    } else {
        queryOptions.currentWindow = true;
    }

    chrome.tabs.query(queryOptions, (tabs) => {
        if (tabs[0]) {
            const tabId = tabs[0].id;
            const url = tabs[0].url;

            if (!url ||
                url.startsWith('chrome://') ||
                url.startsWith('about:') ||
                url.startsWith('edge://') ||
                url.startsWith('brave://') ||
                url.includes('chrome.google.com/webstore')) {
                console.log('Cannot run extension on internal/protected pages:', url);
                return;
            }

            // Execute callback if check passes
            if (onSuccess) onSuccess();

            console.log(`Attempting to trigger skeleton on tab ${tabId} (${url})`);

            // 1. Play Sound via Offscreen Document
            const soundFiles = [
                'bad-to-the-bone-meme.mp3',
                'fnaf2-ambience.mp3',
                'jumpscare_sound.wav',
                'minecraft-train-whistle-cave-sound.mp3',
                'skeletondie.mp3',
                'skull-trumpet_XNDN4Ww.mp3',
                'strange-sound-effect.mp3'
            ];
            const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
            const soundUrl = chrome.runtime.getURL(`sounds/${randomSound}`);

            // Ensure offscreen document exists before sending message
            setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH).then(() => {
                chrome.runtime.sendMessage({
                    action: 'play-sound',
                    url: soundUrl
                });
            });

            // 2. Spawn Visuals in Content Script
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

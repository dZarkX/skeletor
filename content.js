chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'spawnSkeleton') {
    const spawned = spawnSkeleton();
    sendResponse({ status: spawned ? 'Skeleton spawned' : 'Skeleton already active' });
  }
});

function spawnSkeleton() {
  if (document.getElementById('skeleton-run-container')) {
    return false;
  }

  const pngUrl = chrome.runtime.getURL('skeleton_spritesheet.png');
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

  const frameCount = 11;
  const fps = 12;
  const duration = frameCount / fps;

  const container = document.createElement('div');
  container.id = 'skeleton-run-container';
  container.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: transparent !important;
    visibility: visible !important;
    opacity: 1 !important;
  `;

  const sprite = document.createElement('div');
  sprite.id = 'skeleton-sprite';

  // Responsive spritesheet:
  // IMPORTANT: No !important on properties we want to animate!
  sprite.style.cssText = `
    display: block !important;
    width: 100vw !important;
    height: 56.25vw !important;
    background-image: url("${pngUrl}") !important;
    background-repeat: no-repeat !important;
    background-size: ${frameCount * 100}% 100%;
    background-position: 0% 0%;
    visibility: visible !important;
    opacity: 1 !important;
  `;

  const fromLeft = Math.random() > 0.5;
  sprite.style.transform = fromLeft ? 'none' : 'scaleX(-1)';

  const styleId = 'skeleton-animation-style';
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.innerHTML = `
    @keyframes skeleton-run-working {
      from { background-position: 0% 0%; }
      to { background-position: 100% 0%; }
    }
  `;

  // Apply animation with !important to ensure it overrides site styles
  sprite.style.setProperty('animation', `skeleton-run-working ${duration}s steps(${frameCount - 1}) forwards`, 'important');

  container.appendChild(sprite);
  document.body.appendChild(container);

  const audio = new Audio(soundUrl);
  audio.play().catch(e => console.log('Audio error:', e));

  setTimeout(() => {
    container.remove();
  }, duration * 1000);

  return true;
}

export function setupFullscreen(button, icon, onUnavailable, onResize) {
  const root = document.documentElement;
  const active = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  const sync = () => {
    const expanded = active();
    button.setAttribute('aria-pressed', String(expanded));
    button.setAttribute('aria-label', expanded ? 'Exit fullscreen' : 'Enter fullscreen');
    button.title = expanded ? 'Exit fullscreen' : 'Fullscreen';
    icon.setAttribute('d', expanded ? 'M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5' : 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5');
    onResize();
  };
  button.addEventListener('click', async () => {
    try {
      if (active()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit.call(document);
      } else {
        const request = root.requestFullscreen || root.webkitRequestFullscreen;
        if (!request || document.fullscreenEnabled === false || standalone()) {
          onUnavailable(standalone()); return;
        }
        await request.call(root);
      }
      sync();
    } catch {
      onUnavailable(false);
    } finally { button.blur(); }
  });
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  sync();
}

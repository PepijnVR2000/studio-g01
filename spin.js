/* Nine real photographs play forward and backward as a calm boomerang. */
(() => {
  document.querySelectorAll('.spin').forEach(spin => {
    const frames = [...spin.querySelectorAll('img')];
    if (frames.length < 2) return;

    let current = 0;
    let direction = 1;
    let timer;

    const show = index => {
      if (index === current) return;
      frames[current].classList.remove('is-on');
      frames[index].classList.add('is-on');
      current = index;
    };

    const step = () => {
      if (current === frames.length - 1) direction = -1;
      if (current === 0) direction = 1;
      show(current + direction);
    };

    const start = () => {
      if (!timer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = window.setInterval(step, 360);
      }
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };

    frames[0].classList.add('is-on');
    Promise.all(frames.map(frame => frame.decode().catch(() => undefined))).then(start);

    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  });
})();

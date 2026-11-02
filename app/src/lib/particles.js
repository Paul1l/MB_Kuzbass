// Облако точек, которое складывается в слова и рассыпается от курсора или пальца (как пример владельца
// с частицами). Рисует на canvas без сторонних библиотек; работает, только пока canvas виден на экране.

const COLORS = ['#cfd2e0', '#cfd2e0', '#cfd2e0', '#ffffff', '#e14c47', '#ffc72c'];
const MAX_PARTICLES = 1600;
const POINTER_RADIUS = 80;

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

// Точки слова: рисуем слово на скрытом canvas и берём непрозрачные пиксели с шагом step.
function sampleWord(word, width, height, step, font) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let size = height * 0.74;
  context.font = `600 ${size}px ${font}`;
  const measured = context.measureText(word).width;
  if (measured > width * 0.94) size *= (width * 0.94) / measured;
  context.font = `600 ${size}px ${font}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff';
  context.fillText(word, width / 2, height / 2);

  const { data } = context.getImageData(0, 0, width, height);
  const points = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] > 140) points.push([x, y]);
    }
  }
  return points;
}

// Запускает анимацию на canvas. Слова меняются каждые interval мс. Возвращает функцию остановки.
export function startParticleWords(canvas, { words, interval = 3600, font = 'Unbounded, Onest, sans-serif' }) {
  const context = canvas.getContext('2d');
  const pointer = { x: -9999, y: -9999 };
  let width = 0;
  let height = 0;
  let particles = [];
  let wordPoints = [];
  let wordIndex = 0;
  let frame = 0;
  let visible = false;
  let lastSwitch = 0;
  let stopped = false;

  function assignWord(index, burst) {
    const points = wordPoints[index];
    const order = shuffle([...particles.keys()]);
    order.forEach((particleIndex, position) => {
      const particle = particles[particleIndex];
      const [x, y] = points[position < points.length ? position : Math.floor(Math.random() * points.length)];
      particle.tx = x;
      particle.ty = y;
      if (burst) {
        particle.vx += (Math.random() - 0.5) * 14;
        particle.vy += (Math.random() - 0.5) * 14;
      }
    });
  }

  function setup() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    let step = width < 600 ? 3 : 4;
    wordPoints = words.map((word) => sampleWord(word, width, height, step, font));
    while (Math.max(...wordPoints.map((points) => points.length)) > MAX_PARTICLES) {
      step += 1;
      wordPoints = words.map((word) => sampleWord(word, width, height, step, font));
    }
    const count = Math.max(...wordPoints.map((points) => points.length));
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      tx: 0,
      ty: 0,
      size: step > 3 ? 2 : 1.6,
      color: COLORS[index % COLORS.length],
    }));
    // Сортировка по цвету: меньше переключений цвета при рисовании.
    particles.sort((a, b) => (a.color < b.color ? -1 : 1));
    assignWord(wordIndex, false);
  }

  function tick(now) {
    frame = 0;
    if (!visible || stopped) return;
    if (!lastSwitch) lastSwitch = now;
    if (now - lastSwitch > interval) {
      lastSwitch = now;
      wordIndex = (wordIndex + 1) % words.length;
      assignWord(wordIndex, true);
    }

    context.clearRect(0, 0, width, height);
    let currentColor = '';
    const radiusSquared = POINTER_RADIUS * POINTER_RADIUS;
    for (const particle of particles) {
      particle.vx += (particle.tx - particle.x) * 0.045;
      particle.vy += (particle.ty - particle.y) * 0.045;
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < radiusSquared) {
        const distance = Math.sqrt(distanceSquared) || 1;
        const force = (1 - distanceSquared / radiusSquared) * 7;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
      particle.vx *= 0.8;
      particle.vy *= 0.8;
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.color !== currentColor) {
        currentColor = particle.color;
        context.fillStyle = currentColor;
      }
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    frame = window.requestAnimationFrame(tick);
  }

  function play() {
    if (!frame && visible && !stopped && document.visibilityState === 'visible') {
      frame = window.requestAnimationFrame(tick);
    }
  }

  const handlePointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };
  const handlePointerLeave = () => {
    pointer.x = -9999;
    pointer.y = -9999;
  };
  const handleVisibility = () => play();

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    play();
  });
  let resizeTimer = 0;
  const resizeObserver = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(setup, 150);
  });

  // Слова рисуются шрифтом заголовков: ждём его, иначе точки сложатся в запасной шрифт.
  const fontReady = document.fonts?.load ? document.fonts.load(`600 64px ${font}`).catch(() => null) : Promise.resolve();
  fontReady.then(() => {
    if (stopped) return;
    setup();
    observer.observe(canvas);
    resizeObserver.observe(canvas);
    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointercancel', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibility);
  });

  return () => {
    stopped = true;
    observer.disconnect();
    resizeObserver.disconnect();
    window.clearTimeout(resizeTimer);
    if (frame) window.cancelAnimationFrame(frame);
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerleave', handlePointerLeave);
    canvas.removeEventListener('pointercancel', handlePointerLeave);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

import { useEffect, useRef } from 'react';
import { canAnimateOnView } from '../lib/motion.js';
import { startParticleWords } from '../lib/particles.js';

const routeWords = ['ЯПОНИЯ', 'БАРНАУЛ', 'ВСЯ РОССИЯ'];

// Нужна для тёмной панели «Авто из Японии и поставки для разборов»: точки складываются в слова маршрута
// «Япония → Барнаул → вся Россия» и разлетаются от курсора или пальца. Это оформление: маршрут подписан
// текстом на первом экране, поэтому canvas скрыт от программ чтения с экрана. При «Уменьшить движение»
// блок не показывается (_particle-route.scss).
export function ParticleRoute() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !canAnimateOnView() || typeof ResizeObserver === 'undefined') return undefined;
    return startParticleWords(canvasRef.current, { words: routeWords });
  }, []);

  return (
    <div className="particle-route" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

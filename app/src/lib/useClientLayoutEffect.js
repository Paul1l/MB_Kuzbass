import { useEffect, useLayoutEffect } from 'react';

// Главная приходит готовым HTML (scripts/prerender-home.mjs), и первый рендер в браузере должен совпасть с ним.
// То, что зависит от браузера (cookie, «Уменьшить движение»), читается здесь — сразу после гидратации и до
// первого кадра: main.jsx гидратирует синхронно, а скрипт придерживает отрисовку (renderBlockingEntry).
// При сборке HTML эффектов нет, поэтому на сервере вместо useLayoutEffect стоит пустой useEffect без предупреждения.
export const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

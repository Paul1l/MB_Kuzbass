import { useEffect, useRef } from 'react';
import { initScrollShift } from '../lib/motion.js';

const topRow = 'Контрактные запчасти • Авто из Японии • ';
const bottomRow = 'MB Kuzbass • Барнаул • ';

// Нужна для полосы с огромными словами перед контактами (как «BORING» и «ARGON 18» из примеров владельца):
// две строки едут в разные стороны при прокрутке. Это оформление: те же слова есть в заголовках, поэтому
// полоса скрыта от программ чтения с экрана.
export function MegaType() {
  const ref = useRef(null);
  useEffect(() => initScrollShift(ref.current), []);

  return (
    <div className="mega-type" ref={ref} aria-hidden="true">
      <div className="mega-type__row">{topRow.repeat(3)}</div>
      <div className="mega-type__row mega-type__row--outline">{bottomRow.repeat(5)}</div>
    </div>
  );
}

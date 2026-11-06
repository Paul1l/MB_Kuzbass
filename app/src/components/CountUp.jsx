import { useRef, useState } from 'react';
import { useClientLayoutEffect } from '../lib/useClientLayoutEffect.js';
import { canAnimateOnView } from '../lib/motion.js';

// Разбирает строку вида «4.8» или «8 000+»: текст до и после числа, число, знаки после запятой и разделители,
// чтобы промежуточные значения выглядели так же, как итоговое.
function parseNumber(text) {
  const match = text.match(/^(\D*)(\d[\d\s\u00a0.,]*\d|\d)(.*)$/);
  if (!match) return null;
  const [, prefix, numberText, suffix] = match;
  const decimalMatch = numberText.match(/([.,])(\d{1,2})$/);
  const decimals = decimalMatch ? decimalMatch[2].length : 0;
  const decimalSeparator = decimalMatch ? decimalMatch[1] : '';
  const integerText = decimalMatch ? numberText.slice(0, -decimalMatch[0].length) : numberText;
  const groupSeparator = integerText.match(/[\s\u00a0.,]/)?.[0] ?? '';
  const target = Number(`${integerText.replace(/\D/g, '')}.${decimalMatch ? decimalMatch[2] : '0'}`);
  return { prefix, suffix, decimals, decimalSeparator, groupSeparator, target };
}

function formatNumber(value, parsed) {
  const [integerPart, fractionPart] = value.toFixed(parsed.decimals).split('.');
  const grouped = parsed.groupSeparator
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, parsed.groupSeparator)
    : integerPart;
  return `${parsed.prefix}${grouped}${fractionPart ? parsed.decimalSeparator + fractionPart : ''}${parsed.suffix}`;
}

// Число «набегает» от нуля, когда попадает на экран (как «number ticker»). Ширину держит невидимая копия
// итогового значения, поэтому соседний текст не прыгает; программы чтения с экрана сразу получают итог.
export function CountUp({ value, duration = 1400 }) {
  const text = String(value);
  const ref = useRef(null);
  // В готовом HTML главной — итоговое число (его видят поисковики и браузер без JavaScript). Ноль для
  // анимации ставится до первого кадра в браузере, поэтому итог не мелькает перед счётом.
  const [display, setDisplay] = useState(text);

  useClientLayoutEffect(() => {
    const parsed = parseNumber(text);
    const element = ref.current;
    if (!parsed || !element || !canAnimateOnView()) {
      setDisplay(text);
      return undefined;
    }

    setDisplay(formatNumber(0, parsed));

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - (1 - progress) ** 3;
          setDisplay(progress < 1 ? formatNumber(parsed.target * eased, parsed) : text);
          if (progress < 1) frame = window.requestAnimationFrame(step);
        };
        frame = window.requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [text, duration]);

  return (
    <span className="count-up" ref={ref}>
      <span className="count-up__sizer" aria-hidden="true">
        {text}
      </span>
      <span className="count-up__value" aria-hidden="true">
        {display}
      </span>
      <span className="visually-hidden">{text}</span>
    </span>
  );
}

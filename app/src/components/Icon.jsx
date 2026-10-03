// Контуры иконок 24×24. Рисуются линией текущего цвета текста.
const iconPaths = {
  phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  send: ['M21 4L3 11l7 2 2 7 9-16z', 'M10 13l4-3'],
  star: ['M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z'],
  layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
  pin: ['M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z', 'M14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z'],
  truck: [
    'M3 6h11v10H3z',
    'M14 9h4l3 3v4h-7',
    'M8.8 17.5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0z',
    'M19.3 17.5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0z',
  ],
  tag: ['M3 12V4h8l10 10-8 8z', 'M9 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z'],
  search: ['M17.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z', 'M20 20l-4.2-4.2'],
  camera: ['M4 7h3l2-2h6l2 2h3v12H4z', 'M15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z'],
  shield: ['M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z', 'M8.5 12l2.5 2.5 4.5-5'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  close: ['M6 6l12 12M18 6L6 18'],
};

// Нужна для иконок в интерфейсе. Иконка декоративная: смысл передает подпись рядом.
export function Icon({ name, size = 20 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}

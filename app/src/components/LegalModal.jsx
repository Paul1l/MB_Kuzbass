import { useEffect, useRef } from 'react';

// Нужна для правовой информации. Показывает выбранный документ поверх страницы, не растягивая основной лендинг.
export function LegalModal({ doc, onClose }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);

  // Блокирует прокрутку страницы, удерживает фокус внутри документа и возвращает его инициатору после закрытия.
  useEffect(() => {
    if (!doc) return undefined;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    function keepFocusInside(event) {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusableElements = Array.from(
        panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', keepFocusInside);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keepFocusInside);
      openerRef.current?.focus();
    };
  }, [doc]);

  if (!doc) return null;

  return (
    <div className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title">
      <button className="legal-modal__backdrop" type="button" aria-label="Закрыть документ" onClick={onClose} />
      <article className="legal-modal__panel" ref={panelRef} tabIndex="-1">
        <div className="legal-modal__head">
          <div>
            <p>Правовая информация</p>
            <h2 id="legal-title">{doc.title}</h2>
          </div>
          <button className="legal-modal__close" type="button" onClick={onClose} ref={closeButtonRef}>
            Закрыть
          </button>
        </div>
        <p className="legal-modal__lead">{doc.lead}</p>
        <div className="legal-modal__body">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

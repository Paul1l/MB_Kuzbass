// Нужна для footer-документов. Открывает выбранный юридический документ в модальном окне без перезагрузки страницы.
export function LegalLink({ doc, onOpen }) {
  if (!doc) return null;

  return (
    <a
      href={`#${doc.id}`}
      onClick={(event) => {
        event.preventDefault();
        if (typeof window !== 'undefined' && window.location.hash !== `#${doc.id}`) {
          window.history.pushState(null, '', `#${doc.id}`);
        }
        onOpen(doc.id);
      }}
    >
      {doc.footerLabel}
    </a>
  );
}

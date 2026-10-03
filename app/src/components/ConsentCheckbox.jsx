import { legalDocs } from '../data.js';
import { LegalLink } from './LegalLink.jsx';

// Нужна для обеих форм первого экрана: отдельное согласие на обработку ПДн со ссылкой на документ.
export function ConsentCheckbox({ id, onOpenLegal }) {
  return (
    <label className="privacy-check" htmlFor={id}>
      <input id={id} type="checkbox" name="agree" required />
      <span>
        Даю отдельное согласие на обработку персональных данных на условиях документа{' '}
        <LegalLink doc={legalDocs.find((doc) => doc.id === 'consent')} onOpen={onOpenLegal} />.
      </span>
    </label>
  );
}

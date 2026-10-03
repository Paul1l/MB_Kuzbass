import { contact } from '../data.js';

// Нужна под формой заявки: что произошло после нажатия и запасная ссылка, если вкладка не открылась.
export function FormStatus({ status }) {
  if (!status) return null;

  return (
    <p className="form-status">
      {status === 'copied'
        ? 'Текст заявки скопирован. Вставьте его в чат Telegram и отправьте.'
        : 'Текст не скопировался. Напишите в чате Telegram модель, VIN и что нужно.'}{' '}
      <a href={contact.telegram} target="_blank" rel="noopener noreferrer">
        Чат не открылся? Открыть @MB_Kuzbass
      </a>
    </p>
  );
}

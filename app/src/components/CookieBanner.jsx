import { useState } from 'react';

// Показывает отдельный выбор для обязательных cookie и необязательной аналитики.
export function CookieBanner({ preferences, initialSettings = false, onSave, onClose, onOpenDocument }) {
  const [showSettings, setShowSettings] = useState(initialSettings);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(Boolean(preferences?.analytics));

  if (showSettings) {
    return (
      <div className="cookie-banner" role="region" aria-labelledby="cookie-settings-title">
        <div className="cookie-banner__copy">
          <h2 id="cookie-settings-title">Настройки cookie</h2>
          <p>Вы можете изменить необязательные настройки в любое время через ссылку в подвале сайта.</p>
        </div>
        <div className="cookie-options">
          <label className="cookie-option">
            <input type="checkbox" checked disabled />
            <span>
              <strong>Необходимые</strong>
              <small>Запоминают выбранные настройки. Эти cookie нужны для работы интерфейса.</small>
            </span>
          </label>
          <label className="cookie-option">
            <input
              type="checkbox"
              checked={analyticsAllowed}
              onChange={(event) => setAnalyticsAllowed(event.target.checked)}
            />
            <span>
              <strong>Аналитика</strong>
              <small>Яндекс.Метрика помогает оценивать посещения и клики. Загружается только после согласия.</small>
            </span>
          </label>
        </div>
        <div className="cookie-banner__actions">
          <button className="button button--primary" type="button" onClick={() => onSave(analyticsAllowed)}>
            Сохранить выбор
          </button>
          {preferences && (
            <button className="button" type="button" onClick={onClose}>
              Отмена
            </button>
          )}
          <button className="button" type="button" onClick={() => onOpenDocument('cookies')}>
            Политика cookie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cookie-banner" role="region" aria-label="Выбор cookie">
      <div className="cookie-banner__copy">
        <h2>Управление cookie</h2>
        <p>
          Необходимые cookie запоминают ваш выбор. Яндекс.Метрика включится только после отдельного
          разрешения на аналитику. Рекламные технологии не подключены.
        </p>
      </div>
      <div className="cookie-banner__actions">
        <button className="button button--primary" type="button" onClick={() => onSave(true)}>
          Разрешить аналитику
        </button>
        <button className="button" type="button" onClick={() => onSave(false)}>
          Только необходимые
        </button>
        <button className="button" type="button" onClick={() => setShowSettings(true)}>
          Настроить
        </button>
        <button className="button" type="button" onClick={() => onOpenDocument('cookies')}>
          Подробнее
        </button>
      </div>
    </div>
  );
}

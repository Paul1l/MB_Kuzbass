// Настройка аналитики хранится отдельно от сборки. Пока counterId равен 0,
// внешние аналитические скрипты не загружаются даже после согласия пользователя.
window.MB_ANALYTICS_CONFIG = Object.freeze({
  provider: 'yandex-metrica',
  counterId: 0,
});

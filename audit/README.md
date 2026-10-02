# Аудит MB Kuzbass (mb-kuzbass.ru) — технический, SEO и продуктовый

Дата: 02.10.2026. Ветка: `claude/quirky-sagan-2c1jfk`. Проверенное состояние кода: коммит `a6abb98` (main).

**Статус: исследование завершено, код сайта не менялся.** Внедрение начинается только после утверждения плана (см. «Что нужно от владельца»).

> Не загружайте папку `audit/` на хостинг. Это внутренние материалы. Корень репозитория сейчас одновременно и исходники, и готовая сборка, поэтому при ручной загрузке «всего корня» папка попала бы на сайт (см. H-11).

## С чего начать

1. [00-executive-summary.md](00-executive-summary.md) — главное на 2 страницах.
2. [19-final-priority-table.md](19-final-priority-table.md) — обязательная итоговая таблица приоритетов.
3. [20-owner-questions-and-access.md](20-owner-questions-and-access.md) — без этих данных и доступов часть плана нельзя выполнить честно.

## Состав

| № | Файл | Что внутри |
|---|---|---|
| — | [01-technical-audit.md](01-technical-audit.md) | FIRST TASK: 24 пункта технического и продуктового аудита, A–H, карточки всех проблем |
| 1 | [00-executive-summary.md](00-executive-summary.md) | Executive SEO summary |
| 2 | [02-technical-seo-audit.md](02-technical-seo-audit.md) | Бизнес (фаза 1), гео-сигналы, индексация, статусы, структура, on-page, изображения, разметка |
| 3 | [03-wordstat-research.md](03-wordstat-research.md) | Методика Wordstat, статус данных, гео-исследование |
| 4 | [04-semantic-core.csv](04-semantic-core.csv) | Полное семантическое ядро-кандидат (частоты не проверены) |
| 5 | [05-keyword-clusters.md](05-keyword-clusters.md) | Кластеры по интенту, классификация интентов |
| 6 | [06-keyword-url-map.md](06-keyword-url-map.md) | Ключ → URL, решения KEEP / IMPROVE / CREATE и т. д. |
| 7 | [07-competitor-analysis.md](07-competitor-analysis.md) | Кандидаты в конкуренты, шаблон и гипотезы |
| 8 | [08-site-architecture.md](08-site-architecture.md) | Архитектура URL, SSG, товарное SEO, жизненный цикл товара |
| 9 | [09-on-page-plan.md](09-on-page-plan.md) | Title/Description/H1, коммерческие факторы |
| 10 | [10-local-seo-plan.md](10-local-seo-plan.md) | Яндекс Бизнес, 2ГИС, NAP, регион сайта |
| 11 | [11-content-plan.md](11-content-plan.md) | Структура ключевых страниц, информационный контент |
| 12 | [12-internal-linking.md](12-internal-linking.md) | Схема перелинковки |
| 13 | [13-cro-ux-audit.md](13-cro-ux-audit.md) | CRO/UX: проблема → доказательство → решение |
| 14 | [14-analytics-tracking-plan.md](14-analytics-tracking-plan.md) | Метрика, Вебмастер, цели, воронка |
| 15 | [15-performance-plan.md](15-performance-plan.md) | LCP/INP/CLS/TTFB, план ускорения |
| 16 | [16-backlink-authority-plan.md](16-backlink-authority-plan.md) | Ссылочный профиль и авторитет без спама |
| 17 | [17-development-tasks.md](17-development-tasks.md) | Задачи для разработки с критериями приёмки |
| 18 | [18-roadmap-30-60-90.md](18-roadmap-30-60-90.md) | План на 30 / 60 / 90 дней |
| — | [19-final-priority-table.md](19-final-priority-table.md) | Итоговая таблица и скоринг ([CSV](19-final-priority-table.csv)) |
| — | [20-owner-questions-and-access.md](20-owner-questions-and-access.md) | Вопросы владельцу и нужные доступы |
| — | [evidence/](evidence/) | Скриншоты, сводка Lighthouse, результаты рендеринга |

## Как проводилась проверка

- Полностью прочитан репозиторий: `app/src`, `app/scripts`, `catalog-products.json`, конфигурация хостинга, CI, документация.
- Свежая сборка `npm ci && npm run build`: хеши `index-6YMNVtV7.js` и `index-DBNwnNxq.css` совпали с файлами в корне, значит корень соответствует исходникам (кроме `.htaccess`, см. C-04).
- `npm run lint` — без ошибок. `npm audit` — 2 уязвимости уровня high в dev-зависимостях (см. H-01).
- Корень репозитория (= production-сборка) поднят локально и открыт в Chromium (Playwright): без JavaScript, на десктопе 1366×800 и на мобильном 390×844. Результаты: [evidence/render-evidence.json](evidence/render-evidence.json).
- Lighthouse 12.8.2 (mobile и desktop) по локальной копии: [evidence/lighthouse-summary.json](evidence/lighthouse-summary.json).
- GitHub API: история запусков Actions и статус GitHub Pages.
- Веб-поиск (англоязычная поисковая система, не Яндекс) — только для поиска кандидатов в конкуренты и публичных сведений о троттлинге Cloudflare в РФ.

## Важно: production ≠ репозиторий

Скриншот владельца от 02.10.2026 показывает на живом сайте H1 «Контрактные запчасти Mercedes-Benz и BMW в Барнауле» и другие тексты hero, которых нет ни в одной ветке репозитория. Аудит кода описывает состояние `main` (`a6abb98`); всё, что сказано о текстах и заголовках, нужно сверить со снимком production (см. C-06). Там же видно, что хостинг, вероятно, REG.RU, а не Спринтхост (H-15).

Параллельная невлитая ветка `claude/focused-gates-ld1ci1` (02.10.2026) уже содержит исправления C-04, H-01 и частично H-11, M-08. Отмечено в карточках проблем.

## Ограничения: DATA NOT VERIFIED

Сетевая политика окружения, в котором выполнялся аудит, блокировала доступ к `mb-kuzbass.ru`, `wordstat.yandex.ru`, `yandex.ru`, `google.com`, `2gis.ru`, `baza.drom.ru` (ответ прокси 403 / EGRESS_BLOCKED). Поэтому **не проверены и нигде не выдуманы**:

| Данные | Статус |
|---|---|
| Частоты Wordstat | DATA NOT VERIFIED |
| Позиции в Яндексе и Google | DATA NOT VERIFIED |
| Яндекс Вебмастер, Google Search Console | DATA NOT VERIFIED |
| Яндекс Метрика (трафик, конверсии, доля согласий) | DATA NOT VERIFIED |
| Живые HTTP-заголовки, коды ответов, редиректы, TTFB, сжатие на production | DATA NOT VERIFIED (проверено по конфигурации в репозитории) |
| Карточки Яндекс Бизнес, 2ГИС, Google Business Profile | DATA NOT VERIFIED (2ГИС: только данные, сохранённые в коде сайта) |
| Метрики конкурентов, ссылочный профиль | DATA NOT VERIFIED |
| Полевые Core Web Vitals (CrUX) | DATA NOT VERIFIED; есть только лабораторные замеры локальной копии |

Каждая оценка в документах помечена как гипотеза или как факт с указанием файла и строки. Чтобы снять ограничения, нужны доступы из [20-owner-questions-and-access.md](20-owner-questions-and-access.md) или окружение с открытым доступом к перечисленным доменам.

## Обозначения

- Критичность: **Critical / High / Medium / Low**.
- Приоритет задач: **P0** — критично, **P1** — высокий, **P2** — средний, **P3** — низкий.
- Сложность: **XS** — до 2 часов, **S** — до 1 дня, **M** — 2–5 дней, **L** — 1–3 недели, **XL** — больше 3 недель.
- ID проблем (`C-01`, `H-03`, `M-05`, `L-02`) едины для всех документов. Полные карточки — в [01-technical-audit.md](01-technical-audit.md).
- CSV-файлы сохранены в UTF-8 с BOM. Excel: «Данные → Из текста/CSV», разделитель — запятая. Google Таблицы: «Файл → Импорт».

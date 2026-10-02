# 6. Карта «ключ → URL» и решения по страницам (фаза 6)

Правило: **один кластер — одна основная страница**. Вариации с одинаковым интентом не получают отдельных страниц.

> Обновлено после проверки production 02.10.2026 ([21-production-check-2026-10-02.md](21-production-check-2026-10-02.md)). На сервере уже есть 7 статичных посадочных страниц. **Их адреса сохраняются**: работающие URL не меняются без анализа редиректов. Новые адреса предлагаются только для того, чего на сайте нет.

## Карта кластеров

| Кластер (из CSV) | Основная страница | Статус | Решение |
|---|---|---|---|
| NAV-BRAND | `/` | Есть | IMPROVE |
| BR-BOTH-LOCAL, USP | `/` | Есть; конфликтует с `/kontraktnye-zapchasti-barnaul/` (H-16) | IMPROVE: главная — бренд и общий кластер «запчасти Mercedes-Benz и BMW с японских доноров, Барнаул» |
| «контрактные запчасти (+ Барнаул)» из BR-BOTH-LOCAL | `/kontraktnye-zapchasti-barnaul/` | Есть (production) | KEEP + IMPROVE; развести с главной (H-16) |
| BR-MB, BR-MB-LOCAL | `/zapchasti-mercedes-barnaul/` | Есть (production) | KEEP + IMPROVE: модели в наличии, товары, ссылки |
| BR-BMW, BR-BMW-LOCAL | `/zapchasti-bmw-barnaul/` | Есть (production) | KEEP + IMPROVE |
| CAT-ENG, ENG-MODEL, CAT-AKPP | `/dvigateli-akpp-mercedes-bmw-barnaul/` | Есть (production) | KEEP + IMPROVE; разделить на двигатели и АКПП, только если Wordstat покажет разные кластеры |
| CAT-OPTICS, CAT-BODY, CAT-INTERIOR | `/kuzovnye-detali-optika-mercedes-bmw-barnaul/` | Есть, но без входящих внутренних ссылок (H-17) | KEEP + IMPROVE + ссылки |
| CAT-CHASSIS | `/diski-podveska-tormoza-mercedes-bmw-barnaul/` | Нет | CREATE NEW PAGE (в стиле существующих адресов) |
| AUCTION | `/avtomobili-iz-yaponii-barnaul/` | Есть (production) | KEEP + IMPROVE |
| B2B | `/postavki-dlya-avtorazborov-barnaul/` | Есть (production) | KEEP + IMPROVE |
| ENG-*, AKPP-*, OPT-*, BODY-*, CH-*, INT-*, PART-NUMBER | `/zapchasti/<slug>-<id>/` (страница товара) | Нет: 30 карточек без URL на сайте, 8 123 объявления на Drom | CREATE NEW PAGE из выгрузки наличия (H-06, M-14) |
| Код агрегата (ENG-M272 и др.) при регулярном наличии | `/dvigatel-mercedes-m272/` и аналоги | Нет | Условно: только при регулярном наличии нескольких единиц и подтверждённом спросе |
| MODEL-* | `/zapchasti-mercedes-w211/`, `/zapchasti-bmw-e83/` и аналоги | Нет | Условно: спрос + ≥ 5 позиций или постоянные доноры. По выборке Drom кандидаты — W211, W203, X3 E83, E39, W204, W207 |
| VIN | `/` (блок «Подбор по VIN») | Нет | IMPROVE; отдельная страница — только при отдельном спросе |
| DELIVERY | `/dostavka-i-oplata/` | Модальное окно `#order-terms` | CREATE NEW PAGE (только реальные условия; «доставка до ТК 500 ₽» — подтвердить) |
| TRUST (гарантия) | `/garantiya-i-vozvrat/` | Нет | CREATE NEW PAGE, только если гарантия реально предоставляется |
| INFO-* | `/stati/<slug>/` | Нет | Условно, при подтверждённом спросе |
| NOT-IN-CATALOG | Страницы товаров из выгрузки + категории | На Drom такие позиции есть (двери, бамперы, электрика и др.) | Появятся с импортом наличия |
| GEO-RESEARCH | Алтайский край → те же страницы, что Барнаул; другие города → `/dostavka-i-oplata/` | — | Отдельных гео-страниц не создавать: точек вне Барнаула нет |

## Решения по существующим адресам

| Адрес | Что это | Решение | Детали |
|---|---|---|---|
| `/` | Главная (SPA) | KEEP + IMPROVE | Синхронизировать репозиторий с production (C-06); развести с `/kontraktnye-zapchasti-barnaul/` (H-16); ссылки на все посадочные (H-17); SSG |
| `/kontraktnye-zapchasti-barnaul/` | Посадочная | KEEP + IMPROVE | Отдельный интент от главной; если после Wordstat окажется дублем — MERGE (301 на главную) |
| `/zapchasti-mercedes-barnaul/`, `/zapchasti-bmw-barnaul/` | Посадочные брендов | KEEP + IMPROVE | Товары и модели в наличии, перелинковка |
| `/dvigateli-akpp-mercedes-bmw-barnaul/`, `/kuzovnye-detali-optika-mercedes-bmw-barnaul/` | Посадочные категорий | KEEP + IMPROVE | Товары, ссылки, CTA на `@MB_Kuzbass` |
| `/avtomobili-iz-yaponii-barnaul/`, `/postavki-dlya-avtorazborov-barnaul/` | Посадочные направлений | KEEP + IMPROVE | Реальная схема работы и кейсы |
| Посадочные без слэша | 301 через `http://` | IMPROVE | Один 301 сразу на `https://…/` (M-16) |
| `#catalog/engines`, `#catalog/transmission`, `#catalog/optics`, `#catalog/body`, `#catalog/interior`, `#catalog/chassis` | Хеш-состояния SPA | REDIRECT скриптом | `engines`, `transmission` → `/dvigateli-akpp-mercedes-bmw-barnaul/`; `optics`, `body`, `interior` → `/kuzovnye-detali-optika-mercedes-bmw-barnaul/`; `chassis` → новая `/diski-podveska-tormoza-mercedes-bmw-barnaul/` |
| `/#catalog` | Ссылка «Каталог» с посадочных | IMPROVE | Сейчас открывает главную наверху (H-18) |
| `#requisites`, `#privacy`, `#consent`, `#agreement`, `#order-terms`, `#cookies` | Модальные окна документов | CREATE NEW PAGE | `/rekvizity/`, `/dokumenty/politika-konfidencialnosti/`, `/dokumenty/soglasie/`, `/dokumenty/soglashenie/`, `/dostavka-i-oplata/`, `/dokumenty/cookie/` |
| `#about`, `#directions`, `#vehicles`, `#reviews`, `#contacts`, `#request` | Якоря главной | KEEP | Контакты дополнительно — `/kontakty/` |
| `/index.html` | Копия главной (200) | REDIRECT 301 → `/` | — |
| `/404.html`, `/500.html`, `/503.html`, `/offline.html` | Служебные | KEEP (`noindex`) | Абсолютные пути (M-04) |
| `/yandex_069c92c8aa409d72.html` | Подтверждение Вебмастера | KEEP | — |
| `http://`, `www.` | Дубли хоста | KEEP 301 (работает на production) | Перенести правило в исходники (C-04) |
| `paul1l.github.io/MB_Kuzbass/*` | Копия на GitHub Pages | DELETE (отключить Pages) | C-03, подтверждено |

## Правила против каннибализации

1. **Главная** — бренд и общий кластер обоих брендов. Не повторяет H1 и Title посадочных.
2. **`/kontraktnye-zapchasti-barnaul/`** — кластер «контрактные запчасти (+ Барнаул)»; если он совпадёт с кластером главной по выдаче — объединить.
3. **Бренд-страницы** (`/zapchasti-mercedes-barnaul/`, `/zapchasti-bmw-barnaul/`) — «разборка / б/у / контрактные запчасти {бренд}». Категорийные запросы с брендом ведут на категорию, пока нет отдельной страницы «бренд × категория».
4. **Категории** — «{категория} (+ бренд)». Страница «бренд × категория» — только при отдельном кластере в выдаче и наличии нескольких позиций.
5. **Товар** — OEM-номер, код агрегата, «деталь + кузов».
6. **Страница модели** — только при выполнении всех условий из [08-site-architecture.md](08-site-architecture.md#когда-создаётся-страница-модели-или-кузова).
7. **Статья** никогда не оптимизируется под коммерческий запрос.
8. Дубли интентов — MERGE и 301 со слабой страницы на сильную.

## Перенаправление старых хеш-ссылок

Хеш не передаётся на сервер, поэтому серверный 301 невозможен. Решение: при загрузке главной скрипт сопоставляет `#catalog/<старый slug>` с новым адресом (таблица выше) и выполняет `location.replace()`; для документов — так же. Старые ссылки в Telegram, VK, Drom и 2ГИС, ведущие на хеши, заменить вручную.

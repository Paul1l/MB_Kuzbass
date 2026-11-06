# 35. Технические правки после правовой проверки — 06.11.2026

**Задача:** закрыть технические замечания правовой проверки (152-ФЗ, cookie, права потребителей), не трогая формулировки документов.

Ветка `fix/rating-and-legal-2026-11` от `main` = `1d9fd3f` (это то, что сейчас на сервере). В ветке есть и коммит координатора `e6e7af0`: запасной рейтинг 2ГИС 4.9, 36 оценок, 22 отзыва. Он попадает в эту же сборку. На живом сайте ничего не менялось.

**Чего сознательно нет.** Новые тексты юриста — согласие на аналитику, новая редакция политики, условия заказа — с местами «[ВНЕСТИ…]» сначала утверждают владелец и юрист. Их здесь нет. Версия согласия на cookie (`2026-08-03`) не менялась, повторно спрашивать посетителей не нужно. Формулировки документов в `data.js` не менялись; поменялись только подписи двух ссылок, см. п. 4.

## Что сделано

| № | Замечание | Что сделано |
|---|---|---|
| 1 | **При отзыве согласия в браузере оставался идентификатор Метрики.** Cookie `_ym_*` удалялись, а записи в хранилище браузера (`_ym_uid`, `_ym111089917_lsid`, `_ym_synced`, `_ym_retryReqs`) оставались. | При отзыве согласия на главной и на статичных страницах теперь удаляются все записи с началом `_ym` из обоих хранилищ браузера (`localStorage` и `sessionStorage`). Чужие записи не трогаются. Если хранилище в браузере запрещено, удалять нечего, и ошибки нет. Выбор посетителя (cookie `mb_privacy_preferences`) остаётся. |
| 2 | **Документы открывались только с JavaScript.** Политика, согласие, cookie, соглашение, условия заказа и реквизиты были доступны только окном на главной; ссылки с посадочных вели на `/#privacy`. | Каждый документ теперь и отдельная страница: `/dokumenty/rekvizity/`, `/dokumenty/politika/`, `/dokumenty/soglasie/`, `/dokumenty/soglashenie/`, `/dokumenty/usloviya-zakaza/`, `/dokumenty/cookie/`. Тексты берутся при сборке из тех же `legalDocs`, что окна на главной: тест сверяет страницу и окно по каждому документу — заголовок, вводный абзац и все разделы совпадают. Страницы — в стиле посадочных, с той же шапкой, подвалом, плашкой cookie и каноническим адресом. Подвалы главной, 7 посадочных, 37 страниц каталога и самих документов ведут на эти страницы. Старые адреса `/#privacy` и т. п. и ссылки в формах заявки по-прежнему открывают окно на главной: из формы посетитель не уходит со страницы. |
| 3 | **В подвале статичных страниц было только ФИО ИП.** | В подвале всех 50 статичных страниц (7 посадочных, 37 каталога, 6 документов) теперь ИНН 420211367957 и ОГРНИП 323420500092541, как на главной, и ссылка «Реквизиты» на страницу реквизитов. |
| 4 | **Разные подписи одной ссылки.** На главной — «Политика конфиденциальности», на посадочных и в самом документе — «Политика обработки персональных данных»; ссылка на cookie подписана просто «Cookie». | Везде «Политика обработки персональных данных», как называется документ, и «Файлы cookie». Поменялись только подписи ссылок. |

**Индексация страниц документов.** Они помечены `noindex, follow` и не входят в `sitemap.xml`: это документы для посетителей, а не страницы под поисковые запросы. Без JavaScript они доступны всем, ссылки с них поисковик учитывает. Если владелец или юрист захотят, чтобы политика находилась в поиске, достаточно убрать `noindex` в `scripts/generate-legal-pages.mjs`.

**Как устроено.** Адреса документов — в `app/src/legalPaths.js`, страницы собирает `app/scripts/generate-legal-pages.mjs`. Подвал страниц каталога и документов копируется из посадочной, поэтому подвал правится в одном виде — в 7 посадочных. Версии стилей и скрипта статичных страниц подняты до `?v=20261106-2`, чтобы браузеры не взяли старые файлы из кеша.

**Проверка сборки** теперь останавливает её, если:
- нет страницы какого-то документа, она пустая, без заголовка документа или без канонического адреса;
- страница документа попала в `sitemap.xml`;
- в подвале любой статичной страницы нет ИНН, ОГРНИП или ссылки на какой-то документ с нужной подписью, либо подвал снова ссылается на окно `/#…`;
- в подвале главной нет ссылки на страницу какого-то документа.

## Проверки

- `npm run check` — без ошибок: линтер, сборка с проверкой, `npm audit` (4 уязвимости уровня moderate в ESLint — инструмент разработки, на сайт не попадает).
- Автотесты: **94 из 94** прошли, Chromium, компьютер 1440 px и iPhone 13. Новые и изменённые:
  - отзыв согласия на посадочной и на главной удаляет cookie Метрики, в том числе на домене сайта, и все записи `_ym*` из обоих хранилищ браузера; чужая запись остаётся, cookie выбора — тоже. На прошлой сборке тест падал;
  - для каждого из 6 документов страница `/dokumenty/…/` открывается (ответ 200) и её текст совпадает с окном документа на главной;
  - без JavaScript: в подвале посадочной — ИНН, ОГРНИП и ссылки на все документы, ссылка на политику открывает страницу политики; подвал главной ведёт на страницы документов;
  - `/#privacy` по-прежнему открывает окно документа;
  - в подвале посадочных — ссылки на страницы документов; «Подробнее» в плашке cookie ведёт на `/dokumenty/cookie/`.
- Глазами: страница политики и подвал посадочной на компьютере (1440 px) и iPhone 13 — оформление как у посадочных, горизонтальной прокрутки нет.

## Что за владельцем и юристом: DATA NOT VERIFIED

1. Новые тексты из правовой проверки (согласие на аналитику, новая редакция политики и cookie, условия заказа, почта для обращений) — после утверждения. При их внедрении нужно поднять версию согласия и дату редакции.
2. Кроме `_ym*`, правовая проверка предлагала удалять и запись `zz`. По заданию удаляются только записи с началом `_ym`. Использует ли текущий счётчик `zz`, отсюда не проверить. Если да — это одна строка в двух файлах.

## Загрузка на Спринтхост

Список составлен относительно того, что на сервере сейчас (`1d9fd3f`). Все файлы собраны в архив **`mb-kuzbass-upload-2026-11-06-legal.zip`** (лежит в `C:\Users\Asus\Desktop\WorkSpace\`): 54 файлов, пути — как в `public_html`, файлы взяты из коммита (не из рабочей папки), права в архиве — `644`. Распаковать в `public_html` или загрузить те же файлы из корня репозитория, **в двоичном режиме**, по порядку:

1. Новые: `assets/index-BPVV_neQ.js` и папка `dokumenty` (6 файлов `index.html`).
2. `seo-pages.css` и `seo-pages.js` в корне.
3. `index.html` в семи папках посадочных.
4. Папка `katalog` целиком — 37 файлов `index.html` (новый подвал и версии стилей и скрипта).
5. `index.html` в корне — последним: он ссылается на новый скрипт из п. 1.

Содержимое архива (54 файлов):

- `assets/index-BPVV_neQ.js`
- `avtomobili-iz-yaponii-barnaul/index.html`
- `dokumenty/cookie/index.html`
- `dokumenty/politika/index.html`
- `dokumenty/rekvizity/index.html`
- `dokumenty/soglashenie/index.html`
- `dokumenty/soglasie/index.html`
- `dokumenty/usloviya-zakaza/index.html`
- `dvigateli-akpp-mercedes-bmw-barnaul/index.html`
- `index.html`
- `kontraktnye-zapchasti-barnaul/index.html`
- `kuzovnye-detali-optika-mercedes-bmw-barnaul/index.html`
- `postavki-dlya-avtorazborov-barnaul/index.html`
- `seo-pages.css`
- `seo-pages.js`
- `zapchasti-bmw-barnaul/index.html`
- `zapchasti-mercedes-barnaul/index.html`

и 37 страниц каталога:

- `katalog/akpp/akpp-bmw-525i/index.html`
- `katalog/akpp/akpp-mercedes-benz-e-class-2009/index.html`
- `katalog/akpp/akpp-zf-6hp26-bmw-550i/index.html`
- `katalog/akpp/index.html`
- `katalog/diski-podveska-tormoza/balka-zadney-podveski-bmw-e39-525i/index.html`
- `katalog/diski-podveska-tormoza/index.html`
- `katalog/diski-podveska-tormoza/komplekt-diskov-bmw-e39-525i/index.html`
- `katalog/diski-podveska-tormoza/komplekt-diskov-mercedes-benz-w204/index.html`
- `katalog/diski-podveska-tormoza/komplekt-diskov-mercedes-benz-w211/index.html`
- `katalog/diski-podveska-tormoza/komplekt-koles-bmw-e60-550i/index.html`
- `katalog/diski-podveska-tormoza/perednie-tormoznye-diski-mercedes-benz-w211-e300/index.html`
- `katalog/diski-podveska-tormoza/rychagi-zadney-podveski-mercedes-benz-w203/index.html`
- `katalog/diski-podveska-tormoza/rychagi-zadney-podveski-mercedes-benz-w211/index.html`
- `katalog/diski-podveska-tormoza/tormoznye-diski-mercedes-benz-w221-s500/index.html`
- `katalog/dvigateli/dvigatel-bmw-e39-m54/index.html`
- `katalog/dvigateli/dvigatel-bmw-e60-n62/index.html`
- `katalog/dvigateli/dvigatel-bmw-x3-n52/index.html`
- `katalog/dvigateli/dvigatel-mercedes-benz-c203-m111/index.html`
- `katalog/dvigateli/dvigatel-mercedes-benz-c203-m271/index.html`
- `katalog/dvigateli/dvigatel-mercedes-benz-e211-m272/index.html`
- `katalog/dvigateli/dvigatel-mercedes-benz-w163-m112/index.html`
- `katalog/dvigateli/index.html`
- `katalog/index.html`
- `katalog/kuzov/index.html`
- `katalog/kuzov/kuzov-mercedes-benz-c-class-w204/index.html`
- `katalog/kuzov/perednie-porogi-kuzova-mercedes-benz-w203/index.html`
- `katalog/kuzov/porogi-kuzova-v-assortimente/index.html`
- `katalog/optika/index.html`
- `katalog/optika/komplekt-ksenonovykh-far-mercedes-benz-c-class-2013/index.html`
- `katalog/optika/komplekt-perednikh-far-bmw-550i-2006/index.html`
- `katalog/optika/komplekt-perednikh-far-mercedes-benz-w212/index.html`
- `katalog/optika/komplekt-zadnikh-fonarey-bmw-e60-550i/index.html`
- `katalog/optika/komplekt-zadnikh-fonarey-mercedes-benz-w207/index.html`
- `katalog/optika/komplekt-zadnikh-fonarey-mercedes-benz-w211/index.html`
- `katalog/optika/ksenonovaya-fara-mercedes-benz-e-class-2007/index.html`
- `katalog/salon/index.html`
- `katalog/salon/komplekt-sideniy-bmw-550i/index.html`

**Удалить с сервера после проверки** (в архиве этого нет):

- `assets/index-BXI3tja6.js`

Не менялись и не загружаются: `assets/index-DgSYUKYr.css`, `analytics-config.js`, `.htaccess`, `sitemap.xml`, `robots.txt`, `sw.js`, картинки и шрифты. Не загружать `app/`, `audit/`, `docs/`, `.github/`, `screenshots/` и `.md`-файлы.

### Проверка после выкладки

- Без JavaScript открывается политика: `curl -s https://mb-kuzbass.ru/dokumenty/politika/ | grep -o '<h1>[^<]*</h1>'` — `<h1>Политика обработки персональных данных</h1>`. Так же для `rekvizity`, `soglasie`, `soglashenie`, `usloviya-zakaza`, `cookie`.
- В подвале посадочной реквизиты и ссылка на политику: `curl -s https://mb-kuzbass.ru/zapchasti-bmw-barnaul/ | grep -c 'ОГРНИП 323420500092541'` — `1`; `grep -c 'href="/dokumenty/politika/"'` — `1`.
- `https://mb-kuzbass.ru/dokumenty/politika` (без слэша) одним переходом открывает адрес со слэшем.
- На главной в подвале «Политика обработки персональных данных» открывает страницу `/dokumenty/politika/`; `https://mb-kuzbass.ru/#privacy` по-прежнему открывает окно документа; ссылка «Согласие на обработку ПДн» в форме заявки открывает окно.
- Отзыв согласия: в инструментах разработчика после «Разрешить аналитику» и перезагрузки видны cookie `_ym_uid` и записи `_ym…` в «Приложение → Local storage». После «Настройки cookie» → снять «Аналитика» → «Сохранить выбор» не остаётся ни cookie `_ym…`, ни записей `_ym…`; `mb_privacy_preferences` остаётся.
- Рейтинг 2ГИС на главной — 4.9 (36 оценок, 22 отзыва), если онлайн-рейтинг не настроен.

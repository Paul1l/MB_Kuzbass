# 6. Карта «ключ → URL» и решения по страницам (фаза 6)

Правило: **один кластер — одна основная страница**. Вариации с одинаковым интентом не получают отдельных страниц. URL — предложение; окончательный список утверждается после Wordstat и проверки наличия.

## Карта кластеров

| Кластер (из CSV) | Основная страница | Сейчас | Решение |
|---|---|---|---|
| NAV-BRAND | `/` | `/` | IMPROVE |
| BR-BOTH-LOCAL, USP | `/` | `/` | IMPROVE: Title/H1/текст под общий кластер «запчасти Mercedes-Benz и BMW, Барнаул» |
| BR-MB, BR-MB-LOCAL | `/mercedes/` | нет | CREATE NEW PAGE |
| BR-BMW, BR-BMW-LOCAL | `/bmw/` | нет | CREATE NEW PAGE |
| CAT-ENG, ENG-MODEL | `/katalog/dvigateli/` | `#catalog/engines` (не индексируется) | CREATE NEW PAGE (реальный URL), хеш → перенаправление скриптом |
| ENG-M111 … ENG-N62 | `/katalog/dvigateli/<товар>/` | карточка без URL | CREATE NEW PAGE (товар). Страница кода `/katalog/dvigateli/m272/` — только при регулярном наличии и спросе |
| CAT-AKPP | `/katalog/akpp/` | `#catalog/transmission` | CREATE NEW PAGE |
| AKPP-6HP26, AKPP-E39, AKPP-ECLASS2009 | `/katalog/akpp/<товар>/` | карточка без URL | CREATE NEW PAGE (товар) |
| CAT-OPTICS | `/katalog/optika/` | `#catalog/optics` | CREATE NEW PAGE |
| OPT-* | `/katalog/optika/<товар>/` | карточка без URL | CREATE NEW PAGE (товар) |
| CAT-BODY | `/katalog/kuzov/` | `#catalog/body` | CREATE NEW PAGE |
| BODY-* | `/katalog/kuzov/<товар>/` | карточка без URL | CREATE NEW PAGE (товар) |
| CAT-CHASSIS | `/katalog/podveska-tormoza-diski/` | `#catalog/chassis` | CREATE NEW PAGE; разделить на «Диски и колёса» и «Подвеска и тормоза» только если Wordstat покажет разные кластеры |
| CH-* | `/katalog/podveska-tormoza-diski/<товар>/` | карточка без URL | CREATE NEW PAGE (товар) |
| CAT-INTERIOR, INT-E60 | `/katalog/salon/`, `/katalog/salon/<товар>/` | `#catalog/interior` | CREATE NEW PAGE; категория с 1 позицией — `noindex, follow` до появления ≥ 3–5 позиций |
| MODEL-* | `/mercedes/<кузов>/`, `/bmw/<кузов>/` | нет | **Условно.** До выполнения условий кластер обслуживают бренд-страница и страницы товаров |
| AUCTION | `/avto-iz-yaponii/` | блок «Направления» на `/` | CREATE NEW PAGE |
| B2B | `/postavki-dlya-avtorazborov/` | блок «Направления» на `/` | CREATE NEW PAGE |
| VIN | `/` (блок «Подбор по VIN») | форма без поля VIN | IMPROVE; отдельная страница `/podbor-po-vin/` — только при отдельном спросе |
| DELIVERY | `/dostavka-i-oplata/` | модальное окно `#order-terms` | CREATE NEW PAGE (только реальные условия) |
| TRUST (гарантия) | `/garantiya-i-vozvrat/` | нет | CREATE NEW PAGE, **только если гарантия реально предоставляется** |
| INFO-* | `/stati/<slug>/` | нет | Условно, при подтверждённом спросе |
| NOT-IN-CATALOG | — | — | Не создавать до появления ассортимента |
| GEO-RESEARCH | Алтайский край → те же страницы, что Барнаул; Кемерово, Новокузнецк, Кузбасс, Новосибирск → `/dostavka-i-oplata/` (упоминание, если доставка реально регулярная) | — | Не создавать отдельных гео-страниц: точек вне Барнаула нет (подтверждено владельцем) |
| PART-NUMBER | страницы товаров (поле OEM) | — | IMPROVE (данные от владельца) |

## Решения по существующим адресам

| Адрес | Что это | Решение | Детали |
|---|---|---|---|
| `https://mb-kuzbass.ru/` | Главная | KEEP + IMPROVE | Сначала синхронизировать с production (C-06); затем SSG, Title/H1 по данным, блок VIN, ссылки на категории |
| `#catalog/engines`, `#catalog/transmission`, `#catalog/chassis`, `#catalog/body`, `#catalog/optics`, `#catalog/interior` | Хеш-состояния SPA | CREATE NEW PAGE + перенаправление скриптом | Сервер не видит хеш, поэтому 301 невозможен; при загрузке старой ссылки скрипт выполняет `location.replace('/katalog/<категория>/')` |
| `#catalog` | Якорь блока | REDIRECT (скриптом) | На `/katalog/` |
| `#requisites`, `#privacy`, `#consent`, `#agreement`, `#order-terms`, `#cookies` | Модальные окна документов | CREATE NEW PAGE | `/rekvizity/`, `/dokumenty/politika-konfidencialnosti/`, `/dokumenty/soglasie/`, `/dokumenty/soglashenie/`, `/dostavka-i-oplata/`, `/dokumenty/cookie/`. Реквизиты и доставка — индексировать; юридические документы — можно оставить индексируемыми (вреда нет) или `noindex, follow` |
| `#about`, `#directions`, `#vehicles`, `#reviews`, `#contacts`, `#request` | Якоря секций | KEEP | Якоря внутри главной; контакты дополнительно — `/kontakty/` |
| `/index.html` | Копия главной | REDIRECT 301 → `/` | После SSG |
| `/404.html`, `/500.html`, `/503.html`, `/offline.html` | Служебные | KEEP (`noindex`) | Абсолютные пути (M-04) |
| `/yandex_069c92c8aa409d72.html` | Подтверждение Вебмастера | KEEP | — |
| `http://`, `www.` | Дубли хоста | REDIRECT 301 | C-04 |
| `paul1l.github.io/MB_Kuzbass/*` | Копия на GitHub Pages | DELETE (отключить Pages) | C-03 |
| `/README.md`, `/docs/*`, `/app/*`, `/audit/*` (если загружены на хостинг) | Служебные файлы | DELETE с хостинга + 404/403 через `.htaccess` | H-11; частично сделано в ветке `claude/focused-gates-ld1ci1` |

Решения MERGE и NOINDEX для существующих индексируемых страниц не требуются: индексируемая страница сейчас одна.

## Правила против каннибализации

1. **Главная** отвечает за общий кластер обоих брендов и бренд компании. Она не оптимизируется под «разборка мерседес» и «разборка бмв» по отдельности — для этого есть `/mercedes/` и `/bmw/`.
2. **Бренд-страница** отвечает за «разборка / б/у / контрактные запчасти {бренд} (+ Барнаул)». Категорийные запросы с брендом («контрактный двигатель мерседес») ведут на категорию, а не на бренд, пока нет отдельной страницы «бренд × категория».
3. **Категория** отвечает за «{категория} (+ бренд)». Страница «бренд × категория» (`/mercedes/dvigateli/`) создаётся только при подтверждённом отдельном кластере в выдаче и наличии нескольких позиций.
4. **Товар** отвечает за код агрегата, модель + деталь, OEM-номер. Страница кода двигателя создаётся, только если по коду регулярно есть несколько единиц.
5. **Страница модели** создаётся, если выполнены все условия: подтверждённый спрос, не меньше 5 позиций или постоянный поток доноров этой модели, уникальный контент (что снимаем с донора, какие узлы совместимы, фото).
6. **Статья** никогда не оптимизируется под коммерческий запрос; она отвечает на вопрос и ведёт на товар, категорию или форму VIN.
7. При появлении дублирующих интентов — объединять (MERGE) и ставить 301 со слабой страницы на сильную.

## Перенаправление старых хеш-ссылок

Хеш не передаётся на сервер, поэтому серверный 301 невозможен. Решение:
- на главной при загрузке: если `location.hash` совпадает с `#catalog/<старый slug>` → `location.replace()` на новый путь; таблица соответствия `engines → dvigateli`, `transmission → akpp`, `chassis → podveska-tormoza-diski`, `body → kuzov`, `optics → optika`, `interior → salon`;
- для документов: `#privacy` → `/dokumenty/politika-konfidencialnosti/` и т. д.;
- старые ссылки в Telegram, VK, Drom и 2ГИС, ведущие на хеши, заменить на новые URL вручную.

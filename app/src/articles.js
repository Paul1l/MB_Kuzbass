// ЗАГЛУШКИ. Настоящие статьи пишет автор; его файл заменит этот целиком (та же схема, export const articles).
// Статьи с draft: true собираются только с ARTICLES_DRAFTS=1 (для проверки шаблона), не попадают в sitemap.xml,
// закрыты от индекса, а обычная сборка (npm run build) с ними останавливается — см. scripts/verify-build.mjs.
//
// Схема статьи (страница /stati/<slug>/ — scripts/generate-article-pages.mjs):
// {
//   slug, title (до 65 знаков, к нему дописывается « | MB Kuzbass»), description, h1,
//   datePublished: 'ГГГГ-ММ-ДД', dateModified: 'ГГГГ-ММ-ДД', lead,
//   sections: [{ heading, blocks: [{ type: 'p', text } | { type: 'ul', items: [...] } | { type: 'ol', items: [...] }] }],
//   faq: [{ q, a }] (0–4), related: [{ href, label }],
//   linkFrom: ['/katalog/dvigateli/', ...] (необязательно: где показать статью в блоке «Полезные статьи»;
//     основная карта — src/articleLinks.js)
// }
// Ссылка внутри текста — только [текст](/адрес/) на страницу этого сайта; всё остальное выводится как текст.

export const articles = [
  {
    draft: true,
    slug: 'chto-takoe-kontraktnyy-dvigatel',
    title: 'Заглушка: что такое контрактный двигатель',
    description: 'Заглушка для проверки шаблона статьи. Настоящий текст пришлёт автор.',
    h1: 'Заглушка: что такое контрактный двигатель',
    datePublished: '2026-11-06',
    dateModified: '2026-11-06',
    lead: 'Заглушка вводного абзаца. Ссылки в тексте: [контрактные запчасти](/kontraktnye-zapchasti-barnaul/) и [двигатели в каталоге](/katalog/dvigateli/).',
    sections: [
      {
        heading: 'Заглушка раздела с абзацем',
        blocks: [
          { type: 'p', text: 'Абзац-заглушка. Внешняя ссылка [не станет ссылкой](https://example.com/) и <b>разметка</b> выводится как текст.' },
          { type: 'ul', items: ['Пункт списка', 'Пункт со ссылкой на [каталог](/katalog/)'] },
        ],
      },
      {
        heading: 'Заглушка раздела с нумерованным списком',
        blocks: [{ type: 'ol', items: ['Первый шаг', 'Второй шаг', 'Третий шаг'] }],
      },
    ],
    faq: [
      { q: 'Заглушка вопроса 1?', a: 'Заглушка ответа со ссылкой на [двигатели и АКПП](/dvigateli-akpp-mercedes-bmw-barnaul/).' },
      { q: 'Заглушка вопроса 2?', a: 'Заглушка ответа 2.' },
    ],
    related: [
      { href: '/stati/podbor-zapchastey-po-vin/', label: 'Заглушка: подбор по VIN' },
      { href: '/katalog/dvigateli/', label: 'Контрактные двигатели в каталоге' },
    ],
  },
  {
    draft: true,
    slug: 'podbor-zapchastey-po-vin',
    title: 'Заглушка: подбор запчастей по VIN',
    description: 'Вторая заглушка: статья без частых вопросов.',
    h1: 'Заглушка: подбор запчастей по VIN',
    datePublished: '2026-11-05',
    dateModified: '2026-11-06',
    lead: 'Заглушка вводного абзаца второй статьи.',
    sections: [{ heading: 'Единственный раздел', blocks: [{ type: 'p', text: 'Текст-заглушка. [Главная](/) и [запчасти BMW](/zapchasti-bmw-barnaul/).' }] }],
    faq: [],
    related: [{ href: '/stati/chto-takoe-kontraktnyy-dvigatel/', label: 'Заглушка: контрактный двигатель' }],
  },
];

// Где показывать статьи в блоке «Полезные статьи» (перед подвалом посадочных и страниц каталога): адрес страницы →
// статьи по порядку важности. На странице не больше трёх статей. Статьи, которых ещё нет в src/articles.js, просто
// пропускаются. Дополнительно страницы можно указать в самой статье полем linkFrom.
// Подбор — по темам статей из брифа автора: что за страница и что посетителю полезно прочитать перед обращением.

export const articleRoot = 'stati/';
export const maxArticlesPerPage = 3;

export const articleLinks = {
  '/kontraktnye-zapchasti-barnaul/': ['chto-takoe-kontraktnyy-dvigatel', 'podbor-zapchastey-po-vin', 'kak-proverit-kontraktnyy-dvigatel'],
  '/zapchasti-mercedes-barnaul/': ['podbor-zapchastey-po-vin', 'chto-takoe-kontraktnyy-dvigatel', 'kontraktnaya-akpp-ili-remont'],
  '/zapchasti-bmw-barnaul/': ['podbor-zapchastey-po-vin', 'chto-takoe-kontraktnyy-dvigatel', 'kontraktnaya-akpp-ili-remont'],
  '/dvigateli-akpp-mercedes-bmw-barnaul/': ['kak-proverit-kontraktnyy-dvigatel', 'kontraktnaya-akpp-ili-remont', 'chto-takoe-kontraktnyy-dvigatel'],
  '/kuzovnye-detali-optika-mercedes-bmw-barnaul/': ['podbor-zapchastey-po-vin', 'chto-takoe-kontraktnyy-dvigatel'],
  '/avtomobili-iz-yaponii-barnaul/': ['avto-iz-yaponii-pod-zakaz'],
  '/postavki-dlya-avtorazborov-barnaul/': ['avto-iz-yaponii-pod-zakaz', 'chto-takoe-kontraktnyy-dvigatel'],
  '/katalog/': ['podbor-zapchastey-po-vin', 'chto-takoe-kontraktnyy-dvigatel', 'kontraktnaya-akpp-ili-remont'],
  '/katalog/dvigateli/': ['kak-proverit-kontraktnyy-dvigatel', 'chto-takoe-kontraktnyy-dvigatel', 'podbor-zapchastey-po-vin'],
  '/katalog/akpp/': ['kontraktnaya-akpp-ili-remont', 'podbor-zapchastey-po-vin'],
  '/katalog/diski-podveska-tormoza/': ['podbor-zapchastey-po-vin', 'chto-takoe-kontraktnyy-dvigatel'],
  '/katalog/kuzov/': ['podbor-zapchastey-po-vin', 'chto-takoe-kontraktnyy-dvigatel'],
  '/katalog/optika/': ['podbor-zapchastey-po-vin', 'chto-takoe-kontraktnyy-dvigatel'],
  '/katalog/salon/': ['podbor-zapchastey-po-vin', 'chto-takoe-kontraktnyy-dvigatel'],
};

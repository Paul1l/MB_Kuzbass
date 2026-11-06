// Адреса страниц юридических документов: /dokumenty/<документ>/. Страницы создаёт scripts/generate-legal-pages.mjs
// из тех же текстов legalDocs (src/data.js), что открываются окном на главной, — так документы доступны и без
// JavaScript. Модуль общий для главной (подвал), генератора и scripts/verify-build.mjs.

export const legalRoot = 'dokumenty/';

// Ключ — id документа в legalDocs.
export const legalDocPathNames = {
  requisites: 'rekvizity',
  privacy: 'politika',
  consent: 'soglasie',
  agreement: 'soglashenie',
  'order-terms': 'usloviya-zakaza',
  cookies: 'cookie',
};

// Адрес без ведущего слэша: главная ссылается относительно себя, чтобы работать и в подпапке.
export function legalDocPath(docId) {
  const pathName = legalDocPathNames[docId];
  if (!pathName) throw new Error(`Нет адреса для документа «${docId}»`);
  return `${legalRoot}${pathName}/`;
}

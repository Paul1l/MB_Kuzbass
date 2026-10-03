import { brandAvatar, commerce, landingPages, legalDocs, owner, site } from '../data.js';
import { LegalLink } from './LegalLink.jsx';

// Нужна для нижней части сайта: бренд и реквизиты, ссылки на разделы и юридические документы.
export function Footer({ onOpenLegal, onOpenPrivacySettings }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__columns">
          <div className="footer__brand">
            <a className="brand brand--footer" href="#top">
              <img className="brand__logo" src={brandAvatar} alt="Логотип MB Kuzbass" width="44" height="44" />
              <span className="brand__text">
                <strong>{site.name}</strong>
              </span>
            </a>
            <p>
              Контрактные запчасти Mercedes-Benz и BMW с японских доноров, автомобили с аукционов Японии и
              поставки для авторазборов. {site.city}.
            </p>
            <p className="footer__requisites">
              {owner.name} · ИНН {owner.inn} · ОГРНИП {owner.ogrnip}
            </p>
          </div>

          <nav className="footer__nav" aria-label="Разделы сайта">
            <h3>Разделы</h3>
            {landingPages.map((page) => (
              <a href={page.href} key={page.href}>
                {page.label}
              </a>
            ))}
          </nav>

          <nav className="footer__nav" aria-label="Документы сайта">
            <h3>Документы</h3>
            {legalDocs.map((doc) => (
              <LegalLink doc={doc} onOpen={onOpenLegal} key={doc.id} />
            ))}
            <button type="button" onClick={onOpenPrivacySettings}>
              Настройки cookie
            </button>
          </nav>
        </div>

        <p className="footer__bottom">
          © 2026 {site.name}. Информационная витрина: заказы и платежи на сайте не принимаются, наличие,
          состояние и цена подтверждаются при обращении. Обновлено: {site.updatedAt}.
        </p>
        <p className="footer__note">
          Сайт не является официальным дилером или представительством Mercedes-Benz и BMW. Товарные знаки
          принадлежат их правообладателям и используются для описания совместимости товаров.
          {commerce.acceptsPaymentsOnSite ? '' : ' Онлайн-оплата на сайте не подключена.'}
        </p>
      </div>
    </footer>
  );
}

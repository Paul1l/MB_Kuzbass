import { purchaseSteps } from '../data.js';

// Нужна для блока «Как купить деталь»: четыре шага от заявки до получения, плитками в один ряд.
export function StepsSection() {
  return (
    <section className="section" aria-labelledby="steps-title">
      <div className="container">
        <div className="section-head">
          <h2 id="steps-title" className="section-title">
            Как купить деталь
          </h2>
          <p>От заявки до отправки — четыре шага. Всё обсуждаем в Telegram, WhatsApp или по телефону.</p>
        </div>
        <ol className="steps">
          {purchaseSteps.map((step, index) => (
            <li className="step" key={step.title}>
              <span className="step__number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import { purchaseSteps } from '../data.js';

// Нужна для блока «Как купить деталь»: четыре шага от заявки до получения.
export function StepsSection() {
  return (
    <section className="section section--paper" aria-labelledby="steps-title">
      <div className="container">
        <h2 id="steps-title" className="section-title">
          Как купить деталь
        </h2>
        <ol className="steps">
          {purchaseSteps.map((step, index) => (
            <li className="step" key={step.title}>
              <span className="step__number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

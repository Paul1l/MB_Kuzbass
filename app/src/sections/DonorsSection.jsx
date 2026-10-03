import { donorModels } from '../data.js';

// Нужна для строки «Частые доноры» под первым экраном: кнопка подставляет модель в форму подбора запчасти.
export function DonorsSection({ onDonorPick, onOtherModel }) {
  return (
    <section className="donors" aria-label="Частые доноры">
      <div className="container donors__inner">
        <strong>Частые доноры:</strong>
        {donorModels.map((model) => (
          <button className="chip" type="button" onClick={() => onDonorPick(model)} key={model.query}>
            {model.brand} <span className="mono">{model.code}</span>
          </button>
        ))}
        <a className="chip chip--plain" href="#request" onClick={onOtherModel}>
          Другая модель →
        </a>
      </div>
    </section>
  );
}

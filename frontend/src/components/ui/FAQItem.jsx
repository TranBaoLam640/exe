export default function FAQItem({ question, answer, open, onToggle }) {
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" type="button" aria-expanded={open} onClick={onToggle}>
        {question}
        <span className="faq-icon" aria-hidden="true">
          +
        </span>
      </button>
      <div className="faq-answer">{answer}</div>
    </div>
  );
}

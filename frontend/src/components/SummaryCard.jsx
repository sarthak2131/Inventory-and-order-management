export default function SummaryCard({ label, value, helper, tag, accent = "teal" }) {
  return (
    <div className={`summary-card accent-${accent}`}>
      <div className="summary-card-head">
        <p>{label}</p>
        {tag ? <span className={`summary-tag tag-${accent}`}>{tag}</span> : null}
      </div>
      <strong>{value}</strong>
      {helper ? <span className="summary-helper">{helper}</span> : null}
    </div>
  );
}

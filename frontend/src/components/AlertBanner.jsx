export default function AlertBanner({ flash, onDismiss }) {
  if (!flash) {
    return null;
  }

  return (
    <div className={`alert-banner alert-${flash.type}`} role="status">
      <span>{flash.message}</span>
      <button type="button" className="ghost-button" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}

export default function Suggestions({ items, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="suggestions-container">
      {items.map((s, i) => (
        <button
          key={i}
          type="button"
          className="suggestion-chip"
          onClick={() => onSelect(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

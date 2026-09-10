function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {item.onClick ? <button onClick={item.onClick}>{item.label}</button> : <strong aria-current="page">{item.label}</strong>}
          {index < items.length - 1 && <span className="breadcrumb-separator" aria-hidden="true">/</span>}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumb;
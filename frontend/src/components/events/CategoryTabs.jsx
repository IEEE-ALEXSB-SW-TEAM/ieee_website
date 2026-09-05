function CategoryTabs({ categories, active, onSelect }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Event categories">
      <button className={active === "all" ? "active" : ""} role="tab" aria-selected={active === "all"} onClick={() => onSelect("all")}>All</button>
      {categories.map((category) => (
        <button key={category.id} className={active === category.id ? "active" : ""} role="tab" aria-selected={active === category.id} onClick={() => onSelect(category.id)}>
          {category.name}
        </button>
      ))}
    </div>
  );
}

export default CategoryTabs;
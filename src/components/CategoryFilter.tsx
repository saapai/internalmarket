"use client";

interface CategoryFilterProps {
  categories: { id: string; title: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          selected === null
            ? "bg-charcoal text-white"
            : "bg-white border border-charcoal/10 text-charcoal/70 hover:bg-charcoal/5"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            selected === cat.id
              ? "bg-charcoal text-white"
              : "bg-white border border-charcoal/10 text-charcoal/70 hover:bg-charcoal/5"
          }`}
        >
          {cat.title}
        </button>
      ))}
    </div>
  );
}

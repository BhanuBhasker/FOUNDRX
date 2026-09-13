/**
 * Renders a list of toggleable chips backed by an array of selected ids.
 * Used for skill/interest pickers on the profile form and discover filters.
 */
export function ChipMultiSelect({ options, valueKey, labelKey, selectedIds, onChange }) {
  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((existing) => existing !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const id = option[valueKey];
        const selected = selectedIds.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            aria-pressed={selected}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selected
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            {option[labelKey]}
          </button>
        );
      })}
    </div>
  );
}

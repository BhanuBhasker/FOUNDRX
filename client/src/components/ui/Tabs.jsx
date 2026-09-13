export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
              active === tab.value
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

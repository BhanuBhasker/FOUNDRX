const VARIANT_CLASSES = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
};

export function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  );
}

const STATUS_VARIANT = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
  active: 'success',
  paused: 'warning',
  closed: 'neutral',
  done: 'success',
  blocked: 'danger',
  in_progress: 'brand',
  not_started: 'neutral',
  planning: 'neutral',
  on_hold: 'warning',
  completed: 'success',
};

export function StatusBadge({ status, ...rest }) {
  return (
    <Badge variant={STATUS_VARIANT[status] || 'neutral'} {...rest}>
      {status?.replace(/_/g, ' ')}
    </Badge>
  );
}

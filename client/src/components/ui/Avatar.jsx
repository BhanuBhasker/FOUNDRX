import { initials } from '../../utils/format.js';

const SIZE_CLASSES = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg' };

export function Avatar({ name, src, size = 'md' }) {
  const sizeClass = SIZE_CLASSES[size];
  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizeClass}`} />;
  }
  return (
    <div className={`flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${sizeClass}`}>
      {initials(name)}
    </div>
  );
}

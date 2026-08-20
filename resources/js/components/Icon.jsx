import { ICONS } from '../constants/material-icons';

export default function Icon({ name, className = '', ...props }) {
  const glyph = ICONS[name] || name;
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} {...props}>
      {glyph}
    </span>
  );
}
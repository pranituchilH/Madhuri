export default function SectionHeading({ eyebrow, title, subtitle, light = false, className = '' }) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className}`}>
      {eyebrow && <p className={`eyebrow ${light ? 'text-gold-300' : ''}`}>{eyebrow}</p>}
      <h2 className={`section-title mt-3 ${light ? 'text-cream-light' : ''}`}>{title}</h2>
      <div className="gold-divider" />
      {subtitle && <p className={`mt-2 text-sm leading-relaxed sm:text-base ${light ? 'text-cream/75' : 'text-ink-soft'}`}>{subtitle}</p>}
    </div>
  );
}

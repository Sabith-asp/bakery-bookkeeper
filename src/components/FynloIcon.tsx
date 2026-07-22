interface FynloIconProps {
  size?: number;
  className?: string;
}

const FynloIcon = ({ size = 40, className }: FynloIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="fynlo-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00AAFF" />
        <stop offset="100%" stopColor="#005DA8" />
      </linearGradient>
    </defs>

    {/* Background */}
    <rect width="100" height="100" rx="22" fill="url(#fynlo-bg)" />

    {/* F — vertical stem */}
    <rect x="20" y="18" width="13" height="64" rx="4" fill="white" />
    {/* F — top bar */}
    <rect x="20" y="18" width="44" height="13" rx="4" fill="white" />
    {/* F — middle bar */}
    <rect x="20" y="46" width="32" height="13" rx="4" fill="white" />

    {/* Rising bar chart (bottom-right) */}
    <rect x="56" y="73" width="8" height="9"  rx="2" fill="white" opacity="0.6" />
    <rect x="67" y="62" width="8" height="20" rx="2" fill="white" opacity="0.8" />
    <rect x="78" y="50" width="8" height="32" rx="2" fill="white" />
  </svg>
);

export default FynloIcon;

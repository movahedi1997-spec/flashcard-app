/**
 * FlashLogoMark — isometric 3D card SVG logo mark.
 * Three faces: front (indigo-700), top (indigo-400), right (indigo-900).
 * No SVG gradient defs → safe to render multiple times on one page.
 */
interface Props {
  size?: number;
  className?: string;
}

export default function FlashLogoMark({ size = 28, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top face — lighter indigo */}
      <path d="M3 16 L11 9 L33 9 L25 16 Z" fill="#818cf8" />
      {/* Right face — dark indigo for depth */}
      <path d="M25 16 L33 9 L33 24 L25 31 Z" fill="#3730a3" />
      {/* Front face — primary indigo */}
      <rect x="3" y="16" width="22" height="15" rx="2.5" fill="#4f46e5" />
      {/* "Text" lines on front card */}
      <rect x="7.5" y="20"   width="11" height="2" rx="1" fill="white" opacity="0.95" />
      <rect x="7.5" y="23.5" width="8"  height="2" rx="1" fill="white" opacity="0.60" />
      <rect x="7.5" y="27"   width="9.5" height="2" rx="1" fill="white" opacity="0.35" />
    </svg>
  );
}

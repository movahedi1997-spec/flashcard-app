/**
 * FlashLogoMark — renders the FlashcardAI app icon (logo_as_icon.jpg).
 * Used wherever a compact icon is needed (navbars, headers, splash).
 */
interface Props {
  size?: number;
  className?: string;
}

export default function FlashLogoMark({ size = 28, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-icon.jpg"
      alt="FlashcardAI"
      width={size}
      height={size}
      className={`rounded-xl object-cover ${className ?? ''}`}
      style={{ width: size, height: size }}
    />
  );
}

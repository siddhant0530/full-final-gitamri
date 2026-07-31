// A recognizable WhatsApp glyph (phone handset in a speech bubble),
// instead of lucide's generic chat-bubble icon which doesn't read as
// "WhatsApp" specifically. lucide-react doesn't ship brand/logo icons by
// design (to avoid trademark issues), so this is a small hand-built SVG
// used purely to indicate "this links to WhatsApp."
//
// Renders as a single-color outline via `currentColor`, matching lucide's
// behavior — it drops into the existing green pill buttons/badges as a
// plain white glyph, the same way MessageCircle did, rather than adding
// its own background circle (which would look like a redundant green
// circle stacked on an already-green button).
export default function WhatsAppIcon({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M17.6 6.3A8.9 8.9 0 0 0 12 4c-4.4 0-8 3.6-8 8.9 0 1.5.4 2.9 1.1 4.1L4 21l3.9-1c1.2.6 2.6 1 4.1 1 4.4 0 8-3.6 8-8s-1.5-6.8-2.4-6.7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 8.8c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.06-.6.3-.2.24-.8.8-.8 1.9s.8 2.2.9 2.36c.1.15 1.6 2.5 3.9 3.5 1.9.8 2.3.6 2.7.55.45-.04 1.35-.55 1.55-1.1.2-.53.2-1 .13-1.1-.06-.1-.2-.15-.44-.27-.24-.12-1.35-.67-1.56-.74-.2-.08-.36-.11-.5.12-.16.23-.6.74-.72.9-.13.15-.27.17-.5.06-.24-.12-1-.37-1.87-1.15-.7-.62-1.15-1.37-1.28-1.6-.14-.24 0-.36.1-.48.1-.1.23-.27.34-.4.12-.14.16-.24.24-.4.08-.15.04-.3-.02-.4-.06-.12-.5-1.24-.7-1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
interface ProductBadgeProps {
  text: string;
  variant?: "success" | "danger" | "premium";
}

const styles = {
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
  premium: "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
};

export default function ProductBadge({ text, variant = "success" }: ProductBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[variant]}`}>
      {text}
    </span>
  );
}

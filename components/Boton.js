export default function Boton({ children, onClick, tipo = "primary", className = "", type = "button", disabled = false }) {
  const baseStyles = "px-3.5 py-2 rounded font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus:ring-[var(--color-primary-light)] border border-transparent shadow-sm",
    secondary: "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--border-light)] focus:ring-[var(--border-color)] shadow-sm",
    accent: "bg-[var(--color-success)] text-white hover:opacity-90 focus:ring-emerald-200 border border-transparent shadow-sm",
    outline: "bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] focus:ring-[var(--color-primary-light)]",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--border-light)] focus:ring-[var(--border-color)] border border-transparent",
    danger: "bg-[var(--color-danger)] text-white hover:opacity-90 focus:ring-red-200 border border-transparent shadow-sm"
  };

  return (
    <button 
      type={type}
      className={`${baseStyles} ${variants[tipo] || variants.primary} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

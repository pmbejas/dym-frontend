export default function Tarjeta({ children, className = "", title, action }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-5 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-slate-600">
        {children}
      </div>
    </div>
  );
}

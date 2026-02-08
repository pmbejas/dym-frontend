import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Tabla({ columnas, datos, acciones, onEditar, onEliminar }) {
  return (
    <div className="overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border-light)]">
          <thead className="bg-[var(--bg-primary)]">
            <tr>
              {columnas.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {(acciones || onEditar || onEliminar) && (
                <th className="px-4 py-3 text-right text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-light)]">
            {(!datos || datos.length === 0) ? (
              <tr>
                <td colSpan={columnas.length + 1} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-medium">No se encontraron datos registrados.</span>
                  </div>
                </td>
              </tr>
            ) : (
              datos.map((fila, filaIdx) => (
                <tr key={fila.id || filaIdx} className="hover:bg-[var(--bg-primary)] transition-colors">
                  {columnas.map((col, colIdx) => (
                    <td key={`${filaIdx}-${colIdx}`} className={`px-4 py-3 whitespace-nowrap text-sm text-[var(--text-primary)] ${col.className || ''}`}>
                      {col.render ? col.render(fila) : fila[col.accessor]}
                    </td>
                  ))}
                  {(acciones || onEditar || onEliminar) && (
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end items-center gap-2">
                         {acciones && acciones(fila)}
                         {onEditar && (
                           <button 
                             onClick={() => onEditar(fila)}
                             className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                             title="Editar"
                           >
                             <PencilSquareIcon className="w-4 h-4" />
                           </button>
                         )}
                         {onEliminar && (
                           <button 
                             onClick={() => onEliminar(fila)}
                             className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                             title="Eliminar"
                           >
                             <TrashIcon className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

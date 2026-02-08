import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarPDF = (venta) => {
    const doc = new jsPDF();

    // --- Header ---
    doc.setFontSize(18);
    doc.text('DyM Importación', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Comprobante de Venta', 14, 30);
    
    // Info del lado derecho (Fecha y Nro)
    const fecha = new Date(venta.fecha).toLocaleDateString('es-AR');
    const hora = new Date(venta.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha} ${hora}`, 196, 22, { align: 'right' });
    doc.text(`N° Comp.: ${venta.numero_factura || '-' }`, 196, 28, { align: 'right' });

    // --- Cliente ---
    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35); // Línea separadora

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Datos del Cliente', 14, 42);

    doc.setFontSize(10);
    doc.setTextColor(50);
    const nombreCliente = venta.Cliente 
        ? `${venta.Cliente.apellido}, ${venta.Cliente.nombre}` 
        : (venta.cliente ? `${venta.cliente.apellido}, ${venta.cliente.nombre}` : 'Consumidor Final');
    
    // Intentar obtener DNI/CUIT/CUIL - Ajustar según tu modelo real
    const docCliente = venta.Cliente?.cuit_cuil || venta.cliente?.cuit_cuil || venta.Cliente?.dni || '-';

    doc.text(`Nombre: ${nombreCliente}`, 14, 48);
    doc.text(`DNI/CUIT: ${docCliente}`, 14, 54);

    // --- Tabla de Productos ---
    const tableColumn = ["Producto", "Cant.", "Precio Unit.", "Subtotal"];
    const tableRows = [];

    venta.detalles.forEach(detalle => {
        const productoData = [
            detalle.Producto?.nombre || 'Producto Eliminado',
            detalle.cantidad,
            `$${parseFloat(detalle.precio_unitario).toLocaleString('es-AR')}`,
            `$${(detalle.cantidad * parseFloat(detalle.precio_unitario)).toLocaleString('es-AR')}`
        ];
        tableRows.push(productoData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] }, // Color gris oscuro
        styles: { fontSize: 9 },
        margin: { top: 60 }
    });

    // --- Totales ---
    let finalY = doc.lastAutoTable.finalY + 10;

    // Calcular Subtotal de items
    const subtotalItems = venta.detalles.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario)), 0);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    // Alinear totales a la derecha
    const rightMargin = 196;
    
    doc.text(`Subtotal: $${subtotalItems.toLocaleString('es-AR')}`, rightMargin, finalY, { align: 'right' });
    finalY += 6;

    // Intereses (si hubo)
    const interes = parseFloat(venta.interes_aplicado || 0);
    if (interes > 0) {
        doc.text(`Intereses / Financiación: $${interes.toLocaleString('es-AR')}`, rightMargin, finalY, { align: 'right' });
        finalY += 6;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: $${parseFloat(venta.total).toLocaleString('es-AR')}`, rightMargin, finalY, { align: 'right' });
    
    // --- Sección de Pagos y Financiación ---
    finalY += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Información de Pago", 14, finalY);
    
    finalY += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // 1. Pagos ya realizados (Caja y Cheques)
    // FILTRO: Mostrar solo pagos iniciales (no pagos de cuotas posteriores)
    // Estrategia: Filtrar si la descripción/concepto menciona "Cuota"
    
    let pagosText = [];
    
    if (venta.MovimientoCajas?.length > 0) {
        venta.MovimientoCajas.forEach(mov => {
            const concepto = (mov.concepto || mov.descripcion || '').toLowerCase();
            const esPagoCuota = concepto.includes('cuota');
            
            if (!esPagoCuota) {
                pagosText.push(`- Pago (${mov.medio_pago}): $${parseFloat(mov.monto).toLocaleString('es-AR')}`);
            }
        });
    }
    
    if (venta.Cheques?.length > 0) {
        venta.Cheques.forEach(ch => {
            // Los cheques suelen ser pagos iniciales, pero por si acaso, si hubiera lógica de cheques para cuotas (raro), se podría filtrar.
            // Asumimos que los cheques asociados a la venta son del momento de la venta.
            pagosText.push(`- Cheque #${ch.numero}: $${parseFloat(ch.monto).toLocaleString('es-AR')}`);
        });
    }

    if (pagosText.length > 0) {
        doc.text(pagosText, 14, finalY);
        finalY += (pagosText.length * 5) + 5;
    } else {
       // Si no hay pagos registrados y no hay cuotas, puede ser pendiente o cuenta corriente
       // Pero si hay cuotas, lo manejamos abajo.
    }

    // 2. Lógica de Credito / Cuotas
    // REQUERIMIENTO: Mostrar total del crédito pero NO el detalle de las cuotas
    if (venta.cuotas && venta.cuotas.length > 0) {
        // Calcular total financiado (suma de las cuotas)
        const totalFinanciado = venta.cuotas.reduce((acc, c) => acc + parseFloat(c.monto), 0);
        
        doc.setFont("helvetica", "bold");
        doc.text(`Crédito Personal / Financiado: $${totalFinanciado.toLocaleString('es-AR')}`, 14, finalY);
        doc.setFont("helvetica", "normal");
        finalY += 5;
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text("(Plan de cuotas acordado con el cliente)", 14, finalY);
        finalY += 10;
        doc.setTextColor(0);
        doc.setFontSize(10);
    } 

    // --- Footer ---
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Gracias por su compra', 105, 280, { align: 'center' }); // Pie de página

    // Guardar PDF
    doc.save(`Comprobante_Venta_${venta.numero_factura || venta.id}.pdf`);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

// --- Helpers ---
const addCompanyHeader = (doc, title) => {
    // Título Principal
    doc.setFontSize(22);
    doc.setTextColor(33, 37, 41); // Dark Gray
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 22);

    // Fecha y Hora
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    const fecha = new Date().toLocaleDateString('es-AR');
    const hora = new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
    doc.text(`Generado: ${fecha} ${hora}`, 196, 22, { align: 'right' });

    // Info Empresa (Subtítulo)
    doc.setFontSize(10);
    doc.setTextColor(73, 80, 87); // Gray
    doc.setFont("helvetica", "bold");
    doc.text('DyM Importaciones', 14, 28);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(108, 117, 125); // Light Gray
    doc.text('Tel: +54 9 (381) 602-6007 | Email: compras@dymimportaciones.com', 14, 32);
    
    // Línea separadora
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(1);
    doc.line(14, 36, 196, 36);
};

const addPageNumbers = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
        doc.text('DyM Importaciones - Sistema de Gestión', 14, 290, { align: 'left' });
    }
};

export const generarPDF = (venta) => {
    const doc = new jsPDF();
    
    // Create canvas for barcode
    const barcodeCanvas = document.createElement('canvas');

    // --- Header ---
    doc.setFontSize(18);
    doc.text('DyM Importaciones', 14, 22);

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

    // --- Barcode de Validación ---
    if (venta.token_validacion) {
        const barcodeY = 265;
        const barcodeHeight = 8;
        
        JsBarcode(barcodeCanvas, venta.token_validacion, {
            format: 'CODE128',
            width: 1,
            height: 40,
            displayValue: false
        });
        
        const barcodeImg = barcodeCanvas.toDataURL('image/png');
        doc.addImage(barcodeImg, 'PNG', 55, barcodeY, 100, barcodeHeight);
        
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`${venta.token_validacion}`, 105, barcodeY + barcodeHeight + 1, { align: 'center' });
    }

    // Guardar PDF
    doc.save(`voucher_${venta.id}.pdf`);
};



export const generarListadoComprasPDF = (compras, filtros) => {
    const doc = new jsPDF();

    // --- Header ---
    addCompanyHeader(doc, 'Listado de Compras');

    // --- Filtros Activos ---
    let y = 45;
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text('Filtros Aplicados:', 14, y);
    
    let filtrosTexto = [];
    if (filtros.filtro) filtrosTexto.push(`Busqueda: "${filtros.filtro}"`);
    if (filtros.estado) filtrosTexto.push(`Estado: ${filtros.estado}`);
    if (filtros.pago) filtrosTexto.push(`Pago: ${filtros.pago}`);
    if (filtros.recepcion) filtrosTexto.push(`Recepción: ${filtros.recepcion}`);

    doc.setFont("helvetica", "normal");
    if (filtrosTexto.length > 0) {
        doc.text(filtrosTexto.join(' | '), 45, y);
    } else {
        doc.setTextColor(150);
        doc.text('Ninguno (Listado Completo)', 45, y);
    }
    y += 10;

    // --- Tabla ---
    const tableColumn = ["Fecha", "Proveedor", "Orden", "Estado", "Pago", "Recepción", "Total"];
    const tableRows = [];

    compras.forEach(compra => {
        const rowData = [
            new Date(compra.fecha).toLocaleDateString('es-AR'),
            compra.Proveedor?.razon_social || '-',
            compra.numero_orden || `#${compra.id}`,
            compra.estado,
            compra.estado_pago,
            compra.estado_recepcion,
            `${compra.moneda === 'USD' ? 'USD ' : '$'}${parseFloat(compra.total).toLocaleString('es-AR')}`
        ];
        tableRows.push(rowData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: y,
        theme: 'striped',
        headStyles: { 
            fillColor: [41, 128, 185], // Brand Blue
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: { 
            fontSize: 8,
            cellPadding: 3,
            valign: 'middle'
        },
        columnStyles: {
            0: { halign: 'center' }, // Fecha
            2: { halign: 'center' }, // Orden
            3: { halign: 'center' }, // Estado
            4: { halign: 'center' }, // Pago
            5: { halign: 'center' }, // Recepcion
            6: { halign: 'right', fontStyle: 'bold' }  // Total
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        }
    });



    // --- Page Numbers ---
    addPageNumbers(doc);

    doc.save(`listado_compras_${new Date().getTime()}.pdf`);
};

// Helper para fechas seguras
const nuevaFecha = (fecha) => {
    try {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-AR');
    } catch (e) {
        return '-';
    }
};

export const generarDetalleCompraPDF = (compra) => {
    const doc = new jsPDF();
    
    // --- Header ---
    addCompanyHeader(doc, 'Orden de Compra');

    // Info del lado derecho
    const fecha = nuevaFecha(compra.fecha);
    doc.setFontSize(10);
/*     doc.text(`Fecha: ${fecha}`, 196, 27, { align: 'right' }); */
    doc.text(`N° Orden: ${compra.numero_orden || '#' + compra.id}`, 196, 27, { align: 'right' });
    
    // Estado
    const estadoMap = {
        'PENDIENTE': 'Borrador',
        'CONFIRMADA': 'Confirmada',
        'RECIBIDA': 'Recibida',
        'CANCELADA': 'Cancelada'
    };
    doc.text(`Estado: ${estadoMap[compra.estado] || compra.estado}`, 196, 32, { align: 'right' });

    // --- Proveedor ---
    doc.setDrawColor(200);
/*     doc.line(14, 40, 196, 40); */

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Datos del Proveedor', 14, 48);

    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(`Razón Social: ${compra.Proveedor?.razon_social || 'Desconocido'}`, 14, 54);
    if (compra.Proveedor?.cuit) doc.text(`CUIT: ${compra.Proveedor.cuit}`, 14, 60);
    if (compra.Proveedor?.email) doc.text(`Email: ${compra.Proveedor.email}`, 14, 66);

    // --- Tabla de Productos ---
    const tableColumn = ["Producto", "SKU", "Cant.", "Costo Unit.", "Subtotal"];
    const tableRows = [];

    compra.CompraDetalles?.forEach(detalle => {
        const rowData = [
            detalle.Producto?.nombre || 'Producto Eliminado',
            detalle.Producto?.sku || '-',
            detalle.cantidad,
            `${compra.moneda} ${parseFloat(detalle.costo_unitario).toLocaleString('es-AR', {minimumFractionDigits: 2})}`,
            `${compra.moneda} ${(detalle.cantidad * parseFloat(detalle.costo_unitario)).toLocaleString('es-AR', {minimumFractionDigits: 2})}`
        ];
        tableRows.push(rowData);
    });

    let startY = compra.Proveedor?.email ? 75 : 70;

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 9 },
        columnStyles: {
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        }
    });

    // --- Totales ---
    let finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const rightMargin = 196;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL: ${compra.moneda} ${parseFloat(compra.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}`, rightMargin, finalY, { align: 'right' });

    // --- Pagos (Si existen) ---
    if (compra.Pagos && compra.Pagos.length > 0) {
        finalY += 15;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Pagos Registrados", 14, finalY);
        finalY += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        compra.Pagos.forEach(pago => {
             const fechaPago = nuevaFecha(pago.fecha);
             doc.text(`- ${fechaPago} | ${pago.medio_pago}: ${compra.moneda} ${parseFloat(pago.monto).toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 14, finalY);
             finalY += 6;
        });
    }

    // --- Barcode de Validación ---
    if (compra.token_validacion) {
        // Create canvas if not created globally in the scope
        const barcodeCanvas = document.createElement('canvas');
        const barcodeY = 265;
        const barcodeHeight = 8;
        
        JsBarcode(barcodeCanvas, compra.token_validacion, {
            format: 'CODE128',
            width: 1,
            height: 40,
            displayValue: false
        });
        
        const barcodeImg = barcodeCanvas.toDataURL('image/png');
        doc.addImage(barcodeImg, 'PNG', 55, barcodeY, 100, barcodeHeight);
        
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`${compra.token_validacion}`, 105, barcodeY + barcodeHeight + 1, { align: 'center' });
    }

    addPageNumbers(doc);
    doc.save(`orden_compra_${compra.numero_orden || compra.id}.pdf`);
};




export const generarListadoVentasPDF = (ventas, filtros) => {
    const doc = new jsPDF();

    // --- Header ---
    addCompanyHeader(doc, 'Listado de Ventas');

    // --- Filtros Activos ---
    let y = 45;
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text('Filtros Aplicados:', 14, y);
    
    let filtrosTexto = [];
    if (filtros.cliente) filtrosTexto.push(`Cliente: "${filtros.cliente}"`);
    if (filtros.fechaDesde) filtrosTexto.push(`Desde: ${new Date(filtros.fechaDesde).toLocaleDateString('es-AR')}`);
    if (filtros.fechaHasta) filtrosTexto.push(`Hasta: ${new Date(filtros.fechaHasta).toLocaleDateString('es-AR')}`);
    if (filtros.estadoPago && filtros.estadoPago !== 'TODOS') filtrosTexto.push(`Pago: ${filtros.estadoPago}`);
    if (filtros.estadoEntrega && filtros.estadoEntrega !== 'TODOS') filtrosTexto.push(`Entrega: ${filtros.estadoEntrega}`);

    doc.setFont("helvetica", "normal");
    if (filtrosTexto.length > 0) {
        doc.text(filtrosTexto.join(' | '), 45, y);
    } else {
        doc.setTextColor(150);
        doc.text('Ninguno (Listado Completo)', 45, y);
    }
    y += 10;

    // --- Tabla ---
    const tableColumn = ["Fecha", "Factura", "Cliente", "Estado Pago", "Estado Entrega", "Total"];
    const tableRows = [];

    ventas.forEach(venta => {
        const clienteNombre = venta.Cliente 
            ? `${venta.Cliente.apellido}, ${venta.Cliente.nombre}`
            : (venta.cliente ? `${venta.cliente.apellido}, ${venta.cliente.nombre}` : 'Desconocido');

        const rowData = [
            new Date(venta.fecha).toLocaleDateString('es-AR'),
            venta.numero_factura || '-',
            clienteNombre,
            venta.estado,
            venta.estado_entrega,
            `${venta.moneda === 'USD' ? 'USD ' : '$'}${parseFloat(venta.total).toLocaleString('es-AR')}`
        ];
        tableRows.push(rowData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: y,
        theme: 'striped',
        headStyles: { 
            fillColor: [39, 174, 96], // Brand Green
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: { 
            fontSize: 8,
            cellPadding: 3,
            valign: 'middle'
        },
        columnStyles: {
            0: { halign: 'center' }, // Fecha
            1: { halign: 'center' }, // Factura
            3: { halign: 'center' }, // Estado
            4: { halign: 'center' }, // Entrega
            5: { halign: 'right', fontStyle: 'bold' }  // Total
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        }
    });



    // --- Page Numbers ---
    addPageNumbers(doc);

    doc.save(`listado_ventas_${new Date().getTime()}.pdf`);
};
// --- Reporte Pendientes de Entrega ---
export const generarReportePendientesPDF = (pendientes) => {
    const doc = new jsPDF();
    addCompanyHeader(doc, 'Reporte de Entregas Pendientes');
    
    const tableColumn = ["Fecha Venta", "Cliente", "Producto", "SKU", "Pendiente", "Stock Actual"];
    const tableRows = [];

    pendientes.forEach(item => {
        const fecha = new Date(item.VentaCabecera?.fecha).toLocaleDateString('es-AR');
        const cliente = item.VentaCabecera?.Cliente 
            ? `${item.VentaCabecera.Cliente.apellido}, ${item.VentaCabecera.Cliente.nombre}` 
            : 'Consumidor Final';
        
        // Calcular pendiente real
        const cantPendiente = parseFloat(item.cantidad) - (parseFloat(item.cantidad_entregada) || 0);

        const row = [
            fecha,
            cliente,
            item.Producto?.nombre || 'Desconocido',
            item.Producto?.sku || '-',
            cantPendiente,
            item.Producto?.stock_actual || 0
        ];
        tableRows.push(row);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: 'bold' }, // Danger Color
        alternateRowStyles: { fillColor: [248, 249, 250] },
    });
    
    addPageNumbers(doc);
    doc.save('reporte_pendientes_entrega.pdf');
};

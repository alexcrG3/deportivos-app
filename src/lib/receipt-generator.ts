import RendimientoStore from "./rendimiento-store";

export interface ReciboData {
  id: string;
  consecutivo: string;
  fecha: string;
  alumnoNombre: string;
  categoria: string;
  encargadoNombre?: string;
  encargadoIdentificacion?: string;
  monto: number;
  concepto: string;
  metodoPago: string;
  referencia: string;
}

export function generateReceiptHTML(data: ReciboData): string {
  const activeOrgId = RendimientoStore.getActiveOrganizacionId();
  const activeOrg = RendimientoStore.getOrganizaciones().find((o) => o.id === activeOrgId);
  const clubName = activeOrg?.nombre || "ATHLETIX ACADEMY";
  const subtotal = Math.round(data.monto / 1.13);
  const iva = data.monto - subtotal;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://athletix.os/verify/recibo/${data.consecutivo}`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Comprobante Oficial de Pago - ${data.consecutivo}</title>
      <style>
        * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: #f8fafc; color: #0f172a; padding: 20px; margin: 0; }
        .receipt-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
        .brand { font-size: 22px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.5px; }
        .sub-brand { font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 1.5px; }
        .consecutivo { margin-top: 12px; font-family: monospace; font-size: 13px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 4px 12px; border-radius: 8px; display: inline-block; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; margin-bottom: 24px; }
        .detail-item { background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #f1f5f9; }
        .detail-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .detail-value { font-weight: 700; color: #0f172a; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        .table th { background: #1e293b; color: #ffffff; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; border-radius: 6px 6px 0 0; }
        .table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-weight: 600; }
        .totals { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 14px; text-align: right; margin-bottom: 24px; }
        .total-row { font-size: 18px; font-weight: 900; color: #065f46; }
        .footer { display: flex; align-items: center; justify-between; border-top: 2px dashed #e2e8f0; pt-20; margin-top: 20px; font-size: 11px; color: #64748b; }
        .qr-box { text-align: center; }
        .qr-box img { width: 80px; height: 80px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 4px; }
        @media print {
          body { background: #ffffff; padding: 0; }
          .receipt-card { border: none; box-shadow: none; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="brand">${clubName}</div>
          <div class="sub-brand">Comprobante Oficial de Pago</div>
          <div class="consecutivo">Consecutivo: ${data.consecutivo}</div>
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Alumno / Deportista</div>
            <div class="detail-value">${data.alumnoNombre}</div>
            <div style="font-size: 11px; color: #64748b;">Categoría: ${data.categoria}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Fecha & Método</div>
            <div class="detail-value">${data.fecha}</div>
            <div style="font-size: 11px; color: #10b981; font-weight: 700;">${data.metodoPago.toUpperCase()} (Ref: ${data.referencia})</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Concepto / Descripción</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${data.concepto}</td>
              <td style="text-align: right;">₡${data.monto.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div style="font-size: 11px; color: #047857;">Subtotal: ₡${subtotal.toLocaleString()} CRC</div>
          <div style="font-size: 11px; color: #047857;">IVA (13%): ₡${iva.toLocaleString()} CRC</div>
          <div class="total-row">TOTAL PAGADO: ₡${data.monto.toLocaleString()} CRC</div>
        </div>

        <div class="footer" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; color: #1e293b;">Verificación de Autenticidad</div>
            <div>Generado automáticamente por Athletix OS</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">ID Transacción: ${data.id}</div>
          </div>
          <div class="qr-box">
            <img src="${qrUrl}" alt="QR Verificación" />
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function printOrDownloadReceipt(data: ReciboData) {
  const htmlContent = generateReceiptHTML(data);
  const printWin = window.open("", "_blank", "width=700,height=900");
  if (!printWin) {
    alert("Por favor permite abrir ventanas emergentes para ver/descargar el recibo.");
    return;
  }

  printWin.document.write(htmlContent);
  printWin.document.close();
  setTimeout(() => {
    printWin.focus();
    printWin.print();
  }, 400);
}

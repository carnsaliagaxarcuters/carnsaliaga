import React, { useState, useRef } from 'react';
import { DataTable, DataTableRef } from './DataTable';
import { PagoProveedor, Proveidor } from '../types';
import { Language, translations } from '../lib/translations';
import { PagosProveedoresByProveedor, PagosProveedoresByProveedorRef } from './PagosProveedoresByProveedor';

interface PagosProveedoresManagerProps {
  language: Language;
}

export function PagosProveedoresManager({ language }: PagosProveedoresManagerProps) {
  const [subView, setSubView] = useState<'date' | 'proveedor'>('date');
  const t = translations[language];
  const pagosRef = useRef<DataTableRef<PagoProveedor>>(null);
  const pagosByProveedorRef = useRef<PagosProveedoresByProveedorRef>(null);
  const proveedoresRef = useRef<DataTableRef<Proveidor>>(null);

  const handleAddProveedor = (columnKey: string) => {
    if (columnKey === 'proveedor') {
      proveedoresRef.current?.openPanel();
    }
  };

  const handleProveedoresChange = () => {
    pagosRef.current?.refreshOptions?.();
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.sidebar.pagos_proveedores}</h2>
          <p className="text-gray-500 text-sm">{t.subtitles.pagos_proveedores}</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setSubView('date')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subView === 'date' 
                ? 'bg-white text-[#464971] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.pagos_proveedores.por_fecha.toUpperCase()}
          </button>
          <button
            onClick={() => setSubView('proveedor')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subView === 'proveedor' 
                ? 'bg-white text-[#464971] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.pagos_proveedores.por_proveedor.toUpperCase()}
          </button>
        </div>
      </header>

      {subView === 'date' ? (
        <DataTable<PagoProveedor>
          ref={pagosRef}
          tableName="pagos_proveedores"
          language={language}
          onAddForeign={handleAddProveedor}
          onDataChange={() => {
            pagosByProveedorRef.current?.fetchData();
          }}
          columns={[
            { key: 'fecha', header: t.pagos_proveedores.fecha, type: 'date' },
            { key: 'proveedor', header: t.pagos_proveedores.proveedor, type: 'select', foreignTable: 'proveidors', foreignLabel: 'nom' },
            { key: 'import', header: t.pagos_proveedores.import, type: 'number', currency: true },
            { key: 'num_factura', header: t.pagos_proveedores.num_factura, type: 'text' },
            { key: 'empresa', header: t.pagos_proveedores.empresa, type: 'text', hiddenInForm: true },
            { key: 'tipo_pago', header: t.pagos_proveedores.tipo_pago, type: 'select', options: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'BIZUM', 'XEC', 'BAR'] },
            { key: 'pagado', header: t.pagos_proveedores.pagado, type: 'boolean' },
            { key: 'fecha_pago', header: t.pagos_proveedores.fecha_pago, type: 'date' },
            { key: 'tipo', header: t.pagos_proveedores.tipo, type: 'text' },
            { key: 'observaciones', header: t.pagos_proveedores.observaciones, type: 'text' },
          ]}
        />
      ) : (
        <>
          <PagosProveedoresByProveedor 
            language={language}
            ref={pagosByProveedorRef}
            onAddPago={(proveedorName) => {
              pagosRef.current?.openPanel({ proveedor: proveedorName });
            }}
            onEditPago={(pago) => {
              pagosRef.current?.openPanel(pago);
            }}
          />
          <DataTable<PagoProveedor>
            ref={pagosRef}
            tableName="pagos_proveedores"
            language={language}
            hideTable={true}
            onAddForeign={handleAddProveedor}
            onDataChange={() => {
              pagosByProveedorRef.current?.fetchData();
            }}
            columns={[
              { key: 'fecha', header: t.pagos_proveedores.fecha, type: 'date' },
              { key: 'proveedor', header: t.pagos_proveedores.proveedor, type: 'select', foreignTable: 'proveidors', foreignLabel: 'nom' },
              { key: 'import', header: t.pagos_proveedores.import, type: 'number', currency: true },
              { key: 'num_factura', header: t.pagos_proveedores.num_factura, type: 'text' },
              { key: 'empresa', header: t.pagos_proveedores.empresa, type: 'text', hiddenInForm: true },
              { key: 'tipo_pago', header: t.pagos_proveedores.tipo_pago, type: 'select', options: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'BIZUM', 'XEC', 'BAR'] },
              { key: 'pagado', header: t.pagos_proveedores.pagado, type: 'boolean' },
              { key: 'fecha_pago', header: t.pagos_proveedores.fecha_pago, type: 'date' },
              { key: 'tipo', header: t.pagos_proveedores.tipo, type: 'text' },
              { key: 'observaciones', header: t.pagos_proveedores.observaciones, type: 'text' },
            ]}
          />
        </>
      )}

      {/* Hidden Proveedores table for the full creation form */}
      <DataTable<Proveidor>
        ref={proveedoresRef}
        tableName="proveidors"
        language={language}
        hideTable={true}
        onDataChange={handleProveedoresChange}
        columns={[
          { key: 'nom', header: t.proveidors.nom, type: 'text' },
          { key: 'nif', header: t.proveidors.nif, type: 'text' },
          { key: 'email', header: t.proveidors.email, type: 'text' },
          { key: 'telefon', header: t.proveidors.telefon, type: 'text' },
          { key: 'ciutat', header: t.proveidors.ciutat, type: 'text' },
          { key: 'direccio', header: t.proveidors.direccio, type: 'text' },
          { key: 'web', header: t.proveidors.web, type: 'text' },
          { key: 'empresa', header: t.proveidors.empresa, type: 'text' },
          { key: 'tipus', header: t.proveidors.tipus, type: 'select', options: [] },
        ]}
      />
    </div>
  );
}

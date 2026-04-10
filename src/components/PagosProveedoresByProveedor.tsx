import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '../lib/supabase';
import { PagoProveedor } from '../types';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { ChevronDown, ChevronRight, Truck, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../lib/translations';

export interface PagosProveedoresByProveedorRef {
  fetchData: () => void;
}

interface GroupedPago {
  proveedor: string;
  total: number;
  items: PagoProveedor[];
}

interface PagosProveedoresByProveedorProps {
  language: Language;
  onAddPago?: (proveedorName: string) => void;
  onEditPago?: (pago: PagoProveedor) => void;
  empresaContext?: string;
}

export const PagosProveedoresByProveedor = forwardRef<PagosProveedoresByProveedorRef, PagosProveedoresByProveedorProps>(
  ({ language, onAddPago, onEditPago, empresaContext }, ref) => {
    const [groupedData, setGroupedData] = useState<GroupedPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedProveedores, setExpandedProveedores] = useState<Set<string>>(new Set());
    const t = translations[language];

    const fetchData = async () => {
      setLoading(true);
      let query = supabase
        .from('pagos_proveedores')
        .select('*')
        .order('fecha', { ascending: false });

      if (empresaContext && empresaContext !== 'Totes') {
        if (empresaContext === 'HISTORIC') {
          query = query.in('empresa', ['EMBOTITS', 'CARN']);
        } else {
          query = query.eq('empresa', empresaContext);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching pagos:', error);
      } else {
        const pagos = data as PagoProveedor[];
        const groups: { [key: string]: GroupedPago } = {};

        pagos.forEach(item => {
          const proveedorName = item.proveedor || 'Sense Proveïdor';
          if (!groups[proveedorName]) {
            groups[proveedorName] = {
              proveedor: proveedorName,
              total: 0,
              items: []
            };
          }
          groups[proveedorName].items.push(item);
          // Only sum if not paid
          if (!item.pagado) {
            groups[proveedorName].total += Number(item.import) || 0;
          }
        });

        const sortedGroups = Object.values(groups).sort((a, b) => b.total - a.total);
        setGroupedData(sortedGroups);
      }
      setLoading(false);
    };

    useImperativeHandle(ref, () => ({
      fetchData
    }));

    useEffect(() => {
      fetchData();
    }, []);

    const toggleProveedor = (proveedor: string) => {
      const newExpanded = new Set(expandedProveedores);
      if (newExpanded.has(proveedor)) {
        newExpanded.delete(proveedor);
      } else {
        newExpanded.add(proveedor);
      }
      setExpandedProveedores(newExpanded);
    };

    const filteredData = groupedData.filter(group => 
      group.proveedor.toLowerCase().includes(search.toLowerCase()) ||
      group.items.some(item => 
        (item.num_factura && item.num_factura.toLowerCase().includes(search.toLowerCase())) ||
        (item.observaciones && item.observaciones.toLowerCase().includes(search.toLowerCase()))
      )
    );

    return (
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t.common.search}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464971]/10 focus:border-[#464971] transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-6 h-6 border-2 border-[#464971] border-t-transparent rounded-full animate-spin mb-2" />
            {t.common.loading}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic bg-white rounded-2xl border border-gray-200">
            No s'han trobat registres
          </div>
        ) : (
          <div className="space-y-3">
            {filteredData.map((group) => (
              <div key={group.proveedor} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleProveedor(group.proveedor)}
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                      {expandedProveedores.has(group.proveedor) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{group.proveedor}</h3>
                      <p className="text-xs text-gray-500">{group.items.length} registres</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Pendent</p>
                      <p className={cn(
                        "text-lg font-bold",
                        group.total > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {formatCurrency(group.total)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddPago?.(group.proveedor);
                      }}
                      className="p-2 bg-[#464971]/10 text-[#464971] hover:bg-[#464971] hover:text-white rounded-xl transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedProveedores.has(group.proveedor) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 bg-gray-50/50"
                    >
                      <div className="p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-100/50 rounded-lg">
                              <tr>
                                <th className="px-4 py-3 font-semibold rounded-l-lg">{t.pagos_proveedores.fecha}</th>
                                <th className="px-4 py-3 font-semibold">{t.pagos_proveedores.num_factura}</th>
                                <th className="px-4 py-3 font-semibold">{t.pagos_proveedores.import}</th>
                                <th className="px-4 py-3 font-semibold">{t.pagos_proveedores.tipo_pago}</th>
                                <th className="px-4 py-3 font-semibold">{t.pagos_proveedores.pagado}</th>
                                <th className="px-4 py-3 font-semibold rounded-r-lg text-right">{t.common.actions}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {group.items.map((item) => (
                                <tr 
                                  key={item.id} 
                                  onClick={() => onEditPago?.(item)}
                                  className="hover:bg-white transition-colors cursor-pointer group/row"
                                >
                                  <td className="px-4 py-3 text-gray-600">{formatDate(item.fecha)}</td>
                                  <td className="px-4 py-3 text-gray-900 font-medium">{item.num_factura || '-'}</td>
                                  <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(Number(item.import))}</td>
                                  <td className="px-4 py-3">
                                    {item.tipo_pago ? (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                        {item.tipo_pago}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    {item.pagado ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold tracking-wider">
                                        PAGAT
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold tracking-wider">
                                        PENDENT
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <ChevronRight className="w-4 h-4 text-gray-300 inline-block opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

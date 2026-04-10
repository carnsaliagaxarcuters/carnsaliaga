import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '../lib/supabase';
import { Impagat } from '../types';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { ChevronDown, ChevronRight, User, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../lib/translations';

export interface ImpagatsByClientRef {
  fetchData: () => void;
}

interface GroupedImpagat {
  client: string;
  total: number;
  items: Impagat[];
}

interface ImpagatsByClientProps {
  language: Language;
  onAddImpagat?: (clientName: string) => void;
  onEditImpagat?: (impagat: Impagat) => void;
  empresaContext?: string;
}

export const ImpagatsByClient = forwardRef<ImpagatsByClientRef, ImpagatsByClientProps>(
  ({ language, onAddImpagat, onEditImpagat, empresaContext }, ref) => {
    const [groupedData, setGroupedData] = useState<GroupedImpagat[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
    const t = translations[language];

    const fetchData = async () => {
      setLoading(true);
      let query = supabase
        .from('impagats')
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
        console.error('Error fetching impagats:', error);
      } else {
        const impagats = data as Impagat[];
        const groups: { [key: string]: GroupedImpagat } = {};

        impagats.forEach(item => {
          const clientName = item.client || 'Sense Client';
          if (!groups[clientName]) {
            groups[clientName] = {
              client: clientName,
              total: 0,
              items: []
            };
          }
          groups[clientName].total += item.import;
          groups[clientName].items.push(item);
        });

        setGroupedData(Object.values(groups).sort((a, b) => b.total - a.total));
      }
      setLoading(false);
    };

    useImperativeHandle(ref, () => ({
      fetchData
    }));

  useEffect(() => {
    fetchData();
  }, []);

  const toggleClient = (client: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(client)) {
      newExpanded.delete(client);
    } else {
      newExpanded.add(client);
    }
    setExpandedClients(newExpanded);
  };

  const filteredGroups = groupedData.filter(group => 
    group.client.toLowerCase().includes(search.toLowerCase()) ||
    group.items.some(item => 
      (item.observacions?.toLowerCase() || '').includes(search.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="w-6 h-6 border-2 border-[#464971] border-t-transparent rounded-full animate-spin mb-2" />
        Carregant dades...
      </div>
    );
  }

    return (
      <div className="space-y-4">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t.common.search}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464971]/10 focus:border-[#464971] transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      {filteredGroups.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 italic">
          {search ? "No s'han trobat resultats per a la cerca" : "No s'han trobat impagats"}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map(group => (
            <div key={group.client} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
              <div
                onClick={() => toggleClient(group.client)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#464971]/10 rounded-xl flex items-center justify-center text-[#464971]">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">{group.client}</h4>
                    <p className="text-xs text-gray-500">{group.items.length} {group.items.length === 1 ? 'registre' : 'registres'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Total Pendent</p>
                    <p className="text-lg font-bold text-[#464971]">{formatCurrency(group.total)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddImpagat?.(group.client);
                    }}
                    className="p-2 bg-[#464971] text-white rounded-xl hover:bg-[#3b3d5e] transition-all shadow-lg shadow-[#464971]/20 group/btn"
                    title="Afegir impagat per aquest client"
                  >
                    <Plus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </button>
                  {expandedClients.has(group.client) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedClients.has(group.client) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 bg-gray-50/30"
                  >
                    <div className="p-6 overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-gray-400 uppercase font-bold tracking-wider border-b border-gray-100">
                            <th className="text-left py-2 px-3 text-[10px]">Data</th>
                            <th className="text-right py-2 px-3 text-[10px]">Import</th>
                            <th className="text-left py-2 px-3 text-[10px]">Observacions</th>
                            <th className="text-center py-2 px-3 text-[10px]">Estat</th>
                            <th className="text-left py-2 px-3 text-[10px]">Tipus Pagament</th>
                            <th className="text-left py-2 px-3 text-[10px]">Data Pagament</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.items.map(item => (
                            <tr 
                              key={item.id} 
                              className="hover:bg-white transition-colors cursor-pointer group/row"
                              onClick={() => onEditImpagat?.(item)}
                            >
                              <td className="py-3 px-3 text-gray-600 text-xs">{formatDate(item.fecha)}</td>
                              <td className="py-3 px-3 text-right font-medium text-gray-900 text-xs">{formatCurrency(item.import)}</td>
                              <td className="py-3 px-3 text-gray-500 italic text-xs truncate max-w-[150px]">{item.observacions || '-'}</td>
                              <td className="py-3 px-3 text-center">
                                {item.pagat ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold tracking-wider">PAGAT</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-bold tracking-wider">PENDENT</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-gray-600 text-xs">{item.tipus_pagament || '-'}</td>
                              <td className="py-3 px-3 text-gray-600 text-xs">{item.fecha_pagament ? formatDate(item.fecha_pagament) : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
});

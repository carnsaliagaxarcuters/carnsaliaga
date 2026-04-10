import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { translations, Language } from '../lib/translations';
import { Search, Plus, Trash2, Edit2, Save, X, ChevronRight, Settings2, UserPlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OptionManager } from './OptionManager';

export interface DataTableRef<T> {
  openPanel: (item?: Partial<T> | null) => void;
  fetchData: () => void;
  getSelectedItems?: () => T[];
  refreshOptions?: () => void;
}

interface Column<T> {
  key: keyof T;
  header: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  currency?: boolean;
  hiddenInForm?: boolean;
  readOnly?: boolean;
  foreignTable?: string;
  foreignLabel?: string;
}

interface DataTableProps<T> {
  tableName: string;
  columns: Column<T>[];
  language: Language;
  onDataChange?: () => void;
  hideTable?: boolean;
  filterColumn?: keyof T;
  filterValue?: any;
  selectable?: boolean;
  defaultSelectedAll?: boolean;
  onAddForeign?: (columnKey: keyof T) => void;
}

export const DataTable = forwardRef(<T extends { id: string }>(
  { tableName, columns, language, onDataChange, hideTable, filterColumn, filterValue, selectable, defaultSelectedAll, onAddForeign }: DataTableProps<T>,
  ref: React.Ref<DataTableRef<T>>
) => {
  const [data, setData] = useState<T[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<T> | null>(null);
  const [originalItem, setOriginalItem] = useState<Partial<T> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<{ [key: string]: string[] }>({});
  const [optionManagerConfig, setOptionManagerConfig] = useState<{ isOpen: boolean; columnKey: string } | null>(null);
  const [quickAddConfig, setQuickAddConfig] = useState<{ isOpen: boolean; column: Column<T> } | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');
  const t = translations[language];

  useEffect(() => {
    fetchDynamicOptions();
  }, [columns]);

  const fetchDynamicOptions = async () => {
    const optionsMap: { [key: string]: string[] } = {};

    // Fetch from config_options
    const { data: configData } = await supabase
      .from('config_options')
      .select('*')
      .eq('table_name', tableName);

    if (configData) {
      configData.forEach(item => {
        optionsMap[item.column_name] = item.options;
      });
    }

    // Fetch from foreign tables
    for (const col of columns) {
      if (col.foreignTable) {
        const { data: foreignData } = await supabase
          .from(col.foreignTable)
          .select(col.foreignLabel || 'nom')
          .order(col.foreignLabel || 'nom');
        
        if (foreignData) {
          optionsMap[String(col.key)] = foreignData.map(item => item[col.foreignLabel || 'nom']);
        }
      }
    }

    setDynamicOptions(optionsMap);
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from(tableName).select('*');

    if (filterColumn && filterValue !== undefined && filterValue !== null) {
      const column = columns.find(c => c.key === filterColumn);
      
      if (column?.type === 'date' && typeof filterValue === 'string' && filterValue.includes('%')) {
        // Handle date prefix filtering (e.g. "2026-04%") for DATE columns
        const prefix = filterValue.replace('%', '');
        if (prefix.length === 7) { // YYYY-MM format
          const start = `${prefix}-01`;
          const [year, month] = prefix.split('-').map(Number);
          const end = month === 12 
            ? `${year + 1}-01-01` 
            : `${year}-${String(month + 1).padStart(2, '0')}-01`;
          query = query.gte(String(filterColumn), start).lt(String(filterColumn), end);
        } else {
          query = query.eq(String(filterColumn), prefix);
        }
      } else if (typeof filterValue === 'string' && filterValue.includes('%')) {
        query = query.ilike(String(filterColumn), filterValue);
      } else {
        query = query.eq(String(filterColumn), filterValue);
      }
    }

    const hasFecha = columns.some(c => c.key === 'fecha');
    if (hasFecha) {
      query = query.order('fecha', { ascending: false });
    }
    const { data: result, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
    } else {
      setData(result as T[]);
      if (selectable && defaultSelectedAll) {
        setSelectedIds(new Set((result as T[]).map(item => item.id)));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tableName, filterValue]);

  useEffect(() => {
    const updateTotals = async () => {
      if (tableName === 'registros' && editingItem?.fecha) {
        // Sum of impagats generated on this date
        const { data: impagatsData } = await supabase
          .from('impagats')
          .select('import')
          .eq('fecha', editingItem.fecha);
        
        // Sum of impagats paid on this date
        const { data: pagatsData } = await supabase
          .from('impagats')
          .select('import')
          .eq('fecha_pagament', editingItem.fecha);

        const totalImpagats = (impagatsData || []).reduce((sum, item) => sum + Number(item.import), 0);
        const totalPagats = (pagatsData || []).reduce((sum, item) => sum + Number(item.import), 0);

        // Only update if values are different to avoid loops
        if (totalImpagats !== (editingItem as any).impagats || totalPagats !== (editingItem as any).pagats) {
          setEditingItem(prev => {
            if (!prev) return prev;
            const newValues = {
              ...prev,
              impagats: totalImpagats,
              pagats: totalPagats
            };
            const caixa = Number((newValues as any).caixa || 0);
            const proveidors = Number((newValues as any).proveidors || 0);
            (newValues as any).total = caixa + totalPagats - totalImpagats - proveidors;
            return newValues;
          });
        }
      }
    };

    updateTotals();
  }, [editingItem?.fecha, tableName]);

  useImperativeHandle(ref, () => ({
    openPanel: handleOpenPanel,
    fetchData,
    getSelectedItems: () => data.filter(item => selectedIds.has(item.id)),
    refreshOptions: fetchDynamicOptions
  }));

  const handleOpenPanel = (item: Partial<T> | null = null) => {
    if (item) {
      setEditingItem({ ...item });
      setOriginalItem({ ...item });
    } else {
      setOriginalItem(null);
      const newItem: any = {};
      columns.forEach(col => {
        if (col.key === 'empresa') newItem[col.key] = 'Carns Aliaga';
        else if (col.type === 'number') newItem[col.key] = 0;
        else if (col.type === 'boolean') newItem[col.key] = false;
        else if (col.type === 'date') {
          // Only default 'fecha' to today, others empty
          if (col.key === 'fecha') {
            newItem[col.key] = new Date().toISOString().split('T')[0];
          } else {
            newItem[col.key] = null;
          }
        }
        else newItem[col.key] = '';
      });
      setEditingItem(newItem);
    }
    setIsPanelOpen(true);
  };

  const syncRegistros = async (dates: string[]) => {
    const uniqueDates = Array.from(new Set(dates.filter(Boolean)));
    
    for (const date of uniqueDates) {
      // 1. Get total impagats for this date
      const { data: impagatsData } = await supabase
        .from('impagats')
        .select('import')
        .eq('fecha', date);
      
      // 2. Get total pagats for this date
      const { data: pagatsData } = await supabase
        .from('impagats')
        .select('import')
        .eq('fecha_pagament', date);

      const totalImpagats = (impagatsData || []).reduce((sum, item) => sum + Number(item.import), 0);
      const totalPagats = (pagatsData || []).reduce((sum, item) => sum + Number(item.import), 0);

      // 3. Find and update the registro
      const { data: registro } = await supabase
        .from('registros')
        .select('*')
        .eq('fecha', date)
        .single();

      if (registro) {
        const caixa = Number(registro.caixa || 0);
        const proveidors = Number(registro.proveidors || 0);
        const newTotal = caixa + totalPagats - totalImpagats - proveidors;

        await supabase
          .from('registros')
          .update({
            impagats: totalImpagats,
            pagats: totalPagats,
            total: newTotal
          })
          .eq('id', registro.id);
      }
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;

    // Sanitize data: convert empty strings to null for date columns to avoid Postgres error 22007
    const sanitizedItem = { ...editingItem };
    columns.forEach(col => {
      if (col.type === 'date' && sanitizedItem[col.key] === '') {
        sanitizedItem[col.key] = null;
      }
    });

    const isNew = !sanitizedItem.id;
    const { error } = isNew 
      ? await supabase.from(tableName).insert([sanitizedItem])
      : await supabase.from(tableName).update(sanitizedItem).eq('id', sanitizedItem.id);

    if (error) {
      console.error('Error saving:', error);
    } else {
      // Sync logic for impagats
      if (tableName === 'impagats') {
        const datesToSync = [
          (sanitizedItem as any).fecha,
          (sanitizedItem as any).fecha_pagament,
          (originalItem as any)?.fecha,
          (originalItem as any)?.fecha_pagament
        ];
        await syncRegistros(datesToSync);
      }

      setIsPanelOpen(false);
      setEditingItem(null);
      setOriginalItem(null);
      fetchData();
      onDataChange?.();
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddConfig || !quickAddValue.trim()) return;
    
    const { column } = quickAddConfig;
    const labelKey = column.foreignLabel || 'nom';
    
    const { data: newItem, error } = await supabase
      .from(column.foreignTable!)
      .insert({ [labelKey]: quickAddValue.trim() })
      .select()
      .single();

    if (error) {
      console.error('Error in quick add:', error);
    } else {
      await fetchDynamicOptions();
      handleInputChange(column.key, newItem[labelKey]);
      setQuickAddConfig(null);
      setQuickAddValue('');
    }
  };

  const handleInputChange = (key: keyof T, value: any) => {
    if (!editingItem) return;
    
    const column = columns.find(c => c.key === key);
    const sanitizedValue = (column?.type === 'date' && value === '') ? null : value;
    let newValues: any = { ...editingItem, [key]: sanitizedValue };
    
    // Auto-fill logic for 'registros' table
    if (tableName === 'registros') {
      if (key === 'fecha') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const days = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
          const months = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
          
          newValues.anio = date.getFullYear();
          newValues.mes = months[date.getMonth()];
          newValues.dia_setmana = days[date.getDay()];
          newValues.dia = date.getDate();
          
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          newValues.semana = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        }
      }

      // Calculate total: Caixa + pagats - impagats - proveidors
      const caixa = Number(key === 'caixa' ? value : (newValues.caixa || 0));
      const pagats = Number(key === 'pagats' ? value : (newValues.pagats || 0));
      const impagats = Number(key === 'impagats' ? value : (newValues.impagats || 0));
      const proveidors = Number(key === 'proveidors' ? value : (newValues.proveidors || 0));
      
      newValues.total = caixa + pagats - impagats - proveidors;
    }

    // Auto-paid logic for 'impagats' table
    if (tableName === 'impagats') {
      // 1. If payment type is selected
      if (key === 'tipus_pagament' && value) {
        newValues.pagat = true;
        if (!newValues.fecha_pagament) {
          newValues.fecha_pagament = new Date().toISOString().split('T')[0];
        }
      }
      
      // 2. If payment date is selected
      if (key === 'fecha_pagament' && value) {
        newValues.pagat = true;
      }
      
      // 3. If 'pagat' is manually toggled
      if (key === 'pagat') {
        if (value === true) {
          if (!newValues.fecha_pagament) {
            newValues.fecha_pagament = new Date().toISOString().split('T')[0];
          }
        } else {
          newValues.fecha_pagament = null;
          newValues.tipus_pagament = null;
        }
      }
    }
    
    setEditingItem(newValues);
  };

  const handleDelete = async (id: string) => {
    // For sync, we need the item before deleting
    let itemToDelete: any = null;
    if (tableName === 'impagats') {
      const { data } = await supabase.from(tableName).select('*').eq('id', id).single();
      itemToDelete = data;
    }

    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      console.error('Error deleting:', error);
    } else {
      if (tableName === 'impagats' && itemToDelete) {
        await syncRegistros([itemToDelete.fecha, itemToDelete.fecha_pagament]);
      }
      setDeleteConfirmId(null);
      fetchData();
      onDataChange?.();
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-4 relative">
      {!hideTable && (
        <>
          {/* Top Bar */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.common.search}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464971]/10 focus:border-[#464971] transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleOpenPanel()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#464971] text-white rounded-xl hover:bg-[#3b3d5e] transition-all font-semibold shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {t.add_buttons?.[tableName as keyof typeof t.add_buttons] || t.common.new_row}
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    {selectable && (
                      <th className="px-3 py-2.5 w-10 text-center">
                        <button
                          onClick={toggleAll}
                          className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors mx-auto",
                            selectedIds.size === filteredData.length && filteredData.length > 0 ? "border-[#464971]" : "border-gray-300"
                          )}
                        >
                          {selectedIds.size === filteredData.length && filteredData.length > 0 && <div className="w-2 h-2 rounded-full bg-[#464971]" />}
                        </button>
                      </th>
                    )}
                    {columns.map(col => (
                      <th key={String(col.key)} className="px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wider text-[9px]">
                        {col.header}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wider text-[9px] text-right">
                      {t.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <div className="w-6 h-6 border-2 border-[#464971] border-t-transparent rounded-full animate-spin" />
                          {t.common.loading}
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + (selectable ? 2 : 1)} className="px-6 py-12 text-center text-gray-400 italic">
                        No s'han trobat registres
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(row => (
                      <tr 
                        key={row.id} 
                        onClick={() => handleOpenPanel(row)}
                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      >
                        {selectable && (
                          <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleSelection(row.id)}
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors mx-auto",
                                selectedIds.has(row.id) ? "border-[#464971]" : "border-gray-300"
                              )}
                            >
                              {selectedIds.has(row.id) && <div className="w-2 h-2 rounded-full bg-[#464971]" />}
                            </button>
                          </td>
                        )}
                        {columns.map(col => (
                          <td key={String(col.key)} className="px-3 py-2 whitespace-nowrap">
                            <div className={cn(
                              "text-gray-600 font-normal text-xs",
                              col.type === 'number' && "text-right",
                              col.type === 'boolean' && "text-center"
                            )}>
                              {col.currency
                                ? formatCurrency(Number(row[col.key]))
                                : col.type === 'date'
                                ? formatDate(String(row[col.key]))
                                : col.type === 'boolean'
                                ? (row[col.key] 
                                    ? (tableName === 'impagats' || tableName === 'nominas'
                                        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold tracking-wider">PAGAT</span>
                                        : <Check className="w-4 h-4 text-green-600 mx-auto" />
                                      )
                                    : (tableName === 'impagats' || tableName === 'nominas'
                                        ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-bold tracking-wider">PENDENT</span>
                                        : null
                                      )
                                  )
                                : col.key === 'empresa' 
                                ? (String(row[col.key] || 'Carns Aliaga'))
                                : String(row[col.key] || '')}
                            </div>
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            {deleteConfirmId === row.id ? (
                              <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-100 animate-in fade-in zoom-in duration-200">
                                <span className="text-[9px] font-bold text-red-600 mr-1">SEGUR?</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                                  className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded hover:bg-red-700 transition-colors"
                                >
                                  SÍ
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                  className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[9px] font-bold rounded hover:bg-gray-300 transition-colors"
                                >
                                  NO
                                </button>
                              </div>
                            ) : (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(row.id); }}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Side Panel (Sheet) */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingItem?.id ? 'Editar Registre' : 'Nou Registre'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Completa els detalls a continuació</p>
                </div>
                <button 
                  onClick={() => setIsPanelOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-transparent hover:border-gray-200"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {columns.filter(col => !col.hiddenInForm).map(col => (
                  <div key={String(col.key)} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                      {col.header}
                    </label>
                    {col.type === 'select' ? (
                      <div className="flex gap-2">
                        <select
                          value={String(editingItem?.[col.key] || '')}
                          disabled={col.readOnly}
                          onChange={(e) => handleInputChange(col.key, e.target.value)}
                          className={cn(
                            "flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464971]/10 focus:border-[#464971] transition-all text-sm",
                            col.readOnly && "opacity-60 cursor-not-allowed bg-gray-100"
                          )}
                        >
                          <option value="">Selecciona...</option>
                          {(dynamicOptions[String(col.key)] || col.options)?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {tableName === 'clientes' && col.key === 'tipo' && (
                          <button
                            onClick={() => setOptionManagerConfig({ isOpen: true, columnKey: String(col.key) })}
                            className="p-2.5 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-colors text-gray-500"
                            title="Gestionar opcions"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                        )}
                        {col.foreignTable && (
                          <button
                            onClick={() => {
                              if (onAddForeign) {
                                onAddForeign(col.key);
                              } else {
                                setQuickAddConfig({ isOpen: true, column: col });
                              }
                            }}
                            className="p-2.5 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-colors text-gray-500"
                            title={`Afegir nou ${col.foreignTable}`}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : col.type === 'boolean' ? (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <input
                          type="checkbox"
                          id={String(col.key)}
                          disabled={col.readOnly}
                          className={cn(
                            "w-5 h-5 rounded border-gray-300 text-[#464971] focus:ring-[#464971]",
                            col.readOnly && "opacity-60 cursor-not-allowed"
                          )}
                          checked={Boolean(editingItem?.[col.key])}
                          onChange={(e) => {
                            handleInputChange(col.key, e.target.checked);
                          }}
                        />
                        <label htmlFor={String(col.key)} className="text-sm text-gray-700 font-medium">
                          {col.header} completat
                        </label>
                      </div>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                        readOnly={col.readOnly}
                        className={cn(
                          "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464971]/10 focus:border-[#464971] transition-all text-sm",
                          col.readOnly && "opacity-60 cursor-not-allowed bg-gray-100"
                        )}
                        value={String(editingItem?.[col.key] ?? '')}
                        onChange={(e) => {
                          if (col.readOnly) return;
                          const val = col.type === 'number' ? Number(e.target.value) : col.type === 'boolean' ? e.target.checked : e.target.value;
                          handleInputChange(col.key, val);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-white transition-all active:scale-95"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 bg-[#464971] text-white rounded-xl font-bold text-sm hover:bg-[#3b3d5e] shadow-lg shadow-[#464971]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.common.save}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {optionManagerConfig && (
        <OptionManager
          isOpen={optionManagerConfig.isOpen}
          onClose={() => setOptionManagerConfig(null)}
          tableName={tableName}
          columnName={optionManagerConfig.columnKey}
          onUpdate={(newOptions) => {
            setDynamicOptions(prev => ({ ...prev, [optionManagerConfig.columnKey]: newOptions }));
          }}
        />
      )}

      <AnimatePresence>
        {quickAddConfig?.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickAddConfig(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[70] overflow-hidden border border-gray-100"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-sm">Afegir Nou {quickAddConfig.column.foreignTable === 'clientes' ? 'Client' : quickAddConfig.column.foreignTable}</h3>
                <button onClick={() => setQuickAddConfig(null)} className="p-1 hover:bg-white rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    {quickAddConfig.column.header}
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={quickAddValue}
                    onChange={(e) => setQuickAddValue(e.target.value)}
                    placeholder={`Nom del nou ${quickAddConfig.column.foreignTable === 'clientes' ? 'client' : 'element'}...`}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464971]/10 focus:border-[#464971] transition-all text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                  />
                </div>
                <button
                  onClick={handleQuickAdd}
                  className="w-full py-3 bg-[#464971] text-white rounded-xl font-bold text-sm hover:bg-[#3b3d5e] transition-all shadow-lg shadow-[#464971]/20"
                >
                  Crear i Seleccionar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

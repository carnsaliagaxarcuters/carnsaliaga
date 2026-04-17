import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Language, translations } from '../lib/translations';
import { Treballador, Horari } from '../types';
import { ChevronLeft, ChevronRight, Clock, Save, X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';

// Helper to get start of week (Monday)
function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Add days to a date
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Format date to YYYY-MM-DD
function formatIso(date: Date) {
  return date.toISOString().split('T')[0];
}

// Calculate hours between two time strings (HH:mm)
function calculateHours(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  const startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;
  
  if (endTotalMinutes < startTotalMinutes) {
    // Passes midnight
    endTotalMinutes += 24 * 60;
  }
  
  return (endTotalMinutes - startTotalMinutes) / 60;
}

interface ScheduleManagerProps {
  language: Language;
  empresaContext?: string;
}

export function ScheduleManager({ language, empresaContext }: ScheduleManagerProps) {
  const t = translations[language];
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [treballadors, setTreballadors] = useState<Treballador[]>([]);
  const [horaris, setHoraris] = useState<Horari[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{
    treballadorId: string;
    fecha: string;
    matiStart: string;
    matiEnd: string;
    tardaStart: string;
    tardaEnd: string;
  } | null>(null);

  const fetchScheduleData = async () => {
    setLoading(true);
    // Fetch workers
    let workersQuery = supabase.from('treballadors').select('*').order('nom');
    if (empresaContext && empresaContext !== 'Totes') {
      workersQuery = workersQuery.eq('empresa', empresaContext);
    }
    const { data: workersData, error: workersError } = await workersQuery;
    if (!workersError && workersData) {
      setTreballadors(workersData);
    }

    // Fetch schedules for the current week
    const endOfWeek = formatIso(addDays(currentWeekStart, 6));
    let schedulesQuery = supabase
      .from('horaris')
      .select('*')
      .gte('fecha', formatIso(currentWeekStart))
      .lte('fecha', endOfWeek);
      
    if (empresaContext && empresaContext !== 'Totes') {
      schedulesQuery = schedulesQuery.eq('empresa', empresaContext);
    }
    
    const { data: schedulesData, error: schedulesError } = await schedulesQuery;
    if (!schedulesError && schedulesData) {
      setHoraris(schedulesData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScheduleData();
  }, [currentWeekStart, empresaContext]);

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));

  const openEditor = (treballador: Treballador, date: Date) => {
    const fechaStr = formatIso(date);
    const existing = horaris.find(h => h.treballador_id === treballador.id && h.fecha === fechaStr);
    setEditingCell({
      treballadorId: treballador.id,
      fecha: fechaStr,
      matiStart: existing?.entrada_mati || '',
      matiEnd: existing?.sortida_mati || '',
      tardaStart: existing?.entrada_tarda || '',
      tardaEnd: existing?.sortida_tarda || ''
    });
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;
    
    const existingIndex = horaris.findIndex(
      h => h.treballador_id === editingCell.treballadorId && h.fecha === editingCell.fecha
    );
    
    const payload = {
      treballador_id: editingCell.treballadorId,
      fecha: editingCell.fecha,
      entrada_mati: editingCell.matiStart || null,
      sortida_mati: editingCell.matiEnd || null,
      entrada_tarda: editingCell.tardaStart || null,
      sortida_tarda: editingCell.tardaEnd || null,
      empresa: empresaContext !== 'Totes' ? (empresaContext || 'CARNS ALIAGA') : 'CARNS ALIAGA'
    };

    let newHorari;
    if (existingIndex >= 0) {
      const existing = horaris[existingIndex];
      const { data, error } = await supabase
        .from('horaris')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (!error && data) {
        newHorari = data;
        const newHoraris = [...horaris];
        newHoraris[existingIndex] = data;
        setHoraris(newHoraris);
      }
    } else {
      const { data, error } = await supabase
        .from('horaris')
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        newHorari = data;
        setHoraris([...horaris, data]);
      }
    }
    
    setEditingCell(null);
  };

  const getDayLabel = (date: Date) => {
    return date.toLocaleDateString(language === 'ca' ? 'ca-ES' : 'es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{(t as any).horaris?.titol || 'Horarios'}</h2>
            <p className="text-gray-500 text-sm">{(t as any).horaris?.subtitol || 'Planificación Semanal'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-700 min-w-[140px] text-center">
            {currentWeekStart.toLocaleDateString(language === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'short' })} 
            {' - '}
            {addDays(currentWeekStart, 6).toLocaleDateString(language === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'short' })}
          </span>
          <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600 w-48 sticky left-0 bg-gray-50/90 backdrop-blur z-10 border-r border-gray-100">
                  Trabajador
                </th>
                {weekDays.map((date, i) => (
                  <th key={i} className="px-2 py-3 font-semibold text-gray-600 text-center min-w-[120px] border-r border-gray-100 last:border-r-0">
                    <div className="capitalize">{getDayLabel(date)}</div>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-32 border-l border-gray-100">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : treballadors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No hi ha treballadors
                  </td>
                </tr>
              ) : (
                treballadors.map((treballador) => {
                  let totalWeekHours = 0;
                  
                  return (
                    <tr key={treballador.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 border-r border-gray-100 shadow-[1px_0_0_0_#f3f4f6]">
                        {treballador.nom}
                        <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                          {treballador.tipus_contracte} {treballador.hores_contractades ? `(${treballador.hores_contractades}h)` : ''}
                        </div>
                      </td>
                      {weekDays.map((date, i) => {
                        const fechaStr = formatIso(date);
                        const h = horaris.find(x => x.treballador_id === treballador.id && x.fecha === fechaStr);
                        
                        const matiHours = calculateHours(h?.entrada_mati || null, h?.sortida_mati || null);
                        const tardaHours = calculateHours(h?.entrada_tarda || null, h?.sortida_tarda || null);
                        const dailyTotal = matiHours + tardaHours;
                        totalWeekHours += dailyTotal;
                        
                        return (
                          <td 
                            key={i} 
                            className="px-2 py-2 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-blue-50/50 transition-colors"
                            onClick={() => openEditor(treballador, date)}
                          >
                            <div className="flex flex-col items-center justify-center gap-1 min-h-[40px]">
                              {dailyTotal > 0 ? (
                                <>
                                  {h?.entrada_mati && h?.sortida_mati && (
                                    <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-medium">
                                      M: {h.entrada_mati}-{h.sortida_mati}
                                    </span>
                                  )}
                                  {h?.entrada_tarda && h?.sortida_tarda && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                                      T: {h.entrada_tarda}-{h.sortida_tarda}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-gray-500 font-semibold">{dailyTotal} {(t as any).horaris?.hores || 'h'}</span>
                                </>
                              ) : (
                                <span className="text-gray-300 text-sm">-</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border-l border-gray-100 bg-gray-50/30">
                        <div className={cn(
                          "inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-bold",
                          treballador.hores_contractades && totalWeekHours > treballador.hores_contractades
                            ? "bg-red-100 text-red-700"
                            : totalWeekHours > 0 ? "bg-emerald-100 text-emerald-700" : "text-gray-500"
                        )}>
                          {totalWeekHours} {treballador.hores_contractades ? `/ ${treballador.hores_contractades}` : ''}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2 border-gray-100 w-full flex justify-between items-center">
                <span>{(t as any).horaris?.editar_torn || 'Editar Turno'}</span>
                <span className="text-sm font-normal text-gray-500">{editingCell.fecha}</span>
              </h3>
            </div>
            
            <div className="space-y-5">
              <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 space-y-3">
                <label className="text-xs font-bold text-orange-800 uppercase tracking-wider block">Turno Mañana</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Entrada</label>
                    <input 
                      type="time" 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      value={editingCell.matiStart}
                      onChange={e => setEditingCell({...editingCell, matiStart: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Salida</label>
                    <input 
                      type="time" 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      value={editingCell.matiEnd}
                      onChange={e => setEditingCell({...editingCell, matiEnd: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-3">
                <label className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Turno Tarde</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Entrada</label>
                    <input 
                      type="time" 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      value={editingCell.tardaStart}
                      onChange={e => setEditingCell({...editingCell, tardaStart: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Salida</label>
                    <input 
                      type="time" 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      value={editingCell.tardaEnd}
                      onChange={e => setEditingCell({...editingCell, tardaEnd: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setEditingCell(null)}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
              >
                {t.common.cancel}
              </button>
              <button 
                onClick={handleSaveCell}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

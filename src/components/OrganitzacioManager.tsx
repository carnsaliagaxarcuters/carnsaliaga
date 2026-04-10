import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Language, translations } from '../lib/translations';
import { Treballador, Horari } from '../types';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DataTable, DataTableRef } from './DataTable';

interface OrganitzacioManagerProps {
  language: Language;
}

const SHIFT_TYPES = [
  { id: 'M', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'T', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'J', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'D', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'V', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'F', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'B', color: 'bg-red-100 text-red-800 border-red-200' },
] as const;

export function OrganitzacioManager({ language }: OrganitzacioManagerProps) {
  const [view, setView] = useState<'calendar' | 'workers'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [treballadors, setTreballadors] = useState<Treballador[]>([]);
  const [horaris, setHoraris] = useState<Horari[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ treballadorId: string, date: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const t = translations[language];
  const workersTableRef = useRef<DataTableRef<Treballador>>(null);

  // Get Monday of the current week
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  const weekStart = getMonday(currentDate);
  const weekDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchSchedules = async () => {
    if (view !== 'calendar') return;
    setLoading(true);
    try {
      // Fetch workers
      const { data: workersData, error: workersError } = await supabase
        .from('treballadors')
        .select('*')
        .order('nom');
      
      if (workersError) throw workersError;
      setTreballadors(workersData || []);

      // Fetch schedules for the week
      const startDateStr = weekDays[0].toISOString().split('T')[0];
      const endDateStr = weekDays[13].toISOString().split('T')[0];

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('horaris')
        .select('*')
        .gte('fecha', startDateStr)
        .lte('fecha', endDateStr);

      if (schedulesError) throw schedulesError;
      setHoraris(schedulesData || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentDate, view]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 14);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 14);
    setCurrentDate(newDate);
  };

  const getShiftForCell = (treballadorId: string, dateStr: string) => {
    return horaris.find(h => h.treballador_id === treballadorId && h.fecha === dateStr);
  };

  const handleSetShift = async (torn: string) => {
    if (!selectedCell) return;
    setIsSaving(true);

    try {
      const existingShift = getShiftForCell(selectedCell.treballadorId, selectedCell.date);

      if (existingShift) {
        if (torn === '') {
          // Delete
          await supabase.from('horaris').delete().eq('id', existingShift.id);
          setHoraris(horaris.filter(h => h.id !== existingShift.id));
        } else {
          // Update
          await supabase.from('horaris').update({ torn }).eq('id', existingShift.id);
          setHoraris(horaris.map(h => h.id === existingShift.id ? { ...h, torn } : h));
        }
      } else if (torn !== '') {
        // Insert
        const { data, error } = await supabase.from('horaris').insert({
          treballador_id: selectedCell.treballadorId,
          fecha: selectedCell.date,
          torn
        }).select().single();

        if (error) throw error;
        if (data) setHoraris([...horaris, data]);
      }
    } catch (error: any) {
      console.error('Error saving shift:', error);
      alert(language === 'ca' ? `Error al guardar: ${error.message}` : `Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
      setSelectedCell(null);
    }
  };

  const formatDayName = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ca' ? 'ca-ES' : 'es-ES', { weekday: 'short' }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'short' }).format(date);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {language === 'ca' ? 'Organització' : 'Organización'}
          </h2>
          <p className="text-gray-500 text-sm">
            {language === 'ca' ? 'Gestió de torns i treballadors' : 'Gestión de turnos y trabajadores'}
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setView('calendar')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === 'calendar' ? "bg-white text-[#464971] shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            {language === 'ca' ? 'Calendari' : 'Calendario'}
          </button>
          <button
            onClick={() => setView('workers')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === 'workers' ? "bg-white text-[#464971] shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Users className="w-4 h-4" />
            {language === 'ca' ? 'Treballadors' : 'Trabajadores'}
          </button>
        </div>
      </header>

      {view === 'calendar' ? (
        <>
          <div className="flex justify-end">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2 px-4 font-medium text-gray-700 min-w-[160px] justify-center">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                <span className="capitalize text-sm">
                  {formatDate(weekDays[0])} - {formatDate(weekDays[13])}
                </span>
              </div>
              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : treballadors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>{language === 'ca' ? 'No hi ha treballadors registrats.' : 'No hay trabajadores registrados.'}</p>
                <button 
                  onClick={() => setView('workers')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
                >
                  {language === 'ca' ? 'Afegir Treballadors' : 'Añadir Trabajadores'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600 w-32 sticky left-0 bg-gray-50 z-10 border-r border-gray-200 text-xs">
                        {language === 'ca' ? 'Treballador' : 'Trabajador'}
                      </th>
                      {weekDays.map((date, i) => (
                        <th key={i} className="px-1 py-2 font-medium text-center min-w-[36px] border-r border-gray-200 last:border-r-0">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="uppercase text-[10px] font-bold text-gray-400 tracking-tighter">
                              {new Intl.DateTimeFormat(language === 'ca' ? 'ca-ES' : 'es-ES', { weekday: 'short' }).format(date).slice(0, 2)}
                            </span>
                            <span className={cn(
                              "text-xs",
                              date.toDateString() === new Date().toDateString() ? "text-indigo-600 font-bold bg-indigo-50 w-5 h-5 rounded-full flex items-center justify-center" : "text-gray-700"
                            )}>
                              {date.getDate()}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {treballadors.map(treballador => (
                      <tr key={treballador.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 border-r border-gray-200 text-xs truncate max-w-[120px]">
                          {treballador.nom}
                        </td>
                        {weekDays.map((date, i) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const shift = getShiftForCell(treballador.id, dateStr);
                          const shiftType = shift ? SHIFT_TYPES.find(t => t.id === shift.torn) : null;
                          const isSelected = selectedCell?.treballadorId === treballador.id && selectedCell?.date === dateStr;

                          return (
                            <td key={i} className="px-0.5 py-1 text-center border-r border-gray-100 last:border-r-0">
                              <button
                                onClick={() => setSelectedCell({ treballadorId: treballador.id, date: dateStr })}
                                className={cn(
                                  "w-full h-8 rounded flex items-center justify-center transition-all text-xs font-bold",
                                  shiftType 
                                    ? cn(shiftType.color, "border")
                                    : "border border-transparent hover:border-gray-200 text-gray-300 hover:text-gray-500 hover:bg-gray-50",
                                  isSelected && "ring-2 ring-indigo-500 ring-offset-1"
                                )}
                              >
                                {shiftType ? shiftType.id : '-'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {language === 'ca' ? 'Llegenda de Torns' : 'Leyenda de Turnos'}
            </h4>
            <div className="flex flex-wrap gap-3">
              {SHIFT_TYPES.map(type => (
                <div key={type.id} className="flex items-center gap-2">
                  <div className={cn("w-6 h-6 rounded flex items-center justify-center text-xs font-bold border", type.color)}>
                    {type.id}
                  </div>
                  <span className="text-sm text-gray-600">{t.torns[type.id as keyof typeof t.torns]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed Modal for Shift Selection */}
          <AnimatePresence>
            {selectedCell && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
                onClick={() => setSelectedCell(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 w-full max-w-xs"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-4 text-center">
                    {language === 'ca' ? 'Assignar Torn' : 'Asignar Turno'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {SHIFT_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => handleSetShift(type.id)}
                        disabled={isSaving}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors border",
                          type.color,
                          "hover:brightness-95 active:scale-95"
                        )}
                      >
                        <span className="w-6 h-6 rounded bg-white/50 flex items-center justify-center shrink-0 text-sm">
                          {type.id}
                        </span>
                        <span className="truncate">{t.torns[type.id as keyof typeof t.torns]}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => handleSetShift('')}
                      disabled={isSaving}
                      className="col-span-2 mt-2 px-3 py-3 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
                    >
                      {language === 'ca' ? 'Netejar / Esborrar' : 'Limpiar / Borrar'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <DataTable<Treballador>
          ref={workersTableRef}
          tableName="treballadors"
          language={language}
          columns={[
            { key: 'nom', header: t.treballadors.nom, type: 'text' },
            { key: 'dni', header: t.treballadors.dni, type: 'text' },
            { key: 'fecha_naixement', header: t.treballadors.fecha_naixement, type: 'date' },
            { key: 'direccio', header: t.treballadors.direccio, type: 'text' },
            { key: 'num_ss', header: t.treballadors.num_ss, type: 'text' },
            { key: 'tipus_contracte', header: t.treballadors.tipus_contracte, type: 'select', options: ['Indefinit', 'Temporal', 'Pràctiques', 'Fix Discontinu'] },
          ]}
        />
      )}
    </div>
  );
}

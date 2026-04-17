import React, { useState, useRef, useEffect } from 'react';
import { DataTable, DataTableRef } from './DataTable';
import { Gasto, GastoPlantilla } from '../types';
import { Language, translations } from '../lib/translations';
import { supabase } from '../lib/supabase';
import { Download, FileText, Calendar, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface GastosManagerProps {
  language: Language;
  empresaContext?: string;
  proveidorsRef?: React.RefObject<DataTableRef<any>>;
}

export function GastosManager({ language, empresaContext, proveidorsRef }: GastosManagerProps) {
  const [view, setView] = useState<'monthly' | 'template'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const t = translations[language];
  const monthlyTableRef = useRef<DataTableRef<Gasto>>(null);
  const templateTableRef = useRef<DataTableRef<GastoPlantilla>>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const executeImportTemplate = async () => {
    setShowConfirmModal(false);
    setIsImporting(true);
    setNotification(null);

    try {
      // 1. Get selected template items from the table
      const templateItems = templateTableRef.current?.getSelectedItems?.() || [];
      
      if (!templateItems || templateItems.length === 0) {
        setNotification({
          type: 'error',
          message: language === 'ca' ? 'No hi ha despeses seleccionades a la plantilla.' : 'No hay gastos seleccionados en la plantilla.'
        });
        setIsImporting(false);
        return;
      }

      // 2. Prepare items for current month
      // Use today's date for the imported records as requested
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      const importMonth = today.slice(0, 7);
      
      const newGastos = templateItems.map(item => ({
        nom: item.nom,
        import: item.import,
        proveidor: item.proveidor,
        tipus: item.tipus,
        fecha: today
      }));

      // 3. Insert into gastos
      const { error: insertError } = await supabase
        .from('gastos')
        .insert(newGastos);

      if (insertError) throw insertError;

      // 4. Success feedback
      setNotification({
        type: 'success',
        message: language === 'ca' 
          ? `S'han importat ${newGastos.length} despeses al mes actual.` 
          : `Se han importado ${newGastos.length} gastos al mes actual.`
      });

      // 5. If the user is looking at a different month, switch automatically to see the results
      if (selectedMonth !== importMonth) {
        setSelectedMonth(importMonth);
      }

      // 6. Refresh table
      setTimeout(() => {
        monthlyTableRef.current?.fetchData();
      }, 500);

    } catch (error: any) {
      console.error('Error importing template:', error);
      setNotification({
        type: 'error',
        message: language === 'ca' 
          ? `Error: ${error.message || 'No s\'ha pogut importar'}` 
          : `Error: ${error.message || 'No se pudo importar'}`
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.sidebar.gastos}</h2>
          <p className="text-gray-500 text-sm">{t.subtitles.gastos}</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setView('monthly')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === 'monthly' ? "bg-white text-[#464971] shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Calendar className="w-4 h-4" />
            {t.gastos.mensual}
          </button>
          <button
            onClick={() => setView('template')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === 'template' ? "bg-white text-[#464971] shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <FileText className="w-4 h-4" />
            {t.gastos.plantilla}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border shadow-sm",
              notification.type === 'success' 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : "bg-red-50 border-red-100 text-red-800"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'monthly' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-end gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="space-y-1.5 flex-1 max-w-xs">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                {language === 'ca' ? 'Selecciona Mes' : 'Selecciona Mes'}
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464971]/10 focus:border-[#464971] transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isImporting}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 bg-[#464971] text-white rounded-xl hover:bg-[#3b3d5e] transition-all font-semibold shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                isImporting && "animate-pulse"
              )}
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t.gastos.importar}
            </button>
          </div>

          <AnimatePresence>
            {showConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {language === 'ca' ? 'Importar Plantilla' : 'Importar Plantilla'}
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    {language === 'ca' 
                      ? 'Estàs segur que vols importar la plantilla? Això crearà nous registres per al mes seleccionat.' 
                      : '¿Estás seguro de que quieres importar la plantilla? Esto creará nuevos registros para el mes seleccionado.'}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                    >
                      {language === 'ca' ? 'Cancel·lar' : 'Cancelar'}
                    </button>
                    <button 
                      onClick={executeImportTemplate}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      {language === 'ca' ? 'Importar' : 'Importar'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <DataTable<Gasto>
            ref={monthlyTableRef}
            tableName="gastos"
            language={language}
            empresaContext={empresaContext}
            filterColumn="fecha"
            filterValue={`${selectedMonth}%`}
            onAddForeign={(foreignTable) => {
              if (foreignTable === 'proveidor') {
                proveidorsRef?.current?.openPanel();
              }
            }}
            columns={[
              { key: 'fecha', header: t.gastos.fecha, type: 'date' },
              { key: 'nom', header: t.gastos.nom, type: 'text' },
              { key: 'import', header: t.gastos.import, type: 'number', currency: true },
              { key: 'proveidor', header: t.gastos.proveidor, type: 'select', foreignTable: 'proveidors', foreignLabel: 'nom' },
              { key: 'tipus', header: t.gastos.tipus, type: 'select', options: ['Mensual', 'Trimestral', 'Anual'] },
              { key: 'empresa', header: t.registre.empresa, type: 'select', options: ['CARNS ALIAGA', 'EMBOTITS', 'CARN'] },
            ]}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <p>
              {language === 'ca' 
                ? 'Pots desmarcar les despeses que no vulguis importar aquest mes. Per defecte, totes estan seleccionades.' 
                : 'Puedes desmarcar los gastos que no quieras importar este mes. Por defecto, todos están seleccionados.'}
            </p>
          </div>
          <DataTable<GastoPlantilla>
            ref={templateTableRef}
            tableName="gastos_plantilla"
            language={language}
            empresaContext={empresaContext}
            selectable={true}
            defaultSelectedAll={true}
            onAddForeign={(foreignTable) => {
              if (foreignTable === 'proveidor') {
                proveidorsRef?.current?.openPanel();
              }
            }}
            columns={[
              { key: 'nom', header: t.gastos.nom, type: 'text' },
              { key: 'import', header: t.gastos.import, type: 'number', currency: true },
              { key: 'proveidor', header: t.gastos.proveidor, type: 'select', foreignTable: 'proveidors', foreignLabel: 'nom' },
              { key: 'tipus', header: t.gastos.tipus, type: 'select', options: ['Mensual', 'Trimestral', 'Anual'] },
              { key: 'fecha_cobro', header: t.gastos.fecha_cobro, type: 'text' },
              { key: 'empresa', header: t.registre.empresa, type: 'select', options: ['CARNS ALIAGA', 'EMBOTITS', 'CARN'] },
            ]}
          />
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  columnName: string;
  onUpdate: (options: string[]) => void;
}

export function OptionManager({ isOpen, onClose, tableName, columnName, onUpdate }: OptionManagerProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('config_options')
      .select('options')
      .eq('table_name', tableName)
      .eq('column_name', columnName)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching options:', error);
    } else if (data) {
      setOptions(data.options || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newOption.trim()) return;
    const updatedOptions = [...options, newOption.trim()];
    
    const { error } = await supabase
      .from('config_options')
      .upsert({ 
        table_name: tableName, 
        column_name: columnName, 
        options: updatedOptions 
      }, { onConflict: 'table_name,column_name' });

    if (error) {
      console.error('Error saving option:', error);
    } else {
      setOptions(updatedOptions);
      setNewOption('');
      onUpdate(updatedOptions);
    }
  };

  const handleDelete = async (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    
    const { error } = await supabase
      .from('config_options')
      .upsert({ 
        table_name: tableName, 
        column_name: columnName, 
        options: updatedOptions 
      }, { onConflict: 'table_name,column_name' });

    if (error) {
      console.error('Error deleting option:', error);
    } else {
      setOptions(updatedOptions);
      onUpdate(updatedOptions);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[70] overflow-hidden border border-gray-100"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Gestionar Opcions</h3>
              <button onClick={onClose} className="p-1 hover:bg-white rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Nova opció..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#464971]/10 focus:border-[#464971]"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                  onClick={handleAdd}
                  className="p-2 bg-[#464971] text-white rounded-xl hover:bg-[#3b3d5e] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {loading ? (
                  <p className="text-center py-4 text-xs text-gray-400">Carregant...</p>
                ) : options.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-400 italic">No hi ha opcions</p>
                ) : (
                  options.map((opt, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                      <span className="text-xs text-gray-700">{opt}</span>
                      <button
                        onClick={() => handleDelete(i)}
                        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

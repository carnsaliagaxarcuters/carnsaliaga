import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Save, Edit2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Empresa, Treballador } from '../types';
import { DataTable } from './DataTable';
import { translations, Language } from '../lib/translations';

interface CompanyInfoProps {
  language: Language;
  empresaContext?: string;
}

export function CompanyInfo({ language, empresaContext }: CompanyInfoProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  const fetchEmpresa = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('empresa')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching empresa:', error);
      // If no empresa exists, we might want to create a default one or handle it
    } else {
      setEmpresa(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmpresa();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa) return;

    const { error } = await supabase
      .from('empresa')
      .update(empresa)
      .eq('id', empresa.id);

    if (error) {
      console.error('Error updating empresa:', error);
      alert(language === 'ca' ? `Error en guardar: ${error.message}` : `Error al guardar: ${error.message}`);
    } else {
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!empresa) return;
    setEmpresa({ ...empresa, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Informació de l'Empresa</h2>
            <p className="text-gray-500 text-sm">Detalls corporatius i configuració</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                {t.common.save}
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Editar
              </>
            )}
          </button>
        </header>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          {isEditing ? (
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Nom</label>
                  <input
                    name="nom"
                    value={empresa?.nom || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">NIF</label>
                  <input
                    name="nif"
                    value={empresa?.nif || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Direcció</label>
                  <input
                    name="direccio"
                    value={empresa?.direccio || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Telèfon</label>
                  <input
                    name="telefon"
                    value={empresa?.telefon || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                  <input
                    name="email"
                    value={empresa?.email || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Web</label>
                  <input
                    name="web"
                    value={empresa?.web || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-lg shadow-blue-500/20"
                >
                  Guardar Canvis
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{empresa?.nom || 'Carns Aliaga S.L.'}</h3>
                  <p className="text-sm text-gray-500">{empresa?.sector || 'Supermercat i Carnisseria'}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{empresa?.nif || 'B-12345678'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">{empresa?.direccio || 'Carrer Major, 12, València'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">{empresa?.telefon || '+34 963 00 00 00'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">{empresa?.email || 'info@carnaliaga.com'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">{empresa?.web || 'www.carnaliaga.com'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Listado de Trabajadores</h2>
            <p className="text-gray-500 text-sm">Gestión de personal y datos contractuales</p>
          </div>
        </header>

        <DataTable<Treballador>
          tableName="treballadors"
          language={language}
          empresaContext={empresaContext}
          columns={[
            { key: 'nom', header: t.treballadors.nom, type: 'text' },
            { key: 'direccio', header: t.treballadors.direccio, type: 'text' },
            { key: 'fecha_naixement', header: t.treballadors.fecha_naixement, type: 'date' },
            { key: 'dni', header: t.treballadors.dni, type: 'text' },
            { key: 'num_ss', header: t.treballadors.num_ss, type: 'text' },
            { key: 'tipus_contracte', header: t.treballadors.tipus_contracte, type: 'select', options: ['Indefinit', 'Temporal', 'Pràctiques', 'Fix Discontinu'] },
            { key: 'empresa', header: t.registre.empresa, type: 'select', options: ['CARNS ALIAGA', 'EMBOTITS', 'CARN'] },
          ]}
        />
      </section>
    </div>
  );
}

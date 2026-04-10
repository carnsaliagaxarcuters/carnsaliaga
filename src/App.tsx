import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { DataTable, DataTableRef } from './components/DataTable';
import { GastosManager } from './components/GastosManager';
import { OrganitzacioManager } from './components/OrganitzacioManager';
import { Analysis } from './components/Analysis';
import { CompanyInfo } from './components/CompanyInfo';
import { ImpagatsByClient, ImpagatsByClientRef } from './components/ImpagatsByClient';
import { Language, translations } from './lib/translations';
import { motion, AnimatePresence } from 'motion/react';
import { Registro, Impagat, Gasto, Nomina, Proveidor, Cliente } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState('registre');
  const [impagatsSubView, setImpagatsSubView] = useState<'date' | 'client'>('client');
  const [language, setLanguage] = useState<Language>('ca');
  const impagatsRef = useRef<DataTableRef<Impagat>>(null);
  const impagatsByClientRef = useRef<ImpagatsByClientRef>(null);
  const t = translations[language];

  const renderView = () => {
    switch (currentView) {
      case 'analisi':
        return <Analysis language={language} />;
      case 'empresa':
        return <CompanyInfo language={language} />;
      case 'registre':
        return (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.sidebar.registre}</h2>
              <p className="text-gray-500 text-sm">{t.subtitles.registre}</p>
            </header>
            <DataTable<Registro>
              tableName="registros"
              language={language}
              columns={[
                { key: 'fecha', header: t.registre.fecha, type: 'date' },
                { key: 'dia_setmana', header: t.registre.dia_setmana, type: 'text', hiddenInForm: true },
                { key: 'dia', header: t.registre.dia, type: 'number', hiddenInForm: true },
                { key: 'mes', header: t.registre.mes, type: 'text', hiddenInForm: true },
                { key: 'anio', header: t.registre.any, type: 'number', hiddenInForm: true },
                { key: 'semana', header: t.registre.semana, type: 'number', hiddenInForm: true },
                { key: 'caixa', header: t.registre.caixa, type: 'number', currency: true },
                { key: 'impagats', header: t.registre.impagats, type: 'number', currency: true, readOnly: true },
                { key: 'pagats', header: t.registre.pagats, type: 'number', currency: true, readOnly: true },
                { key: 'proveidors', header: t.registre.proveidors, type: 'number', currency: true },
                { key: 'total', header: t.registre.total, type: 'number', currency: true, hiddenInForm: true },
                { key: 'empresa', header: t.registre.empresa, type: 'text', hiddenInForm: true },
                { key: 'campanya', header: t.registre.campanya, type: 'text' },
              ]}
            />
          </div>
        );
      case 'impagats':
        return (
          <div className="space-y-6">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.sidebar.impagats}</h2>
                <p className="text-gray-500 text-sm">{t.subtitles.impagats}</p>
              </div>
              
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setImpagatsSubView('date')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    impagatsSubView === 'date' 
                      ? 'bg-white text-[#464971] shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  PER DATA
                </button>
                <button
                  onClick={() => setImpagatsSubView('client')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    impagatsSubView === 'client' 
                      ? 'bg-white text-[#464971] shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  PER CLIENT
                </button>
              </div>
            </header>

            {impagatsSubView === 'date' ? (
              <DataTable<Impagat>
                ref={impagatsRef}
                tableName="impagats"
                language={language}
                onDataChange={() => {
                  impagatsByClientRef.current?.fetchData();
                }}
                columns={[
                  { key: 'fecha', header: t.impagats.fecha, type: 'date' },
                  { key: 'client', header: t.impagats.client, type: 'select', foreignTable: 'clientes', foreignLabel: 'nom' },
                  { key: 'import', header: t.impagats.import, type: 'number', currency: true },
                  { key: 'empresa', header: t.impagats.empresa, type: 'text', hiddenInForm: true },
                  { key: 'tipus_pagament', header: t.impagats.tipus_pagament, type: 'select', options: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'BIZUM', 'XEC', 'BAR'] },
                  { key: 'fecha_pagament', header: t.impagats.fecha_pagament, type: 'date' },
                  { key: 'pagat', header: t.impagats.pagat, type: 'boolean' },
                  { key: 'tipus', header: t.impagats.tipus, type: 'text' },
                  { key: 'observacions', header: t.impagats.observacions, type: 'text' },
                ]}
              />
            ) : (
              <>
                <ImpagatsByClient 
                  language={language}
                  ref={impagatsByClientRef}
                  onAddImpagat={(clientName) => {
                    impagatsRef.current?.openPanel({ client: clientName });
                  }}
                  onEditImpagat={(impagat) => {
                    impagatsRef.current?.openPanel(impagat);
                  }}
                />
                <DataTable<Impagat>
                  ref={impagatsRef}
                  tableName="impagats"
                  language={language}
                  hideTable={true}
                  onDataChange={() => {
                    impagatsByClientRef.current?.fetchData();
                  }}
                  columns={[
                    { key: 'fecha', header: t.impagats.fecha, type: 'date' },
                    { key: 'client', header: t.impagats.client, type: 'select', foreignTable: 'clientes', foreignLabel: 'nom' },
                    { key: 'import', header: t.impagats.import, type: 'number', currency: true },
                    { key: 'empresa', header: t.impagats.empresa, type: 'text', hiddenInForm: true },
                    { key: 'tipus_pagament', header: t.impagats.tipus_pagament, type: 'select', options: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'BIZUM', 'XEC', 'BAR'] },
                    { key: 'fecha_pagament', header: t.impagats.fecha_pagament, type: 'date' },
                    { key: 'pagat', header: t.impagats.pagat, type: 'boolean' },
                    { key: 'tipus', header: t.impagats.tipus, type: 'text' },
                    { key: 'observacions', header: t.impagats.observacions, type: 'text' },
                  ]}
                />
              </>
            )}
          </div>
        );
      case 'gastos':
        return <GastosManager language={language} />;
      case 'organitzacio':
        return <OrganitzacioManager language={language} />;
      case 'nominas':
        return (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.sidebar.nominas}</h2>
              <p className="text-gray-500 text-sm">{t.subtitles.nominas}</p>
            </header>
            <DataTable<Nomina>
              tableName="nominas"
              language={language}
              columns={[
                { key: 'fecha', header: t.nominas.fecha, type: 'date' },
                { key: 'empleat', header: t.nominas.empleat, type: 'text' },
                { key: 'import', header: t.nominas.import, type: 'number', currency: true },
                { key: 'estat', header: t.nominas.estat, type: 'select', options: ['pendent', 'pagat'] },
              ]}
            />
          </div>
        );
      case 'proveidors':
        return (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.sidebar.proveidors}</h2>
            </header>
            <DataTable<Proveidor>
              tableName="proveidors"
              language={language}
              columns={[
                { key: 'nom', header: t.proveidors.nom, type: 'text' },
                { key: 'contacte', header: t.proveidors.contacte, type: 'text' },
                { key: 'categoria', header: t.proveidors.categoria, type: 'text' },
              ]}
            />
          </div>
        );
      case 'clientes':
        return (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.sidebar.clientes}</h2>
              <p className="text-gray-500 text-sm">{t.subtitles.clientes}</p>
            </header>
            <DataTable<Cliente>
              tableName="clientes"
              language={language}
              columns={[
                { key: 'nom', header: t.clientes.nom, type: 'text' },
                { key: 'tipo', header: t.clientes.tipo, type: 'select', options: [] },
                { key: 'empresa_cliente', header: t.clientes.empresa_cliente, type: 'text' },
                { key: 'telefon', header: t.clientes.telefon, type: 'text' },
                { key: 'es_empresa', header: t.clientes.es_empresa, type: 'boolean' },
                { key: 'email', header: t.clientes.email, type: 'text' },
                { key: 'nif', header: t.clientes.nif, type: 'text' },
                { key: 'direccion', header: t.clientes.direccion, type: 'text' },
                { key: 'poblacion', header: t.clientes.poblacion, type: 'text' },
                { key: 'movil', header: t.clientes.movil, type: 'text' },
                { key: 'iban', header: t.clientes.iban, type: 'text' },
                { key: 'provincia', header: t.clientes.provincia, type: 'text' },
                { key: 'pais', header: t.clientes.pais, type: 'text' },
                { key: 'codi_postal', header: t.clientes.codi_postal, type: 'text' },
              ]}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            Próximamente: {currentView}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        language={language} 
        setLanguage={setLanguage} 
      />
      
      <main className="flex-1 ml-64 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

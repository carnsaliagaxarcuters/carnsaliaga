import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { translations, Language } from '../lib/translations';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '../lib/utils';

interface AnalysisProps {
  language: Language;
}

export function Analysis({ language }: AnalysisProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    const fetchData = async () => {
      const { data: registros } = await supabase.from('registros').select('*');
      if (registros) {
        // Group by month for chart
        const grouped = registros.reduce((acc: any, curr: any) => {
          const month = curr.mes;
          if (!acc[month]) acc[month] = { name: month, total: 0, caixa: 0 };
          acc[month].total += Number(curr.total);
          acc[month].caixa += Number(curr.caixa);
          return acc;
        }, {});
        setData(Object.values(grouped));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) return <div className="text-center py-20 text-gray-400">Carregant dades d'anàlisi...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.sidebar.analisi}</h2>
        <p className="text-gray-500 text-sm">Resumen visual del rendimiento del negocio</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">Ingresos por Mes</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(val: number) => [formatCurrency(val), 'Total']}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">Evolución de Caja</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(val: number) => [formatCurrency(val), 'Caja']}
                />
                <Line type="monotone" dataKey="caixa" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Total Ingresos', 'Media Diaria', 'Impagados Totales'].map((label, i) => (
          <div key={label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">
              {i === 0 ? formatCurrency(data.reduce((a, b) => a + b.total, 0)) : 
               i === 1 ? formatCurrency(data.reduce((a, b) => a + b.total, 0) / (data.length || 1)) :
               formatCurrency(1245.50)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

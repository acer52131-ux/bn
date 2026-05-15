import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { Info } from 'lucide-react';
import { formatCurrency } from '../utils';

export function DashboardCharts({ chartData }: { chartData: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:hidden">
      <div className="bg-white border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 group/info relative w-fit">
          <h3 className="font-bold text-slate-800 border-b border-dashed border-slate-300">Прогноз Выручка vs Кэш-аут</h3>
          <Info className="w-4 h-4 text-slate-400 cursor-help" />
          <div className="absolute left-0 top-full mt-2 w-72 bg-slate-800 text-white text-xs rounded-xl p-3 shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50">
            <p className="font-bold border-b border-slate-600 pb-1 mb-1">Что такое Кэш-аут?</p>
            <p>Кэш-аут (Cash-out) — это общий объем денежных средств, уходящих со счетов компании в данном месяце. Включает в себя:</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-300">
              <li>ФОТ (Зарплаты водителей)</li>
              <li>ГСМ и Ремонты</li>
              <li>Аренда техники</li>
              <li>Налоги к уплате (НДС и др.)</li>
            </ul>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <YAxis width={60} tickFormatter={(value) => `${value / 1000}k`} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip 
                 content={({active, payload}) => {
                   if(active && payload && payload.length) {
                     return (
                       <div className="bg-white p-3 border rounded-xl shadow-xl text-xs z-50">
                         <p className="font-bold mb-1">{payload[0].payload.name}</p>
                         <p className="text-emerald-600">Выручка: {formatCurrency(payload[0].value as number)}</p>
                         <p className="text-rose-600">Кэш-аут: {formatCurrency(payload[1].value as number)}</p>
                       </div>
                     )
                   }
                   return null;
                 }}
              />
              <Area type="monotone" dataKey="revenueGross" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="cashOut" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Годовой план: Прибыль холдинга</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
             <BarChart data={chartData.filter(d => d.monthName)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthName" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis width={60} tickFormatter={(value) => `${value / 1000}k`} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}}
                   content={({active, payload}) => {
                     if(active && payload && payload.length) {
                       return (
                         <div className="bg-white p-3 border rounded-xl shadow-xl text-xs z-50">
                           <p className="font-bold mb-1">{payload[0].payload.monthName}</p>
                           <p className="text-indigo-600">Прибыль Холдинга: {formatCurrency(payload[0].value as number)}</p>
                         </div>
                       )
                     }
                     return null;
                   }}
                />
                <Bar dataKey="holdingBenefit" fill="#6366f1" radius={[4, 4, 0, 0]} />
             </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

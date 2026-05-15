import React from 'react';
import { MonthlyPlan } from '../types';
import { cn } from '../utils';

interface Props {
  planData: MonthlyPlan[];
  updatePlan: (monthId: number, field: keyof MonthlyPlan, value: any) => void;
}

export function CalendarPlanner({ planData, updatePlan }: Props) {
  return (
    <section className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden mb-8 print:hidden">
      <div className="p-6 border-b border-slate-100">
         <h2 className="text-xl font-bold text-slate-800">Календарное Планирование (Сезонность)</h2>
         <p className="text-sm text-slate-500 mt-1">Настройте коэффициенты загрузки и долю своих/чужих заказов по месяцам</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-[1px] bg-slate-200">
         {planData.map(month => (
           <div key={month.monthId} className="bg-white p-4">
              <h4 className="font-bold text-slate-700 mb-4">{month.monthName}</h4>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-xs text-slate-500 block mb-1 font-medium">Модификатор Загрузки</label>
                    <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         step="0.05"
                         value={month.loadModifier} 
                         onChange={e => updatePlan(month.monthId, 'loadModifier', Number(e.target.value))}
                         className={cn(
                           "w-full px-2 py-1.5 border rounded text-sm text-right",
                           month.loadModifier < 1 ? "bg-rose-50 border-rose-200" : month.loadModifier > 1 ? "bg-emerald-50 border-emerald-200" : ""
                         )} 
                       />
                       <span className="text-[10px] text-slate-400 font-mono">x</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 mt-1 leading-tight">Пример: 0.5 = снижение загрузки в 2 раза.</p>
                 </div>

                 <div>
                    <label className="text-xs text-slate-500 block mb-1 font-medium">Сдвиг в сторону Внешних</label>
                    <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         step="5"
                         value={month.internalShift} 
                         onChange={e => updatePlan(month.monthId, 'internalShift', Number(e.target.value))}
                         className={cn(
                           "w-full px-2 py-1.5 border rounded text-sm text-right",
                           month.internalShift < 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : ""
                         )} 
                       />
                       <span className="text-[10px] text-slate-400 font-mono">%</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 leading-tight">Отрицательное = уходим на внешние заказы</p>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </section>
  )
}

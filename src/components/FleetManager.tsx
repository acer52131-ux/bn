import React, { useState } from 'react';
import { Vehicle } from '../types';
import { cn, formatCurrency } from '../utils';
import { CalculationExplanation } from './CalculationExplanation';

interface Props {
  fleet: Vehicle[];
  updateVehicle: (id: number, field: keyof Vehicle, value: any) => void;
  updateGroup: (type: string, field: keyof Vehicle, value: any) => void;
  calculatedData: Record<number, any>; 
  settings: any;
}

const TYPE_NAMES = {
  light: 'Малотоннажные (Газели)',
  truck: 'Грузовые (Самосвалы, КМУ, ЗИЛ)',
  heavy: 'Спецтехника (Экскаваторы, Катки)',
  auto: 'Легковые (Нива, Лада)',
};

export function FleetManager({ fleet, updateVehicle, updateGroup, calculatedData, settings }: Props) {
  const [activeVehicleId, setActiveVehicleId] = useState<number>(fleet[0]?.id || 1);
  const groups = Object.keys(TYPE_NAMES) as Array<keyof typeof TYPE_NAMES>;
  
  const activeVehicle = fleet.find(v => v.id === activeVehicleId);

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-white/50 rounded-3xl min-h-[700px]">
      
      {/* LEFT SIDEBAR: Vehicles List */}
      <div className="w-full md:w-80 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Список техники</h2>
        </div>
        
        <div className="overflow-y-auto max-h-[800px] p-2 space-y-4">
          {groups.map(g => {
            const groupFleet = fleet.filter(v => v.type === g);
            if (groupFleet.length === 0) return null;
            return (
              <div key={g}>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 tracking-wider">{TYPE_NAMES[g]}</h3>
                <div className="space-y-1">
                  {groupFleet.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVehicleId(v.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-sm transition-all focus:outline-none flex flex-col",
                        activeVehicleId === v.id 
                          ? "bg-blue-500 text-white shadow-md pointer-events-none" 
                          : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      )}
                    >
                      <span className="font-semibold truncate">{v.name}</span>
                      <span className={cn(
                        "text-[10px] mt-1 font-mono px-1.5 py-0.5 rounded-md inline-block w-fit",
                        activeVehicleId === v.id ? "bg-blue-600/50 text-white" : "bg-slate-200 text-slate-500"
                      )}>{v.plate}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANE: Detail & Config */}
      <div className="flex-1 overflow-y-auto max-h-[850px] pb-10">
        {activeVehicle ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             
             {/* Header */}
             <div className="bg-slate-800 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">{activeVehicle.name}</h2>
                    <span className="bg-white/20 px-2 py-1 rounded text-sm mt-2 inline-block font-mono tracking-wider">{activeVehicle.plate}</span>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-xl text-center">
                     <span className="block text-[10px] uppercase tracking-wider font-bold">Чистая прибыль</span>
                     <span className="block text-xl font-black">{formatCurrency((calculatedData[activeVehicle.id]?.netProfit) || 0)}</span>
                  </div>
                </div>
             </div>

             {/* Config Form */}
             <div className="p-6 md:p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  {/* Revenue / Hours */}
                  <div>
                    <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Выручка и Загрузка</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Тариф внешний (руб/ч)</label>
                        <input type="number" value={activeVehicle.basePrice} onChange={e => updateVehicle(activeVehicle.id, 'basePrice', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-indigo-500 mb-1">Тариф Холдингу (руб/ч)</label>
                        <input type="number" value={activeVehicle.internalPrice} onChange={e => updateVehicle(activeVehicle.id, 'internalPrice', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30 border-indigo-200" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Общая загрузка (%)</label>
                          <input type="number" value={activeVehicle.loadPercent} onChange={e => updateVehicle(activeVehicle.id, 'loadPercent', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-indigo-500 mb-1">Из них свои заказы (%)</label>
                          <input type="number" value={activeVehicle.internalPercent} onChange={e => updateVehicle(activeVehicle.id, 'internalPercent', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30 border-indigo-200" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Ежемесячные Затраты</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <label className="block text-xs font-bold text-orange-800 mb-1">Оклад Водителя (в мес)</label>
                        <input type="number" value={activeVehicle.driverSal} step="1000" onChange={e => updateVehicle(activeVehicle.id, 'driverSal', Number(e.target.value))} className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
                        <p className="text-[10px] text-orange-600 mt-1">*Если 0 руб - аренда без водителя (ГСМ=0)</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Стоимость ТС</label>
                          <input type="number" step="100000" value={activeVehicle.vehicleValue} onChange={e => updateVehicle(activeVehicle.id, 'vehicleValue', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Ремонт %</label>
                          <input type="number" step="0.1" value={activeVehicle.repairPercent} onChange={e => updateVehicle(activeVehicle.id, 'repairPercent', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input type="checkbox" checked={activeVehicle.useAmortizationRent} onChange={e => updateVehicle(activeVehicle.id, 'useAmortizationRent', e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/>
                            <span className="text-xs font-bold text-slate-700">Считать аренду по амортизации (+10%)</span>
                          </label>
                          {activeVehicle.useAmortizationRent ? (
                            <div className="bg-slate-50 p-3 rounded-lg border">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Срок амортизации (мес)</label>
                                  <input type="number" step="1" value={activeVehicle.amortizationMonths} onChange={e => updateVehicle(activeVehicle.id, 'amortizationMonths', Number(e.target.value))} className="w-full px-3 py-1.5 border rounded-md bg-white focus:ring-2 focus:ring-slate-400 text-sm" />
                                </div>
                                <div className="flex-[2] flex flex-col justify-end">
                                  <div className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Аренда/мес: <span className="font-bold text-slate-800">{new Intl.NumberFormat('ru-RU').format(Math.round(calculatedData[activeVehicle.id]?.rentGross || 0))} ₽</span></div>
                                  <div className="text-[11px] text-slate-600 font-medium mt-1 whitespace-nowrap">Аренда/час: <span className="font-bold text-indigo-700">{new Intl.NumberFormat('ru-RU').format(Math.round((calculatedData[activeVehicle.id]?.rentGross || 0) / (calculatedData[activeVehicle.id]?.workHours || 1)))} ₽</span></div>
                                  <div className="text-[10px] text-slate-500 font-medium mt-1 whitespace-nowrap border-t border-slate-200 pt-1">Аренда + Накладные/час: <span className="font-bold text-rose-700">{new Intl.NumberFormat('ru-RU').format(Math.round(((calculatedData[activeVehicle.id]?.rentGross || 0) + (settings.fixedOverhead / Math.max(1, fleet.length))) / (calculatedData[activeVehicle.id]?.workHours || 1)))} ₽</span></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-3 rounded-lg border">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Аренда Фикс. (в мес)</label>
                                  <input type="number" step="1000" value={activeVehicle.rentCost} onChange={e => updateVehicle(activeVehicle.id, 'rentCost', Number(e.target.value))} className="w-full px-3 py-1.5 border rounded-md bg-white focus:ring-2 focus:ring-slate-400 text-sm" />
                                </div>
                                <div className="flex-[2] flex flex-col justify-end">
                                  <div className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Аренда/час: <span className="font-bold text-indigo-700">{new Intl.NumberFormat('ru-RU').format(Math.round((calculatedData[activeVehicle.id]?.rentGross || 0) / (calculatedData[activeVehicle.id]?.workHours || 1)))} ₽</span></div>
                                  <div className="text-[10px] text-slate-500 font-medium mt-1 whitespace-nowrap border-t border-slate-200 pt-1">Аренда + Накладные/час: <span className="font-bold text-rose-700">{new Intl.NumberFormat('ru-RU').format(Math.round(((calculatedData[activeVehicle.id]?.rentGross || 0) + (settings.fixedOverhead / Math.max(1, fleet.length))) / (calculatedData[activeVehicle.id]?.workHours || 1)))} ₽</span></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1">ГСМ (руб/ч)</label>
                          <input type="number" step="10" value={activeVehicle.fuelCost} onChange={e => updateVehicle(activeVehicle.id, 'fuelCost', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-400" disabled={activeVehicle.driverSal === 0} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VAT Flags */}
                  <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-wrap gap-6 items-center">
                     <span className="text-sm font-bold text-blue-900 block w-full mb-1">Входящий НДС к вычету (Наличие чеков с НДС)</span>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={activeVehicle.vatFuel} onChange={e => updateVehicle(activeVehicle.id, 'vatFuel', e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/> 
                        <span className="text-sm text-blue-800">ГСМ с НДС</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={activeVehicle.vatRepairs} onChange={e => updateVehicle(activeVehicle.id, 'vatRepairs', e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/> 
                        <span className="text-sm text-blue-800">Ремонты с НДС</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={activeVehicle.vatRent} onChange={e => updateVehicle(activeVehicle.id, 'vatRent', e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/> 
                        <span className="text-sm text-blue-800">Аренда с НДС</span>
                     </label>
                  </div>
               </div>

               <CalculationExplanation calculatedData={calculatedData} settings={settings} activeVehicle={activeVehicle} />
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center">
            Выберите технику из списка слева, чтобы начать настройку и увидеть детальный расчет
          </div>
        )}
      </div>

    </div>
  );
}

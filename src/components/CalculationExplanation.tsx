import React from 'react';
import { cn, formatCurrency } from '../utils';

export function CalculationExplanation({ calculatedData, settings, activeVehicle }: any) {
  if (!activeVehicle) return null;
  const calc = calculatedData[activeVehicle.id];
  if (!calc) return null;

  const { workHours, extHours, intHours, rentGross, rentNet, repairNet, fuelNet, monthlyFOT } = calc;
  
  const revenueExt = extHours * activeVehicle.basePrice;
  const revenueInt = intHours * activeVehicle.internalPrice;
  const revenueGross = revenueExt + revenueInt;

  const isRentedWithoutDriver = activeVehicle.driverSal === 0;
  const fuelVatInput = activeVehicle.vatFuel ? (fuelNet * 1.20) - fuelNet : 0;
  const repairVatInput = activeVehicle.vatRepairs ? (repairNet * 1.20) - repairNet : 0;
  const rentVatInput = rentGross - rentNet;

  let outputVat = 0, revenueNet = revenueGross, expensesNetForTax = 0;
  if (settings.taxSystem === 'OSNO' || settings.taxSystem === 'USN_22') {
    outputVat = revenueGross * (20 / 120);
    revenueNet = revenueGross - outputVat;
    expensesNetForTax = monthlyFOT + fuelNet + repairNet + rentNet;
  } else if (settings.taxSystem === 'USN_5') {
    outputVat = revenueGross * (5 / 105);
    revenueNet = revenueGross - outputVat;
    expensesNetForTax = monthlyFOT + (fuelNet * (activeVehicle.vatFuel ? 1.20 : 1)) + (repairNet * (activeVehicle.vatRepairs ? 1.20 : 1)) + rentGross;
  }

  const profitBeforeTax = revenueNet - expensesNetForTax;
  const profitTax = profitBeforeTax > 0 ? profitBeforeTax * (settings.taxSystem === 'OSNO' ? 0.20 : 0.15) : 0;
  const netProfit = profitBeforeTax - profitTax;
  
  let holdingVatBenefit = 0;
  if (settings.taxSystem === 'OSNO' || settings.taxSystem === 'USN_22') {
    holdingVatBenefit = revenueInt * (20 / 120);
  }
  const holdingBenefit = netProfit + rentNet + holdingVatBenefit;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mt-6 font-mono text-xs">
      <h3 className="text-sm font-bold text-slate-800 mb-4">{activeVehicle.name} - Формулы Расчета</h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-bold bg-slate-100 p-1">1. Выручка</h4>
          <p>Часы: {(workHours || 0).toFixed(1)} ч. (Внеш: {(extHours || 0).toFixed(1)}, Внутр: {(intHours || 0).toFixed(1)})</p>
          <p>Внешняя: {(extHours || 0).toFixed(1)} * {activeVehicle.basePrice} = {formatCurrency(revenueExt)}</p>
          <p>Внутренняя: {(intHours || 0).toFixed(1)} * {activeVehicle.internalPrice} = {formatCurrency(revenueInt)}</p>
          <p className="font-bold border-b pb-1">Итого (с НДС): {formatCurrency(revenueGross)}</p>
        </div>
        <div>
          <h4 className="font-bold bg-slate-100 p-1">2. Расходы</h4>
          {isRentedWithoutDriver && <p className="text-orange-600">ТС без водителя, ФОТ и ГСМ = 0</p>}
          <p>ФОТ: {formatCurrency(monthlyFOT)}</p>
          <p>ГСМ (без НДС): {formatCurrency(fuelNet)} (Вх. НДС: {formatCurrency(fuelVatInput)})</p>
          <p>Ремонт (без НДС): {formatCurrency(repairNet)} (Вх. НДС: {formatCurrency(repairVatInput)})</p>
          {activeVehicle.useAmortizationRent ? (
            <p>Аренда по Амортизации (с НДС): {formatCurrency(rentGross)} (Вх. НДС: {formatCurrency(rentVatInput)}, Аренда без НДС: {formatCurrency(rentNet)})</p>
          ) : (
            <p>Аренда Фикс (с НДС): {formatCurrency(rentGross)} (Вх. НДС: {formatCurrency(rentVatInput)}, Аренда без НДС: {formatCurrency(rentNet)})</p>
          )}
        </div>
        <div>
          <h4 className="font-bold bg-slate-100 p-1">3. Налоги ({settings.taxSystem})</h4>
          <p>Исх. НДС: {formatCurrency(outputVat)}</p>
          <p>Налог на прибыль ({settings.taxSystem === 'OSNO' ? '20%' : '15%'} от {formatCurrency(profitBeforeTax)}): {formatCurrency(profitTax)}</p>
        </div>
        <div>
          <h4 className="font-bold bg-emerald-100 p-1 text-emerald-800">4. Итоговая Прибыль</h4>
          <p>Чистая Прибыль УК: {formatCurrency(netProfit)}</p>
          <p>Профит Холдинга = Чистая Прибыль ({formatCurrency(netProfit)}) + Аренда Холдингу без НДС ({formatCurrency(rentNet)}) + Входящий НДС Холдинга ({formatCurrency(holdingVatBenefit)}) = <span className="font-bold text-emerald-600">{formatCurrency(holdingBenefit)}</span></p>
        </div>
      </div>
    </div>
  );
}

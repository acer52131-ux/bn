import React, { useState, useMemo } from 'react';
import { Truck, Printer, Download, CheckCircle2, Factory, FileText, X } from 'lucide-react';
import { Vehicle, GlobalSettings, MonthlyPlan, TaxSystem } from './types';
import { defaultFleet } from './data';
import { cn, formatCurrency, exportToCSV } from './utils';
import { calculateMonth } from './engine';
import { FleetManager } from './components/FleetManager';
import { CalendarPlanner } from './components/CalendarPlanner';
import { DashboardCharts } from './components/DashboardCharts';
import { BusinessPlanNarrative } from './components/BusinessPlanNarrative';

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const defaultPlan: MonthlyPlan[] = MONTHS.map((m, i) => ({
  monthId: i + 1,
  monthName: m,
  loadModifier: i === 0 || i === 11 ? 0.6 : 1.0, // Jan, Dec low load example
  internalShift: i > 4 && i < 8 ? -20 : 0 // Summer season - go to external rent
}));

function CollapsibleSection({ title, defaultOpen = false, children }: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-sm print:shadow-none print:border-none print:bg-transparent overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-6 sm:p-8 bg-slate-50/30 hover:bg-slate-50 transition-colors print:hidden"
      >
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          {title}
        </h2>
        <div className={cn("transform transition-transform duration-300", isOpen ? "rotate-180" : "rotate-0")}>
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>
      <div className={cn("transition-all duration-500 ease-in-out print:block", isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden print:max-h-none print:opacity-100")}>
        <div className="p-6 sm:p-8 pt-0 border-t border-slate-100 print:border-none print:p-0">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [fleet, setFleet] = useState<Vehicle[]>(defaultFleet);
  const [planData, setPlanData] = useState<MonthlyPlan[]>(defaultPlan);
  const [showReport, setShowReport] = useState(false);
  const [isYearlyView, setIsYearlyView] = useState(true);

  const [settings, setSettings] = useState<GlobalSettings>({
    maxHours: 250,
    isAzrfResident: true,
    isOfficialWorker: true,
    taxSystem: 'USN_5',
    fixedOverhead: 439300,
    totalRepairBudget: 500000
  });

  const updateVehicle = (id: number, field: keyof Vehicle, value: any) => {
    setFleet(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const updateGroup = (type: string, field: keyof Vehicle, value: any) => {
    setFleet(prev => prev.map(v => v.type === type ? { ...v, [field]: value } : v));
  };

  const updatePlan = (monthId: number, field: keyof MonthlyPlan, value: any) => {
    setPlanData(prev => prev.map(m => m.monthId === monthId ? { ...m, [field]: value } : m));
  };

  // Run calculation over a full year
  const yearlyCalculation = useMemo(() => {
    const monthsCalculations = planData.map(planMonth => calculateMonth(fleet, settings, planMonth));
    
    // Aggregate for dashboard chart (monthly totals)
    const chartData = monthsCalculations.map((calc, i) => {
      const month = planData[i];
      return {
        name: month.monthName,
        monthName: month.monthName,
        revenueGross: calc.totals.revenueGross,
        cashOut: calc.totals.expensesNetForTax + calc.totals.vatPayable, // approximate cashout
        holdingBenefit: calc.totals.holdingBenefit,
        netProfit: calc.totals.netProfit
      }
    });

    const ObjectTotalsInit = { 
      revenueGross: 0, 
      revenueExtGross: 0,
      revenueIntGross: 0,
      expensesNetForTax: 0,
      profitTax: 0,
      netProfit: 0, 
      holdingBenefit: 0, 
      holdingVatBenefit: 0,
      vatPayable: 0, 
      rentNet: 0, 
      totalInputVat: 0, 
      rentVatInput: 0, 
      outputVat: 0 
    };

    // Aggregate Yearly Totals
    const yearlyTotals = monthsCalculations.reduce((acc, curr) => ({
      revenueGross: acc.revenueGross + curr.totals.revenueGross,
      revenueExtGross: acc.revenueExtGross + curr.totals.revenueExtGross,
      revenueIntGross: acc.revenueIntGross + curr.totals.revenueIntGross,
      expensesNetForTax: acc.expensesNetForTax + curr.totals.expensesNetForTax,
      profitTax: acc.profitTax + curr.totals.profitTax,
      netProfit: acc.netProfit + curr.totals.netProfit,
      holdingBenefit: acc.holdingBenefit + curr.totals.holdingBenefit,
      holdingVatBenefit: acc.holdingVatBenefit + curr.totals.holdingVatBenefit,
      vatPayable: acc.vatPayable + curr.totals.vatPayable,
      rentNet: acc.rentNet + curr.totals.rentNet,
      totalInputVat: acc.totalInputVat + curr.totals.totalInputVat,
      rentVatInput: acc.rentVatInput + curr.totals.rentVatInput,
      outputVat: acc.outputVat + curr.totals.outputVat
    }), ObjectTotalsInit);

    // Average per month calculation (for the Fleet Manager display which reflects an "Average Month")
    const avgMonthPlan: MonthlyPlan = { monthId: 0, monthName: 'Average', loadModifier: 1, internalShift: 0 };
    const baseCalc = calculateMonth(fleet, settings, avgMonthPlan);
    
    // Map baseCalc results to dictionary by vehicleID for easy lookup
    const calculatedBaseData: Record<number, any> = {};
    baseCalc.vehicles.forEach(v => {
      calculatedBaseData[v.vehicleId] = v;
    });

    return { 
      chartData, 
      yearlyTotals, 
      calculatedBaseData,
      baseMonthTotals: baseCalc.totals
    };
  }, [fleet, settings, planData]);

  const handleExportCSV = () => {
    const flatData = fleet.map(v => {
      const calcInfo = yearlyCalculation.calculatedBaseData[v.id] || {};
      return {
        'Группа': v.type,
        'Техника': v.name,
        'Госномер': v.plate,
        'Тариф Внешний (руб)': v.basePrice,
        'Тариф Внутренний (руб)': v.internalPrice,
        'Загрузка %': v.loadPercent,
        'Свои %': v.internalPercent,
        'ФОТ водителя (На руки)': v.driverSal,
        'ГСМ без НДС': v.fuelCost,
        'ГСМ с НДС': v.vatFuel ? 'Да' : 'Нет',
        'Стоимость ТС руб': v.vehicleValue,
        'Ремонт % мес': v.repairPercent,
        'Ремонт с НДС': v.vatRepairs ? 'Да' : 'Нет',
        'Аренда Холдингу руб/ч': v.rentCost,
        'Выручка за мес (базовая)': calcInfo.revenueGross || 0,
        'Входящий НДС за мес': calcInfo.totalInputVat || 0,
        'НДС с Аренды за мес (передан в Холдинг)': calcInfo.rentVatInput || 0,
        'НДС к уплате за мес': calcInfo.vatPayable || 0,
        'Чистая Прибыль за мес': calcInfo.netProfit || 0
      }
    });
    exportToCSV('transport_plan.csv', flatData);
  }

  const { yearlyTotals, chartData, calculatedBaseData } = yearlyCalculation;

  return (
    <div className="min-h-screen bg-slate-50 relative print:bg-white overflow-hidden pb-20 font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 print:hidden animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 print:hidden" />

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 relative z-10 space-y-8">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-600 print:text-black" />
              Бизнес-план ГК: Транспорт
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Финансовая модель предприятия с учетом сезонности и НДС</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 print:hidden">
             <button onClick={() => setShowReport(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all hover:shadow-[0_8px_20px_rgb(59,130,246,0.3)] hover:-translate-y-0.5 shadow-md border border-indigo-500/50 whitespace-nowrap">
               <FileText className="w-5 h-5" /> Сформировать Отчет
             </button>
             <button onClick={handleExportCSV} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 px-6 py-3 rounded-2xl font-semibold transition-all hover:shadow-sm hover:-translate-y-0.5 shadow-sm whitespace-nowrap">
                <Download className="w-5 h-5" /> CSV
             </button>
          </div>
        </header>

        {/* Global Key Metrics Dashboard */}
        <section className="bg-slate-900 text-white rounded-3xl shadow-2xl relative z-10 mb-8">
          {/* Add an inner wrapper for the blur to prevent overflow on the design without clipping tooltips, though better to just clip the blur element's container */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl translate-x-1/2 -translate-y-1/2 print:hidden"/>
          </div>
          
          <div className="p-8 sm:p-10">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4 relative z-10">
            <h2 className="text-2xl font-black">Интегральная Оценка</h2>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
              <button 
                onClick={() => setIsYearlyView(false)} 
                className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors", !isYearlyView ? "bg-white text-slate-900 shadow-sm" : "text-white hover:bg-white/10")}
              >
                Месяц
              </button>
              <button 
                onClick={() => setIsYearlyView(true)} 
                className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors", isYearlyView ? "bg-white text-slate-900 shadow-sm" : "text-white hover:bg-white/10")}
              >
                Год
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
             <div className="group/rev relative">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2 border-b border-dashed border-slate-600 w-fit">Выручка ({isYearlyView ? 'Год' : 'Средн. Мес'})</p>
                
                <div className="flex gap-1.5 flex-wrap text-xs font-mono mb-1 text-slate-400">
                   <div className="group/n relative border-b border-dashed border-slate-500 cursor-help">
                     {formatCurrency(isYearlyView ? yearlyTotals.revenueExtGross : yearlyTotals.revenueExtGross / 12)}
                     <div className="absolute left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-600">
                       <p className="font-bold border-b border-slate-600 pb-1 mb-1">Сумма внешней выручки</p>
                       <p>∑ (Часы внешние × Тариф внешний)</p>
                       <p className="text-slate-400 mt-1 italic">От сторонних контрагентов.</p>
                     </div>
                   </div>
                   <div className="text-slate-600 font-bold">+</div>
                   <div className="group/n relative border-b border-dashed border-slate-500 cursor-help">
                     {formatCurrency(isYearlyView ? yearlyTotals.revenueIntGross : yearlyTotals.revenueIntGross / 12)}
                     <div className="absolute left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-600">
                       <p className="font-bold border-b border-slate-600 pb-1 mb-1">Сумма внутренней выручки</p>
                       <p>∑ (Часы внутренние × Тариф внутренний)</p>
                       <p className="text-slate-400 mt-1 italic">От объектов собственного Холдинга.</p>
                     </div>
                   </div>
                   <div className="text-slate-600 font-bold">=</div>
                </div>

                <p className="text-4xl font-black">{formatCurrency(isYearlyView ? yearlyTotals.revenueGross : yearlyTotals.revenueGross / 12)}</p>
             </div>

             <div className="group/tax relative">
                <p className="text-rose-400 font-bold text-xs uppercase tracking-widest mb-2 border-b border-dashed border-rose-800 w-fit">Налоги (НДС+Прибыль)</p>
                
                <div className="flex gap-1.5 flex-wrap text-xs font-mono mb-1 text-rose-300/80">
                   <div className="group/n relative border-b border-dashed border-rose-500/50 cursor-help">
                     {formatCurrency(isYearlyView ? yearlyTotals.vatPayable : yearlyTotals.vatPayable / 12)}
                     <div className="absolute left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-600">
                       <p className="font-bold border-b border-slate-600 pb-1 mb-1">Остаточный НДС к уплате</p>
                       <p>Исходящий НДС ({formatCurrency(isYearlyView ? yearlyTotals.outputVat : yearlyTotals.outputVat / 12)})</p>
                       <p>- Входящий НДС ({formatCurrency(isYearlyView ? yearlyTotals.totalInputVat : yearlyTotals.totalInputVat / 12)})</p>
                       <p className="text-slate-400 mt-1 italic">Входящий НДС собирается с расходов (ГСМ, Ремонт, Аренда)</p>
                     </div>
                   </div>
                   <div className="text-rose-600/50 font-bold">+</div>
                   <div className="group/n relative border-b border-dashed border-rose-500/50 cursor-help">
                     {formatCurrency(isYearlyView ? yearlyTotals.profitTax : yearlyTotals.profitTax / 12)}
                     <div className="absolute left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-600">
                       <p className="font-bold border-b border-slate-600 pb-1 mb-1">Налог {settings.taxSystem === 'OSNO' ? 'на Прибыль (20%)' : 'по УСН (15%)'}</p>
                       <p>Начисляется на разницу между доходами б/НДС и расходами б/НДС.</p>
                     </div>
                   </div>
                   <div className="text-rose-600/50 font-bold">=</div>
                </div>

                <p className="text-3xl font-bold text-rose-400">{formatCurrency(isYearlyView ? (yearlyTotals.vatPayable + yearlyTotals.profitTax) : (yearlyTotals.vatPayable + yearlyTotals.profitTax) / 12)}</p>
             </div>
             
             <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-6 sm:pt-0 sm:pl-8 group/profit relative">
                <p className="text-indigo-300 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-dashed border-indigo-800/50 w-fit">
                  <Factory className="w-4 h-4"/> Прибыль Компании
                </p>

                <div className="flex gap-1.5 flex-wrap text-[11px] font-mono mb-1 text-indigo-300/80 items-center">
                   <div className="group/n relative border-b border-dashed border-indigo-500/50 cursor-help">
                     {formatCurrency(isYearlyView ? (yearlyTotals.revenueGross - yearlyTotals.outputVat) : (yearlyTotals.revenueGross - yearlyTotals.outputVat) / 12)}
                     <div className="absolute left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-600">
                       <p className="font-bold border-b border-slate-600 pb-1 mb-1">Выручка б/НДС</p>
                     </div>
                   </div>
                   <div className="text-indigo-600/50 font-bold">-</div>
                   <div className="group/n relative border-b border-dashed border-indigo-500/50 cursor-help">
                     {formatCurrency(isYearlyView ? yearlyTotals.expensesNetForTax : yearlyTotals.expensesNetForTax / 12)}
                     <div className="absolute left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-600">
                       <p className="font-bold border-b border-slate-600 pb-1 mb-1">Сумма всех расходов б/НДС</p>
                       <p>Включает ФОТ, ГСМ, Ремонты, Аренду техника и накладные расходы.</p>
                     </div>
                   </div>
                   <div className="text-indigo-600/50 font-bold">-</div>
                   <div className="group/n relative border-b border-dashed border-indigo-500/50 cursor-help">
                     {formatCurrency(isYearlyView ? yearlyTotals.profitTax : yearlyTotals.profitTax / 12)}
                     <div className="absolute left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-600">
                       <p className="font-bold border-b border-slate-600 pb-1 mb-1">Налог с Прибыли / УСН</p>
                     </div>
                   </div>
                   <div className="text-indigo-600/50 font-bold">=</div>
                </div>

                <p className="text-4xl font-black text-indigo-100">{formatCurrency(isYearlyView ? yearlyTotals.netProfit : yearlyTotals.netProfit / 12)}</p>
             </div>

             <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-6 sm:pt-0 sm:pl-8 bg-emerald-900/40 -m-4 p-4 rounded-xl border border-emerald-800/50 group/holding relative">
                <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-dashed border-emerald-800 w-fit">
                  <CheckCircle2 className="w-4 h-4"/> Профит Холдинга
                </p>
                
                <div className="flex gap-1.5 flex-wrap text-[11px] font-mono mb-1 text-emerald-300/80 items-center">
                   <div className="group/n relative border-b border-dashed border-emerald-500/50 cursor-help">
                     {formatCurrency(isYearlyView ? yearlyTotals.netProfit : yearlyTotals.netProfit / 12)}
                     <div className="absolute right-0 sm:left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-emerald-600">
                       <p className="font-bold border-b border-emerald-600 pb-1 mb-1">Очищенная Чистая Прибыль УК</p>
                     </div>
                   </div>
                   <div className="text-emerald-600/50 font-bold">+</div>
                   <div className="group/n relative border-b border-dashed border-emerald-500/50 cursor-help">
                     {formatCurrency(isYearlyView ? yearlyTotals.rentNet : yearlyTotals.rentNet / 12)}
                     <div className="absolute right-0 sm:left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-emerald-600">
                       <p className="font-bold border-b border-emerald-600 pb-1 mb-1">Аренда, уплаченная Холдингу</p>
                       <p>Эти деньги физически остались внутри Группы Компаний (без НДС).</p>
                     </div>
                   </div>
                   {yearlyTotals.holdingVatBenefit > 0 && (
                      <>
                        <div className="text-emerald-600/50 font-bold">+</div>
                        <div className="group/n relative border-b border-dashed border-emerald-500/50 cursor-help text-emerald-200">
                          {formatCurrency(isYearlyView ? yearlyTotals.holdingVatBenefit : yearlyTotals.holdingVatBenefit / 12)}
                          <div className="absolute right-0 sm:left-0 top-full mt-2 w-max max-w-xs bg-slate-800 text-white text-[11px] font-sans rounded-xl p-3 shadow-xl opacity-0 group-hover/n:opacity-100 transition-opacity z-50 pointer-events-none border border-emerald-600">
                            <p className="font-bold border-b border-emerald-600 pb-1 mb-1">Экономия на НДС у Холдинга</p>
                            <p>Внутренние объемы создали Входящий НДС для других компаний Холдинга, генерируя экономию.</p>
                          </div>
                        </div>
                      </>
                   )}
                   <div className="text-emerald-600/50 font-bold">=</div>
                </div>

                <p className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{formatCurrency(isYearlyView ? yearlyTotals.holdingBenefit : yearlyTotals.holdingBenefit / 12)}</p>
             </div>
          </div>
          </div>
        </section>
        
        <CollapsibleSection title="Дашборды (Графики)" defaultOpen={false}>
          <DashboardCharts chartData={chartData} />
        </CollapsibleSection>

        <CollapsibleSection title="Стратегия и Налоги" defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Система Налогообложения</label>
              <select 
                value={settings.taxSystem} 
                onChange={e => setSettings({...settings, taxSystem: e.target.value as TaxSystem})} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="OSNO">ОСНО (НДС 22% + Прибыль 20%)</option>
                <option value="USN_5">УСН (Д-Р) + НДС 5%</option>
                <option value="USN_22">УСН (Д-Р) + НДС 22%</option>
              </select>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Базовые часы (ч/мес)</label>
              <input type="number" min="1" max="500" value={settings.maxHours} onChange={e => setSettings({...settings, maxHours: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
               <label className="text-sm font-semibold text-slate-700 mb-2 block">Аренда База+Офис (в мес)</label>
              <input type="number" step="10000" value={settings.fixedOverhead} onChange={e => setSettings({...settings, fixedOverhead: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
               <label className="text-sm font-semibold text-slate-700 mb-2 block text-blue-800">Бюджет Ремонта (в мес)</label>
              <input type="number" step="10000" value={settings.totalRepairBudget} onChange={e => setSettings({...settings, totalRepairBudget: Number(e.target.value)})} className="w-full bg-slate-50 border border-blue-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
            </div>
            <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50 flex flex-col justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow" onClick={() => setSettings({...settings, isOfficialWorker: !settings.isOfficialWorker})}>
               <div className="flex items-center justify-between">
                 <div>
                   <span className="font-bold text-orange-900 text-sm block">Белый ФОТ</span>
                   <span className="text-[10px] text-orange-700 font-medium">НДФЛ + Взносы</span>
                 </div>
                 <div className={cn("w-12 h-7 rounded-full transition-colors relative", settings.isOfficialWorker ? "bg-orange-500" : "bg-orange-200")}>
                    <div className={cn("absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm", settings.isOfficialWorker ? "translate-x-5" : "")} />
                 </div>
               </div>
            </div>
            <div className={cn("p-4 rounded-2xl border flex flex-col justify-center cursor-pointer transition-all shadow-sm hover:shadow-md", settings.isAzrfResident ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200")} onClick={() => setSettings({...settings, isAzrfResident: !settings.isAzrfResident})}>
               <div className="flex items-center justify-between">
                 <div>
                  <span className={cn("font-bold text-sm block", settings.isAzrfResident ? "text-blue-900" : "text-slate-700")}>Резидент АЗРФ</span>
                  <span className={cn("text-[10px] block font-medium", settings.isAzrfResident ? "text-blue-700" : "text-slate-500")}>Льгота 7.6% (вм. 30%)</span>
                 </div>
                 <div className={cn("w-12 h-7 rounded-full transition-colors relative", settings.isAzrfResident ? "bg-blue-600" : "bg-slate-200")}>
                    <div className={cn("absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm", settings.isAzrfResident ? "translate-x-5" : "")} />
                 </div>
               </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Автопарк" defaultOpen={true}>
          <div className="mt-4">
            <FleetManager 
              fleet={fleet} 
              updateVehicle={updateVehicle} 
              updateGroup={updateGroup} 
              calculatedData={calculatedBaseData} 
              settings={settings}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Календарь Загрузки" defaultOpen={false}>
          <div className="mt-4"><CalendarPlanner planData={planData} updatePlan={updatePlan} /></div>
        </CollapsibleSection>

      </div>

      <BusinessPlanNarrative 
        yearlyTotals={yearlyTotals} 
        settings={settings} 
        fleetCount={fleet.length} 
        visible={showReport}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}

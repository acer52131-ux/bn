import React from 'react';
import { formatCurrency, cn } from '../utils';
import { GlobalSettings } from '../types';
import { Printer, X } from 'lucide-react';

interface BusinessPlanNarrativeProps {
  yearlyTotals: any;
  settings: GlobalSettings;
  fleetCount: number;
  visible: boolean;
  onClose: () => void;
}

export function BusinessPlanNarrative({ yearlyTotals, settings, fleetCount, visible, onClose }: BusinessPlanNarrativeProps) {
  const isUSN = settings.taxSystem === 'USN_5' || settings.taxSystem === 'USN_22';
  const taxSysName = settings.taxSystem === 'USN_5' ? 'УСН (Доходы минус Расходы 15%) + НДС 5%' : 
                     settings.taxSystem === 'OSNO' ? 'ОСНО (НДС 22% + Прибыль 23%)' :
                     'УСН (Д-Р 15%) с уплатой НДС 22%';
                     
  return (
    <div className={cn("fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8 print:p-0 print:bg-white print:block transition-all", visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none print:opacity-100")}>
      <div className="bg-white max-w-4xl mx-auto rounded-3xl shadow-2xl p-8 sm:p-12 relative print:shadow-none print:p-0 print:border-none">
        
        <div className="absolute top-6 right-6 flex items-center gap-3 print:hidden">
          <button onClick={() => window.print()} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="font-serif text-black leading-relaxed max-w-[800px] mx-auto">
          <h1 className="text-3xl font-black mb-6 text-center print:text-left print:mt-12">Бизнес-план развития транспортного предприятия в контуре Холдинга</h1>
          
          <p className="mb-4 text-justify">
            Данный документ представляет собой финансовую модель и план развития транспортного предприятия, интегрированного в структуру головного холдинга.
          </p>

      <h2 className="text-xl font-bold mt-8 mb-4 border-b border-gray-300 pb-2">1. Концепция и Налоговое планирование</h2>
      <p className="mb-4 text-justify">
        Предприятие выступает поставщиком транспортных услуг как внешним заказчикам (генерация открытого дохода), так и внутренним структурам холдинга (обеспечение логистической безопасности). 
      </p>

      <ul className="list-disc pl-8 mb-6 space-y-2">
        <li><strong>Размер парка:</strong> {fleetCount} ед. техники</li>
        <li><strong>Система Налогообложения:</strong> {taxSysName}</li>
        <li><strong>Статус резидента АЗРФ:</strong> {settings.isAzrfResident ? 'Да, применяется льгота на страховые взносы (7.6% вместо 30%)' : 'Нет льготы по взносам'}</li>
        <li><strong>ФОТ:</strong> {settings.isOfficialWorker ? 'Белый штат, учитываются все социальные отчисления и НДФЛ' : 'Непрозрачный штат (риски)'}</li>
        <li><strong>Накладные расходы (База+Офис):</strong> {formatCurrency(settings.fixedOverhead)} в месяц</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-4 border-b border-gray-300 pb-2">2. Годовая Финансовая Проекция и Налоги ({taxSysName})</h2>
      <p className="mb-4">На основании заданных параметров загрузки, тарифов, сезонных спадов (модификаторов) и смещений в пользу внешней/внутренней аренды рассчитаны следующие годовые показатели:</p>
      
      <table className="w-full border-collapse border border-gray-400 mb-6 text-sm">
         <tbody>
            <tr className="bg-slate-50">
              <td className="border border-gray-400 p-2 font-bold w-2/3">Выручка (включая Исходящий НДС)</td>
              <td className="border border-gray-400 p-2 text-right">{formatCurrency(yearlyTotals.revenueGross)}</td>
            </tr>
            {settings.taxSystem !== 'USN_5' && (
              <>
                <tr className="bg-blue-50 relative group">
                  <td className="border border-gray-400 p-2 font-bold text-blue-900">Сумма Исходящего НДС (получено в составе выручки)</td>
                  <td className="border border-gray-400 p-2 text-right text-blue-900 font-bold">{formatCurrency(yearlyTotals.outputVat)}</td>
                </tr>
                <tr className="bg-slate-100 relative group">
                  <td className="border border-gray-400 p-2 font-bold text-slate-700">Итого Входящего НДС к вычету (уплачено поставщикам и холдингу)</td>
                  <td className="border border-gray-400 p-2 text-right text-slate-700 font-bold text-indigo-700">{formatCurrency(yearlyTotals.totalInputVat)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 text-sm text-slate-600 pl-6 border-l-4 border-l-slate-300">
                     - из них НДС, уплаченный на сторону (за ГСМ, запчасти и сторонние ремонты)
                  </td>
                  <td className="border border-gray-400 p-2 text-right text-slate-600">{formatCurrency(yearlyTotals.totalInputVat - yearlyTotals.rentVatInput)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 text-sm text-slate-600 pl-6 border-b border-indigo-200 border-l-4 border-l-indigo-300">
                     - из них предъявленный НДС за Аренду ТС (передан в Головную компанию)
                  </td>
                  <td className="border border-gray-400 p-2 text-right text-slate-800 border-b border-indigo-200 font-bold">{formatCurrency(yearlyTotals.rentVatInput)}</td>
                </tr>
              </>
            )}
            <tr className="bg-rose-50">
              <td className="border border-gray-400 p-2 font-bold text-rose-900 border-t-2 border-rose-300">Итого НДС к уплате в бюджет транспортной компанией</td>
              <td className="border border-gray-400 p-2 text-right font-bold text-rose-700 border-t-2 border-rose-300">
                {formatCurrency(yearlyTotals.vatPayable)}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold text-blue-900">Чистая Прибыль транспортной компании</td>
              <td className="border border-gray-400 p-2 text-right font-bold text-blue-700">{formatCurrency(yearlyTotals.netProfit)}</td>
            </tr>
            <tr className="bg-slate-50">
               <td className="border border-gray-400 p-2 font-bold text-slate-700 mt-4">Объем аренды, выставленный Головной компанией</td>
               <td className="border border-gray-400 p-2 text-right font-bold text-slate-700">
                 {formatCurrency(yearlyTotals.rentNet)} <span className="text-xs font-normal text-slate-500">без НДС</span>
                 {yearlyTotals.rentVatInput > 0 && <span className="block text-[10px] text-slate-400 mt-1">+ {formatCurrency(yearlyTotals.rentVatInput)} НДС</span>}
               </td>
            </tr>
         </tbody>
      </table>

      {settings.taxSystem !== 'USN_5' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 leading-relaxed mb-6">
           <h4 className="font-bold text-sm mb-2">Формирование НДС и консолидация по Холдингу:</h4>
           <ul className="list-disc pl-5 space-y-1">
             <li>Транспортная компания оказывает услуги и получает доход, из которого формируется <strong>Исходящий НДС</strong>. В году этот объем составил <strong>{formatCurrency(yearlyTotals.outputVat)}</strong>.</li>
             <li>Для снижения налоговой нагрузки часть НДС перекрывается затратами. <strong>Входящий НДС</strong> от внешних контрагентов (ГСМ, ремонты) составил <strong>{formatCurrency(yearlyTotals.totalInputVat - yearlyTotals.rentVatInput)}</strong>.</li>
             <li>Чтобы транспортной компании не приходилось платить большой остаточный НДС в бюджет, <strong>Головная компания (Холдинг)</strong> передает в аренду транспорт, формируя <strong>крупный расходный счет с НДС</strong>.</li>
             <li>НДС, переданный Головной компании за аренду, составил <strong>{formatCurrency(yearlyTotals.rentVatInput)}</strong>. На эту сумму транспортная компания <em>уменьшила</em> свои налоги, а Головная компания приняла эти средства как свой НДС к уплате. Впоследствии Головная компания перекроет данный НДС своими общехозяйственными расходами.</li>
           </ul>
        </div>
      )}

      <h2 className="text-xl font-bold mt-8 mb-4 border-b border-gray-300 pb-2">3. Синергия с Холдингом</h2>
      <p className="mb-4 text-justify">
        Помимо собственной чистой прибыли, транспортное предприятие генерирует финансовый поток для головного холдинга за счет арендных платежей (лизинга) за предоставленную технику. 
        При условии что головная компания является владельцем активов:
      </p>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <p className="font-bold text-center text-lg mb-2">Общий консолидированный эффект Холдинга</p>
        <p className="text-center text-2xl font-black text-green-700">{formatCurrency(yearlyTotals.holdingBenefit)} / год</p>
        <p className="text-xs text-center text-gray-600 mt-2">Включает в себя чистую прибыль предприятия ({formatCurrency(yearlyTotals.netProfit)}) и суммарную выручку по аренде внутри группы ({formatCurrency(yearlyTotals.rentNet)})</p>
      </div>

          <p className="text-sm italic text-gray-500 mt-12 text-center print:text-left">
             Отчет сформирован автоматически модулем бизнес-планирования.
          </p>
        </div>
      </div>
    </div>
  );
}

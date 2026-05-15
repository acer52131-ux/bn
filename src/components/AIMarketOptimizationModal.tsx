import React, { useState } from 'react';
import { X, TrendingUp, LineChart, Target, DollarSign } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIMarketOptimizationModalProps {
  visible: boolean;
  onClose: () => void;
  analysisData: any;
}

export function AIMarketOptimizationModal({ visible, onClose, analysisData }: AIMarketOptimizationModalProps) {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/optimize-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: analysisData })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 print:hidden transition-all duration-300">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI Маркетолог: Оптимизация</h2>
              <p className="text-xs text-slate-500 font-medium">Проверка рыночных цен и максимизация прибыли</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          {!analysisResult && !loading && !error && (
            <div className="flex flex-col items-center justify-center text-center h-full max-w-md mx-auto space-y-6">
              <div className="flex gap-4">
                 <LineChart className="w-16 h-16 text-teal-500" />
                 <Target className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Найти точки роста прибыли?</h3>
                <p className="text-sm text-slate-600">
                  Нейросеть проанализирует ваши тарифы (внутренние и внешние), выбранную систему налогообложения, загрузку и составит рекомендации по увеличению рентабельности до рыночного максимума.
                </p>
              </div>
              <button 
                onClick={runAnalysis}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg transition-transform hover:-translate-y-1 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3"
              >
                <DollarSign className="w-6 h-6" /> Запустить проверку
              </button>
            </div>
          )}

          {loading && (
             <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-emerald-700 font-semibold animate-pulse">Анализ рынка и поиск оптимальной модели...</p>
             </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center">
               <p className="text-red-800 font-bold mb-1">Ошибка генерации отчета</p>
               <p className="text-sm text-red-600">{error}</p>
               <button onClick={runAnalysis} className="mt-4 px-6 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200">
                 Попробовать снова
               </button>
            </div>
          )}

          {analysisResult && (
             <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-emerald-600 prose-p:text-slate-700 prose-strong:text-slate-900 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="markdown-body">
                   <ReactMarkdown>{analysisResult}</ReactMarkdown>
                </div>
             </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

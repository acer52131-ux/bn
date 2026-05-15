import React, { useState } from 'react';
import { X, Bot, AlertTriangle, ShieldCheck, FileSearch } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../utils';

interface AIAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  analysisData: any;
}

export function AIAnalysisModal({ visible, onClose, analysisData }: AIAnalysisModalProps) {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze-tax-risks', {
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
              <Bot className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI Аудит Налоговых Рисков</h2>
              <p className="text-xs text-slate-500 font-medium">Проверка на схемы уклонения и законность модели</p>
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
                 <ShieldCheck className="w-16 h-16 text-emerald-500" />
                 <AlertTriangle className="w-16 h-16 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Готовы начать проверку?</h3>
                <p className="text-sm text-slate-600">
                  Алгоритм проанализирует входящие параметры ФОТ, налоги, статус резидента, процент внутригрупповых сделок и маржинальность. Он выявит красные флаги для налоговой (ФНС) по 54-ФЗ и ст. 54.1 НК РФ.
                </p>
              </div>
              <button 
                onClick={runAnalysis}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-lg transition-transform hover:-translate-y-1 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3"
              >
                <FileSearch className="w-6 h-6" /> Запустить AI Аудит
              </button>
            </div>
          )}

          {loading && (
             <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-purple-700 font-semibold animate-pulse">Анализ схем и судебной практики ФНС...</p>
             </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center">
               <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
               <p className="text-red-800 font-bold mb-1">Ошибка генерации отчета</p>
               <p className="text-sm text-red-600">{error}</p>
               <button onClick={runAnalysis} className="mt-4 px-6 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200">
                 Попробовать снова
               </button>
            </div>
          )}

          {analysisResult && (
             <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-purple-600 prose-p:text-slate-700 prose-strong:text-slate-900 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
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

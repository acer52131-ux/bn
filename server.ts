import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use raw JSON limits for large prompts
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/analyze-tax-risks', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing from environment' });
      }

      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'No data provided for analysis' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Ты опытный налоговый консультант и юрист в РФ. Твоя задача проверить предложенную финансовую модель транспортного предприятия на риски уклонения от уплаты налогов (дробление бизнеса, трансфертное ценообразование, подмена трудовых отношений и т.д.).
Система должна определить критические точки, показать, как налоговая может на это отреагировать, и вынести вердикт: выглядит ли это как законная оптимизация (легитимно) или как уклонение от налогов.

Вводные данные (ОБЯЗАТЕЛЬНО УЧТИ ЭТИ ПАРАМЕТРЫ, не придумывай свои):
- Резидент АЗРФ: ${data.settings.isAzrfResident ? 'ДА (льгота по взносам 7.6%)' : 'НЕТ (взносы 30.2%)'}
- Белый ФОТ (Официальное трудоустройство): ${data.settings.isOfficialWorker ? 'ДА' : 'НЕТ'}
- Система налогообложения: ${data.settings.taxSystem}
- Все данные:
${JSON.stringify({
  settings: data.settings,
  yearlyTotals: data.yearlyTotals,
  fleet: data.fleet
}, null, 2)}

Составь подробный отчет, выделяя критические точки (ФОТ, льготы, внутригрупповые операции/НДС), оценивая риски и давая конкретный вердикт по каждому пункту и общий итог. Отчет должен быть структурированным (в формате Markdown).
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error('Error generating tax analysis:', error);
      let errorMessage = error.message || 'Ошибка генерации отчета';
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
         errorMessage = 'Ключ API недействителен. Пожалуйста, зайдите в настройки (Settings -> Secrets) и укажите рабочий GEMINI_API_KEY.';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post('/api/optimize-market', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing from environment' });
      }

      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'No data provided for optimization' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Ты финансовый директор и эксперт по рынку аренды спецтехники. Твоя задача: проанализировать бизнес-план и параметры автопарка на предмет того, как максимизировать выручку и чистую прибыль.

Твои задачи:
1. Оценить правильность выбора системы налогообложения для этих параметров (сравни ОСНО, УСН Д-Р 15%+НДС, УСН Д-Р без НДС).
2. Оценить адекватность текущих рыночных цен (внешний тариф, внутренний тариф). Укажи на возможные ошибки ценообразования.
3. Дать предложения по оптимизации тарифов. Насколько их нужно поднять/опустить, чтобы быть в рынке, но извлекать максимальную маржинальность?
4. Рассмотреть структуру расходов (ГСМ, ЗП, ремонт, лизинг/амортизация) и дать рекомендации.

Вводные данные (ПРИМИ ВО ВНИМАНИЕ):
- Резидент АЗРФ: ${data.settings.isAzrfResident ? 'ДА' : 'НЕТ'}
- Официальный ФОТ: ${data.settings.isOfficialWorker ? 'ДА' : 'НЕТ'}
- Система налогообложения: ${data.settings.taxSystem}
- Все данные:
${JSON.stringify({
  settings: data.settings,
  yearlyTotals: data.yearlyTotals,
  fleet: data.fleet
}, null, 2)}

Составь подробный, конкретный ответ в формате Markdown с рекомендациями цен и оптимальной системы налогообложения.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error('Error generating market optimization:', error);
      let errorMessage = error.message || 'Ошибка генерации отчета';
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
         errorMessage = 'Ключ API недействителен. Пожалуйста, зайдите в настройки (Settings -> Secrets) и укажите рабочий GEMINI_API_KEY.';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

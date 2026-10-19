const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add jsPDF & html2canvas to <head>
const headScriptsTarget = `    <!-- Chart.js for Spider Radar & Bar charts -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>`;

const headScriptsReplacement = `    <!-- Chart.js for Spider Radar & Bar charts -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

    <!-- jsPDF & html2canvas for PDF Report Generation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>`;

if (!html.includes(headScriptsTarget)) {
  console.error("Head scripts target not found!");
  process.exit(1);
}
html = html.replace(headScriptsTarget, headScriptsReplacement);
console.log("jsPDF & html2canvas script tags added to <head>.");

// 2. Add Export PDF button to the Results section
const resultsBtnTarget = `          <div class="flex items-center gap-2">
            <button id="btnCopyReport" class="px-3 py-2 rounded-xl bg-white dark:bg-[#172033] hover:bg-[#F3F7FC] dark:hover:bg-[#1E2B45] text-[#0F172A] dark:text-[#E6EDF7] border border-[#D1DEEE] dark:border-[#202C45] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5" title="Copy Report">
              <span>📋</span> <span id="txtBtnCopy">Copy</span>
            </button>
            <button id="btnDownloadReport" class="px-3 py-2 rounded-xl bg-white dark:bg-[#172033] hover:bg-[#F3F7FC] dark:hover:bg-[#1E2B45] text-[#0F172A] dark:text-[#E6EDF7] border border-[#D1DEEE] dark:border-[#202C45] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5" title="Download PNG Report">
              <span>📥</span> <span id="txtBtnDownload">Download PNG</span>
            </button>`;

const resultsBtnReplacement = `          <div class="flex flex-wrap items-center gap-2">
            <button id="btnExportPdf" class="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5" title="Экспорт отчёта в PDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span id="txtBtnExportPdf">Экспорт в PDF</span>
            </button>
            <button id="btnCopyReport" class="px-3 py-2 rounded-xl bg-white dark:bg-[#172033] hover:bg-[#F3F7FC] dark:hover:bg-[#1E2B45] text-[#0F172A] dark:text-[#E6EDF7] border border-[#D1DEEE] dark:border-[#202C45] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5" title="Copy Report">
              <span>📋</span> <span id="txtBtnCopy">Copy</span>
            </button>
            <button id="btnDownloadReport" class="px-3 py-2 rounded-xl bg-white dark:bg-[#172033] hover:bg-[#F3F7FC] dark:hover:bg-[#1E2B45] text-[#0F172A] dark:text-[#E6EDF7] border border-[#D1DEEE] dark:border-[#202C45] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5" title="Download PNG Report">
              <span>🖼️</span> <span id="txtBtnDownload">PNG</span>
            </button>`;

if (!html.includes(resultsBtnTarget)) {
  console.error("Results button target not found!");
  process.exit(1);
}
html = html.replace(resultsBtnTarget, resultsBtnReplacement);
console.log("PDF export button added to results header.");

// 3. Add Export PDF Modal right before methodologyModal
const modalExportTarget = `    <!-- Methodology Reference Modal -->
    <div id="methodologyModal"`;

const modalExportReplacement = `    <!-- PDF Export Settings Modal (Selects Looksmaxing Model) -->
    <div id="modalExportPdf" class="fixed inset-0 z-50 bg-[#0B0F1A]/85 backdrop-blur-md flex items-center justify-center p-4 hidden">
      <div class="bg-white dark:bg-[#131B2E] border border-[#D1DEEE] dark:border-[#202C45] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl flex flex-col gap-5">
        <div class="flex items-center justify-between pb-3 border-b border-[#D1DEEE] dark:border-[#202C45]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center text-lg font-bold">
              📄
            </div>
            <div>
              <h3 id="txtPdfModalTitle" class="font-bold text-base sm:text-lg text-[#0F172A] dark:text-[#E6EDF7]">
                Экспорт отчёта в PDF
              </h3>
              <p id="txtPdfModalSubtitle" class="text-xs text-[#52627A] dark:text-[#8E9EB5]">
                Выберите модель луксмаксинга для формирования отчёта и рекомендаций
              </p>
            </div>
          </div>
          <button id="btnClosePdfModal" class="p-1 rounded-lg text-[#52627A] dark:text-[#8E9EB5] hover:text-[#0F172A] dark:hover:text-[#E6EDF7] cursor-pointer" title="Закрыть">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Choice of Model for PDF Export -->
        <div class="flex flex-col gap-2.5">
          <span id="txtPdfChooseModelPrompt" class="text-xs font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Для какой модели луксмаксинга экспортировать?
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- European Model Option -->
            <label id="lblExportModelWestern" class="relative p-4 rounded-2xl border-2 border-[#2563EB] bg-[#2563EB]/5 cursor-pointer flex flex-col gap-2 transition-all">
              <div class="flex items-center justify-between">
                <span class="text-2xl">🇪🇺</span>
                <input type="radio" name="exportPdfModel" value="western" class="accent-[#2563EB]" checked />
              </div>
              <span id="txtPdfOptWesternTitle" class="font-bold text-xs text-[#0F172A] dark:text-[#E6EDF7]">Европейская (Western PSL)</span>
              <span id="txtPdfOptWesternDesc" class="text-[11px] text-[#52627A] dark:text-[#8E9EB5] leading-snug">
                Квадратная челюсть, острый угол, Hunter eyes, массивный подбородок, ранги Chad/HTN.
              </span>
            </label>

            <!-- Asian Model Option -->
            <label id="lblExportModelAsian" class="relative p-4 rounded-2xl border-2 border-transparent bg-[#F3F7FC] dark:bg-[#172033] cursor-pointer flex flex-col gap-2 transition-all hover:border-[#2563EB]/50">
              <div class="flex items-center justify-between">
                <span class="text-2xl">🇰🇷</span>
                <input type="radio" name="exportPdfModel" value="asian" class="accent-[#2563EB]" />
              </div>
              <span id="txtPdfOptAsianTitle" class="font-bold text-xs text-[#0F172A] dark:text-[#E6EDF7]">Азиатская (K-Aesthetics)</span>
              <span id="txtPdfOptAsianDesc" class="text-[11px] text-[#52627A] dark:text-[#8E9EB5] leading-snug">
                V-Line овал, мягкий угол, неотения 1:1:0.8, миндалевидные глаза, эгьё-саль, ранги Idol/Visual.
              </span>
            </label>
          </div>
        </div>

        <!-- Options Checklist -->
        <div class="p-3.5 rounded-2xl bg-[#F3F7FC] dark:bg-[#172033] border border-[#D1DEEE] dark:border-[#202C45] flex flex-col gap-2.5 text-xs">
          <label class="flex items-center gap-2.5 cursor-pointer text-[#0F172A] dark:text-[#E6EDF7] font-medium">
            <input type="checkbox" id="chkPdfAttachFacePhoto" checked class="rounded border-[#D1DEEE] dark:border-[#202C45] text-[#2563EB] w-4 h-4 cursor-pointer" />
            <span id="txtPdfAttachPhoto">Прикрепить фото лица с антропометрическими линиями и маркерами</span>
          </label>
          <label class="flex items-center gap-2.5 cursor-pointer text-[#0F172A] dark:text-[#E6EDF7] font-medium">
            <input type="checkbox" id="chkPdfIncludeAdvice" checked class="rounded border-[#D1DEEE] dark:border-[#202C45] text-[#2563EB] w-4 h-4 cursor-pointer" />
            <span id="txtPdfIncludeAdvice">Включить подробный раздел персональных советов и шагов</span>
          </label>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button id="btnCancelPdfExport" class="px-4 py-2 rounded-xl text-xs font-semibold text-[#52627A] dark:text-[#8E9EB5] hover:text-[#0F172A] dark:hover:text-[#E6EDF7] cursor-pointer">
            Отмена
          </button>
          <button id="btnConfirmGeneratePdf" class="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer">
            <svg id="pdfSpinnerIcon" class="w-4 h-4 hidden animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            <span id="txtBtnConfirmGeneratePdf">Сгенерировать и скачать PDF</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Methodology Reference Modal -->
    <div id="methodologyModal"`;

if (!html.includes(modalExportTarget)) {
  console.error("Methodology modal target not found for export modal placement!");
  process.exit(1);
}
html = html.replace(modalExportTarget, modalExportReplacement);
console.log("PDF export modal HTML structure added.");

// 4. Update translations dictionaries with PDF keys
const enKeys = `
          btnExportPdf: 'Export PDF',
          pdfModalTitle: 'Export Looksmaxing Report to PDF',
          pdfModalSubtitle: 'Select looksmaxing standard for report generation & advice calibration',
          pdfChooseModelPrompt: 'Which looksmaxing model to export for?',
          pdfOptWesternTitle: 'European Model (Western PSL)',
          pdfOptWesternDesc: 'Square jaw, sharp angle, Hunter eyes, prominent chin, Chad/HTN tiers.',
          pdfOptAsianTitle: 'East Asian Model (K-Aesthetics)',
          pdfOptAsianDesc: 'V-Line oval, soft angle, neotenous 1:1:0.8 thirds, almond eyes, aegyo-sal, Idol/Visual tiers.',
          pdfAttachPhoto: 'Attach captured face photo with measurement markers & lines',
          pdfIncludeAdvice: 'Include tailored personal recommendations & looksmaxing advice',
          btnConfirmGeneratePdf: 'Generate & Download PDF',
          btnCancel: 'Cancel',
          pdfGenerating: 'Generating PDF...',
`;

const ruKeys = `
          btnExportPdf: 'Экспорт в PDF',
          pdfModalTitle: 'Экспорт отчёта в PDF',
          pdfModalSubtitle: 'Выберите модель луксмаксинга для формирования отчёта и рекомендаций',
          pdfChooseModelPrompt: 'Для какой модели луксмаксинга экспортировать?',
          pdfOptWesternTitle: 'Европейская модель (Western PSL)',
          pdfOptWesternDesc: 'Квадратная челюсть, острый угол, Hunter eyes, массивный подбородок, ранги Chad/HTN.',
          pdfOptAsianTitle: 'Азиатская модель (K-Aesthetics)',
          pdfOptAsianDesc: 'V-Line овал, мягкий угол, неотения 1:1:0.8, миндалевидные глаза, эгьё-саль, ранги Idol/Visual.',
          pdfAttachPhoto: 'Прикрепить фото лица с антропометрическими линиями и маркерами',
          pdfIncludeAdvice: 'Включить подробный раздел персональных советов и шагов',
          btnConfirmGeneratePdf: 'Сгенерировать и скачать PDF',
          btnCancel: 'Отмена',
          pdfGenerating: 'Формирование PDF...',
`;

const deKeys = `
          btnExportPdf: 'PDF-Export',
          pdfModalTitle: 'Looksmaxing-Bericht als PDF exportieren',
          pdfModalSubtitle: 'Wählen Sie das Ästhetikmodell für die Analyse und Empfehlungen',
          pdfChooseModelPrompt: 'Für welches Looksmaxing-Modell soll exportiert werden?',
          pdfOptWesternTitle: 'Europäisches Modell (Western PSL)',
          pdfOptWesternDesc: 'Markanter Kiefer, spitzer Winkel, Hunter Eyes, dominantes Kinn, Chad/HTN Ränge.',
          pdfOptAsianTitle: 'Ostasiatisches Modell (K-Aesthetics)',
          pdfOptAsianDesc: 'V-Line Oval, weicher Winkel, 1:1:0.8 Neotenie, Mandelaugen, Aegyo-Sal, Idol/Visual.',
          pdfAttachPhoto: 'Foto mit biometrischen Markierungen und Linien anhängen',
          pdfIncludeAdvice: 'Detaillierte Ratschläge und Looksmaxing-Schritte einbeziehen',
          btnConfirmGeneratePdf: 'PDF erstellen & herunterladen',
          btnCancel: 'Abbrechen',
          pdfGenerating: 'PDF wird erstellt...',
`;

const enIdx = html.indexOf('        en: {');
html = html.slice(0, enIdx + 13) + enKeys + html.slice(enIdx + 13);
const ruIdx = html.indexOf('        ru: {');
html = html.slice(0, ruIdx + 13) + ruKeys + html.slice(ruIdx + 13);
const deIdx = html.indexOf('        de: {');
html = html.slice(0, deIdx + 13) + deKeys + html.slice(deIdx + 13);

console.log("Translations updated with PDF export keys.");

// 5. Update calculatePslMetrics to accept modelOverride
const calcOldSig = `      function calculatePslMetrics(landmarks, imgWidth, imgHeight) {
        const p = landmarks.map(pt => ({
          x: pt.x * imgWidth,
          y: pt.y * imgHeight,
          z: (pt.z || 0) * imgWidth
        }));

        const nasionPt = p[168] || p[6];
        const subnasalePt = p[2] || p[94];
        const upperVermilionPt = p[0] || p[13];
        const chinPt = p[152];
        const eyeMid = { x: (p[33].x + p[263].x) / 2, y: (p[33].y + p[263].y) / 2 };

        const dX = p[263].x - p[33].x;
        const dY = p[263].y - p[33].y;
        const eyeDist = Math.sqrt(dX * dX + dY * dY) || 1.0;
        const vX = { x: dX / eyeDist, y: dY / eyeDist };
        const vY = { x: -vX.y, y: vX.x };
        const uUp = { x: -vY.x, y: -vY.y };

        const cfg = AESTHETIC_CONFIG[currentAestheticModel] || AESTHETIC_CONFIG.western;`;

const calcNewSig = `      function calculatePslMetrics(landmarks, imgWidth, imgHeight, modelOverride) {
        const p = landmarks.map(pt => ({
          x: pt.x * imgWidth,
          y: pt.y * imgHeight,
          z: (pt.z || 0) * imgWidth
        }));

        const nasionPt = p[168] || p[6];
        const subnasalePt = p[2] || p[94];
        const upperVermilionPt = p[0] || p[13];
        const chinPt = p[152];
        const eyeMid = { x: (p[33].x + p[263].x) / 2, y: (p[33].y + p[263].y) / 2 };

        const dX = p[263].x - p[33].x;
        const dY = p[263].y - p[33].y;
        const eyeDist = Math.sqrt(dX * dX + dY * dY) || 1.0;
        const vX = { x: dX / eyeDist, y: dY / eyeDist };
        const vY = { x: -vX.y, y: vX.x };
        const uUp = { x: -vY.x, y: -vY.y };

        const activeModelKey = modelOverride || currentAestheticModel;
        const cfg = AESTHETIC_CONFIG[activeModelKey] || AESTHETIC_CONFIG.western;`;

if (!html.includes(calcOldSig)) {
  console.error("calculatePslMetrics signature target not found!");
  process.exit(1);
}
html = html.replace(calcOldSig, calcNewSig);

const cheekOld = `        const cheekboneScore = currentAestheticModel === 'asian'
          ? scoreMetricPsl(cheekboneRatio, 1.13, 1.11, 1.25)
          : scoreMetricPsl(cheekboneRatio, 1.15, 1.25, 1.08);`;

const cheekNew = `        const cheekboneScore = activeModelKey === 'asian'
          ? scoreMetricPsl(cheekboneRatio, 1.13, 1.11, 1.25)
          : scoreMetricPsl(cheekboneRatio, 1.15, 1.25, 1.08);`;

html = html.replace(cheekOld, cheekNew);

const returnOld = `        return {
          finalScore: parseFloat(finalPslScore.toFixed(1)),
          tierKey,
          canthalDeg: canthalTilt,`;

const returnNew = `        return {
          finalScore: parseFloat(finalPslScore.toFixed(1)),
          tierKey,
          modelKey: activeModelKey,
          canthalDeg: canthalTilt,`;

html = html.replace(returnOld, returnNew);
console.log("calculatePslMetrics updated with modelOverride support.");

// 6. Extract getAdviceItems helper and implement exportReportToPdf
const adviceRenderOld = `      function renderAdviceCards(analysis) {
        const container = document.getElementById("adviceCardsContainer");
        if (!container) return;
        container.innerHTML = "";
        const lang = currentLang;

        // Rank all 11 metrics by score ascending (lowest score / highest priority first)
        const metricList = Object.keys(analysis.metrics).map(k => {
          const item = analysis.metrics[k];
          return {
            key: k,
            score: parseFloat(item.score),
            num: typeof item.num === "number" ? item.num : parseFloat(item.val),
            val: item.val,
            ideal: item.ideal
          };
        });
        metricList.sort((a, b) => a.score - b.score);

        const cards = [];

        // 1. Identify all metrics that dipped below ideal (score < 7.5)
        const weakEntries = metricList.filter(m => m.score < 7.5);

        // Render tailored practical card for EACH dipping metric (shows all dipping parameters!)
        weakEntries.forEach(item => {
          const activeCatalog = currentAestheticModel === 'asian' ? ASIAN_ADVICE_CATALOG : ADVICE_CATALOG;
          const cat = activeCatalog[item.key] || ADVICE_CATALOG[item.key];
          if (!cat) return;

          // Determine exact direction: low vs high
          let adviceVariant = cat.low || cat.weak;
          if (cat.high && item.num !== undefined) {
            if (item.key === "fwhr" && item.num > 2.05) adviceVariant = cat.high;
            else if (item.key === "midface" && item.num < 0.98) adviceVariant = cat.high;
            else if (item.key === "canthal" && item.num > 6.5) adviceVariant = cat.high;
            else if (item.key === "eyeAspect" && item.num < 0.28) adviceVariant = cat.high;
            else if (item.key === "cpr" && item.num > 2.28) adviceVariant = cat.high;
            else if (item.key === "jawToFace" && item.num > 0.91) adviceVariant = cat.high;
            else if (item.key === "jawAngle" && item.num < 92) adviceVariant = cat.high;
            else if (item.key === "esr" && item.num > 0.470) adviceVariant = cat.high;
            else if (item.key === "thirds" && item.num > 1.08) adviceVariant = cat.high;
            else if (item.key === "lipRatio" && item.num > 1.72) adviceVariant = cat.high;
            else if (item.key === "symmetry" && item.score >= 6.5) adviceVariant = cat.high;
          }

          const title = adviceVariant.title[lang] || adviceVariant.title.en;
          const desc = adviceVariant.desc[lang] || adviceVariant.desc.en;

          let severityTag = lang === "ru" ? "Зона оптимизации" : (lang === "de" ? "Optimierungsbereich" : "Optimization Zone");
          let severityColor = "border-[#D1DEEE] dark:border-[#202C45] bg-[#F3F7FC] dark:bg-[#172033] text-[#0F172A] dark:text-[#E6EDF7]";
          let badgeBg = "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300";

          if (item.score < 4.8) {
            severityTag = lang === "ru" ? "Критическое проседание" : (lang === "de" ? "Kritisches Defizit" : "Critical Deficit");
            severityColor = "border-rose-300 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-[#0F172A] dark:text-[#E6EDF7]";
            badgeBg = "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold";
          } else if (item.score < 6.5) {
            severityTag = lang === "ru" ? "Заметное отклонение" : (lang === "de" ? "Mäßige Abweichung" : "Moderate Deviation");
            severityColor = "border-amber-300 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 text-[#0F172A] dark:text-[#E6EDF7]";
            badgeBg = "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold";
          }

          const metricDict = translations[lang]?.metricNames || translations.en.metricNames;
          const metricDisplay = metricDict[item.key] || item.key.toUpperCase();

          cards.push({
            tag: \`\${severityTag} • \${item.score.toFixed(1)} / 10\`,
            metricName: metricDisplay,
            title,
            metricVal: item.val,
            idealVal: item.ideal,
            desc,
            color: severityColor,
            badgeBg
          });
        });

        // 2. If fewer than 2 lagging metrics, include the top genetic halo strength(s)
        if (weakEntries.length < 2) {
          const strongEntries = metricList.filter(m => m.score >= 7.5).reverse();
          const haloCandidates = strongEntries.slice(0, 3 - weakEntries.length);
          haloCandidates.forEach(strongItem => {
            const cat = ADVICE_CATALOG[strongItem.key];
            if (cat && cat.strong) {
              const title = cat.strong.title[lang] || cat.strong.title.en;
              const desc = cat.strong.desc[lang] || cat.strong.desc.en;
              const metricDict = translations[lang]?.metricNames || translations.en.metricNames;
              const metricDisplay = metricDict[strongItem.key] || strongItem.key.toUpperCase();
              cards.push({
                tag: (lang === "ru" ? "Сильная генетическая черта" : (lang === "de" ? "Genetische Stärke" : "Genetic Strength")) + \` • \${strongItem.score.toFixed(1)} / 10\`,
                metricName: metricDisplay,
                title,
                metricVal: strongItem.val,
                idealVal: strongItem.ideal,
                desc,
                color: "border-emerald-300 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-[#0F172A] dark:text-[#E6EDF7]",
                badgeBg: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold"
              });
            }
          });
        }`;

const adviceRenderNew = `      // Helper to generate tailored advice items for any analysis, model, and language
      function getAdviceItems(analysis, modelKey, lang) {
        if (!analysis || !analysis.metrics) return [];
        const activeModel = modelKey || analysis.modelKey || currentAestheticModel;
        const activeLang = lang || currentLang;

        const metricList = Object.keys(analysis.metrics).map(k => {
          const item = analysis.metrics[k];
          return {
            key: k,
            score: parseFloat(item.score),
            num: typeof item.num === "number" ? item.num : parseFloat(item.val),
            val: item.val,
            ideal: item.ideal
          };
        });
        metricList.sort((a, b) => a.score - b.score);

        const cards = [];
        const weakEntries = metricList.filter(m => m.score < 7.5);

        weakEntries.forEach(item => {
          const activeCatalog = activeModel === 'asian' ? ASIAN_ADVICE_CATALOG : ADVICE_CATALOG;
          const cat = activeCatalog[item.key] || ADVICE_CATALOG[item.key];
          if (!cat) return;

          let adviceVariant = cat.low || cat.weak;
          if (cat.high && item.num !== undefined) {
            if (activeModel === 'asian') {
              if (item.key === "fwhr" && item.num > 1.82) adviceVariant = cat.high;
              else if (item.key === "midface" && item.num < 0.94) adviceVariant = cat.high;
              else if (item.key === "canthal" && item.num > 5.0) adviceVariant = cat.high;
              else if (item.key === "eyeAspect" && item.num < 0.33) adviceVariant = cat.low;
              else if (item.key === "cpr" && item.num > 1.88) adviceVariant = cat.high;
              else if (item.key === "jawToFace" && item.num > 0.77) adviceVariant = cat.high;
              else if (item.key === "jawAngle" && item.num < 118) adviceVariant = cat.low;
              else if (item.key === "esr" && item.num > 0.470) adviceVariant = cat.high;
              else if (item.key === "thirds" && item.num > 0.90) adviceVariant = cat.high;
              else if (item.key === "lipRatio" && item.num > 1.50) adviceVariant = cat.high;
              else if (item.key === "symmetry" && item.score >= 6.5) adviceVariant = cat.high;
            } else {
              if (item.key === "fwhr" && item.num > 2.05) adviceVariant = cat.high;
              else if (item.key === "midface" && item.num < 0.98) adviceVariant = cat.high;
              else if (item.key === "canthal" && item.num > 6.5) adviceVariant = cat.high;
              else if (item.key === "eyeAspect" && item.num < 0.28) adviceVariant = cat.high;
              else if (item.key === "cpr" && item.num > 2.28) adviceVariant = cat.high;
              else if (item.key === "jawToFace" && item.num > 0.91) adviceVariant = cat.high;
              else if (item.key === "jawAngle" && item.num < 92) adviceVariant = cat.high;
              else if (item.key === "esr" && item.num > 0.470) adviceVariant = cat.high;
              else if (item.key === "thirds" && item.num > 1.08) adviceVariant = cat.high;
              else if (item.key === "lipRatio" && item.num > 1.72) adviceVariant = cat.high;
              else if (item.key === "symmetry" && item.score >= 6.5) adviceVariant = cat.high;
            }
          }

          const title = adviceVariant.title[activeLang] || adviceVariant.title.en;
          const desc = adviceVariant.desc[activeLang] || adviceVariant.desc.en;

          let severityTag = activeLang === "ru" ? "Зона оптимизации" : (activeLang === "de" ? "Optimierungsbereich" : "Optimization Zone");
          let severityColor = "border-[#D1DEEE] dark:border-[#202C45] bg-[#F3F7FC] dark:bg-[#172033] text-[#0F172A] dark:text-[#E6EDF7]";
          let badgeBg = "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300";

          if (item.score < 4.8) {
            severityTag = activeLang === "ru" ? "Критическое проседание" : (activeLang === "de" ? "Kritisches Defizit" : "Critical Deficit");
            severityColor = "border-rose-300 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-[#0F172A] dark:text-[#E6EDF7]";
            badgeBg = "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold";
          } else if (item.score < 6.5) {
            severityTag = activeLang === "ru" ? "Заметное отклонение" : (activeLang === "de" ? "Mäßige Abweichung" : "Moderate Deviation");
            severityColor = "border-amber-300 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 text-[#0F172A] dark:text-[#E6EDF7]";
            badgeBg = "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold";
          }

          const metricDict = translations[activeLang]?.metricNames || translations.en.metricNames;
          const metricDisplay = metricDict[item.key] || item.key.toUpperCase();

          cards.push({
            key: item.key,
            score: item.score,
            tag: \`\${severityTag} • \${item.score.toFixed(1)} / 10\`,
            metricName: metricDisplay,
            title,
            metricVal: item.val,
            idealVal: item.ideal,
            desc,
            color: severityColor,
            badgeBg
          });
        });

        // If fewer than 2 lagging metrics, include the top genetic halo strength(s)
        if (weakEntries.length < 2) {
          const strongEntries = metricList.filter(m => m.score >= 7.5).reverse();
          const haloCandidates = strongEntries.slice(0, 3 - weakEntries.length);
          haloCandidates.forEach(strongItem => {
            const activeCatalog = activeModel === 'asian' ? ASIAN_ADVICE_CATALOG : ADVICE_CATALOG;
            const cat = activeCatalog[strongItem.key] || ADVICE_CATALOG[strongItem.key];
            if (cat && cat.strong) {
              const title = cat.strong.title[activeLang] || cat.strong.title.en;
              const desc = cat.strong.desc[activeLang] || cat.strong.desc.en;
              const metricDict = translations[activeLang]?.metricNames || translations.en.metricNames;
              const metricDisplay = metricDict[strongItem.key] || strongItem.key.toUpperCase();
              cards.push({
                key: strongItem.key,
                score: strongItem.score,
                tag: (activeLang === "ru" ? "Сильная генетическая черта" : (activeLang === "de" ? "Genetische Stärke" : "Genetic Strength")) + \` • \${strongItem.score.toFixed(1)} / 10\`,
                metricName: metricDisplay,
                title,
                metricVal: strongItem.val,
                idealVal: strongItem.ideal,
                desc,
                color: "border-emerald-300 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-[#0F172A] dark:text-[#E6EDF7]",
                badgeBg: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold"
              });
            }
          });
        }
        return cards;
      }

      function renderAdviceCards(analysis) {
        const container = document.getElementById("adviceCardsContainer");
        if (!container) return;
        container.innerHTML = "";
        const lang = currentLang;

        const cards = getAdviceItems(analysis, currentAestheticModel, lang);`;

if (!html.includes(adviceRenderOld)) {
  console.error("renderAdviceCards target not found!");
  process.exit(1);
}
html = html.replace(adviceRenderOld, adviceRenderNew);
console.log("getAdviceItems helper extracted and connected to renderAdviceCards.");

// 7. Implement generatePdfReport function
const pdfExporterCode = `
      // ==========================================
      // HIGH-FIDELITY PDF REPORT GENERATION ENGINE
      // ==========================================
      async function exportReportToPdf(targetModel, options = {}) {
        if (!lastDetectedLandmarks) {
          alert(currentLang === 'ru' ? 'Нет данных для анализа. Сделайте снимок или загрузите фото.' : 'No facial landmarks detected. Take a snapshot or upload a photo.');
          return;
        }

        const modelToUse = targetModel || currentAestheticModel;
        const attachPhoto = options.attachPhoto !== false;
        const includeAdvice = options.includeAdvice !== false;
        const lang = currentLang;

        // Calculate metrics calibrated to the requested looksmaxing model
        const analysis = calculatePslMetrics(lastDetectedLandmarks, stageCanvas.width, stageCanvas.height, modelToUse);
        const cfg = AESTHETIC_CONFIG[modelToUse] || AESTHETIC_CONFIG.western;
        const tier = cfg.tiers[analysis.tierKey] || cfg.tiers.mtn;
        const modelName = cfg.name[lang] || cfg.name.en;
        const tierName = tier.name[lang] || tier.name.en;
        const percentile = tier.percentile[lang] || tier.percentile.en;
        const verdict = tier.verdict[lang] || tier.verdict.en;
        const metricNameDict = translations[lang]?.metricNames || translations.en.metricNames;

        // Get snapshot image with landmarks & measurement lines
        let photoDataUrl = '';
        if (attachPhoto) {
          const comp = getCompositeSnapshotCanvas();
          photoDataUrl = comp.toDataURL('image/jpeg', 0.90);
        }

        // Get tailored advice list for the selected model
        const adviceList = includeAdvice ? getAdviceItems(analysis, modelToUse, lang) : [];

        // Build printable offscreen container (800px width for standard A4 proportionality)
        const container = document.createElement('div');
        container.id = 'pdfExportRenderStage';
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '800px';
        container.style.backgroundColor = '#ffffff';
        container.style.color = '#0F172A';
        container.style.fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
        container.style.padding = '36px 40px';
        container.style.boxSizing = 'border-box';
        container.style.zIndex = '-9999';

        const dateStr = new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : (lang === 'de' ? 'de-DE' : 'en-US'), {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // HTML Content for the PDF report
        container.innerHTML = \`
          <!-- Report Header -->
          <div style="border-bottom: 2px solid #2563EB; padding-bottom: 16px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #2563EB; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">Φ</div>
                <h1 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0; letter-spacing: -0.3px;">PSL FACE ANALYZER</h1>
              </div>
              <p style="font-size: 11px; color: #52627A; margin: 0;">\${lang === 'ru' ? 'Краниофациальная антропометрия и расчёт индексов привлекательности' : 'Craniofacial Anthropometry & Looksmaxing Analysis'}</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; padding: 4px 10px; background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1D4ED8; font-size: 11px; font-weight: 700; border-radius: 8px; margin-bottom: 4px;">
                \${cfg.flag} \${modelName}
              </span>
              <div style="font-size: 10px; font-family: monospace; color: #64748B;">\${dateStr}</div>
            </div>
          </div>

          <!-- Hero Score & Biometric Photo Section -->
          <div style="display: flex; gap: 20px; margin-bottom: 24px; align-items: stretch;">
            \${attachPhoto && photoDataUrl ? \`
              <div style="width: 260px; shrink: 0; background-color: #0B0F1A; border-radius: 14px; overflow: hidden; border: 1px solid #CBD5E1; display: flex; flex-direction: column;">
                <img src="\${photoDataUrl}" style="width: 100%; height: 260px; object-fit: contain; display: block;" alt="Biometric Face" />
                <div style="padding: 6px 10px; background-color: #1E293B; color: #94A3B8; font-size: 9px; font-family: monospace; text-align: center; border-top: 1px solid #334155;">
                  \${lang === 'ru' ? '● Антропометрическая разметка лица (0° Frontal)' : '● Biometric Facial Anthropometry (0° Frontal)'}
                </div>
              </div>
            \` : ''}

            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <!-- Score Box -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: 10px; font-family: monospace; color: #64748B; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
                    \${lang === 'ru' ? 'ИТОГОВЫЙ БАЛЛ ПО ШКАЛЕ 10.0' : 'COMPOSITE SCORE / 10.0'}
                  </div>
                  <div style="font-size: 38px; font-weight: 900; color: #0F172A; line-height: 1.1; font-family: monospace;">
                    \${analysis.finalScore.toFixed(1)} <span style="font-size: 14px; color: #64748B; font-weight: 600;">/ 10.0</span>
                  </div>
                  <div style="display: inline-block; margin-top: 6px; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; font-family: monospace; background-color: #2563EB; color: #ffffff;">
                    \${tierName}
                  </div>
                </div>
                <div style="text-align: right; max-width: 200px;">
                  <div style="font-size: 11px; font-weight: 700; color: #2563EB;">\${percentile}</div>
                  <div style="font-size: 10px; color: #475569; margin-top: 4px; line-height: 1.35;">\${verdict}</div>
                </div>
              </div>

              <!-- 4 Pillars Summary Mini-Bars -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 14px;">
                <div style="font-size: 10px; font-family: monospace; color: #64748B; font-weight: 700; text-transform: uppercase; margin-bottom: 10px;">
                  \${lang === 'ru' ? 'Оценка векторов привлекательности (4 Pillars):' : 'Key Attractiveness Vectors (4 Pillars):'}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
                  <div>
                    <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 3px;">
                      <span>\${cfg.pillarTitles.p1[lang] || cfg.pillarTitles.p1.en}</span>
                      <span style="font-family: monospace; color: #2563EB;">\${analysis.pillars.pillar1.toFixed(1)}/10</span>
                    </div>
                    <div style="height: 6px; background-color: #E2E8F0; border-radius: 3px; overflow: hidden;">
                      <div style="width: \${Math.min(100, analysis.pillars.pillar1 * 10)}%; height: 100%; background-color: #2563EB;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 3px;">
                      <span>\${cfg.pillarTitles.p2[lang] || cfg.pillarTitles.p2.en}</span>
                      <span style="font-family: monospace; color: #2563EB;">\${analysis.pillars.pillar2.toFixed(1)}/10</span>
                    </div>
                    <div style="height: 6px; background-color: #E2E8F0; border-radius: 3px; overflow: hidden;">
                      <div style="width: \${Math.min(100, analysis.pillars.pillar2 * 10)}%; height: 100%; background-color: #2563EB;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 3px;">
                      <span>\${cfg.pillarTitles.p3[lang] || cfg.pillarTitles.p3.en}</span>
                      <span style="font-family: monospace; color: #2563EB;">\${analysis.pillars.pillar3.toFixed(1)}/10</span>
                    </div>
                    <div style="height: 6px; background-color: #E2E8F0; border-radius: 3px; overflow: hidden;">
                      <div style="width: \${Math.min(100, analysis.pillars.pillar3 * 10)}%; height: 100%; background-color: #2563EB;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 3px;">
                      <span>\${cfg.pillarTitles.p4[lang] || cfg.pillarTitles.p4.en}</span>
                      <span style="font-family: monospace; color: #2563EB;">\${analysis.pillars.pillar4.toFixed(1)}/10</span>
                    </div>
                    <div style="height: 6px; background-color: #E2E8F0; border-radius: 3px; overflow: hidden;">
                      <div style="width: \${Math.min(100, analysis.pillars.pillar4 * 10)}%; height: 100%; background-color: #2563EB;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 11 Metrics Anthropometric Table -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h2 style="font-size: 13px; font-weight: 800; color: #0F172A; margin: 0; text-transform: uppercase; letter-spacing: 0.3px;">
                \${lang === 'ru' ? 'Антропометрические показатели (11 соотношений):' : 'Craniofacial Metrics Table (11 Parameters):'}
              </h2>
              <span style="font-size: 10px; color: #64748B;">\${lang === 'ru' ? 'Калибровка: ' + modelName : 'Calibrated: ' + modelName}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">
              <thead>
                <tr style="background-color: #F1F5F9; border-bottom: 1px solid #CBD5E1; color: #475569; font-size: 9.5px; font-family: monospace; text-transform: uppercase;">
                  <th style="padding: 7px 10px; text-align: left;">\${lang === 'ru' ? 'Параметр' : 'Metric'}</th>
                  <th style="padding: 7px 10px; text-align: left;">\${lang === 'ru' ? 'Значение' : 'Value'}</th>
                  <th style="padding: 7px 10px; text-align: left;">\${lang === 'ru' ? 'Идеал (' + cfg.shortName[lang] + ')' : 'Ideal'}</th>
                  <th style="padding: 7px 10px; text-align: left;">\${lang === 'ru' ? 'Норма' : 'Average'}</th>
                  <th style="padding: 7px 10px; text-align: left;">\${lang === 'ru' ? 'Балл' : 'Score'}</th>
                  <th style="padding: 7px 10px; text-align: left;">\${lang === 'ru' ? 'Статус' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                \${Object.keys(analysis.metrics).map(k => {
                  const m = analysis.metrics[k];
                  const s = parseFloat(m.score);
                  let statusHtml = '';
                  if (s >= 7.8) {
                    statusHtml = '<span style="color: #059669; font-weight: 700;">' + (lang === 'ru' ? '★ Идеал' : '★ Ideal') + '</span>';
                  } else if (s >= 6.5) {
                    statusHtml = '<span style="color: #2563EB; font-weight: 600;">' + (lang === 'ru' ? 'Выше нормы' : 'Above Avg') + '</span>';
                  } else if (s >= 4.8) {
                    statusHtml = '<span style="color: #64748B;">' + (lang === 'ru' ? 'Норма' : 'Normal') + '</span>';
                  } else {
                    statusHtml = '<span style="color: #E11D48; font-weight: 700;">' + (lang === 'ru' ? 'Внимание' : 'Deficit') + '</span>';
                  }
                  return \`
                    <tr style="border-bottom: 1px solid #F1F5F9;">
                      <td style="padding: 6px 10px; font-weight: 600; color: #0F172A;">\${metricNameDict[k] || k}</td>
                      <td style="padding: 6px 10px; font-family: monospace; font-weight: 700; color: #0F172A;">\${m.val}</td>
                      <td style="padding: 6px 10px; font-family: monospace; color: #059669; font-weight: 600;">\${m.ideal}</td>
                      <td style="padding: 6px 10px; font-family: monospace; color: #64748B;">\${m.avg}</td>
                      <td style="padding: 6px 10px; font-family: monospace; font-weight: 700; color: #0F172A;">\${m.score} / 10</td>
                      <td style="padding: 6px 10px; font-size: 10px;">\${statusHtml}</td>
                    </tr>
                  \`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Section: Personalized Advice & Practical Action Plan (THE MAIN REQUEST) -->
          \${includeAdvice && adviceList.length > 0 ? \`
            <div style="border-top: 2px dashed #CBD5E1; padding-top: 20px; margin-top: 10px;">
              <div style="margin-bottom: 14px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                  <span style="font-size: 14px;">💡</span>
                  <h2 style="font-size: 14px; font-weight: 900; color: #0F172A; margin: 0; text-transform: uppercase; letter-spacing: 0.3px;">
                    \${lang === 'ru' ? 'ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ И СОВЕТЫ ПО ЛУКСМАКСИНГУ' : 'PERSONALIZED LOOKSMAXING RECOMMENDATIONS & ADVICE'}
                  </h2>
                </div>
                <p style="font-size: 10.5px; color: #64748B; margin: 0;">
                  \${lang === 'ru' 
                    ? 'Практические шаги по коррекции и улучшению черт лица, сформированные под стандарты ' + modelName + ':' 
                    : 'Actionable steps tailored specifically to your facial parameters and ' + modelName + ' standards:'}
                </p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                \${adviceList.map((adv, idx) => {
                  const isCrit = adv.score < 4.8;
                  const isAbove = adv.score >= 7.5;
                  const borderCol = isCrit ? '#FDA4AF' : (isAbove ? '#A7F3D0' : '#FDE68A');
                  const bgCol = isCrit ? '#FFF1F2' : (isAbove ? '#ECFDF5' : '#FFFBEB');
                  const badgeCol = isCrit ? '#E11D48' : (isAbove ? '#059669' : '#D97706');
                  return \`
                    <div style="border: 1px solid \${borderCol}; background-color: \${bgCol}; border-radius: 12px; padding: 12px 14px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-size: 9.5px; font-family: monospace; font-weight: 800; color: \${badgeCol}; text-transform: uppercase; letter-spacing: 0.4px;">
                          #\${idx + 1} • \${adv.tag}
                        </span>
                        <span style="font-size: 10px; font-weight: 700; color: #334155;">\${adv.metricName} (\${adv.metricVal})</span>
                      </div>
                      <h3 style="font-size: 12px; font-weight: 800; color: #0F172A; margin: 0 0 6px 0;">\${adv.title}</h3>
                      <p style="font-size: 10.5px; color: #334155; margin: 0; line-height: 1.45;">\${adv.desc}</p>
                    </div>
                  \`;
                }).join('')}
              </div>
            </div>
          \` : ''}

          <!-- Footer -->
          <div style="border-top: 1px solid #E2E8F0; margin-top: 24px; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #94A3B8; font-family: monospace;">
            <span>PSL Face Analyzer &copy; 2026 — Local biometric processing. Zero cloud data storage.</span>
            <span>\${cfg.name[lang] || cfg.name.en} • \${lang.toUpperCase()}</span>
          </div>
        \`;

        document.body.appendChild(container);

        try {
          if (!window.html2canvas) {
            throw new Error('html2canvas library is not loaded');
          }
          if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF library is not loaded');
          }

          // Render DOM to High-DPI Canvas
          const canvas = await window.html2canvas(container, {
            scale: 2, // 2x resolution for sharp text and graphics
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidthMm = 210;
          const pdfHeightMm = 297;

          // Calculate height in mm
          const totalImgHeightMm = (canvas.height * pdfWidthMm) / canvas.width;
          const canvasPageHeightPx = (canvas.width * pdfHeightMm) / pdfWidthMm;

          let heightLeftPx = canvas.height;
          let positionPx = 0;
          let pageIdx = 0;

          while (heightLeftPx > 0) {
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(canvasPageHeightPx, heightLeftPx);
            const pctx = pageCanvas.getContext('2d');

            // Draw slice
            pctx.drawImage(
              canvas,
              0, positionPx, canvas.width, pageCanvas.height,
              0, 0, pageCanvas.width, pageCanvas.height
            );

            if (pageIdx > 0) {
              pdf.addPage();
            }

            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
            const pageImgHeightMm = (pageCanvas.height * pdfWidthMm) / pageCanvas.width;
            pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidthMm, pageImgHeightMm);

            heightLeftPx -= canvasPageHeightPx;
            positionPx += canvasPageHeightPx;
            pageIdx++;
          }

          const filename = \`PSL_Report_\${modelToUse.toUpperCase()}_\${Date.now()}.pdf\`;
          pdf.save(filename);

        } catch (err) {
          console.error("PDF generation failed:", err);
          alert((lang === 'ru' ? 'Ошибка экспорта в PDF: ' : 'PDF Export Error: ') + err.message);
        } finally {
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }
      }
`;

const dclHookTarget = `        // Aesthetic Model Initialization & Modal logic`;
if (!html.includes(dclHookTarget)) {
  console.error("DOMContentLoaded hook target not found!");
  process.exit(1);
}
html = html.replace(dclHookTarget, pdfExporterCode + '\n' + dclHookTarget);
console.log("exportReportToPdf function implemented.");

// 8. Add event listeners for PDF modal controls in DOMContentLoaded
const dclListenersTarget = `        // Methodology Modal Controls`;
const dclPdfListeners = `        // PDF Export Modal Controls
        const btnExportPdf = document.getElementById('btnExportPdf');
        const modalExportPdf = document.getElementById('modalExportPdf');
        const btnClosePdfModal = document.getElementById('btnClosePdfModal');
        const btnCancelPdfExport = document.getElementById('btnCancelPdfExport');
        const btnConfirmGeneratePdf = document.getElementById('btnConfirmGeneratePdf');
        const pdfSpinnerIcon = document.getElementById('pdfSpinnerIcon');
        const txtBtnConfirmGeneratePdf = document.getElementById('txtBtnConfirmGeneratePdf');

        function openExportPdfModal() {
          if (!modalExportPdf) return;
          // Pre-select current aesthetic model
          const radioWestern = document.querySelector('input[name="exportPdfModel"][value="western"]');
          const radioAsian = document.querySelector('input[name="exportPdfModel"][value="asian"]');
          const lblWest = document.getElementById('lblExportModelWestern');
          const lblAsia = document.getElementById('lblExportModelAsian');

          if (currentAestheticModel === 'asian') {
            if (radioAsian) radioAsian.checked = true;
            if (lblAsia) {
              lblAsia.className = 'relative p-4 rounded-2xl border-2 border-[#2563EB] bg-[#2563EB]/5 cursor-pointer flex flex-col gap-2 transition-all';
            }
            if (lblWest) {
              lblWest.className = 'relative p-4 rounded-2xl border-2 border-transparent bg-[#F3F7FC] dark:bg-[#172033] cursor-pointer flex flex-col gap-2 transition-all hover:border-[#2563EB]/50';
            }
          } else {
            if (radioWestern) radioWestern.checked = true;
            if (lblWest) {
              lblWest.className = 'relative p-4 rounded-2xl border-2 border-[#2563EB] bg-[#2563EB]/5 cursor-pointer flex flex-col gap-2 transition-all';
            }
            if (lblAsia) {
              lblAsia.className = 'relative p-4 rounded-2xl border-2 border-transparent bg-[#F3F7FC] dark:bg-[#172033] cursor-pointer flex flex-col gap-2 transition-all hover:border-[#2563EB]/50';
            }
          }
          modalExportPdf.classList.remove('hidden');
        }

        if (btnExportPdf) {
          btnExportPdf.addEventListener('click', openExportPdfModal);
        }
        if (btnClosePdfModal && modalExportPdf) {
          btnClosePdfModal.addEventListener('click', () => modalExportPdf.classList.add('hidden'));
        }
        if (btnCancelPdfExport && modalExportPdf) {
          btnCancelPdfExport.addEventListener('click', () => modalExportPdf.classList.add('hidden'));
        }
        if (modalExportPdf) {
          modalExportPdf.addEventListener('click', (e) => {
            if (e.target === modalExportPdf) modalExportPdf.classList.add('hidden');
          });
        }

        // Radio click visual highlights
        const radWest = document.querySelector('input[name="exportPdfModel"][value="western"]');
        const radAsia = document.querySelector('input[name="exportPdfModel"][value="asian"]');
        const lblW = document.getElementById('lblExportModelWestern');
        const lblA = document.getElementById('lblExportModelAsian');

        function updateExportRadioStyles() {
          const selected = document.querySelector('input[name="exportPdfModel"]:checked')?.value || 'western';
          if (selected === 'asian') {
            if (lblA) lblA.className = 'relative p-4 rounded-2xl border-2 border-[#2563EB] bg-[#2563EB]/5 cursor-pointer flex flex-col gap-2 transition-all';
            if (lblW) lblW.className = 'relative p-4 rounded-2xl border-2 border-transparent bg-[#F3F7FC] dark:bg-[#172033] cursor-pointer flex flex-col gap-2 transition-all hover:border-[#2563EB]/50';
          } else {
            if (lblW) lblW.className = 'relative p-4 rounded-2xl border-2 border-[#2563EB] bg-[#2563EB]/5 cursor-pointer flex flex-col gap-2 transition-all';
            if (lblA) lblA.className = 'relative p-4 rounded-2xl border-2 border-transparent bg-[#F3F7FC] dark:bg-[#172033] cursor-pointer flex flex-col gap-2 transition-all hover:border-[#2563EB]/50';
          }
        }
        if (lblW) lblW.addEventListener('click', () => { if (radWest) radWest.checked = true; updateExportRadioStyles(); });
        if (lblA) lblA.addEventListener('click', () => { if (radAsia) radAsia.checked = true; updateExportRadioStyles(); });

        if (btnConfirmGeneratePdf) {
          btnConfirmGeneratePdf.addEventListener('click', async () => {
            const selectedModel = document.querySelector('input[name="exportPdfModel"]:checked')?.value || 'western';
            const chkPhoto = document.getElementById('chkPdfAttachFacePhoto');
            const chkAdv = document.getElementById('chkPdfIncludeAdvice');

            if (pdfSpinnerIcon) pdfSpinnerIcon.classList.remove('hidden');
            if (txtBtnConfirmGeneratePdf) txtBtnConfirmGeneratePdf.textContent = t('pdfGenerating');
            btnConfirmGeneratePdf.disabled = true;

            try {
              await exportReportToPdf(selectedModel, {
                attachPhoto: chkPhoto ? chkPhoto.checked : true,
                includeAdvice: chkAdv ? chkAdv.checked : true
              });
              if (modalExportPdf) modalExportPdf.classList.add('hidden');
            } finally {
              if (pdfSpinnerIcon) pdfSpinnerIcon.classList.add('hidden');
              if (txtBtnConfirmGeneratePdf) txtBtnConfirmGeneratePdf.textContent = t('btnConfirmGeneratePdf');
              btnConfirmGeneratePdf.disabled = false;
            }
          });
        }
`;

if (!html.includes(dclListenersTarget)) {
  console.error("Methodology modal controls target not found in DOMContentLoaded!");
  process.exit(1);
}
html = html.replace(dclListenersTarget, dclPdfListeners + '\n        ' + dclListenersTarget);
console.log("PDF export modal event listeners wired up.");

// 9. Update applyLanguage to localize PDF buttons & modal
const appLangPdfOld = `        const txtBtnDownload = document.getElementById('txtBtnDownload');
        if (txtBtnDownload) txtBtnDownload.textContent = t('btnDownload');`;

const appLangPdfNew = `        const txtBtnExportPdf = document.getElementById('txtBtnExportPdf');
        if (txtBtnExportPdf) txtBtnExportPdf.textContent = t('btnExportPdf');

        const txtBtnDownload = document.getElementById('txtBtnDownload');
        if (txtBtnDownload) txtBtnDownload.textContent = t('btnDownload');

        const txtPdfModalTitle = document.getElementById('txtPdfModalTitle');
        if (txtPdfModalTitle) txtPdfModalTitle.textContent = t('pdfModalTitle');

        const txtPdfModalSubtitle = document.getElementById('txtPdfModalSubtitle');
        if (txtPdfModalSubtitle) txtPdfModalSubtitle.textContent = t('pdfModalSubtitle');

        const txtPdfChooseModelPrompt = document.getElementById('txtPdfChooseModelPrompt');
        if (txtPdfChooseModelPrompt) txtPdfChooseModelPrompt.textContent = t('pdfChooseModelPrompt');

        const txtPdfOptWesternTitle = document.getElementById('txtPdfOptWesternTitle');
        if (txtPdfOptWesternTitle) txtPdfOptWesternTitle.textContent = t('pdfOptWesternTitle');

        const txtPdfOptWesternDesc = document.getElementById('txtPdfOptWesternDesc');
        if (txtPdfOptWesternDesc) txtPdfOptWesternDesc.textContent = t('pdfOptWesternDesc');

        const txtPdfOptAsianTitle = document.getElementById('txtPdfOptAsianTitle');
        if (txtPdfOptAsianTitle) txtPdfOptAsianTitle.textContent = t('pdfOptAsianTitle');

        const txtPdfOptAsianDesc = document.getElementById('txtPdfOptAsianDesc');
        if (txtPdfOptAsianDesc) txtPdfOptAsianDesc.textContent = t('pdfOptAsianDesc');

        const txtPdfAttachPhoto = document.getElementById('txtPdfAttachPhoto');
        if (txtPdfAttachPhoto) txtPdfAttachPhoto.textContent = t('pdfAttachPhoto');

        const txtPdfIncludeAdvice = document.getElementById('txtPdfIncludeAdvice');
        if (txtPdfIncludeAdvice) txtPdfIncludeAdvice.textContent = t('pdfIncludeAdvice');

        const txtBtnConfirmGeneratePdf = document.getElementById('txtBtnConfirmGeneratePdf');
        if (txtBtnConfirmGeneratePdf) txtBtnConfirmGeneratePdf.textContent = t('btnConfirmGeneratePdf');

        const btnCancelPdfExport = document.getElementById('btnCancelPdfExport');
        if (btnCancelPdfExport) btnCancelPdfExport.textContent = t('btnCancel');`;

html = html.replace(appLangPdfOld, appLangPdfNew);
console.log("applyLanguage updated with PDF localization.");

// Save updated html
fs.writeFileSync('index.html', html, 'utf8');

// Verify JS syntax
const scriptStart = html.lastIndexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
const jsCode = html.slice(scriptStart + 8, scriptEnd);
try {
  new Function(jsCode);
  console.log('ALL JS SYNTAX VALID! JS code length:', jsCode.length);
} catch (e) {
  console.error('SYNTAX ERROR in resulting index.html:', e.message);
  process.exit(1);
}

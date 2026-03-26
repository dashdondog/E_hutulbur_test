"use client";

import { LessonPlan, CriteriaItem } from "@/shared/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLessonPlanHtml(plan: LessonPlan, criteria?: CriteriaItem[]): string {
  const objectivesList = plan.objectives
    .map((o) => `<li>${escapeHtml(o)}</li>`)
    .join("");

  const methodsList = plan.methods
    .map((m) => `<span class="tag blue">${escapeHtml(m)}</span>`)
    .join("");

  const materialsList = plan.materials
    .map((m) => `<span class="tag amber">${escapeHtml(m)}</span>`)
    .join("");

  const stepsRows = plan.steps
    .map(
      (step, i) => `
      <tr class="${i % 2 === 0 ? "even" : "odd"}">
        <td class="time-cell">${escapeHtml(step.time)}</td>
        <td class="phase-cell">${escapeHtml(step.phase)}</td>
        <td>${escapeHtml(step.teacherActivity)}</td>
        <td>${escapeHtml(step.studentActivity)}</td>
        <td class="small">${escapeHtml(step.methods)}</td>
        <td class="small">${escapeHtml(step.assessment)}</td>
      </tr>`
    )
    .join("");

  let criteriaHtml = "";
  if (criteria && criteria.length > 0) {
    const total = criteria.reduce((sum, c) => sum + c.percentage, 0);
    const rows = criteria
      .map(
        (c, i) => `
        <tr class="${i % 2 === 0 ? "even" : "odd"}">
          <td class="bold">${escapeHtml(c.name)}</td>
          <td class="center"><span class="pct">${c.percentage}%</span></td>
          <td>${escapeHtml(c.description)}</td>
        </tr>`
      )
      .join("");

    criteriaHtml = `
      <div class="section">
        <h2>Үнэлгээний шалгуур</h2>
        <table>
          <thead><tr class="green-header">
            <th>Шалгуур</th><th style="width:80px">Хувь</th><th>Тайлбар</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td class="bold">Нийт</td>
              <td class="center bold">${total}%</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="UTF-8">
  <title>Нэгж сэдвийн хөтөлбөр - ${escapeHtml(plan.chapter || plan.topic || "")}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #1e293b;
      padding: 20mm 15mm;
      line-height: 1.5;
    }
    .title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #0f172a;
    }
    .subtitle {
      text-align: center;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 20px;
    }
    .info-item {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
    }
    .info-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }
    .section {
      margin-bottom: 16px;
    }
    h2 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.5px;
      padding: 5px 8px;
      background: #f1f5f9;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    p {
      font-size: 12px;
      color: #334155;
      padding-left: 4px;
    }
    ul {
      padding-left: 20px;
      margin-top: 4px;
    }
    li {
      font-size: 12px;
      color: #334155;
      margin-bottom: 3px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    .tag.blue { background: #eff6ff; color: #1d4ed8; }
    .tag.amber { background: #fffbeb; color: #b45309; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      text-align: left;
      vertical-align: top;
    }
    thead tr {
      background: #eff6ff;
    }
    thead th {
      font-weight: 700;
      color: #334155;
      font-size: 11px;
    }
    .green-header { background: #f0fdf4 !important; }
    .green-header th { background: #f0fdf4; }
    tr.even { background: #fff; }
    tr.odd { background: #f8fafc; }
    .time-cell { text-align: center; font-weight: 600; color: #1d4ed8; white-space: nowrap; }
    .phase-cell { font-weight: 600; color: #1e293b; }
    .small { font-size: 10px; color: #64748b; }
    .center { text-align: center; }
    .bold { font-weight: 600; }
    .pct {
      background: #dcfce7;
      color: #15803d;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
    }
    .total-row {
      background: #f0fdf4;
    }
    .total-row td { font-weight: 700; }
    .homework-box {
      background: #fefce8;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 8px 12px;
      margin-top: 4px;
    }
    .reflection-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 8px 12px;
      margin-top: 4px;
      font-style: italic;
    }
    @media print {
      body { padding: 10mm; }
      .no-print { display: none; }
    }
    @page {
      size: A4;
      margin: 12mm;
    }
  </style>
</head>
<body>
  <div class="title">НЭГЖ СЭДВИЙН ХӨТӨЛБӨР</div>
  <div class="subtitle">Unit Lesson Plan</div>

  <div class="info-grid">
    <div class="info-item"><div class="info-label">Хичээл</div><div class="info-value">${escapeHtml(plan.subject)}</div></div>
    <div class="info-item"><div class="info-label">Анги</div><div class="info-value">${escapeHtml(plan.grade)}</div></div>
    <div class="info-item"><div class="info-label">Бүлэг</div><div class="info-value">${escapeHtml(plan.chapter || plan.topic || "")}</div></div>
  </div>

  <div class="section">
    <h2>Зорилго</h2>
    <p>${escapeHtml(plan.goal)}</p>
  </div>

  <div class="section">
    <h2>Зорилтууд</h2>
    <ul>${objectivesList}</ul>
  </div>

  ${plan.topicSchedule && plan.topicSchedule.length > 0 ? `
  <div class="section">
    <h2>Сэдвийн хуваарь (10 долоо хоног)</h2>
    <table>
      <thead><tr style="background:#eef2ff">
        <th style="width:70px;text-align:center">7 хоног</th>
        <th>Сэдэв</th>
        <th>Тайлбар</th>
        <th style="width:50px;text-align:center">Цаг</th>
      </tr></thead>
      <tbody>
        ${plan.topicSchedule.map((t, i) => `
          <tr class="${i % 2 === 0 ? "even" : "odd"}">
            <td class="center bold">${t.weekNumber}-р</td>
            <td class="bold">${escapeHtml(t.topicName)}</td>
            <td>${escapeHtml(t.description)}</td>
            <td class="center">${t.hours}</td>
          </tr>`).join("")}
        <tr style="background:#eef2ff;font-weight:600">
          <td class="center">Нийт</td>
          <td>${plan.topicSchedule.length} сэдэв</td>
          <td></td>
          <td class="center">${plan.topicSchedule.reduce((s, t) => s + t.hours, 0)}</td>
        </tr>
      </tbody>
    </table>
  </div>` : ""}

  <div class="section">
    <h2>Хичээлийн хэлбэр</h2>
    <p>${escapeHtml(plan.lessonForm)}</p>
  </div>

  <div class="section">
    <h2>Арга технологи</h2>
    <div class="tags">${methodsList}</div>
  </div>

  <div class="section">
    <h2>Хэрэглэгдэхүүн</h2>
    <div class="tags">${materialsList}</div>
  </div>

  <div class="section">
    <h2>Хичээлийн үйл явц</h2>
    <table>
      <thead><tr>
        <th style="width:55px">Хугацаа</th>
        <th style="width:120px">Үе шат</th>
        <th>Багшийн үйл ажиллагаа</th>
        <th>Сурагчийн үйл ажиллагаа</th>
        <th style="width:90px">Арга</th>
        <th style="width:90px">Үнэлгээ</th>
      </tr></thead>
      <tbody>${stepsRows}</tbody>
    </table>
  </div>

  ${plan.homework ? `
  <div class="section">
    <h2>Гэрийн даалгавар</h2>
    <div class="homework-box">${escapeHtml(plan.homework)}</div>
  </div>` : ""}

  ${plan.reflection ? `
  <div class="section">
    <h2>Эргэцүүлэл</h2>
    <div class="reflection-box">${escapeHtml(plan.reflection)}</div>
  </div>` : ""}

  ${criteriaHtml}
</body>
</html>`;
}

export function downloadLessonPlanPdf(plan: LessonPlan, criteria?: CriteriaItem[]) {
  const html = buildLessonPlanHtml(plan, criteria);

  // Open a new window, write the HTML, then trigger print (Save as PDF)
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Попап блоклогдсон байна. Браузерийн тохиргооноос попап зөвшөөрнө үү.");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to render, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // Fallback if onload doesn't fire
  setTimeout(() => {
    printWindow.print();
  }, 1000);
}

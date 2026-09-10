export class CsvAppError extends Error {}

export function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, "");
  if (!source.trim()) throw new CsvAppError("CSVファイルが空です。");

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let fieldStarted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && !fieldStarted) {
      inQuotes = true;
      fieldStarted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
      fieldStarted = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      fieldStarted = false;
    } else {
      field += char;
      fieldStarted = true;
    }
  }

  if (inQuotes) throw new CsvAppError("ダブルクォートが閉じられていない箇所があります。");
  if (fieldStarted || field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function validateAndNormalize(rows) {
  if (!rows.length) throw new CsvAppError("CSVファイルが空です。");
  const headers = rows[0].map((value) => value.trim());
  if (!headers.length || headers.some((header) => !header)) {
    throw new CsvAppError("1行目に空の列名があります。");
  }
  if (new Set(headers).size !== headers.length) {
    throw new CsvAppError("同じ列名が複数あります。");
  }

  const dataRows = rows.slice(1).map((sourceRow, rowIndex) => {
    if (sourceRow.length > headers.length) {
      throw new CsvAppError(`${rowIndex + 2}行目の列数が、1行目より多くなっています。`);
    }
    return headers.map((_, columnIndex) => (sourceRow[columnIndex] ?? "").trim());
  });
  return { headers, rows: dataRows };
}

export function cleanRows(headers, rows, sortColumn = "", duplicateColumn = "") {
  const sortIndex = sortColumn ? headers.indexOf(sortColumn) : -1;
  const duplicateIndex = duplicateColumn ? headers.indexOf(duplicateColumn) : -1;
  if (sortColumn && sortIndex < 0) throw new CsvAppError(`列「${sortColumn}」が見つかりません。`);
  if (duplicateColumn && duplicateIndex < 0) throw new CsvAppError(`列「${duplicateColumn}」が見つかりません。`);

  const output = [];
  const seen = new Set();
  let blankCount = 0;
  let duplicateCount = 0;

  for (const row of rows) {
    if (row.every((cell) => !cell.trim())) {
      blankCount += 1;
      continue;
    }
    const key = duplicateIndex >= 0 ? row[duplicateIndex] : JSON.stringify(row);
    if (seen.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(key);
    output.push([...row]);
  }

  if (sortIndex >= 0) {
    const collator = new Intl.Collator("ja", { sensitivity: "base" });
    const values = output.map((row) => row[sortIndex]);
    const numeric = values.length > 0 && values.every((value) => value === "" || /^[-+]?\d+(?:\.\d+)?$/.test(value.replaceAll(",", "")));
    const dateLike = values.length > 0 && values.every((value) => value === "" || /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(value));
    output.sort((left, right) => {
      if (numeric) return (Number(left[sortIndex].replaceAll(",", "")) || 0) - (Number(right[sortIndex].replaceAll(",", "")) || 0);
      if (dateLike) return (Date.parse(left[sortIndex]) || 0) - (Date.parse(right[sortIndex]) || 0);
      return collator.compare(left[sortIndex], right[sortIndex]);
    });
  }
  return { rows: output, blankCount, duplicateCount };
}

function escapeCsvCell(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createCsv(headers, rows) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

async function decodeFile(file) {
  const buffer = await file.arrayBuffer();
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), encoding: "UTF-8" };
  } catch {
    try {
      return { text: new TextDecoder("shift_jis", { fatal: true }).decode(buffer), encoding: "Shift-JIS" };
    } catch {
      throw new CsvAppError("文字コードを判定できません。UTF-8またはShift-JISのCSVを選んでください。");
    }
  }
}

function downloadCsv(filename, content) {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function resultFilename(originalName) {
  const stem = originalName.replace(/\.csv$/i, "");
  return `${stem}_整理済み.csv`;
}

function initBrowserApp() {
  const elements = {
    file: document.querySelector("#csv-file"),
    drop: document.querySelector("#drop-zone"),
    choose: document.querySelector("#choose-button"),
    sort: document.querySelector("#sort-column"),
    duplicate: document.querySelector("#duplicate-column"),
    run: document.querySelector("#run-button"),
    reset: document.querySelector("#reset-button"),
    fileInfo: document.querySelector("#file-info"),
    status: document.querySelector("#status"),
    preview: document.querySelector("#preview"),
    previewHeading: document.querySelector("#preview-heading"),
    previewHead: document.querySelector("#preview-head"),
    previewBody: document.querySelector("#preview-body"),
    result: document.querySelector("#result"),
    resultText: document.querySelector("#result-text"),
  };
  let current = null;

  const setStatus = (message, kind = "info") => {
    elements.status.textContent = message;
    elements.status.dataset.kind = kind;
  };

  const reset = () => {
    current = null;
    elements.file.value = "";
    elements.sort.replaceChildren(new Option("並べ替えない", ""));
    elements.duplicate.replaceChildren(new Option("行全体", ""));
    elements.duplicate.disabled = true;
    elements.sort.disabled = true;
    elements.run.disabled = true;
    elements.reset.hidden = true;
    elements.fileInfo.hidden = true;
    elements.preview.hidden = true;
    elements.previewHeading.textContent = "読み込み内容（先頭5行）";
    elements.result.hidden = true;
    elements.drop.classList.remove("has-file", "is-dragging");
    setStatus("CSVファイルを選ぶところから始めましょう。");
  };

  const showPreview = ({ headers, rows }) => {
    elements.previewHead.replaceChildren();
    const headRow = document.createElement("tr");
    headers.forEach((header) => {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = header;
      headRow.append(cell);
    });
    elements.previewHead.append(headRow);

    elements.previewBody.replaceChildren();
    rows.slice(0, 5).forEach((row) => {
      const bodyRow = document.createElement("tr");
      row.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value || "—";
        bodyRow.append(cell);
      });
      elements.previewBody.append(bodyRow);
    });
    elements.preview.hidden = false;
  };

  const loadFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStatus("CSVファイルを選んでください。", "error");
      return;
    }
    try {
      setStatus("CSVを読み込んでいます…");
      const decoded = await decodeFile(file);
      const normalized = validateAndNormalize(parseCsv(decoded.text));
      current = { file, encoding: decoded.encoding, ...normalized };

      elements.sort.replaceChildren(new Option("並べ替えない", ""));
      current.headers.forEach((header) => elements.sort.add(new Option(header, header)));
      current.headers.forEach((header) => elements.duplicate.add(new Option(header, header)));
      elements.sort.disabled = false;
      elements.duplicate.disabled = false;
      elements.run.disabled = false;
      elements.reset.hidden = false;
      elements.fileInfo.hidden = false;
      elements.result.hidden = true;
      elements.drop.classList.add("has-file");
      elements.fileInfo.textContent = `${file.name}　｜　${current.rows.length}行　｜　${current.headers.length}列　｜　${current.encoding}`;
      setStatus("読み込みました。必要なら並べ替える列を選び、整理を実行してください。", "success");
      elements.previewHeading.textContent = "読み込み内容（先頭5行）";
      showPreview(current);
    } catch (error) {
      current = null;
      elements.run.disabled = true;
      elements.sort.disabled = true;
      elements.fileInfo.hidden = true;
      elements.preview.hidden = true;
      setStatus(error instanceof CsvAppError ? error.message : "CSVを読み込めませんでした。", "error");
    }
  };

  elements.choose.addEventListener("click", () => elements.file.click());
  elements.file.addEventListener("change", () => loadFile(elements.file.files[0]));
  elements.reset.addEventListener("click", reset);
  elements.drop.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.drop.classList.add("is-dragging");
  });
  elements.drop.addEventListener("dragleave", () => elements.drop.classList.remove("is-dragging"));
  elements.drop.addEventListener("drop", (event) => {
    event.preventDefault();
    elements.drop.classList.remove("is-dragging");
    loadFile(event.dataTransfer.files[0]);
  });
  elements.run.addEventListener("click", () => {
    if (!current) return;
    try {
      const cleaned = cleanRows(current.headers, current.rows, elements.sort.value, elements.duplicate.value);
      downloadCsv(resultFilename(current.file.name), createCsv(current.headers, cleaned.rows));
      elements.previewHeading.textContent = "整理後の内容（先頭5行）";
      showPreview({ headers: current.headers, rows: cleaned.rows });
      elements.resultText.textContent = `処理前 ${current.rows.length}行 → 保存後 ${cleaned.rows.length}行｜空行 ${cleaned.blankCount}行・重複 ${cleaned.duplicateCount}行を削除`;
      elements.result.hidden = false;
      setStatus("整理済みCSVをダウンロードしました。元のCSVは変更されていません。", "success");
    } catch (error) {
      setStatus(error instanceof CsvAppError ? error.message : "整理中に問題が発生しました。", "error");
    }
  });

  reset();
  if (location.hash === "#demo" || location.hash === "#demo-complete") {
    const demoCsv = [
      "氏名,メールアドレス,登録日,購入金額",
      "山田 花子,hanako@example.com,2026-09-01,3000",
      "佐藤 太郎,taro@example.com,2026-08-25,1500",
      "鈴木 次郎,jiro@example.com,2026-09-05,4200",
      "佐藤 太郎,taro@example.com,2026-08-25,1500",
      ",,,",
      "高橋 美咲,misaki@example.com,2026-09-03,2800",
    ].join("\r\n");
    const demoFile = new File([demoCsv], "顧客リスト_サンプル.csv", { type: "text/csv" });
    loadFile(demoFile).then(() => {
      if (location.hash !== "#demo-complete" || !current) return;
      elements.sort.value = "氏名";
      const cleaned = cleanRows(current.headers, current.rows, elements.sort.value);
      elements.previewHeading.textContent = "整理後の内容（先頭5行）";
      showPreview({ headers: current.headers, rows: cleaned.rows });
      elements.resultText.textContent = `処理前 ${current.rows.length}行 → 保存後 ${cleaned.rows.length}行｜空行 ${cleaned.blankCount}行・重複 ${cleaned.duplicateCount}行を削除`;
      elements.result.hidden = false;
      setStatus("整理済みCSVをダウンロードしました。元のCSVは変更されていません。", "success");
    });
  }
}

if (typeof document !== "undefined") initBrowserApp();

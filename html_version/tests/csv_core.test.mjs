import test from "node:test";
import assert from "node:assert/strict";
import { cleanRows, createCsv, parseCsv, validateAndNormalize } from "../src/app.mjs";

test("quoted commas and newlines are parsed", () => {
  const rows = parseCsv('名前,メモ\r\n山田,"東京,大阪"\r\n佐藤,"1行目\n2行目"');
  assert.deepEqual(rows, [["名前", "メモ"], ["山田", "東京,大阪"], ["佐藤", "1行目\n2行目"]]);
});

test("blank and duplicate rows are removed", () => {
  const normalized = validateAndNormalize(parseCsv("名前,地域\n山田,東京\n,\n 山田 , 東京 \n佐藤,大阪\n"));
  const result = cleanRows(normalized.headers, normalized.rows);
  assert.equal(result.blankCount, 1);
  assert.equal(result.duplicateCount, 1);
  assert.deepEqual(result.rows, [["山田", "東京"], ["佐藤", "大阪"]]);
});

test("rows are sorted by a selected column", () => {
  const result = cleanRows(["氏名", "金額"], [["山田", "2000"], ["佐藤", "1000"]], "氏名");
  assert.deepEqual(result.rows.map((row) => row[0]), ["佐藤", "山田"]);
});

test("CSV output escapes commas and quotes", () => {
  const output = createCsv(["名前", "メモ"], [["山田", 'A,Bと"C"']]);
  assert.equal(output, '名前,メモ\r\n山田,"A,Bと""C"""');
});

test("duplicate detection can use one selected column", () => {
  const result = cleanRows(["メール", "氏名"], [["a@example.com", "山田"], ["a@example.com", "山田 花子"], ["b@example.com", "佐藤"]], "", "メール");
  assert.equal(result.duplicateCount, 1);
  assert.deepEqual(result.rows.map((row) => row[0]), ["a@example.com", "b@example.com"]);
});

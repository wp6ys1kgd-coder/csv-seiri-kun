import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const out='C:/Users/User/OneDrive/Desktop/CSV整理くん_試作品/release/CSV整理くん.xlsx';
const wb=Workbook.create(); const input=wb.worksheets.add('入力'); const result=wb.worksheets.add('整理結果'); const guide=wb.worksheets.add('使い方');
input.getRange('A1:D6').values=[['CSV整理くん（マクロなし）','','',''],['氏名','メールアドレス','登録日','購入金額'],['山田 花子','hanako@example.com','2026-09-01',3000],['佐藤 太郎','taro@example.com','2026-08-25',1500],['鈴木 次郎','jiro@example.com','2026-09-05',4200],['佐藤 太郎','taro@example.com','2026-08-25',1500]];
input.getRange('A8').values=[['使い方：A2:D200へCSVデータを貼り付け、整理結果シートを確認してください。']];
result.getRange('A1:D2').values=[['整理結果（サンプル）','','',''],['氏名','メールアドレス','登録日','購入金額']];
result.getRange('A3').formulas=[["=_xlfn.UNIQUE(_xlfn.FILTER(入力!A3:D200,入力!A3:A200<>\"\",\"\"))"]];
guide.getRange('A1:A6').values=[['CSV整理くん Excel版'],['1. 入力シートの見出しを残し、A3:D200へCSVデータを貼り付けます。'],['2. 整理結果シートに空行と重複行を除いた結果が自動表示されます。'],['3. 必要な範囲をCSVとして保存します。'],['この版はマクロを使わないため、警告なしで開けます。'],['数値・日付順や列指定の重複判定は次版で追加予定です。']];
for (const s of [input,result,guide]) { s.getUsedRange().format.font={name:'Meiryo',size:11}; s.showGridLines=false; }
input.getRange('A1:D1').format={fill:'#2257D6',font:{name:'Meiryo',size:14,bold:true,color:'#FFFFFF'}}; result.getRange('A1:D1').format={fill:'#15803D',font:{name:'Meiryo',size:14,bold:true,color:'#FFFFFF'}}; guide.getRange('A1:A1').format={fill:'#334155',font:{name:'Meiryo',size:14,bold:true,color:'#FFFFFF'}};
input.getRange('A2:D2').format.font={bold:true}; result.getRange('A2:D2').format.font={bold:true}; input.getRange('D3:D200').format.numberFormat='#,##0'; input.freezePanes.freezeRows(2); result.freezePanes.freezeRows(2);
wb.recalculate(); await fs.mkdir('C:/Users/User/OneDrive/Desktop/CSV整理くん_試作品/release',{recursive:true}); const x=await SpreadsheetFile.exportXlsx(wb); await x.save(out); console.log(out);

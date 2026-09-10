import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const out='C:/Users/User/OneDrive/Desktop/CSV整理くん_試作品/release/CSV整理くん.xlsx';
const wb=Workbook.create(); const input=wb.worksheets.add('入力'); const result=wb.worksheets.add('整理結果'); const guide=wb.worksheets.add('使い方'); const settings=wb.worksheets.add('設定');
input.getRange('A1:E6').values=[['CSV整理くん（マクロなし）','','','',''],['氏名','メールアドレス','登録日','購入金額','重複判定'],['山田 花子','hanako@example.com','2026-09-01',3000,''],['佐藤 太郎','taro@example.com','2026-08-25',1500,''],['鈴木 次郎','jiro@example.com','2026-09-05',4200,''],['佐藤 太郎','taro@example.com','2026-08-25',1500,'']];
input.getRange('E3').formulasR1C1=[["=IF(RC[-4]=\"\",\"\",IF(COUNTIF(_xlfn.CHOOSECOLS(R3C1:R200C4,MATCH(設定!R3C2,R2C1:R2C4,0)),_xlfn.CHOOSECOLS(RC1:RC4,1,MATCH(設定!R3C2,R2C1:R2C4,0)))>1,\"重複\",\"残す\"))"]]; input.getRange('E3:E200').fillDown();
input.getRange('A8').values=[['使い方：A2:D200へCSVデータを貼り付け、整理結果シートを確認してください。']];
result.getRange('A1:D2').values=[['整理結果（サンプル）','','',''],['氏名','メールアドレス','登録日','購入金額']];
result.getRange('A3').formulas=[["=IF(設定!B2=\"氏名\",_xlfn.SORT(_xlfn.FILTER(入力!A3:D200,入力!E3:E200=\"残す\"),1,1),IF(設定!B2=\"メールアドレス\",_xlfn.SORT(_xlfn.FILTER(入力!A3:D200,入力!E3:E200=\"残す\"),2,1),IF(設定!B2=\"購入金額\",_xlfn.SORT(_xlfn.FILTER(入力!A3:D200,入力!E3:E200=\"残す\"),4,1),_xlfn.SORT(_xlfn.FILTER(入力!A3:D200,入力!E3:E200=\"残す\"),3,1))))"]];
guide.getRange('A1:A6').values=[['CSV整理くん Excel版'],['1. 入力シートの見出しを残し、A3:D200へCSVデータを貼り付けます。'],['2. 整理結果シートに空行と重複行を除いた結果が自動表示されます。'],['3. 整理結果は登録日（3列目）の古い順に並びます。'],['この版はマクロを使わないため、警告なしで開けます。'],['並べ替え列の選択と列指定の重複判定は次版で追加予定です。']];
guide.getRange('A1:A6').values=[['CSV整理くん Excel版'],['1. 入力シートの見出しを残し、A3:D200へCSVデータを貼り付けます。'],['2. 整理結果シートに空行と重複行を除いた結果が自動表示されます。'],['3. 設定シートのB2で並べ替え列を選びます。'],['この版はマクロを使わないため、警告なしで開けます。'],['重複判定列の指定は次版で追加予定です。']];
settings.getRange('A1:C4').values=[['設定','',''],['並べ替え列','登録日',''],['重複判定列','メールアドレス',''],['選択肢','氏名 / メールアドレス / 登録日 / 購入金額','']];
for (const s of [input,result,guide,settings]) { s.getUsedRange().format.font={name:'Meiryo',size:11}; s.showGridLines=false; }
input.getRange('A1:D1').format={fill:'#2257D6',font:{name:'Meiryo',size:14,bold:true,color:'#FFFFFF'}}; result.getRange('A1:D1').format={fill:'#15803D',font:{name:'Meiryo',size:14,bold:true,color:'#FFFFFF'}}; guide.getRange('A1:A1').format={fill:'#334155',font:{name:'Meiryo',size:14,bold:true,color:'#FFFFFF'}};
input.getRange('A2:D2').format.font={bold:true}; result.getRange('A2:D2').format.font={bold:true}; input.getRange('D3:D200').format.numberFormat='#,##0'; input.freezePanes.freezeRows(2); result.freezePanes.freezeRows(2);
wb.recalculate(); await fs.mkdir('C:/Users/User/OneDrive/Desktop/CSV整理くん_試作品/release',{recursive:true}); const x=await SpreadsheetFile.exportXlsx(wb); await x.save(out); console.log(out);

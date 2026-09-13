(function(global){
'use strict';
const types={store:{required:['id','no','created','date','subject','cat','priority','status'],dates:['date','due'],text:['id','no','created','completed','date','subject','cat','priority','person','due','status','content','response','improve']},equipment:{required:['id','no','name','cat','cycle'],dates:['prev','next'],text:['id','no','name','cat','place','person','task','prev','next','cycle','customCycle','note']}};
function date(value,optional=true){
 if(value===''&&optional)return true;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T00:00:00Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
}
function records(input,kind){
 if(!Array.isArray(input))throw Error('データは配列形式である必要があります。');
 const schema=types[kind],ids=new Set(),numbers=new Set();
 return input.map((value,index)=>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error((index+1)+'件目の形式が不正です。');
  const x={...value};
  for(const key of schema.required)if(typeof x[key]!=='string'||!x[key].trim())throw Error((index+1)+'件目の'+key+'がありません。');
  for(const key of schema.text){if(x[key]===undefined)x[key]='';if(typeof x[key]!=='string')throw Error((index+1)+'件目の'+key+'は文字列で入力してください。');}
  for(const key of schema.dates)if(!date(x[key],key!=='date'))throw Error((index+1)+'件目の'+key+'が正しい日付ではありません。');
  if(!/^[A-Za-z0-9_-]+$/.test(x.id))throw Error('IDに不正な文字があります。');
  if(ids.has(x.id)||numbers.has(x.no))throw Error('IDまたは管理番号が重複しています。');
  ids.add(x.id);numbers.add(x.no);
  if(kind==='store'){
   if(!['未対応','対応中','完了'].includes(x.status)||!['低','通常','高','緊急'].includes(x.priority))throw Error('状況または重要度が不正です。');
   for(const k of ['created','completed'])if(x[k]&&!Number.isFinite(Date.parse(x[k])))throw Error('日時が不正です。');
  }else{
   if(x.history===undefined)x.history=[];
   if(!Array.isArray(x.history))throw Error('履歴の形式が不正です。');
   for(const h of x.history){
    if(!h||typeof h!=='object'||!date(h.date,false)||typeof h.task!=='string'||typeof h.person!=='string')throw Error('履歴の必須項目が不正です。');
    for(const k of ['issue','action','improve','caution','next'])if(h[k]!==undefined&&typeof h[k]!=='string')throw Error('履歴項目の型が不正です。');
    if(h.next&&!date(h.next))throw Error('履歴の次回期限が不正です。');
   }
  }
  return x;
 });
}
function csv(text){
 text=String(text).replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else cell+=c;continue;}
  if(c==='"'){if(cell||closed)throw Error('CSVの引用符の位置が不正です。');quoted=true;}
  else if(c===','){row.push(cell);cell='';closed=false;}
  else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v!==''))rows.push(row);row=[];cell='';closed=false;}
  else{if(closed)throw Error('CSVの引用符の後に不正な文字があります。');cell+=c;}
 }
 if(quoted)throw Error('CSVの引用符が閉じられていません。');
 if(cell||row.length){row.push(cell);rows.push(row);}
 if(!rows.length)throw Error('CSVにデータがありません。');
 if(rows.some(r=>r.length!==rows[0].length))throw Error('CSVの列数が一致しません。');
 return rows;
}
function encodeCsv(rows){return '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');}
function parseJson(text,kind){
 const raw=JSON.parse(String(text).replace(/^\uFEFF/,''));
 const values=Array.isArray(raw)?raw:(raw?.items??raw?.data??raw?.records);
 if(!Array.isArray(raw)&&raw.app&&raw.app!==kind)throw Error('別アプリのバックアップです。');
 const settings=Array.isArray(raw)?{}:raw.settings??{};
 if(!settings||typeof settings!=='object'||Array.isArray(settings)||Object.values(settings).some(x=>typeof x!=='string'))throw Error('設定の形式が不正です。');
 return {items:records(values,kind),settings};
}
function transaction(storage,key,values,settings={}){
 const changes={[key]:JSON.stringify(values),...settings},before={};
 for(const k of Object.keys(changes))before[k]=storage.getItem(k);
 // この退避が失敗した場合は業務データを変更しない。
 storage.setItem(key+'-before-restore',JSON.stringify(before));
 try{for(const [k,v]of Object.entries(changes))storage.setItem(k,v);}
 catch(error){for(const [k,v]of Object.entries(before)){try{v===null?storage.removeItem(k):storage.setItem(k,v);}catch{}}throw error;}
}
function download(name,text,type){
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
global.SalesSafety={date,records,csv,encodeCsv,parseJson,transaction,download};
if(typeof module!=='undefined')module.exports=global.SalesSafety;
})(typeof window!=='undefined'?window:globalThis);

(function(){
 const S=window.SalesSafety,equipment=KEY==='inspection-deadline-v1',kind=equipment?'equipment':'store';
 const settingKeys=equipment?['inspection-org','inspection-people','inspection-cats','inspection-warn']:['store-name'];
 const columns=equipment?[['管理番号','no'],['対象名','name'],['分類','cat'],['管理場所','place'],['担当者','person'],['点検内容','task'],['前回実施日','prev'],['次回期限','next'],['周期','cycle'],['任意周期','customCycle'],['備考','note']]:[['管理番号','no'],['発生日','date'],['件名','subject'],['分類','cat'],['重要度','priority'],['担当者','person'],['対応期限','due'],['対応状況','status'],['内容','content'],['対応内容','response'],['改善策','improve'],['登録日時','created'],['完了日時','completed']];
 const current=()=>equipment?items:data;
 const setRecords=values=>{if(equipment)items=values;else data=values;};
 const settings=()=>Object.fromEntries(settingKeys.map(k=>[k,localStorage.getItem(k)]).filter(([,v])=>v!==null));
 const envelope=()=>({version:2,app:kind,items:current(),settings:settings(),exportedAt:new Date().toISOString()});
 const navigate=()=>equipment?show('dash'):view('dashboard');
 const commit=(values,config={})=>{
  for(const key of Object.keys(config))if(!settingKeys.includes(key))throw Error('このアプリでは復元できない設定が含まれています。');
  if(config['inspection-warn']!==undefined){const n=Number(config['inspection-warn']);if(!Number.isInteger(n)||n<1||n>3650)throw Error('警告日数の設定が不正です。');}
  if(config['inspection-cats']!==undefined&&!config['inspection-cats'].split(',').some(v=>v.trim()))throw Error('分類設定が空です。');
  S.transaction(localStorage,KEY,values,config);setRecords(values);navigate();
 };
 backup=()=>{
  app.innerHTML='<div class="panel"><h2>バックアップ・復元</h2><p>JSON：全項目・点検履歴・アプリ設定の保全用。CSV：一覧交換用（履歴と設定は含まれません）。CSVのみでは完全復元できません。</p><div class="actions"><button id="safeJsonOut">JSON保存</button><button id="safeCsvOut">CSV保存</button><label>JSON復元<input id="safeJsonIn" type="file" accept=".json"></label><label>CSV読込<input id="safeCsvIn" type="file" accept=".csv"></label><button id="safeRecovery">直前の置換前データを保存</button></div><p id="safeMessage" role="status"></p></div>';
  const get=id=>document.getElementById(id),message=text=>get('safeMessage').textContent=text;
  get('safeJsonOut').onclick=()=>{try{S.download('完全バックアップ.json','\uFEFF'+JSON.stringify(envelope(),null,2),'application/json');message('JSONファイルを保存しました。ダウンロード先を確認してください。')}catch(e){message('保存ファイルを作成できませんでした：'+e.message)}};
  get('safeCsvOut').onclick=()=>{try{S.download('管理一覧.csv',S.encodeCsv([columns.map(([title])=>title),...current().map(x=>columns.map(([,key])=>x[key]??''))]),'text/csv;charset=utf-8');message('CSVを保存しました。履歴と設定はJSONで保全してください。')}catch(e){message('CSVを作成できませんでした：'+e.message)}};
  get('safeJsonIn').onchange=async event=>{
   const file=event.target.files?.[0];if(!file)return;
   try{const parsed=S.parseJson(await file.text(),kind);if(!confirm(parsed.items.length+'件で現在の'+current().length+'件を全置換します。設定もバックアップ内の内容へ復元し、現状は自動退避します。続けますか？'))return;commit(parsed.items,parsed.settings)}
   catch(e){message('復元できませんでした。既存データを維持しています。 '+e.message)}
   finally{event.target.value='';}
  };
  get('safeCsvIn').onchange=async event=>{
   const file=event.target.files?.[0];if(!file)return;
   try{
    const rows=S.csv(await file.text()),header=rows.shift();
    const required=equipment?['管理番号','対象名','分類','周期']:['管理番号','発生日','件名','分類','重要度','対応状況'];
    if(required.some(k=>!header.includes(k)))throw Error('アプリが出力したCSVの見出しが必要です。');
    if(new Set(header).size!==header.length)throw Error('CSVの見出しが重複しています。');
    let incoming=rows.map(row=>{const x={id:crypto.randomUUID()};for(const [title,key]of columns)x[key]=header.includes(title)?row[header.indexOf(title)]:'';if(equipment)x.history=[];else x.created=x.created||new Date().toISOString();return x;});
    incoming=S.records(incoming,kind);
    const mode=prompt(incoming.length+'件を読み込みます。現在は'+current().length+'件です。追加／全置換／キャンセルを入力してください。CSVには履歴・設定がありません。','キャンセル');
    if(mode!=='追加'&&mode!=='全置換')return;
    if(mode==='追加'){const used=new Set(current().map(x=>x.no));let counter=0;incoming=incoming.map(x=>{let no=x.no;while(used.has(no))no=(equipment?'CHK-':'MSG-')+String(++counter).padStart(4,'0');used.add(no);return{...x,no}});incoming=[...current(),...incoming];}
    if(!confirm(mode+'後は'+incoming.length+'件です。'+(mode==='全置換'?'現在の履歴も削除されます。':'')+'続けますか？'))return;
    commit(S.records(incoming,kind));
   }catch(e){message('CSVを読み込めませんでした。既存データを維持しています。 '+e.message)}
   finally{event.target.value='';}
  };
  get('safeRecovery').onclick=()=>{
   try{const raw=localStorage.getItem(KEY+'-before-restore');if(!raw)throw Error('置換前データはありません。');
    const snapshot=JSON.parse(raw),values=typeof snapshot[KEY]==='string'?JSON.parse(snapshot[KEY]):Array.isArray(snapshot)?snapshot:null;
    if(!values)throw Error('旧形式の退避データです。');
    const config=Object.fromEntries(settingKeys.filter(k=>typeof snapshot[k]==='string').map(k=>[k,snapshot[k]]));
    S.download('置換前バックアップ.json','\uFEFF'+JSON.stringify({version:2,app:kind,items:values,settings:config},null,2),'application/json');
    message('置換前データをJSONとして保存しました。JSON復元から戻せます。');
   }catch(e){message(e.message)}
  };
 };
})();

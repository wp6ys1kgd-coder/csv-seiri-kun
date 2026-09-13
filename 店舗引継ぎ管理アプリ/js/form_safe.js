
const formSafetyBase=form;
form=(id='')=>{
 formSafetyBase(id);
 const get=key=>document.getElementById(key),existing=data.find(x=>x.id===id)||{};
 get('saveBtn').onclick=()=>{
  const status=get('status').value;
  const record={...existing,id:id||crypto.randomUUID(),no:existing.no||nextStoreNumber(),created:existing.created||new Date().toISOString(),completed:status==='完了'?(existing.completed||new Date().toISOString()):'',date:get('date').value,subject:get('subject').value.trim(),cat:get('cat').value,priority:get('priority').value,person:get('person').value,due:get('due').value,status,content:get('content').value,response:get('response').value,improve:get('improve').value};
  if(!record.subject||!window.SalesSafety.date(record.date,false)||!window.SalesSafety.date(record.due)){alert('件名と有効な発生日・対応期限を確認してください。');return}
  const nextData=id?data.map(x=>x.id===id?record:x):[...data,record];
  try{localStorage.setItem(KEY,JSON.stringify(nextData));data=nextData;view('list')}
  catch(e){alert('保存できませんでした。既存データと入力内容は維持されています。JSONバックアップやブラウザーの保存容量を確認してください。')}
 };
 if(id)get('del').onclick=()=>{if(!confirm('この案件を削除しますか？'))return;const nextData=data.filter(x=>x.id!==id);try{localStorage.setItem(KEY,JSON.stringify(nextData));data=nextData;view('list')}catch(e){alert('削除を保存できませんでした。既存データは変更していません。')}};
};


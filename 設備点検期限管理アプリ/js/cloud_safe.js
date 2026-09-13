(function(){
 const get=k=>document.getElementById(k),S=window.SalesSafety,kind=KEY==='inspection-deadline-v1'?'equipment':'store';
 get('load').onclick=async()=>{
  if(!get('url').value){get('msg').textContent='接続先URLを入力してください。';return}
  try{
   const response=await fetch(get('url').value,{headers:headers()});if(!response.ok)throw Error(response.status+' '+response.statusText);
   const raw=await response.json(),values=S.records(Array.isArray(raw)?raw:(raw.data??raw.items),kind);
   const current=JSON.parse(localStorage.getItem(KEY)||'[]');
   if(!confirm(values.length+'件で現在の'+current.length+'件を置き換えます。現状は自動退避されます。続けますか？'))return;
   S.transaction(localStorage,KEY,values);const time=new Date().toLocaleString('ja-JP');localStorage.setItem(CFG+'-last',time);get('last').textContent='最終同期：'+time;get('msg').textContent=values.length+'件を読み込みました。メインアプリを再読み込みしてください。';
  }catch(e){get('msg').textContent='読込できませんでした。検証・保存に失敗した場合は既存データを維持しています。 '+e.message}
 };
})();

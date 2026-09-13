
(function(){
 let dirty=false;
 document.addEventListener('input',event=>{if(event.target.closest('#app .form'))dirty=true});
 document.addEventListener('click',event=>{
  if(!event.target.closest('nav button,nav a'))return;
  if(dirty&&!confirm('保存していない入力があります。変更を破棄して画面を移動しますか？')){event.preventDefault();event.stopImmediatePropagation();return}
  dirty=false;
 },true);
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue=''}});
 const region=document.getElementById('app');
 if(typeof MutationObserver!=='undefined')new MutationObserver(()=>{dirty=false}).observe(region,{childList:true});
})();


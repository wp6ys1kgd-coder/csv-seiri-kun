const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function load(folder,base){
  const map=new Map(),element=()=>({style:{},appendChild(){},addEventListener(){},querySelector:()=>element(),querySelectorAll:()=>[],innerHTML:'',textContent:'',value:''});
  const context={console,Date,Intl,Math,JSON,String,Number,Array,Object,RegExp,Error,Map,Set,URL,Blob,crypto:require('node:crypto').webcrypto,localStorage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)},confirm:()=>false,alert:()=>{},app:element(),sample:element(),sampleBtn:element(),viewTitle:element(),window:{},document:{querySelector:()=>element(),querySelectorAll:()=>[],createElement:()=>element(),getElementById:()=>element()}};
  vm.createContext(context);
  for(const file of [base,'review_fixes.js'])vm.runInContext(fs.readFileSync(path.join(root,folder,'js',file),'utf8'),context,{filename:file});
  return {run:code=>vm.runInContext(code,context),map};
}
const equipment=load('設備点検期限管理アプリ','app_fixed.js');
assert.equal(equipment.run("safeAddMonths('2026-01-31',1)"),'2026-02-28');
assert.equal(equipment.run("safeAddMonths('2024-01-31',1)"),'2024-02-29');
assert.equal(equipment.run("safeCalc('2026-09-12','任意設定','90日')"),'2026-12-11');
assert.equal(equipment.run("safeCalc('2026-01-31','任意設定','2か月')"),'2026-03-31');
assert.equal(equipment.run("safeCalc('2026-01-31','任意設定','0日')"),'');
assert.equal(equipment.run("safeStatus({next:''})[0]"),'期限未設定・要確認');
equipment.run("items=[{id:'keep',name:'業務データ'}];sample.onclick()");
assert.equal(equipment.run('items[0].id'),'keep');
const store=load('店舗引継ぎ管理アプリ','app.js');
store.run("data=[{id:'keep'}];sampleBtn.onclick()");
assert.equal(store.run('data[0].id'),'keep');
console.log('Actual application source regression: 9 assertions passed (mock DOM, not browser操作)');

const configuredCategories=()=>{const result=(localStorage.getItem('inspection-cats')||cats.join(',')).split(',').map(v=>v.trim()).filter(Boolean);return [...new Set([...result,...items.map(x=>x.cat)])]};
list=()=>{
 const categoryOptions=configuredCategories();
 app.innerHTML=`<div class="panel"><div class="form"><label>検索<input id="filterQ"></label><label>分類<select id="filterCat"><option value="">すべて</option>${categoryOptions.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>管理場所<input id="filterPlace"></label><label>担当者<input id="filterPerson"></label><label>状態<select id="filterState"><option value="">すべて</option><option>期限超過</option><option>7日以内</option><option>30日以内</option><option>期限未設定</option><option>今月予定</option></select></label></div><div class="actions"><button id="filterOver">期限超過</button><button id="filter7">7日以内</button><button id="filter30">30日以内</button><button id="filterMonth">今月予定</button><button id="filterClear">絞り込み解除</button></div><div id="filterRows"></div></div>`;
 const get=k=>document.getElementById(k);
 const render=()=>{const q=get('filterQ').value,c=get('filterCat').value,p=get('filterPlace').value,person=get('filterPerson').value,s=get('filterState').value;
 let selected=items.filter(x=>(!q||JSON.stringify(x).includes(q))&&(!c||x.cat===c)&&(!p||(x.place||'').includes(p))&&(!person||(x.person||'').includes(person)));
 selected=selected.filter(x=>{const n=safeDays(x.next);return !s||s==='期限超過'&&n!==null&&n<0||s==='7日以内'&&n!==null&&n>=0&&n<=7||s==='30日以内'&&n!==null&&n>=0&&n<=30||s==='期限未設定'&&n===null||s==='今月予定'&&x.next?.startsWith(localDate().slice(0,7))});
 get('filterRows').innerHTML=table(selected.slice().sort((a,b)=>(safeDays(a.next)??999999)-(safeDays(b.next)??999999)));
 get('filterRows').querySelectorAll('tr[data-id]').forEach(row=>row.onclick=()=>form(row.dataset.id));
 };
 for(const id of ['filterQ','filterCat','filterPlace','filterPerson','filterState']){get(id).oninput=render;get(id).onchange=render}
 for(const [id,state]of [['filterOver','期限超過'],['filter7','7日以内'],['filter30','30日以内'],['filterMonth','今月予定']])get(id).onclick=()=>{get('filterState').value=state;render()};
 get('filterClear').onclick=()=>{for(const id of ['filterQ','filterCat','filterPlace','filterPerson','filterState'])get(id).value='';render()};render();
};
history=()=>{
 app.innerHTML='<div class="panel"><h2>点検履歴</h2><label>履歴検索<input id="historyQ" placeholder="対象名・分類・実施日・担当者・不具合・改善策"></label><div id="historyRows"></div></div>';
 const input=document.getElementById('historyQ'),out=document.getElementById('historyRows');
 const render=()=>{const hs=items.flatMap(x=>(x.history||[]).map(h=>({...h,name:x.name,cat:x.cat}))).filter(x=>!input.value||JSON.stringify(x).includes(input.value));out.innerHTML=hs.map(h=>`<article class="card"><b>${esc(h.date)}｜${esc(h.name)}｜${esc(h.cat)}</b><p>担当者：${esc(h.person)}</p><p>作業：${esc(h.task)}</p><p>不具合：${esc(h.issue)}</p><p>対応：${esc(h.action)}</p><p>改善策：${esc(h.improve)}</p><p>注意事項：${esc(h.caution)}</p></article>`).join('')||'履歴はありません。'};input.oninput=render;render();
};
report=()=>{const m=localDate().slice(0,7);const count=key=>Object.entries(items.reduce((all,x)=>{all[x[key]||'未設定']=(all[x[key]||'未設定']||0)+1;return all},{})).map(([k,n])=>`<li>${esc(k)}：${n}件</li>`).join('');
app.innerHTML=`<div class="panel"><h2>集計（${m}）</h2><p>登録件数：${items.length}</p><p>今月実施：${items.flatMap(x=>x.history||[]).filter(x=>x.date.startsWith(m)).length}</p><p>今月予定：${items.filter(x=>x.next?.startsWith(m)).length}</p><p>期限超過：${items.filter(x=>safeDays(x.next)!==null&&safeDays(x.next)<0).length}</p><h3>分類別</h3><ul>${count('cat')}</ul><h3>担当者別</h3><ul>${count('person')}</ul></div>`};
const verifiedSettingsBase=settings;
settings=()=>{verifiedSettingsBase();const get=k=>document.getElementById(k);get('categories').value=(localStorage.getItem('inspection-cats')||cats.join(','));get('saveSettings').onclick=()=>{
 const warning=Number(get('warn').value),categories=get('categories').value.split(',').map(v=>v.trim()).filter(Boolean);
 if(!Number.isInteger(warning)||warning<1||warning>3650||!categories.length){alert('警告日数は1～3650の整数、分類は1件以上で入力してください。');return}
 const config={'inspection-org':get('org').value.trim(),'inspection-people':get('people').value,'inspection-cats':[...new Set(categories)].join(','),'inspection-warn':String(warning)};
 try{window.SalesSafety.transaction(localStorage,KEY,items,config);applyOrgName();alert('設定を保存しました。過去の分類は引き続き利用できます。')}catch(e){alert('設定を保存できませんでした。既存設定は維持されています。')}
};};


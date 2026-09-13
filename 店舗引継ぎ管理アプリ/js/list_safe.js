table=values=>`<table><thead><tr><th>管理番号</th><th>発生日</th><th>件名</th><th>分類</th><th>重要度</th><th>担当者</th><th>対応期限</th><th>状況</th></tr></thead><tbody>${values.map(x=>`<tr data-id="${esc(x.id)}" class="${businessOverdue(x)?'overdue':''}"><td>${esc(x.no)}</td><td>${esc(x.date)}</td><td>${esc(x.subject)}</td><td>${esc(x.cat)}</td><td>${esc(x.priority)}</td><td>${esc(x.person)}</td><td>${esc(x.due)}</td><td>${esc(x.status)}${businessOverdue(x)?' ⚠':''}</td></tr>`).join('')}</tbody></table>`;
list=()=>{
 window.only='';
 app.innerHTML=`<div class="panel"><div class="form"><label>検索<input id="q"></label><label>状況<select id="fs"><option value="">すべて</option>${statuses.map(x=>`<option>${x}</option>`).join('')}</select></label><label>分類<select id="fc"><option value="">すべて</option>${[...new Set([...cats,...data.map(x=>x.cat)])].map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>重要度<select id="fp"><option value="">すべて</option><option>低</option><option>通常</option><option>高</option><option>緊急</option></select></label><label>担当者<input id="fperson"></label><label>発生日<input id="fdate" type="date"></label><label>対応期限<input id="fdue" type="date"></label></div><div class="actions"><button id="un">未完了のみ</button><button id="ov">期限超過のみ</button><button id="clearFilter">絞り込み解除</button></div><p id="filterState"></p><div id="rows"></div></div>`;
 const get=id=>document.getElementById(id),inputs=['q','fs','fc','fp','fperson','fdate','fdue'];
 const render=()=>{const value=id=>get(id).value;
 let rows=data.filter(x=>(!value('q')||JSON.stringify(x).includes(value('q')))&&(!value('fs')||x.status===value('fs'))&&(!value('fc')||x.cat===value('fc'))&&(!value('fp')||x.priority===value('fp'))&&(!value('fperson')||(x.person||'').includes(value('fperson')))&&(!value('fdate')||x.date===value('fdate'))&&(!value('fdue')||x.due===value('fdue')));
 if(window.only==='un')rows=rows.filter(x=>x.status!=='完了');if(window.only==='ov')rows=rows.filter(businessOverdue);
 const labels={q:'検索',fs:'状況',fc:'分類',fp:'重要度',fperson:'担当者',fdate:'発生日',fdue:'対応期限'},conditions=inputs.filter(id=>value(id)).map(id=>labels[id]+'：'+value(id));
 if(window.only)conditions.push(window.only==='un'?'未完了のみ':'期限超過のみ');
 get('filterState').textContent='適用中：'+(conditions.join('／')||'条件なし');
 get('rows').innerHTML=table(rows);get('rows').querySelectorAll('tr[data-id]').forEach(row=>row.onclick=()=>form(row.dataset.id));
 };
 for(const id of inputs){get(id).oninput=render;get(id).onchange=render}
 get('un').onclick=()=>{window.only='un';render()};get('ov').onclick=()=>{window.only='ov';render()};get('clearFilter').onclick=()=>{inputs.forEach(id=>get(id).value='');window.only='';render()};render();
};


'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=process.env.REVIEW_APP_ROOT||path.resolve(__dirname,'..');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'csv-review-edge-'));
 const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end()}).pipe(res)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port,debug=19473;
 const edge=cp.spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port='+debug,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 let socket;let seq=0;const pending=new Map();const exceptions=[];
 try{
  let targets;for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:'+debug+'/json')).json();break}catch{await wait(100)}}
  if(!targets)throw Error('Edge CDP failed to start');
  socket=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'))},10000);pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}))});
  socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);clearTimeout(p.timeout);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}
   if(m.method==='Page.javascriptDialogOpening')send('Page.handleJavaScriptDialog',{accept:m.params.type==='confirm'||m.params.type==='prompt',promptText:'全置換'});
   if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text+' '+(m.params.exceptionDetails.exception?.description||''));
  };
  await send('Page.enable');await send('Runtime.enable');
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value};
  const navigate=async folder=>{await send('Page.navigate',{url:process.env.REVIEW_FILE_MODE?require('node:url').pathToFileURL(path.join(root,folder,'index.html')).href:'http://127.0.0.1:'+port+'/'+encodeURIComponent(folder)+'/index.html'});for(let i=0;i<60;i++){if(await evaluate('typeof window.SalesSafety === "object"'))return;await wait(100)}throw Error('App failed to load')};
  const importJson=async(text)=>evaluate(`(async()=>{backup();const input=document.getElementById('safeJsonIn');const transfer=new DataTransfer();transfer.items.add(new File([${JSON.stringify(text)}],'test.json',{type:'application/json'}));input.files=transfer.files;await input.onchange({target:input});return true})()`);
  await navigate('設備点検期限管理アプリ');
  await evaluate("items=[];localStorage.setItem(KEY,'[]');form();document.getElementById('name').value='SAMPLE設備';document.getElementById('task').value='定期点検';document.getElementById('person').value='Staff A';document.getElementById('cycle').value='任意設定';document.getElementById('customCycle').value='90日';document.getElementById('prev').value='2026-09-12';document.getElementById('auto').click();document.getElementById('saveBtn').click()");
  assert.equal(await evaluate('items[0].next'),'2026-12-11');
  await evaluate('form(items[0].id)');
  assert.equal(await evaluate("document.getElementById('customCycle').value"),'90日');
  await evaluate("document.getElementById('complete').click();document.getElementById('cancelDone').click()");
  assert.equal(await evaluate('items[0].history.length'),0);
  await evaluate("document.getElementById('complete').click();document.getElementById('doneDate').value='2026-09-15';window.doneButton=document.getElementById('confirmDone');window.doneButton.click();window.doneButton.click()");
  assert.equal(await evaluate('items[0].history.length'),1);
  assert.equal(await evaluate('items[0].next'),'2026-12-14');
  await evaluate('sample.onclick()');assert.equal(await evaluate('items.length'),1);
  const saved=await evaluate('JSON.stringify(items)');
  await importJson('\uFEFF'+saved);assert.equal(await evaluate('items.length'),1);
  await importJson('[{"id":"bad"}]');assert.equal(await evaluate('JSON.stringify(items)'),saved);
  await evaluate("schedule();document.getElementById('scheduleMonth').value='2027-01';document.getElementById('scheduleMonth').onchange()");
  assert.equal(await evaluate("document.getElementById('scheduleMonth').value"),'2027-01');

  await evaluate("settings();document.getElementById('org').value='SAMPLE事業所';document.getElementById('people').value='Sample Staff';document.getElementById('categories').value='SAMPLE分類';document.getElementById('warn').value='45';document.getElementById('saveSettings').click()");
  await send('Page.reload');await wait(300);
  await evaluate('form(items[0].id)');
  assert.equal(await evaluate("Array.from(document.getElementById('cat').options).some(x=>x.value==='SAMPLE分類')"),true);
  assert.equal(await evaluate("document.querySelector('#peopleList option').value"),'Sample Staff');
  assert.equal(await evaluate("safeStatus({next:safeCalc(localDate(),'任意設定','40日')})[0]"),'45日以内');
  assert.equal(await evaluate("document.querySelector('aside h1').textContent"),'SAMPLE事業所｜点検期限管理');
  await navigate('店舗引継ぎ管理アプリ');
  await evaluate("data=[];localStorage.setItem(KEY,'[]');form();document.getElementById('subject').value='SAMPLE申し送り';document.getElementById('date').value='2026-09-13';document.getElementById('saveBtn').click()");
  assert.equal(await evaluate('data.length'),1);
  await evaluate("list();document.getElementById('q').value='見つからない';document.getElementById('q').oninput();document.getElementById('un').click();document.getElementById('clearFilter').click()");
  assert.equal(await evaluate("document.querySelectorAll('#rows tr[data-id]').length"),1);
  const storeSaved=await evaluate('JSON.stringify(data)');await importJson('\uFEFF'+storeSaved);assert.equal(await evaluate('data.length'),1);
  await importJson('invalid');assert.equal(await evaluate('JSON.stringify(data)'),storeSaved);

  await evaluate("data[0].content='引用\\\"符,カンマ\\n改行';localStorage.setItem(KEY,JSON.stringify(data))");
  const expected=await evaluate('data[0].content');
  const csvText=await evaluate("window.SalesSafety.encodeCsv([['管理番号','発生日','件名','分類','重要度','担当者','対応期限','対応状況','内容','対応内容','改善策'],...data.map(x=>[x.no,x.date,x.subject,x.cat,x.priority,x.person,x.due,x.status,x.content,x.response,x.improve])])");
  await evaluate("data=[];localStorage.setItem(KEY,'[]')");
  await evaluate(`(async()=>{backup();const input=document.getElementById('safeCsvIn'),transfer=new DataTransfer();transfer.items.add(new File([${JSON.stringify(csvText)}],'test.csv'));input.files=transfer.files;await input.onchange({target:input})})()`);
  assert.equal(await evaluate('data[0].content'),expected);
  const beforeFailure=await evaluate('localStorage.getItem(KEY)');
  await evaluate("window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===KEY)throw new DOMException('Full','QuotaExceededError');return window.originalSet.call(this,k,v)}");
  await importJson(storeSaved);
  assert.equal(await evaluate('localStorage.getItem(KEY)'),beforeFailure);
  await evaluate("Storage.prototype.setItem=window.originalSet");

  const printId=await evaluate('data[0].id');
  await send('Page.navigate',{url:process.env.REVIEW_FILE_MODE?require('node:url').pathToFileURL(path.join(root,'店舗引継ぎ管理アプリ','印刷用テンプレート.html')).href:'http://127.0.0.1:'+port+'/'+encodeURIComponent('店舗引継ぎ管理アプリ')+'/'+encodeURIComponent('印刷用テンプレート.html')});
  await wait(200);assert.equal(await evaluate("document.getElementById('printBtn').disabled"),true);
  await send('Page.navigate',{url:(process.env.REVIEW_FILE_MODE?require('node:url').pathToFileURL(path.join(root,'店舗引継ぎ管理アプリ','印刷用テンプレート.html')).href:'http://127.0.0.1:'+port+'/'+encodeURIComponent('店舗引継ぎ管理アプリ')+'/'+encodeURIComponent('印刷用テンプレート.html'))+'?id='+encodeURIComponent(printId)});
  await wait(200);assert.equal(await evaluate("document.getElementById('printBtn').disabled"),false);
  assert.deepEqual(exceptions,[]);
  console.log('Edge DOM operation tests: registration/custom cycle/completion/cancel/sample protection/JSON/filters/month selection PASS');
 }finally{if(socket)socket.close();edge.kill();server.close();console.log('Disposable profile: '+profile)}
})().catch(e=>{console.error(e);process.exitCode=1});

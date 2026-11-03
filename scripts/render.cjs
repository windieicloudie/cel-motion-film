const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path');
(async()=>{
 const root=path.resolve(process.argv[2]||__dirname),frames=path.join(root,'frames');fs.mkdirSync(frames,{recursive:true});
 const server=http.createServer((req,res)=>{const f=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);fs.readFile(f,(e,b)=>{if(e){res.statusCode=404;res.end();return}res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b)})}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const mac='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';const executablePath=process.env.MG_CHROME||(fs.existsSync(mac)?mac:undefined);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.on('pageerror',e=>{throw e});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__ready);
 const samples=process.argv.includes('--stills')?[0,12,40,54,90,138,140,156,174,184,204,239]:Array.from({length:240},(_,i)=>i);
 for(let i of samples){await page.evaluate(t=>window.renderAt(t),i/24);let data=await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]);fs.writeFileSync(path.join(frames,String(i).padStart(4,'0')+'.png'),Buffer.from(data,'base64'));if(i%24===0)console.log(i+'/240')}
 const digests=[];for(const t of [3.75,6.5,0,3.75]){await page.evaluate(t=>window.renderAt(t),t);digests.push(await page.evaluate(()=>document.querySelector('canvas').toDataURL()))}if(digests[0]!==digests[3])throw Error('Render is not deterministic');console.log('Determinism: PASS');await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});

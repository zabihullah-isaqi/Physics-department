import {useState} from 'react';

const pythonCDN='https://cdn.jsdelivr.net/pyodide/v0.29.4/full/';
const pythonWorker=`
  import {loadPyodide} from "${pythonCDN}pyodide.mjs";
  self.onmessage=async ({data})=>{
    try {
      const send=text=>self.postMessage({text});
      const runtime=await loadPyodide({indexURL:${JSON.stringify(pythonCDN)},stdout:send,stderr:send});
      const result=await runtime.runPythonAsync(data);
      if(result!==undefined)send(String(result));
      self.postMessage({done:true});
    } catch(error) {
      self.postMessage({text:String(error).slice(0,5000),done:true});
    }
  };
`;

export function experimentDocument(code:string, language:'web'|'python') {
  if(language==='web') return `<!doctype html>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; base-uri 'none'; form-action 'none'">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    ${code}`;

  const literal=(value:string)=>JSON.stringify(value).replaceAll('<','\\u003c');
  return `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net/pyodide/; worker-src blob:; connect-src https://cdn.jsdelivr.net/pyodide/; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <style>body{font-family:system-ui;margin:1rem;color:#162d44}pre{white-space:pre-wrap;overflow-wrap:anywhere;text-align:left}</style>
  <p id="status" role="status">در حال آماده‌سازی پایتون…</p><pre id="output" dir="ltr"></pre>
  <script>
    const status=document.getElementById('status');
    const output=document.getElementById('output');
    const workerURL=URL.createObjectURL(new Blob([${literal(pythonWorker)}],{type:'text/javascript'}));
    const worker=new Worker(workerURL,{type:'module'});
    const timer=setTimeout(()=>finish('زمان اجرای پایتون تمام شد.'),45000);
    function finish(message){
      worker.terminate();
      URL.revokeObjectURL(workerURL);
      clearTimeout(timer);
      status.textContent=message;
    }
    worker.onmessage=({data})=>{
      if(typeof data.text==='string'&&output.textContent.length<16000){
        output.textContent+=data.text.slice(0,16000-output.textContent.length)+'\\n';
        status.textContent='در حال اجرا…';
      }
      if(data.done)finish('اجرا پایان یافت.');
    };
    worker.onerror=()=>finish('بارگیری یا اجرای پایتون ممکن نشد.');
    worker.postMessage(${literal(code)});
  </script></html>`;
}

export function Experiment({code,language,title}:{code:string;language?:'web'|'python';title?:string}) {
  const [document,setDocument]=useState('');
  if(!code.trim()) return null;
  return <div className="lesson-experiment">
    <button type="button" className="button dark" onClick={()=>setDocument(document?'':experimentDocument(code,language||'web'))}>
      {document?'بستن آزمایش':'اجرای آزمایش'}
    </button>
    {document&&<iframe className="lesson-experiment-frame" sandbox="allow-scripts"
      referrerPolicy="no-referrer" title={title||'نتیجهٔ آزمایش'} srcDoc={document}/>}
  </div>;
}

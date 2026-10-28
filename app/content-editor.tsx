'use client';
import {useEffect,useRef,useState} from 'react';
export function storageErrorMessage(error:unknown,lang:'ar'|'en'){
 const message=typeof error==='string'?error:(error as {message?:string})?.message||'Request failed';
 if(lang==='ar'&&message==='Account content storage limit reached')return 'بلغ المحتوى وسجل الإصدارات حد 32 MiB. احتُفظ بالمسودة؛ لم تُحفظ التغييرات.';
 if(lang==='ar'&&message==='Account file storage limit reached')return 'بلغت الملفات والصور حد التخزين المسموح للحساب (512 MiB)، أو امتلأت مساحة بياناتها الوصفية. لم يكتمل الحفظ.';
 if(lang==='ar'&&message==='Upload is pending or canceled. Clean unused uploads before retrying.')return 'الرفع معلّق أو مُلغى. افتح إدارة مساحة الحساب ونظّف الرفوع غير المستخدمة ثم أعد المحاولة.';
 if(lang==='ar'&&message==='Upload was canceled during cleanup')return 'أُلغي الرفع أثناء تنظيف المساحة. احتُفظ بالمحتوى؛ أعد الرفع عند الحاجة.';
 return message;
}

export type ContentItem={id:string;revision:number;kind:string;title:string;body:string;language:string;collection:string;updated:number;[key:string]:unknown};
const text={en:{article:'Article',snippet:'Code snippet',title:'Title',language:'Language',collection:'Collection',saving:'Saving',unsaved:'Unsaved changes',saved:'Saved',save:'Save now',sync:'Synchronizing',failed:'Sync failed',close:'Close',preview:'Preview',edit:'Edit',copy:'Copy',history:'Revision history',restore:'Restore as a new revision',latest:'Load latest',newCopy:'Save draft as a new item',image:'Insert image',leave:'Close and keep this draft?',recover:'Recover your unsaved draft?',placeholder:'Start writing…',offline:'Offline — your draft is kept on this tab',conflict:'Another device saved a newer version. Your draft is kept.',newer:'Load the latest version? Your draft remains recoverable.'},ar:{article:'مقال',snippet:'مقتطف برمجي',title:'العنوان',language:'اللغة',collection:'المجموعة',saving:'جاري الحفظ',unsaved:'تغييرات غير محفوظة',saved:'تم الحفظ',save:'حفظ الآن',sync:'جاري المزامنة',failed:'تعذرت المزامنة',close:'إغلاق',preview:'معاينة',edit:'تحرير',copy:'نسخ',history:'سجل الإصدارات',restore:'استعادة كإصدار جديد',latest:'تحميل الأحدث',newCopy:'حفظ المسودة كعنصر جديد',image:'إدراج صورة',leave:'إغلاق المحرر والاحتفاظ بالمسودة؟',recover:'استعادة مسودتك غير المحفوظة؟',placeholder:'ابدأ الكتابة…',offline:'غير متصل — مسودتك محفوظة في علامة التبويب',conflict:'حفظ جهاز آخر إصدارًا أحدث. احتُفظ بمسودتك',newer:'تحميل أحدث إصدار؟ ستبقى المسودة قابلة للاستعادة'}};
export async function contentRequest(path:string,method='GET',body?:unknown){
 const response=await fetch('/api/'+path,{method,credentials:'same-origin',cache:'no-store',headers:method==='GET'?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const result=await response.json() as {error?:string;current?:ContentItem;item:ContentItem;revisions:{revision:number;title:string;created:number}[];url:string};if(!response.ok)throw Object.assign(new Error(result.error||'Request failed'),{status:response.status,current:result.current});return result;
}

// Rendering is data-only: no stored HTML and no code evaluation.
export function ReadableText({body}:{body:string}){
 return <div className="article-reading">{body.split('\n').map((line,i)=><p key={i}>{line.split(/(!\[[^\]]*\]\(\/api\/images\/[0-9a-f-]{36}\)|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part,j)=>{
  const image=/^!\[([^\]]*)\]\((\/api\/images\/[0-9a-f-]{36})\)$/.exec(part);if(image)return <img key={j} src={image[2]} alt={image[1]} loading="lazy"/>;
  const link=/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);if(link)return <a key={j} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
  return part;
 })}{!line&&<br/>}</p>)}</div>;
}
export function CodePreview({body,language}:{body:string;language:string}){
 const pattern=/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|#[^\n]*|\b(?:const|let|var|function|return|class|if|else|for|while|import|from|def|print|true|false|null|None|SELECT|FROM|WHERE)\b|\b\d+(?:\.\d+)?\b)/g;
 return <pre className="code-preview" dir="ltr" aria-label={language}><code>{body.split(pattern).map((token,i)=><span className={/^["']/.test(token)?'token-string':/^(\/\/|#)/.test(token)?'token-comment':/^\d/.test(token)?'token-number':/^(?:const|let|var|function|return|class|if|else|for|while|import|from|def|print|true|false|null|None|SELECT|FROM|WHERE)$/.test(token)?'token-keyword':undefined} key={i}>{token}</span>)}</code></pre>;
}

export default function ContentEditor({item,kind,lang,owner,collections,onClose,onSaved}:{item:ContentItem|null;kind:'article'|'snippet';lang:'ar'|'en';owner:string;collections:string[];onClose:()=>void;onSaved:()=>void}){
 const [record,setRecord]=useState(item);
 const t=text[lang],key=useRef('oriva-content-draft:'+owner+':'+(item?.id||kind)),current=useRef<ContentItem|null>(item);
 const [title,setTitle]=useState(item?.title||''),[body,setBody]=useState(item?.body||''),[language,setLanguage]=useState(item?.language||'plaintext'),[collection,setCollection]=useState(item?.collection||'');
 const [state,setState]=useState<'saved'|'saving'|'sync'|'failed'>(item?'saved':'sync'),[message,setMessage]=useState(''),[preview,setPreview]=useState(false),[history,setHistory]=useState<{revision:number;title:string;created:number}[]|null>(null),[busy,setBusy]=useState(false),[replacing,setReplacing]=useState(false);
 const draft={title,body,language,collection},signature=JSON.stringify(draft),latest=useRef(draft),lock=useRef<Promise<ContentItem>|null>(null),blocked=useRef(false),mounted=useRef(true),imageInput=useRef<HTMLInputElement>(null);
 const [savedSignature,setSavedSignature]=useState(item?signature:'');
 useEffect(()=>{latest.current=draft},[signature]);
 // Storage is an external source; recover only after hydration.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{mounted.current=true;try{const cached=sessionStorage.getItem(key.current);if(cached&&window.confirm(t.recover)){const d=JSON.parse(cached);setTitle(d.title);setBody(d.body);setLanguage(d.language);setCollection(d.collection)}}catch{}return()=>{mounted.current=false}},[]);
 const dirty=signature!==savedSignature;
 const saveState=dirty&&(state==='saved'||(state==='sync'&&!busy))?'pending':state;
 const close=()=>{if(lock.current||busy)return;if(dirty&&!window.confirm(t.leave))return;onClose()};
 async function save(asCopy=false):Promise<ContentItem>{
  if(lock.current)return lock.current;
  const snapshot={...latest.current},sig=JSON.stringify(snapshot),base=asCopy?null:current.current;
  if(!navigator.onLine){setState('failed');setMessage(t.offline);throw new Error(t.offline)}
  setBusy(true);setState(base?'saving':'sync');setMessage('');
  const task=(async()=>{const result=await contentRequest(base?'items/'+base.id:'items',base?'PATCH':'POST',{...snapshot,title:snapshot.title||(lang==='ar'?'بدون عنوان':'Untitled'),kind,...(base?{revision:base.revision}:{})});current.current=result.item;setRecord(result.item);setSavedSignature(sig);blocked.current=false;if(mounted.current){setState('saved');onSaved()}try{const assignedKey='oriva-content-draft:'+owner+':'+result.item.id,remaining=JSON.stringify(latest.current);if(remaining!==sig)sessionStorage.setItem(assignedKey,remaining);else sessionStorage.removeItem(assignedKey);if(key.current!==assignedKey)sessionStorage.removeItem(key.current);key.current=assignedKey}catch{if(mounted.current)setMessage(lang==='ar'?'تعذر حفظ المسودة محليًا':'Draft storage unavailable')}return result.item as ContentItem})();
  lock.current=task;
  try{return await task}catch(e){blocked.current=(e as {status?:number}).status===409||[401,413,428].includes((e as {status?:number}).status||0);if(mounted.current){setState('failed');setMessage((e as {status?:number}).status===409?t.conflict:storageErrorMessage(e,lang))}throw e}finally{lock.current=null;if(mounted.current)setBusy(false)}
 }
 // Report sessionStorage failures without losing the editor contents.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(!dirty)return;try{sessionStorage.setItem(key.current,signature)}catch{setMessage(lang==='ar'?'تعذر حفظ المسودة محليًا':'Draft storage unavailable')}if(blocked.current||busy||(!title&&!body))return;const timer=setTimeout(()=>{void save().catch(()=>{})},850);return()=>clearTimeout(timer)},[signature,busy]);
 useEffect(()=>{const unload=(event:BeforeUnloadEvent)=>{if(dirty||lock.current){event.preventDefault();event.returnValue=''}};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopImmediatePropagation();close()}};window.addEventListener('beforeunload',unload);window.addEventListener('keydown',escape,true);return()=>{window.removeEventListener('beforeunload',unload);window.removeEventListener('keydown',escape,true)}},[dirty,busy]);
 async function loadLatest(){if(!current.current||!window.confirm(t.newer))return;setReplacing(true);setBusy(true);try{const result=await contentRequest('items/'+current.current.id);current.current=result.item;setRecord(result.item);const d={title:result.item.title,body:result.item.body,language:result.item.language||'plaintext',collection:result.item.collection};setSavedSignature(JSON.stringify(d));blocked.current=false;setTitle(d.title);setBody(d.body);setLanguage(d.language);setCollection(d.collection);setMessage('');setState('saved')}catch(e){setMessage(storageErrorMessage(e,lang))}finally{setReplacing(false);setBusy(false)}}
 async function revisions(){if(!current.current)return;try{const result=await contentRequest('items/'+current.current.id+'/revisions');setHistory(result.revisions)}catch(e){setMessage(storageErrorMessage(e,lang))}}
 async function restore(revision:number){if(!current.current||busy)return;if(dirty&&!window.confirm(t.leave))return;setReplacing(true);setBusy(true);try{const result=await contentRequest('items/'+current.current.id,'PATCH',{revision:current.current.revision,restoreRevision:revision});current.current=result.item;setRecord(result.item);const d={title:result.item.title,body:result.item.body,language:result.item.language||'plaintext',collection:result.item.collection};setSavedSignature(JSON.stringify(d));setTitle(d.title);setBody(d.body);setLanguage(d.language);setCollection(d.collection);setState('saved');setHistory(null);onSaved()}catch(e){setMessage(storageErrorMessage(e,lang));setState('failed')}finally{setReplacing(false);setBusy(false)}}
 async function insertImage(file?:File){if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2_000_000){setMessage('JPG / PNG / WebP · 2 MB');return}try{const record=await save();setBusy(true);const imageData=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Image read failed'));reader.readAsDataURL(file)});const result=await contentRequest('items/'+record.id+'/images','POST',{imageData});setBody(value=>value+'\n![image]('+result.url+')\n')}catch(e){setMessage(storageErrorMessage(e,lang))}finally{setBusy(false);if(imageInput.current)imageInput.current.value=''}}
 return <div className="modal-backdrop content-backdrop" onClick={close}><section role="dialog" aria-modal="true" aria-labelledby="content-title" className="content-editor" onClick={e=>e.stopPropagation()}>
  <header><h2 id="content-title">{t[kind]}</h2><span role="status" className={'save-state '+saveState}>{saveState==='pending'?t.unsaved:t[saveState]}{record&&' · '+new Date(Number(record.updated)*1000).toLocaleTimeString(lang)}</span><button type="button" disabled={busy} onClick={close}>{t.close}</button></header>
  <div className="content-toolbar"><button onClick={()=>setPreview(!preview)}>{preview?t.edit:t.preview}</button><button onClick={()=>{void navigator.clipboard.writeText(body).catch(e=>setMessage(e.message))}}>{t.copy}</button><button onClick={()=>{void revisions()}} disabled={!record||busy}>{t.history}</button>{kind==='article'&&<button disabled={busy} onClick={()=>imageInput.current?.click()}>{t.image}</button>}<button disabled={busy||!dirty} onClick={()=>{blocked.current=false;void save().catch(()=>{})}}>{state==='failed'?t.sync:t.save}</button></div>
  <label>{t.title}<input readOnly={replacing} value={title} maxLength={240} onChange={e=>setTitle(e.target.value)}/></label>
  <div className="content-fields"><label>{t.collection}<input readOnly={replacing} list="content-collections" maxLength={80} value={collection} onChange={e=>setCollection(e.target.value)}/><datalist id="content-collections">{collections.map(c=><option value={c} key={c}/>)}</datalist></label>{kind==='snippet'&&<label>{t.language}<input readOnly={replacing} dir="ltr" value={language} maxLength={40} onChange={e=>setLanguage(e.target.value)}/></label>}</div>
  {preview?(kind==='snippet'?<CodePreview body={body} language={language}/>:<ReadableText body={body}/>):<textarea readOnly={replacing} className={kind==='snippet'?'content-body code-input':'content-body'} dir={kind==='snippet'?'ltr':'auto'} value={body} maxLength={500000} placeholder={t.placeholder} onChange={e=>setBody(e.target.value)}/>}
  {message&&<div role="alert" className="error-message">{message}<div><button disabled={busy} onClick={()=>{void loadLatest()}}>{t.latest}</button><button disabled={busy} onClick={()=>{blocked.current=false;void save(true).catch(()=>{})}}>{t.newCopy}</button></div></div>}
  {history&&<div className="revision-panel"><h3>{t.history}</h3>{history.length?history.map(h=><div key={h.revision}><span>{h.revision} · {h.title} · {new Date(h.created*1000).toLocaleString(lang)}</span><button disabled={busy} onClick={()=>{void restore(h.revision)}}>{t.restore}</button></div>):<p>{lang==='ar'?'لا توجد إصدارات سابقة':'No previous revisions'}</p>}</div>}
  <input hidden ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{void insertImage(e.target.files?.[0])}}/>
 </section></div>;
}

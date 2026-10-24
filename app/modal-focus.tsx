'use client';
import {useEffect} from 'react';

// The existing custom dialogs retain their own close/dirty/busy behavior.
// Native <dialog> elements already manage focus through showModal().
export default function ModalFocus(){
 useEffect(()=>{
  let current:HTMLElement|null=null;
  let outside=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const openers=new Map<HTMLElement,HTMLElement|null>();
  const visible=(element:HTMLElement)=>element.getClientRects().length>0&&!element.hidden;
  const top=()=>Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"],[role="alertdialog"][aria-modal="true"]')).filter(visible).at(-1)||null;
  const controls=(modal:HTMLElement)=>Array.from(modal.querySelectorAll<HTMLElement>('button,a[href],input:not([type="hidden"]),textarea,select,summary,[tabindex]')).filter(element=>element.tabIndex>=0&&!element.matches(':disabled')&&visible(element));
  const focus=(modal:HTMLElement)=>{
   const fields=controls(modal),preferred=fields.find(element=>element.matches('input:not([type="file"]),textarea,select'));
   if(preferred||fields[0])(preferred||fields[0]).focus();
   else{modal.tabIndex=-1;modal.focus();}
  };
  const sync=()=>{
   const next=top();if(next===current)return;
   const previous=current;current=next;
   if(next){
    if(!openers.has(next)){const active=document.activeElement;openers.set(next,active instanceof HTMLElement&&!next.contains(active)?active:outside);}
    if(!next.contains(document.activeElement))focus(next);
   }else if(previous){const opener=openers.get(previous);if(opener?.isConnected)opener.focus();}
   if(previous&&!previous.isConnected)openers.delete(previous);
  };
  const focusIn=(event:FocusEvent)=>{
   const target=event.target;if(!(target instanceof HTMLElement))return;
   if(current&&!current.contains(target)){focus(current);return;}
   if(!top())outside=target;
  };
  const key=(event:KeyboardEvent)=>{
   if(event.key!=='Tab'||!current)return;
   const fields=controls(current),index=fields.indexOf(document.activeElement as HTMLElement);
   if(!fields.length){event.preventDefault();focus(current);return;}
   if(event.shiftKey&&index<=0){event.preventDefault();fields.at(-1)!.focus();}
   else if(!event.shiftKey&&(index<0||index===fields.length-1)){event.preventDefault();fields[0].focus();}
  };
  const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('focusin',focusIn,true);document.addEventListener('keydown',key,true);sync();
  return()=>{observer.disconnect();document.removeEventListener('focusin',focusIn,true);document.removeEventListener('keydown',key,true);};
 },[]);
 return null;
}

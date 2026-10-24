export type LibraryRecord={kind?:string;deleted_at?:number;pinned?:boolean;status:string;favorite:boolean;collection:string;title:string;url:string;note:string;tags:string[];file_name?:string};
export function matchesLibraryItem(item:LibraryRecord,filter:string,collection:string,status:string,query:string){
 if(filter==='trash'){if(!item.deleted_at)return false;}else if(item.deleted_at)return false;
 if(filter==='articles'&&item.kind!=='article')return false;
 if(filter==='snippets'&&item.kind!=='snippet')return false;
 if(filter==='favorites'){if(!item.favorite)return false;}
 else if(filter==='archive'){if(item.status!=='archived')return false;}
 else if(filter!=='trash'&&item.status==='archived')return false;
 if(collection&&item.collection!==collection)return false;
 if(status!=='all'&&item.status!==status)return false;
 return [item.title,item.url,item.note,item.file_name||'',...item.tags].join(' ').toLowerCase().includes(query.toLowerCase());
}

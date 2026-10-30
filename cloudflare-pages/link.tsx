import React,{forwardRef,type AnchorHTMLAttributes} from 'react';
// The retained application uses Next Link for ordinary same-site anchors.
// On static Pages, the same anchors reload the browser at the requested path.
type Props=AnchorHTMLAttributes<HTMLAnchorElement>&{href:string;prefetch?:boolean;replace?:boolean;scroll?:boolean};
export default forwardRef<HTMLAnchorElement,Props>(function PagesLink({prefetch,replace,scroll,...props},ref){return <a {...props} ref={ref}/>});

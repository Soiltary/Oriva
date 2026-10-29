#ifndef ORIVA_WINDOW_LAYOUT_H
#define ORIVA_WINDOW_LAYOUT_H
/* Fit mode transitions to the current monitor, including monitors whose
   working area starts at a negative coordinate or excludes a taskbar. */
static RECT orivaFittedWindowBounds(RECT current,RECT work,int width,int height){
 if(width>work.right-work.left)width=work.right-work.left;
 if(height>work.bottom-work.top)height=work.bottom-work.top;
 int x=current.left,y=current.top;
 if(x+width>work.right)x=work.right-width;
 if(y+height>work.bottom)y=work.bottom-height;
 if(x<work.left)x=work.left;if(y<work.top)y=work.top;
 RECT result={x,y,x+width,y+height};return result;
}
static BOOL orivaMonitorWorkArea(HWND target,RECT *work){
 MONITORINFO monitor={sizeof(monitor)};
 if(!GetMonitorInfoW(MonitorFromWindow(target,MONITOR_DEFAULTTONEAREST),&monitor))return FALSE;
 *work=monitor.rcWork;return TRUE;
}
static BOOL orivaResizeWithinWorkArea(HWND target,int width,int height){
 RECT current,work;if(!GetWindowRect(target,&current)||!orivaMonitorWorkArea(target,&work))return FALSE;
 RECT fit=orivaFittedWindowBounds(current,work,width,height);
 return SetWindowPos(target,NULL,fit.left,fit.top,fit.right-fit.left,fit.bottom-fit.top,SWP_NOZORDER|SWP_NOACTIVATE);
}
#endif

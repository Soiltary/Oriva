#ifndef ORIVA_AUTH_LAYOUT_H
#define ORIVA_AUTH_LAYOUT_H
/* Reapply logical client coordinates after RTL resizing; Windows preserves
   physical child positions when a mirrored parent changes width. */
typedef struct { HWND window; int x,y,width,height; } OrivaControlBounds;
static void orivaPlaceControls(const OrivaControlBounds *controls,size_t count){
 for(size_t i=0;i<count;i++)if(controls[i].window)MoveWindow(controls[i].window,controls[i].x,controls[i].y,controls[i].width,controls[i].height,TRUE);
}
#endif

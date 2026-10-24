#ifndef ORIVA_NATIVE_CHECK_H
#define ORIVA_NATIVE_CHECK_H
#include <stdio.h>
#include <stdlib.h>
/* Keep fixture failures visible in noninteractive Windows test processes. */
#undef assert
#define assert(condition) do { if (!(condition)) { fprintf(stderr,"FAIL %s:%d: %s\n",__FILE__,__LINE__,#condition); fflush(stderr); exit(1); } } while (0)
#endif

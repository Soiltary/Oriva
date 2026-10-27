// Synthetic local Workers rendering fixture. Never deploy this test route.
import { ImageResponse } from 'next/og';
import { createElement } from 'react';
export function GET() {
  return new ImageResponse(createElement('div', {style: {display:'flex',fontSize:24,background:'white'}}, 'Oriva <script> & safe'), {width:320,height:120});
}

// 주소를 QR 코드로. 칸을 SVG 경로 하나로 만들어 둔다 (innerHTML 없이 그릴 수 있게)
import qrcode from './vendor/qrcode.js';

/**
 * @param {string} text QR에 담을 주소
 * @returns {{size:number, d:string}} 한 변 칸 수와, 검은 칸들을 1×1 사각형으로 이은 경로
 */
export function qrPath(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  const parts = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (qr.isDark(y, x)) parts.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return { size, d: parts.join('') };
}

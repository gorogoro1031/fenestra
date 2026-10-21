// 배포 전에 실행: index.html의 CSS·JS 주소에 버전(?v=)을 붙인다.
// 브라우저가 파일마다 따로 캐시해서 새 파일과 옛 파일이 섞이면 앱이 시작하지 못하므로,
// 모든 모듈을 import map으로 같은 버전 주소에 묶는다. 사용: npm run stamp
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'index.html');
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const version = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;

const modules = readdirSync(join(root, 'js')).filter((f) => f.endsWith('.js')).sort();
const imports = Object.fromEntries(modules.map((f) => [`./js/${f}`, `./js/${f}?v=${version}`]));
const block = [
  '<!-- version:start (npm run stamp 가 고쳐 쓴다) -->',
  `<script type="importmap">${JSON.stringify({ imports })}</script>`,
  `<script type="module" src="js/main.js?v=${version}"></script>`,
  '<!-- version:end -->',
].join('\n');

let html = readFileSync(htmlPath, 'utf8');
const start = html.indexOf('<!-- version:start');
const end = html.indexOf('<!-- version:end -->');
if (start === -1 || end === -1) throw new Error('index.html에 version:start / version:end 표시가 없어요');
html = html.slice(0, start) + block + html.slice(end + '<!-- version:end -->'.length);
html = html.replace(/href="css\/([\w-]+)\.css(\?v=\d+)?"/g, `href="css/$1.css?v=${version}"`);
writeFileSync(htmlPath, html);
process.stdout.write(`버전 ${version} · 모듈 ${modules.length}개\n`);

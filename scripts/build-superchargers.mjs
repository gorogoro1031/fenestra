// supercharge.info 전체 목록(allSites JSON)에서 국내 운영 중인 슈퍼차저만 골라 js/superchargers.js를 만든다
// 사용: curl -s https://supercharge.info/service/supercharge/allSites -o /tmp/all.json && node scripts/build-superchargers.mjs /tmp/all.json
import { readFileSync, writeFileSync } from 'node:fs';

const KO_CITY = {
  Andong: '안동', Ansan: '안산', Anseong: '안성', Anyang: '안양', Bucheon: '부천', Busan: '부산', Buyeo: '부여', Changwon: '창원',
  Cheonan: '천안', Cheongdo: '청도', Cheongju: '청주', Cheonju: '전주', Chuncheon: '춘천', Chungju: '충주', Daegu: '대구',
  Daegwallyeong: '대관령', Daejeon: '대전', Daeseong: '대성', Dangjin: '당진', Donghae: '동해', Eumseong: '음성', Ganghwa: '강화',
  Gangnam: '강남', Gangneung: '강릉', Gangseo: '강서', Gapyeong: '가평', Gimcheon: '김천', Gimhae: '김해', Gimpo: '김포',
  Gongju: '공주', Goseong: '고성', Goyang: '고양', Gumi: '구미', Gunpo: '군포', Gunsan: '군산', Guri: '구리', Gwangju: '광주',
  Gwangmyeong: '광명', Gwangsan: '광산', Gwangyang: '광양', Gyeongju: '경주', Hadong: '하동', Hamyang: '함양', Hanam: '하남',
  Hwaseong: '화성', Icheon: '이천', Imsil: '임실', Incheon: '인천', Inje: '인제', Jangheung: '장흥', Jecheon: '제천', Jeju: '제주',
  Jeonju: '전주', Jincheon: '진천', Jinju: '진주', Mokpo: '목포', Namyangju: '남양주', Nonsan: '논산', Osan: '오산', Paju: '파주',
  Pangyo: '판교', Pohang: '포항', Pyeongchang: '평창', Pyeongtaek: '평택', Samcheok: '삼척', Sangju: '상주', Sejong: '세종',
  Seo: '서구', Seogwipo: '서귀포', Seongnam: '성남', Seoul: '서울', Siheung: '시흥', Sokcho: '속초', Songpa: '송파', Suncheon: '순천',
  Suseong: '수성', Suwon: '수원', Taebaek: '태백', Tongyeong: '통영', Uijeongbu: '의정부', Uiwang: '의왕', Uljin: '울진', Ulsan: '울산',
  Wanju: '완주', Wonju: '원주', Yangsan: '양산', Yangyang: '양양', Yeoju: '여주', Yeongwol: '영월', Yeosu: '여수', Yongin: '용인',
};

// 자리 이름(한국어). supercharge.info의 영어 이름을 옮겼다. 영어 이름이 없는 곳은 도시 이름만 쓴다
const KO_LABEL = {
  1115: '파르나스', 1116: '소노벨', 1132: '오크밸리', 1153: 'IFC', 1154: '엑스코', 1196: '파라다이스 호텔', 1327: '홀리데이 인',
  1328: '롯데월드타워', 1396: '라카이 샌드파인', 1418: '롯데리조트', 1440: '롯데호텔', 1459: '디테라스', 1460: '용산', 1528: '소노캄',
  1553: '롯데몰', 1804: '롯데몰', 1911: '신탄진', 2101: '안다즈', 2122: '오리', 2216: '김포공항', 2222: '송도 트리플스트리트',
  2224: 'IFC', 2226: '스타필드', 2233: '빗썸금융타워', 2503: '연제', 3283: '일산 N2워시', 3284: '신세계 프리미엄 아울렛', 3285: '기흥',
  3332: '대소원 홈마트', 3355: '발안', 3356: '루트스퀘어', 3462: 'G타워', 3475: '센터필드', 3476: '이시아폴리스', 3477: '왕십리',
  3497: '조례동', 3500: '쌍용 플래티넘', 3594: '롯데백화점', 3627: '타임빌라스', 3630: '파라스파라', 3699: '소피텔', 3703: '앨리웨이',
  3725: 'AK플라자', 3729: '더 스타릿', 3745: '제주 스토어', 3778: '하동', 3793: '평촌', 3813: '청량리', 3864: '휘닉스파크',
  3885: '히든베이 호텔', 3886: '서구', 3903: '송탄', 3928: '구래', 3948: '설해원', 3949: '청라 스퀘어7', 4104: '롯데 프리미엄 아울렛',
  4105: 'AK플라자', 4114: '롯데 아울렛', 4115: '테크원', 4142: '청원', 4143: '수성', 4144: '몰 오브 효자', 4291: 'LF스퀘어', 4305: '신사',
  4334: '첨단', 4335: '타임스트림', 4346: '에피소드 수유', 4347: 'CCMM', 4348: '9블럭', 4394: '라한셀렉트', 4396: 'ENTA 2022',
  4397: '롯데월드', 4564: '롯데 프리미엄 아울렛', 5019: '스피디움', 5047: '마리오아울렛', 5048: '모다아울렛', 5049: '농심호텔',
  5050: '도내동', 5052: '롯데백화점', 5053: '한화리조트', 5054: '모다아울렛', 5490: 'D타워', 5507: '모다아울렛', 5508: '오슬로파크',
  5573: '임실치즈테마파크', 5574: '대평', 5726: '오션투유 리조트', 5738: 'AK플라자', 5739: '일산', 5751: '뮌스터담', 5752: '상암',
  5753: 'KT&G', 5754: '영통', 5761: '테라로사', 5762: '세인트존스 호텔', 5764: '그랜드 하얏트 웨스트', 5765: '그랜드 하얏트 이스트',
  5806: '카카오 아지트', 5814: '중앙교회', 5914: '광명역', 5938: '썬밸리호텔', 5980: '금왕', 6021: '형곡', 6057: '아이파크몰',
  6058: '모다아울렛', 6079: '미사', 6080: '라포르테블랑', 6081: '카페 아스타나', 6090: '에피소드 서초', 6100: '테르메덴', 6123: '행주',
  6131: '대소', 6155: '분당 AK플라자', 6242: '대관령', 6281: '드래곤시티', 6392: '하단 아트몰링', 6394: '그랑비아 스타',
  6449: '모다아울렛', 6502: '종각', 6552: '365세이프타운', 6583: '씨사이드 리조트', 6621: '모다아울렛', 6629: '포곡', 6672: '물과학관',
  6853: 'DM스퀘어', 6881: '디스플레인', 7146: '바다쏭', 7211: '유스퀘어', 7212: '양지', 7228: '강서', 7229: '물치항',
  7361: '한국잡월드', 7366: 'AK플라자', 7396: '우리나라', 7435: '미곡 로스터리', 7619: '모다아울렛', 7655: 'AK플라자', 7656: '주촌',
  7695: '신라명가', 7829: 'AK플라자', 7963: '팩토리얼 성수', 8065: '모다아울렛', 8555: '중랑', 8556: '광덕4로', 8560: '읍내리',
  9109: '건설회관', 9308: '조양동', 9309: 'DCC', 9310: '진영휴게소 (부산 방향)', 10008: '모다아울렛', 10010: '모다아울렛',
  10045: '가평휴게소 (춘천 방향)', 10046: '가평휴게소 (서울 방향)', 10825: '논산천안고속도로', 10826: '논산천안고속도로',
  10827: '논산천안고속도로', 10828: '논산천안고속도로', 10830: '탑거리길', 10834: '수도권제1순환고속도로 (일산 방향)',
  10835: '수도권제1순환고속도로 (판교 방향)', 11260: '장유로', 11330: '서라벌대로', 11453: '자유로', 11526: '공항대로',
  12161: '수원문산고속도로 (서울 방향)',
};

// 'Paju-si', 'Uljin County' → 'Paju', 'Uljin'
const baseCity = (city) => city.replace(/(-si|-gun|-gu| County)$/i, '').trim();

// 시·도 → 지역 묶음 (지역 도장 모으기). Natural Earth admin-1의 name_ko 기준
const REGION_OF = {
  서울특별시: 'capital', 인천광역시: 'capital', 경기도: 'capital', 강원도: 'gangwon',
  대전광역시: 'chung', 세종특별자치시: 'chung', 충청북도: 'chung', 충청남도: 'chung',
  광주광역시: 'jeolla', 전라북도: 'jeolla', 전라남도: 'jeolla',
  부산광역시: 'gyeong', 대구광역시: 'gyeong', 울산광역시: 'gyeong', 경상북도: 'gyeong', 경상남도: 'gyeong',
  제주특별자치도: 'jeju',
};
// 먼 곳: 이 거리(km) 안에 다른 슈퍼차저가 없거나 제주
const FAR_KM = 25;

const ringsOf = (f) => (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]).map((poly) => poly[0]);
function inside([x, y], ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/** 좌표가 든 시·도. 바닷가라 경계 밖이면 가장 가까운 꼭짓점의 시·도 */
function provinceOf(lon, lat, features) {
  const hit = features.find((f) => ringsOf(f).some((r) => inside([lon, lat], r)));
  if (hit) return hit.properties.name_ko;
  let best = null;
  let bestD = Infinity;
  features.forEach((f) => ringsOf(f).forEach((r) => r.forEach(([x, y]) => {
    const d = (x - lon) ** 2 + (y - lat) ** 2;
    if (d < bestD) { bestD = d; best = f.properties.name_ko; }
  })));
  return best;
}
function km(a, b) {
  const rad = Math.PI / 180;
  const h = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// 지도 투영: 1920×1200 화면용 단순 등장방형 (위도 36.3°에서 가로를 줄인다). 화면 좌표 = 이 값
const MAP = { K: 178, COS: Math.cos((36.3 * Math.PI) / 180), LON0: 124.5, LAT0: 38.7 };
const project = (lon, lat) => [(lon - MAP.LON0) * MAP.K * MAP.COS, (MAP.LAT0 - lat) * MAP.K];
/** 시·도 윤곽을 SVG 경로로. 1.5px보다 가까운 점은 건너뛰고, 아주 작은 섬은 뺀다 */
function pathOf(feature) {
  return ringsOf(feature).map((ring) => {
    const pts = ring.map(([x, y]) => project(x, y));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    if (Math.max(...xs) - Math.min(...xs) < 3 && Math.max(...ys) - Math.min(...ys) < 3) return '';
    const kept = pts.filter((p, i) => i === 0 || i === pts.length - 1 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) >= 1.5);
    return `M${kept.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
  }).join('');
}

const [, , input, provincesPath] = process.argv;
if (!input || !provincesPath) throw new Error('allSites JSON과 Natural Earth 한국 시·도 GeoJSON 경로를 넘겨 주세요');
const provinces = JSON.parse(readFileSync(provincesPath, 'utf8')).features;
const all = JSON.parse(readFileSync(input, 'utf8'));
const sites = all
  .filter((s) => s.address?.country === 'South Korea' && s.status === 'OPEN' && s.gps)
  .map((s) => {
    const en = baseCity(s.address.city);
    const ko = KO_CITY[en];
    if (!ko) throw new Error(`한국어 도시 이름이 없어요: ${s.address.city}`);
    // '27 Nonsan Cheonan Expressway'처럼 앞에 붙은 번지는 뗀다
    const label = s.name.split(' - ').slice(1).join(' - ').trim().replace(/^\d+\s+(?=\D)/, '');
    const labelKo = label ? KO_LABEL[s.id] : '';
    if (label && !labelKo) throw new Error(`한국어 자리 이름이 없어요: ${s.id} ${label}`);
    const lat = Number(s.gps.latitude.toFixed(5));
    const lon = Number(s.gps.longitude.toFixed(5));
    const region = REGION_OF[provinceOf(lon, lat, provinces)];
    if (!region) throw new Error(`지역을 못 찾았어요: ${s.id}`);
    return [s.id, ko, en, labelKo, label, lat, lon, region];
  })
  .sort((a, b) => a[0] - b[0])
  .map((row, _, rows) => {
    const far = row[7] === 'jeju' || rows.every((o) => o === row || km([row[5], row[6]], [o[5], o[6]]) > FAR_KM);
    return [...row, far ? 1 : 0];
  });

const header = `// 국내 운영 중인 테슬라 슈퍼차저 (supercharge.info 공개 목록, scripts/build-superchargers.mjs로 만듦)
// [id, 도시(한국어), 도시(영어), 자리 이름(한국어), 자리 이름(영어), 위도, 경도, 지역, 먼 곳(1)]. 자리 이름이 없으면 빈 글자
`;
writeFileSync(new URL('../js/superchargers.js', import.meta.url), `${header}export const SUPERCHARGERS = Object.freeze(${JSON.stringify(sites).replace(/\],\[/g, '],\n  [').replace(/^\[\[/, '[\n  [').replace(/\]\]$/, '],\n]')});\n`);
const mapHeader = `// 슈퍼차저 지도의 대한민국 시·도 윤곽 (Natural Earth 1:10m admin-1, 퍼블릭 도메인. scripts/build-superchargers.mjs로 만듦)
// 1920×1200 화면 좌표. 슈퍼차저 점도 같은 project()로 놓는다
`;
writeFileSync(new URL('../js/korea-map.js', import.meta.url), `${mapHeader}export const MAP_VIEW = '-130 0 900 1000';
const MAP = ${JSON.stringify(MAP)};
/** 경도·위도 → 지도 좌표 */
export const project = (lon, lat) => [(lon - MAP.LON0) * MAP.K * MAP.COS, (MAP.LAT0 - lat) * MAP.K];
export const PROVINCE_PATHS = Object.freeze(${JSON.stringify(provinces.map(pathOf).filter(Boolean)).replace(/","/g, '",\n  "').replace(/^\["/, '[\n  "').replace(/"\]$/, '",\n]')});
`);
console.log(`${sites.length}곳 · 먼 곳 ${sites.filter((r) => r[8]).length}곳`);

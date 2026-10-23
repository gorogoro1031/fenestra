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

// 'Paju-si', 'Uljin County' → 'Paju', 'Uljin'
const baseCity = (city) => city.replace(/(-si|-gun|-gu| County)$/i, '').trim();

const [, , input] = process.argv;
if (!input) throw new Error('allSites JSON 경로를 넘겨 주세요');
const all = JSON.parse(readFileSync(input, 'utf8'));
const sites = all
  .filter((s) => s.address?.country === 'South Korea' && s.status === 'OPEN' && s.gps)
  .map((s) => {
    const en = baseCity(s.address.city);
    const ko = KO_CITY[en];
    if (!ko) throw new Error(`한국어 도시 이름이 없어요: ${s.address.city}`);
    const label = s.name.split(' - ').slice(1).join(' - ').trim();
    return [s.id, ko, en, label, Number(s.gps.latitude.toFixed(5)), Number(s.gps.longitude.toFixed(5))];
  })
  .sort((a, b) => a[0] - b[0]);

const header = `// 국내 운영 중인 테슬라 슈퍼차저 (supercharge.info 공개 목록, scripts/build-superchargers.mjs로 만듦)
// [id, 도시(한국어), 도시(영어), 자리 설명(영어), 위도, 경도]
`;
writeFileSync(new URL('../js/superchargers.js', import.meta.url), `${header}export const SUPERCHARGERS = Object.freeze(${JSON.stringify(sites).replace(/\],\[/g, '],\n  [').replace(/^\[\[/, '[\n  [').replace(/\]\]$/, '],\n]')});\n`);
console.log(`${sites.length}곳`);

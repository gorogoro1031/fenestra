// 매일 하나씩 소개하는 앨범. 한국 Apple Music에 있는 것만 (2026-10-21 확인)
// 표지는 Apple 서버의 이미지를 그대로 불러온다
export const ALBUMS = Object.freeze([
  {"id": 1454691596, "title": "Mother Earth's Plantasia", "artist": "Mort Garson", "year": 1976, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/50/7c/1b/507c1b1a-0af1-aa25-1544-ed3e44303842/15567.jpg/600x600bb.jpg", "note": "식물에게 들려주려고 만든 1976년 신시사이저 앨범. 페네스트라의 출발점"},
  {"id": 1790521507, "title": "Green", "artist": "Hiroshi Yoshimura", "year": 1987, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b4/f1/82/b4f182c0-0538-f509-1390-4f3c1d5f09c1/190.jpg/600x600bb.jpg", "note": "이름처럼 초록빛. 잎 사이로 바람이 지나가는 듯한 일본 환경음악"},
  {"id": 1773946851, "title": "Music for Nine Post Cards", "artist": "Hiroshi Yoshimura", "year": 2017, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/eb/9c/4b/eb9c4b6e-10c8-a540-4655-e0e7f854c2e6/281892.jpg/600x600bb.jpg", "note": "엽서 아홉 장처럼 짧고 맑은 피아노·신스 소품"},
  {"id": 1479717638, "title": "Still Way (Wave Notation 2)", "artist": "Satoshi Ashikawa", "year": 1982, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/e0/84/39/e084393e-1e8d-832a-1897-ffb46bda6ae0/4251648408499_3000.jpg/600x600bb.jpg", "note": "물결처럼 천천히 번지는 소리. 해 질 녘 도로에 잘 어울려요"},
  {"id": 724435863, "title": "Ambient 1: Music for Airports", "artist": "Brian Eno", "year": 1978, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ee/71/42/ee71425d-6bc9-3df8-c90b-8539f59144ab/00724386649553.rgb.jpg/600x600bb.jpg", "note": "앰비언트라는 말을 만든 앨범. 아무것도 하지 않아도 되는 시간"},
  {"id": 714499703, "title": "The Pearl", "artist": "Harold Budd & Brian Eno", "year": 1984, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7d/f7/8a/7df78a98-2a85-9175-828f-8aa997eb1bfe/00094633197657.rgb.jpg/600x600bb.jpg", "note": "물에 비친 빛 같은 피아노. 밤 드라이브용"},
  {"id": 714416645, "title": "Day of Radiance", "artist": "Laraaji", "year": 1980, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/6a/aa/18/6aaa187b-1f88-cf61-52f9-8408486923ba/00077778732754.jpg/600x600bb.jpg", "note": "햇살처럼 반짝이는 치터 연주. 맑은 날 아침에"},
  {"id": 1893766382, "title": "Wind", "artist": "Gigi Masin", "year": 1986, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ee/23/06/ee23063f-4299-9818-562c-3c3142382321/68183.jpg/600x600bb.jpg", "note": "베네치아 바닷바람 같은 잔잔한 신스"},
  {"id": 1714304663, "title": "Windswept Adan", "artist": "Ichiko Aoba", "year": 2020, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/fa/fa/0d/fafa0dd1-dda3-0b1d-077e-8ed879031092/143997.jpg/600x600bb.jpg", "note": "섬과 바다를 상상하며 만든 기타와 목소리"},
  {"id": 1663628050, "title": "Quiet Is the New Loud", "artist": "Kings of Convenience", "year": 2000, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/9f/53/1b/9f531bde-b511-fef2-1ebe-e78670c97c14/5400863121891_cover.jpg/600x600bb.jpg", "note": "속삭이듯 부르는 두 사람의 어쿠스틱 기타"},
  {"id": 281116024, "title": "Music Has the Right to Children", "artist": "Boards of Canada", "year": 1998, "art": "https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/b5/4c/c2/b54cc20d-03f5-f2c4-4a0d-9b51ad65af89/dj.txuslqgv.jpg/600x600bb.jpg", "note": "오래된 필름 같은 따뜻하고 흐릿한 전자음"},
  {"id": 1490459058, "title": "Dive", "artist": "Tycho", "year": 2012, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/03/c6/b8/03c6b89f-052f-53d3-d1d5-cd44e4d3c41b/804297814537.jpg/600x600bb.jpg", "note": "달리는 창밖 풍경과 박자를 맞추는 전자음악"},
  {"id": 1169245868, "title": "Migration", "artist": "Bonobo", "year": 2017, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/be/f1/d0/bef1d063-ed73-bd7d-3899-2217762cdcda/5054429005721.png/600x600bb.jpg", "note": "이동하는 사람을 위한 부드러운 비트"},
  {"id": 1451056840, "title": "Felt", "artist": "Nils Frahm", "year": 2011, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/1a/8b/63/1a8b63a7-1ca6-c4a6-d982-750de6e64ee7/4050486051450_cover.jpg/600x600bb.jpg", "note": "피아노에 펠트를 대고 숨소리까지 담은 녹음"},
  {"id": 1390704147, "title": "re:member", "artist": "Ólafur Arnalds", "year": 2018, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/9b/20/71/9b20711d-7ffe-2b59-4bae-6d6f614a1451/18UMGIM24750.rgb.jpg/600x600bb.jpg", "note": "피아노와 현악이 천천히 차오르는 아이슬란드 음악"},
  {"id": 258198881, "title": "Heaven Or Las Vegas", "artist": "Cocteau Twins", "year": 1990, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/76/cd/61/76cd61e7-0714-dce5-c48e-0f05f8fcb84b/652637001280.png/600x600bb.jpg", "note": "안개 같은 기타와 목소리. 비 오는 날에"},
  {"id": 1440864756, "title": "Chet Baker Sings", "artist": "Chet Baker", "year": 1954, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2f/99/e5/2f99e569-3920-07ab-b29e-c2da9b50468d/16UMGIM49055.rgb.jpg/600x600bb.jpg", "note": "나른한 트럼펫과 목소리. 느린 오후의 재즈"},
  {"id": 1473993015, "title": "Oncle Jazz", "artist": "Men I Trust", "year": 2019, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/50/c6/94/50c694d6-36cd-8808-5da3-d677b7726b6c/artwork.jpg/600x600bb.jpg", "note": "낮게 깔리는 베이스와 담담한 목소리"},
  {"id": 1581582605, "title": "Music for Psychedelic Therapy", "artist": "Jon Hopkins", "year": 2021, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4a/ee/67/4aee678c-ec54-cf5e-e652-75e468f2a99c/887828045860.png/600x600bb.jpg", "note": "숲과 동굴에서 녹음한 소리로 만든 명상 음악"},
  {"id": 1498704719, "title": "Piano Stories Best '88-'08", "artist": "Joe Hisaishi", "year": 2008, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/30/54/7a/30547aa2-0540-8d7b-6771-f887399ca227/20UMGIM04638.rgb.jpg/600x600bb.jpg", "note": "지브리 영화 음악을 피아노로. 동승자와 같이 흥얼거리기 좋아요"},
  {"id": 1625058458, "title": "Come Away With Me", "artist": "Norah Jones", "year": 2002, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/80/7b/02/807b023b-fb9e-de08-4c62-dd45d7d2317e/22UMGIM10696.rgb.jpg/600x600bb.jpg", "note": "따뜻한 피아노와 목소리. 누구와 타도 편한 앨범"},
  {"id": 1422655717, "title": "Getz/Gilberto", "artist": "Stan Getz & João Gilberto", "year": 1964, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/54/04/b8/5404b8fd-3dbf-9fe1-0513-4611c4dec84e/06UMGIM14182.rgb.jpg/600x600bb.jpg", "note": "보사노바의 시작. 창문을 조금 열고 들어 보세요"},
  {"id": 1078898175, "title": "Metaphorical Music", "artist": "Nujabes", "year": 2003, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/f3/20/32/f3203208-39f4-3d87-2bfb-918d7593bc38/HPD4.jpg/600x600bb.jpg", "note": "재즈 샘플 위의 부드러운 힙합 비트"},
  {"id": 1450778313, "title": "23", "artist": "혁오", "year": 2017, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/20/de/43/20de43fe-733e-3734-cab9-7bd787411260/Cover_HYUKOH_23.jpg/600x600bb.jpg", "note": "청춘의 거칠고 다정한 기타"},
  {"id": 1242154383, "title": "TEAM BABY", "artist": "검정치마", "year": 2017, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/be/ce/5c/bece5cff-2caf-6d8a-9c21-3035537d2a4d/Album_cover_1400X1400.jpg/600x600bb.jpg", "note": "사랑 노래로 가득한 늦은 밤의 앨범"},
  {"id": 1313141842, "title": "수잔", "artist": "김사월", "year": 2015, "art": "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/49/94/5e/49945e42-cb1d-c2c1-52e5-af231a4aa9fe/suzanne_cover.jpg/600x600bb.jpg", "note": "조용히 이야기하듯 부르는 포크"},
]);

const FIRST_DAY = Date.UTC(2026, 9, 21);
const DAY_MS = 86400000;
// 목록 길이와 서로소인 보폭으로 건너뛰어 비슷한 앨범이 연달아 나오지 않게 한다
const STRIDE = 11;

/**
 * 날짜(YYYY-MM-DD)마다 정해진 앨범 하나
 * @param {string} dateKey
 */
export function albumFor(dateKey) {
  const [y, m, d] = String(dateKey).split('-').map(Number);
  const day = Math.round((Date.UTC(y, m - 1, d) - FIRST_DAY) / DAY_MS);
  const n = ALBUMS.length;
  const index = Number.isFinite(day) ? (((day * STRIDE) % n) + n) % n : 0;
  return ALBUMS[index];
}

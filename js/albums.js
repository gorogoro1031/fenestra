// 매일 하나씩 소개하는 앨범. 한국 Apple Music에 있는 것만 (2026-10-21 확인)
// 표지는 Apple 서버의 이미지를 그대로 불러온다. country·genre·about은 시트의 소개, track이 있으면 그 앨범의 추천 곡
export const ALBUMS = Object.freeze([
  {"id": 1454691596, "title": "Mother Earth's Plantasia", "artist": "Mort Garson", "country": "미국", "year": 1976, "genre": "전자음악 · 무그 신시사이저", "track": "Plantasia", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/50/7c/1b/507c1b1a-0af1-aa25-1544-ed3e44303842/15567.jpg/600x600bb.jpg", "about": "캐나다 태생 작곡가 모트 가슨이 식물에게 들려주려고 만든 앨범이에요. 무그 신시사이저의 동글동글한 소리가 귀엽고 다정해요."},
  {"id": 1790521507, "title": "Green", "artist": "Hiroshi Yoshimura", "country": "일본", "year": 1986, "genre": "앰비언트 · 뉴에이지", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b4/f1/82/b4f182c0-0538-f509-1390-4f3c1d5f09c1/190.jpg/600x600bb.jpg", "about": "요시무라 히로시가 초록과 자연의 소리를 주제로 만든 앨범이에요. 물방울처럼 똑똑 떨어지는 신스가 잎 사이로 부는 바람처럼 편안해요."},
  {"id": 1773946851, "title": "Music for Nine Post Cards", "artist": "Hiroshi Yoshimura", "country": "일본", "year": 1982, "genre": "환경음악 · 앰비언트", "track": "Dance PM", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/eb/9c/4b/eb9c4b6e-10c8-a540-4655-e0e7f854c2e6/281892.jpg/600x600bb.jpg", "about": "일본 환경음악을 연 작곡가 요시무라 히로시의 첫 앨범이에요. 엽서처럼 짧은 피아노와 신스 곡들이 창밖 풍경을 한 장씩 천천히 넘기는 듯해요."},
  {"id": 1479717638, "title": "Still Way (Wave Notation 2)", "artist": "Satoshi Ashikawa", "country": "일본", "year": 1982, "genre": "환경음악 · 앰비언트", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/e0/84/39/e084393e-1e8d-832a-1897-ffb46bda6ae0/4251648408499_3000.jpg/600x600bb.jpg", "about": "요시무라 히로시와 함께 일본 환경음악 시리즈 'Wave Notation'을 만든 아시카와 사토시의 하나뿐인 앨범이에요. 물결처럼 천천히 번지는 소리가 해 질 녘 도로와 잘 어울려요."},
  {"id": 724435863, "title": "Ambient 1: Music for Airports", "artist": "Brian Eno", "country": "영국", "year": 1978, "genre": "앰비언트", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ee/71/42/ee71425d-6bc9-3df8-c90b-8539f59144ab/00724386649553.rgb.jpg/600x600bb.jpg", "about": "영국 음악가 브라이언 이노가 공항에서 틀 음악으로 만든, '앰비언트'라는 이름을 처음 붙인 앨범이에요. 느린 피아노와 목소리가 들어도 그만, 안 들어도 그만이라 마음이 가라앉아요."},
  {"id": 714499703, "title": "The Pearl", "artist": "Harold Budd & Brian Eno", "country": "미국 · 영국", "year": 1984, "genre": "앰비언트 · 피아노", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7d/f7/8a/7df78a98-2a85-9175-828f-8aa997eb1bfe/00094633197657.rgb.jpg/600x600bb.jpg", "about": "미국 작곡가 해럴드 버드의 피아노에 브라이언 이노가 잔향을 입힌 앨범이에요. 물에 비친 빛처럼 흐릿하고 느려서 밤 드라이브에 잘 맞아요."},
  {"id": 714416645, "title": "Day of Radiance", "artist": "Laraaji", "country": "미국", "year": 1980, "genre": "앰비언트 · 뉴에이지", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/6a/aa/18/6aaa187b-1f88-cf61-52f9-8408486923ba/00077778732754.jpg/600x600bb.jpg", "about": "뉴욕 거리에서 연주하던 라라지를 브라이언 이노가 발견해 함께 만든 앨범이에요. 반짝이는 치터 소리가 맑은 날 아침 햇살 같아요."},
  {"id": 1893766382, "title": "Wind", "artist": "Gigi Masin", "country": "이탈리아", "year": 1986, "genre": "앰비언트 · 뉴에이지", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ee/23/06/ee23063f-4299-9818-562c-3c3142382321/68183.jpg/600x600bb.jpg", "about": "이탈리아 베네치아 출신 음악가 지지 마신의 첫 앨범이에요. 바닷바람처럼 잔잔한 신스와 피아노가 오래 머물러요."},
  {"id": 1714304663, "title": "Windswept Adan", "artist": "Ichiko Aoba", "country": "일본", "year": 2020, "genre": "포크 · 체임버", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/fa/fa/0d/fafa0dd1-dda3-0b1d-077e-8ed879031092/143997.jpg/600x600bb.jpg", "about": "일본 싱어송라이터 아오바 이치코가 상상 속 섬을 위한 사운드트랙으로 만든 앨범이에요. 기타와 속삭이는 목소리, 현악이 바다 냄새처럼 퍼져요."},
  {"id": 1663628050, "title": "Quiet Is the New Loud", "artist": "Kings of Convenience", "country": "노르웨이", "year": 2001, "genre": "어쿠스틱 포크", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/9f/53/1b/9f531bde-b511-fef2-1ebe-e78670c97c14/5400863121891_cover.jpg/600x600bb.jpg", "about": "노르웨이 베르겐의 두 친구가 꾸린 듀오 킹스 오브 컨비니언스의 첫 앨범이에요. 제목처럼 조용히 속삭이는 기타와 화음이 편안해요."},
  {"id": 281116024, "title": "Music Has the Right to Children", "artist": "Boards of Canada", "country": "영국", "year": 1998, "genre": "일렉트로니카 · IDM", "art": "https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/b5/4c/c2/b54cc20d-03f5-f2c4-4a0d-9b51ad65af89/dj.txuslqgv.jpg/600x600bb.jpg", "about": "스코틀랜드 형제 듀오 보즈 오브 캐나다의 첫 정규 앨범이에요. 오래된 필름처럼 바랜 신스가 어린 시절 기억 같은 향수를 불러와요."},
  {"id": 1078914477, "title": "Modal Soul", "artist": "Nujabes", "country": "일본", "year": 2005, "genre": "재즈 힙합", "track": "Reflection Eternal", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/79/7e/a1/797ea11f-b90c-c4c5-f874-6a6ccd2c22a7/HPD5.jpg/600x600bb.jpg", "about": "일본 프로듀서 누자베스의 두 번째 앨범이에요. 재즈 피아노와 현악을 잘게 엮은 비트가 잔잔하게 이어져서, 창밖 풍경이 천천히 흘러가는 길에 잘 어울려요."},
  {"id": 1169245868, "title": "Migration", "artist": "Bonobo", "country": "영국", "year": 2017, "genre": "다운템포 · 일렉트로니카", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/be/f1/d0/bef1d063-ed73-bd7d-3899-2217762cdcda/5054429005721.png/600x600bb.jpg", "about": "영국 프로듀서 보노보가 이동하는 사람들을 주제로 만든 앨범이에요. 부드러운 비트와 세계 곳곳의 소리가 긴 이동길에 잘 어울려요."},
  {"id": 1451056840, "title": "Felt", "artist": "Nils Frahm", "country": "독일", "year": 2011, "genre": "모던 클래식 · 피아노", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/1a/8b/63/1a8b63a7-1ca6-c4a6-d982-750de6e64ee7/4050486051450_cover.jpg/600x600bb.jpg", "about": "독일 피아니스트 닐스 프람이 이웃을 깨우지 않으려고 피아노에 펠트를 대고 밤에 녹음한 앨범이에요. 건반 소리와 숨소리까지 가까이 들려요."},
  {"id": 1390704147, "title": "re:member", "artist": "Ólafur Arnalds", "country": "아이슬란드", "year": 2018, "genre": "네오 클래식", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/9b/20/71/9b20711d-7ffe-2b59-4bae-6d6f614a1451/18UMGIM24750.rgb.jpg/600x600bb.jpg", "about": "아이슬란드 작곡가 올라퍼 아르날즈의 앨범이에요. 그가 피아노를 치면 다른 피아노들이 따라 치는 장치로 만든 소리가 천천히 차올라요."},
  {"id": 258198881, "title": "Heaven Or Las Vegas", "artist": "Cocteau Twins", "country": "영국", "year": 1990, "genre": "드림팝", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/76/cd/61/76cd61e7-0714-dce5-c48e-0f05f8fcb84b/652637001280.png/600x600bb.jpg", "about": "스코틀랜드 밴드 콕토 트윈스의 대표작이에요. 안개 같은 기타와 뜻을 알 듯 말 듯한 목소리가 비 오는 날 창문 같아요."},
  {"id": 1440864756, "title": "Chet Baker Sings", "artist": "Chet Baker", "country": "미국", "year": 1954, "genre": "재즈 · 쿨 재즈", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2f/99/e5/2f99e569-3920-07ab-b29e-c2da9b50468d/16UMGIM49055.rgb.jpg/600x600bb.jpg", "about": "미국 트럼펫 연주자 쳇 베이커가 직접 노래한 앨범이에요. 나른하고 부드러운 목소리와 트럼펫이 느린 오후에 잘 어울려요."},
  {"id": 1473993015, "title": "Oncle Jazz", "artist": "Men I Trust", "country": "캐나다", "year": 2019, "genre": "드림팝 · 인디", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/50/c6/94/50c694d6-36cd-8808-5da3-d677b7726b6c/artwork.jpg/600x600bb.jpg", "about": "캐나다 몬트리올 밴드 멘 아이 트러스트의 앨범이에요. 낮게 깔리는 베이스와 담담한 목소리가 밤 드라이브처럼 차분해요."},
  {"id": 1581582605, "title": "Music for Psychedelic Therapy", "artist": "Jon Hopkins", "country": "영국", "year": 2021, "genre": "앰비언트", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4a/ee/67/4aee678c-ec54-cf5e-e652-75e468f2a99c/887828045860.png/600x600bb.jpg", "about": "영국 음악가 존 홉킨스가 에콰도르의 동굴에서 녹음한 소리로 만든 명상 음악이에요. 숲과 물소리 위로 신스가 천천히 숨 쉬어요."},
  {"id": 1498704719, "title": "Piano Stories Best '88-'08", "artist": "Joe Hisaishi", "country": "일본", "year": 2008, "genre": "피아노 · 영화음악", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/30/54/7a/30547aa2-0540-8d7b-6771-f887399ca227/20UMGIM04638.rgb.jpg/600x600bb.jpg", "about": "지브리 영화 음악으로 유명한 일본 작곡가 히사이시 조의 피아노 모음이에요. 귀에 익은 멜로디가 많아 동승자와 같이 흥얼거리기 좋아요."},
  {"id": 1625058458, "title": "Come Away With Me", "artist": "Norah Jones", "country": "미국", "year": 2002, "genre": "재즈 · 팝", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/80/7b/02/807b023b-fb9e-de08-4c62-dd45d7d2317e/22UMGIM10696.rgb.jpg/600x600bb.jpg", "about": "미국 싱어송라이터 노라 존스의 첫 앨범이에요. 따뜻한 피아노와 목소리가 누구와 타도 편안한 분위기를 만들어요."},
  {"id": 1422655717, "title": "Getz/Gilberto", "artist": "Stan Getz & João Gilberto", "country": "미국 · 브라질", "year": 1964, "genre": "보사노바 · 재즈", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/54/04/b8/5404b8fd-3dbf-9fe1-0513-4611c4dec84e/06UMGIM14182.rgb.jpg/600x600bb.jpg", "about": "미국 색소포니스트 스탄 게츠와 브라질 기타리스트 주앙 질베르투가 함께 만든 보사노바의 대표작이에요. 'The Girl from Ipanema'가 실려 있어요. 창문을 조금 열고 들어 보세요."},
  {"id": 1490459058, "title": "Dive", "artist": "Tycho", "country": "미국", "year": 2011, "genre": "일렉트로닉 · 칠웨이브", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/03/c6/b8/03c6b89f-052f-53d3-d1d5-cd44e4d3c41b/804297814537.jpg/600x600bb.jpg", "about": "미국 디자이너이자 음악가 스콧 핸슨의 프로젝트 티코의 앨범이에요. 반짝이는 신스와 기타가 창밖으로 흘러가는 풍경과 박자를 맞춰요."},
  {"id": 1450778313, "title": "23", "artist": "혁오", "country": "한국", "year": 2017, "genre": "인디 록", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/20/de/43/20de43fe-733e-3734-cab9-7bd787411260/Cover_HYUKOH_23.jpg/600x600bb.jpg", "about": "오혁이 이끄는 한국 밴드 혁오의 첫 정규 앨범이에요. 거칠면서도 다정한 기타에 스물셋의 불안과 설렘이 담겨 있어요."},
  {"id": 1242154383, "title": "TEAM BABY", "artist": "검정치마", "country": "한국", "year": 2017, "genre": "인디 록 · 팝", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/be/ce/5c/bece5cff-2caf-6d8a-9c21-3035537d2a4d/Album_cover_1400X1400.jpg/600x600bb.jpg", "about": "조휴일의 원맨 밴드 검정치마의 3집이에요. 사랑 노래로 가득해서 늦은 밤 드라이브에 잘 맞아요."},
  {"id": 1313141842, "title": "수잔", "artist": "김사월", "country": "한국", "year": 2015, "genre": "포크", "art": "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/49/94/5e/49945e42-cb1d-c2c1-52e5-af231a4aa9fe/suzanne_cover.jpg/600x600bb.jpg", "about": "한국 싱어송라이터 김사월의 첫 솔로 앨범이에요. 조용히 이야기하듯 부르는 노래와 기타가 혼자 운전하는 밤에 잘 어울려요."},
]);

// 첫날(이날의 앨범이 목록 맨 앞)
const FIRST_DAY = Date.UTC(2026, 9, 22);
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

/** 앨범 시트에서 고르는 음악 앱. Apple Music은 앨범으로 바로, Spotify·YouTube Music은 검색 결과로 열린다 */
export const MUSIC_APPS = Object.freeze([
  // opens: 열렸을 때 어떻게 보이는지 (i18n 키)
  { id: 'apple', name: 'Apple Music', color: '#fa2d48', opens: 'app.opens.album' },
  { id: 'spotify', name: 'Spotify', color: '#1ed760', opens: 'app.opens.search' },
  { id: 'youtube', name: 'YouTube Music', color: '#ff3b30', opens: 'app.opens.search' },
]);

/** 고른 앱에서 이 앨범을 여는 주소 */
export function listenLink(album, app) {
  const query = encodeURIComponent(`${album.artist} ${album.title}`);
  switch (app) {
    case 'spotify': return `https://open.spotify.com/search/${query}`;
    case 'youtube': return `https://music.youtube.com/search?q=${query}`;
    default: return `https://music.apple.com/kr/album/${album.id}`;
  }
}

// 처음 켰을 때 게임을 소개하는 카드들. 다음·이전 버튼이나 좌우로 밀어 넘긴다
const PAGES = [
  {
    icon: 'i-leaf', tone: 'tint', title: '달릴수록 자라는 몬스테라',
    body: '페네스트라는 차 안에서 키우는 몬스테라예요. 달린 만큼 물을 주면 씨앗부터 다 자랄 때까지 네 번 자라요.',
  },
  {
    icon: 'i-drop', tone: 'water', title: '달리면 이슬이 모여요',
    body: '10km를 달릴 때마다 이슬 한 방울. 차를 세우고 ‘물 주기’를 누르면 식물이 자라요. 처음엔 이슬 2개를 선물로 드려요. 실제 주행으로 모으려면 설정에서 켜 주세요.',
  },
  {
    icon: 'i-sun', tone: 'sun', title: '맑은 낮엔 광합성',
    body: '화면을 열어 두면 실제 날씨가 맑은 낮에 햇빛이 저절로 차올라요. 1분에 2, 구름이 조금 끼면 1. 흐리거나 비 오는 날과 밤엔 쉬어요. 몬스테라는 햇빛이 있을 때 물을 주면 두 배로 자라요. 날씨를 알려고 대략의 위치를 물어봐요.',
  },
  {
    icon: 'i-leaf', tone: 'sun', title: '꽃씨로 새 식물을',
    body: '1km 달릴 때마다 꽃씨 1개, 식물을 다 키우면 50개를 더 받아요. 온실에서 선인장·산세베리아·고무나무를 들일 수 있어요. 식물마다 잘 자라는 조건이 달라요.',
  },
  {
    icon: 'i-car', tone: 'label', title: '운전 중엔 보기만',
    body: '차가 움직이면 돌보기 버튼이 잠겨요. 운전자는 화면 대신 길을 봐 주세요. 옆자리라면 잎을 톡 건드려 보세요. 높은 잎일수록 높은 음이 나고, 가끔 숨어 있던 손님이 나와요.',
  },
];
const SWIPE_PX = 80;

/**
 * @param {HTMLDialogElement} dialog
 * @param {{ onOpen: () => void, onClose: () => void }} hooks 시트 배경 막을 켜고 끄는 데 쓴다
 */
export function createTutorial(dialog, { onOpen, onClose }) {
  const $ = (sel) => dialog.querySelector(sel);
  const content = $('.tour-content');
  const dots = [...dialog.querySelectorAll('.tour-dots span')];
  let page = 0;

  function show(next, direction = 0) {
    page = Math.min(PAGES.length - 1, Math.max(0, next));
    const { icon, tone, title, body } = PAGES[page];
    dialog.dataset.tone = tone;
    $('.tour-art use').setAttribute('href', `#${icon}`);
    $('#tour-title').textContent = title;
    $('#tour-body').textContent = body;
    dots.forEach((d, i) => d.classList.toggle('on', i === page));
    $('#tour-prev').hidden = page === 0;
    $('#tour-next').textContent = page === PAGES.length - 1 ? '시작하기' : '다음';
    if (direction && content.animate) {
      content.animate(
        [{ opacity: 0, transform: `translateX(${direction * 60}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 420, easing: 'cubic-bezier(.32, .72, 0, 1)' },
      );
    }
  }

  const close = () => dialog.close();
  $('#tour-next').addEventListener('click', () => (page === PAGES.length - 1 ? close() : show(page + 1, 1)));
  $('#tour-prev').addEventListener('click', () => show(page - 1, -1));
  $('#tour-skip').addEventListener('click', close);
  dialog.addEventListener('close', onClose);

  let startX = null;
  dialog.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  dialog.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (dx < -SWIPE_PX && page < PAGES.length - 1) show(page + 1, 1);
    if (dx > SWIPE_PX && page > 0) show(page - 1, -1);
  });

  return {
    open() {
      show(0);
      dialog.show();
      onOpen();
    },
  };
}

// 처음 켰을 때 게임을 소개하는 카드 4장. 다음·이전 버튼이나 좌우로 밀어 넘긴다
const PAGES = [
  {
    icon: 'i-leaf', tone: 'tint', title: '달릴수록 창이 열리는 식물',
    body: '페네스트라는 차 안에서 키우는 몬스테라예요. 잘 자랄수록 잎에 창(구멍)이 하나씩 열리고, 창이 4개 열리면 다 자라요.',
  },
  {
    icon: 'i-drop', tone: 'water', title: '달리면 물방울이 모여요',
    body: '1km를 달릴 때마다 물방울 1개. 차를 세우고 ‘물 주기’를 누르면 식물이 자라요. 실제 주행으로 모으려면 설정에서 켜 주세요.',
  },
  {
    icon: 'i-bolt', tone: 'sun', title: '충전하는 동안엔 햇빛',
    body: '‘충전 중’을 켜 두면 햇빛이 차올라요. 햇빛이 있을 때 물을 주면 두 배로 자라요.',
  },
  {
    icon: 'i-car', tone: 'label', title: '운전 중엔 보기만',
    body: '차가 움직이면 돌보기 버튼이 잠겨요. 운전자는 화면 대신 길을 봐 주세요. 옆자리라면 잎을 톡 건드려 보세요. 잎이 흔들리고 소리가 살짝 바뀌어요.',
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

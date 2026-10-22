// 처음 켰을 때 게임을 소개하는 카드들. 다음·이전 버튼이나 좌우로 밀어 넘긴다
import { t } from './i18n.js';

// 글자는 i18n.js의 tour.1~5 (지금 언어로 펼칠 때 고른다)
const PAGES = [
  { icon: 'i-leaf', tone: 'tint' },
  { icon: 'i-drop', tone: 'water' },
  { icon: 'i-sun', tone: 'sun' },
  { icon: 'i-leaf', tone: 'sun' },
  { icon: 'i-car', tone: 'label' },
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
    const { icon, tone } = PAGES[page];
    dialog.dataset.tone = tone;
    $('.tour-art use').setAttribute('href', `#${icon}`);
    $('#tour-title').textContent = t(`tour.${page + 1}.title`);
    $('#tour-body').textContent = t(`tour.${page + 1}.body`);
    dots.forEach((d, i) => d.classList.toggle('on', i === page));
    $('#tour-prev').hidden = page === 0;
    $('#tour-next').textContent = t(page === PAGES.length - 1 ? 'tour.start' : 'tour.next');
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

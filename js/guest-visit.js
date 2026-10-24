// 잎 위에 앉은 손님 하나를 보여 주고, 누르면 만나고, 아무도 안 누르면 날아가게 한다
import { GUEST_RULES, guestImage, guestName } from './guests.js';
import { t } from './i18n.js';

const LEAVE_MS = 700;

/**
 * @param {HTMLElement} host 손님을 올려 둘 층 (무대 좌표계)
 * @param {{onCatch: (id:string, x:number, y:number) => void}} hooks
 */
export function createGuestVisit(host, { onCatch }) {
  let current = null;

  function leave() {
    if (!current) return;
    const { el, timer } = current;
    clearTimeout(timer);
    current = null;
    el.classList.add('leaving');
    setTimeout(() => el.remove(), LEAVE_MS);
  }

  return {
    get present() { return current !== null; },
    /** 무대 좌표 (x, y) 잎 위에 손님을 앉힌다. stayMs: 아무도 안 누르면 머무는 시간 */
    arrive(id, x, y, stayMs = GUEST_RULES.STAY_MS) {
      leave();
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `guest guest-${id}`;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.setAttribute('aria-label', t('guest.meet', { name: guestName(id) }));
      const img = document.createElement('img');
      img.src = guestImage(id);
      img.alt = '';
      el.append(img);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        leave();
        onCatch(id, x, y);
      }, { once: true });
      host.append(el);
      current = { el, timer: setTimeout(leave, stayMs) };
    },
    leave,
  };
}

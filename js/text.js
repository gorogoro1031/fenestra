// 화면 문구 도우미: 한국어 조사, 인사 시간대, 이름 정리

/** 마지막 글자에 받침이 있으면 a, 없으면 b를 붙인다. 예: withJosa('선인장', '을', '를') → '선인장을' */
export function withJosa(word, a, b) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasFinal ? a : b}`;
}

// 인사 시간대: 이 시각부터 오후, 이 시각부터 저녁(다음 날 아침 전까지), 이 시각부터 아침
const AFTERNOON_FROM = 12;
const EVENING_FROM = 18;
const MORNING_FROM = 5;
export const NAME_MAX = 20;

/** 시각(0~24시)에 맞는 인사 시간대 */
export function greetingPeriod(hours) {
  const h = ((Number(hours) % 24) + 24) % 24;
  if (h >= MORNING_FROM && h < AFTERNOON_FROM) return 'morning';
  if (h >= AFTERNOON_FROM && h < EVENING_FROM) return 'afternoon';
  return 'evening';
}

/** 인사에 쓸 이름: 줄바꿈·연속 공백을 한 칸으로, 앞뒤 공백을 떼고 20자까지 */
export function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  return [...raw.replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX).join('');
}

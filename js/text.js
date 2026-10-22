// 한국어 문구 도우미

/** 마지막 글자에 받침이 있으면 a, 없으면 b를 붙인다. 예: withJosa('선인장', '을', '를') → '선인장을' */
export function withJosa(word, a, b) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasFinal ? a : b}`;
}

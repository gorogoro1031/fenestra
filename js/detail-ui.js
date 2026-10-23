// 위젯을 누르면 여는 설명 시트: 이슬(몇 개·다음 이슬까지·12칸), 컨디션(기온·알맞은 온도·다섯 구간·두 배)
import { RULES, LAST_STAGE, stageOf, kmToNextDrop, bonusInfo } from './state.js';
import { guideOf, conditionFor, plantName, plantHint, TEMP_MARGIN } from './plants.js';
import { bonusText, barPercent } from './ui.js';
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);
// 온도 막대 눈금의 양 끝(°C). 위치는 위젯과 같은 barPercent로
const TICK_ENDS = [0, 40];
const oneDecimal = (n) => Number(n.toFixed(1));

/**
 * 이슬 시트
 * @param {{gpsOn:boolean, canWater:boolean, waterLabel:string}} ctx canWater가 아니면 waterLabel(이유)을 버튼에 쓴다
 */
export function renderDewSheet(state, { gpsOn, canWater, waterLabel }) {
  const full = state.drops >= RULES.MAX_DROPS;
  const left = oneDecimal(kmToNextDrop(state));
  $('ds-num').textContent = String(state.drops);
  $('ds-hero-sub').textContent = full ? t('ds.full') : state.drops === 0 ? t('ds.empty', { km: left }) : t('ds.can', { n: state.drops });
  $('ds-next').textContent = full ? t('trip.dropFull') : `${left}km`;
  $('ds-today').textContent = `${state.todayKm.toFixed(1)}km`;
  $('ds-count').textContent = t('ds.times', { n: state.waterCount });
  $('ds-gps').textContent = t(gpsOn ? 'ds.on' : 'ds.off');
  $('ds-gps').classList.toggle('on', gpsOn);

  const drops = $('ds-drops');
  if (drops.children.length !== RULES.MAX_DROPS) drops.replaceChildren(...Array.from({ length: RULES.MAX_DROPS }, () => document.createElement('i')));
  const progress = full ? 1 : state.kmRemainder / RULES.KM_PER_DROP;
  [...drops.children].forEach((dot, i) => {
    dot.className = i < state.drops ? 'on' : i === state.drops ? 'next' : '';
    dot.style.setProperty('--p', String(progress));
  });
  $('ds-km-bar').style.setProperty('--p', String(progress));
  $('ds-km-of').textContent = full ? t('ds.fullBar') : t('ds.kmOf', { km: oneDecimal(state.kmRemainder), per: RULES.KM_PER_DROP });
  $('ds-km-left').textContent = full ? '' : t('ds.kmLeft', { km: left });

  const btn = $('ds-water');
  btn.disabled = !canWater;
  btn.textContent = canWater ? `${t('ds.water')} · ${t('water.one')}` : waterLabel;
}

/**
 * 컨디션 시트
 * @param {{temp:number|null, isNight:boolean, sunny:boolean, weatherLine:string, failed:boolean}} ctx
 *  weatherLine: 날씨·지역·언제 확인했는지 한 줄, failed: 날씨를 못 받았으면 '다시 확인'을 보인다
 */
export function renderCondSheet(state, { temp, isNight, sunny, weatherLine, failed }) {
  const id = state.active;
  const plant = plantName(id);
  const condition = conditionFor(id, temp);
  const known = condition !== 'unknown';
  const [low, high] = guideOf(id).temp;
  $('cs-hero').dataset.state = condition;
  $('cs-temp').textContent = known ? `${Math.round(temp)}°` : '–°';
  $('cs-state').textContent = t(`cond.${condition}`);
  $('cs-sub').textContent = weatherLine;
  $('cs-retry').hidden = !failed;
  $('cs-about').textContent = t('cs.about', { plant });

  $('cs-ok').style.left = `${barPercent(low)}%`;
  $('cs-ok').style.width = `${barPercent(high) - barPercent(low)}%`;
  $('cs-now').hidden = !known;
  if (known) {
    $('cs-now').style.left = `${barPercent(temp)}%`;
    $('cs-now-label').textContent = `${Math.round(temp)}°`;
  }
  $('cs-ticks').replaceChildren(...[TICK_ENDS[0], low, high, TICK_ENDS[1]].map((v) => {
    const span = document.createElement('span');
    span.textContent = `${v}°`;
    span.style.left = `${barPercent(v)}%`;
    return span;
  }));

  $('cs-zones-label').textContent = t('cs.zonesFor', { plant });
  const zones = [
    ['cold', t('cs.below', { n: low - TEMP_MARGIN }), '#8fc7ff'],
    ['cool', `${low - TEMP_MARGIN}–${low}°`, '#8fc7ff'],
    ['good', `${low}–${high}°`, 'var(--tint)'],
    ['warm', `${high}–${high + TEMP_MARGIN}°`, '#ff9f6b'],
    ['hot', t('cs.above', { n: high + TEMP_MARGIN }), '#ff9f6b'],
  ];
  $('cs-zones').replaceChildren(...zones.map(([key, range, color]) => {
    const li = document.createElement('li');
    li.className = `t-zone${key === condition ? ' now' : ''}`;
    li.style.setProperty('--zc', color);
    const p = document.createElement('p');
    p.textContent = range;
    const b = document.createElement('b');
    b.textContent = t(`cond.${key}`);
    li.append(p, b);
    return li;
  }));

  const grown = stageOf(state) === LAST_STAGE;
  const bonus = bonusInfo(state, { isNight, sunny });
  const on = bonus.active && !grown;
  $('cs-x2').classList.toggle('on', on);
  $('cs-x2-title').textContent = grown ? t('water.grown') : on ? t('cs.x2on') : bonusText(bonus);
  // 규칙 설명은 아직 두 배가 아닐 때만 (두 배일 땐 제목과 같은 말이라)
  $('cs-x2-hint').textContent = grown || on ? '' : plantHint(id);
}

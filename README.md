# Fenestra 프로토타입

달릴수록 자라는 몬스테라. 테슬라 브라우저(가로 1920×1200)용 정적 웹 프로토타입. 개인 연습 프로젝트이며 Tesla, Inc.와 관련이 없습니다.

배포 주소: https://gorogoro1031.github.io/fenestra/

## 실행

```bash
python3 -m http.server 5173
```

`http://localhost:5173` 을 연다. ES 모듈을 써서 파일을 바로 열면(file://) 동작하지 않는다.

## 확인용 주소 옵션 (저장하지 않음)

| 옵션 | 뜻 |
|---|---|
| `?scene=day` / `?scene=night` | 장면 고정 |
| `?noloading` | 로딩 화면 건너뛰기 |
| `?preview=0~4` | 해당 성장 단계로 꾸민 임시 상태 |

## 테스트

```bash
npm test
```

## 구조

```text
index.html         화면 틀 (정원·기록·설정·로딩)
css/tokens.css     색·글꼴 (iOS 다크 모드 시스템 색)
css/app.css        배치와 모션
js/state.js        게임 규칙 (순수 함수, 테스트 대상)
js/scene.js        햇빛 물결·비·물방울 캔버스, 식물 배치·단계 전환
js/ui.js           상태를 화면에 표시
js/sound.js        코드로 만든 바람·빗소리·차임
js/drive.js        위치로 거리·속도 재기
js/storage.js      브라우저 저장소
js/main.js         연결
assets/            성장 단계 식물 이미지 (GPT Image 2.5 Sunburst 생성, webp)
```

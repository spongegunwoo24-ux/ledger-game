# 「장부 (Ledger)」

> 연쇄살인범은 이미 처형됐다. 마을은 사건이 끝났다고 말한다. 처형된 사람은 내 아버지다.

1980년대 후반 걸프 연안의 작은 새우잡이 마을 펠리컨 코브. 아버지가 남긴 배 메리 루 호와 빚, 그리고 72통의 편지.

- 플레이: https://spongegunwoo24-ux.github.io/ledger-game/
- 기획서: [docs/DESIGN.md](docs/DESIGN.md)
- 진행 상황: [docs/PROGRESS.md](docs/PROGRESS.md)

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run check    # 타입 검사 + 린트 + 테스트
npm run build    # dist/ 빌드
```

Phaser 3 + TypeScript + Vite, 테스트는 Vitest. 그림은 전부 코드로 그린 임시 그림이며,
`src/art/manifest.ts`의 키 이름대로 `public/art/<키>.png`를 넣고 `REPLACEMENTS`에 키를 추가하면 그린 그림으로 바뀝니다.

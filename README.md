# Xiaomi Band Face Editor

Next.js + React + Tailwind + TypeScript で作る、Xiaomi Smart Band 向けの文字盤エディタです。テキスト/画像レイヤーの移動・リサイズ、プレビュー（Photo display 1–5）、レイヤー並べ替え、画像のクロップ/簡易背景除去、エクスポートなどをサポートします。

対応テンプレート:
- Xiaomi Smart Band 10: 212 × 520 px
- Xiaomi Smart Band 9: 192 × 490 px
- Xiaomi Smart Band 8: 192 × 490 px

セーフエリア・角丸はテンプレの定義に基づきプレビュー/書き出し時にクリップされます。

## 主な機能
- テンプレ選択（Band 10/9/8）と角丸プレビュー
- 画像インポート（PNG/JPEG/WebP）/ クロップ / 簡易背景除去
- テキスト/画像/図形（矩形・円）のドラッグ移動・リサイズ
- レイヤーのドラッグ&ドロップ並べ替え、表示/非表示、削除
- プレビュー（Photo display 1–5）サムネイルと実寸ガイド
- エクスポート（PNG/JPEG、倍率 1x/2x/3x）

## ディレクトリ構成

```
src/
  features/
    editor/           # エディタ本体・UI コンポーネント
      components/
      hooks/
      CanvasEditor.tsx
  shared/
    canvas.ts         # キャンバス描画ユーティリティ
    templates.ts      # デバイス/キャンバス定義
    types.ts          # レイヤー/アセット型
    icons.tsx, ui/
  pages/
    index.tsx, _app.tsx
pages/                # src/pages への薄いラッパー（互換）
styles/globals.css
```

## 開発

依存のインストールと起動:

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

Tailwind は `./src/**/*.{ts,tsx,js,jsx}` を監視するよう設定済みで、グローバル CSS は `pages/_app.tsx` から読み込まれます。

## 実装メモ
- TypeScript 化・型の厳格化: レイヤー/描画/イベント周りの any を排除し、共通ユーティリティに集約。
- プレビュー名は「Photo display 1–5」。Display 4 の灰色円は削除済み、5 はレイアウト調整。
- テキストは実計測（measureText）に基づきバウンディングを更新、画像と同様にハンドルでリサイズ可能。
- 履歴（undo/redo）は JSON スナップショットで管理し、画像は `src` から再水和。

## 既知の改善余地
- デバイス毎のガイド微調整（ピクセル単位）
- さらなる型の厳密化（外部ストレージ復元などのナローイング強化）
- 単体テストの追加

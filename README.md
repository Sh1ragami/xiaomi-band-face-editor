# Xiaomi Band Face Editor (MVP)

Next.js + React + Tailwind で作る、Xiaomi Smart Band 用の縦長キャンバス・セーフエリア・ガイド・書き出しツール（MVP）。

対応テンプレート:
- Xiaomi Smart Band 10: 212 × 520 px
- Xiaomi Smart Band 9: 192 × 490 px
- Xiaomi Smart Band 8: 192 × 490 px

セーフエリアは保守的な初期値（`components/templates.js`）で定義。実機検証で調整してください。

## 機能 (MVP)
- テンプレ選択（Band 10/9/8）
- キャンバス固定サイズ表示（ピル形状プレビュー）
- 画像のインポート（PNG/JPEG/WebP）
- ドラッグ移動 / ホイール拡大 / 回転スライダー
- セーフエリア/ガイド表示切替（センター/三分割）
- 書き出し: PNG/JPEG、1x/2x、キャンバス or セーフエリアのみ、PNG透過

## 開発

依存のインストール:

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

## 設計メモ
- テンプレ定義は `components/templates.js` の JSON 風オブジェクト。
- セーフエリアは角丸（ピル形状）前提でクリップ表示・書き出し。
- 書き出しは `canvas` または `safe` 範囲を選択可能。PNG は透過背景、JPEG は黒背景。
- 初期フィットは `Contain` に近い挙動（全体が収まる）でスケールを合わせます。

## 今後の拡張（非MVP）
- Smart center（顔検出で自動センター）
- プリセットレイアウト（写真＋時刻スペース など）
- レイヤー/テキスト/図形ツール、スナップ
- プロジェクト保存（JSON/ローカル/クラウド）


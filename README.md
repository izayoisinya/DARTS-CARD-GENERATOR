# DARTS-CARD-GENERATOR

ダーツ自己紹介カードを作成し、PNG保存や共有ができるブラウザアプリです。

## 公開前チェックリスト

- [x] 入力値の基本バリデーション（数値・画像サイズ）
- [x] CDNスクリプトにSRI（integrity）を付与
- [x] 最低限のCSPを設定
- [x] favicon（SVG/PNG）を配置
- [ ] サーバー側ヘッダー設定（CSP, HSTS, X-Content-Type-Options, Permissions-Policy）
- [ ] HTTPS本番ドメインでの実機検証（iOS/Android/PC）

## 画像・プライバシーについて

- ユーザーが選択した画像はブラウザ内で処理されます。
- サーバーに画像をアップロードする実装は含まれていません。
- 共有時はユーザー自身が内容を確認して投稿してください。

## アイコン構成

- `favicon.svg`
- `favicon-32x32.png`
- `favicon-16x16.png`

## ローカル実行

静的ファイルとして配置し、ブラウザで `index.html` を開けば動作します。
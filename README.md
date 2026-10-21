# プロジェクトマネージャ 午前Ⅱ 演習

IPA公開のプロジェクトマネージャ試験・午前Ⅱ（現：科目A-2）を1問ずつ解く静的Webアプリ。
[system-arch-training](https://github.com/rabut001/system-arch-training) のUIと演習の流れを引き継ぎ、スマホの画面構成、問題画像の拡大、軽量な復習支援を加えています。

**平成21年度～令和7年度の全17回425問を収録しています。** 原本画像・公式正解・解説の照合を終え、ローカル・GitHub Actions・公開URLで動作確認済みです。平成28年度春期問2はIPAによる不成立問題のため、閲覧のみで採点から除外します（採点対象424問）。[公開アプリはこちら](https://rabut001.github.io/project-manager-training-5/)（2026-10-21公開）。

## 作成の背景

このリポジトリは、Claude CodeとOpenAI Codexに同じ指示を与え、作成結果を比較するために用意したものです。本リポジトリのアプリは、**OpenAI Codex（モデル：GPT-6.1 Sol、モード：high）** で作成しました。

## 起動

Node.js 24系LTSとnpmを用います。

```sh
npm ci
npm run dev
```

既定の一覧は http://localhost:5173/project-manager-training-5/ 、演習は http://localhost:5173/project-manager-training-5/#/2025-r07-aki です。

```sh
python3 scripts/fetch-sources.py  # 原本を初回取得（Pythonの準備は後述）
npm run check        # データ検証、単体テスト、型検査、本番ビルド
node scripts/validate-data.mjs --release  # 425問と照合記録の公開条件を検証
npm run preview      # dist/ のローカル確認
```

実行時に必要なのはReactとReact DOMのみです。問題・画像・解説は静的に配信します。ログインや外部APIは使いません。

## 操作と保存

年度を選ぶ → ア～エを選ぶ → 結果を確認、で正答と独自解説を表示します。確認前は選び直せ、確認後は固定されます。一括採点では未回答を採点しません。

「あとで見直す」のチェックは回答と独立して保存します。すべて／未回答／誤答／チェック済みで問題番号と前後移動を絞り込めます。絞り込みは確認済み問題を再回答するモードではありません。

回答クリアは、その年度の回答だけを消し、チェックは残します。履歴はこのブラウザのlocalStorageだけに保存し、端末間の同期はしません。ブラウザのデータを消すと履歴も失われます。

## 問題作成と照合

原本の取得元とハッシュは `sources/manifest.json`、画像の切り出し座標・公式抽出正解は `sources/index.json` にあります。原本PDFは変更しません。原本PDF・OCRキャッシュ・年度別の抽出作業資料はローカル専用で、GitHubへ登録しません。

画像形式PDFの抽出をやり直すにはPython 3.12推奨、PyMuPDF、日本語・英語のTesseract認識データが必要です。PyMuPDFの内蔵OCRを使うため、tesseract実行ファイル自体は必須ではありません。認識データは [Tesseract公式tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast) の `jpn.traineddata` と `eng.traineddata` を同じディレクトリに配置します。

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/fetch-sources.py
python scripts/extract_questions.py 2025-r07-aki --recorded
# 新規の切出し・OCRを行う場合：
# python scripts/extract_questions.py 2025-r07-aki --tessdata /absolute/path/to/tessdata
python scripts/verify-sources.py
```

OCRの下書きは正確ではありません。抽出だけでは問題JSONを上書きしません。今回の誤認識は原本画像を見て `crop-overrides.json` に補正値を記録しました。OCRキャッシュは同じ原本に対して再利用します。原本を入れ替える場合はキャッシュを再作成してください。

作成・照合の手順は `docs/content-workflow.md`、問ごとの確認記録は `specs/0001-initial-release/content-checks.json`、補足の根拠は同案件の `references.md` にあります。

## ブラウザ検証

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

PC（1280px）とスマホ（390px）のChromiumで、採点、復元、一括採点、絞り込み、クリア、全17回425問の画像・解説、年度別の保存とクリア、不成立問題、拡大、ダイアログのフォーカス復帰、保存不可の場合を確認します。Safari実機の確認は別途必要です。

## 公開

GitHubリポジトリのSettings → Pages → SourceをGitHub Actionsにします。公開物は `dist/` だけです。原本PDF、作業資料、OCRキャッシュは含まれません。

更新の公開時は `.github/workflows/deploy.yml` を手動実行します。全17回425問、画像・解説の照合、利用者レビューの記録を検証してから配信します。baseパスはリポジトリ名から設定します。

ローカルで別の公開パスを確認する場合：

```sh
BASE_PATH=/my-repository/ npm run build
BASE_PATH=/my-repository/ npm run preview
```

公開先リポジトリは [rabut001/project-manager-training-5](https://github.com/rabut001/project-manager-training-5) です。初回公開は完了しています。GitHub ActionsはIPA原本を一時取得し、ハッシュ・公式解答を照合してからビルドします。Pagesで配信するのは `dist/` のみです。

## 改修と保守

現在の製品仕様は `docs/specification.md`、開発の約束は `AGENTS.md`、改修案件の履歴は `specs/` です。改修前に案件READMEを書き、製品の動作変更を正本へ反映し、実装と確認の結果を案件へ残します。完了した案件の資料は保持し、次の改修は新しい案件にします。

問題・解説の訂正は対応するJSONと必要な画像を修正し、原本・公式正解・解説を再照合します。採点は現行問題データから計算するため、公式正解の訂正も保存済み回答へ反映されます。

依存の更新候補はDependabotが月次で作成する設定です。更新時は変更内容を確認し、`npm run check` と関連するブラウザ確認を行って取り込みます。公開後に不具合が出た場合は、該当変更をrevertし、検証して再公開します。初回リリースの照合記録は保守時にも保持します。IPAのURL変更や原本差替えで取得・ハッシュ照合が失敗した場合は、原本と公式解答を確認してからmanifestを更新します。

## 出典

問題画像と公式正解の出典は [IPAの過去問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/) です。各問にも年度・期・区分・問番号と原本リンクを表示しています。補助テキストは設問・選択肢の要約です。原文・図表・厳密な条件は問題画像で確認してください。

解説は本アプリ用に作成・編集したもので、IPAの公式解説ではありません。一部の共通出題は参照元リポジトリのテキスト・解説を参考にし、当該年度の原本へ合わせて編集・照合しています。参照先は問ごとの確認記録に残しています。IPA問題の著作権は放棄されていません。[利用上の留意点](https://www.ipa.go.jp/shiken/faq.html) に従って利用してください。

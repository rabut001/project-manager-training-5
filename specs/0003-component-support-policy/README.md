# コンポーネントのLTS・保守方針の確認

状況：完了（2026-10-25）。

## 目的・変更内容

Node.js以外も、公式LTSがあるコンポーネントはLTSを優先する。LTSがないものは公式に保守されている安定版を使う。単に古いメジャー版を固定し続ける運用にはしない。

2026-10-25時点の直接依存、CIのOS・言語実行環境、GitHub Actions、問題画像の再作成に使うOCRの公式資料とローカル設定を確認する。

- CheckとDeployの全3ジョブを `ubuntu-latest` から `ubuntu-24.04` へ変更する。Ubuntu 24.04と26.04はいずれもLTSだが、`ubuntu-latest` は移行期間中でOSの世代が自動的に変わる。今回は既存構成に近い24.04 LTSを明示し、26.04への移行は別途検証して判断する。
- DependabotのReactグループをdevelopmentグループより先に置く。現在は先に一致するdevelopmentにReactの型定義が入るため、React本体と型定義の更新提案が分かれる。まとめてレビューできるようにする。グループ化だけでバージョンの整合が保証されるとは扱わない。
- 公式LTSを確認できないパッケージの更新提案は継続する。`@types/node` のメジャー更新除外は維持する。
- 仕様と保守手順へ共通方針、Pythonの保守期限確認、更新時の互換性確認を反映する。依存パッケージ自体のバージョンは変更しない。
- setup-nodeは既定でホストのキャッシュを優先するため、Node.jsについて「必ず最新パッチを取得する」と読める文言を「指定したLTS系列を使う」に修正する。

## 対象ファイル

`.github/workflows/check.yml`、`.github/workflows/deploy.yml`、`.github/dependabot.yml`、`docs/specification.md`、`README.md`、`specs/README.md` と本記録。

## 確認方法

- PyYAMLで3つのYAMLの構文と全ジョブのOS指定、Node.js 24／Python 3.12の指定維持、ActionsのSHA固定を確認する。
- 変更前のYAMLと構造を比較し、ワークフローはOS指定だけ、Dependabotはグループの優先順だけの変更であることを確認する。
- 各依存のグループ振り分けを設定の順序通りに確認し、React本体と型定義がreactグループにまとまることを確認する。
- 直接依存のバージョンとロックファイルの一致、プレリリースを採用していないことを確認する。
- `git diff --check` を実行する。アプリコード・データ・依存バージョンは変更しないため、アプリ全体の再テストやブラウザ検証は対象外とする。

## 調査結果（2026-10-25）

「LTSを確認できない」は下記の公式資料に専用のLTS系列が示されていないという調査結果であり、長期保守を保証するという意味ではない。

| 対象・現行設定 | 公式の保守方式・判断 | 対応 |
| --- | --- | --- |
| Node.js 24、`@types/node` 24.19.2 | 採用LTS系列は24。型定義も同じメジャーにする | 前案件の除外設定を維持 |
| CIのUbuntu（全3ジョブ） | 24.04／26.04ともLTS。`ubuntu-latest` は24.04から26.04への移行中 | 24.04 LTSを明示 |
| npm | 独自のLTSリリースはない。保守中のNode.jsに同梱される系列へのセキュリティ修正のバックポート方針 | Node.js 24同梱版を使用。独立の最新版インストール処理なし |
| Python 3.12 | LTSという区分ではなく系列ごとの保守。現在security段階、2028-10まで保守予定 | 3.12を継続。系列の変更は手動で検証し、期限前に移行 |
| React／React DOM 19.3.1 | Stable（Latest）、Canary、Experimentalの区分。専用LTS系列を確認できない | 現行の安定版を継続。本体と型定義を一緒にレビュー |
| `@types/react`／`@types/react-dom` 19.3.0 | 本体の型定義。単独の最新版よりReact本体とのメジャー整合が必要 | グループの順序を修正。取り込み時にメジャーの一致を確認 |
| Vite 8.3.4 | 現行minorに通常修正、直前のminor／major等に重要・セキュリティ修正。専用LTS系列を確認できない。8.3は通常保守対象 | 継続。メジャー更新の一律除外はしない |
| `@vitejs/plugin-react` 6.1.2 | 専用LTS系列を確認できない。ロックファイルのpeerDependenciesはVite `^8.0.0` | Viteとの互換性を確認して更新 |
| Vitest 5.0.5 | 現行minorに通常修正、直前のminor／majorに重要・セキュリティ修正。5.0は通常保守対象 | 継続。メジャー更新の一律除外はしない |
| TypeScript 7.0.2 | Beta／RC／Stableとパッチの区分。専用LTS系列を確認できない | 現行の安定版を継続 |
| Playwright 1.64.1／Chromium | リリースごとに対応ブラウザのバイナリが決まる。専用LTS系列を確認できない | 固定されたPlaywrightのCLIでChromiumを取得する現行方式を継続 |
| PyMuPDF 1.28.2／内蔵MuPDF | 公式の変更履歴・インストール資料に専用LTS系列を確認できない | 固定版を継続。現状pipのDependabot設定はなく、更新は手動確認。変更時は原本照合と画像再生成への影響を検証 |
| GitHub公式Actions（checkout、setup-node、setup-python、configure-pages、upload-pages-artifact、deploy-pages） | 各Actionのバージョンと、アプリ用Node.jsのバージョンは別。専用LTS系列を確認できない | SHA固定と月次の更新提案を継続。取り込み前に実行環境要件を確認 |
| Tesseract／tessdata_fast | ローカルの画像再作成用。公式リリースノートに専用LTS系列を確認できない | 配信・CIでOCRを新規実行する処理はなし。更新による切出し変更は内容作成手順で照合 |

確認範囲は設定と公式の保守方針。全推移依存の脆弱性監査、最新版への一括更新、GitHub上の実行は含めていない。

## 参照した公式資料

- [GitHubのUbuntu移行告知](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration/)、[Ubuntuの保守期間](https://ubuntu.com/about/release-cycle)
- [npmの保守方針](https://github.com/npm/cli/wiki/Support-Policy)
- [Pythonの系列別保守状況](https://devguide.python.org/versions/)
- [Reactのバージョン方針](https://react.dev/community/versioning-policy)
- [Viteの保守対象](https://vite.dev/releases)、[Reactプラグイン](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md)
- [Vitestの保守対象](https://vitest.dev/releases)
- [TypeScriptのリリース工程](https://github.com/microsoft/TypeScript/wiki/TypeScript%27s-Release-Process)
- [Playwrightのブラウザ管理](https://playwright.dev/docs/browsers)、[対応OS](https://playwright.dev/docs/intro#system-requirements)
- [PyMuPDFの変更履歴](https://pymupdf.readthedocs.io/en/latest/changes.html)、[インストールと内蔵MuPDF](https://pymupdf.readthedocs.io/en/latest/installation.html)
- [Tesseractのリリースノート](https://tesseract-ocr.github.io/tessdoc/ReleaseNotes.html)
- [Dependabotのグループ優先順](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#groups)、[setup-nodeの入力と既定値](https://github.com/actions/setup-node/blob/main/action.yml)

## 確認結果

2026-10-25に以下を実施。

- 公式資料と設定の確認では、Node.js以外に「公式LTSがあるのに非LTS版を選択している」直接の採用設定は見つからなかった。UbuntuのOS世代の自動切替とReact本体／型定義の更新グループ分離を保守上の改善対象とした。
- PyYAMLのBaseLoaderでDependabotとCheck／DeployのYAMLを読み取り、全3ジョブが `ubuntu-24.04` であることを確認した。
- GitのHEADのYAMLと構造を比較し、ワークフローはOS指定だけの変更で、Node.jsとPythonの指定・全Actionsの40桁SHA・手順が維持されることを確認した。
- Dependabotは前案件の `@types/node` 除外設定とグループの順序変更以外の設定がHEADと一致し、月次の更新設定が維持されることを確認した。
- 全10個の直接npm依存について、バージョンがプレリリース表記のない固定値であり、package-lockのルートと解決済みパッケージのバージョンが一致することを確認した。
- 設定の先頭から一致するルールを評価し、React／React DOM／両型定義がreactグループ、他6依存がdevelopmentグループに入ることを確認した。本体と型定義のメジャー、ReactとReact DOMの完全なバージョンの一致も確認した。
- Node.js指定24、enginesの24系制約、型定義の24系と、PyMuPDFの完全なバージョン固定を確認した。
- `git diff --check` に成功した。アプリコード・データ・テスト・依存定義ファイルが変更されていないことを確認した。

設定の静的確認のみを実施。アプリのテスト、ブラウザ検証、GitHub Actionsの実行、pushは未実施。Ubuntu 26.04への移行を検証済みとはしていない。

## 残作業

なし。将来のLTS移行、保守期限の再確認、依存更新は通常の保守案件として扱う。

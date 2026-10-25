# Node.jsの更新方針をLTSに合わせる

状況：完了（2026-10-25）。

## 目的・変更内容

Node.jsは最新のLTS系列を採用し、非LTSの最新版への更新を自動提案しない。現行の採用系列は24系。CIは既に `.node-version` の24を参照し、`package.json` も24系に限定されているため、これらは維持する。

Node.js本体の最新版を確認するGitHub Actionsの処理は存在しない。Dependabotによる `@types/node` のメジャー更新提案を除外し、採用LTS系列内のマイナー・パッチ更新は継続する。次のLTSへの移行時は、実行環境と型定義を合わせて手動で更新する。

## 対象ファイル

`.github/dependabot.yml`、`docs/specification.md`、`README.md`、`specs/README.md` と本記録。

## 確認方法

- Dependabot設定と両ワークフローのYAML構文を確認する。
- `@types/node` のメジャー更新だけが除外され、他の依存の更新設定が維持されることを確認する。
- 両ワークフロー、`.node-version`、`package.json`、ロックファイルのNode.js関連設定が24系で整合することを確認する。
- アプリ本体・問題データ・採点／保存処理・公開手順は変更しないため、ブラウザ確認やアプリ全体の再テストは対象外とする。

## 結果

2026-10-25に以下を実施。

- [GitHub公式のDependabot設定リファレンス](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#ignore)を確認し、`@types/node` に `version-update:semver-major` の除外設定を追加した。
- PythonとPyYAMLでDependabot設定およびCheck／Deploy両ワークフローのYAMLを読み取り、構文と設定を確認した。
- 除外対象が `@types/node` のメジャー更新だけであること、npmの月次スケジュールとグループ設定、GitHub Actions依存の月次更新設定が維持されることをアサーションで確認した。
- 両ワークフローが `.node-version` を参照すること、指定値24、`engines.node` の `>=24 <25`、型定義とロックファイルの24系が一致することをアサーションで確認した。
- `git diff --check` に成功した。

アプリのコード・データは変更していないため、アプリ全体のテストとブラウザ検証は実施していない。GitHubへの反映、Dependabotの実行は未実施。

## 残作業

なし。

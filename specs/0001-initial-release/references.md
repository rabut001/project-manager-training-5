# 全17回425問の照合根拠

確認日：2026-10-21。問題画像・選択肢・正解の正本はIPA。解説は本アプリの学習用の説明。参照元資産の利用は後述の「残り16回400問の照合」に記録。

| 対象 | 根拠と照合内容 |
| --- | --- |
| 全問 | [IPA令和7年度](https://www.ipa.go.jp/shiken/mondai-kaiotu/2025r07.html) のPM午前Ⅱ問題・解答。原本は `sources/2025-r07-aki/`、取得元・ハッシュはmanifestに記録。公式解答PDFから独立に再抽出して全25問一致を確認。 |
| 問1・2・10・12 | 設問で指定されたJIS Q 21500:2018の版と、問題文・各肢の役割・公式正解に基づいて説明。現在のISO 21500の版の名称へ置き換えていない。規格原文の全文照合は未実施。 |
| 問6・7・9 | 原本の図・式を読み、時間関係・経路長・指数を再計算。問6は12日、問7は33日から34日、問9は生産性=(1/3)×規模^−0.12。 |
| 問13 | [Bill Wake本人によるINVESTの説明](https://xp123.com/invest-in-good-stories-and-smart-tasks/)。六つの性質とユーザーストーリーへの適用を確認。 |
| 問14 | [NIST SP 800-160v1r1](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-160v1r1.pdf) のH.9・H.11（検証・妥当性確認）、I.7・I.8（測定・品質保証）を補足に使用。ISO 15288に基づくプロセスの説明であり、JIS原文の直接引用として扱わない。照合時にウ＝測定、エ＝品質保証へ訂正した。 |
| 問15 | [Scrum Guide 2020](https://scrumguides.org/scrum-guide.html) のThe Sprint、Developers、Sprint Backlog。計画の更新、ゴールの維持、品質を下げないこと、プロダクトオーナーの責任を確認。 |
| 問16 | [ISO/IEC 33002:2015の公式概要](https://www.iso.org/standard/54176.html)。客観的・一貫的・反復可能なプロセスアセスメントの要求であることを確認。 |
| 問17・19 | [Redmine公式機能一覧](https://www.redmine.org/projects/redmine/wiki/Features) の課題追跡・柔軟なワークフローを確認。 |
| 問21 | [公正取引委員会の下請法テキスト](https://www.jftc.go.jp/houdou/panfu_files/shitauketextbook.pdf) の情報成果物のやり直しに関するQ&A。下請事業者に責任があり、支払期日前に不具合が判明する設問条件と、やり直し後の受領日を照合。 |
| 問21の現制度注記 | [公正取引委員会・取適法](https://www.jftc.go.jp/toriteki/) と[改正リーフレット](https://www.jftc.go.jp/file/toriteki_leaflet.pdf) で2026-01-01施行・名称変更を確認。 |
| 問22 | 消費者庁の[事業者の対応事項](https://www.caa.go.jp/policies/policy/consumer_partnerships/whisleblower_protection_system/detail/private)、[教育・周知のQ&A](https://www.caa.go.jp/policies/policy/consumer_partnerships/whisleblower_protection_system/faq/faq_007)、[匿名通報などのQ&A](https://www.caa.go.jp/policies/policy/consumer_partnerships/whisleblower_protection_system/faq/faq_009/)。 |
| 問23 | [CISAの技術勧告](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-278a) のMulti-Factor Authentication Request Generation（T1621）。プッシュ要求の反復によって承認を誘う点を確認。 |
| 問25 | [RFC 3227 §2.1](https://www.rfc-editor.org/rfc/rfc3227.txt) のOrder of Volatility。ルーティング情報、ディスク、遠隔ログ、保存媒体の相対的な順序を確認。 |

上記以外は、原本の問・選択肢・公式正解と照合し、用語と理由を独自に説明した。専門家による第三者レビューは未実施。初回25問の画面・解説レビューは2026-10-21に利用者が承認済み。

## 残り16回400問の照合

確認日：2026-10-21。試作レビューは同日に利用者が承認済み。平成21年度～令和6年度の16回を追加した。各回の問題PDF・解答PDFのURLとSHA-256は `sources/manifest.json`、切出し領域は年度別の `extraction.json`、問ごとの結果は `content-checks.json` に記録している。

全400問の切出し画像を年度別に表示し、設問・全四肢・図表・注記の欠けを目視確認した。問題JSONの補助要約と解説を別工程で再読した。平成22年度問17のクラス図、令和2年度／令和5年度問25の肢の順序、平成24年度問1の人数に関する肢などを当該年度の原本に合わせて訂正した。平成28年度問2の公式な不成立注記は、正解をnullにして採点対象外としている。

一部の共通出題は、利用者指定の [system-arch-training](https://github.com/rabut001/system-arch-training) の問題テキスト・解説を参考にし、本アプリ用に編集・照合した。参照した問題IDは問ごとの照合記録に残している。解説はIPAの公式解説ではない。作成者による再確認であり、専門家による第三者レビューやJISの有償原文の全文照合とは区別する。

### 計算・図表の再確認

- 平成21年度問1：150−24−27−15＝84件。問4：160＝4×25＋増員数×（25−10）から4人。
- 平成25年度問8：最長経路17日。要員2人での実行可能な開始・終了も確認。
- 平成26年度問8：初期の経路11／13／15日。短縮可能日数の組合せを別列挙し、Bを3日、Aを1日短縮する11万円が最小と確認。問16：埋込欠陥を除いた残存40個。
- 平成29年度問10・令和5年度問7：先行制約と資源占有区間を読み、開始時点の整数列挙でも最小16日を確認。
- 令和6年度問6：同様の資源制約を別列挙して最小19日を確認。
- PCレンタルの再出題：前後の準備・返却月を含む台数を月ごとに計算。合計94台月×5千円＝470千円。
- 工程モデルの再出題：228÷0.57＝400日、残作業400×（0.11÷2＋0.11＋0.21）＝150日。
- 生産性の再出題：規模÷工数を式変形し、規模^−0.12。三工程の合成生産性は1÷（1/X＋1/Y＋1/Z）。
- 連絡工数の再出題：45組×4人時＝180人時／週、開発220人時／週、倍率20÷11≒1.8。令和5年度だけの端数処理条件を他年度へ持ち込まないよう訂正。
- 令和3年度問8：増員1,250万円−離脱で減る800万円＝450万円。問18ほか加重評価：3／1／7／−13。
- 令和4年度問9：クリティカルパス60日、Eの全体余裕30日。問10：新41、旧46の期待値。問12：レビュー密度4.33／5／4／4.6。問19：ROI 150／100／87.5／175%。
- 令和5年度問5：EAC＝100÷（40÷60）＝150。問6：11日のチェーン＋2日のバッファ＝13日。問10：45FP。問18ほかTCO：161／172／153／157百万円。
- 令和6年度問4：TCPI＝（100−34）÷（100−40）＝1.1。問5ほか：Hの最遅開始21日。問9ほか：工数約49.66人月、生産性約0.2。

### 補足に用いた一次資料

規格の版・用語・正解は出題時点を尊重する。以下は対応する概念や制度上の注意点の確認に用いた資料であり、全規格・全条文を全文監査したという意味ではない。

| 対象 | 資料と確認範囲 |
| --- | --- |
| JISの旧名称 | [経済産業省・JIS法](https://www.meti.go.jp/policy/economy/hyojun-kijun/jisho/jis.html)：2019年7月の産業標準化法・日本産業規格への名称変更。平成25年度問23は出題時の名称を維持。 |
| 下請法と現制度 | [公取委・取適法特設ページ](https://www.jftc.go.jp/toriteki_2025/)、[2025年7月説明資料](https://cms03.jftc.go.jp/houdou/teirei/2025/jul_sep/files/250716_teirei.pdf)：2026年施行の名称や振込手数料控除の変更。平成21年度問24、平成26年度問22、平成31年度問22は当時の制度との違いを注記。 |
| 下請取引の書面 | [公取委・下請法の概要](https://www.jftc.go.jp/houdou/panfu_files/shittemamotte.pdf)：発注書面、内容未定事項と補充書面。現行法と過去問の扱いを区別。 |
| 個人情報 | [個人情報保護委員会・通則編](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/)、[Q1-6](https://www.ppc.go.jp/all_faq_index/faq1-q1-6/)：生存する個人、公開情報・外国人の情報、死者の情報と遺族の個人情報。 |
| 労働者派遣 | 厚労省の[派遣先の措置](https://www.mhlw.go.jp/general/seido/anteikyoku/haken/04.html)・[派遣先指針](https://www.mhlw.go.jp/general/seido/anteikyoku/haken/05.html)：就業条件、責任者、通常の派遣の事前面接等の制限。 |
| 就業規則 | [厚労省・就業規則Q3](https://www.startup-roudou.mhlw.go.jp/qa/zigyonushi/syuugyoukisoku/q3.html)：常時10人以上、意見聴取、届出と周知。 |
| 36協定 | [厚労省・36協定](https://www.check-roudou.mhlw.go.jp/saburoku/)：労使協定・届出と労働時間の上限。 |
| 営業秘密 | [経済産業省・営業秘密](https://www.meti.go.jp/policy/economy/chizai/chiteki/trade-secret.html)：秘密管理性・有用性・非公知性の三要件。 |
| 広告メール | [消費者庁・特定電子メール法資料](https://www.caa.go.jp/policies/policy/consumer_transaction/specifed_email/pdf/specifed_email_180709_0001.pdf)：同意、表示、例外を区別。 |
| 著作権 | [文化庁・2018年改正](https://www.bunka.go.jp/seisaku/chosakuken/hokaisei/kantaiheiyo_chosakuken/1411890.html)：保護期間延長。[委託開発の契約資料](https://www.bunka.go.jp/chosakuken/keiyaku_manual/2_3_2A.html)：対価の支払と権利移転を区別。過去問の当時の制度を保持。 |
| 製造物責任 | [消費者庁・PL法Q&A](https://www.caa.go.jp/policies/policy/consumer_safety/other/pl_qa.html)：ソフトウェア単体と組込み製品の区別。 |
| プロバイダ責任 | [政府広報・インターネット上の人権侵害](https://www.gov-online.go.jp/article/200808/entry-9260.html)：発信者・被害者との免責要件、現名称。[福岡県の制度説明](https://www.pref.fukuoka.lg.jp/contents/johoryutuplatform.html)：2025年4月施行。令和5年度問21に注記。 |
| OECD原則 | [OECD Privacy Principles](https://www.oecd.org/en/topics/privacy-principles.html)、[法的文書](https://legalinstruments.oecd.org/public/doc/114/body-text.en.html)：データ内容・目的明確化・利用制限・責任等の区別。 |
| ソフトウェアと特許 | [特許庁の審査基準](https://www.jpo.go.jp/system/laws/rule/guideline/patent/tukujitu_kijun/ht/03_0100.html)、[ソフトウェア関連発明の資料](https://www.jpo.go.jp/system/laws/rule/guideline/patent/document/cs_shinsa/cs_shinsa.pdf)：自然法則とソフトウェアによる具体的実現。 |
| 共通フレーム・モデル取引 | [IPA共通フレームのアーカイブ](https://www.ipa.go.jp/archive/digital/iot-en-ci/process/ent02-a.html)、[経産省モデル契約の追補](https://www.meti.go.jp/policy/it_policy/softseibi/model_tuiho/model_tuiho.pdf)：工程・発注者と受注者の役割、請負・準委任の区別。 |
| アジャイル | [宣言](https://agilemanifesto.org/iso/ja/manifesto.html)・[原則](https://agilemanifesto.org/iso/ja/principles.html)：短い反復、変化への対応、動くソフトウェアの重視。 |
| スパイラル | [SEIの解説](https://www.sei.cmu.edu/library/spiral-development-experience-principles-and-refinements-spiral-development-workshop-february-9-2000/)：反復とリスクへの対応。 |
| CMMI | [ISACAのモデル概要](https://www.isaca.org/resources/reference-guide/cmmi-model-quick-reference-guide)：プロセス改善のモデルとしての位置付け。過去問のモデルの版を現行版に置き換えてはいない。 |
| CSIRT | [JPCERT/CCの運用段階資料](https://www.jpcert.or.jp/csirt_material/operation_phase.html)：組織内での対応体制と活動。 |
| CVSS | [FIRST CVSS v3.1](https://www.first.org/cvss/v3-1/specification-document)：0～10の尺度と基本・現状・環境評価。過去問の版と現行版を区別。 |
| SAML | [OASIS SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)：認証等の情報を伝達するアサーション。 |
| AI契約 | [経産省AI・データ契約ガイドライン1.1版](https://www.meti.go.jp/press/2019/12/20191209001/20191209001-1.pdf)：当時の段階的な開発と役割の考え方。現行のAI事業者ガイドラインと同一資料として扱わない。 |
| 環境関連 | [環境省・グリーン購入法](https://www.env.go.jp/policy/hozen/green/g-law/)：環境物品等。[EU・RoHS](https://environment.ec.europa.eu/topics/waste-and-recycling/rohs-directive_en)：特定有害物質の制限。[国際エネルギースタープログラム](https://www.energystar.go.jp/)：省エネルギー基準。[国連SDGs](https://sdgs.un.org/goals)：17の目標。 |

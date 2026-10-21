import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CHOICES,
  fetchData,
  imageUrl,
  parseCatalog,
  parseExam,
  type Catalog,
  type Exam,
  type ExamSummary,
} from "./exam";
import {
  FILTERS,
  adjacentQuestion,
  answerLabel,
  browserStorage,
  clearAnswers,
  confirmAnswer,
  filteredQuestions,
  gradeAnswers,
  readProgress,
  saveProgress,
  score,
  selectAnswer,
  toggleChecked,
  type Filter,
  type Progress,
} from "./progress";

function useData<T>(path: string, parse: (value: unknown) => T, retry: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    fetchData(path)
      .then(parse)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "読み込みに失敗しました。",
          );
      });
    return () => {
      active = false;
    };
  }, [path, parse, retry]);
  return { data, error };
}

function Brand() {
  return (
    <a href="#/" className="brand" aria-label="年度一覧へ戻る">
      <span className="brand-mark" aria-hidden="true">
        PM
      </span>
      <span>
        プロジェクトマネージャ
        <span className="brand-sub">
          午前Ⅱ 演習 <span className="current-name">／ 現：科目A-2</span>
        </span>
      </span>
    </a>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <span>
        出典：
        <a
          href="https://www.ipa.go.jp/shiken/mondai-kaiotu/"
          target="_blank"
          rel="noreferrer"
        >
          IPAの過去問題 ↗
        </a>
      </span>
      <span>学習履歴はこのブラウザに保存されます。</span>
    </footer>
  );
}
function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="notice" role="status">
      {children}
    </p>
  );
}
function LoadState({ error, retry }: { error: string; retry: () => void }) {
  return (
    <main className="load-state" id="main" tabIndex={-1}>
      <h1>{error ? "読み込めませんでした" : "問題を読み込んでいます…"}</h1>
      {error && (
        <>
          <p role="alert">{error}</p>
          <button onClick={retry}>もう一度読み込む</button>
          <a href="#/">年度一覧へ戻る</a>
        </>
      )}
    </main>
  );
}

function ExamList({ catalog }: { catalog: Catalog }) {
  const storage = browserStorage();
  return (
    <>
      <main className="list-main" id="main" tabIndex={-1}>
        <div className="page-intro">
          <p className="eyebrow">過去問で、ひとつずつ。</p>
          <h1>学習する年度を選ぶ</h1>
          <p>
            問題を解いて、解説で確かめる。
            <br className="mobile-only" />
            前回の続きから、いつでも再開できます。
          </p>
        </div>
        {catalog.exams.length < catalog.totalPlanned && (
          <Notice>
            現在{catalog.exams.length}回・
            {catalog.exams.reduce((sum, exam) => sum + exam.questionCount, 0)}
            問を収録しています。全17回・425問へ展開中です。
          </Notice>
        )}
        <div className="list-section-heading">
          <h2>年度別の過去問題</h2>
          <span>
            {catalog.exams.length}回・
            {catalog.exams.reduce((sum, exam) => sum + exam.questionCount, 0)}問
            収録
          </span>
        </div>
        <ul className="exam-list">
          {catalog.exams.map((exam) => (
            <ExamRow key={exam.id} exam={exam} storage={storage} />
          ))}
        </ul>
        <div className="learning-note">
          <h2>自分のペースで、1問ずつ</h2>
          <p>
            ア〜エを選び、「結果を確認」で正答と解説を表示します。気になった問題にはチェックを付け、あとから見直せます。
          </p>
          <p>
            ログインは不要です。履歴はブラウザのデータを消すと失われます。解説は独自に作成したもので、IPAの公式解説ではありません。
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
function ExamRow({
  exam,
  storage,
}: {
  exam: ExamSummary;
  storage: ReturnType<typeof browserStorage>;
}) {
  const { progress } = readProgress(
    storage,
    exam.id,
    Array.from({ length: exam.questionCount }, (_, i) => i + 1),
    exam.excludedQuestionNos,
  );
  const gradableCount =
    exam.questionCount - (exam.excludedQuestionNos?.length ?? 0);
  const answered = Object.keys(progress.answers).length;
  const confirmed = Object.values(progress.answers).filter(
    (answer) => answer.confirmed,
  ).length;
  return (
    <li>
      <a href={`#/${exam.id}`} className="exam-card">
        <div className="exam-year" aria-hidden="true">
          {exam.year}
        </div>
        <div className="exam-info">
          <h3>{exam.title}</h3>
          <p>
            {exam.questionCount}問
            {gradableCount < exam.questionCount &&
              `（採点対象${gradableCount}問）`}{" "}
            <span className="dot">·</span>{" "}
            {answered
              ? `選択済み ${answered}問 ／ 確認済み ${confirmed}問`
              : "未学習"}
          </p>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="確認済みの問題"
            aria-valuemin={0}
            aria-valuemax={gradableCount}
            aria-valuenow={confirmed}
          >
            <span style={{ width: `${(confirmed / gradableCount) * 100}%` }} />
          </div>
        </div>
        <span className="exam-action">
          {answered || progress.currentNo > 1 ? "続きから" : "はじめる"}{" "}
          <span aria-hidden="true">→</span>
        </span>
      </a>
    </li>
  );
}

function Modal({
  title,
  onDismiss,
  children,
  wide = false,
}: {
  title: string;
  onDismiss: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    close.current?.focus();
    return () => {
      if (element?.open) element.close();
      returnFocus.current?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={wide ? "image-dialog" : ""}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          ref={close}
          className="icon-button"
          onClick={onDismiss}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

function Practice({ exam }: { exam: Exam }) {
  const storage = useRef(browserStorage());
  const initial = useRef(
    readProgress(
      storage.current,
      exam.id,
      exam.questions.map((q) => q.no),
      exam.excludedQuestionNos,
    ),
  );
  const [progress, setProgress] = useState<Progress>(initial.current.progress);
  const [storageFailed, setStorageFailed] = useState(
    initial.current.unavailable,
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [numbersOpen, setNumbersOpen] = useState(false);
  const [modal, setModal] = useState<"grade" | "clear" | "image" | null>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const resultSection = useRef<HTMLElement>(null);
  const resultRequested = useRef(false);
  const previousNo = useRef(progress.currentNo);
  const question =
    exam.questions.find((q) => q.no === progress.currentNo) ??
    exam.questions[0];
  const answer = progress.answers[question.no];
  const cancelled = question.answer === null;
  const confirmed = !cancelled && (answer?.confirmed ?? false);
  const isCorrect = answer?.choice === question.answer;
  const filtered = filteredQuestions(exam.questions, progress, filter);
  const before = adjacentQuestion(filtered, question.no, -1);
  const after = adjacentQuestion(filtered, question.no, 1);
  const result = score(exam.questions, progress);
  const gradableCount = exam.questions.filter((q) => q.answer !== null).length;
  const selectedCount = Object.keys(progress.answers).length;
  const draftCount = Object.values(progress.answers).filter(
    (a) => !a.confirmed,
  ).length;

  useEffect(() => {
    setStorageFailed(!saveProgress(storage.current, exam.id, progress));
  }, [exam.id, progress]);
  useEffect(() => {
    if (!resultRequested.current || !confirmed) return;
    resultRequested.current = false;
    if (window.matchMedia("(max-width: 767px)").matches) {
      resultSection.current?.focus({ preventScroll: true });
      resultSection.current?.scrollIntoView({ block: "start" });
    }
  }, [confirmed]);
  useEffect(() => {
    if (previousNo.current !== question.no) {
      previousNo.current = question.no;
      questionHeading.current?.focus({ preventScroll: true });
      questionHeading.current?.scrollIntoView({ block: "start" });
    }
  }, [question.no]);
  function moveTo(no: number) {
    if (exam.questions.some((q) => q.no === no))
      setProgress((current) => ({ ...current, currentNo: no }));
  }

  return (
    <>
      <main className="practice-main" id="main" tabIndex={-1}>
        <a href="#/" className="back-link">
          ← 年度一覧へ戻る
        </a>
        <div className="exam-heading">
          <div>
            <p className="eyebrow">プロジェクトマネージャ試験 午前Ⅱ</p>
            <h1>{exam.title}</h1>
          </div>
          <div className="score-card">
            <span>確認済みの正解率</span>
            <strong>{result.rate === null ? "—" : `${result.rate}%`}</strong>
            <small>
              {result.correct}問正解 / {result.confirmed}問確認済み
            </small>
          </div>
        </div>
        {storageFailed && (
          <Notice>
            このブラウザに履歴を保存できません。演習は続けられますが、画面を閉じると今回の回答が失われることがあります。
          </Notice>
        )}
        <section className="navigation-card" aria-label="問題の移動と絞り込み">
          <div className="navigation-top">
            <div className="overall-progress">
              <span>
                選択済み <strong>{selectedCount}</strong> / {gradableCount}問
              </span>
              <div className="progress-track" aria-hidden="true">
                <span
                  style={{
                    width: `${(result.confirmed / gradableCount) * 100}%`,
                  }}
                />
              </div>
            </div>
            <button
              className="number-toggle"
              aria-expanded={numbersOpen}
              aria-controls="question-numbers"
              onClick={() => setNumbersOpen(!numbersOpen)}
            >
              問題一覧 {numbersOpen ? "−" : "＋"}
            </button>
            <span className="navigation-legend desktop-only">
              ○ 正解　× 誤答　✓ チェック
            </span>
          </div>
          <div className="filter-row" role="group" aria-label="問題の絞り込み">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                aria-pressed={filter === item.value}
                className={filter === item.value ? "filter active" : "filter"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
                <span>
                  {
                    filteredQuestions(exam.questions, progress, item.value)
                      .length
                  }
                </span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="empty-filter" role="status">
              該当する問題はありません。
              <button className="text-button" onClick={() => setFilter("all")}>
                すべての問題を表示
              </button>
            </p>
          )}
          <nav
            id="question-numbers"
            className={`question-numbers ${numbersOpen ? "is-open" : ""}`}
            aria-label="問題番号"
          >
            {filtered.map((q) => {
              const record = progress.answers[q.no];
              const state =
                q.answer === null
                  ? "cancelled"
                  : record?.confirmed
                    ? record.choice === q.answer
                      ? "correct"
                      : "incorrect"
                    : record
                      ? "draft"
                      : "";
              return (
                <button
                  key={q.no}
                  className={`number ${state} ${q.no === question.no ? "current" : ""}`}
                  aria-label={answerLabel(q, progress)}
                  aria-current={q.no === question.no ? "step" : undefined}
                  onClick={() => moveTo(q.no)}
                >
                  <span>{q.no}</span>
                  <span className="number-marks" aria-hidden="true">
                    {q.answer === null
                      ? "−"
                      : record?.confirmed
                        ? record.choice === q.answer
                          ? "○"
                          : "×"
                        : ""}
                    {progress.checked.includes(q.no) ? " ✓" : ""}
                  </span>
                </button>
              );
            })}
          </nav>
        </section>

        <div className="practice-columns">
          <section className="question-card" aria-labelledby="question-title">
            <div className="question-heading">
              <h2 ref={questionHeading} tabIndex={-1} id="question-title">
                問 <span>{String(question.no).padStart(2, "0")}</span>
                <small>/ {exam.questionCount}</small>
              </h2>
              <label
                className={`check-label ${progress.checked.includes(question.no) ? "checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={progress.checked.includes(question.no)}
                  onChange={() =>
                    setProgress((current) =>
                      toggleChecked(current, question.no),
                    )
                  }
                />
                あとで見直す
              </label>
            </div>
            <img
              className="question-image"
              src={imageUrl(exam.id, question.image)}
              alt={`問${question.no}の問題文と選択肢。下に学習用の補助テキスト（要約）があります。`}
            />
            <div className="image-actions">
              <button className="text-button" onClick={() => setModal("image")}>
                ＋ 問題画像を拡大
              </button>
            </div>
            <details className="transcript">
              <summary>補助テキスト（要約）を読む</summary>
              <p className="muted">
                設問・選択肢を学習用に要約しています。原文・図表・厳密な条件は上の問題画像で確認してください。
              </p>
              <p>{question.stem}</p>
              {question.visuals.length > 0 && (
                <p className="muted">
                  図・表は上の問題画像を参照してください。
                </p>
              )}
              <dl>
                {CHOICES.map((choice) => (
                  <div key={choice}>
                    <dt>{choice}</dt>
                    <dd>{question.choices[choice]}</dd>
                  </div>
                ))}
              </dl>
            </details>
            <p className="question-source">
              出典：{exam.title} プロジェクトマネージャ試験 午前Ⅱ 問
              {question.no}
              <br />
              <a
                href={`${exam.sourcePdf}#page=${question.pdfPage}`}
                target="_blank"
                rel="noreferrer"
              >
                IPAの問題冊子（PDF） ↗
              </a>
            </p>
          </section>

          <section className="answer-card" aria-label="回答と解説">
            <div className="answer-top">
              <h2>回答を選ぶ</h2>
              <span>
                {cancelled
                  ? "採点対象外"
                  : confirmed
                    ? "確認済み"
                    : answer
                      ? "選択済み・未確認"
                      : "未回答"}
              </span>
            </div>
            <div className="answer-controls">
              <div className="choices" role="group" aria-label="回答の選択肢">
                {CHOICES.map((choice) => (
                  <button
                    key={choice}
                    className={
                      answer?.choice === choice ? "choice selected" : "choice"
                    }
                    aria-pressed={answer?.choice === choice}
                    disabled={confirmed || cancelled}
                    onClick={() =>
                      setProgress((current) =>
                        selectAnswer(current, question.no, choice),
                      )
                    }
                  >
                    {choice}
                    {answer?.choice === choice && (
                      <span aria-hidden="true">✓</span>
                    )}
                  </button>
                ))}
              </div>
              {!confirmed && !cancelled && (
                <button
                  className="primary confirm-button"
                  disabled={!answer}
                  onClick={() => {
                    resultRequested.current = true;
                    setProgress((current) =>
                      confirmAnswer(current, question.no),
                    );
                  }}
                >
                  結果を確認
                </button>
              )}
            </div>
            {(confirmed || cancelled) && (
              <section
                ref={resultSection}
                tabIndex={-1}
                className="explanation"
                aria-live="polite"
                aria-label="採点結果と解説"
              >
                <div
                  className={`result-banner ${cancelled ? "cancelled" : isCorrect ? "correct" : "incorrect"}`}
                >
                  <strong>
                    {cancelled
                      ? "IPAにより不成立"
                      : isCorrect
                        ? "○ 正解です"
                        : "× 不正解です"}
                  </strong>
                  <span>
                    {cancelled ? (
                      "採点対象外"
                    ) : (
                      <>
                        正答：<b>{question.answer}</b>
                      </>
                    )}
                  </span>
                </div>
                {cancelled && <Notice>{question.invalidReason}</Notice>}
                <h3>解説</h3>
                <p className="explanation-summary">
                  {question.explanation.summary}
                </p>
                {question.explanation.points.map((point, index) => (
                  <p key={index} className="explanation-point">
                    {point}
                  </p>
                ))}
                {question.explanation.choices && (
                  <dl className="choice-explanations">
                    {CHOICES.map((choice) => (
                      <div
                        key={choice}
                        className={
                          choice === question.answer ? "right-choice" : ""
                        }
                      >
                        <dt>
                          {choice}
                          <span>
                            {choice === question.answer ? "正答" : ""}
                          </span>
                        </dt>
                        <dd>{question.explanation.choices![choice]}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="official-note">
                  この解説は独自に作成したもので、IPAの公式解説ではありません。
                </p>
              </section>
            )}
            <div className="pager">
              <button
                disabled={before === null}
                onClick={() => before !== null && moveTo(before)}
              >
                ← 前の問題
              </button>
              <button
                disabled={after === null}
                onClick={() => after !== null && moveTo(after)}
              >
                次の問題 →
              </button>
            </div>
            {filter !== "all" && (
              <p className="filter-help">
                「{FILTERS.find((item) => item.value === filter)?.label}
                」の問題へ移動します。
              </p>
            )}
            <details className="session-actions">
              <summary>この年度の回答をまとめて操作</summary>
              <button
                disabled={draftCount === 0}
                onClick={() => setModal("grade")}
              >
                一括採点 <span>未確認 {draftCount}問</span>
              </button>
              <button className="danger-text" onClick={() => setModal("clear")}>
                回答をすべてクリア
              </button>
              <p>クリアしても「あとで見直す」のチェックは残ります。</p>
            </details>
          </section>
        </div>
      </main>
      <Footer />
      {modal === "image" && (
        <Modal
          title={`問${question.no}：問題画像の拡大`}
          onDismiss={() => setModal(null)}
          wide
        >
          <p className="muted">画像は横・縦にスクロールして確認できます。</p>
          <div className="zoom-scroll">
            <img
              src={imageUrl(exam.id, question.image)}
              alt={`問${question.no}の拡大画像`}
            />
          </div>
        </Modal>
      )}
      {modal === "grade" && (
        <Modal
          title="選択済みの問題を一括採点"
          onDismiss={() => setModal(null)}
        >
          <p>
            選択済み・未確認の{draftCount}
            問を採点します。採点した回答は固定されます。未回答の問題は採点しません。
          </p>
          <div className="modal-actions">
            <button onClick={() => setModal(null)}>中止</button>
            <button
              className="primary"
              onClick={() => {
                setProgress((current) => gradeAnswers(current));
                setModal(null);
              }}
            >
              採点する
            </button>
          </div>
        </Modal>
      )}
      {modal === "clear" && (
        <Modal
          title="この年度の回答を消しますか？"
          onDismiss={() => setModal(null)}
        >
          <p>
            {exam.title}
            の確認済みの回答と、未確認の選択をすべて消します。「あとで見直す」のチェックと、ほかの年度の履歴は残ります。
          </p>
          <div className="modal-actions">
            <button onClick={() => setModal(null)}>中止</button>
            <button
              className="danger"
              onClick={() => {
                setProgress((current) => clearAnswers(current));
                setFilter("all");
                setModal(null);
              }}
            >
              消してやり直す
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ExamScreen({ id }: { id: string }) {
  const [retry, setRetry] = useState(0);
  const { data, error } = useData(`${id}/questions.json`, parseExam, retry);
  if (!data)
    return (
      <LoadState error={error} retry={() => setRetry((value) => value + 1)} />
    );
  if (data.id !== id)
    return (
      <LoadState
        error="年度と問題データが一致しません。"
        retry={() => setRetry((value) => value + 1)}
      />
    );
  return <Practice exam={data} />;
}
export function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [retry, setRetry] = useState(0);
  const { data: catalog, error } = useData("exams.json", parseCatalog, retry);
  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(1).replace(/^\/+|\/+$/g, ""));
  } catch {
    id = "invalid";
  }
  const valid = catalog?.exams.some((exam) => exam.id === id);
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.scrollIntoView();
          document.getElementById("main")?.focus();
        }}
      >
        本文へ移動
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <span className="header-caption">1問ずつ、理解を深める。</span>
        </div>
      </header>
      {!catalog ? (
        <LoadState error={error} retry={() => setRetry((value) => value + 1)} />
      ) : !id ? (
        <ExamList catalog={catalog} />
      ) : valid ? (
        <ExamScreen key={id} id={id} />
      ) : (
        <main className="load-state" id="main" tabIndex={-1}>
          <h1>この年度の問題は見つかりませんでした</h1>
          <p>年度一覧から学習する回を選んでください。</p>
          <a className="button primary" href="#/">
            年度一覧へ戻る
          </a>
        </main>
      )}
    </>
  );
}

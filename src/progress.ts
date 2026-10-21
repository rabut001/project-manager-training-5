import { isChoice, type Choice, type Question } from "./exam";

export type Answer = { choice: Choice; confirmed: boolean };
export type Progress = {
  version: 1;
  currentNo: number;
  answers: Record<number, Answer>;
  checked: number[];
};
export type Filter = "all" | "unanswered" | "incorrect" | "checked";
export const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "unanswered", label: "未回答" },
  { value: "incorrect", label: "誤答" },
  { value: "checked", label: "チェック済み" },
];
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export function storageKey(examId: string): string {
  return `pm-am2:v1:${examId}`;
}
export function emptyProgress(): Progress {
  return { version: 1, currentNo: 1, answers: {}, checked: [] };
}
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
export function readProgress(
  storage: StorageLike | null,
  examId: string,
  questionNos: readonly number[],
  excludedQuestionNos: readonly number[] = [],
): { progress: Progress; unavailable: boolean } {
  if (!storage) return { progress: emptyProgress(), unavailable: true };
  let raw: string | null;
  try {
    raw = storage.getItem(storageKey(examId));
  } catch {
    return { progress: emptyProgress(), unavailable: true };
  }
  const progress = emptyProgress();
  if (raw === null) return { progress, unavailable: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object")
      return { progress, unavailable: false };
    const data = parsed as Record<string, unknown>;
    if (data.version !== 1) return { progress, unavailable: false };
    const valid = new Set(questionNos);
    if (typeof data.currentNo === "number" && valid.has(data.currentNo))
      progress.currentNo = data.currentNo;
    if (data.answers && typeof data.answers === "object") {
      for (const [key, value] of Object.entries(data.answers)) {
        const no = Number(key);
        if (
          !valid.has(no) ||
          excludedQuestionNos.includes(no) ||
          !value ||
          typeof value !== "object"
        )
          continue;
        const answer = value as Record<string, unknown>;
        if (isChoice(answer.choice) && typeof answer.confirmed === "boolean") {
          progress.answers[no] = {
            choice: answer.choice,
            confirmed: answer.confirmed,
          };
        }
      }
    }
    if (Array.isArray(data.checked)) {
      progress.checked = [
        ...new Set(
          data.checked.filter(
            (no): no is number => typeof no === "number" && valid.has(no),
          ),
        ),
      ].sort((a, b) => a - b);
    }
  } catch {
    /* 壊れたJSONも演習を妨げない。 */
  }
  return { progress, unavailable: false };
}
export function saveProgress(
  storage: StorageLike | null,
  examId: string,
  progress: Progress,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(storageKey(examId), JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
export function selectAnswer(
  progress: Progress,
  no: number,
  choice: Choice,
): Progress {
  if (progress.answers[no]?.confirmed) return progress;
  return {
    ...progress,
    answers: { ...progress.answers, [no]: { choice, confirmed: false } },
  };
}
export function confirmAnswer(progress: Progress, no: number): Progress {
  const answer = progress.answers[no];
  if (!answer || answer.confirmed) return progress;
  return {
    ...progress,
    answers: { ...progress.answers, [no]: { ...answer, confirmed: true } },
  };
}
export function gradeAnswers(progress: Progress): Progress {
  return {
    ...progress,
    answers: Object.fromEntries(
      Object.entries(progress.answers).map(([no, answer]) => [
        no,
        { ...answer, confirmed: true },
      ]),
    ),
  };
}
export function clearAnswers(progress: Progress): Progress {
  return { ...emptyProgress(), checked: [...progress.checked] };
}
export function toggleChecked(progress: Progress, no: number): Progress {
  return {
    ...progress,
    checked: progress.checked.includes(no)
      ? progress.checked.filter((value) => value !== no)
      : [...progress.checked, no].sort((a, b) => a - b),
  };
}
export function score(
  questions: readonly Pick<Question, "no" | "answer">[],
  progress: Progress,
) {
  const confirmed = questions.filter(
    (q) => q.answer !== null && progress.answers[q.no]?.confirmed,
  );
  const correct = confirmed.filter(
    (q) => progress.answers[q.no].choice === q.answer,
  ).length;
  return {
    confirmed: confirmed.length,
    correct,
    rate: confirmed.length
      ? Math.round((correct / confirmed.length) * 100)
      : null,
  };
}
export function filteredQuestions<T extends Pick<Question, "no" | "answer">>(
  questions: readonly T[],
  progress: Progress,
  filter: Filter,
): T[] {
  return questions.filter((q) => {
    const answer = progress.answers[q.no];
    if (filter === "unanswered") return q.answer !== null && !answer;
    if (filter === "incorrect")
      return (
        q.answer !== null && answer?.confirmed && answer.choice !== q.answer
      );
    if (filter === "checked") return progress.checked.includes(q.no);
    return true;
  });
}
export function adjacentQuestion(
  questions: readonly Pick<Question, "no">[],
  currentNo: number,
  direction: -1 | 1,
): number | null {
  const candidates = questions.filter((q) =>
    direction === -1 ? q.no < currentNo : q.no > currentNo,
  );
  return (direction === -1 ? candidates.at(-1) : candidates.at(0))?.no ?? null;
}
export function answerLabel(
  question: Pick<Question, "no" | "answer">,
  progress: Progress,
): string {
  const answer = progress.answers[question.no];
  const state =
    question.answer === null
      ? "IPAにより不成立・採点対象外"
      : !answer
        ? "未回答"
        : !answer.confirmed
          ? "選択済み・未確認"
          : answer.choice === question.answer
            ? "正解"
            : "誤答";
  return `問${question.no}、${state}${progress.checked.includes(question.no) ? "、チェック済み" : ""}`;
}

import { describe, expect, it } from "vitest";
import {
  adjacentQuestion,
  clearAnswers,
  confirmAnswer,
  emptyProgress,
  filteredQuestions,
  gradeAnswers,
  readProgress,
  saveProgress,
  score,
  selectAnswer,
  storageKey,
  toggleChecked,
  type StorageLike,
} from "../src/progress";

const questions = [
  { no: 1, answer: "エ" as const },
  { no: 2, answer: "イ" as const },
  { no: 3, answer: "ア" as const },
];
function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("採点と回答状態", () => {
  it("不成立問題は採点・未回答・誤答から除き、チェックと閲覧を残す", () => {
    const mixed = [...questions, { no: 4, answer: null }];
    let progress = gradeAnswers(selectAnswer(selectAnswer(emptyProgress(), 1, "エ"), 4, "ア"));
    progress = toggleChecked(progress, 4);
    expect(score(mixed, progress)).toEqual({ confirmed: 1, correct: 1, rate: 100 });
    expect(filteredQuestions(mixed, emptyProgress(), "unanswered").map(q => q.no)).toEqual([1, 2, 3]);
    expect(filteredQuestions(mixed, progress, "incorrect")).toEqual([]);
    expect(filteredQuestions(mixed, progress, "checked").map(q => q.no)).toEqual([4]);
    const storage = memoryStorage();
    saveProgress(storage, "exam", { ...progress, currentNo: 4 });
    const restored = readProgress(storage, "exam", [1, 2, 3, 4], [4]).progress;
    expect(restored.answers[4]).toBeUndefined();
    expect(restored.currentNo).toBe(4);
    expect(restored.checked).toEqual([4]);
  });
  it("結果確認までは選び直せ、確認後は固定される", () => {
    let progress = selectAnswer(emptyProgress(), 1, "ア");
    progress = selectAnswer(progress, 1, "エ");
    expect(progress.answers[1]).toEqual({ choice: "エ", confirmed: false });
    expect(score(questions, progress)).toEqual({
      confirmed: 0,
      correct: 0,
      rate: null,
    });
    progress = confirmAnswer(progress, 1);
    expect(selectAnswer(progress, 1, "イ")).toEqual(progress);
    expect(score(questions, progress)).toEqual({
      confirmed: 1,
      correct: 1,
      rate: 100,
    });
  });
  it("未回答は確定せず、一括採点でも正解率の分母に入らない", () => {
    let progress = selectAnswer(emptyProgress(), 1, "エ");
    progress = selectAnswer(progress, 2, "ア");
    progress = toggleChecked(progress, 3);
    expect(confirmAnswer(progress, 3)).toEqual(progress);
    progress = gradeAnswers(progress);
    expect(progress.answers[3]).toBeUndefined();
    expect(progress.checked).toEqual([3]);
    expect(score(questions, progress)).toEqual({
      confirmed: 2,
      correct: 1,
      rate: 50,
    });
  });
  it("チェックの付け外しは確定済みの回答を変えない", () => {
    const progress = confirmAnswer(selectAnswer(emptyProgress(), 1, "エ"), 1);
    const checked = toggleChecked(progress, 1);
    expect(checked.answers).toEqual(progress.answers);
    expect(toggleChecked(checked, 1)).toEqual(progress);
  });
  it("回答クリアは問1へ戻り、チェックを残す", () => {
    const progress = {
      ...toggleChecked(gradeAnswers(selectAnswer(emptyProgress(), 2, "イ")), 3),
      currentNo: 2,
    };
    expect(clearAnswers(progress)).toEqual({
      ...emptyProgress(),
      checked: [3],
    });
  });
});

describe("保存と復元", () => {
  it("年度を分離し、未確定・確定・現在問・チェックを復元する", () => {
    const storage = memoryStorage();
    let progress = confirmAnswer(selectAnswer(emptyProgress(), 1, "エ"), 1);
    progress = {
      ...toggleChecked(selectAnswer(progress, 2, "イ"), 3),
      currentNo: 2,
    };
    expect(saveProgress(storage, "2025-r07-aki", progress)).toBe(true);
    expect(readProgress(storage, "2025-r07-aki", [1, 2, 3]).progress).toEqual(
      progress,
    );
    expect(readProgress(storage, "2024-r06-aki", [1, 2, 3]).progress).toEqual(
      emptyProgress(),
    );
    expect(storageKey("2025-r07-aki")).toBe("pm-am2:v1:2025-r07-aki");
  });
  it.each(["{broken", "null", "[]", '{"version":2}'])(
    "壊れた保存 %s で起動が止まらない",
    (raw) => {
      const storage = memoryStorage();
      storage.setItem(storageKey("exam"), raw);
      expect(readProgress(storage, "exam", [1, 2, 3]).progress).toEqual(
        emptyProgress(),
      );
    },
  );
  it("不正な回答、存在しない問、重複チェックだけを除去する", () => {
    const storage = memoryStorage();
    storage.setItem(
      storageKey("exam"),
      JSON.stringify({
        version: 1,
        currentNo: 99,
        answers: {
          1: { choice: "エ", confirmed: true },
          2: { choice: "X", confirmed: false },
          3: { choice: "イ", confirmed: "yes" },
          99: { choice: "ア", confirmed: true },
        },
        checked: [2, 2, 99, "1", null],
      }),
    );
    expect(readProgress(storage, "exam", [1, 2, 3]).progress).toEqual({
      ...emptyProgress(),
      answers: { 1: { choice: "エ", confirmed: true } },
      checked: [2],
    });
  });
  it("保存領域の拒否と容量不足を扱う", () => {
    const unavailable = {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("quota");
      },
    };
    expect(readProgress(unavailable, "exam", [1]).unavailable).toBe(true);
    expect(saveProgress(unavailable, "exam", emptyProgress())).toBe(false);
    expect(readProgress(null, "exam", [1]).unavailable).toBe(true);
    expect(saveProgress(null, "exam", emptyProgress())).toBe(false);
  });
  it("正解が訂正された場合は問題データから正解率を再計算する", () => {
    const progress = confirmAnswer(selectAnswer(emptyProgress(), 1, "エ"), 1);
    expect(score([{ no: 1, answer: "ア" }], progress).rate).toBe(0);
  });
});

describe("絞り込みと移動", () => {
  it("未回答と選択済み未確認を区別する", () => {
    let progress = confirmAnswer(selectAnswer(emptyProgress(), 1, "ア"), 1);
    progress = toggleChecked(selectAnswer(progress, 2, "イ"), 3);
    expect(
      filteredQuestions(questions, progress, "unanswered").map((q) => q.no),
    ).toEqual([3]);
    expect(
      filteredQuestions(questions, progress, "incorrect").map((q) => q.no),
    ).toEqual([1]);
    expect(
      filteredQuestions(questions, progress, "checked").map((q) => q.no),
    ).toEqual([3]);
  });
  it("現在問が絞り込みから外れても、前後の該当問へ移れる", () => {
    const visible = [{ no: 2 }, { no: 4 }, { no: 7 }];
    expect(adjacentQuestion(visible, 3, -1)).toBe(2);
    expect(adjacentQuestion(visible, 3, 1)).toBe(4);
    expect(adjacentQuestion(visible, 2, -1)).toBeNull();
    expect(adjacentQuestion([], 1, 1)).toBeNull();
  });
});

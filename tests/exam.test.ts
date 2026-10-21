import { describe, expect, it } from "vitest";
import { parseCatalog, parseExam } from "../src/exam";
import exam from "../public/data/2025-r07-aki/questions.json";
import catalog from "../public/data/exams.json";
import cancelledExam from "../public/data/2016-h28-haru/questions.json";

describe("公開データの読み込み", () => {
  it("不成立の公式状態を保持し、理由や一覧の欠落を拒否する", () => {
    expect(parseExam(cancelledExam).questions[1].answer).toBeNull();
    const missingReason = structuredClone(cancelledExam);
    missingReason.questions[1].invalidReason = "";
    expect(() => parseExam(missingReason)).toThrow();
    const missingIndex = { ...cancelledExam, excludedQuestionNos: [] };
    expect(() => parseExam(missingIndex)).toThrow();
  });
  it("実際の25問と一覧を読み込める", () => {
    expect(parseExam(exam).questions).toHaveLength(25);
    expect(parseCatalog(catalog).exams[0].id).toBe(exam.id);
  });
  it("欠番や重複番号、非正規の画像パスを拒否する", () => {
    const changed = structuredClone(exam);
    changed.questions[1].no = 1;
    expect(() => parseExam(changed)).toThrow();
    changed.questions[1].no = 2;
    changed.questions[1].image = "../questions.pdf";
    expect(() => parseExam(changed)).toThrow();
  });
  it("欠けた解説や不正な回答データを拒否する", () => {
    const changed: Record<string, unknown> = structuredClone(exam);
    const questions = changed.questions as Record<string, unknown>[];
    questions[0].answer = "オ";
    expect(() => parseExam(changed)).toThrow();
    questions[0].answer = "エ";
    questions[0].explanation = { summary: "説明", points: [123] };
    expect(() => parseExam(changed)).toThrow();
  });
});

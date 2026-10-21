export const CHOICES = ["ア", "イ", "ウ", "エ"] as const;
export type Choice = (typeof CHOICES)[number];
export type ExamSummary = {
  id: string;
  title: string;
  year: number;
  questionCount: number;
  excludedQuestionNos?: number[];
  sourcePage: string;
};
export type Question = {
  no: number;
  answer: Choice | null;
  invalidReason?: string;
  image: string;
  stem: string;
  choices: Record<Choice, string>;
  visuals: ("figure" | "table" | "image")[];
  pdfPage: number;
  explanation: {
    summary: string;
    points: string[];
    choices?: Record<Choice, string>;
  };
};
export type Exam = ExamSummary & { sourcePdf: string; questions: Question[] };
export type Catalog = { totalPlanned: number; exams: ExamSummary[] };

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
export function isChoice(value: unknown): value is Choice {
  return CHOICES.some((choice) => choice === value);
}
function summary(value: unknown): value is ExamSummary {
  return (
    object(value) &&
    typeof value.id === "string" &&
    /^[a-z0-9-]+$/.test(value.id) &&
    typeof value.title === "string" &&
    typeof value.year === "number" &&
    value.questionCount === 25 &&
    (value.excludedQuestionNos === undefined ||
      (Array.isArray(value.excludedQuestionNos) &&
        new Set(value.excludedQuestionNos).size ===
          value.excludedQuestionNos.length &&
        value.excludedQuestionNos.every(
          (no) => Number.isInteger(no) && no >= 1 && no <= 25,
        ))) &&
    typeof value.sourcePage === "string"
  );
}
export function parseCatalog(value: unknown): Catalog {
  if (
    !object(value) ||
    typeof value.totalPlanned !== "number" ||
    !Array.isArray(value.exams) ||
    !value.exams.length ||
    !value.exams.every(summary) ||
    new Set(value.exams.map((exam) => exam.id)).size !== value.exams.length
  ) {
    throw new Error("年度一覧の形式が正しくありません。");
  }
  return { totalPlanned: value.totalPlanned, exams: value.exams };
}
export function parseExam(value: unknown): Exam {
  if (!object(value) || !summary(value)) {
    throw new Error("問題データの形式が正しくありません。");
  }
  const data = value as unknown as Record<string, unknown>;
  if (
    typeof data.sourcePdf !== "string" ||
    !Array.isArray(data.questions) ||
    data.questions.length !== 25
  ) {
    throw new Error("問題データの形式が正しくありません。");
  }
  for (const [index, question] of data.questions.entries()) {
    if (
      !object(question) ||
      question.no !== index + 1 ||
      !(
        isChoice(question.answer) ||
        (question.answer === null &&
          typeof question.invalidReason === "string" &&
          question.invalidReason.length > 0)
      ) ||
      typeof question.image !== "string" ||
      !/^q\d{2}\.png$/.test(question.image) ||
      typeof question.stem !== "string" ||
      !object(question.choices) ||
      !CHOICES.every(
        (choice) =>
          typeof (question.choices as Record<string, unknown>)[choice] ===
          "string",
      ) ||
      !Array.isArray(question.visuals) ||
      !question.visuals.every((v) =>
        ["figure", "table", "image"].includes(v),
      ) ||
      !Number.isInteger(question.pdfPage) ||
      (question.pdfPage as number) < 1 ||
      !object(question.explanation) ||
      typeof question.explanation.summary !== "string" ||
      !Array.isArray(question.explanation.points) ||
      !question.explanation.points.every((p) => typeof p === "string") ||
      (question.explanation.choices !== undefined &&
        (!object(question.explanation.choices) ||
          !CHOICES.every(
            (choice) =>
              typeof (question.explanation as Question["explanation"])
                .choices?.[choice] === "string",
          )))
    ) {
      throw new Error(`問${index + 1}のデータの形式が正しくありません。`);
    }
  }
  const excluded = (data.questions as Question[])
    .filter((q) => q.answer === null)
    .map((q) => q.no);
  if (
    JSON.stringify(excluded) !== JSON.stringify(value.excludedQuestionNos ?? [])
  ) {
    throw new Error("採点対象外の問題一覧が一致しません。");
  }
  return value as unknown as Exam;
}

export async function fetchData(path: string): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`);
  if (!response.ok)
    throw new Error(
      "問題データを読み込めませんでした。通信状況を確認して再試行してください。",
    );
  return response.json();
}
export function imageUrl(examId: string, image: string): string {
  return `${import.meta.env.BASE_URL}data/${examId}/${image}`;
}

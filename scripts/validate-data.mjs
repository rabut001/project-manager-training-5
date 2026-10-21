import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
const catalog = await json("public/data/exams.json");
const manifest = await json("sources/manifest.json");
const extractions = await json("sources/index.json");
const choices = ["ア", "イ", "ウ", "エ"];
assert.equal(catalog.totalPlanned, 17);
assert(
  catalog.exams.length > 0 && catalog.exams.length <= catalog.totalPlanned,
);
assert.equal(
  new Set(catalog.exams.map((e) => e.id)).size,
  catalog.exams.length,
);
let count = 0;
let gradableCount = 0;
for (const summary of catalog.exams) {
  assert.match(summary.id, /^[a-z0-9-]+$/);
  const exam = await json(`public/data/${summary.id}/questions.json`);
  const extracted = extractions[summary.id];
  assert(Array.isArray(extracted), `${summary.id}: 切出し記録がありません`);
  for (const [key, value] of Object.entries(summary))
    assert.deepEqual(exam[key], value, `${summary.id}: ${key}`);
  assert.equal(exam.questions.length, 25);
  assert.deepEqual(
    exam.excludedQuestionNos ?? [],
    exam.questions.filter((q) => q.answer === null).map((q) => q.no),
  );
  assert.equal(extracted.length, 25);
  assert.equal(new Set(extracted.map((q) => q.no)).size, 25);
  assert.match(exam.sourcePdf, /^https:\/\/www\.ipa\.go\.jp\//);
  const originals = manifest.filter((entry) => entry.examId === exam.id);
  assert.equal(originals.length, 2);
  assert(
    originals.some(
      (entry) => entry.kind === "questions" && entry.url === exam.sourcePdf,
    ),
  );
  assert(originals.some((entry) => entry.kind === "answers"));
  for (const entry of originals) {
    assert.match(entry.path, /^sources\/[a-z0-9-]+\/(questions|answers)\.pdf$/);
    const bytes = await readFile(resolve(root, entry.path));
    assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      entry.sha256,
      entry.path,
    );
  }
  for (const [index, q] of exam.questions.entries()) {
    assert.equal(q.no, index + 1);
    assert(
      choices.includes(q.answer) ||
        (q.answer === null &&
          typeof q.invalidReason === "string" &&
          q.invalidReason.length > 0),
    );
    const official = extracted.find((item) => item.no === q.no);
    assert.equal(
      q.answer,
      official.answer,
      `${exam.id} 問${q.no}: 公式抽出正解と不一致`,
    );
    assert.equal(q.pdfPage, official.pdfPage);
    if (q.answer === null)
      assert.equal(q.invalidReason, official.invalidReason);
    else gradableCount++;
    assert.equal(q.image, `q${String(q.no).padStart(2, "0")}.png`);
    const path = resolve(root, "public/data", exam.id, q.image);
    const image = await readFile(path);
    assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert(image.readUInt32BE(16) >= 800 && image.readUInt32BE(20) >= 80, path);
    assert((await stat(path)).size > 1000);
    assert(
      q.stem?.trim().length > 10,
      `${exam.id} 問${q.no}: 設問が短すぎます`,
    );
    for (const choice of choices)
      assert(q.choices?.[choice]?.trim().length > 0);
    assert(
      Array.isArray(q.visuals) &&
        q.visuals.every((v) => ["figure", "table", "image"].includes(v)),
    );
    assert(
      q.explanation?.summary?.trim().length > 15,
      `${exam.id} 問${q.no}: 解説の要約が短すぎます`,
    );
    assert(
      Array.isArray(q.explanation.points) && q.explanation.points.length > 0,
    );
    assert(
      q.explanation.points.every(
        (point) => typeof point === "string" && point.trim().length > 0,
      ),
    );
    if (q.explanation.choices)
      for (const choice of choices)
        assert(q.explanation.choices[choice]?.trim().length > 5);
    assert(
      !JSON.stringify(q.explanation).match(/TODO|未作成|仮の解説|後で作成/i),
    );
    count++;
  }
}
if (process.argv.includes("--release")) {
  assert.equal(catalog.exams.length, 17, "初回公開には全17回が必要です");
  assert.equal(count, 425, "初回公開には全425問が必要です");
  assert.equal(gradableCount, 424, "不成立の1問を除く424問が採点対象です");
  const checks = await json("specs/0001-initial-release/content-checks.json");
  assert.equal(
    checks.userReview,
    "approved",
    "試作の利用者レビューが未完了です",
  );
  assert.equal(checks.questions.length, 425);
  assert.equal(
    new Set(checks.questions.map((q) => `${q.examId}:${q.no}`)).size,
    425,
  );
  for (const exam of catalog.exams)
    for (let no = 1; no <= 25; no++) {
      const check = checks.questions.find(
        (q) => q.examId === exam.id && q.no === no,
      );
      assert(
        check &&
          check.extraction === "checked" &&
          check.officialAnswer === "checked",
      );
    }
  assert(
    checks.questions.every(
      (q) => q.imageReview === "checked" && q.explanationReview === "checked",
    ),
  );
}
console.log(
  `問題データ・画像・原本ハッシュ・公式抽出正解：${catalog.exams.length}回 ${count}問 OK`,
);

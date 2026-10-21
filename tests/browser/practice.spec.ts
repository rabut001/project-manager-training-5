import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Catalog, Exam } from "../../src/exam";

const catalog = JSON.parse(
  readFileSync("public/data/exams.json", "utf8"),
) as Catalog;

async function openNumbers(page: Page) {
  const toggle = page.getByRole("button", { name: /問題一覧/ });
  if (
    (await toggle.isVisible()) &&
    (await toggle.getAttribute("aria-expanded")) === "false"
  )
    await toggle.click();
}
async function openQuestion(page: Page, no: number) {
  await expect(page.locator(".question-heading h2")).toBeVisible();
  await openNumbers(page);
  await page
    .getByRole("navigation", { name: "問題番号" })
    .getByRole("button", { name: new RegExp(`^問${no}、`) })
    .click();
  await expect(page.locator(".question-heading h2")).toContainText(
    String(no).padStart(2, "0"),
  );
}
const answerChoices = (page: Page) =>
  page.getByRole("group", { name: "回答の選択肢" });

for (const summary of catalog.exams) {
  const exam = JSON.parse(
    readFileSync(`public/data/${summary.id}/questions.json`, "utf8"),
  ) as Exam;
  test(`${summary.title}：全25問の画像・解説・採点対象を表示`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.addInitScript(
      ({ id, questions }) => {
        localStorage.setItem(
          `pm-am2:v1:${id}`,
          JSON.stringify({
            version: 1,
            currentNo: 1,
            checked: [],
            answers: Object.fromEntries(
              questions
                .filter((q) => q.answer !== null)
                .map((q) => [q.no, { choice: q.answer, confirmed: true }]),
            ),
          }),
        );
      },
      { id: exam.id, questions: exam.questions },
    );
    await page.goto(`./#/${exam.id}`);
    await expect(page.locator(".score-card strong")).toHaveText("100%");
    for (const question of exam.questions) {
      await openQuestion(page, question.no);
      const img = page.locator(".question-image");
      await expect(img).toHaveAttribute(
        "src",
        new RegExp(`/data/${exam.id}/${question.image}$`),
      );
      await expect
        .poll(() =>
          img.evaluate(
            (el) =>
              (el as HTMLImageElement).complete &&
              (el as HTMLImageElement).naturalWidth > 800,
          ),
        )
        .toBe(true);
      await expect(page.locator(".explanation-summary")).toHaveText(
        question.explanation.summary,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}

test("不成立問題を閲覧・チェックでき、回答や未回答の対象にはしない", async ({
  page,
}) => {
  await page.goto("./#/2016-h28-haru");
  await openQuestion(page, 2);
  await expect(
    page.getByText("IPAにより不成立", { exact: true }),
  ).toBeVisible();
  await expect(answerChoices(page).getByRole("button")).toHaveCount(4);
  for (const button of await answerChoices(page).getByRole("button").all())
    await expect(button).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "結果を確認", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("checkbox", { name: "あとで見直す" }).check();
  await page.getByRole("button", { name: /^未回答/ }).click();
  await openNumbers(page);
  await expect(
    page.getByRole("navigation", { name: "問題番号" }).getByRole("button"),
  ).toHaveCount(24);
  await page.getByRole("button", { name: /^チェック済み/ }).click();
  await openQuestion(page, 2);
  await page.reload();
  await expect(
    page.getByText("IPAにより不成立", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "あとで見直す" }),
  ).toBeChecked();
  await expect(page.locator(".overall-progress")).toContainText("/ 24");
});

test("年度ごとに回答を保存し、一方をクリアしても他年度を保持する", async ({
  page,
}) => {
  for (const id of ["2024-r06-aki", "2009-h21-haru"]) {
    await page.goto(`./#/${id}`);
    await openQuestion(page, 3);
    await answerChoices(page)
      .getByRole("button", { name: "イ", exact: true })
      .click();
    await page.getByRole("button", { name: "結果を確認", exact: true }).click();
    await page.getByRole("checkbox", { name: "あとで見直す" }).check();
  }
  await page.goto("./#/2024-r06-aki");
  await expect(page.locator(".question-heading h2")).toContainText("03");
  await expect(
    answerChoices(page).getByRole("button", { name: "イ", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".session-actions summary").click();
  await page
    .getByRole("button", { name: "回答をすべてクリア", exact: true })
    .click();
  await page
    .getByRole("button", { name: "消してやり直す", exact: true })
    .click();
  await expect(page.locator(".score-card strong")).toHaveText("—");
  await page.goto("./#/2009-h21-haru");
  await expect(page.locator(".question-heading h2")).toContainText("03");
  await expect(
    answerChoices(page).getByRole("button", { name: "イ", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    answerChoices(page).getByRole("button", { name: "イ", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("checkbox", { name: "あとで見直す" }),
  ).toBeChecked();
});

test("回答確定・再読込・一括採点・絞り込み・回答クリア", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "学習する年度を選ぶ" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /令和7年度 秋期/ }).click();
  await expect(
    page.getByRole("button", { name: "結果を確認", exact: true }),
  ).toBeDisabled();
  await answerChoices(page)
    .getByRole("button", { name: "エ", exact: true })
    .click();
  await page.getByRole("button", { name: "結果を確認", exact: true }).click();
  await expect(page.getByText("○ 正解です", { exact: true })).toBeVisible();
  if (test.info().project.name === "mobile") {
    expect(
      await page
        .locator(".explanation")
        .evaluate((el) => el.getBoundingClientRect().top),
    ).toBeLessThan(100);
    await expect(page.locator(".explanation")).toBeFocused();
  }
  await expect(
    answerChoices(page).getByRole("button", { name: "ア", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".score-card strong")).toHaveText("100%");
  await page.reload();
  await expect(page.getByText("○ 正解です", { exact: true })).toBeVisible();
  await openQuestion(page, 2);
  await page.getByRole("checkbox", { name: "あとで見直す" }).check();
  await answerChoices(page)
    .getByRole("button", { name: "ア", exact: true })
    .click();
  await page.locator(".session-actions summary").click();
  await page.getByRole("button", { name: /一括採点/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "採点する", exact: true }).click();
  await expect(page.getByText("× 不正解です", { exact: true })).toBeVisible();
  await expect(page.locator(".score-card strong")).toHaveText("50%");
  await page.getByRole("button", { name: /^誤答/ }).click();
  await openNumbers(page);
  await expect(
    page.getByRole("navigation", { name: "問題番号" }).getByRole("button"),
  ).toHaveCount(1);
  await page.getByRole("button", { name: /^チェック済み/ }).click();
  await expect(
    page.getByRole("navigation", { name: "問題番号" }).getByRole("button"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "回答をすべてクリア", exact: true })
    .click();
  await page.getByRole("button", { name: "中止", exact: true }).click();
  await expect(page.getByText("× 不正解です", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "回答をすべてクリア", exact: true })
    .click();
  await page
    .getByRole("button", { name: "消してやり直す", exact: true })
    .click();
  await expect(page.locator(".question-heading h2")).toContainText("01");
  await expect(page.locator(".score-card strong")).toHaveText("—");
  await openQuestion(page, 2);
  await expect(
    page.getByRole("checkbox", { name: "あとで見直す" }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "結果を確認", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "← 年度一覧へ戻る" }).click();
  await expect(
    page.getByRole("heading", { name: "学習する年度を選ぶ" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.locator(".question-heading h2")).toContainText("02");
  expect(errors).toEqual([]);
});

test("画像の拡大・全25問の画像読み込み・スマホとPCのレイアウト", async ({
  page,
}, testInfo) => {
  await page.goto("./#/2025-r07-aki");
  await expect(page.locator(".question-image")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".question-image")
        .evaluate((img) => (img as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(800);
  await page.screenshot({
    path: `/tmp/pm-${testInfo.project.name}-question.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "＋ 問題画像を拡大" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const zoom = page.locator(".zoom-scroll");
  expect(await zoom.evaluate((el) => el.scrollWidth)).toBeGreaterThan(800);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "＋ 問題画像を拡大" }),
  ).toBeFocused();
  for (let no = 1; no <= 25; no++) {
    await openQuestion(page, no);
    await expect
      .poll(() =>
        page
          .locator(".question-image")
          .evaluate(
            (img) =>
              (img as HTMLImageElement).complete &&
              (img as HTMLImageElement).naturalWidth > 800,
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await openQuestion(page, 7);
  if (testInfo.project.name === "desktop") {
    await page.locator(".question-source").scrollIntoViewIfNeeded();
    await expect(answerChoices(page)).toBeInViewport();
  }
  await answerChoices(page)
    .getByRole("button", { name: "ウ", exact: true })
    .click();
  await page.getByRole("button", { name: "結果を確認", exact: true }).click();
  await expect(page.getByText(/当初計画は33日、変更後は34日/)).toBeVisible();
  await page.screenshot({
    path: `/tmp/pm-${testInfo.project.name}-explanation.png`,
    fullPage: true,
  });
});

test("空の絞り込み、保存不可、存在しない年度から復帰できる", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    });
  });
  await page.goto("./#/2025-r07-aki");
  await expect(
    page.getByText(/このブラウザに履歴を保存できません/),
  ).toBeVisible();
  await page.getByRole("button", { name: /^誤答/ }).click();
  await expect(
    page.getByText("該当する問題はありません。", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "すべての問題を表示", exact: true })
    .click();
  await answerChoices(page)
    .getByRole("button", { name: "エ", exact: true })
    .click();
  await page.getByRole("button", { name: "結果を確認", exact: true }).click();
  await expect(page.getByText("○ 正解です", { exact: true })).toBeVisible();
  await page.goto("./#/missing");
  await expect(
    page.getByRole("heading", { name: "この年度の問題は見つかりませんでした" }),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("link", { name: "年度一覧へ戻る", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "学習する年度を選ぶ" }),
  ).toBeVisible();
});

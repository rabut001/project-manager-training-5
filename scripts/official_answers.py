"""IPA解答PDFの正解表を読む。不成立の注記を通常の正解へ変換しない。"""
import re
import pymupdf


def read_official_answers(path):
    with pymupdf.open(path) as doc:
        text = '\n'.join(page.get_text() for page in doc)
    pairs = re.findall(r'問\s*(\d+)\s*([アイウエ]|[（(]注[）)])', text)
    answers = {}
    reasons = {}
    for raw_no, raw_answer in pairs:
        no = int(raw_no)
        if no in answers:
            raise ValueError(f'公式解答に問{no}が重複しています')
        if raw_answer in 'アイウエ':
            answers[no] = raw_answer
        elif '誤りにより問題として成立しない' in text:
            answers[no] = None
            reasons[no] = 'IPAの公式解答に「誤りにより問題として成立しない」と記載されています。このアプリでは採点対象から除外します。'
        else:
            raise ValueError(f'問{no}の注記の内容を確認してください')
    if sorted(answers) != list(range(1, 26)):
        raise ValueError('公式解答が1～25の連番ではありません')
    return answers, reasons

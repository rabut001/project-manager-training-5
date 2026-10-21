#!/usr/bin/env python3
"""公開問題の正解を、原本の公式解答PDFから独立に再抽出して照合する。"""
import hashlib
import json
import re
from pathlib import Path
import pymupdf
from official_answers import read_official_answers

root = Path(__file__).resolve().parents[1]
catalog = json.loads((root/'public/data/exams.json').read_text())
manifest = json.loads((root/'sources/manifest.json').read_text())
for item in manifest:
    assert hashlib.sha256((root/item['path']).read_bytes()).hexdigest() == item['sha256']
for summary in catalog['exams']:
    answers, reasons = read_official_answers(root/'sources'/summary['id']/'answers.pdf')
    exam = json.loads((root/'public/data'/summary['id']/'questions.json').read_text())
    for question in exam['questions']:
        assert answers[question['no']] == question['answer'], (summary['id'], question['no'])
        if question['answer'] is None:
            assert question.get('invalidReason') == reasons[question['no']]
    print(summary['id'], ': 全25問の正解をIPA公式解答PDFと再照合 OK')

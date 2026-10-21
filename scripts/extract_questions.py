#!/usr/bin/env python3
"""IPA原本から問ごとの画像、公式正解、抽出座標、OCR下書きを作る。

参照元: https://github.com/rabut001/system-arch-training/blob/main/scripts/cut_am2_questions.py
問の先頭を検出して余白で分離する考え方を引き継ぐ。PyMuPDF内蔵OCRを使う。
OCR下書きはそのまま公開せず、原本照合後の問題JSONを別に作成する。
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pymupdf
from official_answers import read_official_answers

ROOT = Path(__file__).resolve().parents[1]


def recorded_images(exam_id: str) -> None:
    """照合済みの座標を利用して、OCRをやり直さず画像を再作成する。"""
    index = json.loads((ROOT / 'sources/index.json').read_text())
    records = index[exam_id]
    doc = pymupdf.open(ROOT / 'sources' / exam_id / 'questions.pdf')
    output = ROOT / 'public/data' / exam_id
    output.mkdir(parents=True, exist_ok=True)
    for record in records:
        pix = doc[record['pdfPage']-1].get_pixmap(
            matrix=pymupdf.Matrix(200/72, 200/72),
            colorspace=pymupdf.csGRAY, clip=pymupdf.Rect(record['crop']))
        pix.save(output / record['image'])
    doc.close()
    print(f'{exam_id}: 記録済みの座標から{len(records)}画像を再作成')


def extract(exam_id: str, tessdata: str | None) -> None:
    source = ROOT / 'sources' / exam_id
    output = ROOT / 'public' / 'data' / exam_id
    output.mkdir(parents=True, exist_ok=True)
    answers, reasons = read_official_answers(source / 'answers.pdf')

    doc = pymupdf.open(source / 'questions.pdf')
    cache_path = source / 'ocr-pages.json'
    cached = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    overrides_path = source / 'crop-overrides.json'
    overrides = json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
    records = []
    for page_index, page in enumerate(doc):
        native = page.get_text()
        cache_key = str(page_index+1)
        if cache_key in cached:
            lines = cached[cache_key]['lines']
            method = cached[cache_key]['method']
        elif re.search(r'[問間]\s*\d+', native):
            tp = page.get_textpage()
            method = 'native'
        else:
            if not tessdata:
                raise ValueError('画像形式PDFには --tessdata を指定してください')
            if page.rotation:
                flat = pymupdf.open()
                ocr_page = flat.new_page(width=page.rect.width, height=page.rect.height)
                ocr_page.insert_image(ocr_page.rect, pixmap=page.get_pixmap(matrix=pymupdf.Matrix(2, 2)))
            else:
                flat = None
                ocr_page = page
            tp = ocr_page.get_textpage_ocr(language='jpn+eng', dpi=200, full=True, tessdata=tessdata)
            method = 'ocr'
        if cache_key not in cached:
            lines = []
            for block in (ocr_page if method == 'ocr' else page).get_text('dict', textpage=tp)['blocks']:
                for line in block.get('lines', []):
                    text = ''.join(span['text'] for span in line['spans'])
                    lines.append({'text': text, 'bbox': list(line['bbox'])})
            cached[cache_key] = {'method': method, 'lines': lines}
            cache_path.write_text(json.dumps(cached, ensure_ascii=False, indent=2)+'\n')
            if method == 'ocr' and flat is not None:
                flat.close()
        # 表紙・白紙・メモ用紙を除外。問番号は本文の左端にある。
        headers = []
        if page_index > 0:
            for line in lines:
                text = line['text'].replace(' ', '').replace('　', '')
                match = re.match(r'^[問間閥閣](\d{1,2})(?!\d)', text)
                if match and line['bbox'][0] < 90 and line['bbox'][1] < page.rect.height - 60:
                    no = int(match[1])
                    if 1 <= no <= 25:
                        headers.append((no, line['bbox'][1]))
        headers.sort(key=lambda h: h[1])
        if cache_key in overrides:
            headers = [(item['no'], item['top']) for item in overrides[cache_key]]
        print(f'page {page_index+1}: {headers}', flush=True)
        for index, (no, y) in enumerate(headers):
            footer = page.rect.height * .92
            for line in lines:
                x0, y0, x1, _ = line['bbox']
                if y0 > page.rect.height * .92 and abs((x0+x1)/2-page.rect.width/2) < 45:
                    footer = min(footer, y0-5)
            bottom = headers[index+1][1] - 18 if index+1 < len(headers) else footer
            rect = pymupdf.Rect(28, max(35, y-12), page.rect.width-22, bottom)
            pix = page.get_pixmap(matrix=pymupdf.Matrix(200/72, 200/72), colorspace=pymupdf.csGRAY, clip=rect)
            # 最終問の下の大きな余白を取り除く。本文途中の空白では切らない。
            pixels = pix.samples
            for row in range(pix.height-1, -1, -1):
                if sum(pixel < 180 for pixel in pixels[row*pix.width:(row+1)*pix.width]) >= 10:
                    rect.y1 = min(rect.y1, rect.y0 + (row+1)/(200/72) + 8)
                    break
            pix = page.get_pixmap(matrix=pymupdf.Matrix(200/72, 200/72), colorspace=pymupdf.csGRAY, clip=rect)
            image_name = f'q{no:02}.png'
            pix.save(output / image_name)
            records.append({
                'no': no, 'answer': answers[no], 'pdfPage': page_index+1,
                'crop': list(rect), 'image': image_name, 'method': method,
                'draftText': '\n'.join(line['text'] for line in lines if y-12 <= line['bbox'][1] < bottom),
                **({'invalidReason': reasons[no]} if no in reasons else {}),
            })
    (source / 'extraction.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
    if sorted(r['no'] for r in records) != list(range(1, 26)):
        raise ValueError('問の切り出しが1～25の連番ではありません。extraction.jsonと原本を確認してください')
    index_path = ROOT / 'sources/index.json'
    index = json.loads(index_path.read_text()) if index_path.exists() else {}
    index[exam_id] = [{k: v for k, v in record.items() if k != 'draftText'} for record in records]
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2)+'\n')
    print('25 images and official answers extracted. Visual and explanation review still required.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('exam_id')
    parser.add_argument('--tessdata', help='jpn.traineddata と eng.traineddata のディレクトリ')
    parser.add_argument('--recorded', action='store_true', help='照合済みの保存座標で画像を再作成（OCR不要）')
    args = parser.parse_args()
    if args.recorded:
        recorded_images(args.exam_id)
    else:
        extract(args.exam_id, args.tessdata)

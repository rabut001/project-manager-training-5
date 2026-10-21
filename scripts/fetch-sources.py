#!/usr/bin/env python3
"""Gitに含めないIPA原本をmanifestから取得し、記録済みハッシュで検証する。"""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlparse
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


def fetch(entry):
    relative = entry['path']
    if not re.fullmatch(r'sources/[a-z0-9-]+/(questions|answers)\.pdf', relative):
        raise ValueError(f'不正な原本パス: {relative}')
    url = entry['url']
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.netloc != 'www.ipa.go.jp':
        raise ValueError('原本はIPAのHTTPS URLに限定します')
    path = ROOT / relative
    if path.exists():
        data = path.read_bytes()
    else:
        with urlopen(url, timeout=60) as response:
            if urlparse(response.url).netloc != 'www.ipa.go.jp':
                raise ValueError('IPA外へのリダイレクトは使用しません')
            data = response.read()
    if not data.startswith(b'%PDF') or hashlib.sha256(data).hexdigest() != entry['sha256']:
        raise ValueError(f'原本の内容が記録と異なります。自動上書きせず確認してください: {relative}')
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    return f'{relative}: SHA-256 OK'


if __name__ == '__main__':
    manifest = json.loads((ROOT / 'sources/manifest.json').read_text())
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(fetch, manifest):
            print(result, flush=True)

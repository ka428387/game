#!/usr/bin/env python3
"""公開前・アプリに入れる前のチェック。  python3 tools/check.py
- どのページも共通部品（common/asobi.css・asobi.js）を読み込んでいるか
- ネットから読み込むもの（Googleフォントなど）がないか（アプリはネットなしでも動かしたい）
- 画面に出る文字に漢字が残っていないか（3さい〜小学校低学年むけ。ひらがなにそろえる）
- 画面に出る文字が、同梱の字体（fonts/）に全部入っているか（足したら tools/make_fonts.py）"""
import glob, os, re, sys
from fontTools.ttLib import TTFont

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(SITE)
bad = []

def visible(s):
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    s = re.sub(r'(?m)(^|[^:\'"])//.*$', r'\1', s)
    return re.sub(r'<style.*?</style>', '', s, flags=re.S)

cmap = TTFont('fonts/asobi-maru-700.woff2').getBestCmap()
for f in sorted(glob.glob('*.html')):
    s = open(f, encoding='utf-8').read()
    for need in ('common/asobi.css', 'common/asobi.js', 'data-asobi='):
        if need not in s: bad.append(f'{f}: {need} がない')
    for url in set(re.findall(r'(?:src|href|url)\(?=?["\']?(https?://[^"\') ]+)', s)):
        bad.append(f'{f}: ネットから読み込んでいる {url}')
    v = visible(s)
    for k in sorted(set(re.findall(r'[一-鿿]+', v))):
        bad.append(f'{f}: 漢字が残っている「{k}」')
    missing = sorted({c for c in v if '぀' <= c <= 'ヿ' and ord(c) not in cmap})
    if missing: bad.append(f'{f}: 字体にない文字 {"".join(missing)}（tools/make_fonts.py を実行）')

if bad:
    print('\n'.join('✗ ' + b for b in bad)); sys.exit(1)
print('✓ チェックOK')

#!/usr/bin/env python3
"""字体を作り直す。画面に出る文字を足したら、これを実行する（足した文字が丸ゴシックで出なくなるため）。
  python3 tools/make_fonts.py
元の字体（Zen Maru Gothic・SIL Open Font License）は ../_fonts_src/ にある。
ページと common/ に出てくる文字＋ひらがな・カタカナ・英数字ぜんぶ、だけにしぼって fonts/ に書き出す。"""
import glob, os, re
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SRC = os.path.join(SITE, '..', '_fonts_src')
WEIGHTS = {500: 'ZenMaruGothic-Medium.ttf', 700: 'ZenMaruGothic-Bold.ttf', 900: 'ZenMaruGothic-Black.ttf'}

text = set()
for f in glob.glob(os.path.join(SITE, '*.html')) + glob.glob(os.path.join(SITE, 'common', '*.js')):
    text |= set(open(f, encoding='utf-8').read())
for a, b in [(0x20, 0x7E), (0x3000, 0x30FF), (0xFF01, 0xFF5E), (0x2010, 0x2027), (0x2190, 0x2193), (0xD7, 0xD7), (0xF7, 0xF7)]:
    text |= {chr(c) for c in range(a, b + 1)}
text = ''.join(sorted(c for c in text if c.isprintable() and ord(c) < 0x10000 and not (0x2600 <= ord(c) < 0x2800)))

for w, name in WEIGHTS.items():
    out = os.path.join(SITE, 'fonts', f'asobi-maru-{w}.woff2')
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']
    font = subset.load_font(os.path.join(SRC, name), opts)
    s = subset.Subsetter(opts); s.populate(text=text); s.subset(font)
    subset.save_font(font, out, opts)
    print(f'{os.path.basename(out)}  {os.path.getsize(out)//1024} KB')
print(f'{len(text)} 文字')

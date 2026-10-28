"""Builds web-ready product images and brand artwork for Madhuri Sarees from /images.
Run: python3 tools/make_images.py  (needs Pillow)"""
import os, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'images')
PROD = os.path.join(ROOT, 'backend', 'uploads', 'products')
BRAND = os.path.join(ROOT, 'frontend', 'public', 'brand')

MAROON = (110, 18, 46); MAROON_D = (62, 8, 26); GOLD = (201, 162, 74); GOLD_L = (231, 205, 140)
CREAM = (251, 246, 236); GREEN = (14, 61, 51)

def src(name):
    return Image.open(os.path.join(SRC, f'WhatsApp Image 2026-10-27 at {name}.jpeg')).convert('RGB')

def save(im, path, q=86):
    im.save(path, 'JPEG', quality=q, optimize=True, progressive=True)

def crop_frac(im, x0, y0, x1, y1):
    w, h = im.size
    return im.crop((int(x0*w), int(y0*h), int(x1*w), int(y1*h)))

def model(name):
    im = src(name)
    w, h = im.size
    if w == h:
        return crop_frac(im, 0.035, 0.06, 0.435, 0.965)
    return crop_frac(im, 0.03, 0.05, 0.47, 0.975)

def swatch(name):
    im = src(name)
    w, h = im.size
    if w == h:
        return crop_frac(im, 0.525, 0.31, 0.945, 0.585)
    return crop_frac(im, 0.53, 0.27, 0.96, 0.595)

def photo(name, pad=0.0):
    im = src(name)
    if pad:
        im = crop_frac(im, pad, pad, 1-pad, 1-pad)
    return im

def fit(im, size, top=False):
    return ImageOps.fit(im, size, Image.LANCZOS, centering=(0.5, 0.0 if top else 0.35))

def to_portrait(im, size=(900, 1200)):
    """Places any image on a 3:4 canvas using a soft blurred backdrop of itself."""
    bg = pattern(size, CREAM, GOLD, alpha=36, step=70)
    k = min(size[0] / im.width, size[1] / im.height) * 0.94
    fg = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
    bg.paste(fg, ((size[0]-fg.width)//2, (size[1]-fg.height)//2))
    return bg

def arch_mask(size, radius=None):
    w, h = size
    r = radius or w // 2
    m = Image.new('L', size, 0); d = ImageDraw.Draw(m)
    d.rectangle((0, r, w, h), fill=255)
    d.pieslice((0, 0, w, 2*r), 180, 360, fill=255)
    return m.filter(ImageFilter.GaussianBlur(0.6))

def arch(im, size, border=6, color=GOLD, top=False):
    """Returns RGBA image cropped to an arch with a gold border."""
    w, h = size
    out = Image.new('RGBA', (w + 2*border, h + 2*border), (0, 0, 0, 0))
    gold = Image.new('RGBA', out.size, color + (255,))
    out.paste(gold, (0, 0), arch_mask(out.size))
    inner = fit(im, size, top).convert('RGBA')
    out.paste(inner, (border, border), arch_mask(size))
    return out

def pattern(size, base, line, alpha=40, step=90):
    """Jaali style lattice of diamonds and dots."""
    im = Image.new('RGB', size, base)
    lay = Image.new('RGBA', size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    c = line + (alpha,)
    for y in range(-step, size[1] + step, step):
        for x in range(-step, size[0] + step, step):
            off = step // 2 if (y // step) % 2 else 0
            cx, cy = x + off, y
            s = step * 0.32
            d.polygon([(cx, cy - s), (cx + s, cy), (cx, cy + s), (cx - s, cy)], outline=c, width=2)
            d.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=c)
            for k in range(8):
                a = k * math.pi / 4
                d.ellipse((cx + math.cos(a)*s*0.55 - 2, cy + math.sin(a)*s*0.55 - 2,
                           cx + math.cos(a)*s*0.55 + 2, cy + math.sin(a)*s*0.55 + 2), fill=c)
    im.paste(lay, (0, 0), lay)
    return im

def radial_glow(im, center, radius, color, strength=0.55):
    w, h = im.size
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    cx, cy = center
    for i in range(30, 0, -1):
        r = radius * i / 30
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=int(255 * strength * (1 - i / 30)))
    m = m.filter(ImageFilter.GaussianBlur(60))
    return Image.composite(Image.new('RGB', (w, h), color), im, m)

def gradient(size, c1, c2, horizontal=True):
    w, h = size
    g = Image.new('RGB', size)
    d = ImageDraw.Draw(g)
    n = w if horizontal else h
    for i in range(n):
        t = i / max(n - 1, 1)
        col = tuple(int(c1[k] + (c2[k] - c1[k]) * t) for k in range(3))
        if horizontal: d.line((i, 0, i, h), fill=col)
        else: d.line((0, i, w, i), fill=col)
    return g

def gold_rule(d, x0, x1, y, width=2):
    d.line((x0, y, x1, y), fill=GOLD, width=width)
    mx = (x0 + x1) // 2
    d.polygon([(mx, y - 8), (mx + 8, y), (mx, y + 8), (mx - 8, y)], fill=GOLD)

def full_length(m, size=(900, 1200)):
    bg = pattern(size, CREAM, GOLD, alpha=36, step=70).convert('RGBA')
    h = size[1] - 70; w = int(m.width * h / m.height)
    a = arch(m, (w, h), border=6, top=True)
    bg.alpha_composite(a, ((size[0] - a.width) // 2, (size[1] - a.height) // 2))
    return bg.convert('RGB')

# ---------------------------------------------------------------- products
PRODUCTS = {
    'peacock-blue-banarasi-silk-7801': [('model', '10.44.24 AM (4)'), ('swatch', '10.44.24 AM (4)'), ('model', '10.44.24 AM (5)'), ('photo', '10.44.24 AM (27)')],
    'light-blue-banarasi-silk-7802': [('model', '10.44.24 AM (2)'), ('swatch', '10.44.24 AM (2)'), ('photo', '10.44.24 AM (20)'), ('photo', '10.44.24 AM (23)'), ('photo', '10.44.24 AM (21)')],
    'peacock-green-banarasi-silk-7803': [('model', '10.44.24 AM'), ('swatch', '10.44.24 AM'), ('photo', '10.44.24 AM (25)'), ('photo', '10.44.24 AM (18)')],
    'rani-pink-banarasi-silk-7804': [('model', '10.44.23 AM (6)'), ('swatch', '10.44.23 AM (6)'), ('photo', '10.44.24 AM (26)')],
    'turquoise-blue-banarasi-silk-7804': [('model', '10.44.24 AM (13)'), ('swatch', '10.44.24 AM (13)'), ('photo', '10.44.24 AM (24)'), ('photo', '10.44.24 AM (16)')],
    'teal-blue-banarasi-silk-7804': [('model', '10.44.24 AM (14)'), ('swatch', '10.44.24 AM (14)'), ('model', '10.44.24 AM (6)'), ('photo', '10.44.24 AM (17)')],
    'royal-purple-banarasi-silk-7804': [('model', '10.44.24 AM (8)'), ('swatch', '10.44.24 AM (8)'), ('photo', '10.44.24 AM (22)'), ('photo', '10.44.24 AM (19)')],
    'purple-zari-banarasi-silk-7805': [('model', '10.44.23 AM (4)'), ('swatch', '10.44.23 AM (4)'), ('model', '10.44.23 AM (5)'), ('photo', '10.44.24 AM (19)')],
    'pink-green-banarasi-silk': [('model', '10.44.24 AM (10)'), ('swatch', '10.44.24 AM (10)'), ('photo', '10.44.24 AM (15)'), ('photo', '10.44.24 AM (26)')],
    'green-red-banarasi-silk': [('model', '10.44.24 AM (12)'), ('swatch', '10.44.24 AM (12)'), ('photo', '10.44.24 AM (25)'), ('photo', '10.44.24 AM (18)')],
}

def build_products():
    for slug, parts in PRODUCTS.items():
        for i, (kind, name) in enumerate(parts, 1):
            if kind == 'model' and i == 1:
                # lead image: tight 3:4 crop from the top so the face and drape lead
                im = fit(model(name), (900, 1200), top=True)
            elif kind == 'model':
                im = full_length(model(name))
            elif kind == 'swatch': im = to_portrait(swatch(name))
            else: im = to_portrait(photo(name, 0.02))
            save(im, os.path.join(PROD, f'{slug}-{i}.jpg'))
    print('products done')

# ---------------------------------------------------------------- brand art
def build_brand():
    W, H = 1920, 900
    # Hero 1: maroon jaali with three arch portraits
    bg = pattern((W, H), MAROON_D, GOLD, alpha=28, step=80)
    bg = radial_glow(bg, (1300, 450), 700, MAROON, 0.8)
    lay = bg.convert('RGBA')
    picks = [('10.44.24 AM (4)', (300, 620), (900, 210)), ('10.44.24 AM (13)', (360, 740), (1215, 110)), ('10.44.23 AM (6)', (300, 620), (1590, 210))]
    for name, size, pos in picks:
        a = arch(model(name), size, border=7, top=True)
        sh = Image.new('RGBA', a.size, (0, 0, 0, 0)); sh.paste((0, 0, 0, 140), (0, 0), a.split()[3])
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        lay.alpha_composite(sh, (pos[0] + 12, pos[1] + 22)); lay.alpha_composite(a, pos)
    d = ImageDraw.Draw(lay)
    gold_rule(d, 860, 1920, 870)
    save(lay.convert('RGB'), os.path.join(BRAND, 'hero-1.jpg'), 84)

    # Hero 2: cream with flat-lay collection
    bg = pattern((W, H), CREAM, GOLD, alpha=38, step=80)
    lay = bg.convert('RGBA')
    a = arch(photo('10.44.24 AM (29)'), (640, 760), border=8, color=GOLD)
    lay.alpha_composite(a, (1080, 70))
    b = arch(model('10.44.24 AM (14)'), (300, 560), border=7, color=MAROON, top=True)
    lay.alpha_composite(b, (1650, 290))
    save(lay.convert('RGB'), os.path.join(BRAND, 'hero-2.jpg'), 84)

    # Hero 3: peacock green
    bg = pattern((W, H), GREEN, GOLD, alpha=30, step=80)
    bg = radial_glow(bg, (1350, 450), 650, (24, 92, 76), 0.8)
    lay = bg.convert('RGBA')
    a = arch(model('10.44.24 AM'), (380, 760), border=8, top=True)
    lay.alpha_composite(a, (1150, 70))
    s = arch(photo('10.44.24 AM (28)'), (300, 420), border=6)
    lay.alpha_composite(s, (1580, 400))
    save(lay.convert('RGB'), os.path.join(BRAND, 'hero-3.jpg'), 84)

    # Category tiles (arch on soft pattern), 600x800
    tiles = {
        'cat-banarasi': model('10.44.24 AM (4)'),
        'cat-festive': model('10.44.23 AM (6)'),
        'cat-bridal': model('10.44.24 AM (12)'),
        'cat-soft-silk': photo('10.44.24 AM (28)'),
        'cat-new': model('10.44.24 AM (13)'),
    }
    for key, im in tiles.items():
        save(fit(im, (600, 800), top=key != 'cat-soft-silk'), os.path.join(BRAND, f'{key}.jpg'), 84)

    # Promo banner 1600x640
    bg = gradient((1600, 640), MAROON_D, MAROON)
    bg = Image.blend(bg, pattern((1600, 640), MAROON, GOLD, alpha=50, step=70), 0.5)
    lay = bg.convert('RGBA')
    for i, (name, kind) in enumerate([('10.44.24 AM (22)', 'p'), ('10.44.24 AM (24)', 'p'), ('10.44.24 AM (25)', 'p'), ('10.44.24 AM (26)', 'p')]):
        a = arch(photo(name), (190, 300), border=5)
        lay.alpha_composite(a, (820 + i * 190, 170 if i % 2 else 120))
    save(lay.convert('RGB'), os.path.join(BRAND, 'promo.jpg'), 84)

    # Story / about image 1000x1200
    bg = pattern((1000, 1200), CREAM, GOLD, alpha=40, step=70)
    lay = bg.convert('RGBA')
    lay.alpha_composite(arch(model('10.44.24 AM (5)'), (520, 900), border=8), (70, 160))
    lay.alpha_composite(arch(photo('10.44.24 AM (16)'), (330, 470), border=7, color=MAROON), (590, 600))
    save(lay.convert('RGB'), os.path.join(BRAND, 'story.jpg'), 84)

    # Instagram-style grid images
    for i, name in enumerate(['10.44.24 AM (15)', '10.44.24 AM (16)', '10.44.24 AM (17)', '10.44.24 AM (19)', '10.44.24 AM (20)', '10.44.24 AM (29)']):
        save(fit(photo(name, 0.02), (600, 600)), os.path.join(BRAND, f'gram-{i+1}.jpg'), 82)

    # Logo with transparent background + favicon + OG
    logo = Image.open(os.path.join(SRC, 'logo')).convert('RGB')
    rgba = logo.convert('RGBA'); px = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, _ = px[x, y]
            dist = 255 * 3 - (r + g + b)
            a = max(0, min(255, int((dist - 12) * 3)))
            px[x, y] = (r, g, b, a)
    rgba = rgba.crop(rgba.getbbox())
    rgba.thumbnail((600, 600), Image.LANCZOS)
    rgba.save(os.path.join(BRAND, 'logo.png'), optimize=True)
    fav = logo.copy(); fav.thumbnail((256, 256), Image.LANCZOS)
    fav.save(os.path.join(ROOT, 'frontend', 'public', 'favicon.png'))
    og = pattern((1200, 630), CREAM, GOLD, alpha=40, step=70).convert('RGBA')
    l2 = rgba.copy(); l2.thumbnail((440, 440))
    og.alpha_composite(l2, (60, (630 - l2.height) // 2))
    og.alpha_composite(arch(model('10.44.24 AM (4)'), (250, 470), border=6), (600, 70))
    og.alpha_composite(arch(model('10.44.24 AM (13)'), (250, 470), border=6, color=MAROON), (880, 90))
    save(og.convert('RGB'), os.path.join(BRAND, 'og.jpg'), 84)
    print('brand done')

if __name__ == '__main__':
    random.seed(7)
    build_products()
    build_brand()

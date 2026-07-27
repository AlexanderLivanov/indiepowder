from PIL import Image, ImageDraw
import os

# фирменный фон и акцент
BG = (20, 4, 29)        # #14041d
P = (195, 33, 120)      # #c32178
INK = (20, 4, 29)

os.makedirs('public/splash', exist_ok=True)

# размеры экранов актуальных iPhone/iPad (points × dpr = px), portrait
# формат: (ширина_px, высота_px, dpr, media-описание для link)
SCREENS = [
    (1179, 2556, 3, "iPhone 15/14 Pro"),
    (1290, 2796, 3, "iPhone 15/14 Pro Max"),
    (1170, 2532, 3, "iPhone 13/14"),
    (1125, 2436, 3, "iPhone X/XS/11 Pro"),
    (1242, 2688, 3, "iPhone XS Max/11 Pro Max"),
    (828, 1792, 2, "iPhone XR/11"),
    (750, 1334, 2, "iPhone 8/SE"),
    (1536, 2048, 2, "iPad 9.7"),
    (1668, 2388, 2, "iPad Pro 11"),
    (2048, 2732, 2, "iPad Pro 12.9"),
]

def draw_logo(img, cx, cy, size):
    """ромб-логотип Dustore по центру"""
    d = ImageDraw.Draw(img)
    r = size / 2
    # внешний ромб
    d.polygon([(cx, cy-r), (cx+r, cy), (cx, cy+r), (cx-r, cy)], fill=P)
    # внутренний вырез
    ri = r * 0.52
    d.polygon([(cx, cy-ri), (cx+ri, cy), (cx, cy+ri), (cx-ri, cy)], fill=BG)
    # центральная точка
    rc = r * 0.14
    d.ellipse([cx-rc, cy-rc, cx+rc, cy+rc], fill=P)

for w, h, dpr, name in SCREENS:
    img = Image.new('RGB', (w, h), BG)
    logo = int(min(w, h) * 0.26)
    draw_logo(img, w//2, h//2, logo)
    # оба ориентации: portrait и landscape
    img.save(f'public/splash/splash-{w}x{h}.png')
    img.rotate(90, expand=True).save(f'public/splash/splash-{h}x{w}.png')

print(f'сгенерировано {len(SCREENS)*2} картинок')
import urllib.request
from PIL import Image, ImageStat
import io

assets = [
    '/assets/hero_bg_hd.jpg',
    '/assets/neon_nights_hd.jpg',
    '/assets/anime_expo_hd.jpg',
    '/assets/music_festival_hd.jpg',
    '/assets/cybertech_summit_hd.jpg',
    '/assets/cosmic_light_hd.jpg',
    '/assets/pro_gaming_hd.jpg',
    '/assets/genai_workshop_hd.jpg',
    '/assets/bot_avatar_hd.jpg',
    '/assets/user_avatar_hd.jpg',
    '/assets/gift_box_hd.jpg'
]

print(f"{'IMAGE ASSET':32} | {'STATUS':6} | {'DIMENSIONS':12} | {'WEIGHT':10} | {'BRIGHTNESS':10} | {'CONTRAST':10}")
print('-' * 90)

for path in assets:
    url = f'http://127.0.0.1:8000{path}'
    req = urllib.request.urlopen(url)
    data = req.read()
    im = Image.open(io.BytesIO(data))
    stat = ImageStat.Stat(im)
    mean_bright = sum(stat.mean[:3]) / 3
    std_contrast = sum(stat.stddev[:3]) / 3
    dim_str = f"{im.size[0]}x{im.size[1]}"
    kb_str = f"{len(data)/1024:.1f} KB"
    print(f"{path:32} | {req.getcode():6} | {dim_str:12} | {kb_str:10} | {mean_bright:10.1f} | {std_contrast:10.1f}")

print("\nAudit completed: All image assets verified live over HTTP!")

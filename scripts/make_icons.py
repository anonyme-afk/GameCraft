"""
GameCraft Studio — Icon generator
Reproduces the SVG icon design:
  • Deep dark squircle background (#1e1b2e → #0a0c13)
  • Slate geometric wings (left/right) #334155 / #1e293b
  • Rose-pink hexagonal core #fb7185 → #f43f5e → #be123c
  • White arrow/chevron symbol inside the core
  • Soft drop-shadow glow
"""
import math, os
from PIL import Image, ImageDraw, ImageFilter

def hex_to_rgba(h):
    h = h.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    return (r, g, b, 255)

def lerp_color(c1, c2, t):
    return tuple(int(c1[i]+(c2[i]-c1[i])*t) for i in range(4))

def draw_polygon_aa(draw, points, fill, outline=None, width=1):
    draw.polygon(points, fill=fill, outline=outline)

def create_icon(size=512):
    # ── 2× supersampling for smooth edges ──────────────────────────────────
    S = size * 2
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = S / 512  # reference is 512 grid

    def pt(x, y):
        return (int(x * scale), int(y * scale))

    # ── 1. Background squircle ───────────────────────────────────────────
    bg1 = hex_to_rgba("#1e1b2e")
    bg2 = hex_to_rgba("#0a0c13")
    pad = int(24 * scale)
    rad = int(108 * scale)
    # gradient fill via vertical bands
    for y in range(pad, S - pad):
        t = (y - pad) / (S - 2 * pad)
        col = lerp_color(bg1, bg2, t)
        draw.line([(pad, y), (S - pad, y)], fill=col)
    draw.rounded_rectangle(
        [pad, pad, S - pad, S - pad],
        radius=rad,
        outline=(39, 47, 69, 255),
        width=int(6 * scale)
    )
    # clip to squircle shape
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [pad, pad, S - pad, S - pad], radius=rad, fill=255
    )
    img.putalpha(mask)
    draw = ImageDraw.Draw(img)

    # ── 2. Subtle grid ──────────────────────────────────────────────────
    grid_col = (30, 41, 59, 80)
    draw.line([pt(120,256), pt(392,256)], fill=grid_col, width=int(2*scale))
    draw.line([pt(256,120), pt(256,392)], fill=grid_col, width=int(2*scale))

    # ── 3. Bottom shadow facet ──────────────────────────────────────────
    draw.polygon([pt(256,412), pt(144,340), pt(256,364), pt(368,340)],
                 fill=(15, 23, 42, 230))

    # ── 4. Left wing (slate) ─────────────────────────────────────────────
    left_pts = [pt(256,104), pt(144,172), pt(144,340), pt(256,268)]
    draw.polygon(left_pts, fill=hex_to_rgba("#334155"), outline=(71, 85, 105, 255))

    # ── 5. Right wing (dark slate) ───────────────────────────────────────
    right_pts = [pt(256,104), pt(368,172), pt(368,340), pt(256,268)]
    draw.polygon(right_pts, fill=hex_to_rgba("#1e293b"), outline=(51, 65, 85, 255))

    # ── 6. Rose hexagonal core ────────────────────────────────────────────
    core_pts = [pt(256,160), pt(336,212), pt(336,308), pt(256,360), pt(176,308), pt(176,212)]
    # Gradient simulation: draw in vertical bands
    core_top    = hex_to_rgba("#fb7185")
    core_mid    = hex_to_rgba("#f43f5e")
    core_bottom = hex_to_rgba("#be123c")
    for i in range(4):
        t0 = i / 4; t1 = (i+1) / 4
        mid_t = (t0 + t1) / 2
        if mid_t < 0.5:
            c = lerp_color(core_top, core_mid, mid_t*2)
        else:
            c = lerp_color(core_mid, core_bottom, (mid_t-0.5)*2)
        draw.polygon(core_pts, fill=c)
    draw.polygon(core_pts, fill=None, outline=None)

    # ── 7. White top chevron (play arrow) ─────────────────────────────────
    draw.polygon([pt(256,200), pt(304,276), pt(256,252), pt(208,276)],
                 fill=(255, 255, 255, 242))

    # ── 8. Dark rose bottom chevron (depth) ───────────────────────────────
    draw.polygon([pt(256,252), pt(304,276), pt(256,328), pt(208,276)],
                 fill=(136, 19, 55, 153))

    # ── 9. Specular glass line ────────────────────────────────────────────
    draw.line([pt(256,160), pt(176,212), pt(256,268)],
              fill=(255,255,255,100), width=int(3*scale), joint="curve")

    # ── Downsample with LANCZOS for AA ───────────────────────────────────
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img


def main():
    os.makedirs("assets", exist_ok=True)

    img512 = create_icon(512)
    img512.save("assets/icon.png", format="PNG")
    print("OK assets/icon.png (512x512)")

    img256 = img512.resize((256, 256), Image.Resampling.LANCZOS)
    img256.save("assets/icon-256.png", format="PNG")
    print("OK assets/icon-256.png (256x256)")

    # Multi-size ICO (256 primary)
    sizes = [(256,256),(128,128),(64,64),(48,48),(32,32),(24,24),(16,16)]
    ico_imgs = [img512.resize(s, Image.Resampling.LANCZOS) for s in sizes]
    ico_imgs[0].save(
        "assets/icon.ico",
        format="ICO",
        sizes=sizes,
        append_images=ico_imgs[1:]
    )
    print("OK assets/icon.ico (multi-size)")


if __name__ == "__main__":
    main()

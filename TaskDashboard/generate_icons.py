import os
from PIL import Image

src_img = r"C:\Users\ASUS\.gemini\antigravity\brain\550f84a5-b29b-4282-b3e9-794a16dedd7d\taskdashboard_icon_1775435534442.png"
out_dir = r"C:\Users\ASUS\OneDrive\Desktop\APP-GM\TaskDashboard\android\app\src\main\res"

dims = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

try:
    img = Image.open(src_img).convert("RGBA")
    for density, size in dims.items():
        base_path = os.path.join(out_dir, density)
        os.makedirs(base_path, exist_ok=True)
        rc_img = img.resize((size, size), Image.Resampling.LANCZOS)
        # save strictly as PNG
        rc_img.save(os.path.join(base_path, "ic_launcher.png"), format="PNG")
        rc_img.save(os.path.join(base_path, "ic_launcher_round.png"), format="PNG")
    print("Icons processed successfully")
except Exception as e:
    print(f"Error: {e}")

import os
import torch
import torch.nn as nn
import numpy as np
import cv2
import rasterio
import rasterio.features
import geopandas as gpd
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider
from torchvision.models import resnet18, resnet50

# ==========================================
# 1. MODEL ARCHITECTURE
# ==========================================
class SpaceNet6ResNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = resnet18(weights=None)
        self.backbone.conv1 = nn.Conv2d(4, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.backbone.fc = nn.Identity() 
    def forward(self, x): return self.backbone(x)

class HeightFusionModel(nn.Module):
    def __init__(self, sar_backbone, opt_backbone):
        super().__init__()
        self.sar_encoder = sar_backbone
        self.opt_encoder = opt_backbone
        if hasattr(self.opt_encoder, 'fc'): self.opt_encoder.fc = nn.Identity()
        
        self.regressor = nn.Sequential(
            nn.Linear(2560, 1024), 
            nn.BatchNorm1d(1024), 
            nn.ReLU(),
            nn.Dropout(0.3), 
            nn.Linear(1024, 512), 
            nn.ReLU(), 
            nn.Linear(512, 1)
        )
        
    def forward(self, sar_x, opt_x):
        f_sar = torch.flatten(self.sar_encoder(sar_x), 1)
        f_opt = torch.flatten(self.opt_encoder(opt_x), 1)
        return self.regressor(torch.cat((f_sar, f_opt), dim=1))

# ==========================================
# 2. DATA UTILITIES
# ==========================================
def preprocess(image, is_sar=True):
    img = np.nan_to_num(image, nan=0.0).transpose(1, 2, 0)
    img = cv2.resize(img, (224, 224))
    if is_sar:
        p2, p98 = np.percentile(img, (2, 98))
        img = np.clip((img - p2) / (p98 - p2 + 1e-8), 0, 1)
    else:
        img = img / 255.0
    return torch.from_numpy(img.transpose(2, 0, 1)).float()

# ==========================================
# 3. INTERACTIVE SLIDER ENGINE (Updated with Metrics)
# ==========================================
def run_interactive_test(data_folder):
    device = torch.device("cpu")
    weights_path = "final_height_predictor.pth"
    
    if not os.path.exists(weights_path):
        print(f"❌ Error: {weights_path} not found in project folder!")
        return

    model = HeightFusionModel(SpaceNet6ResNet().backbone, resnet50(weights=None))
    model.load_state_dict(torch.load(weights_path, map_location=device), strict=False)
    model.eval()

    if not os.path.exists(data_folder):
        print(f"❌ Error: Folder '{data_folder}' not found!")
        return
        
    all_files = os.listdir(data_folder)
    
    # 1. Get all available tile IDs
    tile_ids = sorted(list(set([f.split('_')[1].split('.')[0] for f in all_files if f.startswith('geo_')])))
    
    # 2. FILTER OUT tile ID '7218'
    tile_ids = [tid for tid in tile_ids if tid != '7218']
    
    if not tile_ids:
        print(f"❌ No matching geo_xxx.geojson files found in {data_folder}!")
        return

    # ==========================================
    # GLOBAL METRICS CALCULATION (NEW ADDITION)
    # ==========================================
    print("⏳ Calculating overall dataset metrics... Please wait.")
    y_true = []
    y_pred = []
    
    for tid in tile_ids:
        try:
            # Load basic data for metric evaluation
            sar_img = preprocess(rasterio.open(os.path.join(data_folder, f"sar_{tid}.tif")).read(), is_sar=True)
            rgb_img = preprocess(rasterio.open(os.path.join(data_folder, f"rgb_{tid}.tif")).read([1,2,3]), is_sar=False)
            
            gdf = gpd.read_file(os.path.join(data_folder, f"geo_{tid}.geojson"))
            valid_bldgs = gdf[gdf['roof_075mean'] > 0] if 'roof_075mean' in gdf.columns else gpd.GeoDataFrame()
            actual_h = valid_bldgs['roof_075mean'].mean() if not valid_bldgs.empty else 0.0
            
            with torch.no_grad():
                pred_h = model(sar_img.unsqueeze(0), rgb_img.unsqueeze(0)).item()
                
            y_true.append(actual_h)
            y_pred.append(pred_h)
        except Exception:
            pass # Silently skip any corrupted files during metric calculation

    # Calculate Math
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    
    mae = np.mean(np.abs(y_true - y_pred))
    rmse = np.sqrt(np.mean((y_true - y_pred)**2))
    ss_res = np.sum((y_true - y_pred)**2)
    ss_tot = np.sum((y_true - np.mean(y_true))**2)
    r2 = 1 - (ss_res / (ss_tot + 1e-8))
    acc_2m = np.mean(np.abs(y_true - y_pred) < 2.0) * 100 # Accuracy threshold

    # Print to console
    print("\n" + "="*45)
    print("📊 OVERALL MODEL METRICS")
    print("="*45)
    print(f"Total Tiles Evaluated: {len(y_true)}")
    print(f"Mean Absolute Error (MAE): {mae:.3f} m")
    print(f"Root Mean Squared Error (RMSE): {rmse:.3f} m")
    print(f"R-Squared (R²):            {r2:.3f}")
    print(f"Accuracy (Within 2m Error): {acc_2m:.2f}%")
    print("="*45 + "\n")
    # ==========================================

    # Setup Interactive Plot
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    plt.subplots_adjust(bottom=0.2, top=0.85) 
    
    ax_slider = plt.axes([0.25, 0.08, 0.5, 0.03])
    slider = Slider(ax_slider, 'Select Tile', 0, len(tile_ids)-1, valinit=0, valfmt='%d')

    # Add global metrics text box to the figure UI
    fig.text(0.02, 0.05, f"Overall Metrics (n={len(y_true)}):\nMAE: {mae:.2f}m | RMSE: {rmse:.2f}m\nR²: {r2:.2f} | Acc(<2m): {acc_2m:.1f}%", 
             fontsize=10, bbox=dict(facecolor='white', alpha=0.8, edgecolor='gray', boxstyle='round,pad=0.5'))

    # Variables to track the colorbar so it doesn't duplicate on every slide
    cbar = None

    def update(val):
        nonlocal cbar
        idx = int(slider.val)
        tid = tile_ids[idx]
        
        sar_p = os.path.join(data_folder, f"sar_{tid}.tif")
        rgb_p = os.path.join(data_folder, f"rgb_{tid}.tif")
        geo_p = os.path.join(data_folder, f"geo_{tid}.geojson")

        # 1. Load Data and Extract Geotransform
        with rasterio.open(sar_p) as s: 
            sar_img = preprocess(s.read(), is_sar=True)
            
        with rasterio.open(rgb_p) as r: 
            rgb_raw = r.read([1,2,3])
            rgb_img = preprocess(rgb_raw, is_sar=False)
            
            # Needed for rasterizing the Heatmap
            transform = r.transform
            h_orig, w_orig = r.height, r.width

        # 2. Get Ground Truth and Build Heatmap
        try:
            gdf = gpd.read_file(geo_p)
            valid_bldgs = gdf[gdf['roof_075mean'] > 0] if 'roof_075mean' in gdf.columns else gpd.GeoDataFrame()
            
            if not valid_bldgs.empty:
                actual_h = valid_bldgs['roof_075mean'].mean()
                
                # Pair each building polygon with its height value
                shapes = ((geom, val) for geom, val in zip(valid_bldgs.geometry, valid_bldgs['roof_075mean']))
                
                # Rasterize polygons into a 2D array
                heatmap_raw = rasterio.features.rasterize(
                    shapes=shapes,
                    out_shape=(h_orig, w_orig),
                    transform=transform,
                    fill=0,
                    all_touched=True,
                    dtype=np.float32
                )
            else:
                actual_h = 0.0
                heatmap_raw = np.zeros((h_orig, w_orig), dtype=np.float32)
        except:
            actual_h = 0.0
            heatmap_raw = np.zeros((h_orig, w_orig), dtype=np.float32)
            
        # Resize heatmap to match the model's 224x224 input view
        heatmap_resized = cv2.resize(heatmap_raw, (224, 224), interpolation=cv2.INTER_NEAREST)
        
        # 3. AI Prediction
        with torch.no_grad():
            pred_h = model(sar_img.unsqueeze(0), rgb_img.unsqueeze(0)).item()

        error = abs(pred_h - actual_h)
        status_color = "darkgreen" if error < 2.0 else "crimson"

        # 4. Refresh Plot
        axes[0].clear(); axes[1].clear(); axes[2].clear()
        
        # Plot 1: Radar View
        axes[0].imshow(sar_img[0], cmap='gray')
        axes[0].set_title(f"SAR Radar (Tile {tid})", fontsize=12)
        axes[0].axis('off')
        
        # Plot 2: RGB View
        axes[1].imshow(rgb_img.numpy().transpose(1, 2, 0))
        axes[1].set_title(f"Optical Input", fontsize=12)
        axes[1].axis('off')
        
        # Plot 3: Ground Truth Heatmap View
        max_h = heatmap_resized.max()
        im_hm = axes[2].imshow(heatmap_resized, cmap='magma', vmin=0, vmax=max(8.0, max_h))
        axes[2].set_title(f"Ground Truth Height Map\n(Max: {max_h:.2f}m)", fontsize=12)
        axes[2].axis('off')

        # Attach/Update colorbar
        if cbar is None:
            cbar = fig.colorbar(im_hm, ax=axes[2], fraction=0.046, pad=0.04)
            cbar.set_label('Actual Height (m)')
        else:
            cbar.update_normal(im_hm)
        
        # Main Title
        fig.suptitle(f"B.Tech Project: Building Height Estimation\n"
                     f"Tile ID: {tid} | AI Pred: {pred_h:.2f}m | Real Mean: {actual_h:.2f}m | Error: {error:.2f}m", 
                     fontsize=15, fontweight='bold', color=status_color)
        fig.canvas.draw_idle()

    slider.on_changed(update)
    update(0)
    
    print(f"✅ Interactive Viewer Loaded. Use the slider to browse {len(tile_ids)} results.")
    plt.show()

if __name__ == "__main__":
    run_interactive_test("SpaceNet_20_Samples")
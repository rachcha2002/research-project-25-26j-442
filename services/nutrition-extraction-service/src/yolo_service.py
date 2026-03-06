import io
import os
import torch
from PIL import Image
from ultralytics import YOLO

class YoloVisionService:
    def __init__(self):
        # 1. THE ULTIMATE ALLOWLIST (Preemptively adds all common YOLOv8 blocks)
        try:
            # PyTorch internal modules
            import torch.nn as nn
            
            # Ultralytics custom modules
            from ultralytics.nn.tasks import DetectionModel
            from ultralytics.nn.modules.conv import Conv, Concat
            from ultralytics.nn.modules.block import C2f, Bottleneck, DFL, SPPF
            from ultralytics.nn.modules.head import Detect
            
            safe_modules = [
                # Torch built-ins
                nn.modules.container.Sequential,
                nn.modules.container.ModuleList,
                nn.modules.conv.Conv2d,
                nn.modules.batchnorm.BatchNorm2d,
                nn.modules.activation.SiLU,
                nn.modules.pooling.MaxPool2d,
                nn.modules.upsampling.Upsample,
                
                # Ultralytics built-ins
                DetectionModel,
                Conv, 
                Concat, 
                C2f, 
                Bottleneck, 
                DFL, 
                SPPF, 
                Detect
            ]
            torch.serialization.add_safe_globals(safe_modules)
            print("🛡️ Added comprehensive safe globals to PyTorch serialization.")
        except Exception as e:
            print(f"⚠️ Warning adding safe globals: {e}")

        # 2. Set Path (weights folder is one level up from src/)
        weights_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "weights", "best.pt")
        
        print(f"🔍 System checking path: {weights_path}")
        
        if not os.path.exists(weights_path):
            print(f"❌ ERROR: weights file not found!")
            self.model = None
        else:
            try:
                # 3. Load the model
                self.model = YOLO(weights_path)
                print("✅ YOLOv8 Model loaded successfully.")
            except Exception as e:
                print(f"❌ YOLO Load Error: {e}")
                self.model = None

    def detect_food(self, image_bytes: bytes) -> tuple[str, float]:
        if self.model is None:
            return "Detection Unavailable", 0.0

        img = Image.open(io.BytesIO(image_bytes))
        results = self.model.predict(img, conf=0.25)
        
        if not results or len(results[0].boxes) == 0:
            return "Unknown Food", 0.0

        top_box = results[0].boxes[0]
        class_id = int(top_box.cls[0])
        conf = float(top_box.conf[0])
        label = self.model.names[class_id]
        
        return label, conf
import torch

print("PyTorch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("CUDA version:", torch.version.cuda)
    print("GPU device:", torch.cuda.get_device_name(0))
    print("GPU count:", torch.cuda.device_count())
else:
    print("No CUDA GPU detected")
    print("You may need to install PyTorch with CUDA support")
    print("Visit: https://pytorch.org/get-started/locally/")

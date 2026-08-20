import sys
from pathlib import Path

# Add data-engine directory to sys.path
data_engine_dir = Path(__file__).resolve().parent.parent
if str(data_engine_dir) not in sys.path:
    sys.path.insert(0, str(data_engine_dir))

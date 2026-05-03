import asyncio
import importlib
import io
import os
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile
from PIL import Image


class FakeModel:
    def predict(self, batch, verbose=0):
        return np.array([[0.05, 0.1, 0.7, 0.1, 0.05]], dtype=np.float32)


class SkinModelApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        service_root = Path(__file__).resolve().parents[1]
        os.environ['MODEL_DIR'] = str(service_root / 'model-artifacts')

        fake_tf = types.SimpleNamespace(
            keras=types.SimpleNamespace(
                Model=object,
                models=types.SimpleNamespace(load_model=lambda _path: FakeModel())
            )
        )

        with patch.dict(sys.modules, {'tensorflow': fake_tf}):
            if 'app' in sys.modules:
                del sys.modules['app']
            cls.skin_app = importlib.import_module('app')

    def _make_png_bytes(self):
        image = Image.new('RGB', (16, 16), color=(255, 0, 0))
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        return buffer.getvalue()

    def _upload_file(self, filename, content, content_type):
        return UploadFile(
            filename=filename,
            file=io.BytesIO(content),
            headers=Headers({'content-type': content_type}),
        )

    def test_health_endpoint_returns_service_metadata(self):
        payload = self.skin_app.health()

        self.assertEqual(payload['status'], 'healthy')
        self.assertEqual(payload['model'], 'MobileNetV2')
        self.assertGreaterEqual(payload['class_count'], 1)

    def test_predict_skin_rejects_unsupported_content_type(self):
        upload = self._upload_file('file.txt', b'not-an-image', 'text/plain')

        with self.assertRaises(HTTPException) as context:
            asyncio.run(self.skin_app.predict_skin(upload))

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail, 'Unsupported image type')

    def test_predict_skin_rejects_empty_image(self):
        upload = self._upload_file('empty.png', b'', 'image/png')

        with self.assertRaises(HTTPException) as context:
            asyncio.run(self.skin_app.predict_skin(upload))

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail, 'Empty image')

    def test_predict_skin_returns_expected_prediction_contract(self):
        upload = self._upload_file('sample.png', self._make_png_bytes(), 'image/png')
        payload = asyncio.run(self.skin_app.predict_skin(upload))

        self.assertIn('predicted_class', payload)
        self.assertIn('confidence', payload)
        self.assertIn('labels', payload)
        self.assertIn('top3', payload)
        self.assertEqual(payload['model'], 'MobileNetV2')
        self.assertEqual(len(payload['top3']), 3)


if __name__ == '__main__':
    unittest.main()

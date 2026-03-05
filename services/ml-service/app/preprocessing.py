"""
DEPRECATED — This file is not used by the inference pipeline.

Normalization at inference time is handled inside `app/inference.py` via the
pickled sklearn scalers loaded from `models/pic_scalers.pkl` and
`models/srilanka_risks.pkl`.

This file was an early design artefact that was superseded when the pickled
scalers approach was adopted. The feature lists and sequence lengths here do
NOT match the live model — do not use this for any new code.
"""

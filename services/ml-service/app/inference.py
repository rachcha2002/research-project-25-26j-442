import numpy as np
import pickle
import keras
from keras.layers import Layer
import logging
import os

logger = logging.getLogger(__name__)

@keras.saving.register_keras_serializable()
class AttentionSum(Layer):
    """Custom layer shim to allow Keras 3 to deserialize the attention mechanism"""
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    def call(self, inputs):
        return keras.ops.sum(inputs, axis=1)

class PediTrackPredictor:
    def __init__(self, models_dir='models/'):
        """
        Initialize predictor with models from models/ directory
        """
        # Ensure trailing slash if not present, though os.path.join handles it
        logger.info(f"Loading models from {models_dir}")
        self.pic_model = keras.models.load_model(os.path.join(models_dir, 'pic_growth.keras'), custom_objects={'AttentionSum': AttentionSum})
        self.risk_model = keras.models.load_model(os.path.join(models_dir, 'srilanka_risks.keras'))
        
        # Load scalers
        with open(os.path.join(models_dir, 'pic_scalers.pkl'), 'rb') as f:
            self.pic_scalers = pickle.load(f)
        
        with open(os.path.join(models_dir, 'srilanka_scalers.pkl'), 'rb') as f:
            self.risk_scalers = pickle.load(f)
        
        logger.info("✅ Models loaded successfully:")
        logger.info(f"   • pic_growth.keras")
        logger.info(f"   • srilanka_risks.keras")
        logger.info(f"   • pic_scalers.pkl")
        logger.info(f"   • srilanka_scalers.pkl")
    
    def predict(self, baby_data):
        """
        Main prediction function
        """
        num_measurements = len(baby_data.get('measurements', []))
        
        # Prepare inputs
        pic_input = self._prepare_pic_input(baby_data) if num_measurements >= 3 else None
        risk_lstm_input, risk_dnn_input = self._prepare_risk_inputs(baby_data) if num_measurements >= 2 else (None, None)
        
        # Model 1: Growth predictions (if enough data)
        # Note: Growth trajectory returns 3, 6, 12 month in Iterative predict. But here the PIC predicts single step. 
        # The prompt says: "Outputs: {'growth_trajectory': array([[height, weight, bmi]])}". Let's assume it predicts the *next* timestamp (1 step).
        if num_measurements >= 3 and pic_input is not None:
            growth_preds = self.pic_model.predict(pic_input, verbose=0)
            
            # Handle both Dictionary output and List output from Keras
            try:
                growth_val = growth_preds['growth_trajectory'][0]
            except (TypeError, KeyError):
                # If it's a list (since it outputs [growth_trajectory, risk1, risk2, ...])
                growth_val = growth_preds[0][0]
                
            # Inverse transform the standardized predictions back to physiological values
            growth_val_reshaped = np.array(growth_val).reshape(1, 3)
            unscaled_val = self.pic_scalers['anthropometric_scaler'].inverse_transform(growth_val_reshaped)[0]
                
            growth_forecast = {
                'next_height': float(unscaled_val[0]),
                'next_weight': float(unscaled_val[1]),
                'next_bmi': float(unscaled_val[2])
            }
        else:
            growth_forecast = None
        
        # Model 2: Risk assessment (if enough data)
        if num_measurements >= 2 and risk_lstm_input is not None:
            risk_preds = self.risk_model.predict(
                [risk_lstm_input, risk_dnn_input], 
                verbose=0
            )
            
            # IMPORTANT: Use indices 1-4, ignore index 0 (auxiliary output)!
            # Validate output shape to catch model retraining mismatches early.
            if not isinstance(risk_preds, (list, tuple)) or len(risk_preds) < 5:
                raise RuntimeError(
                    f"srilanka_risks model returned {len(risk_preds) if hasattr(risk_preds, '__len__') else '?'} "
                    "output tensors — expected at least 5 (1 auxiliary + 4 risk heads). "
                    "Has the model been retrained with a different output structure?"
                )
            risk_assessment = {
                'growth_disorder':        float(risk_preds[1][0][0]),
                'developmental_delay':    float(risk_preds[2][0][0]),
                'nutritional_deficiency': float(risk_preds[3][0][0]),
                'behavioral_issue':       float(risk_preds[4][0][0]),
            }
            
            # Calculate health score
            avg_risk = np.mean([
                risk_assessment['growth_disorder'],
                risk_assessment['developmental_delay'],
                risk_assessment['nutritional_deficiency'],
                risk_assessment['behavioral_issue']
            ])
            health_score = int((1 - avg_risk) * 100)
        else:
            risk_assessment = None
            health_score = None
        
        return {
            'growth_forecast': growth_forecast,
            'risk_assessment': risk_assessment,
            'health_score': health_score,
            'min_measurements_for_growth': 3,
            'min_measurements_for_risks': 2
        }
    
    def _prepare_pic_input(self, baby_data):
        measurements = baby_data.get('measurements', [])[-3:]
        
        pic_features = [
            'height_cm', 'weight_kg', 'bmi',
            'has_respiratory_condition', 'has_infection', 'chronic_disease_count',
            'on_antibiotics', 'on_steroids', 'medication_count'
        ]
        
        sequence = []
        for m in measurements:
            row = []
            for feat in pic_features:
                if feat == 'has_respiratory_condition':
                    val = m.get('has_asthma', 0)
                elif feat == 'has_infection':
                    val = 0
                elif feat == 'chronic_disease_count':
                    val = m.get('chronic_conditions_count', 0)
                elif feat == 'on_antibiotics':
                    val = 0
                elif feat == 'on_steroids':
                    val = 0
                elif feat == 'medication_count':
                    val = 1 if m.get('takes_supplements', 0) else 0
                else:
                    val = m.get(feat, 0)
                row.append(val)
            sequence.append(row)
        
        while len(sequence) < 3:
            sequence.insert(0, [0] * len(pic_features))
            
        sequence = np.array([sequence], dtype=np.float32)
        scaled_sequence = sequence.copy()
        
        anthropometric = sequence[0, :, 0:3].reshape(-1, 3)
        scaled_anthro = self.pic_scalers['anthropometric_scaler'].transform(anthropometric)
        scaled_sequence[0, :, 0:3] = scaled_anthro.reshape(3, 3)
        
        health = sequence[0, :, 3:9].reshape(-1, 6)
        scaled_health = self.pic_scalers['health_scaler'].transform(health)
        scaled_sequence[0, :, 3:9] = scaled_health.reshape(3, 6)
        
        return scaled_sequence
    
    def _prepare_risk_inputs(self, baby_data):
        measurements = baby_data.get('measurements', [])[-2:]
        
        lstm_features = [
            'age_months', 'height_cm', 'weight_kg', 'bmi', 'gender',
            'has_asthma', 'chronic_conditions_count', 'food_security', 'data_type'
        ]
        
        lstm_sequence = []
        for m in measurements:
            row = [m.get(f, 0) for f in lstm_features]
            lstm_sequence.append(row)
        
        while len(lstm_sequence) < 2:
            lstm_sequence.insert(0, [0] * len(lstm_features))
            
        lstm_array = np.array([lstm_sequence], dtype=np.float32)
        scaled_lstm = lstm_array.copy()
        
        for i, scaler in enumerate(self.risk_scalers['lstm_scalers']):
            feature_data = lstm_array[0, :, i].reshape(-1, 1)
            scaled_feature = scaler.transform(feature_data).reshape(2)
            scaled_lstm[0, :, i] = scaled_feature
            
        dnn_features = [
            'rice_adequate', 'carbs_adequate', 'protein_adequate', 'eggs_adequate',
            'dhal_adequate', 'milk_adequate', 'dairy_adequate', 'fruits_adequate',
            'vegetables_adequate', 'has_food_allergies', 'birth_weight_kg',
            'was_premature', 'immunization_complete', 'delayed_walking',
            'takes_supplements', 'adequate_sleep', 'poor_sleep_quality',
            'hospitalizations_count', 'doctor_concern_any'
        ]
        
        dnn_array = np.array([[baby_data.get(f, 0) for f in dnn_features]], dtype=np.float32)
        scaled_dnn = self.risk_scalers['dnn_scaler'].transform(dnn_array)
        
        return scaled_lstm, scaled_dnn

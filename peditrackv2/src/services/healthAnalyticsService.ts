// For Android Emulator: use 10.0.2.2
// For Physical Device: use your computer's IP address (check with ipconfig)
// Current Wi-Fi IP: 192.168.1.3
const API_BASE_URL = 'http://192.168.1.3:5001/api';

/**
 * Health Analytics Service for PediTrack v2
 * Handles communication with the health analytics microservice
 */

// ===== Type Definitions =====

export interface Baby {
    _id: string;
    accountId: string;
    userId: string;
    name: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    age: number;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    bloodType?: string;
    allergies?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MeasurementValue {
    value: number;
    unit: string;
}

export interface Measurement {
    _id?: string;
    babyId: string;
    measurementDate: string;
    height: MeasurementValue;
    weight: MeasurementValue;
    headCircumference?: MeasurementValue;
    bmi?: number;
    location?: string;
    notes?: string;
    entryMode?: 'manual' | 'photo';
    createdAt?: string;
    updatedAt?: string;
}

export interface GrowthVelocity {
    velocity: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    timeDiff: number;
}

export interface PredictionMetric {
    predicted: number;
    current: number;
    change: number;
    unit: string;
}

export interface InfluenceFactor {
    name: string;
    value: number;
}

export interface GrowthPrediction {
    timeframe: string;
    confidence: number;
    metrics: {
        height: PredictionMetric;
        weight: PredictionMetric;
    };
    influenceFactors: InfluenceFactor[];
}

export interface GrowthAnalytics {
    latest: Measurement;
    velocity: {
        height: GrowthVelocity;
        weight: GrowthVelocity;
    };
    predictions: {
        '3months': GrowthPrediction;
        '6months': GrowthPrediction;
        '12months': GrowthPrediction;
    };
    totalMeasurements: number;
}

export interface HealthRecord {
    _id?: string;
    babyId: string;
    recordDate: string;
    recordType: 'checkup' | 'illness' | 'vaccination' | 'emergency' | 'other';
    temperature?: MeasurementValue;
    symptoms?: string[];
    diagnosis?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    doctorName?: string;
    clinicName?: string;
    doctorNotes?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Medication {
    _id?: string;
    babyId: string;
    name: string;
    dosage: {
        amount: number;
        unit: string;
    };
    frequency: string;
    route: string;
    startDate: string;
    endDate?: string;
    prescribedBy?: {
        doctorName: string;
        clinicName: string;
    };
    purpose?: string;
    reminderEnabled?: boolean;
    reminderTimes?: string[];
    status?: 'active' | 'completed' | 'discontinued';
    createdAt?: string;
    updatedAt?: string;
}

export interface AIInsight {
    _id: string;
    babyId: string;
    insightType: 'growth_prediction' | 'health_alert' | 'milestone_tracking' | 'nutrition_recommendation';
    title: string;
    description: string;
    confidenceScore: number;
    severity: 'info' | 'warning' | 'urgent';
    predictions?: GrowthPrediction;
    status: 'active' | 'dismissed' | 'acted_upon' | 'expired';
    actionTaken?: string;
    actionNotes?: string;
    createdAt: string;
    updatedAt: string;
}

// ===== Baby Management =====

export const createBaby = async (babyData: Partial<Baby>): Promise<Baby> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(babyData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating baby:', error);
        throw error;
    }
};

export const getAllBabies = async (accountId?: string, userId?: string): Promise<Baby[]> => {
    try {
        const params = new URLSearchParams();
        if (accountId) params.append('accountId', accountId);
        if (userId) params.append('userId', userId);

        const response = await fetch(`${API_BASE_URL}/babies?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting babies:', error);
        throw error;
    }
};

export const getBabyById = async (babyId: string): Promise<Baby> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${babyId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting baby:', error);
        throw error;
    }
};

export const updateBaby = async (babyId: string, babyData: Partial<Baby>): Promise<Baby> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${babyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(babyData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating baby:', error);
        throw error;
    }
};

export const deleteBaby = async (babyId: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${babyId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting baby:', error);
        throw error;
    }
};

// ===== Measurements =====

export const addMeasurement = async (measurementData: Measurement): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(measurementData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding measurement:', error);
        throw error;
    }
};

export const getMeasurementsByBaby = async (babyId: string): Promise<Measurement[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting measurements:', error);
        throw error;
    }
};

export const getLatestMeasurement = async (babyId: string): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}/latest`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting latest measurement:', error);
        throw error;
    }
};

export const getGrowthAnalytics = async (babyId: string): Promise<GrowthAnalytics> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}/analytics`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting growth analytics:', error);
        throw error;
    }
};

export const updateMeasurement = async (measurementId: string, measurementData: Partial<Measurement>): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/${measurementId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(measurementData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating measurement:', error);
        throw error;
    }
};

export const deleteMeasurement = async (measurementId: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/${measurementId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting measurement:', error);
        throw error;
    }
};

// ===== Health Records =====

export const addHealthRecord = async (recordData: HealthRecord): Promise<HealthRecord> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health-records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding health record:', error);
        throw error;
    }
};

export const getHealthRecords = async (babyId: string, recordType?: string): Promise<HealthRecord[]> => {
    try {
        const params = new URLSearchParams();
        if (recordType) params.append('recordType', recordType);

        const response = await fetch(`${API_BASE_URL}/health-records/baby/${babyId}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting health records:', error);
        throw error;
    }
};

export const updateHealthRecord = async (recordId: string, recordData: Partial<HealthRecord>): Promise<HealthRecord> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health-records/${recordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating health record:', error);
        throw error;
    }
};

export const deleteHealthRecord = async (recordId: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health-records/${recordId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting health record:', error);
        throw error;
    }
};

// ===== Medications =====

export const addMedication = async (medicationData: Medication): Promise<Medication> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(medicationData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding medication:', error);
        throw error;
    }
};

export const getMedications = async (babyId: string): Promise<Medication[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/baby/${babyId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting medications:', error);
        throw error;
    }
};

export const getActiveMedications = async (babyId: string): Promise<Medication[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/baby/${babyId}/active`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting active medications:', error);
        throw error;
    }
};

export const updateMedicationStatus = async (
    medicationId: string,
    status: 'active' | 'completed' | 'discontinued'
): Promise<Medication> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/${medicationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating medication status:', error);
        throw error;
    }
};

export const updateMedication = async (medicationId: string, medicationData: Partial<Medication>): Promise<Medication> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(medicationData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating medication:', error);
        throw error;
    }
};

export const deleteMedication = async (medicationId: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting medication:', error);
        throw error;
    }
};

// ===== AI Insights =====

export const generateAIInsights = async (babyId: string): Promise<AIInsight[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/generate/${babyId}`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error generating AI insights:', error);
        throw error;
    }
};

export const getAIInsights = async (babyId: string): Promise<AIInsight[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/baby/${babyId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting AI insights:', error);
        throw error;
    }
};

export const getActiveAIInsights = async (babyId: string): Promise<AIInsight[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/baby/${babyId}/active`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting active AI insights:', error);
        throw error;
    }
};

export const getAIInsightById = async (insightId: string): Promise<AIInsight> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/${insightId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting AI insight:', error);
        throw error;
    }
};

export const updateAIInsightStatus = async (
    insightId: string,
    status: 'active' | 'dismissed' | 'acted_upon' | 'expired',
    action?: string,
    notes?: string
): Promise<AIInsight> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/${insightId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, action, notes }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating AI insight status:', error);
        throw error;
    }
};

export const deleteAIInsight = async (insightId: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/${insightId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting AI insight:', error);
        throw error;
    }
};

// ===== Health Check =====

export const checkHealthAnalyticsService = async (): Promise<boolean> => {
    try {
        const response = await fetch(`http://192.168.1.3:5001/health`);
        const data = await response.json();
        return data.status === 'OK';
    } catch (error) {
        console.error('Health analytics service health check failed:', error);
        return false;
    }
};

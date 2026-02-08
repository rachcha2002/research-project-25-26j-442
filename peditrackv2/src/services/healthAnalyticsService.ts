// For Android Emulator: use 10.0.2.2
// For Physical Device: use your computer's IP address (check with ipconfig)
// Current Wi-Fi IP: 192.168.1.153 (Updated: 2026-01-05)
const API_BASE_URL = 'http://10.72.187.59:5001/api';

/**
 * Health Analytics Service for PediTrack v2
 * Handles communication with the health-analytics-service microservice
 */

// ==================== Interfaces ====================

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

export interface Baby {
    _id?: string;
    accountId: string;
    userId: string;
    name: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    bloodType?: string;
    allergies?: string[];
    age?: number;
    isActive?: boolean;
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
    status?: 'monitoring' | 'active' | 'resolved' | 'underTreatment';
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
    _id?: string;
    babyId: string;
    insightType: 'growth_prediction' | 'health_alert' | 'milestone_tracking' | 'nutrition_recommendation';
    title: string;
    description: string;
    confidenceScore: number;
    severity: 'info' | 'warning' | 'critical';
    predictions?: GrowthPrediction;
    status?: 'active' | 'dismissed' | 'acted_upon' | 'expired';
    action?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ==================== Baby Management ====================

/**
 * Create a new baby profile
 */
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

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating baby:', error);
        throw error;
    }
};

/**
 * Get all babies for an account
 */
export const getBabies = async (accountId?: string, userId?: string): Promise<Baby[]> => {
    try {
        const params = new URLSearchParams();
        if (accountId) params.append('accountId', accountId);
        if (userId) params.append('userId', userId);

        const response = await fetch(`${API_BASE_URL}/babies?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting babies:', error);
        throw error;
    }
};

/**
 * Get baby by ID
 */
export const getBabyById = async (id: string): Promise<Baby> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting baby:', error);
        throw error;
    }
};

/**
 * Update baby profile
 */
export const updateBaby = async (id: string, babyData: Partial<Baby>): Promise<Baby> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(babyData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating baby:', error);
        throw error;
    }
};

/**
 * Delete baby profile (soft delete)
 */
export const deleteBaby = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting baby:', error);
        throw error;
    }
};

// ==================== Measurements ====================

/**
 * Add a new measurement
 */
export const addMeasurement = async (measurementData: Partial<Measurement>): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(measurementData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding measurement:', error);
        throw error;
    }
};

/**
 * Get all measurements for a baby
 */
export const getMeasurements = async (babyId: string): Promise<Measurement[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting measurements:', error);
        throw error;
    }
};

/**
 * Get latest measurement for a baby
 */
export const getLatestMeasurement = async (babyId: string): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}/latest`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting latest measurement:', error);
        throw error;
    }
};

/**
 * Get growth analytics for a baby
 */
export const getGrowthAnalytics = async (babyId: string): Promise<GrowthAnalytics> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}/analytics`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting growth analytics:', error);
        throw error;
    }
};

/**
 * Update a measurement
 */
export const updateMeasurement = async (id: string, measurementData: Partial<Measurement>): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(measurementData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating measurement:', error);
        throw error;
    }
};

/**
 * Delete a measurement
 */
export const deleteMeasurement = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting measurement:', error);
        throw error;
    }
};

// ==================== Health Records ====================

/**
 * Add a health record
 */
export const addHealthRecord = async (recordData: Partial<HealthRecord>): Promise<HealthRecord> => {
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

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding health record:', error);
        throw error;
    }
};

/**
 * Get health records for a baby
 */
export const getHealthRecords = async (babyId: string, recordType?: string): Promise<HealthRecord[]> => {
    try {
        const params = new URLSearchParams();
        if (recordType) params.append('recordType', recordType);

        const response = await fetch(`${API_BASE_URL}/health-records/baby/${babyId}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting health records:', error);
        throw error;
    }
};

/**
 * Get a single health record by ID
 */
export const getHealthRecordById = async (id: string): Promise<HealthRecord> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health-records/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting health record:', error);
        throw error;
    }
};

/**
 * Update a health record
 */
export const updateHealthRecord = async (id: string, recordData: Partial<HealthRecord>): Promise<HealthRecord> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health-records/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating health record:', error);
        throw error;
    }
};

/**
 * Delete a health record
 */
export const deleteHealthRecord = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health-records/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting health record:', error);
        throw error;
    }
};

// ==================== Medications ====================

/**
 * Add a medication
 */
export const addMedication = async (medicationData: Partial<Medication>): Promise<Medication> => {
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

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding medication:', error);
        throw error;
    }
};

/**
 * Get medications for a baby
 */
export const getMedications = async (babyId: string, activeOnly: boolean = false): Promise<Medication[]> => {
    try {
        const endpoint = activeOnly 
            ? `${API_BASE_URL}/medications/baby/${babyId}/active`
            : `${API_BASE_URL}/medications/baby/${babyId}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting medications:', error);
        throw error;
    }
};

/**
 * Update medication status
 */
export const updateMedicationStatus = async (
    id: string,
    status: 'active' | 'completed' | 'discontinued'
): Promise<Medication> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating medication status:', error);
        throw error;
    }
};

/**
 * Update a medication
 */
export const updateMedication = async (id: string, medicationData: Partial<Medication>): Promise<Medication> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(medicationData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating medication:', error);
        throw error;
    }
};

/**
 * Delete a medication
 */
export const deleteMedication = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting medication:', error);
        throw error;
    }
};

// ==================== AI Insights ====================

/**
 * Generate AI insights for a baby
 */
export const generateAIInsights = async (babyId: string): Promise<AIInsight[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/generate/${babyId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error generating AI insights:', error);
        throw error;
    }
};

/**
 * Get AI insights for a baby
 */
export const getAIInsights = async (babyId: string, activeOnly: boolean = false): Promise<AIInsight[]> => {
    try {
        const endpoint = activeOnly
            ? `${API_BASE_URL}/ai-insights/baby/${babyId}/active`
            : `${API_BASE_URL}/ai-insights/baby/${babyId}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting AI insights:', error);
        throw error;
    }
};

/**
 * Get a specific AI insight by ID
 */
export const getAIInsightById = async (id: string): Promise<AIInsight> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting AI insight:', error);
        throw error;
    }
};

/**
 * Update AI insight status
 */
export const updateAIInsightStatus = async (
    id: string, 
    status: 'active' | 'dismissed' | 'acted_upon' | 'expired',
    action?: string,
    notes?: string
): Promise<AIInsight> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, action, notes }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating AI insight status:', error);
        throw error;
    }
};

/**
 * Delete an AI insight
 */
export const deleteAIInsight = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting AI insight:', error);
        throw error;
    }
};

// ==================== Utility Functions ====================

/**
 * Check service health
 */
export const checkServiceHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        const data = await response.json();
        return data.status === 'OK';
    } catch (error) {
        console.error('Service health check failed:', error);
        return false;
    }
};

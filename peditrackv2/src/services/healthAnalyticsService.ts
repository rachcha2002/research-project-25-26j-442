// For Android Emulator: use 10.0.2.2
// For Physical Device: use your computer's IP address (check with ipconfig)
<<<<<<< Updated upstream
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
=======
// Current Wi-Fi IP: 192.168.1.179 (Updated: 2025-12-08)
const API_BASE_URL = 'http://192.168.1.179:5001/api';

/**
 * Health Analytics Service for PediTrack v2
 * Handles communication with the health-analytics-service microservice
 */

// ==================== Interfaces ====================
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
=======
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
    createdAt?: string;
    updatedAt?: string;
}

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    createdAt?: string;
    updatedAt?: string;
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    createdAt?: string;
    updatedAt?: string;
}

export interface AIInsight {
    _id: string;
=======
}

export interface AIInsight {
    _id?: string;
>>>>>>> Stashed changes
    babyId: string;
    insightType: 'growth_prediction' | 'health_alert' | 'milestone_tracking' | 'nutrition_recommendation';
    title: string;
    description: string;
    confidenceScore: number;
<<<<<<< Updated upstream
    severity: 'info' | 'warning' | 'urgent';
    predictions?: GrowthPrediction;
    status: 'active' | 'dismissed' | 'acted_upon' | 'expired';
    actionTaken?: string;
    actionNotes?: string;
    createdAt: string;
    updatedAt: string;
}

// ===== Baby Management =====

=======
    severity: 'info' | 'warning' | 'critical';
    predictions?: GrowthPrediction;
    status?: 'active' | 'dismissed' | 'acted_upon' | 'expired';
    action?: string;
    notes?: string;
}

// ==================== Baby Management ====================

/**
 * Create a new baby profile
 */
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error creating baby:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const getAllBabies = async (accountId?: string, userId?: string): Promise<Baby[]> => {
=======
/**
 * Get all babies for an account
 */
export const getBabies = async (accountId?: string, userId?: string): Promise<Baby[]> => {
>>>>>>> Stashed changes
    try {
        const params = new URLSearchParams();
        if (accountId) params.append('accountId', accountId);
        if (userId) params.append('userId', userId);

<<<<<<< Updated upstream
        const response = await fetch(`${API_BASE_URL}/babies?${params.toString()}`);
=======
        const response = await fetch(`${API_BASE_URL}/babies?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
>>>>>>> Stashed changes

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error getting babies:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const getBabyById = async (babyId: string): Promise<Baby> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${babyId}`);
=======
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
>>>>>>> Stashed changes

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error getting baby:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const updateBaby = async (babyId: string, babyData: Partial<Baby>): Promise<Baby> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${babyId}`, {
=======
/**
 * Update baby profile
 */
export const updateBaby = async (id: string, babyData: Partial<Baby>): Promise<Baby> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${id}`, {
>>>>>>> Stashed changes
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(babyData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error updating baby:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const deleteBaby = async (babyId: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/babies/${babyId}`, {
            method: 'DELETE',
=======
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
>>>>>>> Stashed changes
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting baby:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
// ===== Measurements =====

export const addMeasurement = async (measurementData: Measurement): Promise<Measurement> => {
=======
// ==================== Measurements ====================

/**
 * Add a new measurement
 */
export const addMeasurement = async (measurementData: Partial<Measurement>): Promise<Measurement> => {
>>>>>>> Stashed changes
    try {
        const response = await fetch(`${API_BASE_URL}/measurements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(measurementData),
        });

        if (!response.ok) {
<<<<<<< Updated upstream
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
=======
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error adding measurement:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const getMeasurementsByBaby = async (babyId: string): Promise<Measurement[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}`);
=======
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
>>>>>>> Stashed changes

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error getting measurements:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const getLatestMeasurement = async (babyId: string): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}/latest`);
=======
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
>>>>>>> Stashed changes

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error getting latest measurement:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const getGrowthAnalytics = async (babyId: string): Promise<GrowthAnalytics> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}/analytics`);
=======
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
>>>>>>> Stashed changes

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error getting growth analytics:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const updateMeasurement = async (measurementId: string, measurementData: Partial<Measurement>): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/${measurementId}`, {
=======
/**
 * Update a measurement
 */
export const updateMeasurement = async (id: string, measurementData: Partial<Measurement>): Promise<Measurement> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/${id}`, {
>>>>>>> Stashed changes
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(measurementData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error updating measurement:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const deleteMeasurement = async (measurementId: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/${measurementId}`, {
            method: 'DELETE',
=======
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
>>>>>>> Stashed changes
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting measurement:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
// ===== Health Records =====

export const addHealthRecord = async (recordData: HealthRecord): Promise<HealthRecord> => {
=======
// ==================== Health Records ====================

/**
 * Add a health record
 */
export const addHealthRecord = async (recordData: Partial<HealthRecord>): Promise<HealthRecord> => {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error adding health record:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
=======
/**
 * Get health records for a baby
 */
>>>>>>> Stashed changes
export const getHealthRecords = async (babyId: string, recordType?: string): Promise<HealthRecord[]> => {
    try {
        const params = new URLSearchParams();
        if (recordType) params.append('recordType', recordType);

<<<<<<< Updated upstream
        const response = await fetch(`${API_BASE_URL}/health-records/baby/${babyId}?${params.toString()}`);
=======
        const response = await fetch(`${API_BASE_URL}/health-records/baby/${babyId}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
>>>>>>> Stashed changes

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error getting health records:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
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
=======
// ==================== Medications ====================

/**
 * Add a medication
 */
export const addMedication = async (medicationData: Partial<Medication>): Promise<Medication> => {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error adding medication:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const getMedications = async (babyId: string): Promise<Medication[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/medications/baby/${babyId}`);
=======
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
>>>>>>> Stashed changes

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error getting medications:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
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

=======
// ==================== AI Insights ====================

/**
 * Generate AI insights for a baby
 */
>>>>>>> Stashed changes
export const generateAIInsights = async (babyId: string): Promise<AIInsight[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/generate/${babyId}`, {
            method: 'POST',
<<<<<<< Updated upstream
=======
            headers: {
                'Content-Type': 'application/json',
            },
>>>>>>> Stashed changes
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error generating AI insights:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
export const getAIInsights = async (babyId: string): Promise<AIInsight[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-insights/baby/${babyId}`);
=======
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
>>>>>>> Stashed changes

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error getting AI insights:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
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
=======
/**
 * Update AI insight status
 */
export const updateAIInsightStatus = async (
    id: string, 
>>>>>>> Stashed changes
    status: 'active' | 'dismissed' | 'acted_upon' | 'expired',
    action?: string,
    notes?: string
): Promise<AIInsight> => {
    try {
<<<<<<< Updated upstream
        const response = await fetch(`${API_BASE_URL}/ai-insights/${insightId}/status`, {
=======
        const response = await fetch(`${API_BASE_URL}/ai-insights/${id}/status`, {
>>>>>>> Stashed changes
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, action, notes }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< Updated upstream
        return await response.json();
=======
        const data = await response.json();
        return data;
>>>>>>> Stashed changes
    } catch (error) {
        console.error('Error updating AI insight status:', error);
        throw error;
    }
};

<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
        return false;
    }
};

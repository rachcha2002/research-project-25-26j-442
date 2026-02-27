/**
 * Health Analytics Service Helper
 * 
 * This hook wraps the healthAnalyticsService and automatically uses the selected 
 * baby from BabyContext. Import this in components instead of using the raw service.
 * 
 * Usage:
 * const { getGrowthData, addMeasurement } = useHealthAnalytics();
 * 
 * NOTE: Baby profile management (create, update, delete) is handled by BabyContext,
 * not by this hook. This hook only provides health-related data operations.
 */

import { useBaby } from '../contexts/BabyContext';
import * as healthAnalyticsService from '../services/healthAnalyticsService';

export const useHealthAnalytics = () => {
  const { selectedBaby } = useBaby();

  /**
   * Get the current baby ID or throw if none selected
   */
  const getBabyId = (): string => {
    if (!selectedBaby?._id) {
      throw new Error('No baby selected. Please select a baby profile first from the baby profiles screen.');
    }
    return selectedBaby._id;
  };

  return {
    // Measurement Operations
    addMeasurement: (data: Omit<healthAnalyticsService.Measurement, 'babyId'>) =>
      healthAnalyticsService.addMeasurement({ ...data, babyId: getBabyId() }),
    
    getMeasurements: (options?: any) =>
      healthAnalyticsService.getMeasurements(getBabyId(), options),
    
    getMeasurementById: (measurementId: string) =>
      healthAnalyticsService.getMeasurementById(getBabyId(), measurementId),
    
    updateMeasurement: (measurementId: string, data: Partial<healthAnalyticsService.Measurement>) =>
      healthAnalyticsService.updateMeasurement(getBabyId(), measurementId, data),
    
    deleteMeasurement: (measurementId: string) =>
      healthAnalyticsService.deleteMeasurement(getBabyId(), measurementId),

    // Growth Data
    getGrowthData: (options?: any) =>
      healthAnalyticsService.getGrowthData(getBabyId(), options),
    
    getGrowthPercentiles: () =>
      healthAnalyticsService.getGrowthPercentiles(getBabyId()),
    
    getGrowthChartData: (type: string, period: string) =>
      healthAnalyticsService.getGrowthChartData(getBabyId(), type, period),

    // Health Conditions
    addHealthCondition: (data: Omit<healthAnalyticsService.HealthCondition, 'babyId'>) =>
      healthAnalyticsService.addHealthCondition({ ...data, babyId: getBabyId() }),
    
    getHealthConditions: () =>
      healthAnalyticsService.getHealthConditions(getBabyId()),
    
    getHealthConditionById: healthAnalyticsService.getHealthConditionById,
    
    updateHealthCondition: healthAnalyticsService.updateHealthCondition,
    
    deleteHealthCondition: healthAnalyticsService.deleteHealthCondition,
    
    getActiveConditions: () =>
      healthAnalyticsService.getActiveConditions(getBabyId()),

    // Symptoms
    addSymptom: (data: Omit<healthAnalyticsService.Symptom, 'babyId'>) =>
      healthAnalyticsService.addSymptom({ ...data, babyId: getBabyId() }),
    
    getSymptoms: (options?: any) =>
      healthAnalyticsService.getSymptoms(getBabyId(), options),
    
    getSymptomById: healthAnalyticsService.getSymptomById,
    
    updateSymptom: healthAnalyticsService.updateSymptom,
    
    deleteSymptom: healthAnalyticsService.deleteSymptom,
    
    getSymptomsByCondition: healthAnalyticsService.getSymptomsByCondition,

    // Medications
    addMedication: (data: Omit<healthAnalyticsService.Medication, 'babyId'>) =>
      healthAnalyticsService.addMedication({ ...data, babyId: getBabyId() }),
    
    getMedications: (options?: any) =>
      healthAnalyticsService.getMedications(getBabyId(), options),
    
    getMedicationById: healthAnalyticsService.getMedicationById,
    
    updateMedication: healthAnalyticsService.updateMedication,
    
    deleteMedication: healthAnalyticsService.deleteMedication,
    
    getActiveMedications: () =>
      healthAnalyticsService.getActiveMedications(getBabyId()),

    // Vaccinations
    addVaccination: (data: Omit<healthAnalyticsService.Vaccination, 'babyId'>) =>
      healthAnalyticsService.addVaccination({ ...data, babyId: getBabyId() }),
    
    getVaccinations: () =>
      healthAnalyticsService.getVaccinations(getBabyId()),
    
    getVaccinationById: healthAnalyticsService.getVaccinationById,
    
    updateVaccination: healthAnalyticsService.updateVaccination,
    
    deleteVaccination: healthAnalyticsService.deleteVaccination,
    
    getVaccinationSchedule: () =>
      healthAnalyticsService.getVaccinationSchedule(getBabyId()),
    
    getUpcomingVaccinations: (days?: number) =>
      healthAnalyticsService.getUpcomingVaccinations(getBabyId(), days),

    // AI Insights
    getHealthInsights: () =>
      healthAnalyticsService.getHealthInsights(getBabyId()),
    
    getGrowthPredictions: () =>
      healthAnalyticsService.getGrowthPredictions(getBabyId()),
    
    getRiskAssessment: () =>
      healthAnalyticsService.getRiskAssessment(getBabyId()),
    
    getModelPerformance: healthAnalyticsService.getModelPerformance,

    // Utilities
    checkServiceHealth: healthAnalyticsService.checkServiceHealth,
    
    // Helper to get current baby ID
    getCurrentBabyId: getBabyId,
    selectedBaby,
  };
};

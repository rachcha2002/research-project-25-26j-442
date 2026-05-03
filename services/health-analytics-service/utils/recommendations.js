/**
 * utils/recommendations.js
 * Pure recommendation-engine logic extracted from routes/ai.js.
 * Kept as a standalone module so it can be unit-tested independently
 * without spinning up Express or connecting to MongoDB.
 */

/**
 * generateRecommendations
 * @param {object|null} ra  – risk_assessment from the ML service
 * @returns {Array<object>} – array of recommendation objects
 */
function generateRecommendations(ra) {
  if (!ra) return [];
  const recs = [];

  if (ra.growth_disorder > 0.6) {
    recs.push({
      priority: 'high',
      title: 'Monitor Growth',
      description: 'Schedule a consultation with a pediatrician to monitor growth trajectory.',
      icon: '📏',
      actions: ['Review height and weight percentiles', 'Book pediatrician visit'],
    });
  } else if (ra.growth_disorder > 0.3) {
    recs.push({
      priority: 'normal',
      title: 'Track Growth',
      description: 'Continue tracking height and weight monthly to ensure steady percentiles.',
      icon: '📈',
      actions: [],
    });
  }

  if (ra.nutritional_deficiency > 0.6) {
    recs.push({
      priority: 'high',
      title: 'Review Nutrition',
      description: 'Review dietary intake and ensure infant receives adequate iron and macronutrients.',
      icon: '🥦',
      actions: ['Assess daily iron intake', 'Consult pediatric nutritionist'],
    });
  } else if (ra.nutritional_deficiency > 0.3) {
    recs.push({
      priority: 'normal',
      title: 'Supplement Diet',
      description: 'Consider supplementing diet with varied nutrient-dense solid foods.',
      icon: '🥑',
      actions: [],
    });
  }

  if (ra.developmental_delay > 0.6) {
    recs.push({
      priority: 'urgent',
      title: 'Developmental Check',
      description: "Discuss developmental milestones (motor and cognitive) with your child's doctor.",
      icon: '🧠',
      actions: ['Review milestone checklist', 'Schedule developmental screening'],
    });
  }

  if (ra.behavioral_issue > 0.6) {
    recs.push({
      priority: 'high',
      title: 'Behavioral Monitoring',
      description: 'Monitor sleep quality and daily behavior patterns closely.',
      icon: '💤',
      actions: ['Keep a sleep log', 'Note any behavioral triggers'],
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: 'normal',
      title: 'Healthy Routine',
      description: 'Maintain current healthy routines and attend scheduled checkups.',
      icon: '⭐',
      actions: [],
    });
  }

  return recs;
}

module.exports = { generateRecommendations };

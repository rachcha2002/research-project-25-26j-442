/**
 * tests/recommendations.test.js
 * Unit tests for the recommendation engine.
 * No DB, no HTTP — pure logic testing.
 */
const { generateRecommendations } = require('../utils/recommendations');

// ─────────────────────────────────────────────────────────────────────────────
// NULL / EDGE INPUT
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRecommendations() — null / empty input', () => {
  it('returns [] when passed null', () => {
    expect(generateRecommendations(null)).toEqual([]);
  });

  it('returns [] when passed undefined', () => {
    expect(generateRecommendations(undefined)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALL RISKS LOW → single "Healthy Routine" card
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRecommendations() — all risks below thresholds', () => {
  const lowRisk = {
    growth_disorder: 0.1,
    developmental_delay: 0.05,
    nutritional_deficiency: 0.2,
    behavioral_issue: 0.1,
  };

  it('returns exactly one recommendation', () => {
    expect(generateRecommendations(lowRisk)).toHaveLength(1);
  });

  it('returns a "Healthy Routine" recommendation', () => {
    const recs = generateRecommendations(lowRisk);
    expect(recs[0].title).toBe('Healthy Routine');
    expect(recs[0].priority).toBe('normal');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROWTH DISORDER
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRecommendations() — growth_disorder thresholds', () => {
  it('returns "Monitor Growth" (high) when growth_disorder > 0.6', () => {
    const recs = generateRecommendations({
      growth_disorder: 0.75,
      developmental_delay: 0.1,
      nutritional_deficiency: 0.1,
      behavioral_issue: 0.1,
    });
    const rec = recs.find(r => r.title === 'Monitor Growth');
    expect(rec).toBeDefined();
    expect(rec.priority).toBe('high');
    expect(rec.actions).toContain('Book pediatrician visit');
  });

  it('returns "Track Growth" (normal) when growth_disorder is 0.31–0.60', () => {
    const recs = generateRecommendations({
      growth_disorder: 0.45,
      developmental_delay: 0.1,
      nutritional_deficiency: 0.1,
      behavioral_issue: 0.1,
    });
    const rec = recs.find(r => r.title === 'Track Growth');
    expect(rec).toBeDefined();
    expect(rec.priority).toBe('normal');
  });

  it('does NOT include a growth rec when growth_disorder <= 0.3', () => {
    const recs = generateRecommendations({
      growth_disorder: 0.3,
      developmental_delay: 0.1,
      nutritional_deficiency: 0.1,
      behavioral_issue: 0.1,
    });
    const rec = recs.find(r => r.title === 'Monitor Growth' || r.title === 'Track Growth');
    expect(rec).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITIONAL DEFICIENCY
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRecommendations() — nutritional_deficiency thresholds', () => {
  it('returns "Review Nutrition" (high) when nutritional_deficiency > 0.6', () => {
    const recs = generateRecommendations({
      growth_disorder: 0.1,
      developmental_delay: 0.1,
      nutritional_deficiency: 0.8,
      behavioral_issue: 0.1,
    });
    const rec = recs.find(r => r.title === 'Review Nutrition');
    expect(rec).toBeDefined();
    expect(rec.priority).toBe('high');
    expect(rec.actions).toContain('Assess daily iron intake');
  });

  it('returns "Supplement Diet" (normal) when nutritional_deficiency is 0.31–0.60', () => {
    const recs = generateRecommendations({
      growth_disorder: 0.1,
      developmental_delay: 0.1,
      nutritional_deficiency: 0.5,
      behavioral_issue: 0.1,
    });
    const rec = recs.find(r => r.title === 'Supplement Diet');
    expect(rec).toBeDefined();
    expect(rec.priority).toBe('normal');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DEVELOPMENTAL DELAY
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRecommendations() — developmental_delay thresholds', () => {
  it('returns "Developmental Check" with URGENT priority when delay > 0.6', () => {
    const recs = generateRecommendations({
      growth_disorder: 0.1,
      developmental_delay: 0.85,
      nutritional_deficiency: 0.1,
      behavioral_issue: 0.1,
    });
    const rec = recs.find(r => r.title === 'Developmental Check');
    expect(rec).toBeDefined();
    expect(rec.priority).toBe('urgent');
    expect(rec.actions).toContain('Schedule developmental screening');
  });

  it('does NOT add a developmental rec at exactly 0.6', () => {
    const recs = generateRecommendations({
      growth_disorder: 0.1,
      developmental_delay: 0.6,
      nutritional_deficiency: 0.1,
      behavioral_issue: 0.1,
    });
    expect(recs.find(r => r.title === 'Developmental Check')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIORAL ISSUE
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRecommendations() — behavioral_issue thresholds', () => {
  it('returns "Behavioral Monitoring" (high) when behavioral_issue > 0.6', () => {
    const recs = generateRecommendations({
      growth_disorder: 0.1,
      developmental_delay: 0.1,
      nutritional_deficiency: 0.1,
      behavioral_issue: 0.9,
    });
    const rec = recs.find(r => r.title === 'Behavioral Monitoring');
    expect(rec).toBeDefined();
    expect(rec.priority).toBe('high');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MULTIPLE RISKS ACTIVE
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRecommendations() — multiple high risks simultaneously', () => {
  const allHigh = {
    growth_disorder: 0.9,
    developmental_delay: 0.9,
    nutritional_deficiency: 0.9,
    behavioral_issue: 0.9,
  };

  it('returns 4 recommendations when all four risks are high', () => {
    expect(generateRecommendations(allHigh)).toHaveLength(4);
  });

  it('does NOT include Healthy Routine when risks are present', () => {
    const recs = generateRecommendations(allHigh);
    expect(recs.find(r => r.title === 'Healthy Routine')).toBeUndefined();
  });

  it('each recommendation has title, priority, description, icon, and actions fields', () => {
    const recs = generateRecommendations(allHigh);
    recs.forEach(rec => {
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('icon');
      expect(rec).toHaveProperty('actions');
      expect(Array.isArray(rec.actions)).toBe(true);
    });
  });
});

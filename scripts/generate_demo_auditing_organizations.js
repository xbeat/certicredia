/**
 * CPF Auditing Data Generator
 *
 * Generates realistic CPF assessment data using Field Kit structure.
 * Used by seed-perfect-cpf-data.js to populate database.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateAggregates } from '../lib/db_json.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default assessors
const ASSESSORS = ['Alice Johnson', 'Bob Smith', 'Carlo Rossi', 'Diana Chen', 'Emma Garcia'];
const CATEGORY_NAMES = {
  '1': 'Authority-Based Vulnerabilities',
  '2': 'Temporal-Based Vulnerabilities',
  '3': 'Social-Based Vulnerabilities',
  '4': 'Affective-Based Vulnerabilities',
  '5': 'Cognitive-Based Vulnerabilities',
  '6': 'Group-Based Vulnerabilities',
  '7': 'Stress-Based Vulnerabilities',
  '8': 'Unconscious-Based Vulnerabilities',
  '9': 'AI-Enhanced Vulnerabilities',
  '10': 'Convergent Vulnerabilities'
};

function randomBetween(min, max) { return Math.random() * (max - min) + min; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomChoice(array) { return array[Math.floor(Math.random() * array.length)]; }
function randomDateLastNDays(days) {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime).toISOString();
}

function generateAllIndicatorIds() {
  const indicators = [];
  for (let category = 1; category <= 10; category++) {
    for (let num = 1; num <= 10; num++) {
      indicators.push(`${category}.${num}`);
    }
  }
  return indicators;
}

function generateRandomIndicatorSubset() {
  const allIndicators = generateAllIndicatorIds();
  const numAssessments = randomInt(30, 70);
  const shuffled = allIndicators.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numAssessments);
}

function generateBayesianScore() {
  const rand = Math.random();
  if (rand < 0.2) return randomBetween(0.1, 0.3);
  else if (rand < 0.7) return randomBetween(0.3, 0.7);
  else return randomBetween(0.7, 0.95);
}

function generateConfidence() { return randomBetween(0.7, 0.95); }
function generateMaturityLevel(score) {
  if (score < 0.3) return 'green';
  if (score < 0.7) return 'yellow';
  return 'red';
}

// Cache for loaded Field Kit JSONs
const fieldKitCache = {};

function loadFieldKitForIndicator(indicatorId, language) {
  const cacheKey = `${indicatorId}_${language}`;
  if (fieldKitCache[cacheKey]) return fieldKitCache[cacheKey];

  const [categoryNum] = indicatorId.split('.');
  const categoryMap = {'1':'authority','2':'temporal','3':'social','4':'affective','5':'cognitive','6':'group','7':'stress','8':'unconscious','9':'ai','10':'convergent'};
  const categoryName = categoryMap[categoryNum];

  const fieldKitPath = path.join(__dirname, '..', 'auditor-field-kit', 'interactive', language, `${categoryNum}.x-${categoryName}`, `indicator_${indicatorId}.json`);

  try {
    if (fs.existsSync(fieldKitPath)) {
      fieldKitCache[cacheKey] = JSON.parse(fs.readFileSync(fieldKitPath, 'utf8'));
      return fieldKitCache[cacheKey];
    }
  } catch (err) {
    // Error reading file, try fallback
  }

  // Fallback to en-US if requested language not available
  if (language !== 'en-US') {
    const fallbackCacheKey = `${indicatorId}_en-US`;
    if (fieldKitCache[fallbackCacheKey]) return fieldKitCache[fallbackCacheKey];

    const fallbackPath = path.join(__dirname, '..', 'auditor-field-kit', 'interactive', 'en-US', `${categoryNum}.x-${categoryName}`, `indicator_${indicatorId}.json`);

    try {
      if (fs.existsSync(fallbackPath)) {
        fieldKitCache[fallbackCacheKey] = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        // Cache under both keys (original language and en-US)
        fieldKitCache[cacheKey] = fieldKitCache[fallbackCacheKey];
        return fieldKitCache[fallbackCacheKey];
      }
    } catch (err) {
      // Fallback also failed
    }
  }

  return null;
}

function generateRawData(indicatorId, language, targetMaturityLevel = null) {
  const fieldKit = loadFieldKitForIndicator(indicatorId, language);
  const responses = {};
  const quickAssessmentBreakdown = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  // If Field Kit doesn't exist for this language, return null
  if (!fieldKit) {
    return null;
  }

  // Determine target score range based on maturity level
  let targetScoreRange = [0, 1]; // default: any score
  if (targetMaturityLevel === 'green') {
    targetScoreRange = [0, 0.3];
  } else if (targetMaturityLevel === 'yellow') {
    targetScoreRange = [0.3, 0.7];
  } else if (targetMaturityLevel === 'red') {
    targetScoreRange = [0.7, 1.0];
  }

  // Generate responses from actual Field Kit structure and CALCULATE real score
  if (fieldKit && fieldKit.sections) {
    const quickSection = fieldKit.sections.find(s => s.id === 'quick-assessment');
    if (quickSection && quickSection.items) {
      quickSection.items.forEach(item => {
        if (item.options && item.options.length > 0) {
          // Choose option based on target maturity level
          let selectedOption;
          if (targetMaturityLevel) {
            // Filter options within target range and pick one
            const targetOptions = item.options.filter(opt =>
              opt.score >= targetScoreRange[0] && opt.score <= targetScoreRange[1]
            );
            selectedOption = targetOptions.length > 0 ? randomChoice(targetOptions) : randomChoice(item.options);
          } else {
            selectedOption = randomChoice(item.options);
          }

          responses[item.id] = selectedOption.value;

          const weight = item.weight || (1 / quickSection.items.length);
          const weightedScore = selectedOption.score * weight;

          quickAssessmentBreakdown.push({
            question: item.title,
            response: selectedOption.label,
            score: parseFloat(selectedOption.score.toFixed(4)),
            weight: parseFloat(weight.toFixed(4)),
            weighted_score: parseFloat(weightedScore.toFixed(4))
          });

          // Accumulate for weighted average (like client does)
          totalWeightedScore += weightedScore;
          totalWeight += weight;
        }
      });
    }

    // Generate some conversation responses
    const convSection = fieldKit.sections.find(s => s.id === 'client-conversation' || s.title.toLowerCase().includes('conversation'));
    if (convSection) {
      if (convSection.subsections) {
        convSection.subsections.forEach((sub, subIdx) => {
          if (sub.items) {
            sub.items.forEach((item, iIdx) => {
              if (item.type === 'question' && item.followups) {
                item.followups.forEach((followup, fIdx) => {
                  const followupId = `${item.id}_f${fIdx}`;
                  responses[followupId] = `Sample answer for: ${followup.text.substring(0, 50)}...`;
                });
              }
            });
          }
        });
      } else if (convSection.items) {
        convSection.items.forEach((item, iIdx) => {
          if (item.type === 'question' && item.followups) {
            item.followups.forEach((followup, fIdx) => {
              const followupId = `${item.id}_f${fIdx}`;
              responses[followupId] = `Sample answer for: ${followup.text.substring(0, 50)}...`;
            });
          }
        });
      }
    }
  }

  // Calculate quick_assessment as WEIGHTED AVERAGE (like client does)
  const quickAssessmentScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  // GENERATE RED FLAGS from Field Kit (like client does - client-integrated.js:1156-1207)
  const redFlags = [];
  let redFlagsScore = 0;

  // Determine red flag probability based on target maturity level
  let redFlagProbability = 0.30; // default
  if (targetMaturityLevel === 'green') {
    redFlagProbability = 0.10; // Very low chance of red flags for green
  } else if (targetMaturityLevel === 'yellow') {
    redFlagProbability = 0.30; // Medium chance for yellow
  } else if (targetMaturityLevel === 'red') {
    redFlagProbability = 0.60; // High chance for red
  }

  // Scan ALL sections and subsections to find items with severity
  if (fieldKit && fieldKit.sections) {
    fieldKit.sections.forEach((section) => {
      // Check direct items
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item) => {
          if (item.severity && item.id) {
            // Check based on target maturity level
            const isChecked = Math.random() < redFlagProbability;
            responses[item.id] = isChecked;

            if (isChecked) {
              const impact = item.score_impact || item.weight || 0.1;
              redFlagsScore += impact;
              redFlags.push({
                flag: item.label || item.title || item.description,
                impact: impact
              });
            }
          }
        });
      }

      // Check subsection items
      if (section.subsections && Array.isArray(section.subsections)) {
        section.subsections.forEach((subsection) => {
          if (subsection.items && Array.isArray(subsection.items)) {
            subsection.items.forEach((item) => {
              if (item.severity && item.id) {
                const isChecked = Math.random() < redFlagProbability;
                responses[item.id] = isChecked;

                if (isChecked) {
                  const impact = item.score_impact || item.weight || 0.1;
                  redFlagsScore += impact;
                  redFlags.push({
                    flag: item.label || item.title || item.description,
                    impact: impact
                  });
                }
              }
            });
          }
        });
      }
    });
  }

  // Cap red flags score at 1.0 (like client does)
  redFlagsScore = Math.min(redFlagsScore, 1.0);

  // Use FIXED weights like client does (NOT Field Kit weights!)
  const QUICK_WEIGHT = 0.70;
  const RED_FLAGS_WEIGHT = 0.30;

  // Calculate FINAL score using client formula
  const finalScore = (quickAssessmentScore * QUICK_WEIGHT) + (redFlagsScore * RED_FLAGS_WEIGHT);
  const maturityLevel = generateMaturityLevel(finalScore);

  const scores = {
    quick_assessment: parseFloat(quickAssessmentScore.toFixed(4)),
    conversation_depth: 0,
    red_flags: parseFloat(redFlagsScore.toFixed(4)),
    final_score: parseFloat(finalScore.toFixed(4)),
    maturity_level: maturityLevel,
    weights_used: {
      quick_assessment: QUICK_WEIGHT,
      red_flags: RED_FLAGS_WEIGHT,
      conversation_depth: 0
    }
  };

  const metadata = {
    date: randomDateLastNDays(90).split('T')[0],
    auditor: randomChoice(ASSESSORS),
    client: '',
    status: randomChoice(['completed', 'in-progress', 'review']),
    notes: `Assessment notes for indicator ${indicatorId}. Organization shows ${randomChoice(['strong', 'moderate', 'weak'])} controls.`
  };

  return {
    fieldKit: fieldKit, // Include FULL Field Kit structure for card editing
    quick_assessment: quickAssessmentBreakdown,
    client_conversation: {
      responses: responses,
      scores: scores,
      metadata: metadata,
      notes: metadata.notes,
      red_flags: redFlags
    },
    calculatedScore: finalScore // Return calculated score for assessment
  };
}

function generateAssessment(indicatorId, language) {
  // Choose target maturity level for balanced distribution (33% each)
  const rand = Math.random();
  let targetMaturityLevel;
  if (rand < 0.33) {
    targetMaturityLevel = 'green';
  } else if (rand < 0.66) {
    targetMaturityLevel = 'yellow';
  } else {
    targetMaturityLevel = 'red';
  }

  const rawData = generateRawData(indicatorId, language, targetMaturityLevel);

  // Skip this assessment if Field Kit doesn't exist for language
  if (!rawData) {
    return null;
  }

  // Use CALCULATED score from raw_data
  const bayesianScore = rawData.calculatedScore;
  const confidence = generateConfidence();
  const maturityLevel = generateMaturityLevel(bayesianScore);
  const assessor = randomChoice(ASSESSORS);
  const assessmentDate = randomDateLastNDays(90);

  // Remove calculatedScore from raw_data before saving
  const { calculatedScore, ...cleanRawData } = rawData;

  const [category] = indicatorId.split('.');
  return {
    indicator_id: indicatorId,
    title: `Indicator ${indicatorId} Title`,
    category: CATEGORY_NAMES[category],
    bayesian_score: parseFloat(bayesianScore.toFixed(4)),
    confidence: parseFloat(confidence.toFixed(4)),
    maturity_level: maturityLevel,
    assessor: assessor,
    assessment_date: assessmentDate,
    raw_data: cleanRawData
  };
}

// calculateAggregates function removed - now imported from db_json.js
// This ensures maturity model is calculated properly

function generateOrganization(orgConfig) {
  const createdAt = new Date().toISOString();
  const indicatorsToAssess = generateRandomIndicatorSubset();
  const assessments = {};

  // Generate assessments using organization's language
  for (const indicatorId of indicatorsToAssess) {
    const assessment = generateAssessment(indicatorId, orgConfig.language);
    if (assessment) {
      assessments[indicatorId] = assessment;
    }
    // Skip if Field Kit doesn't exist for this language
  }

  // Use calculateAggregates from db_json.js which includes maturity model calculation
  const aggregates = calculateAggregates(assessments, orgConfig.industry);
  const orgData = { id: orgConfig.id, name: orgConfig.name, metadata: { industry: orgConfig.industry, size: orgConfig.size, country: orgConfig.country, language: orgConfig.language, created_at: createdAt, updated_at: createdAt, created_by: orgConfig.created_by, notes: orgConfig.notes }, assessments: assessments, aggregates: aggregates };
  return orgData;
}

// Export only the core generation function
export { generateOrganization };

/**
 * Database JSON utilities
 * Provides aggregation functions for CPF assessment data
 */

/**
 * Calculate aggregates from assessment data
 * @param {Object} assessments - Object containing assessments keyed by indicator ID
 * @param {string} industry - Industry/sector for benchmarking
 * @returns {Object} Aggregated statistics and maturity model
 */
export function calculateAggregates(assessments, industry = 'General') {
  const categoryStats = {};

  // Total indicators (10 categories × 10 indicators each)
  const TOTAL_INDICATORS = 100;

  // Aggregate by category
  let totalAssessed = 0;
  let totalRiskScore = 0;
  let totalConfidence = 0;

  for (const [indicatorId, assessment] of Object.entries(assessments)) {
    const [category] = indicatorId.split('.');
    const bayesianScore = assessment.bayesian_score || 0;
    const confidence = assessment.confidence || 0.85;

    // Initialize category stats
    if (!categoryStats[category]) {
      categoryStats[category] = {
        total: 10, // Each category has 10 indicators
        assessed: 0,
        totalRisk: 0,
        totalConfidence: 0,
        values: []
      };
    }

    categoryStats[category].assessed++;
    categoryStats[category].totalRisk += bayesianScore;
    categoryStats[category].totalConfidence += confidence;
    categoryStats[category].values.push(bayesianScore);

    totalAssessed++;
    totalRiskScore += bayesianScore;
    totalConfidence += confidence;
  }

  // Calculate by_category aggregates
  const byCategory = {};
  let greenDomains = 0, yellowDomains = 0, redDomains = 0;

  for (const [cat, stats] of Object.entries(categoryStats)) {
    const avgRisk = stats.assessed > 0 ? stats.totalRisk / stats.assessed : 0;
    const avgConfidence = stats.assessed > 0 ? stats.totalConfidence / stats.assessed : 0;
    const completion = stats.total > 0 ? (stats.assessed / stats.total) * 100 : 0;

    byCategory[cat] = {
      risk: parseFloat(avgRisk.toFixed(4)),
      confidence: parseFloat(avgConfidence.toFixed(4)),
      completion: parseFloat(completion.toFixed(2)),
      assessed: stats.assessed,
      total: stats.total
    };

    // Count domain colors (for convergence index)
    if (avgRisk < 0.3) greenDomains++;
    else if (avgRisk < 0.7) yellowDomains++;
    else redDomains++;
  }

  // Calculate overall metrics
  const completionPercentage = parseFloat(((totalAssessed / TOTAL_INDICATORS) * 100).toFixed(2));
  const overallRisk = totalAssessed > 0 ? parseFloat((totalRiskScore / totalAssessed).toFixed(4)) : 0;
  const overallConfidence = totalAssessed > 0 ? parseFloat((totalConfidence / totalAssessed).toFixed(4)) : 0;

  // CPF Score: inverse of average risk (0-100 scale)
  const cpfScore = Math.round((1 - overallRisk) * 100);

  // Maturity Level (0-5 based on CPF score)
  let maturityLevel = 0;
  let levelName = 'Unaware';
  if (cpfScore >= 90) { maturityLevel = 5; levelName = 'Optimizing'; }
  else if (cpfScore >= 75) { maturityLevel = 4; levelName = 'Managed'; }
  else if (cpfScore >= 60) { maturityLevel = 3; levelName = 'Defined'; }
  else if (cpfScore >= 40) { maturityLevel = 2; levelName = 'Developing'; }
  else if (cpfScore >= 20) { maturityLevel = 1; levelName = 'Initial'; }

  // Convergence Index: measure of compounding risks
  const convergenceIndex = parseFloat((redDomains * 2 + yellowDomains * 0.5).toFixed(2));

  // Sector Benchmark (industry-specific)
  const sectorAverages = {
    'Technology': 68,
    'Finance': 72,
    'Healthcare': 70,
    'Retail': 62,
    'Education': 65,
    'Manufacturing': 63,
    'Government': 67,
    'General': 65
  };
  const sectorAverage = sectorAverages[industry] || sectorAverages['General'];
  const percentile = Math.min(99, Math.max(1, Math.round((cpfScore / 100) * 100)));
  const gap = cpfScore - sectorAverage;

  // Compliance status based on CPF score
  const complianceStatus = cpfScore >= 75 ? 'compliant' :
                          cpfScore >= 60 ? 'at_risk' : 'non_compliant';

  // Maturity Model object (comprehensive)
  const maturityModel = {
    maturity_level: maturityLevel,
    level_name: levelName,
    cpf_score: cpfScore,
    convergence_index: convergenceIndex,
    green_domains_count: greenDomains,
    yellow_domains_count: yellowDomains,
    red_domains_count: redDomains,
    sector_benchmark: {
      percentile: percentile,
      sector_average: sectorAverage,
      gap: gap
    },
    compliance: {
      gdpr: {
        status: complianceStatus,
        score: cpfScore,
        gaps: cpfScore < 75 ? ['Security awareness training', 'Incident response procedures'] : []
      },
      nis2: {
        status: complianceStatus,
        score: cpfScore,
        gaps: cpfScore < 75 ? ['Risk management', 'Supply chain security'] : []
      },
      dora: {
        status: cpfScore >= 70 ? 'compliant' : cpfScore >= 55 ? 'at_risk' : 'non_compliant',
        score: cpfScore,
        gaps: cpfScore < 70 ? ['ICT risk management', 'Digital resilience testing'] : []
      },
      iso27001: {
        status: complianceStatus,
        score: cpfScore,
        gaps: cpfScore < 75 ? ['Information security controls', 'Risk assessment'] : []
      }
    },
    certification_path: {
      current_readiness: cpfScore,
      recommended_certifications: cpfScore >= 70 ? ['ISO 27001', 'SOC 2'] : ['ISO 27001 Gap Analysis'],
      estimated_months: cpfScore >= 70 ? 6 : 12
    },
    roi_analysis: {
      risk_reduction: Math.round(cpfScore * 0.8),
      cost_savings_annual: Math.round(cpfScore * 1000),
      compliance_value: cpfScore >= 75 ? 'High' : 'Medium'
    }
  };

  return {
    by_category: byCategory,
    completion: {
      percentage: completionPercentage,
      assessed_indicators: totalAssessed
    },
    overall_risk: overallRisk,
    overall_confidence: overallConfidence,
    maturity_model: maturityModel
  };
}

// Export for CommonJS compatibility (if needed)
export default { calculateAggregates };

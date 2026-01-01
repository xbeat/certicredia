import * as auditingService from '../services/auditingService.js';
import * as organizationService from '../../organizations/services/organizationService.js';
import logger from '../../../server/utils/logger.js';

/**
 * CPF Auditing Controller
 * Handles HTTP requests for CPF auditing assessments
 */

/**
 * Transform assessment data from DB format to frontend format
 */
function transformAssessmentData(dbAssessment) {
  const assessments = {};
  const categoryStats = {};

  // Check if we have pre-calculated metadata (from seed script)
  const hasPreCalculatedData = dbAssessment.metadata &&
                                 dbAssessment.metadata.maturity_model &&
                                 dbAssessment.metadata.category_stats;

  // Transform assessment_data from "1-1" format to "1.1" format with bayesian_score
  const assessmentData = dbAssessment.assessment_data || {};

  for (const [key, data] of Object.entries(assessmentData)) {
    // Convert "1-1" to "1.1"
    const indicatorId = key.replace('-', '.');
    const category = key.split('-')[0];

    // Use raw_data from DB if available, otherwise create minimal structure
    const rawData = data.raw_data || {
      client_conversation: {
        responses: data.notes ? { note: data.notes } : {}
      }
    };

    // Use original bayesian_score from raw_data if available (more accurate)
    // Otherwise convert value (0-3) to bayesian_score (0-1) as fallback
    let bayesianScore;
    if (rawData.client_conversation?.scores?.final_score !== undefined) {
      bayesianScore = rawData.client_conversation.scores.final_score;
    } else {
      const value = data.value || 0;
      bayesianScore = value === 0 ? 0 : value / 3;
    }

    assessments[indicatorId] = {
      bayesian_score: bayesianScore,
      raw_data: rawData,
      last_updated: data.last_updated
    };

    // Aggregate by category
    if (!categoryStats[category]) {
      categoryStats[category] = {
        total: 0,
        assessed: 0,
        totalRisk: 0,
        values: []
      };
    }
    categoryStats[category].total++;
    if (value > 0) {
      categoryStats[category].assessed++;
      categoryStats[category].totalRisk += bayesianScore;
      categoryStats[category].values.push(bayesianScore);
    }
  }

  // Calculate aggregates
  const byCategory = {};
  let totalAssessed = 0;
  let totalIndicators = Object.keys(assessmentData).length;
  let totalRiskScore = 0;
  let greenDomains = 0, yellowDomains = 0, redDomains = 0;

  for (const [cat, stats] of Object.entries(categoryStats)) {
    const avgRisk = stats.assessed > 0 ? stats.totalRisk / stats.assessed : 0;
    const completion = stats.total > 0 ? (stats.assessed / stats.total) * 100 : 0;
    const avgConfidence = stats.assessed > 0 && stats.values.length > 0 ? 0.85 : 0; // Default confidence

    byCategory[cat] = {
      avg_score: avgRisk,
      completion_percentage: completion,
      total_assessments: stats.assessed,
      total: stats.total,
      avg_confidence: avgConfidence,
      // Keep legacy names for backward compatibility
      risk: avgRisk,
      completion: completion,
      assessed: stats.assessed
    };

    totalAssessed += stats.assessed;
    totalRiskScore += stats.totalRisk;

    // Count domain colors
    if (avgRisk <= 0.33) greenDomains++;
    else if (avgRisk <= 0.66) yellowDomains++;
    else redDomains++;
  }

  const completionPercentage = totalIndicators > 0 ? (totalAssessed / totalIndicators) * 100 : 0;
  const avgRisk = totalAssessed > 0 ? totalRiskScore / totalAssessed : 0;

  // CPF Score: inverse of average risk (0-100 scale)
  const cpfScore = Math.round((1 - avgRisk) * 100);

  // Maturity Level (0-5 based on CPF score)
  let maturityLevel = 0;
  let levelName = 'Unaware';
  if (cpfScore >= 90) { maturityLevel = 5; levelName = 'Optimizing'; }
  else if (cpfScore >= 75) { maturityLevel = 4; levelName = 'Managed'; }
  else if (cpfScore >= 60) { maturityLevel = 3; levelName = 'Defined'; }
  else if (cpfScore >= 40) { maturityLevel = 2; levelName = 'Developing'; }
  else if (cpfScore >= 20) { maturityLevel = 1; levelName = 'Initial'; }

  // Convergence Index: measure of compounding risks
  const convergenceIndex = redDomains * 2 + yellowDomains * 0.5;

  // Sector Benchmark (simulated)
  const sectorAverage = 65; // Industry average
  const percentile = Math.min(99, Math.max(1, Math.round((cpfScore / 100) * 100)));
  const gap = cpfScore - sectorAverage;

  // Compliance status based on CPF score
  const complianceStatus = cpfScore >= 75 ? 'compliant' :
                          cpfScore >= 60 ? 'at_risk' : 'non_compliant';

  // Use pre-calculated data if available, otherwise use calculated data
  let finalMaturityModel;
  let finalByCategory;
  let finalCompletion;

  if (hasPreCalculatedData) {
    // Use pre-calculated metadata from seed script
    finalMaturityModel = dbAssessment.metadata.maturity_model;

    // Transform category_stats to by_category format with frontend-expected field names
    finalByCategory = {};
    for (const [cat, stats] of Object.entries(dbAssessment.metadata.category_stats)) {
      finalByCategory[cat] = {
        avg_score: stats.risk || stats.avg_score || 0,
        completion_percentage: stats.completion || stats.completion_percentage || 0,
        total_assessments: stats.assessed || stats.total_assessments || 0,
        total: stats.total || 10,
        avg_confidence: stats.avg_confidence || 0.85,
        // Keep legacy names for backward compatibility
        risk: stats.risk || stats.avg_score || 0,
        completion: stats.completion || stats.completion_percentage || 0,
        assessed: stats.assessed || stats.total_assessments || 0
      };
    }

    finalCompletion = {
      percentage: dbAssessment.metadata.completion_percentage || 0,
      assessed_indicators: dbAssessment.metadata.assessed_indicators || 0
    };
  } else {
    // Use calculated data (legacy/fallback)
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

    finalMaturityModel = maturityModel;
    finalByCategory = byCategory;
    finalCompletion = {
      percentage: completionPercentage,
      assessed_indicators: totalAssessed
    };
  }

  return {
    id: dbAssessment.organization_id,
    name: dbAssessment.organization_name,
    organization_type: dbAssessment.organization_type,
    status: dbAssessment.organization_status,
    assessments,
    aggregates: {
      by_category: finalByCategory,
      completion: finalCompletion,
      maturity_model: finalMaturityModel
    },
    metadata: dbAssessment.metadata || { language: 'it-IT' },
    created_at: dbAssessment.created_at,
    updated_at: dbAssessment.updated_at
  };
}

/**
 * @route   GET /api/auditing/organizations
 * @desc    Get all organizations with their assessments
 * @access  Private
 */
export async function getAllOrganizationsWithAssessments(req, res) {
  try {
    // Get all organizations
    const result = await organizationService.getAllOrganizations({ limit: 1000 });

    // For each organization, get its assessment and transform data
    const organizationsWithAssessments = await Promise.all(
      result.organizations.map(async (org) => {
        const assessment = await auditingService.getAssessmentByOrganization(org.id);

        if (assessment) {
          const transformedData = transformAssessmentData(assessment);

          // Add organization fields and stats object for frontend compatibility
          return {
            ...transformedData,
            industry: org.industry || org.metadata?.industry || 'Other',
            size: org.size || org.metadata?.size || 'medium',
            country: org.country || 'Italia',
            language: transformedData.metadata?.language || 'it-IT',
            stats: {
              completion_percentage: transformedData.aggregates?.completion?.percentage || 0,
              overall_risk: transformedData.aggregates?.maturity_model?.convergence_index
                ? transformedData.aggregates.maturity_model.convergence_index / 10
                : 0,
              total_assessments: transformedData.aggregates?.completion?.assessed_indicators || 0,
              avg_confidence: 0.85 // Default confidence value
            }
          };
        } else {
          // Return organization with empty assessment
          return {
            id: org.id,
            name: org.name,
            organization_type: org.organization_type,
            status: org.status,
            industry: org.industry || org.metadata?.industry || 'Other',
            size: org.size || org.metadata?.size || 'medium',
            country: org.country || 'Italia',
            language: 'it-IT',
            assessments: {},
            aggregates: {
              by_category: {},
              completion: { percentage: 0, assessed_indicators: 0 }
            },
            stats: {
              completion_percentage: 0,
              overall_risk: 0,
              total_assessments: 0,
              avg_confidence: 0
            },
            metadata: { language: 'it-IT' },
            created_at: org.created_at,
            updated_at: org.updated_at
          };
        }
      })
    );

    res.json({
      success: true,
      organizations: organizationsWithAssessments
    });
  } catch (error) {
    logger.error('Error getting all organizations with assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizations',
      error: error.message
    });
  }
}

/**
 * @route   GET /api/auditing/organizations/:organizationId
 * @desc    Get assessment for a specific organization
 * @access  Private
 */
export async function getOrganizationAssessment(req, res) {
  try {
    const { organizationId } = req.params;
    const assessment = await auditingService.getAssessmentByOrganization(parseInt(organizationId));

    // Always get organization data for additional fields
    const org = await organizationService.getOrganizationById(parseInt(organizationId));

    if (!assessment) {
      // If no assessment exists, return organization basic data with empty assessments
      return res.json({
        success: true,
        data: {
          id: org.id,
          name: org.name,
          organization_type: org.organization_type,
          status: org.status,
          industry: org.industry || org.metadata?.industry || 'Other',
          size: org.size || org.metadata?.size || 'medium',
          country: org.country || 'Italia',
          language: 'it-IT',
          assessments: {},
          aggregates: {
            by_category: {},
            completion: { percentage: 0, assessed_indicators: 0 }
          },
          stats: {
            completion_percentage: 0,
            overall_risk: 0,
            total_assessments: 0,
            avg_confidence: 0
          },
          metadata: { language: 'it-IT' },
          created_at: org.created_at,
          updated_at: org.updated_at
        }
      });
    }

    // Transform assessment data to frontend format
    const transformedData = transformAssessmentData(assessment);

    // Add organization fields and stats for frontend compatibility
    const enrichedData = {
      ...transformedData,
      industry: org.industry || org.metadata?.industry || 'Other',
      size: org.size || org.metadata?.size || 'medium',
      country: org.country || 'Italia',
      language: transformedData.metadata?.language || 'it-IT',
      stats: {
        completion_percentage: transformedData.aggregates?.completion?.percentage || 0,
        overall_risk: transformedData.aggregates?.maturity_model?.convergence_index
          ? transformedData.aggregates.maturity_model.convergence_index / 10
          : 0,
        total_assessments: transformedData.aggregates?.completion?.assessed_indicators || 0,
        avg_confidence: 0.85
      }
    };

    res.json({
      success: true,
      data: enrichedData
    });
  } catch (error) {
    logger.error('Error getting organization assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment',
      error: error.message
    });
  }
}

/**
 * @route   GET /api/auditing/assessments
 * @desc    Get all assessments
 * @access  Private (admin)
 */
export async function getAllAssessments(req, res) {
  try {
    const { limit, offset, includeDeleted } = req.query;
    const filters = {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      includeDeleted: includeDeleted === 'true'
    };

    const assessments = await auditingService.getAllAssessments(filters);

    res.json({
      success: true,
      data: assessments,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: assessments.length
      }
    });
  } catch (error) {
    logger.error('Error getting all assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessments',
      error: error.message
    });
  }
}

/**
 * @route   POST /api/auditing/organizations/:organizationId
 * @desc    Create assessment for an organization
 * @access  Private
 */
export async function createOrganizationAssessment(req, res) {
  try {
    const { organizationId } = req.params;
    const { assessmentData = {}, metadata = {} } = req.body;

    const assessment = await auditingService.createAssessment(
      parseInt(organizationId),
      assessmentData,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });
  } catch (error) {
    logger.error('Error creating assessment:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create assessment',
      error: error.message
    });
  }
}

/**
 * @route   PUT /api/auditing/organizations/:organizationId
 * @desc    Update assessment for an organization
 * @access  Private
 */
export async function updateOrganizationAssessment(req, res) {
  try {
    const { organizationId } = req.params;
    const { assessmentData, metadata } = req.body;

    if (!assessmentData) {
      return res.status(400).json({
        success: false,
        message: 'Assessment data is required'
      });
    }

    const assessment = await auditingService.updateAssessment(
      parseInt(organizationId),
      assessmentData,
      metadata
    );

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment
    });
  } catch (error) {
    logger.error('Error updating assessment:', error);

    if (error.message === 'Assessment not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update assessment',
      error: error.message
    });
  }
}

/**
 * @route   DELETE /api/auditing/organizations/:organizationId
 * @desc    Soft delete assessment (move to trash)
 * @access  Private
 */
export async function deleteOrganizationAssessment(req, res) {
  try {
    const { organizationId } = req.params;
    const assessment = await auditingService.softDeleteAssessment(parseInt(organizationId));

    res.json({
      success: true,
      message: 'Assessment moved to trash',
      data: assessment
    });
  } catch (error) {
    logger.error('Error deleting assessment:', error);

    if (error.message === 'Assessment not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete assessment',
      error: error.message
    });
  }
}

/**
 * @route   POST /api/auditing/organizations/:organizationId/restore
 * @desc    Restore assessment from trash
 * @access  Private
 */
export async function restoreOrganizationAssessment(req, res) {
  try {
    const { organizationId } = req.params;
    const assessment = await auditingService.restoreAssessment(parseInt(organizationId));

    res.json({
      success: true,
      message: 'Assessment restored successfully',
      data: assessment
    });
  } catch (error) {
    logger.error('Error restoring assessment:', error);

    if (error.message === 'Deleted assessment not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to restore assessment',
      error: error.message
    });
  }
}

/**
 * @route   DELETE /api/auditing/organizations/:organizationId/permanent
 * @desc    Permanently delete assessment
 * @access  Private (admin)
 */
export async function permanentlyDeleteAssessment(req, res) {
  try {
    const { organizationId } = req.params;
    const deleted = await auditingService.permanentlyDeleteAssessment(parseInt(organizationId));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assessment permanently deleted'
    });
  } catch (error) {
    logger.error('Error permanently deleting assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete assessment',
      error: error.message
    });
  }
}

/**
 * @route   GET /api/auditing/trash
 * @desc    Get deleted assessments (trash)
 * @access  Private
 */
export async function getTrash(req, res) {
  try {
    const deletedAssessments = await auditingService.getDeletedAssessments();

    res.json({
      success: true,
      data: deletedAssessments
    });
  } catch (error) {
    logger.error('Error getting trash:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve deleted assessments',
      error: error.message
    });
  }
}

/**
 * @route   GET /api/auditing/statistics
 * @desc    Get assessment statistics
 * @access  Private
 */
export async function getStatistics(req, res) {
  try {
    const stats = await auditingService.getAssessmentStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
}

export default {
  getAllOrganizationsWithAssessments,
  getOrganizationAssessment,
  getAllAssessments,
  createOrganizationAssessment,
  updateOrganizationAssessment,
  deleteOrganizationAssessment,
  restoreOrganizationAssessment,
  permanentlyDeleteAssessment,
  getTrash,
  getStatistics
};

import {
  registerSpecialistCandidate,
  generateExam,
  submitExam,
  addCPERecord,
  getSpecialistDashboard
} from '../services/specialistService.js';
import logger from '../../../core/utils/logger.js';

export const registerCandidate = async (req, res) => {
  try {
    const profile = await registerSpecialistCandidate(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Registrazione specialist completata. Ora puoi sostenere l\'esame.',
      data: profile
    });
  } catch (error) {
    logger.error('Error registering specialist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startExam = async (req, res) => {
  try {
    const exam = await generateExam(req.user.id);

    res.json({
      success: true,
      message: 'Esame generato. Hai 120 minuti per completarlo.',
      data: exam
    });
  } catch (error) {
    logger.error('Error starting exam:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitExamHandler = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    const result = await submitExam(attemptId, answers, req.user.id);

    res.json({
      success: true,
      message: result.passed ? '🎉 Congratulazioni! Hai superato l\'esame!' : 'Esame non superato. Riprova.',
      data: result
    });
  } catch (error) {
    logger.error('Error submitting exam:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addCPE = async (req, res) => {
  try {
    const cpe = await addCPERecord(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Attività CPE registrata con successo',
      data: cpe
    });
  } catch (error) {
    logger.error('Error adding CPE:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const dashboard = await getSpecialistDashboard(req.user.id);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error getting dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

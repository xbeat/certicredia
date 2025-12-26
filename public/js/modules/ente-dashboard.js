// Ente Dashboard Module
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

let state = {
  user: null,
  organization: null,
  assessment: null,
  responses: {},
  currentQuestionId: null
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadUser();
  await loadAssessment();
  setupEventListeners();
}

// Load user and organization
async function loadUser() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth.html';
      return;
    }

    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Session expired');

    const data = await res.json();
    state.user = data.data;

    document.getElementById('orgName').textContent = state.user.company || state.user.name;
  } catch (error) {
    console.error('Error loading user:', error);
    localStorage.removeItem('token');
    window.location.href = '/auth.html';
  }
}

// Load or create assessment
async function loadAssessment() {
  try {
    const token = localStorage.getItem('token');

    // Try to get existing assessment
    const res = await fetch(`${API_BASE}/assessments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (data.data && data.data.length > 0) {
      state.assessment = data.data[0];
    } else {
      // Create new assessment
      const createRes = await fetch(`${API_BASE}/assessments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: 1, // TODO: Get from user profile
          templateId: 1 // TODO: Get active template
        })
      });

      const createData = await createRes.json();
      state.assessment = createData.data;
    }

    state.responses = state.assessment.responses || {};
    updateUI();
    renderAssessmentContent();

  } catch (error) {
    console.error('Error loading assessment:', error);
    notify('Errore caricamento assessment', 'error');
  }
}

// Render assessment content (demo structure)
function renderAssessmentContent() {
  const container = document.getElementById('assessmentContent');

  // Demo: Simple assessment structure
  const demoQuestions = [
    { id: 'q1', section: 'Governance', text: 'La vostra organizzazione dispone di una politica di sicurezza informatica documentata e approvata?' },
    { id: 'q2', section: 'Governance', text: 'Esiste un responsabile della sicurezza informatica designato?' },
    { id: 'q3', section: 'Risk Management', text: 'Viene effettuata una valutazione del rischio annuale?' },
    { id: 'q4', section: 'Risk Management', text: 'I rischi identificati sono documentati e tracciati?' },
    { id: 'q5', section: 'Access Control', text: 'Esiste una procedura per la gestione degli accessi?' }
  ];

  let html = '<div class="space-y-6">';

  let currentSection = '';
  demoQuestions.forEach((q, index) => {
    if (q.section !== currentSection) {
      if (currentSection) html += '</div>';
      html += `<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">${q.section}</h3>`;
      currentSection = q.section;
    }

    const savedAnswer = state.responses[q.id] || '';

    html += `
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          ${index + 1}. ${q.text}
        </label>
        <textarea
          id="answer-${q.id}"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          rows="3"
          placeholder="Inserisci la tua risposta..."
          data-question-id="${q.id}"
        >${savedAnswer}</textarea>
        <div class="mt-2 flex items-center space-x-2">
          <button onclick="uploadEvidence('${q.id}')" class="text-sm text-cyan-600 hover:text-cyan-800">
            📎 Carica Evidence
          </button>
          <span id="evidence-count-${q.id}" class="text-xs text-gray-500"></span>
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  container.innerHTML = html;

  // Add change listeners
  document.querySelectorAll('textarea[data-question-id]').forEach(textarea => {
    textarea.addEventListener('change', (e) => {
      const questionId = e.target.dataset.questionId;
      state.responses[questionId] = e.target.value;
      updateProgress();
    });
  });

  updateProgress();
}

// Update UI
function updateUI() {
  const statusMap = {
    'draft': 'Bozza',
    'in_progress': 'In Lavorazione',
    'submitted': 'Inviato',
    'under_review': 'In Revisione',
    'modification_requested': 'Modifica Richiesta',
    'approved': 'Approvato',
    'rejected': 'Rifiutato'
  };

  document.getElementById('assessmentStatus').textContent = statusMap[state.assessment.status] || 'Sconosciuto';
  document.getElementById('completionPercentage').textContent = `${state.assessment.completion_percentage || 0}%`;

  // Enable/disable buttons based on status
  const canEdit = ['draft', 'in_progress', 'modification_requested'].includes(state.assessment.status);
  document.getElementById('submitBtn').disabled = !canEdit || (state.assessment.completion_percentage || 0) < 80;
}

// Update progress
function updateProgress() {
  const totalQuestions = 5; // Demo
  const answeredQuestions = Object.keys(state.responses).filter(k => state.responses[k].trim()).length;
  const percentage = Math.round((answeredQuestions / totalQuestions) * 100);

  document.getElementById('progressText').textContent = `${answeredQuestions}/${totalQuestions}`;
  document.getElementById('progressBar').style.width = `${percentage}%`;
  document.getElementById('completionPercentage').textContent = `${percentage}%`;

  state.assessment.completion_percentage = percentage;
}

// Save draft
async function saveDraft() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE}/assessments/${state.assessment.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        responses: state.responses,
        completion_percentage: state.assessment.completion_percentage
      })
    });

    if (!res.ok) throw new Error('Save failed');

    notify('Bozza salvata con successo', 'success');
  } catch (error) {
    console.error('Error saving:', error);
    notify('Errore durante il salvataggio', 'error');
  }
}

// Submit for review
async function submitForReview() {
  if (!confirm('Sei sicuro di voler inviare l\'assessment per la revisione? Non potrai più modificarlo.')) return;

  try {
    const token = localStorage.getItem('token');

    await saveDraft(); // Save first

    const res = await fetch(`${API_BASE}/assessments/${state.assessment.id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'submitted' })
    });

    if (!res.ok) throw new Error('Submit failed');

    notify('Assessment inviato per revisione!', 'success');
    setTimeout(() => window.location.reload(), 1500);

  } catch (error) {
    console.error('Error submitting:', error);
    notify('Errore durante l\'invio', 'error');
  }
}

// Generate specialist token
async function generateToken() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE}/assessments/${state.assessment.id}/assign-token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    document.getElementById('tokenCode').textContent = data.data.token;
    document.getElementById('tokenModal').classList.remove('hidden');

  } catch (error) {
    console.error('Error generating token:', error);
    notify('Errore generazione token', 'error');
  }
}

// Upload evidence
window.uploadEvidence = function(questionId) {
  state.currentQuestionId = questionId;
  document.getElementById('fileInput').click();
};

// Setup event listeners
function setupEventListeners() {
  document.getElementById('saveBtn').addEventListener('click', saveDraft);
  document.getElementById('submitBtn').addEventListener('click', submitForReview);
  document.getElementById('generateTokenBtn').addEventListener('click', generateToken);

  document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', handleFileUpload);

  document.getElementById('copyTokenBtn').addEventListener('click', () => {
    const token = document.getElementById('tokenCode').textContent;
    navigator.clipboard.writeText(token);
    notify('Token copiato!', 'success');
  });

  document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('tokenModal').classList.add('hidden');
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/auth.html';
  });
}

// Handle file upload
async function handleFileUpload(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  const token = localStorage.getItem('token');

  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assessmentId', state.assessment.id);
    formData.append('organizationId', 1); // TODO
    formData.append('questionId', state.currentQuestionId || 'general');

    try {
      const res = await fetch(`${API_BASE}/evidence`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      notify(`File "${file.name}" caricato`, 'success');
    } catch (error) {
      console.error('Upload error:', error);
      notify(`Errore upload "${file.name}"`, 'error');
    }
  }

  e.target.value = ''; // Reset
}

// Notification helper
function notify(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

import apiService from '../apiService';

const testAPIService = {
  // Test Management
  getAllPublicTests: () => apiService.get('/tests/public'),
  getAllTests: () => apiService.get('/tests'),
  createTest: (testData) => apiService.post('/tests', testData),
  getTestById: (id) => apiService.get(`/tests/${id}`),
  updateTest: (id, testData) => apiService.put(`/tests/${id}`, testData),
  deleteTest: (id) => apiService.delete(`/tests/${id}`),

  // MCQ Management
  addMCQs: (testId, mcqs) => apiService.post(`/tests/${testId}/mcqs`, mcqs),
  updateMCQ: (testId, mcqId, mcqData) => 
    apiService.put(`/tests/${testId}/mcq/${mcqId}`, mcqData),
  deleteMCQ: (testId, mcqId) => 
    apiService.delete(`/tests/${testId}/mcq/${mcqId}`),

  // Coding Challenge Management
  addCodingChallenges: (testId, challenges) => 
    apiService.post(`/tests/${testId}/coding-challenges`, challenges),
  updateCodingChallenge: (testId, challengeId, challengeData) => 
    apiService.put(`/tests/${testId}/coding/${challengeId}`, challengeData),
  deleteCodingChallenge: (testId, challengeId) => 
    apiService.delete(`/tests/${testId}/coding/${challengeId}`),

  // Test Case Management
  addTestCase: (testId, challengeId, testCase) => 
    apiService.post(`/tests/${testId}/coding/${challengeId}/testcase`, testCase),
  updateTestCase: (testId, challengeId, testCaseId, testCaseData) => 
    apiService.put(`/tests/${testId}/coding/${challengeId}/testcase/${testCaseId}`, testCaseData),
  deleteTestCase: (testId, challengeId, testCaseId) => 
    apiService.delete(`/tests/${testId}/coding/${challengeId}/testcase/${testCaseId}`),

  // Test Operations
  publishTest: (testId) => apiService.post(`/tests/${testId}/publish`),
  getTestByUUID: (uuid) => apiService.get(`/tests/${uuid}/take`),
  shareTest: (id, emailData) => apiService.post(`/tests/${id}/share`, emailData),
  verifyInvitation: (invitationData) => 
    apiService.post('/tests/invitations/verify', invitationData),
  updateVisibility: (testId, visibilityData) => 
    apiService.patch(`/tests/${testId}/visibility`, visibilityData),
  registerForTest: (testId, registrationData) => 
    apiService.post(`/tests/${testId}/register`, registrationData),

  // Test Session Management
  startTestSession: (sessionData) => 
    apiService.post('/tests/sessions/start', sessionData),
  endTestSession: (sessionId) => 
    apiService.post(`/tests/sessions/${sessionId}/end`),
  updateSessionStatus: (sessionId, statusData) => 
    apiService.post(`/tests/sessions/${sessionId}/status`, statusData),
};

export default testAPIService;

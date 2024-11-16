import testAPIService from './testAPIService';

export const getTestById = async (id) => {
  return await testAPIService.getTestById(id);
};

export const submitTest = async (testId, answers) => {
  return await testAPIService.submitTest(testId, answers);
};

export const createTest = async (testData) => {
  return await testAPIService.createTest(testData);
};

export const updateTest = async (id, testData) => {
  return await testAPIService.updateTest(id, testData);
};

export const deleteTest = async (id) => {
  return await testAPIService.deleteTest(id);
};  

export const addMCQs = async (testId, mcqs) => {
  return await testAPIService.addMCQs(testId, mcqs);
};

export const updateMCQ = async (testId, mcqId, mcqData) => {
  return await testAPIService.updateMCQ(testId, mcqId, mcqData);
};

export const deleteMCQ = async (testId, mcqId) => {
  return await testAPIService.deleteMCQ(testId, mcqId);
};  

export const getVendorTests = async () => {
  return await testAPIService.getVendorTests();
};  

export const getAdminTests = async () => {
  return await testAPIService.getAdminTests();
};

export const getUserTests = async () => {
  return await testAPIService.getUserTests();
};  

export const getTestResults = async (testId) => {
  return await testAPIService.getTestResults(testId);
};

export const shareTest = async (id, emailData) => {
  return await testAPIService.shareTest(id, emailData);
};  

export const verifyInvitation = async (invitationData) => {
  return await testAPIService.verifyInvitation(invitationData);
};  

export const updateVisibility = async (testId, visibilityData) => {
  return await testAPIService.updateVisibility(testId, visibilityData);
};    

export const registerForTest = async (testId, registrationData) => {
  return await testAPIService.registerForTest(testId, registrationData);
};

export const startTestSession = async (sessionData) => {
  return await testAPIService.startTestSession(sessionData);
};  

export const endTestSession = async (sessionId) => {
  return await testAPIService.endTestSession(sessionId);
};

export const updateSessionStatus = async (sessionId, statusData) => {
  return await testAPIService.updateSessionStatus(sessionId, statusData);
};

export const getSessionResults = async (sessionId) => {
  return await testAPIService.getSessionResults(sessionId);
};

export const getSessionQuestions = async (sessionId) => {
  return await testAPIService.getSessionQuestions(sessionId);
};

export const getSessionAnswers = async (sessionId) => {
  return await testAPIService.getSessionAnswers(sessionId);
};  

export const getAllPublicTests = async () => {
  return await testAPIService.getAllPublicTests();
};

export const getAllTests = async () => {
  return await testAPIService.getAllTests();
};

export const addCodingChallenges = async (testId, challenges) => {
  return await testAPIService.addCodingChallenges(testId, challenges);
};

export const updateCodingChallenge = async (testId, challengeId, challengeData) => {
  return await testAPIService.updateCodingChallenge(testId, challengeId, challengeData);
};

export const deleteCodingChallenge = async (testId, challengeId) => {
  return await testAPIService.deleteCodingChallenge(testId, challengeId);
};

export const addTestCase = async (testId, challengeId, testCase) => {
  return await testAPIService.addTestCase(testId, challengeId, testCase);
};

export const updateTestCase = async (testId, challengeId, testCaseId, testCaseData) => {
  return await testAPIService.updateTestCase(testId, challengeId, testCaseId, testCaseData);
};

export const deleteTestCase = async (testId, challengeId, testCaseId) => {
  return await testAPIService.deleteTestCase(testId, challengeId, testCaseId);
};

export const publishTest = async (testId) => {
  return await testAPIService.publishTest(testId);
};

export const getTestByUUID = async (uuid) => {
  return await testAPIService.getTestByUUID(uuid);
};





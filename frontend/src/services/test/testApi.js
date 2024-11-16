import apiService from '../apiService';

export const getTests = async () => {
  return await apiService.get('/tests');
};

export const getTestById = async (id) => {
  return await apiService.get(`/tests/${id}`);
};

export const submitTest = async (testId, answers) => {
  return await apiService.post(`/tests/${testId}/submit`, { answers });
};

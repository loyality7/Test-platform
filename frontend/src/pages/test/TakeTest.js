import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getMethod, postMethod } from '../../helpers';
import MCQSection from './components/MCQSection';
import CodingSection from './components/CodingSection';

export default function TakeTest() {
  const [test, setTest] = useState(null);
  const [currentSection, setCurrentSection] = useState('mcq');
  const [answers, setAnswers] = useState({
    mcq: {},
    coding: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { uuid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get('session');

  console.log('=== URL Parameters ===', {
    fullPath: location.pathname,
    searchParams: location.search,
    uuid: uuid,
    rawUrl: window.location.href
  });

  useEffect(() => {
    const loadTest = async () => {
      console.log('=== Starting loadTest function ===');
      console.log('UUID from params:', uuid);
      
      // Extract session ID from URL query parameters
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get('session');
      console.log('Session ID from URL:', sessionId);

      try {
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        
        if (!token) {
          console.log('No token found, redirecting to login...');
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
          return;
        }

        if (!uuid) {
          console.error('No UUID provided in URL');
          setError('Test ID is missing');
          setLoading(false);
          return;
        }

        const endpoint = sessionId 
          ? `tests/${uuid}/take?session=${sessionId}`
          : `tests/${uuid}/take`;
        console.log('Calling endpoint:', endpoint);
        
        console.log('Making API request...');
        const response = await getMethod(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Raw API response:', response);
        console.log('Response data:', response?.data);
        console.log('Nested test data:', response?.data?.data);
        
        if (response?.data?.data) {
          console.log('Test data structure:', {
            title: response.data.data.title,
            mcqs: response.data.data.mcqs?.length,
            codingChallenges: response.data.data.codingChallenges?.length
          });
          
          setTest(response.data.data);
          console.log('Test state updated successfully');
          setError(null);
        } else {
          console.error('Invalid response structure:', {
            hasResponse: !!response,
            hasData: !!response?.data,
            hasNestedData: !!response?.data?.data
          });
          setError('Invalid test data received');
        }
      } catch (error) {
        console.error('Error in loadTest:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        });
        setError(error.message || 'Error loading test');
      } finally {
        console.log('=== Completing loadTest function ===');
        setLoading(false);
      }
    };

    console.log('=== useEffect triggered ===');
    if (uuid) {
      console.log('UUID exists, calling loadTest...');
      loadTest();
    } else {
      console.log('No UUID provided');
      setLoading(false);
    }
  }, [uuid, location, navigate]);

  console.log('=== Component render state ===', {
    loading,
    hasTest: !!test,
    hasError: !!error,
    currentSection
  });

  const handleSubmit = async () => {
    try {
      if (!sessionId) {
        setError('No active test session');
        return;
      }

      // Submit test answers
      await postMethod(`tests/sessions/${sessionId}/submit`, { answers });
      
      // Navigate to completion page
      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          sessionId: sessionId 
        }
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      setError(error.message || 'Error submitting test');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600">Test not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{test.title}</h1>
        <p className="text-gray-600 mt-2">Duration: {test.duration} minutes</p>
        <p className="text-gray-600">Total Marks: {test.totalMarks}</p>
        
        <div className="flex gap-4 mt-4">
          <button
            className={`px-4 py-2 rounded ${
              currentSection === 'mcq' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setCurrentSection('mcq')}
          >
            MCQs ({test.mcqs?.length || 0})
          </button>
          <button
            className={`px-4 py-2 rounded ${
              currentSection === 'coding' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setCurrentSection('coding')}
          >
            Coding ({test.codingChallenges?.length || 0})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {currentSection === 'mcq' ? (
          <MCQSection
            mcqs={test.mcqs}
            answers={answers.mcq}
            setAnswers={(mcqAnswers) =>
              setAnswers((prev) => ({ ...prev, mcq: mcqAnswers }))
            }
          />
        ) : (
          <CodingSection
            challenges={test.codingChallenges}
            answers={answers.coding}
            setAnswers={(codingAnswers) =>
              setAnswers((prev) => ({ ...prev, coding: codingAnswers }))
            }
          />
        )}

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
} 
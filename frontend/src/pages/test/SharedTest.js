import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { toast } from 'react-hot-toast';

export default function SharedTest() {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const { uuid } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAndCheckRegistration = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Check authentication first
        if (!token) {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
          return;
        }

        // Step 1: Verify Test
        const verifyResponse = await apiService.post(`tests/verify/${uuid}`);
        if (!verifyResponse?.test) {
          throw new Error('Invalid test data received');
        }

        // Check if test is private and user doesn't have access
        if (verifyResponse.test.visibility === 'private') {
          const userRole = localStorage.getItem('userRole');
          if (userRole !== 'admin' && userRole !== 'vendor') {
            throw new Error('You do not have access to this test');
          }
        }

        setTest(verifyResponse.test);

        // Step 2: Check Registration Status
        const regResponse = await apiService.post(`tests/${uuid}/check-registration`);
        if (!regResponse) {
          throw new Error('Invalid registration status received');
        }

        setRegistrationStatus({
          canAccess: regResponse.canAccess,
          requiresRegistration: regResponse.requiresRegistration,
          isRegistered: regResponse.isRegistered,
          message: regResponse.message,
          testType: regResponse.test?.type,
          lastSession: regResponse.lastSession
        });

      } catch (err) {
        console.error('Error:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Error loading test';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyAndCheckRegistration();
  }, [uuid, navigate]);

  // Update handleRegister to store test data
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      // Register for the test
      const response = await apiService.post(`tests/register/${uuid}`);
      
      if (!response?.registration) {
        throw new Error('Registration failed');
      }

      // Create a new session with initial 'active' status
      const sessionResponse = await apiService.post(`tests/${uuid}/session`, {
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language
        }
      });

      if (sessionResponse?.session?._id) {
        // Store test data and session info with initial 'active' status
        localStorage.setItem('currentTestData', JSON.stringify({
          id: test.id,
          uuid: uuid,
          title: test.title,
          type: test.type,
          duration: test.duration,
          totalMarks: test.totalMarks
        }));

        localStorage.setItem('currentTestSession', JSON.stringify({
          sessionId: sessionResponse.session._id,
          testId: uuid,
          startTime: new Date().toISOString(),
          status: 'active' // Initial status
        }));

        navigate(`/test/take/${uuid}?session=${sessionResponse.session._id}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register for test');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    try {
      setLoading(true);
      const sessionResponse = await apiService.post(`tests/${uuid}/session`, {
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language
        }
      });

      if (sessionResponse?.session?._id) {
        // Store test data and session info
        localStorage.setItem('currentTestData', JSON.stringify({
          id: test.id,
          uuid: uuid,
          title: test.title,
          type: test.type,
          duration: test.duration,
          totalMarks: test.totalMarks
        }));

        localStorage.setItem('currentTestSession', JSON.stringify({
          sessionId: sessionResponse.session._id,
          testId: uuid,
          startTime: new Date().toISOString(),
          status: 'active'
        }));

        navigate(`/test/take/${uuid}?session=${sessionResponse.session._id}`);
      }
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Failed to start test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Loading test details...</p>
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {test && (
        <>
          <h1 className="text-2xl font-bold mb-4">{test.title}</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Test Details</h2>
              <p className="text-gray-600">{test.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="font-medium">Duration:</p>
                <p className="text-gray-600">{test.duration} minutes</p>
              </div>
              <div>
                <p className="font-medium">Total Marks:</p>
                <p className="text-gray-600">{test.totalMarks}</p>
              </div>
              <div>
                <p className="font-medium">Type:</p>
                <p className="text-gray-600">{test.type}</p>
              </div>
              <div>
                <p className="font-medium">Category:</p>
                <p className="text-gray-600">{test.category}</p>
              </div>
            </div>

            {registrationStatus && (
              <div className="mt-6">
                {!registrationStatus.isRegistered && registrationStatus.canAccess && (
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {loading ? 'Processing...' : 'Register for Test'}
                  </button>
                )}
                
                {registrationStatus.isRegistered && registrationStatus.canAccess && (
                  <button
                    onClick={async () => {
                      try {
                        // Check if it's a practice test or new assessment
                        if (test.type === 'practice' || !registrationStatus.lastSession) {
                          await handleStartTest();
                        } else if (registrationStatus.lastSession?.status === 'completed') {
                          toast.error('You have already completed this assessment test');
                        } else {
                          // Resume existing session
                          navigate(`/test/take/${uuid}?session=${registrationStatus.lastSession.id}`);
                        }
                      } catch (error) {
                        console.error('Error starting test:', error);
                        toast.error('Failed to start test. Please try again.');
                      }
                    }}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  >
                    {test.type === 'practice' ? 'Start Practice Test' : 
                     registrationStatus.lastSession?.status === 'completed' ? 'Test Completed' : 
                     registrationStatus.lastSession ? 'Resume Test' : 'Start Assessment'}
                  </button>
                )}
                
                {!registrationStatus.canAccess && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      {registrationStatus.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 
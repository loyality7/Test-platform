import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

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
        
        // Step 1: Verify Test
        const verifyResponse = await apiService.post(`tests/verify/${uuid}`);
        console.log('Raw Response:', verifyResponse);
        
        const testData = verifyResponse;  // The response is already the data object
        console.log('Test Data:', testData);

        if (!testData || !testData.test) {
          throw new Error('Test data not found in response');
        }

        // Set test data
        setTest(testData.test);

        // Step 2: Handle Authentication
        if (!token) {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
          return;
        }

        // Step 3: Check Registration Status
        const regResponse = await apiService.post(`tests/${uuid}/check-registration`);
        console.log('Registration Status:', regResponse);
        
        if (!regResponse) {
          throw new Error('Invalid registration status received');
        }

        // Step 4: Set Registration Status
        setRegistrationStatus({
          canAccess: regResponse.canAccess,
          requiresRegistration: regResponse.requiresRegistration,
          isRegistered: regResponse.isRegistered,
          message: regResponse.message
        });

        // Step 5: Auto-redirect if already registered and can access
        if (regResponse.canAccess && 
            (!regResponse.requiresRegistration || regResponse.isRegistered)) {
          try {
            // Create session
            const sessionResponse = await apiService.post(`tests/${uuid}/session`, {
              deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language
              }
            });

            console.log('Session Response:', sessionResponse);

            if (sessionResponse?.session?._id) {
              // Redirect to test with session ID
              navigate(`/test/take/${uuid}?session=${sessionResponse.session._id}`);
            } else {
              throw new Error('Invalid session response');
            }
          } catch (err) {
            console.error('Session creation error:', err);
            setError('Unable to start test session. Please try again.');
          }
        }

      } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'Error loading test');
      } finally {
        setLoading(false);
      }
    };

    verifyAndCheckRegistration();
  }, [uuid, navigate]);

  // Handle registration button click
  const handleRegister = async () => {
    try {
      setLoading(true);
      const response = await apiService.post(`tests/register/${uuid}`);
      
      if (response?.registration) {
        // Refresh registration status
        const regResponse = await apiService.post(`tests/${uuid}/check-registration`);
        setRegistrationStatus({
          canAccess: regResponse.canAccess,
          requiresRegistration: regResponse.requiresRegistration,
          isRegistered: regResponse.isRegistered,
          message: regResponse.message
        });

        // If registration successful and can access, create session and redirect
        if (regResponse.canAccess && 
            (!regResponse.requiresRegistration || regResponse.isRegistered)) {
          const sessionResponse = await apiService.post(`tests/${uuid}/session`, {
            deviceInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              screenResolution: `${window.screen.width}x${window.screen.height}`,
              language: navigator.language
            }
          });
          
          if (sessionResponse?.session?._id) {
            navigate(`/test/take/${uuid}?session=${sessionResponse.session._id}`);
          }
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err?.response?.data?.message || 'Unable to register for the test');
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
                {registrationStatus.requiresRegistration && !registrationStatus.isRegistered && (
                  <button
                    onClick={handleRegister}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Register for Test
                  </button>
                )}
                
                {registrationStatus.canAccess && 
                 (!registrationStatus.requiresRegistration || registrationStatus.isRegistered) && (
                  <button
                    onClick={() => navigate(`/test/take/${uuid}`)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  >
                    Start Test
                  </button>
                )}
                
                {!registrationStatus.canAccess && registrationStatus.message && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
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
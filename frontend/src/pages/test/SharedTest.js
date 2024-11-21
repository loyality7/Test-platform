import React, { useState, useEffect, startTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/axios';

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
        console.log('Starting verification and registration check...');
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Token status:', token ? 'Present' : 'Missing');
        
        if (!token) {
          console.log('No token found, redirecting to login...');
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
          return;
        }

        console.log('Sending verify request...');
        const response = await axios.post(`/api/tests/verify/${uuid}`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Full response:', response);
        
        const testData = response.test;
        console.log('Test data:', testData);
        
        if (!testData || !testData.title) {
          console.error('Invalid test data:', testData);
          throw new Error('Invalid test data');
        }
        
        setTest(testData);
        console.log('Test data set successfully');

        console.log('Checking registration status...');
        const regResponse = await axios.post(`/api/tests/${uuid}/check-registration`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Full registration check response:', regResponse);
        
        if (regResponse?.registration?.status === 'registered') {
          console.log('User is already registered, checking for active session...');
          
          try {
            const deviceInfo = {
              browser: navigator.userAgent,
              os: navigator.platform,
              screenResolution: `${window.screen.width}x${window.screen.height}`
            };
            console.log('Device info for session:', deviceInfo);
            
            const sessionResponse = await axios.post('/api/tests/sessions/start', {
              testId: regResponse.test.id,
              deviceInfo
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('New session created:', sessionResponse.data);
            
            setRegistrationStatus({
              canRegister: false,
              message: regResponse.message,
              sessionId: sessionResponse.data.session._id,
              testId: uuid
            });
          } catch (err) {
            console.log('Session error:', err);
            
            if (err.error === 'Active session already exists' && err.sessionId) {
              console.log('Found existing session:', err.sessionId);
              setRegistrationStatus({
                canRegister: false,
                message: 'You have an active session',
                sessionId: err.sessionId,
                testId: uuid
              });
              setError(null);
              return;
            }
            
            throw err;
          }
        } else {
          console.log('User needs to register for this test');
          setRegistrationStatus({
            canRegister: true,
            message: regResponse?.message || 'You can register for this test'
          });
        }

        setError(null);
      } catch (err) {
        console.error('Error in verification process:', err);
        
        if (err.error === 'Active session already exists' && err.sessionId) {
          console.log('Found existing session in error:', err.sessionId);
          setRegistrationStatus({
            canRegister: false,
            message: 'You have an active session',
            sessionId: err.sessionId,
            testId: uuid
          });
          setError(null);
          return;
        }
        
        console.error('Full error details:', {
          message: err.message,
          error: err.error,
          sessionId: err.sessionId,
          originalError: err
        });
        setError(err?.message || 'Error loading test');
      } finally {
        console.log('Verification process completed');
        setLoading(false);
      }
    };

    verifyAndCheckRegistration();
  }, [uuid, navigate]);

  const handleRegister = async () => {
    console.log('Starting registration process...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
        return;
      }

      console.log('Sending registration request...');
      const response = await axios.post(
        `/api/tests/register/${uuid}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('Registration response:', response);

      if (response?.sessionId) {
        setRegistrationStatus({
          canRegister: false,
          message: 'Successfully registered for test',
          sessionId: response.sessionId,
          testId: uuid
        });
        setError(null);
      } else {
        throw new Error('Invalid registration response');
      }

    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data?.error === 'Profile incomplete') {
        const errorMsg = `Please complete your profile first. Missing fields: ${err.response.data.missingFields.join(', ')}`;
        setError(errorMsg);
        navigate('/profile');
        return;
      }

      setError(err.response?.data?.message || err.message || 'Error registering for test');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Validating test...</p>
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

  if (!test || !test.title) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600">Test data is incomplete or invalid</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
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
            <p className="font-medium">Category:</p>
            <p className="text-gray-600">{test.category}</p>
          </div>
          <div>
            <p className="font-medium">Difficulty:</p>
            <p className="text-gray-600">{test.difficulty}</p>
          </div>
          <div>
            <p className="font-medium">Type:</p>
            <p className="text-gray-600">{test.type}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Created by:</h3>
          <p className="text-gray-600">{test.vendor.name}</p>
        </div>

        {registrationStatus?.canRegister === false ? (
          <div>
            <p className="text-green-600 mb-4">{registrationStatus.message}</p>
            <button
              onClick={() => navigate(`/test/take/${uuid}?session=${registrationStatus.sessionId}`)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Continue to Test
            </button>
          </div>
        ) : (
          <button
            onClick={handleRegister}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Register for Test
          </button>
        )}
      </div>
    </div>
  );
} 
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../../services/api';
import MCQSection from './components/MCQSection';
import CodingSection from './components/CodingSection';
import Proctoring from './Proctoring';
import WarningModal from './components/WarningModal';
import { Clock, FileText, Check } from 'lucide-react';

export default function TakeTest() {
  const [test, setTest] = useState(null);
  const [sessionId, setSessionId] = useState(new URLSearchParams(window.location.search).get('session'));
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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const MAX_WARNINGS = 10;

  // Ref to track last warning time
  const lastWarningTime = useRef(0);
  const WARNING_COOLDOWN = 3000; // 3 seconds cooldown between warnings

  // Add new state for tracking violations
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  // Add event listeners for tab visibility and window focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showInstructions) {
        handleWarning('Switching tabs is not allowed during the test');
      }
      setIsTabVisible(!document.hidden);
    };

    const handleFocus = () => {
      setIsWindowFocused(true);
    };

    const handleBlur = () => {
      if (!showInstructions) {
        handleWarning('Leaving the test window is not allowed');
      }
      setIsWindowFocused(false);
    };

    // Detect copy/paste
    const handleCopy = (e) => {
      if (!showInstructions) {
        e.preventDefault();
        handleWarning('Copying test content is not allowed');
      }
    };

    const handlePaste = (e) => {
      if (!showInstructions) {
        e.preventDefault();
        handleWarning('Pasting content is not allowed');
      }
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showInstructions) {
        handleWarning('Exiting fullscreen mode is not allowed');
        // Try to re-enter fullscreen
        document.documentElement.requestFullscreen().catch(() => {
          handleWarning('Please enable fullscreen to continue the test');
        });
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [showInstructions]);

  // Load Test Data
  useEffect(() => {
    const loadTest = async () => {
      try {
        if (!uuid) {
          console.log('Missing uuid:', uuid);
          setError('Invalid test ID');
          return;
        }

        // First, check if we need to register for the test
        if (!sessionId || sessionId === 'undefined') {
          console.log('No valid session ID found, attempting to register for test');
          try {
            // First, verify the test to get testId if we have UUID
            let testId = null;
            if (uuid) {
              console.log('Verifying test with UUID:', uuid);
              const verifyResponse = await apiService.post(`tests/verify/${uuid}`);
              console.log('Verify response:', verifyResponse);
              
              if (verifyResponse?.test?.id) {
                testId = verifyResponse.test.id;
                console.log('Got testId from UUID verification:', testId);
              }
            }

            // Now register using testId if available, fallback to UUID
            const registrationEndpoint = testId 
              ? `tests/${testId}/register`
              : `tests/register/${uuid}`;
            
            console.log('Using registration endpoint:', registrationEndpoint);
            
            const registrationResponse = await apiService.post(registrationEndpoint);
            console.log('Registration response:', registrationResponse);

            // Handle the session from the response
            if (registrationResponse?.session?.id) {
              const sessionId = registrationResponse.session.id;
              console.log('Found session ID:', sessionId);
              
              // Update URL with session ID
              const newUrl = `${window.location.pathname}?session=${sessionId}`;
              window.history.replaceState({}, '', newUrl);
              setSessionId(sessionId);
              return;
            }
            
            // If we get here, we don't have a valid session ID
            console.error('No valid session ID in response:', registrationResponse);
            throw new Error('No valid session ID found in response');
          } catch (error) {
            console.error('Registration error:', error);
            setError(error.response?.data?.message || error.message || 'Failed to register for test');
            return;
          }
        }

        // Only proceed with test loading if we have a valid session ID
        if (sessionId && sessionId !== 'undefined') {
          console.log('Loading test with valid session:', { uuid, sessionId });
          try {
            const response = await apiService.get(`/tests/${uuid}/take`, {
              params: { session: sessionId }
            });
            
            console.log('Test data response:', response);
            
            if (!response?.data) {
              throw new Error('Invalid response structure');
            }

            const testData = response.data;
            setTest({
              title: testData.title,
              description: testData.description,
              duration: testData.duration,
              totalMarks: testData.totalMarks,
              mcqs: testData.mcqs.map(mcq => ({
                ...mcq,
                id: mcq._id
              })),
              codingChallenges: testData.codingChallenges.map(challenge => ({
                ...challenge,
                id: challenge._id
              }))
            });
            setLoading(false);
          } catch (error) {
            console.error('Error loading test data:', error);
            setError(error.message || 'Error loading test');
            setLoading(false);
          }
        } else {
          throw new Error('No valid session ID available');
        }

      } catch (error) {
        console.error('Error in loadTest:', error);
        if (error.response?.status === 401) {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
        } else {
          setError(error.message || 'Error loading test');
        }
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [uuid, sessionId, navigate]);

  // Request Permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request camera access
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera access granted');

        // Request location access
        navigator.geolocation.getCurrentPosition(
          () => {
            console.log('Location access granted');
            setPermissionsGranted(true);
          },
          (error) => {
            console.error('Location access denied:', error);
            alert('Location access is required to proceed with the test.');
          }
        );
      } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access is required to proceed with the test.');
      }
    };

    requestPermissions();
  }, []);

  // Fullscreen handler
  const handleStartTest = async () => {
    try {
      // Request fullscreen on user click
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      
      setIsFullScreen(true);
      setShowInstructions(false);
    } catch (error) {
      console.error('Fullscreen error:', error);
      alert('Please enable fullscreen to continue the test. If the issue persists, check your browser settings.');
      handleWarning('Please enable full screen to continue the test');
    }
  };

  // Add fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        // Handle fullscreen exit
        console.warn('Fullscreen mode exited');
        // Optionally show warning or take action
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Warnings from Proctoring with cooldown
  const handleWarning = (message) => {
    const now = Date.now();
    // Reduced cooldown for serious violations
    const currentCooldown = message.includes('tab') || message.includes('window') ? 1000 : WARNING_COOLDOWN;
    
    if (now - lastWarningTime.current < currentCooldown) {
      return;
    }
    
    lastWarningTime.current = now;
    
    setWarnings(prev => {
      const newCount = prev + 1;
      if (newCount >= MAX_WARNINGS) {
        handleSubmit(); // Auto-submit the test
        return prev;
      }
      return newCount;
    });
    
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  // Handle Test Submission
  const handleSubmit = async () => {
    try {
      // Calculate total score from MCQ and coding submissions
      const totalScore = (test.mcqSubmission?.totalScore || 0) + 
                        (test.codingSubmission?.totalScore || 0);

      // Navigate to completion page
      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          submission: {
            mcq: answers.mcq,
            coding: answers.coding,
            totalScore: totalScore
          }
        }
      });
    } catch (error) {
      setError(error.message || 'Error completing test');
    }
  };

  const handleMCQSubmission = async (submission) => {
    try {
      setTest(prev => ({
        ...prev,
        status: 'mcq_completed',
        mcqSubmission: submission
      }));

      // Switch to coding section
      setCurrentSection('coding');
    } catch (error) {
      setError('Failed to process MCQ submission');
    }
  };

  const handleCodingSubmission = async (submission) => {
    try {
      setTest(prev => ({
        ...prev,
        status: 'completed',
        codingSubmission: submission,
        totalScore: submission.totalScore
      }));

      // Navigate to completion page without session
      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          submission: {
            mcq: answers.mcq,
            coding: answers.coding,
            totalScore: submission.totalScore
          }
        }
      });
    } catch (error) {
      setError('Failed to process coding submission');
    }
  };

  // Add this helper function at the top of your component
  const isAllMCQsAnswered = (mcqAnswers, totalMCQs) => {
    return Object.keys(mcqAnswers).length === totalMCQs;
  };

  // When setting answers, ensure the structure is maintained
  const handleAnswerUpdate = (section, newAnswers) => {
    setAnswers(prev => ({
      ...prev,
      [section]: newAnswers || {}
    }));
  };

  // Render Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render Error State
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

  // Render Instructions
  if (showInstructions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-2xl w-full p-8 bg-white rounded-lg shadow-lg">
          {test && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-center">{test.title}</h1>
              <div className="mt-4 space-y-2 text-gray-600">
                <p className="text-center">{test.description}</p>
                <div className="flex justify-between text-sm">
                  <p>Duration: {test.duration} minutes</p>
                  <p>Total Marks: {test.totalMarks}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p>MCQs: {test.mcqs?.length || 0}</p>
                  <p>Coding Questions: {test.codingChallenges?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold text-center mb-6">Test Instructions</h2>
          
          <div className="space-y-4 mb-8">
            <p className="text-lg font-semibold text-gray-700">Before you begin:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Ensure you are in a quiet environment</li>
              <li>Close all other applications and browser tabs</li>
              <li>Your camera must remain on throughout the test</li>
              <li>Switching tabs or applications is not allowed</li>
              <li>The test must be completed in full-screen mode</li>
              <li>Multiple faces in camera view will be flagged</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">System Permissions:</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <svg 
                  className={`w-6 h-6 ${permissionsGranted ? 'text-green-500' : 'text-gray-400'}`}
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="ml-2">Camera Access: {permissionsGranted ? 'Granted' : 'Required'}</span>
              </div>
              <div className="flex items-center">
                <svg 
                  className={`w-6 h-6 ${permissionsGranted ? 'text-green-500' : 'text-gray-400'}`}
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="ml-2">Location Access: {permissionsGranted ? 'Granted' : 'Required'}</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStartTest}
              disabled={!permissionsGranted}
              className={`
                px-6 py-3 text-lg font-semibold rounded-lg
                ${permissionsGranted 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 transform transition hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
              `}
            >
              {permissionsGranted ? 'Start Test' : 'Waiting for Permissions...'}
            </button>
            {!permissionsGranted && (
              <p className="mt-2 text-sm text-red-500">
                Please grant camera and location access to continue
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Test Sections
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with integrated proctoring */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-start py-3">
            {/* Test Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{test.title}</h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center text-gray-600 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{test.duration} minutes</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <FileText className="w-4 h-4 mr-1" />
                  <span>{test.totalMarks} marks</span>
                </div>
              </div>
            </div>

            {/* Proctoring Camera */}
            <div className="w-[180px] h-[135px] bg-black rounded-lg overflow-hidden shadow-lg">
              <Proctoring
                testId={uuid}
                sessionId={sessionId}
                onWarning={handleWarning}
                onViolation={() => {}}
              />
            </div>
          </div>

          {/* Section Tabs - Made more compact */}
          <div className="flex space-x-1 mt-2">
            <button
              className={`px-4 py-2 text-sm rounded-t-lg font-medium transition-all relative
                ${currentSection === 'mcq' 
                  ? 'text-blue-600 bg-white border-t-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
                }`}
              onClick={() => setCurrentSection('mcq')}
            >
              Multiple Choice Questions
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100">
                {test.mcqs?.length || 0}
              </span>
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-t-lg font-medium transition-all relative
                ${currentSection === 'coding' 
                  ? 'text-blue-600 bg-white border-t-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
                }`}
              onClick={() => setCurrentSection('coding')}
            >
              Coding Challenges
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100">
                {test.codingChallenges?.length || 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex">
        <div className="w-full px-0">
          {currentSection === 'mcq' ? (
            <MCQSection
              mcqs={test.mcqs}
              answers={answers.mcq}
              setAnswers={(mcqAnswers) => handleAnswerUpdate('mcq', mcqAnswers)}
              onSubmitMCQs={handleMCQSubmission}
              isAllAnswered={isAllMCQsAnswered(answers.mcq, test.mcqs?.length)}
            />
          ) : (
            <CodingSection
              challenges={test.codingChallenges}
              answers={answers.coding}
              setAnswers={(codingAnswers) => handleAnswerUpdate('coding', codingAnswers)}
              onSubmitCoding={handleCodingSubmission}
            />
          )}
        </div>
      </div>

      {/* Footer - Removed progress tracking */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Empty footer - can be removed if not needed */}
        </div>
      </div>

      {showWarningModal && (
        <WarningModal
          message={warningMessage}
          warningCount={warnings}
          maxWarnings={MAX_WARNINGS}
          onClose={() => setShowWarningModal(false)}
        />
      )}
    </div>
  );
} 
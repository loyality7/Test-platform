import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getMethod, postMethod } from '../../helpers';
import MCQSection from './components/MCQSection';
import CodingSection from './components/CodingSection';
import Proctoring from './Proctoring';
import WarningModal from './components/WarningModal';
import { Clock, FileText, Check } from 'lucide-react';

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
        if (!uuid || !sessionId) {
          setError('Invalid test or session ID');
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
          return;
        }

        const response = await getMethod(`tests/${uuid}/take`, {
          params: { session: sessionId },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response?.data?.data) {
          const testData = response.data.data;
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
        } else {
          setError('Invalid test data received');
        }
      } catch (error) {
        console.error('Error loading test:', error);
        if (error.response?.status === 401) {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
        } else {
          setError(error.response?.data?.message || 'Error loading test');
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

  // Start Test in Fullscreen
  const handleStartTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
      setShowInstructions(false);
    } catch (error) {
      handleWarning('Please enable full screen to continue the test');
    }
  };

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
      if (!sessionId) {
        setError('No active test session');
        return;
      }

      await postMethod(`tests/sessions/${sessionId}/submit`, { answers });
      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          sessionId: sessionId 
        }
      });
    } catch (error) {
      setError(error.message || 'Error submitting test');
    }
  };

  const handleMCQSubmission = async (submission) => {
    try {
      // Update test status
      setTest(prev => ({
        ...prev,
        status: 'mcq_completed',
        mcqSubmission: submission.mcqSubmission
      }));

      // Switch to coding section
      setCurrentSection('coding');
    } catch (error) {
      setError('Failed to process MCQ submission');
    }
  };

  const handleCodingSubmission = async (submission) => {
    try {
      // Update test status
      setTest(prev => ({
        ...prev,
        status: 'completed',
        codingSubmission: submission.codingSubmission,
        totalScore: submission.totalScore
      }));

      // Navigate to completion page
      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          sessionId: sessionId,
          submission: submission
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
              setAnswers={(mcqAnswers) =>
                setAnswers((prev) => ({ ...prev, mcq: mcqAnswers }))
              }
              onSubmitMCQs={handleMCQSubmission}
              isAllAnswered={isAllMCQsAnswered(answers.mcq, test.mcqs?.length)}
            />
          ) : (
            <CodingSection
              challenges={test.codingChallenges}
              answers={answers.coding}
              setAnswers={(codingAnswers) =>
                setAnswers((prev) => ({ ...prev, coding: codingAnswers }))
              }
              onSubmitCoding={handleCodingSubmission}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {currentSection === 'mcq' ? 'MCQs Progress:' : 'Coding Progress:'}
                <span className="ml-2 font-medium">
                  {Object.keys(currentSection === 'mcq' ? answers.mcq : answers.coding).length} of{' '}
                  {currentSection === 'mcq' ? test.mcqs?.length : test.codingChallenges?.length}
                </span>
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(Object.keys(currentSection === 'mcq' ? answers.mcq : answers.coding).length /
                      (currentSection === 'mcq' ? test.mcqs?.length : test.codingChallenges?.length)) * 100}%`
                  }}
                />
              </div>
            </div>
            {currentSection === 'mcq' && (
              <button
                onClick={handleMCQSubmission}
                disabled={!isAllMCQsAnswered(answers.mcq, test.mcqs?.length)}
                className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-all
                  ${isAllMCQsAnswered(answers.mcq, test.mcqs?.length)
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <span>Submit MCQs</span>
                <Check className="w-5 h-5" />
              </button>
            )}
            {currentSection === 'coding' && (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition-all flex items-center space-x-2"
              >
                <span>Submit Test</span>
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
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
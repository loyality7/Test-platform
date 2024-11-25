import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, } from 'react-router-dom';
import apiService from '../../services/api';
import MCQSection from './components/MCQSection';
import CodingSection from './components/CodingSection';
import Proctoring from './Proctoring';
import WarningModal from './components/WarningModal';
import { Clock, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Add this helper function at the top of the file
const updateLocalAnalytics = (newAnalytics) => {
  try {
    localStorage.setItem('testAnalytics', JSON.stringify(newAnalytics));
  } catch (error) {
    console.error('Error saving analytics to localStorage:', error);
  }
};

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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Ref to track last warning time
  const lastWarningTime = useRef(0);
  const WARNING_COOLDOWN = 3000; // 3 seconds cooldown between warnings

  // Add new state for tracking violations
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  // Add new state variables
  const [sessionEnded, setSessionEnded] = useState(false);

  // Update analytics state to include section-specific metrics
  const [analytics, setAnalytics] = useState({
    warnings: 0,
    tabSwitches: 0,
    copyPasteAttempts: 0,
    timeSpent: 0,
    mouseMoves: 0,
    keystrokes: 0,
    browserEvents: [],
    focusLostCount: 0,
    submissionAttempts: 0,
    score: 0,
    mcqMetrics: {
      timePerQuestion: {},
      changedAnswers: {},
      skippedQuestions: new Set(),
    },
    codingMetrics: {
      timePerChallenge: {},
      compilationAttempts: {},
      testCaseRuns: {},
      errorFrequency: {},
    },
    browser: navigator.userAgent,
    os: navigator.platform,
    device: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`
  });

  // Modify setAnalytics to automatically save to localStorage
  const updateAnalytics = useCallback((newData) => {
    setAnalytics(prev => {
      const updatedAnalytics = typeof newData === 'function' 
        ? newData(prev) 
        : { ...prev, ...newData };
      
      updateLocalAnalytics(updatedAnalytics);
      return updatedAnalytics;
    });
  }, []);

  // Load analytics from localStorage on mount
  useEffect(() => {
    try {
      const savedAnalytics = localStorage.getItem('testAnalytics');
      if (savedAnalytics) {
        const parsed = JSON.parse(savedAnalytics);
        setAnalytics(parsed);
      }
    } catch (error) {
      console.error('Error loading analytics from localStorage:', error);
    }
  }, []);

  // Update handleWarning to remove max warnings check
  const handleWarning = useCallback((message) => {
    const now = Date.now();
    const currentCooldown = message.includes('tab') || message.includes('window') ? 1000 : WARNING_COOLDOWN;
    
    if (now - lastWarningTime.current < currentCooldown) {
      return;
    }
    
    lastWarningTime.current = now;
    
    updateAnalytics(prev => ({
      ...prev,
      warnings: prev.warnings + 1,
      browserEvents: [...prev.browserEvents, {
        type: 'warning',
        message,
        timestamp: new Date().toISOString()
      }]
    }));
    
    setWarningMessage(message);
    setShowWarningModal(true);
  }, [updateAnalytics]);

  // Update endSession to not include analytics submission
  const endSession = useCallback(async () => {
    if (sessionId && !sessionEnded) {
      try {
        // Only end the session
        await apiService.post(`tests/sessions/${sessionId}/end`, {
          answers: answers,
          submissionType: 'manual'
        });
        
        setSessionEnded(true);
        localStorage.removeItem('currentTestSession');
      } catch (error) {
        console.error('Error ending session:', error);
        toast.error('Failed to end test session');
      }
    }
  }, [sessionId, sessionEnded, answers]);

  // Add analytics tracking for various events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showInstructions) {
        handleWarning('Switching tabs is not allowed during the test');
        updateAnalytics(prev => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1
        }));
      }
      setIsTabVisible(!document.hidden);
    };

    const handleFocus = () => setIsWindowFocused(true);

    const handleBlur = () => {
      if (!showInstructions) {
        handleWarning('Leaving the test window is not allowed');
        updateAnalytics(prev => ({
          ...prev,
          focusLostCount: prev.focusLostCount + 1
        }));
      }
      setIsWindowFocused(false);
    };

    const handleCopyPaste = (e) => {
      if (!showInstructions) {
        e.preventDefault();
        handleWarning('Copying/pasting is not allowed');
        updateAnalytics(prev => ({
          ...prev,
          copyPasteAttempts: prev.copyPasteAttempts + 1
        }));
      }
    };

    const handleKeyPress = () => {
      updateAnalytics(prev => ({
        ...prev,
        keystrokes: prev.keystrokes + 1
      }));
    };

    const handleMouseMove = () => {
      updateAnalytics(prev => ({
        ...prev,
        mouseMoves: prev.mouseMoves + 1
      }));
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('mousemove', handleMouseMove);

    // Store test start time
    localStorage.setItem('testStartTime', new Date().toISOString());

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showInstructions, handleWarning, updateAnalytics]);

  // Simplify handleStartTest
  const handleStartTest = useCallback(async () => {
    try {
      setShowInstructions(false);
      
      // Get the document element
      const elem = document.documentElement;
      
      // Try different fullscreen methods
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { // Safari
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { // IE11
        await elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) { // Firefox
        await elem.mozRequestFullScreen();
      }

      setIsFullScreen(true);
      
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      toast.error('Failed to enter fullscreen mode. Please ensure your browser allows fullscreen.');
      
      // Still continue with the test even if fullscreen fails
      setShowInstructions(false);
    }
  }, []);

  // Simplify handleSubmit
  const handleSubmit = useCallback(async () => {
    try {
      await endSession();
      
      const totalScore = (test?.mcqSubmission?.totalScore || 0) + 
                        (test?.codingSubmission?.totalScore || 0);

      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          submission: {
            mcq: answers.mcq,
            coding: answers.coding,
            totalScore,
            testType: test.type
          }
        }
      });
    } catch (error) {
      setError(error.message || 'Error completing test');
    }
  }, [answers, navigate, test, uuid, endSession]);

  // Update the cleanup effect to only end session when component unmounts
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (sessionId && !sessionEnded) {
        event.preventDefault();
        event.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Only end session if it's not already ended and component is unmounting
      if (sessionId && !sessionEnded) {
        endSession();
      }
    };
  }, [sessionId, sessionEnded, endSession]);

  // Update the useEffect dependencies
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
  }, [showInstructions, handleWarning, setIsTabVisible, setIsWindowFocused]);

  // Add new state for testId
  const [testId, setTestId] = useState(localStorage.getItem('currentTestId'));

  // Update loadTest function to include testId handling
  useEffect(() => {
    const loadTest = async () => {
      try {
        if (!uuid) {
          setError('Invalid test ID');
          return;
        }

        // Get testId from localStorage or parse endpoint
        let currentTestId = localStorage.getItem('currentTestId');
        if (!currentTestId) {
          const parseResponse = await apiService.get(`tests/parse/${uuid}`);
          if (parseResponse?.data?.id) {
            currentTestId = parseResponse.data.id;
            localStorage.setItem('currentTestId', currentTestId);
            setTestId(currentTestId);
          } else {
            throw new Error('Failed to parse test ID');
          }
        }

        // Load test data from API
        const testResponse = await apiService.get(`tests/${uuid}/take`);
        if (!testResponse?.data) {
          throw new Error('Invalid test data received');
        }
        
        setTest(testResponse.data);
        localStorage.setItem('currentTestData', JSON.stringify(testResponse.data));

        // If no session exists, create one
        if (!sessionId || sessionId === 'undefined') {
          try {
            const sessionResponse = await apiService.post(`tests/${uuid}/session`, {
              deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language
              }
            });

            if (sessionResponse?.session?._id) {
              const newSessionId = sessionResponse.session._id;
              
              // Update URL and state
              const newUrl = `${window.location.pathname}?session=${newSessionId}`;
              window.history.replaceState({}, '', newUrl);
              setSessionId(newSessionId);
              
              // Store session info
              localStorage.setItem('currentTestSession', JSON.stringify({
                sessionId: newSessionId,
                testId: uuid,
                startTime: new Date().toISOString(),
                status: 'active'
              }));
            }
          } catch (error) {
            if (error.response?.data?.message === 'Already registered for this test') {
              navigate(`/test/shared/${uuid}`);
              return;
            }
            throw error;
          }
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
        setPermissionsGranted(true);
      } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access is required to proceed with the test.');
      }
    };

    requestPermissions();
  }, []);

  // Update the fullscreen change effect to be less strict
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      setIsFullScreen(isInFullscreen);
      
      if (!isInFullscreen && !showInstructions) {
        // Just show a warning instead of forcing fullscreen
        handleWarning('You have exited fullscreen mode. Please return to fullscreen for the best test experience.');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [showInstructions, handleWarning]);

  const handleCodingSubmission = async (submission) => {
    try {
      // Update test state with coding submission
      setTest(prev => ({
        ...prev,
        status: 'completed',
        codingSubmission: submission,
        totalScore: (prev?.mcqSubmission?.totalScore || 0) + (submission?.totalScore || 0)
      }));

      // End the session since both sections are complete
      await endSession();

      // Navigate to completion page
      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          submission: {
            mcq: answers.mcq,
            coding: answers.coding,
            totalScore: (test?.mcqSubmission?.totalScore || 0) + (submission?.totalScore || 0),
            testType: test?.type
          }
        }
      });
    } catch (error) {
      console.error('Failed to process coding submission:', error);
      setError('Failed to process coding submission');
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

  // Add these new state variables at the beginning of the component
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);

  // Update the timer effect to remove half-time check
  useEffect(() => {
    if (test && !showInstructions) {
      const durationMs = test.duration * 60 * 1000;
      const endTime = new Date().getTime() + durationMs;
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          handleSubmit(); // Auto-submit when time is up
          return;
        }
        
        setTimeRemaining(remaining);
      };

      // Initialize timer
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [test, showInstructions, handleSubmit]);

  // Add these functions to disable developer tools and right-click
  useEffect(() => {
    const disableDevTools = () => {
      // Disable right-click
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      
      // Disable keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (
          // Disable F12
          e.key === 'F12' ||
          // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          // Disable Ctrl+U (view source)
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
          handleWarning('Developer tools are not allowed during the test');
        }
      });

      // Detect devtools opening
      const checkDevTools = () => {
        const threshold = 160;
        if (
          window.outerWidth - window.innerWidth > threshold ||
          window.outerHeight - window.innerHeight > threshold
        ) {
          handleWarning('Developer tools are not allowed during the test');
        }
      };

      setInterval(checkDevTools, 1000);
    };

    if (!showInstructions) {
      disableDevTools();
    }
  }, [showInstructions, handleWarning]);

  // Inside TakeTest component, add new state for confirmation dialog
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  // Add helper function to check if all sections are completed
  const isTestCompleted = useCallback(() => {
    return test?.mcqSubmission && test?.codingSubmission;
  }, [test]);

  // Update handleConfirmedSubmit to navigate immediately
  const handleConfirmedSubmit = async () => {
    setShowSubmitConfirmation(false);
    
    // Navigate immediately
    navigate('/test/completed', { 
      state: { 
        testId: uuid,
        submission: {
          mcq: answers.mcq,
          coding: answers.coding,
          totalScore: (test?.mcqSubmission?.totalScore || 0) + 
                     (test?.codingSubmission?.totalScore || 0),
          testType: test.type
        }
      }
    });

    // Handle analytics submission in the background
    try {
      const storedAnalytics = localStorage.getItem('testAnalytics');
      if (storedAnalytics) {
        const analyticsData = JSON.parse(storedAnalytics);
        
        // Calculate final time spent
        const startTime = new Date(localStorage.getItem('testStartTime'));
        const endTime = new Date();
        const timeSpentSeconds = Math.floor((endTime - startTime) / 1000);

        // Prepare final analytics data
        const finalAnalytics = {
          ...analyticsData,
          timeSpent: timeSpentSeconds,
          endTime: endTime.toISOString(),
          testStatus: isTestCompleted() ? 'completed' : 'incomplete',
          finalScore: (test?.mcqSubmission?.totalScore || 0) + (test?.codingSubmission?.totalScore || 0),
          sectionCompletion: {
            mcq: !!test?.mcqSubmission,
            coding: !!test?.codingSubmission
          },
          submissionType: 'manual',
          sessionId: sessionId
        };

        // Submit analytics in background
        await Promise.all([
          apiService.post(`analytics/test/${testId}`, {
            analyticsData: finalAnalytics
          }),
          endSession()
        ]);

        // Clear analytics from localStorage after successful submission
        localStorage.removeItem('testAnalytics');
      }
    } catch (error) {
      console.error('Error submitting analytics:', error);
      // Don't show error toast since user is already on completion page
    }
  };

  // Add this function near your other handler functions
  const handleFinalSubmitClick = useCallback(() => {
    // Show confirmation dialog regardless of completion status
    setShowSubmitConfirmation(true);
    
    // Optional: Show warning toast if sections are incomplete
    if (!isTestCompleted()) {
      toast(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Warning: Incomplete Test!</p>
          <p className="text-sm">Please complete all sections before submitting:</p>
          <ul className="list-disc list-inside text-sm">
            {!test?.mcqSubmission && <li>MCQ section not completed</li>}
            {!test?.codingSubmission && <li>Coding section not completed</li>}
          </ul>
          <p className="text-sm mt-2">Submitting now will result in loss of marks.</p>
        </div>,
        {
          duration: 5000,
          icon: '⚠️',
          style: {
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #EF4444',
          }
        }
      );
    }
  }, [test, isTestCompleted]);

  // Add this new function near the other handlers
  const handleAnswerUpdate = useCallback((section, newAnswers) => {
    setAnswers(prev => ({
      ...prev,
      [section]: newAnswers
    }));

    // Update analytics based on section
    if (section === 'mcq') {
      updateAnalytics(prev => ({
        ...prev,
        mcqMetrics: {
          ...prev.mcqMetrics,
          changedAnswers: {
            ...prev.mcqMetrics.changedAnswers,
            [Object.keys(newAnswers).length]: Date.now()
          }
        }
      }));
    } else if (section === 'coding') {
      updateAnalytics(prev => ({
        ...prev,
        codingMetrics: {
          ...prev.codingMetrics,
          lastUpdate: Date.now(),
          totalUpdates: (prev.codingMetrics.totalUpdates || 0) + 1
        }
      }));
    }
  }, [updateAnalytics]);

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
                Please grant camera access to continue
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
              <h1 className="text-2xl font-bold text-gray-800">
                {test?.title || 'Loading test...'}
              </h1>
              {test && (
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-mono">
                      {Math.floor(timeRemaining / (1000 * 60 * 60)).toString().padStart(2, '0')}:
                      {Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')}:
                      {Math.floor((timeRemaining % (1000 * 60)) / 1000).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <FileText className="w-4 h-4 mr-1" />
                    <span>{test.totalMarks} marks</span>
                  </div>
                  {/* Add status indicators */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${isFullScreen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isFullScreen ? 'Fullscreen' : 'Not Fullscreen'}
                    </span>
                    <span className={`px-2 py-1 rounded ${isTabVisible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isTabVisible ? 'Tab Active' : 'Tab Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded ${isWindowFocused ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isWindowFocused ? 'Window Focused' : 'Window Unfocused'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Add Submit button before the camera */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleFinalSubmitClick}
                className="px-4 py-2 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Final Submit
              </button>
              
              {/* Existing camera div */}
              <div className="w-[180px] h-[135px] bg-black rounded-lg overflow-hidden shadow-lg">
                <Proctoring
                  testId={uuid}
                  sessionId={sessionId}
                  onWarning={handleWarning}
                  onViolation={() => {}}
                  className="w-full h-full"
                />
              </div>
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
              analytics={analytics}
              setAnalytics={updateAnalytics}
            />
          ) : (
            <CodingSection
              challenges={test.codingChallenges}
              answers={answers.coding}
              setAnswers={(codingAnswers) => handleAnswerUpdate('coding', codingAnswers)}
              onSubmitCoding={handleCodingSubmission}
              testId={uuid}
              analytics={analytics}
              setAnalytics={updateAnalytics}
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
          warningCount={analytics.warnings}
          onClose={() => setShowWarningModal(false)}
        />
      )}

      {showSubmitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Ready to Submit?</h3>
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">
                You have completed:
              </p>
              <ul className="list-none space-y-2">
                <li className="flex items-center">
                  <CheckCircle 
                    className={`w-5 h-5 mr-2 ${test?.mcqSubmission ? 'text-green-500' : 'text-gray-300'}`}
                  />
                  <span>MCQ Section</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle 
                    className={`w-5 h-5 mr-2 ${test?.codingSubmission ? 'text-green-500' : 'text-gray-300'}`}
                  />
                  <span>Coding Section</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                This action cannot be undone. Are you sure you want to submit?
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
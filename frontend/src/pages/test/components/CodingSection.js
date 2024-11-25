import React, { useState, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { 
  Check, X, Play, ChevronLeft, ChevronRight, 
  Eye, Sun, Moon, Maximize2, RotateCcw
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { toast } from 'react-hot-toast';

export default function CodingSection({ challenges, answers, setAnswers, onSubmitCoding, setAnalytics }) {
  // Move ALL state declarations to the top
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [language, setLanguage] = useState('');
  const [testResults, setTestResults] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [isLoadingTestId, setIsLoadingTestId] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [autoComplete, setAutoComplete] = useState(true);
  const [editorValue, setEditorValue] = useState('// Write your code here\n');
  const [executingTests, setExecutingTests] = useState(new Set());
  const [layout, setLayout] = useState({
    leftPanel: 35,
    rightPanel: 25,
    isDragging: false
  });
  const [isExecuting, setIsExecuting] = useState(false);

  // Constants
  const MIN_PANEL_WIDTH = 20;
  const MAX_PANEL_WIDTH = 60;
  
  // Get current challenge
  const challenge = challenges?.[currentChallenge];

  // Fix for setAnswers exhaustive deps warning - add at the top of the component
  const memoizedSetAnswers = useCallback((newAnswers) => {
    setAnswers(newAnswers);
  }, [setAnswers]);

  // Update handleEditorChange to use optional chaining
  const handleEditorChange = useCallback((value) => {
    setEditorValue(value);
    
    if (challenge?._id) {
      const newAnswers = {
        ...answers,
        [challenge._id]: {
          code: value,
          language: language
        }
      };
      memoizedSetAnswers(newAnswers);
      console.log('Updated answers:', newAnswers);
    }
  }, [answers, challenge?._id, language, memoizedSetAnswers]);

  // Define handleResetCode before any useEffect hooks
  const handleResetCode = () => {
    const challenge = challenges[currentChallenge];
    if (!challenge || !language) return;
    
    const defaultCode = challenge.languageImplementations?.[language]?.visibleCode;
    if (defaultCode) {
      setEditorValue(defaultCode);
      setAnswers(prev => ({
        ...prev,
        [challenge._id]: {
          code: defaultCode,
          language
        }
      }));
    }
  };

  // All useEffect hooks together at the top level
  useEffect(() => {
    const parseTestUUID = async () => {
      try {
        setIsLoadingTestId(true);
        const uuid = window.location.pathname.split('/').pop();
        
        const response = await apiService.get(`tests/parse/${uuid}`);

        if (response?.data?.id) {
          localStorage.setItem('currentTestId', response.data.id);
        }
      } catch (error) {
        console.error('Error parsing test UUID:', error);
        toast.error('Error loading test details');
      } finally {
        setIsLoadingTestId(false);
      }
    };

    if (!localStorage.getItem('currentTestId')) {
      parseTestUUID();
    }
  }, []);

  // Update useEffect for challenge changes to use the API data
  useEffect(() => {
    if (challenges?.length > 0) {
      const challenge = challenges[currentChallenge];
      if (challenge?.allowedLanguages?.length > 0) {
        const defaultLanguage = challenge.allowedLanguages[0].toLowerCase();
        setLanguage(defaultLanguage);
        
        // Initialize answers if they don't exist
        const existingAnswer = answers[challenge._id];
        if (!existingAnswer) {
          const visibleCode = challenge.languageImplementations?.[defaultLanguage]?.visibleCode || '// Write your code here\n';
          setEditorValue(visibleCode);
          
          const newAnswers = {
            ...answers,
            [challenge._id]: {
              code: visibleCode,
              language: defaultLanguage
            }
          };
          setAnswers(newAnswers);
          console.log('Initialized answers:', newAnswers);
        } else {
          setEditorValue(existingAnswer.code);
          setLanguage(existingAnswer.language);
        }
      }
    }
  }, [challenges, currentChallenge, answers, setAnswers]);

  // Handle left panel resize
  const handleLeftResize = useCallback((e) => {
    if (layout.isDragging) {
      const containerWidth = document.querySelector('.h-[calc(100vh-10rem)]')?.clientWidth || 0;
      const newLeftWidth = (e.clientX / containerWidth) * 100;
      
      // Ensure the panel stays within min/max bounds
      if (newLeftWidth >= MIN_PANEL_WIDTH && newLeftWidth <= MAX_PANEL_WIDTH) {
        setLayout(prev => ({
          ...prev,
          leftPanel: newLeftWidth
        }));
      }
    }
  }, [layout.isDragging]);

  // Handle right panel resize
  const handleRightResize = useCallback((e) => {
    if (layout.isDragging) {
      const containerWidth = document.querySelector('.h-[calc(100vh-10rem)]')?.clientWidth || 0;
      const rightEdge = containerWidth;
      const newRightWidth = ((rightEdge - e.clientX) / containerWidth) * 100;
      
      // Ensure the panel stays within min/max bounds
      if (newRightWidth >= MIN_PANEL_WIDTH && newRightWidth <= MAX_PANEL_WIDTH) {
        setLayout(prev => ({
          ...prev,
          rightPanel: newRightWidth
        }));
      }
    }
  }, [layout.isDragging]);

  // Update the existing useEffect to include these functions in dependencies
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (layout.isDragging) {
        handleLeftResize(e);
        handleRightResize(e);
      }
    };

    const handleMouseUp = () => {
      setLayout(prev => ({ ...prev, isDragging: false }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [layout.isDragging, handleLeftResize, handleRightResize]);

  // Debug useEffect
  useEffect(() => {
    console.log('Challenges changed:', challenges);
    console.log('Current challenge:', currentChallenge);
    console.log('Current language:', language);
    console.log('Current answers:', answers);
  }, [challenges, currentChallenge, language, answers]);

  // Add this debug useEffect to track state changes
  useEffect(() => {
    console.log('Answers state updated:', answers);
  }, [answers]);

  // Track time per challenge
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      setAnalytics(prev => {
        const updated = {
          ...prev,
          codingMetrics: {
            ...prev.codingMetrics,
            timePerChallenge: {
              ...prev.codingMetrics.timePerChallenge,
              [currentChallenge]: (prev.codingMetrics.timePerChallenge[currentChallenge] || 0) + 
                                 (Date.now() - startTime) / 1000
            }
          }
        };
        updateLocalAnalytics(updated);
        return updated;
      });
    };
  }, [currentChallenge, setAnalytics]);

  // Now your early returns are after all state declarations
  if (!challenges || challenges.length === 0) {
    return <div>No challenges available</div>;
  }

  if (!challenge) {
    return <div>Challenge not found</div>;
  }

  console.log('Current Test Results:', testResults);

  const handleSubmitChallenge = async () => {
    try {
      const currentTestId = localStorage.getItem('currentTestId');
      
      if (!currentTestId) {
        toast.error('Test ID not found. Please reload the page.');
        return;
      }

      console.log('Starting submission...');
      setSubmissionStatus(prev => ({ ...prev, [challenge._id]: 'submitting' }));
      
      const currentCode = answers[challenge._id]?.code;
      if (!currentCode?.trim()) {
        toast.error('Please write some code before submitting');
        setSubmissionStatus(prev => ({ ...prev, [challenge._id]: undefined }));
        return;
      }

      // Execute all test cases (visible and hidden)
      const allTestCases = challenge.testCases;
      const results = [];
      
      // Show loading toast for hidden test cases
      const loadingToast = toast.loading('Running hidden test cases...');

      for (const testCase of allTestCases) {
        const response = await apiService.post('code/execute', {
          code: currentCode,
          language: language,
          inputs: testCase.input
        });

        let output;
        if (response?.status !== 'Accepted') {
          output = response.error;
        } else {
          output = response?.output || '';
        }
        const cleanOutput = output.trim();
        const expectedOutput = testCase.output?.trim() || '';
        const passed = cleanOutput === expectedOutput;

        results.push({
          input: testCase.input || '',
          expectedOutput: expectedOutput,
          actualOutput: cleanOutput,
          error: response?.error || null,
          passed: passed,
          executionTime: response?.executionTime || 0,
          memory: response?.memory || 0,
          status: response?.status || 'Error',
          isHidden: testCase.isHidden
        });
      }

      // Separate visible and hidden results
      const visibleResults = results.filter(r => !r.isHidden);
      const hiddenResults = results.filter(r => r.isHidden);

      // Update visible test results in UI
      setTestResults(prev => ({
        ...prev,
        [challenge._id]: {
          status: visibleResults.every(r => r.passed) ? 'Passed' : 'Failed',
          executionTime: visibleResults.reduce((sum, r) => sum + r.executionTime, 0),
          memory: Math.max(...visibleResults.map(r => r.memory)),
          testCaseResults: visibleResults
        }
      }));

      // Show hidden test cases summary
      const hiddenTestsPassed = hiddenResults.filter(r => r.passed).length;
      toast.dismiss(loadingToast);
      toast.success(`Hidden Test Cases: ${hiddenTestsPassed}/${hiddenResults.length} passed`);

      // Submit all results
      const submissionData = {
        testId: currentTestId,
        submissions: [{
          challengeId: challenge._id,
          code: currentCode,
          language: language,
          testCaseResults: results, // Send all results to backend
          executionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
          memory: Math.max(...results.map(r => r.memory)),
          output: results[0]?.output || '',
          error: results.some(r => r.error) ? results.find(r => r.error)?.error : null
        }]
      };

      const response = await apiService.post('submissions/submit/coding', submissionData);
      console.log('Submission successful:', response);

      if (response?.submission) {
        // Immediately update submission status to 'submitted'
        setSubmissionStatus(prev => ({
          ...prev,
          [challenge._id]: 'submitted'
        }));
        
        toast.success('Challenge submitted successfully!');
        
        // Check if all challenges are completed
        const allChallengesCompleted = challenges.every(ch => submissionStatus[ch._id] === 'submitted');
        if (allChallengesCompleted) {
          console.log('All challenges completed!');
          toast.success('All coding challenges completed!');
          // Ensure onSubmitCoding is called with the correct data
          onSubmitCoding({
            codingSubmission: response.submission.codingSubmission,
            totalScore: response.submission.totalScore || 0
          });
        }

        // Add a small delay before moving to the next challenge if not on the last one
        if (currentChallenge < challenges.length - 1) {
          setTimeout(() => {
            setCurrentChallenge(prev => prev + 1);
          }, 1500);
        }
      }

    } catch (error) {
      console.error('Submission Error:', error);
      toast.error('Failed to submit: ' + (error.response?.message || error.message));
      // Reset submission status on error
      setSubmissionStatus(prev => ({
        ...prev,
        [challenge._id]: undefined
      }));
    }
  };

  // Update handleExecuteCode to properly handle the response
  const handleExecuteCode = async () => {
    try {
      setIsExecuting(true);
      setShowTestPanel(true);
      
      const currentCode = answers[challenge._id]?.code;
      if (!currentCode?.trim()) {
        toast.error('Please write some code before running');
        return;
      }

      // Track compilation attempt
      setAnalytics(prev => ({
        ...prev,
        codingMetrics: {
          ...prev.codingMetrics,
          compilationAttempts: {
            ...prev.codingMetrics.compilationAttempts,
            [challenge._id]: (prev.codingMetrics.compilationAttempts[challenge._id] || 0) + 1
          }
        }
      }));

      // Get all non-hidden test cases
      const visibleTestCases = challenge.testCases.filter(test => !test.isHidden);
      const results = [];

      // Execute each visible test case
      for (const testCase of visibleTestCases) {
        setExecutingTests(prev => new Set(prev).add(testCase.id));
        
        const response = await apiService.post('code/execute', {
          code: currentCode,
          language: language,
          inputs: testCase.input
        });

        // Handle different response statuses
        let output = '';
        let error = null;
        let status = response?.status || 'Error';

        if (status === 'Runtime Error (NZEC)' || status !== 'Accepted') {
          error = response?.error || 'Execution failed';
          output = ''; // Clear output on error
        } else {
          output = response?.output || '';
        }

        const cleanOutput = output.trim();
        const expectedOutput = testCase.output?.trim() || '';
        const passed = status === 'Accepted' && cleanOutput === expectedOutput;

        results.push({
          input: testCase.input || '',
          expectedOutput: expectedOutput,
          actualOutput: cleanOutput,
          error: error,
          passed: passed,
          executionTime: response?.executionTime || 0,
          memory: response?.memory || 0,
          status: status
        });

        setExecutingTests(prev => {
          const newSet = new Set(prev);
          newSet.delete(testCase.id);
          return newSet;
        });
      }

      // Update test results
      setTestResults(prev => ({
        ...prev,
        [challenge._id]: {
          status: results.every(r => r.passed) ? 'Passed' : 'Failed',
          executionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
          memory: Math.max(...results.map(r => r.memory)),
          testCaseResults: results
        }
      }));

      // Track test case runs and errors
      setAnalytics(prev => ({
        ...prev,
        codingMetrics: {
          ...prev.codingMetrics,
          testCaseRuns: {
            ...prev.codingMetrics.testCaseRuns,
            [challenge._id]: (prev.codingMetrics.testCaseRuns[challenge._id] || 0) + 1
          },
          errorFrequency: {
            ...prev.codingMetrics.errorFrequency,
            [challenge._id]: {
              ...prev.codingMetrics.errorFrequency[challenge._id],
              [results.find(r => r.error)?.error?.type]: (
                prev.codingMetrics.errorFrequency[challenge._id]?.[results.find(r => r.error)?.error?.type] || 0
              ) + 1
            }
          }
        }
      }));

      return results;

    } catch (error) {
      console.error('Code execution error:', error);
      toast.error('Failed to execute code: ' + (error.response?.data?.message || error.message));
      return [];
    } finally {
      setIsExecuting(false);
      setExecutingTests(new Set());
    }
  };

  const renderSubmitButton = () => {
    if (!challenge?._id) return null;

    const status = submissionStatus[challenge._id];
    const hasCode = answers[challenge._id]?.code?.trim().length > 0;
    
    if (!hasCode) {
      return (
        <button 
          disabled
          className="px-3 py-1.5 bg-gray-400 text-white rounded flex items-center gap-1 text-sm cursor-not-allowed"
          title="Write some code first"
        >
          <Check className="w-3.5 h-3.5" />
          Submit
        </button>
      );
    }

    switch (status) {
      case 'submitted':
        return (
          <button 
            disabled 
            className="px-3 py-1.5 bg-green-600 text-white rounded flex items-center gap-1 text-sm cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            Submitted
          </button>
        );
      
      case 'submitting':
        return (
          <button 
            disabled 
            className="px-3 py-1.5 bg-blue-600 text-white rounded flex items-center gap-1 text-sm cursor-not-allowed"
          >
            <span className="animate-spin">⌛</span>
            Submitting...
          </button>
        );
      
      default:
        return (
          <button 
            onClick={handleSubmitChallenge}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded flex items-center gap-1 text-sm transition-colors"
            title="Submit your solution"
          >
            <Check className="w-3.5 h-3.5" />
            Submit
          </button>
        );
    }
  };

  // Update editor options with additional settings
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: fontSize,
    lineNumbers: showLineNumbers ? 'on' : 'off',
    wordWrap: wordWrap ? 'on' : 'off',
    automaticLayout: true,
    readOnly: false,
    domReadOnly: false,
    scrollBeyondLastLine: false,
    tabSize: 2,
    // Keep basic editing features enabled
    formatOnPaste: true,
    formatOnType: true,
    autoIndent: 'full',
    quickSuggestions: autoComplete,
    suggestOnTriggerCharacters: autoComplete,
    parameterHints: autoComplete ? { enabled: true } : { enabled: false },
  };

  // Update the renderTestResults function to better handle errors
  const renderTestResults = () => {
    const currentResults = testResults[challenge?._id];
    
    if (!currentResults) {
      return (
        <div className="text-gray-400 text-center py-4">
          Run your code to see test results
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {challenge?.testCases
          ?.filter(testCase => !testCase.isHidden)
          ?.map((testCase, index) => {
            const result = currentResults?.testCaseResults?.[index];
            const isExecuting = executingTests.has(testCase.id);

            if (isExecuting) {
              return (
                <div key={index} className="bg-[#2d2d2d] p-4 rounded">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-gray-400">Executing Test Case {index + 1}...</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <span>Test Case {index + 1}</span>
                  <span className={`flex items-center gap-1 ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
                    {result.passed ? (
                      <>
                        <Check className="w-4 h-4" />
                        Passed
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Failed
                      </>
                    )}
                  </span>
                </div>

                <div className="bg-[#2d2d2d] p-2 rounded">
                  <div className="text-gray-400 text-xs mb-1">Input:</div>
                  <pre className="text-gray-200 font-mono text-sm">{result.input}</pre>
                </div>

                <div className="bg-[#2d2d2d] p-2 rounded">
                  <div className="text-gray-400 text-xs mb-1">Expected Output:</div>
                  <pre className="text-gray-200 font-mono text-sm">{result.expectedOutput}</pre>
                </div>

                <div className="bg-[#2d2d2d] p-2 rounded">
                  <div className="text-gray-400 text-xs mb-1">Your Output:</div>
                  {result.error ? (
                    <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">{result.error}</div>
                  ) : (
                    <pre className="text-gray-200 font-mono text-sm">{result.actualOutput}</pre>
                  )}
                  {!result.passed && !result.error && (
                    <div className="mt-2 text-xs">
                      <span className="text-red-400">Raw output: </span>
                      <span className="text-gray-300">"{result.actualOutput}"</span>
                    </div>
                  )}
                </div>

                {/* Add execution details */}
                <div className="text-xs text-gray-400">
                  Status: <span className={result.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}>{result.status}</span>
                  {result.executionTime > 0 && <> • Time: {result.executionTime.toFixed(3)}s</>}
                  {result.memory > 0 && <> • Memory: {result.memory.toFixed(2)}KB</>}
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  // Add reset button to use handleResetCode
  const renderEditorControls = () => {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentChallenge(prev => Math.max(0, prev - 1))}
          disabled={currentChallenge === 0}
          className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-1">
          {challenges.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentChallenge(idx)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs
                ${currentChallenge === idx 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#3c3c3c] text-gray-300 hover:bg-[#4c4c4c]'}
                ${submissionStatus[challenges[idx]._id] === 'submitted' && 'bg-green-600'}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentChallenge(prev => Math.min(challenges.length - 1, prev + 1))}
          disabled={currentChallenge === challenges.length - 1}
          className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300 disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetCode}
          className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300"
          title="Reset Code"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Add editor settings controls */}
        <div className="flex items-center gap-2 ml-4 border-l border-[#3c3c3c] pl-4">
          <button
            onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
            className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300 text-sm"
            title="Increase Font Size"
          >
            A+
          </button>
          <button
            onClick={() => setFontSize(prev => Math.max(prev - 2, 10))}
            className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300 text-sm"
            title="Decrease Font Size"
          >
            A-
          </button>
          
          <button
            onClick={() => setShowLineNumbers(prev => !prev)}
            className={`p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300 ${!showLineNumbers && 'opacity-50'}`}
            title="Toggle Line Numbers"
          >
            #
          </button>
          
          <button
            onClick={() => setWordWrap(prev => !prev)}
            className={`p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300 ${!wordWrap && 'opacity-50'}`}
            title="Toggle Word Wrap"
          >
            ↵
          </button>
          
          <button
            onClick={() => setAutoComplete(prev => !prev)}
            className={`p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300 ${!autoComplete && 'opacity-50'}`}
            title="Toggle Auto Complete"
          >
            <>⌨</>
          </button>
        </div>
      </div>
    );
  };

  // Update handleLanguageChange to preserve user code when changing languages
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    
    // Preserve existing code unless explicitly resetting
    if (challenge?._id && answers[challenge._id]?.code) {
      setAnswers(prev => ({
        ...prev,
        [challenge._id]: {
          ...prev[challenge._id],
          language: newLanguage
        }
      }));
    } else {
      // Only use default code if there's no existing code
      const visibleCode = challenge.languageImplementations?.[newLanguage]?.visibleCode || '';
      setEditorValue(visibleCode);
      setAnswers(prev => ({
        ...prev,
        [challenge._id]: {
          code: visibleCode,
          language: newLanguage
        }
      }));
    }
  };

  // Add this function near the top of the component, after state declarations
  const updateLocalAnalytics = (analytics) => {
    try {
      const testId = localStorage.getItem('currentTestId');
      if (testId) {
        localStorage.setItem(`analytics_${testId}`, JSON.stringify(analytics));
      }
    } catch (error) {
      console.error('Error updating local analytics:', error);
    }
  };

  return (
    <div className="relative h-full">
      {isLoadingTestId && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
      
      <div className="sticky top-0 z-30 bg-[#1e1e1e] border-b border-[#3c3c3c]">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {renderEditorControls()}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-[#3c3c3c] text-white text-sm px-2 py-1 rounded border border-[#4c4c4c]"
            >
              {challenge?.allowedLanguages?.map(lang => (
                <option key={lang} value={lang.toLowerCase()}>{lang}</option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
                className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300"
                title="Toggle Theme"
              >
                {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setShowTestPanel(!showTestPanel)}
                className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300"
                title="Toggle Test Panel"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={handleExecuteCode}
              disabled={isExecuting}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 
                     disabled:opacity-50 flex items-center gap-1 text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              Run
            </button>
            {renderSubmitButton()}
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-10rem)] flex overflow-hidden">
        <div 
          style={{ width: `${isFullscreen ? 0 : layout.leftPanel}%` }}
          className={`flex flex-col bg-[#1e1e1e] border-r border-[#3c3c3c] transition-all duration-300
            ${isFullscreen ? 'w-0 opacity-0' : 'opacity-100'}`}
        >
          <div className="p-4 text-white space-y-4 overflow-y-auto">
            <h2 className="text-xl font-semibold">{challenge?.title}</h2>
            <div className="text-gray-300">{challenge?.description}</div>
            
            <div className="space-y-4">
              {/* Problem Statement */}
              <div className="bg-[#2d2d2d] p-3 rounded-lg">
                <h3 className="font-medium mb-2">Problem Statement</h3>
                <div className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                  {challenge?.problemStatement}
                </div>
              </div>

              {/* Constraints */}
              {challenge?.constraints && (
                <div className="bg-[#2d2d2d] p-3 rounded-lg">
                  <h3 className="font-medium mb-2">Constraints</h3>
                  <div className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                    {challenge.constraints}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div className="bg-[#2d2d2d] p-3 rounded-lg">
                <h3 className="font-medium mb-2">Technical Details</h3>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>Time Limit: {challenge?.timeLimit || 0} seconds</div>
                  <div>Memory Limit: {challenge?.memoryLimit || 0} MB</div>
                  <div>Difficulty: {challenge?.difficulty || 'Not specified'}</div>
                  <div>Points: {challenge?.marks || 0}</div>
                </div>
              </div>

              {/* Allowed Languages */}
              <div className="bg-[#2d2d2d] p-3 rounded-lg">
                <h3 className="font-medium mb-2">Allowed Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {challenge?.allowedLanguages?.map(lang => (
                    <span 
                      key={lang}
                      className="px-2 py-1 bg-[#3c3c3c] rounded text-sm text-gray-300"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <MonacoEditor
            height="100%"
            language={language}
            theme={theme}
            value={editorValue}
            onChange={handleEditorChange}
            options={editorOptions}
            onMount={(editor, monaco) => {
              editor.focus();
            }}
            wrapperClassName="monaco-editor-wrapper"
            className="monaco-editor"
          />
        </div>

        {showTestPanel && (
          <div 
            style={{ width: `${layout.rightPanel}%` }}
            className="bg-[#1e1e1e] border-l border-[#3c3c3c]"
          >
            <div className="h-full overflow-y-auto p-4">
              {renderTestResults()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} // End of CodingSection component
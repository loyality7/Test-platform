import React, { useState, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { 
  Clock, Check, X, Play, ChevronLeft, ChevronRight, 
  Bookmark, Share2, Settings, Layout, Maximize2, 
  FileText, RotateCcw, Save, Eye, EyeOff, Sun, Moon
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CodingSection({ challenges, answers, setAnswers, onSubmitCoding, testId }) {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [language, setLanguage] = useState('');
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState('horizontal');
  const [fontSize, setFontSize] = useState(14);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [autoComplete, setAutoComplete] = useState(true);
  const [programInput, setProgramInput] = useState('');
  const [executionResults, setExecutionResults] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [isLoadingTestId, setIsLoadingTestId] = useState(false);
  const navigate = useNavigate();

  // Add layout state and constants
  const [layout, setLayout] = useState({
    leftPanel: 35, // percentage
    rightPanel: 25, // percentage
    isDragging: false
  });

  const MIN_PANEL_WIDTH = 20; // minimum width percentage
  const MAX_PANEL_WIDTH = 60; // maximum width percentage

  // Add resize handlers
  const handleLeftResize = useCallback((e) => {
    if (!layout.isDragging) return;
    
    const container = e.currentTarget.parentElement;
    const newWidth = (e.clientX / container.offsetWidth) * 100;
    
    if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
      setLayout(prev => ({
        ...prev,
        leftPanel: newWidth
      }));
    }
  }, [layout.isDragging]);

  const handleRightResize = useCallback((e) => {
    if (!layout.isDragging) return;
    
    const container = e.currentTarget.parentElement;
    const containerWidth = container.offsetWidth;
    const newWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
    
    if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
      setLayout(prev => ({
        ...prev,
        rightPanel: newWidth
      }));
    }
  }, [layout.isDragging]);

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

  useEffect(() => {
    if (challenges?.length > 0 && !language) {
      const challenge = challenges[currentChallenge];
      if (challenge?.allowedLanguages?.length > 0) {
        setLanguage(challenge.allowedLanguages[0].toLowerCase());
      }
    }
  }, [challenges, currentChallenge, language]);

  React.useEffect(() => {
    const savedData = localStorage.getItem(`coding_${testId}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setAnswers(parsed.answers);
      setExecutionResults(parsed.executionResults);
    }
  }, [testId, setAnswers]);

  const saveToLocalStorage = (newAnswers, newResults) => {
    if (!testId) return;
    localStorage.setItem(`coding_${testId}`, JSON.stringify({
      answers: newAnswers,
      executionResults: newResults
    }));
  };

  // Initialize answers with default code
  useEffect(() => {
    if (!answers || Object.keys(answers).length === 0) {
      if (!language || !challenges) return;
      
      const initialAnswers = {};
      challenges.forEach(ch => {
        if (!answers?.[ch._id]) {
          const defaultCode = ch.languageImplementations?.[language]?.visibleCode || '// Write your code here\n';
          console.log('Setting initial code for challenge:', ch._id, defaultCode);
          initialAnswers[ch._id] = {
            code: defaultCode,
            language: language
          };
        }
      });
      
      if (Object.keys(initialAnswers).length > 0) {
        setAnswers(initialAnswers);
        saveToLocalStorage(initialAnswers, {});
      }
    }
  }, [challenges, language]);

  if (!challenges || challenges.length === 0) {
    return <div>No challenges available</div>;
  }

  const challenge = challenges[currentChallenge];

  if (!challenge) {
    return <div>Challenge not found</div>;
  }

  console.log('Current Test Results:', testResults);

  const handleEditorChange = (value) => {
    if (!challenge?._id) return;
    
    console.log('Updating code:', value);
    
    setAnswers(prev => ({
      ...prev,
      [challenge._id]: {
        code: value,
        language
      }
    }));
    
    saveToLocalStorage({
      ...answers,
      [challenge._id]: {
        code: value,
        language
      }
    }, executionResults);
  };

  const handleSubmitChallenge = async () => {
    try {
      const currentTestId = testId;
      
      if (!currentTestId) {
        toast.error('Test ID not found');
        return;
      }

      setSubmissionStatus(prev => ({ ...prev, [challenge._id]: 'submitting' }));

      // Format the submission
      const submission = {
        testId: currentTestId,
        submissions: challenges.map(ch => ({
          challengeId: ch._id,
          code: answers[ch._id]?.code || '',
          language: language,
          testCaseResults: executionResults[ch._id]?.testCaseResults || [],
          executionTime: executionResults[ch._id]?.executionTime || 0,
          memory: executionResults[ch._id]?.memory || 0,
          output: executionResults[ch._id]?.output || '',
          error: executionResults[ch._id]?.error || null
        }))
      };

      const response = await apiService.post('submissions/submit/coding', submission);
      
      if (response?.data?.submission) {
        setSubmissionStatus(prev => ({
          ...prev,
          [challenge._id]: 'submitted'
        }));
        toast.success('Challenge submitted successfully!');
        
        // Calculate completion status
        const allChallengesSubmitted = challenges.every(ch => 
          submissionStatus[ch._id] === 'submitted' || 
          ch._id === challenge._id
        );

        if (allChallengesSubmitted) {
          toast.success('All coding challenges completed!');
          // Call the parent's submission handler
          onSubmitCoding({
            codingSubmission: submission,
            totalScore: response.data.submission.totalScore || 0
          });
        }
      }
    } catch (error) {
      console.error('Submission Error:', error);
      toast.error('Failed to submit: ' + (error.response?.data?.message || error.message));
      setSubmissionStatus(prev => ({
        ...prev,
        [challenge._id]: undefined
      }));
    }
  };

  const handleResetCode = () => {
    if (!challenge || !language) return;
    
    const defaultCode = challenge.languageImplementations?.[language]?.visibleCode;
    if (defaultCode) {
      setAnswers(prev => ({
        ...prev,
        [challenge._id]: {
          code: defaultCode,
          language
        }
      }));
      
      // Also update localStorage
      saveToLocalStorage({
        ...answers,
        [challenge._id]: {
          code: defaultCode,
          language
        }
      }, executionResults);
    }
  };

  const handleExecuteCode = async () => {
    try {
      setIsRunning(true);
      const currentCode = answers[challenge._id]?.code;
      
      if (!currentCode || currentCode.trim() === '') {
        toast.error('Please write some code before running');
        return;
      }
      
      if (!language) {
        toast.error('Please select a programming language');
        return;
      }

      const results = [];
      for (const testCase of challenge.testCases) {
        try {
          const requestData = {
            language,
            code: currentCode,
            inputs: testCase.input // This should be a string
          };
          
          console.log('API Request:', requestData);

          // Update the API endpoint to match your specification
          const response = await apiService.post('code/execute', requestData);
          console.log('API Response:', response.data);

          // Handle the response based on the API format you showed
          const result = {
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: response.data.output || '',
            error: response.data.error || null,
            passed: response.data.output?.trim() === testCase.output?.trim(),
            executionTime: response.data.executionTime || 0,
            memory: response.data.memory || 0,
            status: response.data.status || 'Unknown'
          };

          results.push(result);

        } catch (error) {
          console.error('Test case execution error:', error);
          results.push({
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: '',
            error: error.response?.data?.error || error.message,
            passed: false,
            executionTime: 0,
            memory: 0,
            status: 'Runtime Error'
          });
        }
      }

      setTestResults(prev => ({
        ...prev,
        [challenge._id]: {
          status: results.every(r => r.passed) ? 'Accepted' : 'Wrong Answer',
          executionTime: Math.max(...results.map(r => r.executionTime || 0)),
          memory: Math.max(...results.map(r => r.memory || 0)),
          testCaseResults: results
        }
      }));

    } catch (error) {
      console.error('Code execution error:', error);
      toast.error(error.message || 'Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const renderSubmitButton = () => {
    if (!challenge?._id) return null;

    const status = submissionStatus[challenge._id];
    const hasExecutionResults = !!executionResults[challenge._id];
    const allTestsPassed = executionResults[challenge._id]?.testCaseResults?.every(r => r.passed);
    const hasCode = !!answers?.[challenge._id]?.code;
    
    console.log('Code being written:', answers?.[challenge._id]?.code);

    if (!hasCode) {
      return (
        <button 
          disabled
          className="px-3 py-1.5 bg-gray-400 text-white rounded flex items-center gap-1 text-sm"
          title="Write some code first"
        >
          <Check className="w-3.5 h-3.5" />
          Submit
        </button>
      );
    }

    if (status === 'submitted') {
      return (
        <button disabled className="px-3 py-1.5 bg-green-600 text-white rounded flex items-center gap-1 text-sm">
          <Check className="w-3.5 h-3.5" />
          Submitted
        </button>
      );
    }

    if (status === 'submitting') {
      return (
        <button disabled className="px-3 py-1.5 bg-blue-600 text-white rounded flex items-center gap-1 text-sm">
          <span className="animate-spin">⌛</span>
          Submitting...
        </button>
      );
    }

    return (
      <button 
        onClick={handleSubmitChallenge}
        disabled={!hasExecutionResults || !allTestsPassed}
        className={`px-3 py-1.5 ${
          hasExecutionResults && allTestsPassed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
        } text-white rounded flex items-center gap-1 text-sm`}
        title={!hasExecutionResults ? 'Run your code first' : !allTestsPassed ? 'All tests must pass' : 'Submit your solution'}
      >
        <Check className="w-3.5 h-3.5" />
        Submit
      </button>
    );
  };

  // Update the Monaco Editor configuration
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: fontSize,
    lineNumbers: showLineNumbers ? 'on' : 'off',
    wordWrap: wordWrap ? 'on' : 'off',
    automaticLayout: true,
    readOnly: false,
    contextmenu: true,
    quickSuggestions: autoComplete,
    scrollBeyondLastLine: false,
    tabSize: 2,
    formatOnPaste: true,
    formatOnType: true,
    autoIndent: 'full',
    snippetSuggestions: 'inline',
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showVariables: true,
    },
    hover: {
      enabled: true,
      delay: 300,
    },
    bracketPairColorization: {
      enabled: true,
    },
  };

  // Add keyboard shortcuts handler
  const handleEditorDidMount = (editor, monaco) => {
    editor.focus();
    
    // Add custom keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteCode();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveToLocalStorage(answers, executionResults);
      toast.success('Code saved!');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      setShowTestPanel(!showTestPanel);
    });

    // Prevent default copy/paste if needed
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
  };

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
        {/* Overall Status */}
        <div className={`p-3 rounded-lg ${
          currentResults.status === 'Accepted' 
            ? 'bg-green-500/10 text-green-500' 
            : 'bg-red-500/10 text-red-500'
        }`}>
          <div className="font-medium">Status: {currentResults.status}</div>
          <div className="text-sm mt-1">
            <div>Execution Time: {currentResults.executionTime}ms</div>
            <div>Memory Used: {currentResults.memory}KB</div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="space-y-3">
          {currentResults.testCaseResults?.map((result, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                result.passed 
                  ? 'border-green-500/20 bg-green-500/5' 
                  : 'border-red-500/20 bg-red-500/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-200">
                  Test Case {index + 1}
                </div>
                <div className={`flex items-center ${
                  result.passed ? 'text-green-500' : 'text-red-500'
                }`}>
                  {result.passed ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <X className="w-4 h-4 mr-1" />
                  )}
                  {result.passed ? 'Passed' : 'Failed'}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="bg-[#2d2d2d] p-2 rounded">
                  <div className="text-gray-400 mb-1">Input:</div>
                  <div className="text-gray-200 font-mono">
                    {result.input}
                  </div>
                </div>

                <div className="bg-[#2d2d2d] p-2 rounded">
                  <div className="text-gray-400 mb-1">Expected Output:</div>
                  <div className="text-gray-200 font-mono">
                    {result.expectedOutput}
                  </div>
                </div>

                <div className="bg-[#2d2d2d] p-2 rounded">
                  <div className="text-gray-400 mb-1">Your Output:</div>
                  <div className="text-gray-200 font-mono">
                    {result.actualOutput}
                  </div>
                </div>

                {result.error && (
                  <div className="bg-red-500/10 text-red-400 p-2 rounded">
                    <div className="font-medium mb-1">Error:</div>
                    <div className="font-mono text-xs">
                      {result.error}
                    </div>
                  </div>
                )}

                <div className="text-gray-400 text-xs">
                  Execution Time: {result.executionTime}ms
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
          </div>

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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
              disabled={isRunning}
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
            <div className="bg-[#2d2d2d] p-3 rounded-lg">
              <h3 className="font-medium mb-2">Problem Statement</h3>
              <div className="text-gray-300 font-mono text-sm">
                {challenge?.problemStatement}
              </div>
            </div>
            {/* ... rest of the problem description ... */}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <MonacoEditor
            height="100%"
            language={language}
            theme={theme}
            value={answers[challenge?._id]?.code || ''}
            onChange={handleEditorChange}
            options={editorOptions}
            onMount={handleEditorDidMount}
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

function twoSum(nums, target) {
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return [];
}
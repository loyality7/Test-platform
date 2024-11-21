import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { 
  Clock, Check, X, Play, ChevronLeft, ChevronRight, 
  Bookmark, Share2, Settings, Layout, Maximize2, 
  FileText, RotateCcw, Save, Eye, EyeOff, Sun, Moon
} from 'lucide-react';
import { postMethod } from '../../../helpers';

export default function CodingSection({ challenges, answers, setAnswers, onSubmitCoding, testId }) {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [language, setLanguage] = useState('javascript');
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState('horizontal');
  const [fontSize, setFontSize] = useState(14);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [autoComplete, setAutoComplete] = useState(true);

  if (!challenges || challenges.length === 0) {
    return <div>No challenges available</div>;
  }

  const challenge = challenges[currentChallenge];

  if (!challenge) {
    return <div>Challenge not found</div>;
  }

  console.log('Current Test Results:', testResults);

  const handleRunCode = async (challengeId, code, language) => {
    try {
      console.log('Running Code:', {
        challengeId,
        language,
        code
      });

      const testResponse = await postMethod(`submissions/test-code`, {
        challengeId,
        code,
        language
      });

      console.log('Code Test Response:', testResponse.data);

      const results = testResponse.data;
      setTestResults(prev => {
        const newResults = {
          ...prev,
          [challengeId]: results
        };
        console.log('Updated Test Results:', newResults);
        return newResults;
      });

      return results;
    } catch (error) {
      console.error('Code Test Error:', error);
      console.error('Error Details:', {
        message: error.message,
        response: error.response?.data
      });
      return null;
    }
  };

  const handleEditorChange = (value) => {
    console.log('Editor Content Updated:', {
      challengeId: challenge._id,
      language,
      codeLength: value.length
    });
    
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [challenge._id]: {
          code: value,
          language
        }
      };
      console.log('Updated Coding Answers:', newAnswers);
      return newAnswers;
    });
  };

  const handleSubmitCoding = async () => {
    try {
      const formattedSubmissions = Object.entries(answers).map(([challengeId, data]) => ({
        challengeId,
        code: data.code,
        language: data.language,
        testCaseResults: testResults[challengeId]?.testCaseResults || [],
        executionTime: testResults[challengeId]?.executionTime,
        memory: testResults[challengeId]?.memory,
        output: testResults[challengeId]?.output,
        error: testResults[challengeId]?.error
      }));

      console.log('Submitting Coding Solutions:', {
        testId,
        submissions: formattedSubmissions
      });

      const response = await postMethod('submissions/submit/coding', {
        testId,
        submissions: formattedSubmissions
      });

      console.log('Coding Submission Response:', response.data);

      if (response?.data?.submission) {
        console.log('Coding Submission Successful:', response.data.submission);
        onSubmitCoding(response.data.submission);
      }
    } catch (error) {
      console.error('Coding Submission Error:', error);
      console.error('Error Details:', {
        message: error.message,
        response: error.response?.data
      });
    }
  };

  const handleResetCode = () => {
    if (challenge && challenge.languageImplementations?.[language]?.visibleCode) {
      handleEditorChange(challenge.languageImplementations[language].visibleCode);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden">
      {/* Left Panel - Problem Description */}
      <div className={`${!isFullscreen ? 'w-[35%]' : 'w-0'} flex flex-col border-r border-gray-200 bg-white overflow-y-auto transition-all duration-300`}>
        {/* Header with Options */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium">{challenge.title}</h2>
            <Clock className="w-4 h-4 text-gray-500" title="Time Limit: 30 mins" />
          </div>
        </div>

        {/* Problem Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{challenge.description}</span>
            </div>
            <div>
              <h3 className="font-medium mb-1">Problem Statement</h3>
              <div className="bg-gray-50 p-2 rounded font-mono text-sm">
                {challenge.problemStatement}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Constraints</h3>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                {challenge.constraints}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Example Test Cases</h3>
              <div className="space-y-3">
                {challenge.testCases
                  .filter(tc => tc.isVisible)
                  .map((tc, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-mono text-sm">
                        <span className="text-gray-500">Input:</span> {tc.input}
                      </div>
                      <div className="font-mono text-sm mt-1">
                        <span className="text-gray-500">Output:</span> {tc.output}
                      </div>
                      {tc.explanation && (
                        <div className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-2">
                          <span className="font-medium">Explanation:</span> {tc.explanation}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Panel - Code Editor */}
      <div className={`${isFullscreen ? 'w-full' : 'flex-1'} flex flex-col bg-[#1e1e1e] transition-all duration-300`}>
        {/* Editor Controls */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#3c3c3c]">
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#3c3c3c] text-white text-sm px-2 py-1 rounded"
            >
              {challenge.allowedLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>

            {/* Layout Options */}
            <button
              onClick={() => setLayoutMode(layoutMode === 'horizontal' ? 'vertical' : 'horizontal')}
              className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300"
              title="Toggle Layout"
            >
              <Layout className="w-4 h-4" />
            </button>

            {/* Editor Settings Dropdown */}
            <div className="relative group">
              <button className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300">
                <Settings className="w-4 h-4" />
              </button>
              <div className="absolute hidden group-hover:block w-48 bg-[#252526] border border-[#3c3c3c] 
                            rounded-lg shadow-lg mt-1 py-1 z-10 left-0">
                <label className="flex items-center px-3 py-1.5 hover:bg-[#3c3c3c] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Show Line Numbers</span>
                </label>
                <label className="flex items-center px-3 py-1.5 hover:bg-[#3c3c3c] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={(e) => setWordWrap(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Word Wrap</span>
                </label>
                <label className="flex items-center px-3 py-1.5 hover:bg-[#3c3c3c] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoComplete}
                    onChange={(e) => setAutoComplete(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Auto Complete</span>
                </label>
                <div className="px-3 py-1.5 hover:bg-[#3c3c3c]">
                  <span className="text-sm text-gray-300">Font Size</span>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
              className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300"
              title="Toggle Theme"
            >
              {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Reset Code to Default */}
            <button
              onClick={handleResetCode}
              className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300"
              title="Reset to Default Code"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-300"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Run & Submit Buttons */}
            <button 
              onClick={() => {
                handleRunCode(challenge._id, answers[challenge._id]?.code || '', language);
                setShowTestPanel(true);
              }}
              disabled={isRunning}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 
                       disabled:opacity-50 flex items-center gap-1 text-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Run
            </button>
            <button 
              onClick={handleSubmitCoding}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700
                       flex items-center gap-1 text-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Submit
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1">
          <MonacoEditor
            height="100%"
            language={language}
            theme={theme}
            value={answers[challenge._id]?.code || ''}
            options={{
              minimap: { enabled: false },
              fontSize: fontSize,
              scrollBeyondLastLine: false,
              lineNumbers: showLineNumbers ? 'on' : 'off',
              wordWrap: wordWrap ? 'on' : 'off',
              automaticLayout: true,
              suggestOnTriggerCharacters: autoComplete,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
              quickSuggestions: autoComplete,
            }}
            onChange={handleEditorChange}
          />
        </div>
      </div>

      {/* Right Panel - Test Results */}
      <div className={`h-full bg-[#1e1e1e] border-l border-[#3c3c3c] transition-all duration-300 
        ${showTestPanel ? 'w-[25%]' : 'w-0'}`}>
        {showTestPanel && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c]">
              <span className="text-sm text-white font-medium">Test Results</span>
              <button 
                onClick={() => setShowTestPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Test Results Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((result, idx) => (
                    <div key={idx} className={`rounded-lg p-3 ${
                      result.status === 'passed' 
                        ? 'bg-green-900/30 border border-green-700/30' 
                        : 'bg-red-900/30 border border-red-700/30'
                    }`}>
                      {/* ... test result content ... */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center">
                  Run your code to see test results
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function CodingSection({ challenges, answers, setAnswers }) {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [language, setLanguage] = useState('javascript');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');

  const challenge = challenges[currentChallenge];

  const handleRunCode = async () => {
    setIsRunning(true);
    setConsoleOutput('Running test cases...\n');
    
    try {
      // Simulate test case execution
      const results = challenge.testCases.map((testCase, index) => ({
        testCase: index + 1,
        input: testCase.input,
        expectedOutput: testCase.output,
        status: 'passed',
        executionTime: '2ms',
        memory: '38.2 MB'
      }));
      
      setTestResults(results);
      setConsoleOutput(prev => prev + 'All test cases passed!\n');
    } catch (error) {
      setConsoleOutput(prev => prev + `Error: ${error.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Top Navigation */}
      <div className="flex-none bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">
              {currentChallenge + 1}. {challenge.title}
            </h2>
            <span className={`px-2 py-1 rounded text-sm ${
              challenge.difficulty === 'easy' ? 'bg-green-600' :
              challenge.difficulty === 'medium' ? 'bg-yellow-600' :
              'bg-red-600'
            }`}>
              {challenge.difficulty}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded"
            >
              {challenge.allowedLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        <PanelGroup direction="horizontal">
          {/* Left Panel */}
          <Panel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col bg-white">
              <div className="flex-none border-b">
                <div className="flex">
                  {['description', 'submissions'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6">
                {activeTab === 'description' ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-600 mb-6">{challenge.description}</p>
                    
                    <h3 className="text-lg font-semibold mb-2">Problem Statement</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <pre className="whitespace-pre-wrap">{challenge.problemStatement}</pre>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">Constraints</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <pre className="whitespace-pre-wrap">{challenge.constraints}</pre>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">Example Test Cases</h3>
                    {challenge.testCases
                      .filter(tc => tc.isVisible)
                      .map((tc, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="font-mono mb-2">Input: {tc.input}</p>
                          <p className="font-mono mb-2">Output: {tc.output}</p>
                          {tc.explanation && (
                            <p className="text-gray-600">Explanation: {tc.explanation}</p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-gray-600">
                    Submission history will appear here
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

          {/* Right Panel */}
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col">
              <MonacoEditor
                height="60%"
                language={language}
                theme="vs-dark"
                value={challenge.languageImplementations[language]?.visibleCode || ''}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBars: 'vertical',
                  cursorStyle: 'line',
                  rulers: [],
                  folding: true
                }}
                onChange={(value) => {
                  setAnswers(prev => ({
                    ...prev,
                    [challenge._id]: { code: value, language }
                  }));
                }}
              />

              {/* Console and Test Results */}
              <div className="h-[40%] border-t border-gray-700">
                <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
                  <div className="flex space-x-4">
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Run
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Submit
                    </button>
                  </div>
                </div>

                <div className="h-[calc(100%-40px)] overflow-y-auto bg-gray-900 text-white p-4">
                  {testResults.length > 0 ? (
                    <div className="space-y-2">
                      {testResults.map((result, idx) => (
                        <div key={idx} className={`p-2 rounded ${
                          result.status === 'passed' ? 'bg-green-900' : 'bg-red-900'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span>Test Case {result.testCase}</span>
                            <div className="flex space-x-4 text-sm">
                              <span>Time: {result.executionTime}</span>
                              <span>Memory: {result.memory}</span>
                            </div>
                          </div>
                          <div className="mt-1 text-sm">
                            <div>Input: {result.input}</div>
                            <div>Expected: {result.expectedOutput}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="font-mono text-sm">{consoleOutput}</pre>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
} 
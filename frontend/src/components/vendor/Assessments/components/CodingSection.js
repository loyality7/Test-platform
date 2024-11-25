import React, { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';

const CodingSection = ({ testData, setTestData }) => {
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    problemStatement: '',
    constraints: '',
    allowedLanguages: [],
    languageImplementations: {},
    marks: 0,
    timeLimit: 60,
    memoryLimit: 512,
    difficulty: 'easy',
    testCases: []
  });

  const [newTestCase, setNewTestCase] = useState({
    input: '',
    output: '',
    isHidden: false
  });

  const programmingLanguages = [
    'Python', 'JavaScript', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Go', 'Swift'
  ];

  const handleAddChallenge = () => {
    setTestData({
      ...testData,
      codingChallenges: [...testData.codingChallenges, newChallenge]
    });
    // Reset form
    setNewChallenge({
      title: '',
      description: '',
      problemStatement: '',
      constraints: '',
      allowedLanguages: [],
      languageImplementations: {},
      marks: 0,
      timeLimit: 60,
      memoryLimit: 512,
      difficulty: 'easy',
      testCases: []
    });
  };

  const handleAddTestCase = () => {
    setNewChallenge({
      ...newChallenge,
      testCases: [...newChallenge.testCases, newTestCase]
    });
    setNewTestCase({
      input: '',
      output: '',
      isHidden: false
    });
  };

  const handleLanguageToggle = (language) => {
    const updatedLanguages = newChallenge.allowedLanguages.includes(language)
      ? newChallenge.allowedLanguages.filter(lang => lang !== language)
      : [...newChallenge.allowedLanguages, language];
    
    setNewChallenge({
      ...newChallenge,
      allowedLanguages: updatedLanguages
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Add Coding Challenge</h3>
        
        <div className="space-y-4">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challenge Title*
            </label>
            <input
              type="text"
              value={newChallenge.title}
              onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter challenge title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              value={newChallenge.description}
              onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Enter challenge description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Problem Statement*
            </label>
            <textarea
              value={newChallenge.problemStatement}
              onChange={(e) => setNewChallenge({ ...newChallenge, problemStatement: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={4}
              placeholder="Enter detailed problem statement"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Constraints*
            </label>
            <textarea
              value={newChallenge.constraints}
              onChange={(e) => setNewChallenge({ ...newChallenge, constraints: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={2}
              placeholder="Enter constraints (e.g., input ranges, time/space complexity)"
            />
          </div>

          {/* Challenge Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (seconds)*
              </label>
              <input
                type="number"
                value={newChallenge.timeLimit}
                onChange={(e) => setNewChallenge({ ...newChallenge, timeLimit: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Memory Limit (MB)*
              </label>
              <input
                type="number"
                value={newChallenge.memoryLimit}
                onChange={(e) => setNewChallenge({ ...newChallenge, memoryLimit: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marks*
              </label>
              <input
                type="number"
                value={newChallenge.marks}
                onChange={(e) => setNewChallenge({ ...newChallenge, marks: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg"
                min="1"
              />
            </div>
          </div>

          {/* Allowed Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Languages*
            </label>
            <div className="flex flex-wrap gap-2">
              {programmingLanguages.map(language => (
                <button
                  key={language}
                  onClick={() => handleLanguageToggle(language)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    newChallenge.allowedLanguages.includes(language)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Cases
            </label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Input</label>
                  <textarea
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Test case input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Expected Output</label>
                  <textarea
                    value={newTestCase.output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, output: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Expected output"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={newTestCase.isHidden}
                  onChange={(e) => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 rounded"
                />
                <label htmlFor="isHidden" className="ml-2 text-sm text-gray-600">
                  Hidden test case
                </label>
              </div>
              <button
                onClick={handleAddTestCase}
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Test Case
              </button>
            </div>
          </div>

          <button
            onClick={handleAddChallenge}
            className="w-full mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Add Challenge
          </button>
        </div>
      </div>

      {/* List of Added Challenges */}
      {testData.codingChallenges.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Added Challenges</h3>
          <div className="space-y-4">
            {testData.codingChallenges.map((challenge, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{challenge.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        {challenge.marks} marks • {challenge.timeLimit}s • {challenge.memoryLimit}MB
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {challenge.allowedLanguages.map(lang => (
                        <span key={lang} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        const updatedChallenges = testData.codingChallenges.filter((_, i) => i !== index);
                        setTestData({
                          ...testData,
                          codingChallenges: updatedChallenges
                        });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingSection; 
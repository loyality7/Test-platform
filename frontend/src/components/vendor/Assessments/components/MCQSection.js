import React, { useState } from 'react';
import { Plus, Trash2, Edit, X, History } from 'lucide-react';

const MCQSection = ({ testData, setTestData }) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [newMCQ, setNewMCQ] = useState({
    question: '',
    options: ['', ''],
    correctOptions: [],
    answerType: 'single',
    marks: 1,
    difficulty: 'easy',
    tags: []
  });

  const [questionVersions, setQuestionVersions] = useState({});

  const handleAddOption = () => {
    setNewMCQ({
      ...newMCQ,
      options: [...newMCQ.options, '']
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newMCQ.options];
    updatedOptions[index] = value;
    setNewMCQ({
      ...newMCQ,
      options: updatedOptions
    });
  };

  const handleCorrectOptionChange = (index) => {
    let updatedCorrectOptions = [...newMCQ.correctOptions];
    if (newMCQ.answerType === 'single') {
      updatedCorrectOptions = [index];
    } else {
      if (updatedCorrectOptions.includes(index)) {
        updatedCorrectOptions = updatedCorrectOptions.filter(i => i !== index);
      } else {
        updatedCorrectOptions.push(index);
      }
    }
    setNewMCQ({
      ...newMCQ,
      correctOptions: updatedCorrectOptions
    });
  };

  const handleAddMCQ = () => {
    if (!newMCQ.question.trim()) return;
    
    setTestData({
      ...testData,
      mcqs: [...(testData.mcqs || []), { ...newMCQ, id: Date.now() }]
    });

    // Reset form
    setNewMCQ({
      question: '',
      options: ['', ''],
      correctOptions: [],
      answerType: 'single',
      marks: 1,
      difficulty: 'easy',
      tags: []
    });
  };

  const estimateDifficulty = (question) => {
    if (!question) return 'easy';
    
    let score = 0;
    
    // Length of question
    score += question.length > 100 ? 2 : 1;
    
    // Number of options
    score += newMCQ.options.length > 4 ? 2 : 1;
    
    // Multiple correct answers
    score += newMCQ.correctOptions.length > 1 ? 2 : 0;
    
    return score > 4 ? 'hard' : score > 2 ? 'medium' : 'easy';
  };

  const saveVersion = (questionId) => {
    setQuestionVersions(prev => ({
      ...prev,
      [questionId]: [
        ...(prev[questionId] || []),
        {
          ...testData.mcqs.find(q => q.id === questionId),
          timestamp: new Date().toISOString(),
          version: (prev[questionId]?.length || 0) + 1
        }
      ]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Add Multiple Choice Question</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question*
            </label>
            <textarea
              value={newMCQ.question}
              onChange={(e) => setNewMCQ({ ...newMCQ, question: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Enter your question"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Answer Type
            </label>
            <select
              value={newMCQ.answerType}
              onChange={(e) => setNewMCQ({ ...newMCQ, answerType: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="single">Single Correct Answer</option>
              <option value="multiple">Multiple Correct Answers</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options
            </label>
            <div className="space-y-2">
              {newMCQ.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type={newMCQ.answerType === 'single' ? 'radio' : 'checkbox'}
                    checked={newMCQ.correctOptions.includes(index)}
                    onChange={() => handleCorrectOptionChange(index)}
                    className="h-4 w-4"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-2 border rounded-lg"
                    placeholder={`Option ${index + 1}`}
                  />
                  {index > 1 && (
                    <button
                      onClick={() => {
                        const updatedOptions = newMCQ.options.filter((_, i) => i !== index);
                        setNewMCQ({
                          ...newMCQ,
                          options: updatedOptions,
                          correctOptions: newMCQ.correctOptions.filter(i => i !== index)
                        });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleAddOption}
              className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Option
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marks
              </label>
              <input
                type="number"
                value={newMCQ.marks}
                onChange={(e) => setNewMCQ({ ...newMCQ, marks: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={newMCQ.difficulty}
                onChange={(e) => setNewMCQ({ ...newMCQ, difficulty: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Add tags..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setNewMCQ({
                      ...newMCQ,
                      tags: [...(newMCQ.tags || []), e.target.value]
                    });
                    e.target.value = '';
                  }
                }}
                className="flex-1 p-2 border rounded-lg"
              />
              {newMCQ.tags?.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-sm flex items-center">
                  {tag}
                  <X 
                    className="h-3 w-3 ml-2 cursor-pointer" 
                    onClick={() => {
                      setNewMCQ({
                        ...newMCQ,
                        tags: newMCQ.tags.filter((_, i) => i !== index)
                      });
                    }}
                  />
                </span>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500 mt-1">
            Suggested difficulty: {estimateDifficulty(newMCQ.question)}
          </div>

          <button
            onClick={handleAddMCQ}
            className="w-full mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Add Question
          </button>
        </div>
      </div>

      {/* List of Added MCQs */}
      {testData.mcqs.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Added Questions</h3>
          <div className="space-y-4">
            {testData.mcqs.map((mcq, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{mcq.question}</p>
                    <div className="mt-2 space-y-1">
                      {mcq.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type={mcq.answerType === 'single' ? 'radio' : 'checkbox'}
                            checked={mcq.correctOptions.includes(optIndex)}
                            readOnly
                            className="h-4 w-4"
                          />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {mcq.marks} marks • {mcq.difficulty} • {mcq.answerType} answer
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        const updatedMCQs = testData.mcqs.filter((_, i) => i !== index);
                        setTestData({
                          ...testData,
                          mcqs: updatedMCQs
                        });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => saveVersion(mcq.id)}
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                    >
                      <History className="h-4 w-4" />
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

export default MCQSection; 
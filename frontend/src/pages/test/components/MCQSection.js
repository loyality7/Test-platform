import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, CheckCircle2, Circle, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

export default function MCQPage({ mcqs, testId, onSubmitMCQs }) {
  const [currentMcq, setCurrentMcq] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(120 * 60);
  const navigate = useNavigate();
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTestId, setIsLoadingTestId] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log('MCQ Component Props:', {
      mcqsCount: mcqs?.length,
      testId,
      currentAnswers: answers
    });
  }, [mcqs, testId, answers]);

  useEffect(() => {
    const parseTestUUID = async () => {
      try {
        setIsLoadingTestId(true);
        const uuid = window.location.pathname.split('/').pop(); // Get UUID from URL
        const token = localStorage.getItem('token');
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tests/parse/${uuid}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data?.data?.id) {
          localStorage.setItem('currentTestId', response.data.data.id);
          console.log('Test ID stored:', response.data.data.id);
        }
      } catch (error) {
        console.error('Error parsing test UUID:', error);
      } finally {
        setIsLoadingTestId(false);
      }
    };

    if (!localStorage.getItem('currentTestId')) {
      parseTestUUID();
    }
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitMCQs = async () => {
    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        navigate('/login');
        return;
      }

      const formattedSubmissions = Object.entries(answers).map(([questionId, data]) => ({
        questionId,
        selectedOptions: data.selectedOptions
      }));

      const requestPayload = {
        testId,
        submissions: formattedSubmissions
      };
      
      const requestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('API Request Details:', {
        url: `${process.env.REACT_APP_API_URL}/api/submissions/submit/mcq`,
        payload: requestPayload,
        config: requestConfig
      });

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/submissions/submit/mcq`,
        requestPayload,
        requestConfig
      );

      if (response.status === 201 && response.data.submission) {
        console.log('MCQ Submission Successful!', response.data);
        onSubmitMCQs(response.data.submission);
      }
    } catch (error) {
      console.error('MCQ Submission Error:', {
        message: error.message,
        response: error.response?.data
      });
      
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
      } else {
        alert(error.response?.data?.message || 'Failed to submit MCQs. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentMcq < mcqs.length - 1) {
      setCurrentMcq(prev => prev + 1);
      console.log('Moving to next question:', currentMcq + 1);
    } else {
      console.log('Reached last question, attempting submission');
      if (window.confirm('Are you sure you want to submit your MCQ answers?')) {
        handleSubmitMCQs();
      }
    }
  };

  const progress = (Object.keys(answers).length / mcqs.length) * 100;
  const mcq = mcqs[currentMcq];

  const isAllQuestionsAnswered = (answers, mcqs) => {
    const result = Object.keys(answers).length === mcqs.length;
    console.log('Checking completion:', {
      answeredCount: Object.keys(answers).length,
      totalQuestions: mcqs.length,
      isComplete: result
    });
    return result;
  };

  const handleOptionSelect = (questionId, optionIndex) => {
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    console.log('Selecting Option:', {
      questionId,
      optionIndex,
      timeTaken,
      currentAnswers: answers
    });
    
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: {
          selectedOptions: [optionIndex],
          timeTaken
        }
      };
      console.log('Updated Answers State:', newAnswers);
      return newAnswers;
    });
    setQuestionStartTime(Date.now());
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-2 py-2">
      {/* Status Bar - More Compact */}
      <div className="bg-white shadow-sm rounded-lg mb-2">
        <div className="grid grid-cols-3 gap-2 p-2">
          {/* Time Left Card */}
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Time Left</p>
              <p className="text-sm font-bold">{formatTime(timeLeft)}</p>
            </div>
          </div>

          {/* Questions Progress Card */}
          <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-medium">Questions</p>
              <p className="text-sm font-bold">{Object.keys(answers).length} / {mcqs.length}</p>
            </div>
          </div>

          {/* Progress Bar Card */}
          <div className="bg-purple-50 rounded-lg p-2">
            <p className="text-xs text-purple-600 font-medium mb-1">Progress</p>
            <div className="w-full bg-purple-100 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${(Object.keys(answers).length / mcqs.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Navigator - More Compact */}
        <div className="border-t border-gray-100 p-2">
          <div className="flex flex-wrap gap-1">
            {mcqs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMcq(index)}
                className={`
                  w-6 h-6 rounded flex items-center justify-center text-xs font-medium
                  transition-all border
                  ${answers[mcqs[index]._id]
                    ? 'bg-blue-600 text-white border-blue-600'
                    : currentMcq === index
                      ? 'bg-gray-100 text-gray-700 border-gray-300'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Card - More Compact */}
      <div className="bg-white shadow-sm rounded-lg flex-1 flex flex-col">
        {/* Question Header */}
        <div className="border-b border-gray-200 p-2">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
              Question {currentMcq + 1}
            </span>
            <span className="text-gray-500 text-xs">
              {mcqs[currentMcq].marks} marks
            </span>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-3 flex-1">
          <div className="prose max-w-none mb-3">
            <p className="text-gray-800 text-base">{mcqs[currentMcq].question}</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {mcqs[currentMcq].options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionSelect(mcqs[currentMcq]._id, index)}
                className={`
                  p-2 rounded-lg border cursor-pointer
                  transition-all duration-200
                  ${answers[mcqs[currentMcq]._id] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${answers[mcqs[currentMcq]._id] === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {answers[mcqs[currentMcq]._id] === index && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-gray-700">{option}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentMcq(prev => prev - 1)}
              disabled={currentMcq === 0}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2
                ${currentMcq === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            {!isAllQuestionsAnswered(answers, mcqs) ? (
              <button
                onClick={() => setCurrentMcq(prev => prev + 1)}
                disabled={!answers[mcqs[currentMcq]._id]}
                className={`
                  px-4 py-2 rounded-lg flex items-center gap-2
                  ${answers[mcqs[currentMcq]._id]
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitMCQs}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition-all flex items-center gap-2"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit MCQs'}</span>
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
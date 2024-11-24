import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../../../services/api';

export default function MCQPage({ mcqs, testId, onSubmitMCQs, analytics, setAnalytics }) {
  const [currentMcq, setCurrentMcq] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateLocalAnalytics = useCallback((analytics) => {
    try {
      const testId = localStorage.getItem('currentTestId');
      if (testId) {
        localStorage.setItem(`analytics_${testId}`, JSON.stringify(analytics));
      }
    } catch (error) {
      console.error('Error updating local analytics:', error);
    }
  }, []);

  const handleSubmitMCQs = useCallback(async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      const currentTestId = testId || localStorage.getItem('currentTestId');
      if (!currentTestId) {
        toast.error('Test ID not found');
        return;
      }

      // Only include submissions for current MCQs
      const formattedSubmissions = mcqs.map(mcq => {
        const answer = answers[mcq._id];
        return answer ? {
          questionId: mcq._id,
          selectedOptions: answer.selectedOptions.map(Number)
        } : null;
      }).filter(Boolean);

      if (formattedSubmissions.length === 0) {
        toast.error('Please answer at least one question before submitting');
        return;
      }

      const submissionData = {
        testId: currentTestId,
        submissions: formattedSubmissions
      };

      console.log('Submitting data:', submissionData);

      const response = await apiService.post('submissions/submit/mcq', submissionData);

      if (response?.submissionId) {
        setIsSubmitted(true);
        toast.success('MCQs submitted successfully!');
        localStorage.removeItem('mcq_answers');
        
        localStorage.setItem('submissionId', response.submissionId);
        
        if (onSubmitMCQs) {
          onSubmitMCQs(response.data);
        }

        setCurrentMcq(prev => prev);
      } else {
        throw new Error('Submission response was not successful');
      }
    } catch (error) {
      console.error('Submission Error:', error);
      const errorMessage = error.response?.message || 'Failed to submit MCQs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [testId, answers, onSubmitMCQs, mcqs]);

  const handleOptionSelect = (questionId, optionIndex) => {
    setAnswers(prev => {
      const prevAnswer = prev[questionId]?.selectedOptions?.[0];
      if (prevAnswer !== undefined) {
        setAnalytics(prev => ({
          ...prev,
          mcqMetrics: {
            ...prev.mcqMetrics,
            changedAnswers: {
              ...prev.mcqMetrics.changedAnswers,
              [questionId]: (prev.mcqMetrics.changedAnswers[questionId] || 0) + 1
            }
          }
        }));
      }
      return {
        ...prev,
        [questionId]: {
          selectedOptions: [optionIndex]
        }
      };
    });
  };

  // Save answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('mcq_answers', JSON.stringify(answers));
    }
  }, [answers]);

  // Load saved answers from localStorage
  useEffect(() => {
    const savedAnswers = localStorage.getItem('mcq_answers');
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        // Only load answers that correspond to current MCQ questions
        const filteredAnswers = Object.entries(parsed).reduce((acc, [key, value]) => {
          if (mcqs.some(mcq => mcq._id === key)) {
            acc[key] = value;
          }
          return acc;
        }, {});
        setAnswers(filteredAnswers);
      } catch (error) {
        console.error('Error loading saved answers:', error);
        localStorage.removeItem('mcq_answers');
      }
    }
  }, [mcqs]);

  // Check if test was already submitted
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      try {
        const currentTestId = testId || localStorage.getItem('currentTestId');
        const submissionId = localStorage.getItem('submissionId');
        
        if (submissionId) {
          setIsSubmitted(true);
          return;
        }
        
        if (currentTestId) {
          const response = await apiService.get(`submissions/status/${currentTestId}`);
          if (response.data.isSubmitted) {
            setIsSubmitted(true);
          }
        }
      } catch (error) {
        console.error('Error checking submission status:', error);
      }
    };

    checkSubmissionStatus();
  }, [testId]);

  // Track time spent per question
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      setAnalytics(prev => {
        const updated = {
          ...prev,
          mcqMetrics: {
            ...prev.mcqMetrics,
            timePerQuestion: {
              ...prev.mcqMetrics.timePerQuestion,
              [currentMcq]: (prev.mcqMetrics.timePerQuestion[currentMcq] || 0) + 
                           (Date.now() - startTime) / 1000
            }
          }
        };
        updateLocalAnalytics(updated);
        return updated;
      });
    };
  }, [currentMcq, setAnalytics, updateLocalAnalytics]);

  // Track skipped questions
  const handleNext = () => {
    if (!answers[mcqs[currentMcq]._id]) {
      setAnalytics(prev => ({
        ...prev,
        mcqMetrics: {
          ...prev.mcqMetrics,
          skippedQuestions: new Set([...prev.mcqMetrics.skippedQuestions, currentMcq])
        }
      }));
    }
    setCurrentMcq(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-2 py-2">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm rounded-lg mb-4 p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600">
              {currentMcq + 1} of {mcqs.length}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 rounded-full h-2 transition-all"
            style={{ width: `${((currentMcq + 1) / mcqs.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {mcqs[currentMcq] && (
        <div className="bg-white shadow-sm rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Question {currentMcq + 1}</h3>
            <p className="text-gray-700 mt-2">{mcqs[currentMcq].question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {mcqs[currentMcq].options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionSelect(mcqs[currentMcq]._id, index)}
                className={`p-3 rounded-lg border cursor-pointer transition-all
                  ${answers[mcqs[currentMcq]._id]?.selectedOptions[0] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center gap-2">
                  {answers[mcqs[currentMcq]._id]?.selectedOptions[0] === index ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentMcq(prev => prev - 1)}
              disabled={currentMcq === 0}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {currentMcq === mcqs.length - 1 ? (
              <button
                onClick={handleSubmitMCQs}
                disabled={isSubmitting || isSubmitted}
                className={`px-6 py-2 ${
                  isSubmitted ? 'bg-gray-600' : 'bg-green-600'
                } text-white rounded-lg flex items-center gap-2 disabled:opacity-50`}
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : isSubmitted ? (
                  <>
                    Submitted
                    <Check className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Submit All
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!answers[mcqs[currentMcq]._id]}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
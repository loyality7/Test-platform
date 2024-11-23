import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, CheckCircle2, Circle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../../../services/api';
import { toast } from 'react-hot-toast';

export default function MCQPage({ mcqs, testId, onSubmitMCQs }) {
  const [currentMcq, setCurrentMcq] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(120 * 60);
  const [error, setError] = useState(null);
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
    if (mcqs?.length && (testId || localStorage.getItem('currentTestId'))) {
      console.log('MCQ Component Props:', {
        mcqsCount: mcqs?.length,
        testId: testId || localStorage.getItem('currentTestId'),
        answersCount: Object.keys(answers).length
      });
    }
  }, [mcqs, testId, answers]);

  useEffect(() => {
    const parseTestUUID = async () => {
      try {
        setIsLoadingTestId(true);
        const uuid = window.location.pathname.split('/').pop();
        
        const response = await apiService.get(`tests/parse/${uuid}`);

        if (response?.data?.id) {
          localStorage.setItem('currentTestId', response.data.id);
          console.log('Test ID stored:', response.data.id);
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

  const handleSubmitMCQs = useCallback(async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      
      const currentTestId = testId || localStorage.getItem('currentTestId');
      
      if (!currentTestId) {
        toast.error('Test ID not found. Please refresh the page.');
        return;
      }

      try {
        const testStatus = await apiService.get(`tests/status/${currentTestId}`);
        if (testStatus?.data?.registrationStatus === 'completed') {
          toast.error('This test has already been completed!');
          navigate('/dashboard');
          return;
        }
      } catch (statusError) {
        console.error('Error checking test status:', statusError);
      }

      const formattedSubmissions = Object.entries(answers).map(([questionId, data]) => ({
        questionId,
        selectedOptions: data.selectedOptions,
        timeTaken: data.timeTaken || 0
      }));

      if (formattedSubmissions.length === 0) {
        toast.error('No answers selected. Please answer at least one question.');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');

      if (!sessionId) {
        console.error('No session ID found');
        toast.error('Invalid session. Please try again.');
        return;
      }

      const submissionData = {
        testId: currentTestId,
        submissions: formattedSubmissions,
        sessionId: sessionId
      };

      console.log('Submitting MCQ Data:', submissionData);

      const response = await apiService.post('submissions/submit/mcq', submissionData);

      if (response?.data) {
        console.log('MCQ Submission Response:', response.data);
        
        if (response.data.registrationStatus === 'completed') {
          toast.success('Test completed successfully!');
          localStorage.removeItem('currentTestId');
          localStorage.removeItem('mcq_answers');
          navigate('/dashboard');
          return;
        }

        if (response.data.error) {
          throw new Error(response.data.message || response.data.error);
        }

        if (response.data.submission || response.data.submissionId) {
          console.log('MCQ Submission Success:', response.data);
          localStorage.removeItem('currentTestId');
          localStorage.removeItem('mcq_answers');
          onSubmitMCQs(response.data.submission);
        } else {
          throw new Error('Server response missing submission data');
        }
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      setError(error.message || 'An error occurred during submission');
      console.error('MCQ Submission Error:', error);
      
      if (error?.response?.data?.registrationStatus === 'completed' || 
          error?.response?.data?.error === 'Test registration status is completed') {
        localStorage.removeItem('currentTestId');
        localStorage.removeItem('mcq_answers');
        toast.error('This test has already been completed. You cannot submit again.');
        navigate('/dashboard');
        return;
      }
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.registrationStatus === 'completed') {
          toast.error('This test has already been completed. You cannot submit again.');
          navigate('/dashboard');
          return;
        }
        
        if (errorData.requiresRegistration) {
          toast.error('You need to register for this test first.');
          navigate(`/test/register/${testId}`);
          return;
        }
        
        if (errorData.message) {
          toast.error(errorData.message);
          return;
        }
      }
      
      if (error?.response?.status) {
        switch (error.response.status) {
          case 401:
            toast.error('Session expired. Please log in again.');
            navigate('/login');
            break;
          case 403:
            toast.error('Not authorized to submit answers');
            break;
          case 404:
            toast.error('Test not found. Please check the URL.');
            break;
          case 422:
            toast.error('Invalid submission data. Please check your answers.');
            break;
          default:
            toast.success('Submission complete!');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [testId, answers, navigate]);

  const confirmSubmission = () => {
    const unansweredCount = mcqs.length - Object.keys(answers).length;
    
    return new Promise((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">
            {unansweredCount > 0 
              ? `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}.`
              : 'Submit your answers?'}
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded-md"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              Submit
            </button>
            <button
              className="px-3 py-1 bg-gray-200 rounded-md"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    });
  };

  const handleSubmitClick = async () => {
    const shouldSubmit = await confirmSubmission();
    if (shouldSubmit) {
      handleSubmitMCQs();
    }
  };

  const handleNext = useCallback(() => {
    if (currentMcq < mcqs.length - 1) {
      setCurrentMcq(prev => prev + 1);
      console.log('Moving to next question:', currentMcq + 1);
    } else {
      console.log('Reached last question, attempting submission');
      if (window.confirm('Are you sure you want to submit your MCQ answers?')) {
        handleSubmitMCQs();
      }
    }
  }, [currentMcq, mcqs.length, handleSubmitMCQs]);

  const isAllQuestionsAnswered = (answers, mcqs) => {
    const result = Object.keys(answers).length === mcqs.length;
    // console.log('Checking completion:', {
    //   answeredCount: Object.keys(answers).length,
    //   totalQuestions: mcqs.length,
    //   isComplete: result
    // });
    return result;
  };

  const handleOptionSelect = (questionId, optionIndex) => {
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    
    setAnswers(prev => {
      const existingAnswer = prev[questionId];
      const newAnswers = {
        ...prev,
        [questionId]: {
          selectedOptions: [optionIndex],
          timeTaken: existingAnswer ? existingAnswer.timeTaken : timeTaken
        }
      };
      console.log('Updated Answers:', newAnswers);
      return newAnswers;
    });

    setQuestionStartTime(Date.now());
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(answers).length > 0 && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, isSubmitting]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('mcq_answers', JSON.stringify(answers));
    }
  }, [answers]);

  useEffect(() => {
    const savedAnswers = localStorage.getItem('mcq_answers');
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (error) {
        console.error('Error loading saved answers:', error);
        localStorage.removeItem('mcq_answers');
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-2 py-2">
      {/* Status Bar - More Compact */}
      <div className="bg-white shadow-sm rounded-lg mb-2">
        <div className="grid grid-cols-4 gap-2 p-2">
          {/* Time Left Card */}
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-2">
            <Timer className="w-4 h-4 text-blue-600" />
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
                  ${answers[mcqs[currentMcq]._id]?.selectedOptions[0] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {answers[mcqs[currentMcq]._id]?.selectedOptions[0] === index ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
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
                onClick={handleSubmitClick}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition-all flex items-center gap-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse">Submitting...</span>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Submit MCQs</span>
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {isLoadingTestId && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading test...</span>
        </div>
      )}
    </div>
  );
} 
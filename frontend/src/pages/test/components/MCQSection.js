import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, CheckCircle2, Circle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";

export default function MCQPage({ mcqs, testId }) {
  const [currentMcq, setCurrentMcq] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes in seconds
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentMcq < mcqs.length - 1) {
      setCurrentMcq(prev => prev + 1);
    } else {
      // Navigate to coding challenges
      navigate(`/test/${testId}/coding`);
    }
  };

  const progress = (Object.keys(answers).length / mcqs.length) * 100;
  const mcq = mcqs[currentMcq];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">MCQ Section</h1>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm">Progress</span>
          <span className="text-sm">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Navigation */}
      <div className="flex gap-2 mb-4 overflow-x-auto py-2">
        {mcqs.map((q, index) => (
          <Button
            key={index}
            variant={currentMcq === index ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentMcq(index)}
            className="min-w-[40px]"
          >
            {answers[q._id] ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </Button>
        ))}
      </div>

      {/* Question Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Question {currentMcq + 1}
              <Badge variant="outline" className="ml-2">
                {mcq.marks} marks
              </Badge>
            </CardTitle>
          </div>
          <CardDescription className="text-lg font-medium mt-2">
            {mcq.question}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mcq.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                answers[mcq._id] === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => setAnswers({ ...answers, [mcq._id]: index })}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  answers[mcq._id] === index
                    ? 'border-blue-500'
                    : 'border-gray-300'
                }`}>
                  {answers[mcq._id] === index && (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentMcq(prev => prev - 1)}
          disabled={currentMcq === 0}
        >
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentMcq === mcqs.length - 1 && !answers[mcq._id]}
        >
          {currentMcq === mcqs.length - 1 ? 'Go to Coding Challenges' : 'Next'}
        </Button>
      </div>
    </div>
  );
} 
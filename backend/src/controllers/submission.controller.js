import Test from "../models/test.model.js";
import { CodingSubmission } from '../models/codingSubmission.model.js';
import { MCQSubmission } from '../models/mcqSubmission.model.js';
import Submission from '../models/submission.model.js';
import TestRegistration from '../models/testRegistration.model.js';

// Add this helper function at the top
const validateTestAccess = async (testId, userId, userRole) => {
  const test = await Test.findById(testId)
    .populate('vendor')
    .populate('accessControl.allowedUsers');
  
  if (!test) {
    return { valid: false, message: 'Test not found' };
  }

  const isAdmin = userRole === 'admin';
  const isVendor = test.vendor._id.toString() === userId.toString();
  const isPublic = test.accessControl.type === 'public';
  const isPractice = test.type === 'practice';
  const isAllowedUser = test.accessControl.allowedUsers?.some(
    user => user._id.toString() === userId.toString()
  );

  if (isAdmin || isVendor || isPublic || isPractice || isAllowedUser) {
    return { valid: true, test };
  }

  return { valid: false, message: 'Not authorized to access this test' };
};

// Submit MCQ answer
export const submitMCQ = async (req, res) => {
  try {
    const { testId, submissions } = req.body;
    
    // First find the test using Test model
    const test = await Test.findById(testId);
    let testData = test;

    if (!test) {
      // Try finding by UUID if ID lookup fails
      const testByUuid = await Test.findOne({ uuid: testId });
      if (!testByUuid) {
        return res.status(404).json({ 
          error: "Test not found",
          requiresRegistration: false 
        });
      }
      testData = testByUuid;
    }

    // Check test registration with expanded status check
    const registration = await TestRegistration.findOne({
      test: testData._id,
      user: req.user._id,
      status: { $in: ['registered', 'started'] }
    });

    // Enhanced registration check with detailed response
    if (!registration) {
      // Check if user has any registration for this test
      const anyRegistration = await TestRegistration.findOne({
        test: testData._id,
        user: req.user._id
      });

      if (anyRegistration) {
        // Registration exists but with invalid status
        return res.status(403).json({
          error: `Test registration status is ${anyRegistration.status}`,
          requiresRegistration: false,
          registrationStatus: anyRegistration.status
        });
      }

      // No registration found at all
      return res.status(403).json({
        error: "Not registered for test",
        requiresRegistration: true,
        testId: testData._id,
        uuid: testData.uuid
      });
    }

    // Update registration status if needed
    if (registration.status === 'registered') {
      registration.status = 'started';
      registration.startTime = new Date();
      await registration.save();
    }

    // Process submissions
    let totalMarksObtained = 0;
    let correctAnswers = 0;

    // Find or create submission document
    let submission = await Submission.findOne({
      user: req.user._id,
      test: testData._id
    });

    if (!submission) {
      submission = new Submission({
        user: req.user._id,
        test: testData._id,
        status: 'in_progress',
        startTime: registration.startTime,
        mcqSubmission: {
          answers: [],
          completed: false
        }
      });
    }

    // Process each submission
    for (const { questionId, selectedOptions, timeTaken } of submissions) {
      const mcq = testData.mcqs.find(m => m._id.toString() === questionId);
      if (!mcq) continue;

      const isCorrect = arraysEqual(
        selectedOptions.sort(),
        mcq.correctOptions.sort()
      );
      const marksObtained = isCorrect ? mcq.marks : 0;

      totalMarksObtained += marksObtained;
      if (isCorrect) correctAnswers++;

      submission.mcqSubmission.answers.push({
        questionId,
        selectedOptions,
        marks: marksObtained,
        isCorrect,
        timeTaken: timeTaken || 0
      });
    }

    // Update submission
    submission.mcqSubmission.completed = true;
    submission.mcqSubmission.totalScore = totalMarksObtained;
    submission.mcqSubmission.submittedAt = new Date();
    submission.status = 'mcq_completed';

    await submission.save();

    res.status(201).json({
      submissionId: submission._id,
      submission: {
        mcqSubmission: submission.mcqSubmission,
        totalScore: totalMarksObtained,
        correctAnswers,
        totalQuestions: submissions.length
      },
      message: "MCQ submissions saved successfully"
    });

  } catch (error) {
    console.error('MCQ Submission Error:', error);
    res.status(500).json({ 
      error: "Failed to submit MCQs",
      message: error.message,
      requiresRegistration: false
    });
  }
};

// Helper function to compare arrays
const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, idx) => val === arr2[idx]);
};

// Submit coding challenges
export const submitCoding = async (req, res) => {
  try {
    const { testId, submissions } = req.body;
    
    // Find or create submission document
    let submission = await Submission.findOne({
      test: testId,
      user: req.user._id,
      status: { $in: ['in_progress', 'mcq_completed'] }
    });

    if (!submission) {
      submission = new Submission({
        test: testId,
        user: req.user._id,
        status: 'in_progress'
      });
    }

    // Process each coding challenge submission
    for (const sub of submissions) {
      const challengeIndex = submission.codingSubmission.challenges.findIndex(
        c => c.challengeId.toString() === sub.challengeId
      );

      const newSubmissionData = {
        code: sub.code,
        language: sub.language,
        submittedAt: new Date(),
        marks: sub.testCaseResults.every(tc => tc.passed) ? sub.marks : 0,
        status: sub.testCaseResults.every(tc => tc.passed) ? 'passed' : 'failed',
        testCaseResults: sub.testCaseResults,
        executionTime: sub.executionTime,
        memory: sub.memory,
        output: sub.output,
        error: sub.error
      };

      if (challengeIndex === -1) {
        submission.codingSubmission.challenges.push({
          challengeId: sub.challengeId,
          submissions: [newSubmissionData]
        });
      } else {
        submission.codingSubmission.challenges[challengeIndex].submissions.push(newSubmissionData);
      }
    }

    // Calculate total coding score
    submission.codingSubmission.totalScore = submission.codingSubmission.challenges.reduce((total, challenge) => {
      const latestSubmission = challenge.submissions[challenge.submissions.length - 1];
      return total + (latestSubmission?.marks || 0);
    }, 0);

    // Update submission status and total score
    submission.codingSubmission.completed = true;
    submission.codingSubmission.submittedAt = new Date();
    
    // Update total score (MCQ + Coding)
    submission.totalScore = (submission.mcqSubmission?.totalScore || 0) + submission.codingSubmission.totalScore;

    // Update status if both sections are completed
    if (submission.mcqSubmission?.completed && submission.codingSubmission.completed) {
      submission.status = 'completed';
      submission.endTime = new Date();
    }

    await submission.save();

    // Calculate submission stats
    const submissionStats = {
      totalChallenges: submissions.length,
      submittedChallenges: submissions.length,
      completionPercentage: (submissions.length / submissions.length) * 100,
      totalScore: submission.totalScore,
      codingScore: submission.codingSubmission.totalScore,
      mcqScore: submission.mcqSubmission?.totalScore || 0
    };

    // Calculate overall metrics
    const overallMetrics = {
      totalTestCases: submissions.reduce((sum, s) => sum + s.testCaseResults.length, 0),
      totalPassedTestCases: submissions.reduce((sum, s) => sum + s.testCaseResults.filter(tc => tc.passed).length, 0),
      totalFailedTestCases: submissions.reduce((sum, s) => sum + s.testCaseResults.filter(tc => !tc.passed).length, 0),
      totalExecutionTime: submissions.reduce((sum, s) => sum + (s.executionTime || 0), 0),
      totalMemoryUsed: submissions.reduce((sum, s) => sum + (s.memory || 0), 0),
      averageExecutionTime: submissions.reduce((sum, s) => sum + (s.executionTime || 0), 0) / submissions.length,
      averageMemoryUsed: submissions.reduce((sum, s) => sum + (s.memory || 0), 0) / submissions.length,
      totalChallenges: submissions.length,
      passedChallenges: submissions.filter(s => s.testCaseResults.every(tc => tc.passed)).length,
      partiallySolvedChallenges: submissions.filter(s => s.testCaseResults.some(tc => tc.passed) && s.testCaseResults.some(tc => !tc.passed)).length,
      failedChallenges: submissions.filter(s => s.testCaseResults.every(tc => !tc.passed)).length,
      maxPossibleScore: submissions.reduce((sum, s) => sum + (s.marks || 0), 0),
      successRate: (submissions.filter(s => s.testCaseResults.every(tc => tc.passed)).length / submissions.length) * 100,
      challengeSuccessRate: (submissions.reduce((sum, s) => sum + s.testCaseResults.filter(tc => tc.passed).length, 0) / 
        submissions.reduce((sum, s) => sum + s.testCaseResults.length, 0)) * 100
    };

    res.status(201).json({
      submissionId: submission._id,
      submission: {
        ...submission.toObject(),
        submissionStats,
        overallMetrics
      },
      message: "Coding submissions saved successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Evaluate submission
export const evaluateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId)
      .populate('test')
      .populate('user');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Evaluate coding submissions
    for (const challenge of submission.codingSubmission.challenges) {
      for (const sub of challenge.submissions) {
        if (sub.status === 'pending') {
          // Add your evaluation logic here
          sub.status = 'evaluated';
          // Update marks based on evaluation
        }
      }
    }

    // Update total scores
    submission.codingSubmission.totalScore = submission.codingSubmission.challenges.reduce(
      (sum, challenge) => {
        const bestSubmission = challenge.submissions.reduce(
          (best, sub) => Math.max(best, sub.marks),
          0
        );
        return sum + bestSubmission;
      },
      0
    );

    submission.totalScore = submission.mcqSubmission.totalScore + 
      submission.codingSubmission.totalScore;

    // Create a TestResult record
    const testResult = new TestResult({
      user: submission.user._id,
      test: submission.test._id,
      mcqAnswers: submission.mcqSubmission.answers,
      codingAnswers: submission.codingSubmission.challenges.map(challenge => ({
        challengeId: challenge.challengeId,
        code: challenge.submissions[challenge.submissions.length - 1].code,
        language: challenge.submissions[challenge.submissions.length - 1].language,
        testCaseResults: [], // Add test case results from your evaluation
        marksObtained: challenge.submissions[challenge.submissions.length - 1].marks || 0
      })),
      totalScore: submission.totalScore,
      mcqScore: submission.mcqSubmission.totalScore,
      codingScore: submission.codingSubmission.totalScore,
      status: 'evaluated'
    });

    await Promise.all([
      submission.save(),
      testResult.save()
    ]);

    res.status(200).json({ submission, testResult });
  } catch (error) {
    res.status(500).json({ message: 'Error evaluating submission', error: error.message });
  }
};

// Get user submissions
export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user has permission to access these submissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to access these submissions' });
    }

    // Get all submissions for the user using the Submission model
    const submissions = await Submission.find({ user: userId })
      .populate({
        path: 'test',
        select: 'title type category difficulty totalMarks passingMarks'
      })
      .sort({ submittedAt: -1 })
      .lean();

    // Add debug logging
    console.log('Found submissions:', submissions);

    // Transform the response
    const transformedSubmissions = {
      mcq: submissions
        .filter(sub => sub.mcqSubmission?.answers?.length > 0)
        .map(sub => ({
          testId: sub.test?._id,
          testTitle: sub.test?.title,
          type: sub.test?.type,
          category: sub.test?.category,
          difficulty: sub.test?.difficulty,
          score: sub.mcqSubmission?.totalScore,
          totalMarks: sub.test?.totalMarks,
          passingMarks: sub.test?.passingMarks,
          status: sub.status,
          submittedAt: sub.mcqSubmission?.submittedAt,
          answers: sub.mcqSubmission?.answers
        })),
      coding: submissions
        .filter(sub => sub.codingSubmission?.challenges?.length > 0)
        .map(sub => ({
          testId: sub.test?._id,
          testTitle: sub.test?.title,
          type: sub.test?.type,
          category: sub.test?.category,
          difficulty: sub.test?.difficulty,
          score: sub.codingSubmission?.totalScore,
          totalMarks: sub.test?.totalMarks,
          passingMarks: sub.test?.passingMarks,
          status: sub.status,
          submittedAt: sub.codingSubmission?.submittedAt,
          solutions: sub.codingSubmission?.challenges
        }))
    };

    // Add debug logging
    console.log('Transformed submissions:', transformedSubmissions);

    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error in getUserSubmissions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch submissions',
      message: error.message 
    });
  }
};

// Get test submissions
export const getTestSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Instead of querying separate collections, query the main Submission collection
    const submissions = await Submission.find({ 
      test: testId,
      $or: [
        { 'mcqSubmission.completed': true },
        { 'codingSubmission.completed': true }
      ]
    })
    .populate('user', 'name email')
    .lean();

    // Transform the submissions into the expected format
    const response = {
      mcq: submissions
        .filter(sub => sub.mcqSubmission?.completed)
        .map(sub => ({
          testId: sub.test,
          userId: sub.user._id,
          answers: sub.mcqSubmission.answers,
          totalScore: sub.mcqSubmission.totalScore,
          submittedAt: sub.mcqSubmission.submittedAt
        })),
      coding: submissions
        .filter(sub => sub.codingSubmission?.completed)
        .map(sub => ({
          testId: sub.test,
          userId: sub.user._id,
          challenges: sub.codingSubmission.challenges,
          totalScore: sub.codingSubmission.totalScore,
          submittedAt: sub.codingSubmission.submittedAt
        }))
    };

    // Add debug logging
    console.log(`Found ${submissions.length} submissions for test ${testId}`);
    console.log('Response:', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getTestSubmissions:', error);
    res.status(500).json({ 
      message: 'Error fetching test submissions', 
      error: error.message 
    });
  }
};

// Get test MCQ submissions
export const getTestMCQSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    const submissions = await Submission.find({ 
      test: testId,
      'mcqSubmission.completed': true 
    })
    .populate('user', 'name email')
    .lean();

    const mcqSubmissions = submissions.map(sub => ({
      testId: sub.test,
      userId: sub.user._id,
      userName: sub.user.name,
      userEmail: sub.user.email,
      answers: sub.mcqSubmission.answers,
      totalScore: sub.mcqSubmission.totalScore,
      submittedAt: sub.mcqSubmission.submittedAt
    }));

    res.status(200).json(mcqSubmissions);
  } catch (error) {
    console.error('Error in getTestMCQSubmissions:', error);
    res.status(500).json({ 
      message: 'Error fetching MCQ submissions', 
      error: error.message 
    });
  }
};

// Get test coding submissions
export const getTestCodingSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    const submissions = await Submission.find({ 
      test: testId,
      'codingSubmission.completed': true 
    })
    .populate('user', 'name email')
    .lean();

    const codingSubmissions = submissions.map(sub => ({
      testId: sub.test,
      userId: sub.user._id,
      userName: sub.user.name,
      userEmail: sub.user.email,
      challenges: sub.codingSubmission.challenges,
      totalScore: sub.codingSubmission.totalScore,
      submittedAt: sub.codingSubmission.submittedAt
    }));

    res.status(200).json(codingSubmissions);
  } catch (error) {
    console.error('Error in getTestCodingSubmissions:', error);
    res.status(500).json({ 
      message: 'Error fetching coding submissions', 
      error: error.message 
    });
  }
};

// Get challenge submissions
export const getChallengeSubmissions = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const submissions = await CodingSubmission.find({ challengeId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenge submissions', error: error.message });
  }
};

// Get MCQ submissions
export const getMCQSubmissions = async (req, res) => {
  try {
    const { questionId } = req.params;
    const submissions = await MCQSubmission.find({ questionId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching MCQ submissions', error: error.message });
  }
};

// Get test results
export const getTestResults = async (req, res) => {
  try {
    const { testId } = req.params;

    const mcqSubmissions = await MCQSubmission.find({ testId })
      .populate('questionId')
      .populate('userId', 'name email');

    const codingSubmissions = await CodingSubmission.find({ testId })
      .populate('challengeId')
      .populate('userId', 'name email');

    const results = {
      testId,
      mcqSubmissions,
      codingSubmissions,
      totalSubmissions: mcqSubmissions.length + codingSubmissions.length
    };

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving test results', error: error.message });
  }
}; 
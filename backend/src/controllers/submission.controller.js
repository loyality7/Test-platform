import Test from "../models/test.model.js";
import { CodingSubmission } from '../models/codingSubmission.model.js';
import { MCQSubmission } from '../models/mcqSubmission.model.js';
import Submission from '../models/submission.model.js';
import TestRegistration from '../models/testRegistration.model.js';
import mongoose from 'mongoose';

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

// Add this helper function to calculate marks
const calculateMarks = (testCaseResults) => {
  if (!testCaseResults || testCaseResults.length === 0) return 0;
  
  const passedTests = testCaseResults.filter(tc => tc.passed).length;
  const totalTests = testCaseResults.length;
  
  // Each test case is worth equal points
  const marksPerTest = 100 / totalTests;
  return Math.round(passedTests * marksPerTest);
};

// Submit MCQ answer
export const submitMCQ = async (req, res) => {
  try {
    const { testId, submissions } = req.body;
    const userId = req.user._id;

    // Get or create submission with proper version
    let submission = await Submission.findExistingSubmission(testId, userId);
    
    if (!submission) {
      // If no existing submission, create new one with next version
      const nextVersion = await Submission.getNextVersion(testId, userId);
      submission = new Submission({
        user: userId,
        test: testId,
        version: nextVersion,
        status: 'in_progress',
        mcqSubmission: {
          version: nextVersion,
          completed: false,
          answers: []
        }
      });
    }

    // Update MCQ submission
    submission.mcqSubmission.answers = submissions.map(sub => ({
      questionId: sub.questionId,
      selectedOptions: sub.selectedOptions,
      // ... other fields
    }));
    
    submission.mcqSubmission.completed = true;
    submission.mcqSubmission.submittedAt = new Date();
    submission.status = 'mcq_completed';

    await submission.save();

    res.status(201).json({
      message: 'MCQ submission successful',
      submissionId: submission._id,
      version: submission.version
    });

  } catch (error) {
    console.error('Error in submitMCQ:', error);
    res.status(500).json({ error: 'Failed to submit MCQ answers' });
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
        testCaseResults: sub.testCaseResults,
        executionTime: sub.executionTime,
        memory: sub.memory,
        output: sub.output,
        error: sub.error,
        // Server-side computed fields
        status: sub.testCaseResults.every(tc => tc.passed) ? 'passed' : 'partial',
        marks: calculateMarks(sub.testCaseResults)
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
    res.status(201).json({
      submissionId: submission._id,
      submission,
      message: "Coding submissions created successfully"
    });

  } catch (error) {
    console.error('Error in submitCoding:', error);
    res.status(500).json({ 
      error: error.message || 'Error submitting coding answers' 
    });
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

    // Authorization check:
    // 1. Admin can see all submissions
    // 2. Users can see their own submissions
    // 3. Vendors can see submissions for their tests
    const isAdmin = req.user.role === 'admin';
    const isOwnSubmissions = req.user._id.toString() === userId;
    const isVendor = req.user.role === 'vendor';

    if (!isAdmin && !isOwnSubmissions && !isVendor) {
      return res.status(403).json({ error: 'Not authorized to access these submissions' });
    }

    // Base query
    let query = { user: userId };

    // If vendor, only show submissions for their tests
    if (isVendor && !isAdmin && !isOwnSubmissions) {
      const vendorTests = await Test.find({ vendor: req.user._id }).select('_id');
      const testIds = vendorTests.map(test => test._id);
      query.test = { $in: testIds };
    }

    // Get submissions with the applied query
    const submissions = await Submission.find(query)
      .populate({
        path: 'test',
        select: 'title type category difficulty totalMarks passingMarks vendor',
        populate: {
          path: 'vendor',
          select: 'name email'
        }
      })
      .sort({ submittedAt: -1 })
      .lean();

    // Additional vendor check on the results
    const filteredSubmissions = isVendor ? 
      submissions.filter(sub => sub.test?.vendor?._id.toString() === req.user._id.toString()) :
      submissions;

    // Transform the response
    const transformedSubmissions = {
      mcq: filteredSubmissions
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
          answers: sub.mcqSubmission?.answers,
          vendor: {
            id: sub.test?.vendor?._id,
            name: sub.test?.vendor?.name,
            email: sub.test?.vendor?.email
          }
        })),
      coding: filteredSubmissions
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
          solutions: sub.codingSubmission?.challenges,
          vendor: {
            id: sub.test?.vendor?._id,
            name: sub.test?.vendor?.name,
            email: sub.test?.vendor?.email
          }
        }))
    };

    res.json({
      success: true,
      data: transformedSubmissions,
      meta: {
        totalSubmissions: filteredSubmissions.length,
        mcqCount: transformedSubmissions.mcq.length,
        codingCount: transformedSubmissions.coding.length
      }
    });

  } catch (error) {
    console.error('Error in getUserSubmissions:', error);
    res.status(500).json({ 
      success: false,
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
    
    // Validate testId
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ 
        message: 'Invalid test ID format'
      });
    }

    // Get MCQ submissions
    const mcqSubmissions = await MCQSubmission.find({ testId })
      .populate('userId', 'name email')
      .populate('questionId', 'correctOptions marks')
      .lean();

    // Get coding submissions
    const codingSubmissions = await CodingSubmission.find({ testId })
      .populate('challengeId', 'title maxScore')
      .lean();

    // Group submissions by user
    const userSubmissions = {};
    
    // Process MCQ submissions
    mcqSubmissions.forEach(sub => {
      const userId = sub.userId._id.toString();
      if (!userSubmissions[userId]) {
        userSubmissions[userId] = {
          candidateId: userId,
          candidateName: sub.userId.name,
          email: sub.userId.email,
          mcqScore: 0,
          codingScore: 0,
          totalScore: 0,
          submittedAt: sub.submittedAt,
          status: 'completed',
          details: {
            mcqAnswers: [],
            codingChallenges: []
          }
        };
      }
      
      userSubmissions[userId].details.mcqAnswers.push({
        questionId: sub.questionId._id,
        selectedAnswer: sub.selectedOptions,
        isCorrect: sub.isCorrect,
        marks: sub.marksObtained,
        maxMarks: sub.questionId.marks
      });
      
      userSubmissions[userId].mcqScore += sub.marksObtained;
    });

    // Process coding submissions
    codingSubmissions.forEach(sub => {
      const userId = sub.userId.toString();
      if (!userSubmissions[userId]) {
        userSubmissions[userId] = {
          candidateId: userId,
          mcqScore: 0,
          codingScore: 0,
          totalScore: 0,
          status: 'completed',
          details: {
            mcqAnswers: [],
            codingChallenges: []
          }
        };
      }
      
      userSubmissions[userId].details.codingChallenges.push({
        challengeId: sub.challengeId._id,
        title: sub.challengeId.title,
        bestScore: sub.bestScore,
        maxScore: sub.challengeId.maxScore,
        submissions: sub.submissions.map(attempt => ({
          code: attempt.code,
          language: attempt.language,
          status: attempt.status,
          executionTime: attempt.executionDetails.totalExecutionTime,
          memory: attempt.executionDetails.memory,
          testCaseResults: attempt.testCaseResults,
          marks: attempt.marks,
          maxMarks: attempt.maxMarks
        }))
      });
      
      userSubmissions[userId].codingScore += sub.bestScore;
    });

    // Calculate total scores and percentages
    Object.values(userSubmissions).forEach(submission => {
      const totalMaxMCQScore = submission.details.mcqAnswers.reduce((sum, q) => sum + q.maxMarks, 0);
      const totalMaxCodingScore = submission.details.codingChallenges.reduce((sum, c) => sum + c.maxScore, 0);
      
      submission.mcqScore = totalMaxMCQScore > 0 
        ? Math.round((submission.mcqScore / totalMaxMCQScore) * 100) 
        : 0;
      
      submission.codingScore = totalMaxCodingScore > 0 
        ? Math.round((submission.codingScore / totalMaxCodingScore) * 100) 
        : 0;
      
      submission.totalScore = Math.round((submission.mcqScore + submission.codingScore) / 2);
    });

    const results = Object.values(userSubmissions);

    res.status(200).json({
      testId,
      submissions: results,
      totalSubmissions: results.length,
      summary: {
        averageScore: results.length > 0 
          ? Math.round(results.reduce((sum, sub) => sum + sub.totalScore, 0) / results.length) 
          : 0,
        totalCandidates: results.length,
        completedSubmissions: results.filter(sub => sub.status === 'completed').length
      }
    });

  } catch (error) {
    console.error('Error in getTestResults:', error);
    res.status(500).json({ 
      message: 'Error retrieving test results',
      error: error.message 
    });
  }
};

// Add new route handler for getting submission attempts
export const getSubmissionAttempts = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify access rights
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to access these submissions' });
    }

    const submissions = await Submission.find({
      test: testId,
      user: userId
    })
    .sort({ version: 1 })
    .select('version mcqSubmission.totalScore codingSubmission.totalScore totalScore status startTime endTime')
    .lean();

    const attempts = submissions.map(sub => ({
      version: sub.version,
      status: sub.status,
      mcqScore: sub.mcqSubmission?.totalScore || 0,
      codingScore: sub.codingSubmission?.totalScore || 0,
      totalScore: sub.totalScore,
      startTime: sub.startTime,
      endTime: sub.endTime,
      duration: sub.endTime ? Math.round((sub.endTime - sub.startTime) / 1000) : null // duration in seconds
    }));

    res.json({
      totalAttempts: attempts.length,
      attempts,
      bestScore: Math.max(...attempts.map(a => a.totalScore)),
      averageScore: Math.round(attempts.reduce((sum, a) => sum + a.totalScore, 0) / attempts.length)
    });

  } catch (error) {
    console.error('Error in getSubmissionAttempts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch submission attempts',
      message: error.message 
    });
  }
}; 
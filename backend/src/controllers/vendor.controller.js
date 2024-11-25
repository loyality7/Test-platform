import Test from "../models/test.model.js";
import TestResult from "../models/testResult.model.js";
import TestInvitation from "../models/testInvitation.model.js";
import Vendor from "../models/vendor.model.js";
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import xlsx from 'xlsx';
import Submission from "../models/submission.model.js";
import { MCQSubmission } from "../models/mcqSubmission.model.js";
import { CodingSubmission } from "../models/codingSubmission.model.js";
import TestAnalytics from "../models/testAnalytics.model.js";

// Add this helper function before getTestAnalytics
const calculateAverageTestDuration = (tests) => {
  if (!tests.length) return 0;
  return tests.reduce((sum, test) => sum + (test.duration || 0), 0) / tests.length;
};

// Add this helper function as well since it's used in timeBasedMetrics
const calculateCompletionTimeDistribution = (submissions) => {
  const ranges = {
    'under30min': 0,
    '30to60min': 0,
    '1to2hours': 0,
    'over2hours': 0
  };

  submissions.forEach(sub => {
    if (!sub.startTime || !sub.endTime) return;
    
    const duration = (new Date(sub.endTime) - new Date(sub.startTime)) / (1000 * 60); // in minutes
    
    if (duration <= 30) ranges['under30min']++;
    else if (duration <= 60) ranges['30to60min']++;
    else if (duration <= 120) ranges['1to2hours']++;
    else ranges['over2hours']++;
  });

  return ranges;
};

export const getVendorDashboard = async (req, res) => {
  try {
    // Get vendor's tests
    const tests = await Test.find({ vendor: req.user._id });
    const testIds = tests.map(test => test._id);

    // Get all completed submissions
    const submissions = await Submission.find({
      test: { $in: testIds },
      status: 'completed',  // Only get completed submissions
      $or: [
        { 'mcqSubmission.completed': true },
        { 'codingSubmission.completed': true }
      ]
    })
    .populate('user', 'name email')
    .populate('test', 'title passingMarks')
    .sort({ updatedAt: -1 });

    // Transform submissions for recent activity
    const recentActivity = submissions
      .slice(0, 5)
      .map(submission => ({
        candidateName: submission.user.name,
        candidateEmail: submission.user.email,
        testTitle: submission.test.title,
        score: submission.totalScore,
        completedAt: submission.updatedAt
      }));

    // Calculate metrics
    const distinctUsers = [...new Set(submissions.map(sub => sub.user._id.toString()))];
    const pendingInvitations = await TestInvitation.countDocuments({ 
      test: { $in: testIds }, 
      status: 'pending' 
    });

    const overview = {
      totalTests: tests.length,
      activeTests: tests.filter(test => test.status === 'published').length,
      totalCandidates: distinctUsers.length,
      pendingInvitations
    };

    const performance = {
      averageScore: calculateAverageScore(submissions),
      passRate: calculatePassRate(submissions),
      totalAttempts: submissions.length
    };

    const testDistribution = {
      easy: tests.filter(t => t.difficulty === 'easy').length,
      medium: tests.filter(t => t.difficulty === 'medium').length,
      hard: tests.filter(t => t.difficulty === 'hard').length
    };

    // Add debug logging
    console.log('Dashboard Data:', {
      testIds,
      submissionCount: submissions.length,
      distinctUserCount: distinctUsers.length,
      overview,
      performance,
      testDistribution,
      recentActivityCount: recentActivity.length
    });

    res.json({
      overview,
      performance,
      testDistribution,
      recentActivity
    });

  } catch (error) {
    console.error('Error in getVendorDashboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
};

// Helper functions
const calculateAverageScore = (submissions) => {
  if (!submissions.length) return 0;
  const totalScore = submissions.reduce((sum, sub) => sum + (sub.totalScore || 0), 0);
  return (totalScore / submissions.length).toFixed(1);
};

const calculatePassRate = (submissions) => {
  if (!submissions.length) return 0;
  
  const passed = submissions.filter(submission => {
    const passingMarks = submission.test.passingMarks || 70;
    return submission.totalScore >= passingMarks;
  }).length;
  
  return ((passed / submissions.length) * 100).toFixed(1);
};

export const getVendorTests = async (req, res) => {
  try {
    // Get tests directly using the user ID from auth
    const tests = await Test.find({ 
      vendor: req.user._id
    })
    .select('title description difficulty duration status createdAt updatedAt totalMarks passingMarks category')
    .sort({ createdAt: -1 });

    // Return formatted response
    res.json({
      message: 'Tests retrieved successfully',
      count: tests.length,
      tests: tests.map(test => ({
        _id: test._id,
        title: test.title,
        description: test.description,
        difficulty: test.difficulty,
        duration: test.duration,
        status: test.status,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        category: test.category,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error in getVendorTests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tests',
      message: error.message 
    });
  }
};

export const getTestAnalytics = async (req, res) => {
  try {
    const tests = await Test.find({ vendor: req.user._id });
    const submissions = await Submission.find({ 
      test: { $in: tests.map(t => t._id) } 
    }).populate('user').populate('test');

    // Enhanced analytics object
    const analytics = {
      testMetrics: {
        totalTests: tests.length,
        activeTests: tests.filter(t => t.status === 'published').length,
        draftTests: tests.filter(t => t.status === 'draft').length,
        archivedTests: tests.filter(t => t.status === 'archived').length,
        testsByDifficulty: {
          easy: tests.filter(t => t.difficulty === 'easy').length,
          medium: tests.filter(t => t.difficulty === 'medium').length,
          hard: tests.filter(t => t.difficulty === 'hard').length
        },
        testsByCategory: tests.reduce((acc, test) => {
          acc[test.category] = (acc[test.category] || 0) + 1;
          return acc;
        }, {})
      },

      submissionMetrics: {
        total: submissions.length,
        completed: submissions.filter(s => s.status === 'completed').length,
        inProgress: submissions.filter(s => s.status === 'in_progress').length,
        mcqCompleted: submissions.filter(s => s.status === 'mcq_completed').length,
        codingCompleted: submissions.filter(s => s.status === 'coding_completed').length,
        averageCompletionTime: calculateAverageCompletionTime(submissions),
        submissionsByTest: calculateSubmissionsByTest(submissions)
      },

      performanceMetrics: {
        totalCandidates: new Set(submissions.map(s => s.user._id.toString())).size,
        averageScore: calculateAverageScore(submissions),
        highestScore: Math.max(...submissions.map(s => s.totalScore || 0), 0),
        lowestScore: Math.min(...submissions.filter(s => s.totalScore).map(s => s.totalScore), 100),
        passRate: calculatePassRate(submissions),
        scoreDistribution: calculateScoreDistribution(submissions)
      },

      timeBasedMetrics: {
        dailySubmissions: calculateDailySubmissions(submissions),
        peakSubmissionHours: calculatePeakHours(submissions),
        averageTestDuration: calculateAverageTestDuration(tests),
        completionTimeDistribution: calculateCompletionTimeDistribution(submissions)
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions
const calculateAverageCompletionTime = (submissions) => {
  const completedSubs = submissions.filter(s => s.endTime && s.startTime);
  if (!completedSubs.length) return 0;
  const totalTime = completedSubs.reduce((sum, sub) => 
    sum + (new Date(sub.endTime) - new Date(sub.startTime)), 0);
  return Math.round(totalTime / completedSubs.length / 1000 / 60); // in minutes
};

const calculateSubmissionsByTest = (submissions) => {
  return submissions.reduce((acc, sub) => {
    const testId = sub.test._id.toString();
    if (!acc[testId]) {
      acc[testId] = {
        testTitle: sub.test.title,
        total: 0,
        completed: 0,
        averageScore: 0
      };
    }
    acc[testId].total++;
    if (sub.status === 'completed') {
      acc[testId].completed++;
      acc[testId].averageScore = (acc[testId].averageScore * (acc[testId].completed - 1) + 
        (sub.totalScore || 0)) / acc[testId].completed;
    }
    return acc;
  }, {});
};

const calculateScoreDistribution = (submissions) => {
  const ranges = {
    '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
  };
  submissions.forEach(sub => {
    if (sub.totalScore) {
      const score = sub.totalScore;
      if (score <= 20) ranges['0-20']++;
      else if (score <= 40) ranges['21-40']++;
      else if (score <= 60) ranges['41-60']++;
      else if (score <= 80) ranges['61-80']++;
      else ranges['81-100']++;
    }
  });
  return ranges;
};

const calculateDailySubmissions = (submissions) => {
  return submissions.reduce((acc, sub) => {
    const date = new Date(sub.createdAt).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
};

const calculatePeakHours = (submissions) => {
  const hourCounts = new Array(24).fill(0);
  submissions.forEach(sub => {
    const hour = new Date(sub.createdAt).getHours();
    hourCounts[hour]++;
  });
  return hourCounts;
};

export const getTestResults = async (req, res) => {
  try {
    const { testId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view it" 
      });
    }

    // Get all submissions for this test with populated user data
    const submissions = await Submission.find({
      test: testId
    })
    .populate('user', 'name email')
    .populate('mcqSubmission')
    .populate('codingSubmission')
    .sort({ submittedAt: -1 });

    // Calculate and format results
    const results = await Promise.all(submissions.map(async (submission) => {
      // Calculate MCQ score
      const mcqScore = submission.mcqSubmission?.answers?.reduce((total, answer) => {
        if (answer.isCorrect) {
          const mcq = test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
          return total + (mcq?.marks || 0);
        }
        return total;
      }, 0) || 0;

      // Calculate coding score
      const codingScore = submission.codingSubmission?.answers?.reduce((total, answer) => {
        const challenge = test.codingChallenges.find(
          c => c._id.toString() === answer.challengeId.toString()
        );
        const maxMarks = challenge?.marks || 0;
        return total + (answer.score * maxMarks / 100); // Convert percentage to actual marks
      }, 0) || 0;

      // Calculate total score
      const totalScore = mcqScore + codingScore;

      return {
        candidateId: submission.user._id,
        candidateName: submission.user.name,
        email: submission.user.email,
        score: Math.round(totalScore), // Round to nearest integer
        mcqScore: Math.round(mcqScore),
        codingScore: Math.round(codingScore),
        submittedAt: submission.submittedAt,
        status: submission.status,
        completionTime: submission.duration,
        details: {
          mcqAnswers: submission.mcqSubmission?.answers?.length || 0,
          codingChallenges: submission.codingSubmission?.answers?.length || 0,
          totalMcqQuestions: test.mcqs.length,
          totalCodingChallenges: test.codingChallenges.length,
          passingScore: test.passingMarks,
          result: totalScore >= test.passingMarks ? 'PASS' : 'FAIL'
        },
        lastActivity: submission.updatedAt
      };
    }));

    res.json(results);

  } catch (error) {
    console.error('Error in getTestResults:', error);
    res.status(500).json({ 
      error: "Failed to fetch test results",
      details: error.message 
    });
  }
};

export const getTestCandidates = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get all submissions for this test
    const submissions = await Submission.find({ test: testId })
      .populate('user', 'name email')
      .sort('-updatedAt');

    const candidates = submissions.reduce((acc, submission) => {
      const existingCandidate = acc.find(c => 
        c._id.toString() === submission.user._id.toString()
      );

      if (existingCandidate) {
        existingCandidate.attempts++;
        if (submission.updatedAt > existingCandidate.lastAttempt) {
          existingCandidate.status = submission.status;
          existingCandidate.lastAttempt = submission.updatedAt;
          existingCandidate.score = submission.totalScore;
        }
      } else {
        acc.push({
          _id: submission.user._id,
          name: submission.user.name,
          email: submission.user.email,
          status: submission.status,
          score: submission.totalScore,
          attempts: 1,
          lastAttempt: submission.updatedAt
        });
      }
      return acc;
    }, []);

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendTestInvitations = async (req, res) => {
  try {
    const { testId, candidates, validUntil, maxAttempts } = req.body;
    
    const invitations = await Promise.all(
      candidates.map(async (candidate) => {
        const invitation = await TestInvitation.create({
          test: testId,
          email: candidate.email,
          name: candidate.name,
          validUntil,
          maxAttempts,
          vendor: req.user._id
        });
        
        // TODO: Send email to candidate
        
        return invitation;
      })
    );
    
    res.status(201).json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestInvitations = async (req, res) => {
  try {
    const invitations = await TestInvitation.find({
      test: req.params.testId,
      vendor: req.user._id
    }).sort({ createdAt: -1 });
    
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.user._id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Get test metrics
    const [totalTests, activeTests, completedTests] = await Promise.all([
      Test.countDocuments({ 
        vendor: req.user._id,
        createdAt: { $gte: start, $lte: end }
      }),
      Test.countDocuments({ 
        vendor: req.user._id,
        status: 'published',
        createdAt: { $gte: start, $lte: end }
      }),
      TestResult.countDocuments({
        'test.vendor': req.user._id,
        completedAt: { $gte: start, $lte: end }
      })
    ]);

    // Get candidate metrics
    const candidateMetrics = await TestResult.aggregate([
      {
        $match: {
          'test.vendor': req.user._id,
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalCandidates: { $addToSet: '$user' },
          passedCandidates: {
            $sum: { $cond: [{ $gte: ['$totalScore', 70] }, 1, 0] }
          },
          failedCandidates: {
            $sum: { $cond: [{ $lt: ['$totalScore', 70] }, 1, 0] }
          },
          totalScore: { $sum: '$totalScore' },
          highestScore: { $max: '$totalScore' },
          lowestScore: { $min: '$totalScore' }
        }
      }
    ]);

    // Get test performance over time
    const dailyPerformance = await TestResult.aggregate([
      {
        $match: {
          'test.vendor': req.user._id,
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            testId: '$test._id'
          },
          avgScore: { $avg: '$totalScore' },
          attempts: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $gte: ['$totalScore', 70] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    const metrics = candidateMetrics[0] || {
      totalCandidates: [],
      passedCandidates: 0,
      failedCandidates: 0,
      totalScore: 0,
      highestScore: 0,
      lowestScore: 0
    };

    const report = {
      testMetrics: {
        totalTests,
        activeTests,
        completedTests
      },
      candidateMetrics: {
        totalCandidates: metrics.totalCandidates.length,
        passedCandidates: metrics.passedCandidates,
        failedCandidates: metrics.failedCandidates
      },
      performanceMetrics: {
        averageScore: metrics.totalScore / (metrics.passedCandidates + metrics.failedCandidates) || 0,
        highestScore: metrics.highestScore,
        lowestScore: metrics.lowestScore
      },
      dailyPerformance: dailyPerformance.map(day => ({
        date: day._id.date,
        testId: day._id.testId,
        averageScore: Math.round(day.avgScore * 10) / 10,
        attempts: day.attempts,
        passRate: Math.round((day.passCount / day.attempts) * 100)
      }))
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportTestResults = async (req, res) => {
  try {
    const { format } = req.query;
    const testId = req.params.testId;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: 'Test not found or you do not have permission to export it' 
      });
    }

    const results = await TestResult.find({
      test: testId,
      'test.vendor': req.user._id
    })
    .populate('user', 'name email')
    .populate('test', 'title passingScore')
    .sort({ completedAt: -1 });

    const exportData = results.map(result => ({
      testTitle: result.test.title,
      candidateName: result.user.name,
      candidateEmail: result.user.email,
      score: result.totalScore,
      passingScore: result.test.passingScore,
      status: result.totalScore >= result.test.passingScore ? 'PASS' : 'FAIL',
      completedAt: result.completedAt.toLocaleString(),
      duration: `${Math.floor(result.duration / 60)}m ${result.duration % 60}s`,
      questionsAttempted: result.answers.length,
      correctAnswers: result.answers.filter(a => a.isCorrect).length
    }));

    switch (format) {
      case 'csv': {
        const fields = [
          'testTitle',
          'candidateName',
          'candidateEmail',
          'score',
          'passingScore',
          'status',
          'completedAt',
          'duration',
          'questionsAttempted',
          'correctAnswers'
        ];
        const parser = new Parser({ fields });
        const csv = parser.parse(exportData);
        res.header('Content-Type', 'text/csv');
        res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
      }

      case 'excel': {
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(exportData);
        xlsx.utils.book_append_sheet(wb, ws, 'Test Results');
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.xlsx`);
        return res.send(xlsx.write(wb, { type: 'buffer' }));
      }

      case 'pdf': {
        const doc = new PDFDocument();
        res.header('Content-Type', 'application/pdf');
        res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.pdf`);
        doc.pipe(res);

        // Add header
        doc.fontSize(16).text(`Test Results: ${test.title}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        // Add summary
        doc.fontSize(14).text('Summary:', { underline: true });
        doc.fontSize(12).text(`Total Candidates: ${results.length}`);
        doc.text(`Pass Rate: ${Math.round((results.filter(r => r.totalScore >= test.passingScore).length / results.length) * 100)}%`);
        doc.text(`Average Score: ${Math.round(results.reduce((acc, r) => acc + r.totalScore, 0) / results.length)}%`);
        doc.moveDown();

        // Add results table
        doc.fontSize(14).text('Detailed Results:', { underline: true });
        doc.moveDown();

        exportData.forEach((result, index) => {
          doc.fontSize(12)
            .text(`${index + 1}. ${result.candidateName} (${result.candidateEmail})`)
            .text(`   Score: ${result.score}% - ${result.status}`)
            .text(`   Completed: ${result.completedAt}`)
            .text(`   Duration: ${result.duration}`);
          doc.moveDown(0.5);
        });

        doc.end();
        return;
      }

      default:
        return res.status(400).json({ error: 'Invalid export format' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorTest = async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.testId,
      vendor: req.user._id
    }).populate('questions');

    if (!test) {
      return res.status(404).json({ 
        error: 'Test not found or you do not have permission to view it' 
      });
    }

    // Remove sensitive data if needed
    const sanitizedTest = {
      _id: test._id,
      title: test.title,
      description: test.description,
      difficulty: test.difficulty,
      duration: test.duration,
      passingScore: test.passingScore,
      status: test.status,
      questions: test.questions.map(q => ({
        _id: q._id,
        title: q.title,
        type: q.type,
        difficulty: q.difficulty,
        points: q.points,
        // Exclude correct answers if test is active
        ...(test.status !== 'published' && { correctAnswer: q.correctAnswer })
      })),
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    };

    res.json(sanitizedTest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const debugVendorTests = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const allTests = await Test.find({});
    const vendorTests = await Test.find({ vendor: vendorId });
    
    res.json({
      vendorId: vendorId,
      totalTests: allTests.length,
      vendorTests: vendorTests.length,
      tests: vendorTests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const debugTests = async (req, res) => {
  try {
    // Get all tests
    const allTests = await Test.find({}).select('vendor title');
    
    // Get tests for current user
    const userTests = await Test.find({ vendor: req.user._id }).select('vendor title');
    
    res.json({
      userId: req.user._id,
      totalTests: allTests.length,
      userTests: userTests.length,
      allTests: allTests,
      userTests: userTests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestUsers = async (req, res) => {
  try {
    const { testId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get all users who attempted this test
    const submissions = await Submission.find({ test: testId })
      .populate('user', 'name email')
      .sort('-updatedAt');

    const users = submissions.map(submission => ({
      userId: submission.user._id,
      name: submission.user.name,
      email: submission.user.email,
      lastAttempt: submission.updatedAt
    }));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserSubmissions = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get all submissions for this user on this test
    const submissions = await Submission.find({ test: testId, user: userId })
      .populate('user', 'name email')
      .sort('-updatedAt');

    const userSubmissions = submissions.map(submission => ({
      submissionId: submission._id,
      score: submission.totalScore,
      status: submission.status,
      submittedAt: submission.updatedAt,
      details: {
        mcqAnswers: submission.mcqSubmission?.answers || [],
        codingChallenges: submission.codingSubmission?.challenges || []
      }
    }));

    res.json(userSubmissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserTestAnalytics = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get submission details
    const submission = await Submission.findOne({ 
      test: testId,
      user: userId 
    })
    .populate('user', 'name email')
    .populate('test', 'title duration passingMarks');

    if (!submission) {
      return res.status(404).json({ error: "No submission found for this user" });
    }

    // Get MCQ analytics
    const mcqAnalytics = await TestAnalytics.find({
      test: testId,
      user: userId,
      type: 'mcq'
    }).sort('questionId');

    // Get coding analytics
    const codingAnalytics = await TestAnalytics.find({
      test: testId,
      user: userId,
      type: 'coding'
    }).sort('challengeId');

    const analytics = {
      overview: {
        candidateName: submission.user.name,
        candidateEmail: submission.user.email,
        testTitle: submission.test.title,
        status: submission.status,
        startTime: submission.startTime,
        endTime: submission.endTime,
        duration: submission.endTime ? 
          (new Date(submission.endTime) - new Date(submission.startTime)) / 1000 : null,
        totalScore: submission.totalScore,
        passingMarks: submission.test.passingMarks,
        result: submission.totalScore >= submission.test.passingMarks ? 'PASS' : 'FAIL'
      },

      mcqPerformance: {
        score: submission.mcqSubmission?.totalScore || 0,
        questionsAttempted: mcqAnalytics.length,
        details: mcqAnalytics.map(q => ({
          questionId: q.questionId,
          timeSpent: q.behavior.timeSpent,
          warnings: q.behavior.warnings,
          tabSwitches: q.behavior.tabSwitches,
          focusLostCount: q.behavior.focusLostCount,
          score: q.performance.score,
          browserEvents: q.behavior.browserEvents
        }))
      },

      codingPerformance: {
        score: submission.codingSubmission?.totalScore || 0,
        challengesAttempted: codingAnalytics.length,
        details: codingAnalytics.map(c => ({
          challengeId: c.challengeId,
          timeSpent: c.behavior.timeSpent,
          executionTime: c.performance.executionTime,
          memoryUsage: c.performance.memoryUsage,
          testCasesPassed: c.performance.testCasesPassed,
          totalTestCases: c.performance.totalTestCases,
          score: c.performance.score,
          submissionAttempts: c.behavior.submissionAttempts,
          errorCount: c.behavior.errorCount,
          hintViews: c.behavior.hintViews
        }))
      },

      behaviorMetrics: {
        totalWarnings: [...mcqAnalytics, ...codingAnalytics].reduce(
          (sum, a) => sum + (a.behavior.warnings || 0), 0
        ),
        totalTabSwitches: [...mcqAnalytics, ...codingAnalytics].reduce(
          (sum, a) => sum + (a.behavior.tabSwitches || 0), 0
        ),
        totalCopyPasteAttempts: [...mcqAnalytics, ...codingAnalytics].reduce(
          (sum, a) => sum + (a.behavior.copyPasteAttempts || 0), 0
        ),
        focusLostEvents: [...mcqAnalytics, ...codingAnalytics].reduce(
          (sum, a) => sum + (a.behavior.focusLostCount || 0), 0
        )
      },

      systemInfo: mcqAnalytics[0]?.metadata || codingAnalytics[0]?.metadata || {}
    };

    res.json(analytics);

  } catch (error) {
    console.error('Error in getUserTestAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper functions for analytics
const calculateAverageTime = (analytics, type) => {
  const relevantAnalytics = analytics.filter(a => a.type === type);
  if (!relevantAnalytics.length) return 0;
  return relevantAnalytics.reduce((acc, a) => 
    acc + (a.behavior.timeSpent || 0), 0) / relevantAnalytics.length;
};

const sumMetric = (analytics, metricPath) => {
  return analytics.reduce((acc, a) => {
    const value = metricPath.split('.').reduce((obj, key) => obj?.[key], a);
    return acc + (value || 0);
  }, 0);
};

// Get all MCQ submissions for a user's test
export const getUserMCQSubmissions = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    const mcqSubmissions = await TestAnalytics.find({
      test: testId,
      user: userId,
      type: 'mcq'
    })
    .sort('questionId')
    .select('-__v');

    res.json(mcqSubmissions);

  } catch (error) {
    console.error('Error in getUserMCQSubmissions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific MCQ submission
export const getSpecificMCQSubmission = async (req, res) => {
  try {
    const { testId, userId, mcqId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    const mcqSubmission = await TestAnalytics.findOne({
      test: testId,
      user: userId,
      type: 'mcq',
      questionId: mcqId
    }).select('-__v');

    if (!mcqSubmission) {
      return res.status(404).json({ error: "MCQ submission not found" });
    }

    res.json(mcqSubmission);

  } catch (error) {
    console.error('Error in getSpecificMCQSubmission:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all coding submissions for a user's test
export const getUserCodingSubmissions = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    const codingSubmissions = await TestAnalytics.find({
      test: testId,
      user: userId,
      type: 'coding'
    })
    .sort('challengeId')
    .select('-__v');

    res.json(codingSubmissions);

  } catch (error) {
    console.error('Error in getUserCodingSubmissions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific coding submission
export const getSpecificCodingSubmission = async (req, res) => {
  try {
    const { testId, userId, challengeId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    const codingSubmission = await TestAnalytics.findOne({
      test: testId,
      user: userId,
      type: 'coding',
      challengeId: challengeId
    }).select('-__v');

    if (!codingSubmission) {
      return res.status(404).json({ error: "Coding submission not found" });
    }

    res.json(codingSubmission);

  } catch (error) {
    console.error('Error in getSpecificCodingSubmission:', error);
    res.status(500).json({ error: error.message });
  }
};

export const addUsersToTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { users, validUntil, maxAttempts } = req.body;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to modify it" 
      });
    }

    // Create test invitations for each user
    const invitations = await Promise.all(
      users.map(async (user) => {
        const invitation = await TestInvitation.create({
          test: testId,
          email: user.email,
          name: user.name,
          validUntil: new Date(validUntil),
          maxAttempts,
          vendor: req.user._id,
          status: 'pending'
        });
        
        // TODO: Send email notification to user
        
        return invitation;
      })
    );

    // Update test's access control list
    await Test.findByIdAndUpdate(testId, {
      $addToSet: {
        'accessControl.allowedUsers': users.map(user => ({
          email: user.email,
          name: user.name
        }))
      }
    });

    res.status(201).json({
      message: 'Users added successfully',
      invitations
    });

  } catch (error) {
    console.error('Error in addUsersToTest:', error);
    res.status(500).json({ 
      error: 'Failed to add users to test',
      message: error.message 
    });
  }
};

// Get test results for a specific user
export const getUserTestResults = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view it" 
      });
    }

    const submission = await Submission.findOne({
      test: testId,
      user: userId
    })
    .populate('user', 'name email')
    .populate('test', 'title passingMarks totalMarks mcqs codingChallenges')
    .populate('mcqSubmission')
    .populate({
      path: 'codingSubmission.challenges',
      populate: {
        path: 'challengeId',
        model: 'CodingChallenge'
      }
    });

    if (!submission) {
      return res.status(404).json({ error: "No submission found for this user" });
    }

    // Transform MCQ submission with proper scoring
    const mcqSubmission = submission.mcqSubmission ? {
      totalScore: submission.mcqSubmission.totalScore,
      submittedAt: submission.mcqSubmission.submittedAt,
      answers: submission.mcqSubmission.answers?.map(answer => {
        const question = test.mcqs.find(q => 
          q._id.toString() === answer.questionId.toString()
        );
        
        let marks = 0;
        let isCorrect = false;

        if (question.answerType === 'single') {
          if (answer.selectedOptions.length === 1 && 
              question.correctOptions.length === 1 && 
              answer.selectedOptions[0] === question.correctOptions[0]) {
            marks = question.marks;
            isCorrect = true;
          } else if (question.correctOptions.includes(answer.selectedOptions[0])) {
            marks = 2;
            isCorrect = true;
          }
        } else {
          // Multiple answer logic
          const correctSelectedCount = answer.selectedOptions.filter(opt => 
            question.correctOptions.includes(opt)
          ).length;
          
          if (correctSelectedCount > 0) {
            marks = 2;
            isCorrect = true;
          }
        }

        return {
          questionId: answer.questionId,
          question: question?.question,
          selectedOptions: answer.selectedOptions,
          correctOptions: question?.correctOptions,
          isCorrect,
          marks,
          maxMarks: question?.marks,
          timeTaken: answer.timeTaken
        };
      })
    } : null;

    // Transform coding submission
    const codingSubmission = submission.codingSubmission ? {
      totalScore: submission.codingSubmission.totalScore,
      submittedAt: submission.codingSubmission.submittedAt,
      challenges: submission.codingSubmission.challenges?.map(challenge => {
        const challengeDetails = test.codingChallenges.find(c => 
          c._id.toString() === challenge.challengeId.toString()
        );
        
        return {
          challengeId: challenge.challengeId,
          title: challengeDetails?.title,
          submissions: challenge.submissions?.map(sub => ({
            code: sub.code,
            language: sub.language,
            status: sub.status,
            marks: sub.marks,
            maxMarks: challengeDetails?.marks || 0,
            submittedAt: sub.submittedAt,
            testCaseResults: sub.testCaseResults,
            executionDetails: sub.executionDetails
          }))
        };
      })
    } : null;

    const result = {
      user: {
        id: submission.user._id,
        name: submission.user.name,
        email: submission.user.email
      },
      test: {
        id: submission.test._id,
        title: submission.test.title,
        passingMarks: submission.test.passingMarks,
        totalMarks: submission.test.totalMarks
      },
      mcqSubmission,
      codingSubmission,
      totalScore: (mcqSubmission?.totalScore || 0) + (codingSubmission?.totalScore || 0),
      status: submission.status,
      startTime: submission.startTime,
      endTime: submission.endTime
    };

    res.json(result);

  } catch (error) {
    console.error('Error in getUserTestResults:', error);
    res.status(500).json({ error: error.message });
  }
}; 
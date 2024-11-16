import Test from "../models/test.model.js";
import TestResult from "../models/testResult.model.js";
import TestInvitation from "../models/testInvitation.model.js";
import Vendor from "../models/vendor.model.js";
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import xlsx from 'xlsx';
import Submission from "../models/submission.model.js";

export const getVendorDashboard = async (req, res) => {
  try {
    // Get basic stats
    const [totalTests, activeTests, totalCandidates, pendingInvitations] = await Promise.all([
      Test.countDocuments({ vendor: req.user._id }),
      Test.countDocuments({ vendor: req.user._id, status: 'published' }),
      TestResult.countDocuments({ 'test.vendor': req.user._id }).distinct('user'),
      TestInvitation.countDocuments({ vendor: req.user._id, status: 'pending' })
    ]);

    // Get test completion stats
    const testResults = await TestResult.aggregate([
      { $match: { 'test.vendor': req.user._id } },
      { $group: {
        _id: null,
        avgScore: { $avg: '$totalScore' },
        passCount: { $sum: { $cond: [{ $gte: ['$totalScore', 70] }, 1, 0] } },
        failCount: { $sum: { $cond: [{ $lt: ['$totalScore', 70] }, 1, 0] } }
      }}
    ]);

    // Get recent activity
    const recentResults = await TestResult.find({ 'test.vendor': req.user._id })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('test', 'title');

    // Get tests by difficulty distribution
    const testsByDifficulty = await Test.aggregate([
      { $match: { vendor: req.user._id } },
      { $group: {
        _id: '$difficulty',
        count: { $sum: 1 }
      }}
    ]);

    // Format response
    const stats = {
      overview: {
        totalTests,
        activeTests,
        totalCandidates: totalCandidates.length,
        pendingInvitations
      },
      performance: testResults.length > 0 ? {
        averageScore: Math.round(testResults[0].avgScore * 10) / 10,
        passRate: Math.round((testResults[0].passCount / (testResults[0].passCount + testResults[0].failCount)) * 100),
        totalAttempts: testResults[0].passCount + testResults[0].failCount
      } : {
        averageScore: 0,
        passRate: 0,
        totalAttempts: 0
      },
      testDistribution: testsByDifficulty.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentActivity: recentResults.map(result => ({
        candidateName: result.user.name,
        candidateEmail: result.user.email,
        testTitle: result.test.title,
        score: result.totalScore,
        completedAt: result.completedAt
      }))
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorTests = async (req, res) => {
  try {
    console.log('Vendor ID:', req.user._id); // Debug log

    // Verify the user object
    if (!req.user || !req.user._id) {
      console.log('No user found in request'); // Debug log
      return res.status(401).json({ 
        error: 'User not authenticated properly'
      });
    }

    // Remove the vendor check since we're using the user ID directly
    console.log('Searching for tests with user ID:', req.user._id); // Debug log
    
    const tests = await Test.find({ 
      vendor: req.user._id  // This should match the user ID who created the tests
    })
    .select('title description difficulty duration passingScore status createdAt updatedAt')
    .sort({ createdAt: -1 });

    console.log('Found tests:', tests.length); // Debug log

    // If no tests found, return empty array with message
    if (!tests || tests.length === 0) {
      console.log('No tests found'); // Debug log
      return res.json({
        message: 'No tests found',
        tests: []
      });
    }

    // Format the response
    const formattedTests = tests.map(test => ({
      _id: test._id,
      title: test.title,
      description: test.description,
      difficulty: test.difficulty,
      duration: test.duration,
      passingScore: test.passingScore,
      status: test.status,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    }));

    res.json({
      message: 'Tests retrieved successfully',
      count: formattedTests.length,
      tests: formattedTests
    });
  } catch (error) {
    console.error('Error in getVendorTests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tests',
      details: error.message 
    });
  }
};

export const getTestAnalytics = async (req, res) => {
  try {
    const tests = await Test.find({ vendor: req.user._id });
    const submissions = await Submission.find({ 
      test: { $in: tests.map(t => t._id) } 
    });

    const analytics = {
      totalTests: tests.length,
      totalCandidates: new Set(submissions.map(s => s.user.toString())).size,
      averageScore: submissions.length ? 
        submissions.reduce((sum, s) => sum + s.totalScore, 0) / submissions.length : 0,
      testCompletion: submissions.length ? 
        (submissions.filter(s => s.status === 'completed').length / submissions.length) * 100 : 0,
      testsByDifficulty: {
        easy: tests.filter(t => t.difficulty === 'easy').length,
        medium: tests.filter(t => t.difficulty === 'medium').length,
        hard: tests.filter(t => t.difficulty === 'hard').length
      },
      submissionStats: {
        total: submissions.length,
        completed: submissions.filter(s => s.status === 'completed').length,
        inProgress: submissions.filter(s => s.status === 'in_progress').length,
        mcqCompleted: submissions.filter(s => s.status === 'mcq_completed').length,
        codingCompleted: submissions.filter(s => s.status === 'coding_completed').length
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get all submissions for this test
    const submissions = await Submission.find({ test: testId })
      .populate('user', 'name email')
      .sort('-updatedAt');

    const results = submissions.map(submission => ({
      candidateId: submission.user._id,
      candidateName: submission.user.name,
      email: submission.user.email,
      score: submission.totalScore,
      mcqScore: submission.mcqSubmission?.totalScore || 0,
      codingScore: submission.codingSubmission?.totalScore || 0,
      submittedAt: submission.updatedAt,
      status: submission.status,
      completionTime: submission.endTime ? 
        (submission.endTime - submission.startTime) / 1000 : null,
      details: {
        mcqAnswers: submission.mcqSubmission?.answers?.length || 0,
        codingChallenges: submission.codingSubmission?.challenges?.length || 0
      }
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
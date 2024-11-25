import express from "express";
import { auth } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import { checkVendorApproval } from '../middleware/checkVendorApproval.js';
import {
  getVendorDashboard,
  getVendorTests,
  getTestAnalytics,
  getTestResults,
  getTestCandidates,
  sendTestInvitations,
  getTestInvitations,
  getVendorProfile,
  updateVendorProfile,
  getVendorReports,
  exportTestResults,
  getVendorTest,
  debugTests,
  getTestUsers,
  getUserSubmissions,
  getUserMCQSubmissions,
  getSpecificMCQSubmission,
  getUserCodingSubmissions,
  getSpecificCodingSubmission,
  getUserTestResults
} from "../controllers/vendor.controller.js";
import { validateTestAccess } from '../middleware/validateTestAccess.js';
import { addTestUsers, uploadTestUsers, removeTestUsers } from '../controllers/testAccess.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vendor
 *   description: Vendor management endpoints
 */

/**
 * @swagger
 * components:
 *   responses:
 *     VendorNotApproved:
 *       description: Vendor account is not approved
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Vendor account is not approved yet. Please wait for admin approval."
 *               status:
 *                 type: string
 *                 example: "pending"
 */

/**
 * @swagger
 * /api/vendor/dashboard:
 *   get:
 *     summary: Get vendor dashboard statistics
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalTests:
 *                       type: number
 *                       description: Total number of tests created by the vendor
 *                     activeTests:
 *                       type: number
 *                       description: Number of currently published tests
 *                     totalCandidates:
 *                       type: number
 *                       description: Total number of unique candidates
 *                     pendingInvitations:
 *                       type: number
 *                       description: Number of pending test invitations
 *                 performance:
 *                   type: object
 *                   properties:
 *                     averageScore:
 *                       type: number
 *                       description: Average score across all tests (rounded to 1 decimal)
 *                     passRate:
 *                       type: number
 *                       description: Percentage of candidates who passed (score >= 70%)
 *                     totalAttempts:
 *                       type: number
 *                       description: Total number of test attempts
 *                 testDistribution:
 *                   type: object
 *                   properties:
 *                     easy:
 *                       type: number
 *                       description: Number of easy difficulty tests
 *                     medium:
 *                       type: number
 *                       description: Number of medium difficulty tests
 *                     hard:
 *                       type: number
 *                       description: Number of hard difficulty tests
 *                 recentActivity:
 *                   type: array
 *                   description: List of 5 most recent test completions
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateName:
 *                         type: string
 *                         description: Name of the candidate
 *                       candidateEmail:
 *                         type: string
 *                         description: Email of the candidate
 *                       testTitle:
 *                         type: string
 *                         description: Title of the test
 *                       score:
 *                         type: number
 *                         description: Score achieved in the test
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the test was completed
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard", auth, checkRole(["vendor"]), getVendorDashboard);

/**
 * @swagger
 * /api/vendor/tests:
 *   get:
 *     summary: Get all tests created by vendor (requires approved vendor status)
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 count:
 *                   type: number
 *                   description: Number of tests found
 *                 tests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Test ID
 *                       title:
 *                         type: string
 *                         description: Title of the test
 *       403:
 *         $ref: '#/components/responses/VendorNotApproved'
 */
router.get("/tests", auth, checkRole(["vendor"]), getVendorTests);

/**
 * @swagger
 * /api/vendor/tests/analytics:
 *   get:
 *     summary: Get analytics for vendor's tests
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTests: { type: number }
 *                 totalCandidates: { type: number }
 *                 averageScore: { type: number }
 *                 testCompletion: { type: number }
 *                 testsByDifficulty:
 *                   type: object
 *                   properties:
 *                     easy: { type: number }
 *                     medium: { type: number }
 *                     hard: { type: number }
 */
router.get("/tests/analytics", auth, checkRole(["vendor"]), getTestAnalytics);

/**
 * @swagger
 * /api/vendor/tests/{testId}/results:
 *   get:
 *     summary: Get results for a specific test
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   candidateId: { type: string }
 *                   candidateName: { type: string }
 *                   score: { type: number }
 *                   submittedAt: { type: string, format: date-time }
 *                   status: { type: string }
 */
router.get("/tests/:testId/results", auth, checkRole(["vendor"]), getTestResults);

/**
 * @swagger
 * /api/vendor/tests/{testId}/candidates:
 *   get:
 *     summary: Get candidates who took a specific test
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   name: { type: string }
 *                   email: { type: string }
 *                   status: { type: string }
 *                   attempts: { type: number }
 */
router.get("/tests/:testId/candidates", auth, checkRole(["vendor"]), getTestCandidates);

/**
 * @swagger
 * /api/vendor/invitations:
 *   post:
 *     summary: Send test invitations to candidates
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testId, candidates]
 *             properties:
 *               testId:
 *                 type: string
 *               candidates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email: { type: string }
 *                     name: { type: string }
 *               validUntil: { type: string, format: date-time }
 *               maxAttempts: { type: number }
 */
router.post("/invitations", auth, checkRole(["vendor"]), checkVendorApproval, sendTestInvitations);

/**
 * @swagger
 * /api/vendor/invitations/{testId}:
 *   get:
 *     summary: Get all invitations sent for a test
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 */
router.get("/invitations/:testId", auth, checkRole(["vendor"]), getTestInvitations);

/**
 * @swagger
 * /api/vendor/profile:
 *   get:
 *     summary: Get vendor profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update vendor profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               company: { type: string }
 *               phone: { type: string }
 */
router.get("/profile", auth, checkRole(["vendor"]), getVendorProfile);
router.put("/profile", auth, checkRole(["vendor"]), updateVendorProfile);

/**
 * @swagger
 * /api/vendor/reports:
 *   get:
 *     summary: Get vendor reports
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report period (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testMetrics:
 *                   type: object
 *                   properties:
 *                     totalTests:
 *                       type: number
 *                       description: Total number of tests created in period
 *                     activeTests:
 *                       type: number
 *                       description: Number of active tests in period
 *                     completedTests:
 *                       type: number
 *                       description: Number of completed test attempts in period
 *                 candidateMetrics:
 *                   type: object
 *                   properties:
 *                     totalCandidates:
 *                       type: number
 *                       description: Total unique candidates in period
 *                     passedCandidates:
 *                       type: number
 *                       description: Number of candidates who passed
 *                     failedCandidates:
 *                       type: number
 *                       description: Number of candidates who failed
 *                 performanceMetrics:
 *                   type: object
 *                   properties:
 *                     averageScore:
 *                       type: number
 *                       description: Average score across all attempts
 *                     highestScore:
 *                       type: number
 *                       description: Highest score achieved
 *                     lowestScore:
 *                       type: number
 *                       description: Lowest score achieved
 *                 dailyPerformance:
 *                   type: array
 *                   description: Daily breakdown of test performance
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: Date of performance metrics
 *                       testId:
 *                         type: string
 *                         description: ID of the test
 *                       averageScore:
 *                         type: number
 *                         description: Average score for the day
 *                       attempts:
 *                         type: number
 *                         description: Number of attempts for the day
 *                       passRate:
 *                         type: number
 *                         description: Pass rate percentage for the day
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/reports", auth, checkRole(["vendor"]), getVendorReports);

/**
 * @swagger
 * /api/vendor/tests/{testId}/export:
 *   get:
 *     summary: Export test results in various formats
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test to export
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, excel, pdf]
 *         description: Export format type
 *     responses:
 *       200:
 *         description: File exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid export format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 *       500:
 *         description: Internal server error
 *     description: |
 *       Exports test results in the specified format. The exported file includes:
 *       - Test title and details
 *       - Candidate information
 *       - Test scores and status
 *       - Completion times
 *       - Question-level statistics
 *       
 *       Available formats:
 *       - CSV: Simple tabular format
 *       - Excel: Formatted spreadsheet
 *       - PDF: Formatted document with summary and details
 */
router.get("/tests/:testId/export", auth, checkRole(["vendor"]), exportTestResults);

/**
 * @swagger
 * /api/vendor/tests/{testId}:
 *   get:
 *     summary: Get a specific test owned by the vendor
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId", auth, checkRole(["vendor"]), checkVendorApproval, getVendorTest);

/**
 * @swagger
 * /api/vendor/tests/{testId}/analytics:
 *   get:
 *     summary: Get detailed analytics for a specific test
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalAttempts: 
 *                       type: number
 *                     averageScore:
 *                       type: number
 *                     passRate:
 *                       type: number
 *                     averageDuration:
 *                       type: number
 *                 questionAnalytics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                       correctRate:
 *                         type: number
 *                       avgTimeSpent:
 *                         type: number
 */
router.get("/tests/:testId/analytics", auth, checkRole(["vendor"]), getTestAnalytics);

/**
 * @swagger
 * /api/vendor/debug/tests:
 *   get:
 *     summary: Debug endpoint to view all tests (admin only)
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Debug information about tests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: Current user's ID
 *                 totalTests:
 *                   type: number
 *                   description: Total number of tests in the system
 *                 userTestCount:
 *                   type: number
 *                   description: Number of tests belonging to the user
 *                 allTests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: 
 *                         type: string
 *                       vendor:
 *                         type: string
 */
router.get("/tests/debug", auth, checkRole(["vendor"]), debugTests);

/**
 * @swagger
 * /api/vendor/analytics/candidate-performance:
 *   get:
 *     summary: Get candidate performance analytics for vendor's tests
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *         description: Time period for analytics
 *       - in: query
 *         name: testId
 *         schema:
 *           type: string
 *         description: Specific test filter (optional)
 *     responses:
 *       200:
 *         description: Candidate performance analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Vendor access required
 */
router.get('/analytics/candidate-performance', auth, checkRole(["vendor"]), async (req, res) => {
  try {
    const { timeframe = 'month', testId } = req.query;
    const vendorId = req.user._id; // Assuming vendor ID is in the user object

    // Calculate date range based on timeframe
    const getDateRange = () => {
      const now = new Date();
      switch (timeframe) {
        case 'week':
          return new Date(now - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now - 30 * 24 * 60 * 60 * 1000);
        case 'year':
          return new Date(now - 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(0);
      }
    };

    // Get all tests by this vendor
    const vendorTests = await Test.find({ vendor: vendorId });
    const vendorTestIds = vendorTests.map(test => test._id);

    if (vendorTestIds.length === 0) {
      return res.json({
        message: "No tests found for this vendor",
        data: null
      });
    }

    // Base filters
    const dateFilter = { createdAt: { $gte: getDateRange() } };
    const testFilter = testId ? 
      { test: new mongoose.Types.ObjectId(testId) } : 
      { test: { $in: vendorTestIds } };

    // Aggregate test results
    const performanceMetrics = await TestResult.aggregate([
      {
        $match: {
          ...dateFilter,
          ...testFilter
        }
      },
      {
        $lookup: {
          from: 'tests',
          localField: 'test',
          foreignField: '_id',
          as: 'testDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$testDetails'
      },
      {
        $unwind: '$userDetails'
      },
      {
        $group: {
          _id: '$test',
          testTitle: { $first: '$testDetails.title' },
          totalCandidates: { $addToSet: '$user' },
          averageScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' },
          totalAttempts: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $gte: ['$score', '$testDetails.passingScore'] }, 1, 0] }
          },
          averageCompletionTime: { $avg: '$duration' },
          scoreDistribution: {
            $push: {
              score: '$score',
              candidateName: '$userDetails.name',
              attemptDate: '$createdAt'
            }
          },
          questionPerformance: {
            $push: {
              questions: '$questionResponses',
              score: '$score'
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          testTitle: 1,
          totalCandidates: { $size: '$totalCandidates' },
          averageScore: { $round: ['$averageScore', 2] },
          highestScore: 1,
          lowestScore: 1,
          totalAttempts: 1,
          passRate: {
            $multiply: [
              { $divide: ['$passCount', '$totalAttempts'] },
              100
            ]
          },
          averageCompletionTime: 1,
          scoreDistribution: 1,
          questionPerformance: 1
        }
      }
    ]);

    // Get performance trends over time
    const performanceTrends = await TestResult.aggregate([
      {
        $match: {
          ...dateFilter,
          ...testFilter
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            test: '$test'
          },
          averageScore: { $avg: '$score' },
          attempts: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Calculate difficulty analysis
    const difficultyAnalysis = await TestResult.aggregate([
      {
        $match: {
          ...dateFilter,
          ...testFilter
        }
      },
      {
        $unwind: '$questionResponses'
      },
      {
        $group: {
          _id: {
            test: '$test',
            question: '$questionResponses.questionId'
          },
          correctCount: {
            $sum: { $cond: ['$questionResponses.isCorrect', 1, 0] }
          },
          totalAttempts: { $sum: 1 }
        }
      },
      {
        $project: {
          difficultyRate: {
            $multiply: [
              { $divide: ['$correctCount', '$totalAttempts'] },
              100
            ]
          }
        }
      }
    ]);

    res.json({
      summary: {
        tests: performanceMetrics.map(metric => ({
          testId: metric._id,
          testTitle: metric.testTitle,
          metrics: {
            totalCandidates: metric.totalCandidates,
            averageScore: metric.averageScore,
            highestScore: metric.highestScore,
            lowestScore: metric.lowestScore,
            totalAttempts: metric.totalAttempts,
            passRate: metric.passRate,
            averageCompletionTime: metric.averageCompletionTime
          }
        })),
        overall: {
          totalTests: performanceMetrics.length,
          totalAttempts: performanceMetrics.reduce((sum, metric) => sum + metric.totalAttempts, 0),
          averagePassRate: performanceMetrics.reduce((sum, metric) => sum + metric.passRate, 0) / performanceMetrics.length
        }
      },
      trends: {
        performanceOverTime: performanceTrends,
        difficultyAnalysis
      },
      details: testId ? performanceMetrics[0]?.scoreDistribution : null,
      timeframe,
      lastUpdated: new Date()
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/vendor/tests/{testId}/users:
 *   get:
 *     summary: Get all users who attempted a specific test
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId/users", auth, checkRole(["vendor"]), getTestUsers);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/submissions:
 *   get:
 *     summary: Get detailed submission information for a specific user
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission information retrieved successfully
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId/users/:userId/submissions", auth, checkRole(["vendor"]), getUserSubmissions);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/mcq:
 *   get:
 *     summary: Get all MCQ submissions for a user's test
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: MCQ submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   questionId:
 *                     type: string
 *                     description: ID of the MCQ question
 *                   behavior:
 *                     type: object
 *                     properties:
 *                       warnings:
 *                         type: number
 *                         description: Number of warnings issued
 *                       tabSwitches:
 *                         type: number
 *                         description: Number of tab switches
 *                       timeSpent:
 *                         type: number
 *                         description: Time spent in seconds
 *                       focusLostCount:
 *                         type: number
 *                         description: Number of times focus was lost
 *                   performance:
 *                     type: object
 *                     properties:
 *                       score:
 *                         type: number
 *                         description: Score achieved for this question
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId/users/:userId/mcq", auth, checkRole(["vendor"]), getUserMCQSubmissions);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/mcq/{mcqId}:
 *   get:
 *     summary: Get a specific MCQ submission
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: path
 *         name: mcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the specific MCQ question
 *     responses:
 *       200:
 *         description: MCQ submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questionId:
 *                   type: string
 *                 behavior:
 *                   type: object
 *                   properties:
 *                     warnings:
 *                       type: number
 *                     tabSwitches:
 *                       type: number
 *                     timeSpent:
 *                       type: number
 *                     focusLostCount:
 *                       type: number
 *                     browserEvents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           details:
 *                             type: object
 *                 performance:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     browser:
 *                       type: string
 *                     os:
 *                       type: string
 *                     device:
 *                       type: string
 *                     screenResolution:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: MCQ submission not found
 */
router.get("/tests/:testId/users/:userId/mcq/:mcqId", auth, checkRole(["vendor"]), getSpecificMCQSubmission);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/coding:
 *   get:
 *     summary: Get all coding submissions for a user's test
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Coding submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   challengeId:
 *                     type: string
 *                   behavior:
 *                     type: object
 *                     properties:
 *                       timeSpent:
 *                         type: number
 *                       submissionAttempts:
 *                         type: number
 *                       errorCount:
 *                         type: number
 *                       hintViews:
 *                         type: number
 *                   performance:
 *                     type: object
 *                     properties:
 *                       executionTime:
 *                         type: number
 *                       memoryUsage:
 *                         type: number
 *                       testCasesPassed:
 *                         type: number
 *                       totalTestCases:
 *                         type: number
 *                       score:
 *                         type: number
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId/users/:userId/coding", auth, checkRole(["vendor"]), getUserCodingSubmissions);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/coding/{challengeId}:
 *   get:
 *     summary: Get a specific coding submission
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the specific coding challenge
 *     responses:
 *       200:
 *         description: Coding submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challengeId:
 *                   type: string
 *                 behavior:
 *                   type: object
 *                   properties:
 *                     timeSpent:
 *                       type: number
 *                     submissionAttempts:
 *                       type: number
 *                     errorCount:
 *                       type: number
 *                     hintViews:
 *                       type: number
 *                     browserEvents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           details:
 *                             type: object
 *                 performance:
 *                   type: object
 *                   properties:
 *                     executionTime:
 *                       type: number
 *                     memoryUsage:
 *                       type: number
 *                     testCasesPassed:
 *                       type: number
 *                     totalTestCases:
 *                       type: number
 *                     score:
 *                       type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     browser:
 *                       type: string
 *                     os:
 *                       type: string
 *                     device:
 *                       type: string
 *                     screenResolution:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Coding submission not found
 */
router.get("/tests/:testId/users/:userId/coding/:challengeId", auth, checkRole(["vendor"]), getSpecificCodingSubmission);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/add:
 *   post:
 *     summary: Add users to a test manually
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test to add users to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [users]
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [email, name]
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59Z"
 *               maxAttempts:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Users processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Users processed successfully"
 *                 addedUsers:
 *                   type: array
 *                   description: List of successfully added users
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "newuser@example.com"
 *                       name:
 *                         type: string
 *                         example: "New User"
 *                 duplicateUsers:
 *                   type: array
 *                   description: List of users that were already in the test
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "existing@example.com"
 *                       name:
 *                         type: string
 *                         example: "Existing User"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: number
 *                       example: 3
 *                     added:
 *                       type: number
 *                       example: 2
 *                     duplicates:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Users array is required"
 *       409:
 *         description: All users already exist in the test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All users already exist in this test"
 *                 duplicateUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 */
router.post(
  "/tests/:testId/users/add",
  auth,
  checkRole(["vendor"]),
  validateTestAccess,
  addTestUsers
);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/upload:
 *   post:
 *     summary: Add users to a test via CSV upload
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               maxAttempts:
 *                 type: number
 */
router.post(
  "/tests/:testId/users/upload",
  auth,
  checkRole(["vendor"]),
  validateTestAccess,
  uploadTestUsers
);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/remove:
 *   post:
 *     summary: Remove users from a test
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post(
  "/tests/:testId/users/remove",
  auth,
  checkRole(["vendor"]),
  validateTestAccess,
  removeTestUsers
);

/**
 * @swagger
 * /api/vendor/tests/{testId}/candidates/{userId}/results:
 *   get:
 *     summary: Get test results for a specific candidate
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test results retrieved successfully
 *       403:
 *         description: Not authorized to view these results
 *       404:
 *         description: Test or submission not found
 */
router.get(
  "/tests/:testId/candidates/:userId/results", 
  auth, 
  checkRole(["vendor"]), 
  getUserTestResults
);

export default router; 
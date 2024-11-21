import express from "express";
import { 
  createTest, 
  getTests, 
  getTestById, 
  updateTest, 
  deleteTest,
  addMCQs,
  updateMCQ,
  deleteMCQ,
  addCodingChallenges,
  updateCodingChallenge,
  deleteCodingChallenge,
  publishTest,
  addTestCase,
  updateTestCase,
  deleteTestCase,
  startTestSession,
  endTestSession,
  shareTest,
  verifyTestInvitation,
  getTestByUuid,
  acceptTestInvitation,
  sendTestInvitations,
  getTestInvitations,
  updateCodingChallenges,
  updateTestAccess,
  addAllowedUsers,
  removeAllowedUsers,
  getPublicTests,
  updateTestVisibility,
  registerForTest,
  updateSessionStatus,
  getUserSubmissions,
  verifyTestByUuid,
  checkTestRegistration,
  getTestIdByUuid
} from "../controllers/test.controller.js";
import { auth } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import TestResult from '../models/testResult.model.js';
import TestSession from '../models/testSession.model.js';
import Test from '../models/test.model.js';
import User from '../models/user.model.js';
import { validateTestAccess } from '../middleware/validateTestAccess.js';
import { validateProfile } from '../middleware/validateProfile.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Public routes MUST be defined BEFORE the auth middleware
router.post("/verify/:uuid", verifyTestByUuid);

// Protected routes below this line
router.use(auth);

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Get all tests based on user role
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title: { type: string }
 *                   description: { type: string }
 *                   duration: { type: number }
 *                   vendor: { type: object }
 *                   status: { type: string }
 *                   mcqs: { type: array }
 *                   codingChallenges: { type: array }
 */
router.get("/", auth, async (req, res) => {
  try {
    let query = {};
    
    // If admin, show all tests
    if (req.user.role === 'admin') {
      query = {};
    }
    // If vendor, show only their tests
    else if (req.user.role === 'vendor') {
      query = { vendor: req.user._id };
    }
    // If regular user, show public tests and assigned tests
    else {
      query = {
        $or: [
          { 'accessControl.type': 'public' },
          { type: 'practice' },
          { 'accessControl.allowedUsers': req.user._id }
        ]
      };
    }

    const tests = await Test.find(query)
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ 
      message: 'Error fetching tests', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get test by ID
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the test
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *       400:
 *         description: Invalid test ID format
 *       403:
 *         description: Not authorized to access this test
 *       404:
 *         description: Test not found
 */
router.get("/:id", auth, getTestById);

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - difficulty
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: number
 *               proctoring:
 *                 type: boolean
 *               instructions:
 *                 type: string
 *               mcqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     correctOptions:
 *                       type: array
 *                       items:
 *                         type: number
 *                     marks:
 *                       type: number
 *               codingChallenges:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - description
 *                     - problemStatement
 *                     - constraints
 *                     - allowedLanguages
 *                     - languageImplementations
 *                     - marks
 *                     - timeLimit
 *                     - memoryLimit
 *                     - difficulty
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     problemStatement:
 *                       type: string
 *                     constraints:
 *                       type: string
 *                     allowedLanguages:
 *                       type: array
 *                       items:
 *                         type: string
 *                     languageImplementations:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         required:
 *                           - visibleCode
 *                           - invisibleCode
 *                         properties:
 *                           visibleCode:
 *                             type: string
 *                           invisibleCode:
 *                             type: string
 *                     testCases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           input:
 *                             type: string
 *                           output:
 *                             type: string
 *                           isVisible:
 *                             type: boolean
 *                           explanation:
 *                             type: string
 *                     marks:
 *                       type: number
 *                     timeLimit:
 *                       type: number
 *                     memoryLimit:
 *                       type: number
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Test created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [draft, published]
 *                 mcqs:
 *                   type: array
 *                 codingChallenges:
 *                   type: array
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to create tests
 */
router.post("/", auth, checkRole(["vendor", "admin"]), createTest);

/**
 * @swagger
 * /api/tests/{testId}/mcqs:
 *   post:
 *     summary: Add MCQs to an existing test
 *     tags: [Tests]
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
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - question
 *                 - options
 *                 - correctOptions
 *                 - answerType
 *                 - marks
 *                 - difficulty
 *               properties:
 *                 question:
 *                   type: string
 *                 options:
 *                   type: array
 *                   items:
 *                     type: string
 *                 correctOptions:
 *                   type: array
 *                   items:
 *                     type: number
 *                 answerType:
 *                   type: string
 *                   enum: [single, multiple]
 *                 marks:
 *                   type: number
 *                 difficulty:
 *                   type: string
 *                   enum: [easy, medium, hard]
 *                 explanation:
 *                   type: string
 *     responses:
 *       200:
 *         description: MCQs added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mcqs:
 *                   type: array
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Test not found
 */
router.post("/:testId/mcqs", auth, checkRole(["vendor", "admin"]), addMCQs);

/**
 * @swagger
 * /api/tests/{testId}/mcq/{mcqId}:
 *   put:
 *     summary: Update a specific MCQ in a test
 *     tags: [Tests]
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
 *         name: mcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the MCQ to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: Updated question text
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of answer options
 *               correctOptions:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of indices of correct answers
 *               answerType:
 *                 type: string
 *                 enum: [single, multiple]
 *                 description: Type of answer selection
 *               marks:
 *                 type: number
 *                 description: Points for this question
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Difficulty level
 *     responses:
 *       200:
 *         description: MCQ updated successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or MCQ not found
 */
router.put("/:testId/mcq/:mcqId", auth, checkRole(["vendor", "admin"]), updateMCQ);

/**
 * @swagger
 * /api/tests/{testId}/mcq/{mcqId}:
 *   delete:
 *     summary: Delete MCQ from test
 *     tags: [Tests]
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
 *         name: mcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the MCQ to delete
 *     responses:
 *       200:
 *         description: MCQ deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or MCQ not found
 */
router.delete("/:testId/mcq/:mcqId", auth, checkRole(["vendor", "admin"]), deleteMCQ);

/**
 * @swagger
 * /api/tests/{testId}/coding-challenges:
 *   post:
 *     summary: Add coding challenges to an existing test
 *     tags: [Tests]
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
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - title
 *                 - description
 *                 - constraints
 *                 - language
 *                 - marks
 *                 - timeLimit
 *                 - memoryLimit
 *                 - difficulty
 *                 - testCases
 *               properties:
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 constraints:
 *                   type: string
 *                 language:
 *                   type: string
 *                 allowedLanguages:
 *                   type: array
 *                   items:
 *                     type: string
 *                 marks:
 *                   type: number
 *                 timeLimit:
 *                   type: number
 *                 memoryLimit:
 *                   type: number
 *                 difficulty:
 *                   type: string
 *                   enum: [easy, medium, hard]
 *                 testCases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required:
 *                       - input
 *                       - output
 *                     properties:
 *                       input:
 *                         type: string
 *                       output:
 *                         type: string
 *                       hidden:
 *                         type: boolean
 *                       explanation:
 *                         type: string
 *     responses:
 *       200:
 *         description: Coding challenges added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 codingChallenges:
 *                   type: array
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Test not found
 */
router.post("/:testId/coding-challenges", auth, checkRole(["vendor", "admin"]), addCodingChallenges);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}:
 *   put:
 *     summary: Update a coding challenge
 *     tags: [Tests]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               problemStatement:
 *                 type: string
 *               constraints:
 *                 type: string
 *               allowedLanguages:
 *                 type: array
 *                 items:
 *                   type: string
 *               languageImplementations:
 *                 type: object
 *                 additionalProperties:
 *                   type: object
 *                   required:
 *                     - visibleCode
 *                     - invisibleCode
 *                   properties:
 *                     visibleCode:
 *                       type: string
 *                     invisibleCode:
 *                       type: string
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *                     isVisible:
 *                       type: boolean
 *                     explanation:
 *                       type: string
 *     responses:
 *       200:
 *         description: Coding challenge updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or challenge not found
 */
router.put("/:testId/coding/:challengeId", auth, checkRole(["vendor", "admin"]), updateCodingChallenge);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}:
 *   delete:
 *     summary: Delete coding challenge from test
 *     tags: [Tests]
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
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coding challenge to delete
 *     responses:
 *       200:
 *         description: Coding challenge deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or coding challenge not found
 */
router.delete("/:testId/coding/:challengeId", auth, checkRole(["vendor", "admin"]), deleteCodingChallenge);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}/testcase:
 *   post:
 *     summary: Add test case to coding challenge
 *     tags: [Tests]
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
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coding challenge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [input, output]
 *             properties:
 *               input: { type: string }
 *               output: { type: string }
 *               hidden: { type: boolean }
 *               explanation: { type: string }
 *     responses:
 *       201:
 *         description: Test case added successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or coding challenge not found
 */
router.post("/:testId/coding/:challengeId/testcase", auth, checkRole(["vendor", "admin"]), addTestCase);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}/testcase/{testCaseId}:
 *   put:
 *     summary: Update test case
 *     tags: [Tests]
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
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coding challenge
 *       - in: path
 *         name: testCaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test case
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input: { type: string }
 *               output: { type: string }
 *               hidden: { type: boolean }
 *               explanation: { type: string }
 *     responses:
 *       200:
 *         description: Test case updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test, coding challenge, or test case not found
 */
router.put("/:testId/coding/:challengeId/testcase/:testCaseId", auth, checkRole(["vendor", "admin"]), updateTestCase);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}/testcase/{testCaseId}:
 *   delete:
 *     summary: Delete test case
 *     tags: [Tests]
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
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coding challenge
 *       - in: path
 *         name: testCaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test case
 *     responses:
 *       200:
 *         description: Test case deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test, coding challenge, or test case not found
 */
router.delete("/:testId/coding/:challengeId/testcase/:testCaseId", auth, checkRole(["vendor", "admin"]), deleteTestCase);

/**
 * @swagger
 * /api/tests/{testId}/publish:
 *   post:
 *     summary: Publish a test (validates all required fields)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         description: MongoDB ID of the test to publish
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test published successfully"
 *                 test:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     title: { type: string }
 *                     publishedAt: { type: string }
 *                     sharingToken: { type: string }
 *                 shareableLink:
 *                   type: string
 *                   example: "http://yourfrontend.com/test/take/123?token=abc..."
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */
router.post("/:testId/publish", auth, checkRole(["vendor", "admin"]), publishTest);

// Basic CRUD operations
router.get("/", auth, getTests);
router.get("/:id", auth, getTestById);
router.put("/:id", auth, checkRole(["vendor", "admin"]), updateTest);
router.delete("/:id", auth, checkRole(["vendor", "admin"]), deleteTest);

// Test Session Management
router.post("/sessions/start", auth, startTestSession);
router.post("/sessions/:sessionId/end", auth, endTestSession);
router.post("/sessions/:sessionId/status", auth, updateSessionStatus);

// Test Sharing
router.post("/:id/share", auth, shareTest);
router.post("/invitations/verify", verifyTestInvitation);
router.post("/invitations/accept", auth, acceptTestInvitation);
router.post("/:testId/invitations", auth, checkRole(["vendor", "admin"]), sendTestInvitations);
router.get("/:testId/invitations", auth, checkRole(["vendor", "admin"]), getTestInvitations);

/**
 * @swagger
 * /api/tests/{uuid}/take:
 *   get:
 *     summary: Get test details for taking the test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 */
router.get("/:uuid/take", auth, async (req, res) => {
  try {
    const test = await Test.findOne({ uuid: req.params.uuid })
      .populate('mcqs')
      .populate('codingChallenges');
    
    if (!test) {
      return res.status(404).json({ 
        message: "Test not found",
        uuid: req.params.uuid 
      });
    }

    res.json({
      message: "Test loaded successfully",
      data: {
        id: test._id,  // Added test ID to response
        uuid: test.uuid,  // Added UUID to response
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        mcqs: test.mcqs,
        codingChallenges: test.codingChallenges
      }
    });

  } catch (error) {
    console.error('Error in getTestByUuid:', error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      uuid: req.params.uuid
    });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     summary: Update an existing test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Test title
 *               description:
 *                 type: string
 *                 description: Test description
 *               duration:
 *                 type: number
 *                 description: Test duration in minutes
 *               proctoring:
 *                 type: boolean
 *                 description: Whether proctoring is enabled
 *               instructions:
 *                 type: string
 *                 description: Test instructions
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 description: Test status
 *               mcqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       required: true
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       required: true
 *                     correctOptions:
 *                       type: array
 *                       items:
 *                         type: number
 *                       required: true
 *                     answerType:
 *                       type: string
 *                       enum: [single, multiple]
 *                       required: true
 *                     marks:
 *                       type: number
 *                       required: true
 *                     explanation:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *                       required: true
 *               codingChallenges:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       required: true
 *                     description:
 *                       type: string
 *                       required: true
 *                     constraints:
 *                       type: string
 *                       required: true
 *                     language:
 *                       type: string
 *                       required: true
 *                     marks:
 *                       type: number
 *                       required: true
 *                     timeLimit:
 *                       type: number
 *                       required: true
 *                     memoryLimit:
 *                       type: number
 *                       required: true
 *                     sampleCode:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *                       required: true
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     testCases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           input:
 *                             type: string
 *                             required: true
 *                           output:
 *                             type: string
 *                             required: true
 *                           hidden:
 *                             type: boolean
 *                           explanation:
 *                             type: string
 *     responses:
 *       200:
 *         description: Test updated successfully
 *       400:
 *         description: Validation error or invalid test ID
 *       403:
 *         description: Not authorized to update this test
 *       404:
 *         description: Test not found
 */

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Delete a test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */

/**
 * @swagger
 * /api/tests/sessions/start:
 *   post:
 *     summary: Start a new test session
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testId
 *             properties:
 *               testId:
 *                 type: string
 *                 description: ID of the test to start
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   browser:
 *                     type: string
 *                   os:
 *                     type: string
 *                   screenResolution:
 *                     type: string
 *     responses:
 *       201:
 *         description: Test session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     test:
 *                       type: string
 *                     user:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [started, in_progress, completed, terminated]
 *       400:
 *         description: Invalid request or test already in progress
 *       404:
 *         description: Test not found
 */

/**
 * @swagger
 * /api/tests/sessions/{sessionId}/end:
 *   post:
 *     summary: End a test session
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test session to end
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: object
 *                 description: User's answers for the test
 *               submissionType:
 *                 type: string
 *                 enum: [manual, auto]
 *                 description: Whether the submission was manual or automatic (timeout)
 *     responses:
 *       200:
 *         description: Test session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [completed, terminated]
 *                     submissionType:
 *                       type: string
 *                     score:
 *                       type: number
 *       400:
 *         description: Invalid request or session already ended
 *       403:
 *         description: Not authorized to end this session
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /api/tests/sessions/{sessionId}/status:
 *   post:
 *     summary: Update test session status
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [in_progress, paused, resumed, terminated]
 *                 description: New status for the session
 *               reason:
 *                 type: string
 *                 description: Reason for status change (especially for termination)
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: When the status change occurred
 *     responses:
 *       200:
 *         description: Session status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     statusHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           reason:
 *                             type: string
 *       400:
 *         description: Invalid status or request
 *       403:
 *         description: Not authorized to update this session
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /api/tests/{id}/share:
 *   post:
 *     summary: Share a test with others via email
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emails]
 *             properties:
 *               emails:
 *                 type: array
 *                 items: { type: string }
 *               validUntil: { type: string, format: date-time }
 *               maxAttempts: { type: number }
 *     responses:
 *       200:
 *         description: Test shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email: { type: string }
 *                       shareableLink: { type: string }
 *                       validUntil: { type: string, format: date-time }
 *                       maxAttempts: { type: number }
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */

/**
 * @swagger
 * /api/tests/invitations/verify:
 *   post:
 *     summary: Verify a test invitation
 *     tags: [Tests]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Invitation verified successfully
 *       400:
 *         description: Invalid token
 */

router.patch(
  '/:testId/coding-challenges',
  auth,
  checkRole(['vendor', 'admin']),
  updateCodingChallenges
);

router.post(
  '/:testId/publish',
  auth,
  checkRole(['vendor', 'admin']),
  publishTest
);

// When a user starts a test
router.post('/tests/:testId/start', auth, validateTestAccess, async (req, res) => {
  try {
    // Check if test exists
    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create test session
    const testSession = await TestSession.create({
      test: test._id,
      user: user._id,
      startTime: new Date(),
      status: 'started',
      deviceInfo: req.body.deviceInfo || {}
    });

    res.status(201).json({
      message: 'Test session started successfully',
      session: testSession
    });

  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).json({ message: error.message });
  }
});

// When user submits answers
router.post('/tests/:testId/submit', auth, validateTestAccess, async (req, res) => {
  try {
    // Find active test session
    const session = await TestSession.findOne({
      test: req.params.testId,
      user: req.user._id,
      status: 'started'
    });

    if (!session) {
      return res.status(404).json({ message: 'No active test session found' });
    }

    // Update session status
    session.status = 'completed';
    session.endTime = new Date();
    session.answers = req.body.answers;
    await session.save();

    // Get test details for scoring
    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Calculate score (implement your scoring logic here)
    const score = calculateScore(req.body.answers, test);

    // Update user's test results
    await TestResult.create({
      test: test._id,
      user: req.user._id,
      session: session._id,
      score,
      answers: req.body.answers,
      completedAt: new Date()
    });

    res.json({
      message: 'Test submitted successfully',
      score,
      session: session._id
    });

  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update session status
router.post('/sessions/:sessionId/status', auth, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const session = await TestSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify user has permission to update this session
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this session' });
    }

    // Update session status
    session.status = status;
    session.reason = reason;
    session.timestamp = new Date();
    await session.save();

    res.json({
      message: 'Session status updated successfully',
      session: session._id
    });

  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Access control routes
router.put(
  "/:testId/access",
  auth,
  checkRole(["vendor", "admin"]),
  updateTestAccess
);

router.post(
  "/:testId/allowed-users",
  auth,
  checkRole(["vendor", "admin"]),
  addAllowedUsers
);

router.delete(
  "/:testId/allowed-users",
  auth,
  checkRole(["vendor", "admin"]),
  removeAllowedUsers
);

/**
 * @swagger
 * /api/tests/public:
 *   get:
 *     tags: [Tests]
 *     summary: Get all public tests
 *     description: Retrieve all public and published tests with optional filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [assessment, practice]
 *         description: Filter by test type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: List of public tests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       totalMarks:
 *                         type: number
 *                       type:
 *                         type: string
 *                       vendor:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     limit:
 *                       type: number
 */
router.get("/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on filters
    let query = {
      'accessControl.type': 'public',
      status: 'published'
    };

    // Add optional filters
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Test.countDocuments(query);

    // Get tests
    const tests = await Test.find(query)
      .select('title description duration totalMarks type vendor questionCounts createdAt updatedAt')
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format response
    const formattedTests = tests.map(test => ({
      _id: test._id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks,
      type: test.type,
      vendor: {
        name: test.vendor.name,
        email: test.vendor.email
      },
      questionCounts: {
        mcq: test.mcqs?.length || 0,
        coding: test.codingChallenges?.length || 0
      },
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    }));

    res.json({
      tests: formattedTests,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching public tests:', error);
    res.status(500).json({ 
      message: 'Error fetching public tests', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/tests/{testId}/visibility:
 *   patch:
 *     summary: Update test visibility and type
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [visibility]
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [public, private, practice]
 *                 description: New visibility setting for the test
 *     responses:
 *       200:
 *         description: Test visibility updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 visibility:
 *                   type: string
 *                   enum: [public, private, practice]
 *                 type:
 *                   type: string
 *                   enum: [assessment, practice]
 *       400:
 *         description: Invalid visibility type
 *       403:
 *         description: Not authorized to change test visibility
 *       404:
 *         description: Test not found
 */
router.patch(
  "/:testId/visibility",
  auth,
  checkRole(["vendor", "admin"]),
  updateTestVisibility
);

/**
 * @swagger
 * /api/tests/{testId}/register:
 *   post:
 *     summary: Register for a test/hackathon
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test to register for
 *     responses:
 *       201:
 *         description: Successfully registered for test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 registration:
 *                   type: object
 *                   properties:
 *                     test:
 *                       type: string
 *                     user:
 *                       type: string
 *                     registeredAt:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Already registered or test not available
 *       404:
 *         description: Test not found
 */
router.post(
  "/:testId/register",
  auth,
  validateProfile,
  registerForTest
);

/**
 * @swagger
 * /api/submissions/user/{userId}:
 *   get:
 *     summary: Get all submissions for a user
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User's test submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mcq:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       testId: { type: string }
 *                       testTitle: { type: string }
 *                       type: { type: string }
 *                       category: { type: string }
 *                       difficulty: { type: string }
 *                       score: { type: number }
 *                       totalMarks: { type: number }
 *                       passingMarks: { type: number }
 *                       status: { type: string }
 *                       submittedAt: { type: string }
 *                       answers: { type: array }
 *                 coding:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       testId: { type: string }
 *                       testTitle: { type: string }
 *                       type: { type: string }
 *                       category: { type: string }
 *                       difficulty: { type: string }
 *                       score: { type: number }
 *                       totalMarks: { type: number }
 *                       passingMarks: { type: number }
 *                       status: { type: string }
 *                       submittedAt: { type: string }
 *                       solutions: { type: array }
 */
router.get('/submissions/user/:userId', auth, getUserSubmissions);

// Public route for verifying test by UUID
router.post("/verify/:uuid", verifyTestByUuid);

// Then add the auth middleware for protected routes
router.use(auth);

/**
 * @swagger
 * /api/tests/verify/{uuid}:
 *   post:
 *     summary: Verify a test by UUID (Public endpoint)
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the test
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Access token for private tests (optional)
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 test:
 *                   type: object
 *                   properties:
 *                     uuid:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     type:
 *                       type: string
 *                     category:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                     totalMarks:
 *                       type: number
 *                     vendor:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       404:
 *         description: Test not found
 *       403:
 *         description: Invalid access token or test not available
 */
router.post("/verify/:uuid", verifyTestByUuid);

/**
 * @swagger
 * /api/tests/register/{uuid}:
 *   post:
 *     summary: Register for a test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the test
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Access token for private tests (optional)
 *     responses:
 *       200:
 *         description: Successfully registered for test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: ID of the created test session
 *       401:
 *         description: Unauthorized - User not logged in
 *       403:
 *         description: Invalid access token or test not available
 *       404:
 *         description: Test not found
 */
router.post("/register/:uuid", auth, registerForTest);

/**
 * @swagger
 * /api/tests/{uuid}/take:
 *   get:
 *     summary: Get test details for taking the test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     totalMarks:
 *                       type: number
 *                     mcqs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question:
 *                             type: string
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                           marks:
 *                             type: number
 *                     codingChallenges:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           problemStatement:
 *                             type: string
 *                           constraints:
 *                             type: string
 *                           marks:
 *                             type: number
 *       401:
 *         description: Unauthorized - User not logged in
 *       403:
 *         description: Not authorized to take this test
 *       404:
 *         description: Test not found
 */
router.get("/:uuid/take", auth, getTestByUuid);

/**
 * @swagger
 * /api/tests/{uuid}/check-registration:
 *   post:
 *     summary: Check if user can register for a test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: User can register for test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canRegister:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: User cannot register for test
 *       404:
 *         description: Test not found
 */
router.post("/:uuid/check-registration", auth, checkTestRegistration);

/**
 * @swagger
 * /api/tests/parse/{uuid}:
 *   get:
 *     summary: Get test ID from UUID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: Test ID retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     uuid:
 *                       type: string
 *                     title:
 *                       type: string
 *       404:
 *         description: Test not found
 */
router.get("/parse/:uuid", getTestIdByUuid);

export default router;


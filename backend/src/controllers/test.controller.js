import Test from "../models/test.model.js";
import TestSession from "../models/testSession.model.js";
import TestResult from "../models/testResult.model.js";
import TestInvitation from "../models/testInvitation.model.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import TestRegistration from "../models/testRegistration.model.js";
import Submission from '../models/submission.model.js';

export const createTest = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      duration, 
      proctoring, 
      instructions,
      type = 'assessment',
      category,
      difficulty,
      accessControl = { type: 'private' },
      mcqs = [],
      codingChallenges = []
    } = req.body;

    // Validate test type
    if (!['assessment', 'practice'].includes(type)) {
      return res.status(400).json({
        error: "Test type must be either 'assessment' or 'practice'"
      });
    }

    // Validate MCQs if provided
    for (const mcq of mcqs) {
      if (!mcq.question || !mcq.options || !mcq.correctOptions || 
          !mcq.answerType || !mcq.marks || !mcq.difficulty) {
        return res.status(400).json({
          error: "Each MCQ must have question, options, correctOptions, answerType, marks, and difficulty"
        });
      }
    }

    // Validate coding challenges
    for (const challenge of codingChallenges) {
      if (!challenge.title || !challenge.description || !challenge.problemStatement || 
          !challenge.constraints || !challenge.allowedLanguages || 
          !challenge.languageImplementations || !challenge.marks || 
          !challenge.timeLimit || !challenge.memoryLimit || !challenge.difficulty) {
        return res.status(400).json({
          error: "Missing required fields in coding challenge"
        });
      }

      // Validate language implementations
      for (const [lang, impl] of Object.entries(challenge.languageImplementations)) {
        if (!impl.visibleCode || !impl.invisibleCode) {
          return res.status(400).json({
            error: `Both visibleCode and invisibleCode are required for language: ${lang}`
          });
        }
      }

      // Validate test cases if provided
      if (challenge.testCases) {
        for (const testCase of challenge.testCases) {
          if (!testCase.input || !testCase.output) {
            return res.status(400).json({
              error: "Each test case must have input and output"
            });
          }
        }
      }
    }

    // Calculate total marks
    const totalMcqMarks = mcqs.reduce((sum, mcq) => sum + mcq.marks, 0);
    const totalCodingMarks = codingChallenges.reduce((sum, challenge) => sum + challenge.marks, 0);
    const totalMarks = totalMcqMarks + totalCodingMarks;

    // Create test
    const test = await Test.create({
      title,
      description,
      vendor: req.user._id,
      duration,
      proctoring,
      instructions,
      type,
      category,
      difficulty,
      status: 'draft',
      totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.4),
      timeLimit: duration,
      mcqs,
      codingChallenges,
      accessControl,
      uuid: uuidv4(),
      sharingToken: crypto.randomBytes(32).toString('hex')
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTests = async (req, res) => {
  try {
    let query = { status: 'published' };
    
    // If user is authenticated
    if (req.user) {
      if (req.user.role === 'user') {
        // Get user's submissions using correct model
        const userSubmissions = await Submission.find({ 
          user: req.user._id 
        }).lean();

        // Create a map of test submissions for quick lookup
        const submissionMap = new Map(
          userSubmissions.map(sub => [sub.test.toString(), sub])
        );

        query = {
          status: 'published',
          $or: [
            { 'accessControl.type': 'public' },
            { 'accessControl.type': 'practice' }
          ]
        };
      }
      // If user role is 'user', show:
      // 1. Published public tests
      // 2. Published practice tests
      else if (req.user.role === 'user') {
        query = {
          status: 'published',
          $or: [
            { 'accessControl.type': 'public' },
            { 'accessControl.type': 'practice' }
          ]
        };
      }
      // If vendor, show only their tests
      else if (req.user.role === 'vendor') {
        query = { vendor: req.user._id };
      }
      // Admin can see all tests (no additional query needed)
    } else {
      // For non-authenticated users, only show public tests
      query = {
        status: 'published',
        'accessControl.type': 'public'
      };
    }
    
    const tests = await Test.find(query)
      .populate('vendor', 'name email')
      .select('-mcqs.correctOptions -codingChallenges.testCases') // Don't send answers
      .sort({ createdAt: -1 });

    // Transform the response to include submission data
    const transformedTests = await Promise.all(tests.map(async test => {
      // Get user's submission for this test if they're logged in
      let submission = null;
      if (req.user) {
        submission = await Submission.findOne({
          test: test._id,
          user: req.user._id
        })
        .select('score status submittedAt mcqAnswers codingAnswers')
        .lean();
      }

      return {
        _id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        type: test.type,
        status: test.status,
        category: test.category,
        difficulty: test.difficulty,
        accessControl: {
          type: test.accessControl.type
        },
        vendor: {
          name: test.vendor.name,
          email: test.vendor.email
        },
        mcqs: test.mcqs?.map(mcq => ({
          question: mcq.question,
          options: mcq.options,
          marks: mcq.marks,
          difficulty: mcq.difficulty,
          answerType: mcq.answerType
        })) || [],
        codingChallenges: test.codingChallenges?.map(challenge => ({
          title: challenge.title,
          description: challenge.description,
          constraints: challenge.constraints,
          language: challenge.language,
          marks: challenge.marks,
          timeLimit: challenge.timeLimit,
          memoryLimit: challenge.memoryLimit,
          difficulty: challenge.difficulty,
          allowedLanguages: challenge.allowedLanguages
        })) || [],
        questionCounts: {
          mcq: test.mcqs?.length || 0,
          coding: test.codingChallenges?.length || 0
        },
        instructions: test.instructions,
        proctoring: test.proctoring,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt,
        // Add submission data if available
        submission: submission ? {
          score: submission.score,
          status: submission.status,
          submittedAt: submission.submittedAt,
          hasSubmission: true
        } : {
          hasSubmission: false
        }
      };
    }));

    res.json(transformedTests);
  } catch (error) {
    console.error('Error in getTests:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('vendor', 'name email')
      .lean();
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Simplified access control:
    // - Admin can access all tests
    // - Vendor can access their own tests
    // - Regular users can only access published tests
    if (!req.user.isAdmin && 
        test.vendor._id.toString() !== req.user._id.toString() && 
        test.status === 'draft') {
      return res.status(403).json({ error: "Not authorized to access this test" });
    }

    res.json(test);
  } catch (error) {
    // Improve error handling
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid test ID format" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update test
export const updateTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this test" });
    }

    const {
      title,
      description,
      duration,
      proctoring,
      instructions,
      status,
      mcqs,
      codingChallenges,
      timeLimit,
      totalMarks
    } = req.body;

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = duration;
    if (proctoring !== undefined) updateData.proctoring = proctoring;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (status !== undefined) updateData.status = status;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (totalMarks !== undefined) updateData.totalMarks = totalMarks;

    // Validate and update MCQs
    if (mcqs !== undefined) {
      for (const mcq of mcqs) {
        if (!mcq.question || !mcq.options || !mcq.correctOptions || 
            !mcq.answerType || !mcq.marks || !mcq.difficulty) {
          return res.status(400).json({
            error: "Invalid MCQ format"
          });
        }
      }
      updateData.mcqs = mcqs;
    }

    // Validate and update coding challenges
    if (codingChallenges !== undefined) {
      for (const challenge of codingChallenges) {
        if (!challenge.title || !challenge.description || !challenge.problemStatement || 
            !challenge.constraints || !challenge.allowedLanguages || 
            !challenge.languageImplementations || !challenge.marks || 
            !challenge.timeLimit || !challenge.memoryLimit || !challenge.difficulty) {
          return res.status(400).json({
            error: "Invalid coding challenge format"
          });
        }

        // Validate language implementations
        for (const [lang, impl] of Object.entries(challenge.languageImplementations)) {
          if (!impl.visibleCode || !impl.invisibleCode) {
            return res.status(400).json({
              error: `Both visibleCode and invisibleCode are required for language: ${lang}`
            });
          }
        }
      }
      updateData.codingChallenges = codingChallenges;
    }

    // Update test and recalculate total marks if necessary
    if (mcqs || codingChallenges) {
      const totalMcqMarks = (mcqs || test.mcqs).reduce((sum, mcq) => sum + mcq.marks, 0);
      const totalCodingMarks = (codingChallenges || test.codingChallenges)
        .reduce((sum, challenge) => sum + challenge.marks, 0);
      updateData.totalMarks = totalMcqMarks + totalCodingMarks;
      updateData.passingMarks = Math.ceil(updateData.totalMarks * 0.4);
    }

    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(updatedTest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete test
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check if user owns this test
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this test" });
    }

    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: "Test deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const shareTest = async (req, res) => {
  try {
    const { emails, validUntil, maxAttempts } = req.body;
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Generate invitations for each email
    const invitations = await Promise.all(
      emails.map(async (email) => {
        const token = crypto.randomBytes(32).toString('hex');
        const invitation = await TestInvitation.create({
          test: test._id,
          email,
          token,
          validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          maxAttempts: maxAttempts || 1
        });

        // Generate individual shareable link
        invitation.shareableLink = `${process.env.FRONTEND_URL}/test/take/${test._id}?invitation=${token}`;
        return invitation;
      })
    );

    // Send emails with the shareable links
    // TODO: Implement email sending logic

    res.json({
      message: "Test shared successfully",
      invitations: invitations.map(inv => ({
        email: inv.email,
        shareableLink: inv.shareableLink,
        validUntil: inv.validUntil,
        maxAttempts: inv.maxAttempts
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add single or multiple MCQs to a test
export const addMCQs = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Handle both single MCQ and array of MCQs
    const mcqsToAdd = Array.isArray(req.body) ? req.body : [req.body];

    // Validate MCQs
    for (const mcq of mcqsToAdd) {
      if (!mcq.question || !mcq.options || !mcq.correctOptions || 
          !mcq.answerType || !mcq.marks || !mcq.difficulty) {
        return res.status(400).json({
          error: "Each MCQ must have question, options, correctOptions, answerType, marks, and difficulty"
        });
      }

      // Validate single answer type
      if (mcq.answerType === 'single' && mcq.correctOptions.length !== 1) {
        return res.status(400).json({
          error: "Single answer questions must have exactly one correct option"
        });
      }
    }

    // Add MCQs to test
    test.mcqs.push(...mcqsToAdd);
    
    // Recalculate total marks
    test.totalMarks = (test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) || 0) + 
                      (test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0) || 0);
    test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    
    await test.save();
    
    res.status(201).json({
      message: "MCQs added successfully",
      test,
      addedMCQs: mcqsToAdd
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update MCQ
export const updateMCQ = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const mcqIndex = test.mcqs.findIndex(
      mcq => mcq._id.toString() === req.params.mcqId
    );

    if (mcqIndex === -1) {
      return res.status(404).json({ error: "MCQ not found" });
    }

    // Validate the updated MCQ data
    const updatedMCQ = { ...test.mcqs[mcqIndex].toObject(), ...req.body };
    
    if (updatedMCQ.answerType === 'single' && updatedMCQ.correctOptions?.length !== 1) {
      return res.status(400).json({
        error: "Single answer questions must have exactly one correct option"
      });
    }

    // Update only the provided fields
    test.mcqs[mcqIndex] = updatedMCQ;
    
    // Recalculate total marks if marks were updated
    if (req.body.marks) {
      test.totalMarks = test.mcqs.reduce((sum, mcq) => sum + mcq.marks, 0) +
                       (test.codingChallenges?.reduce((sum, ch) => sum + ch.marks, 0) || 0);
      test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    }

    await test.save();
    
    res.json({
      message: "MCQ updated successfully",
      updatedMCQ: test.mcqs[mcqIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete MCQ
export const deleteMCQ = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    test.mcqs = test.mcqs.filter(
      mcq => mcq._id.toString() !== req.params.mcqId
    );
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add single or multiple coding challenges to a test
export const addCodingChallenges = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Handle both single challenge and array of challenges
    const challengesToAdd = Array.isArray(req.body) ? req.body : [req.body];

    // Validate coding challenges
    for (const challenge of challengesToAdd) {
      const missingFields = [];
      const requiredFields = [
        'title', 'description', 'constraints', 'allowedLanguages',
        'marks', 'timeLimit', 'memoryLimit', 'difficulty'
      ];

      for (const field of requiredFields) {
        if (!challenge[field]) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: "Missing required fields",
          missingFields,
          receivedChallenge: challenge
        });
      }

      // Validate allowed languages array
      if (!Array.isArray(challenge.allowedLanguages) || challenge.allowedLanguages.length === 0) {
        return res.status(400).json({
          error: "At least one programming language must be allowed",
          receivedLanguages: challenge.allowedLanguages
        });
      }

      // Validate difficulty enum
      if (!['easy', 'medium', 'hard'].includes(challenge.difficulty)) {
        return res.status(400).json({
          error: "Invalid difficulty level. Must be 'easy', 'medium', or 'hard'",
          receivedDifficulty: challenge.difficulty
        });
      }

      // Validate numeric fields
      if (typeof challenge.marks !== 'number' || challenge.marks <= 0) {
        return res.status(400).json({
          error: "Marks must be a positive number",
          receivedMarks: challenge.marks
        });
      }

      if (typeof challenge.timeLimit !== 'number' || challenge.timeLimit <= 0) {
        return res.status(400).json({
          error: "Time limit must be a positive number",
          receivedTimeLimit: challenge.timeLimit
        });
      }

      if (typeof challenge.memoryLimit !== 'number' || challenge.memoryLimit <= 0) {
        return res.status(400).json({
          error: "Memory limit must be a positive number",
          receivedMemoryLimit: challenge.memoryLimit
        });
      }
    }

    // Add coding challenges to test
    test.codingChallenges.push(...challengesToAdd);
    
    // Recalculate total marks
    test.totalMarks = (test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) || 0) + 
                      (test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0) || 0);
    test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    
    await test.save();
    
    res.status(201).json({
      message: `Successfully added ${challengesToAdd.length} coding challenge(s)`,
      test,
      addedChallenges: challengesToAdd.map(c => ({
        id: c._id,
        title: c.title,
        marks: c.marks
      }))
    });
  } catch (error) {
    // Improved error handling
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

// Update Coding Challenge
export const updateCodingChallenge = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const challengeIndex = test.codingChallenges.findIndex(
      challenge => challenge._id.toString() === req.params.challengeId
    );

    if (challengeIndex === -1) {
      return res.status(404).json({ error: "Coding challenge not found" });
    }

    const { 
      title, 
      description, 
      problemStatement,
      constraints,
      allowedLanguages,
      languageImplementations,
      testCases,
      marks,
      timeLimit,
      memoryLimit,
      difficulty,
      tags 
    } = req.body;

    // Validate language implementations if provided
    if (languageImplementations) {
      for (const [lang, impl] of Object.entries(languageImplementations)) {
        if (!impl.visibleCode || !impl.invisibleCode) {
          return res.status(400).json({
            error: `Both visibleCode and invisibleCode are required for language: ${lang}`
          });
        }
      }
    }

    // Update the challenge with new data
    const updatedChallenge = {
      ...test.codingChallenges[challengeIndex].toObject(),
      ...(title && { title }),
      ...(description && { description }),
      ...(problemStatement && { problemStatement }),
      ...(constraints && { constraints }),
      ...(allowedLanguages && { allowedLanguages }),
      ...(languageImplementations && { languageImplementations }),
      ...(testCases && { testCases }),
      ...(marks && { marks }),
      ...(timeLimit && { timeLimit }),
      ...(memoryLimit && { memoryLimit }),
      ...(difficulty && { difficulty }),
      ...(tags && { tags })
    };

    test.codingChallenges[challengeIndex] = updatedChallenge;
    
    // Recalculate total marks if marks were updated
    if (marks) {
      test.totalMarks = (test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) || 0) +
                       test.codingChallenges.reduce((sum, ch) => sum + ch.marks, 0);
      test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    }

    await test.save();
    
    res.json({
      message: "Coding challenge updated successfully",
      updatedChallenge: test.codingChallenges[challengeIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Coding Challenge
export const deleteCodingChallenge = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    test.codingChallenges = test.codingChallenges.filter(
      challenge => challenge._id.toString() !== req.params.challengeId
    );
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Publish Test
export const publishTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Validate test has required components
    if (!test.mcqs || test.mcqs.length === 0) {
      return res.status(400).json({ 
        error: "Test must have at least one MCQ question" 
      });
    }

    if (!test.codingChallenges || test.codingChallenges.length === 0) {
      return res.status(400).json({ 
        error: "Test must have at least one coding challenge" 
      });
    }

    // Update test status and add publishing details
    test.status = 'published';
    test.publishedAt = new Date();

    await test.save();

    // Generate shareable link with just the UUID
    const shareableLink = `${process.env.FRONTEND_URL}/test/shared/${test.uuid}`;

    res.json({
      message: "Test published successfully",
      test: {
        _id: test._id,
        title: test.title,
        publishedAt: test.publishedAt,
        accessControl: test.accessControl?.type || 'private'
      },
      shareableLink
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add Test Case
export const addTestCase = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const challenge = test.codingChallenges.id(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Coding challenge not found" });
    }

    challenge.testCases.push(req.body);
    await test.save();
    
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Test Case
export const updateTestCase = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const challenge = test.codingChallenges.id(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Coding challenge not found" });
    }

    const testCaseIndex = challenge.testCases.findIndex(
      tc => tc._id.toString() === req.params.testCaseId
    );

    if (testCaseIndex === -1) {
      return res.status(404).json({ error: "Test case not found" });
    }

    challenge.testCases[testCaseIndex] = {
      ...challenge.testCases[testCaseIndex],
      ...req.body
    };
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Test Case
export const deleteTestCase = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const challenge = test.codingChallenges.id(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Coding challenge not found" });
    }

    challenge.testCases = challenge.testCases.filter(
      tc => tc._id.toString() !== req.params.testCaseId
    );
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Test Session Management Functions
export const startTestSession = async (req, res) => {
  try {
    const { testId } = req.body;
    
    // Check if there's already an active session
    const existingSession = await TestSession.findOne({
      test: testId,
      user: req.user._id,
      status: { $in: ['started', 'in_progress'] }
    });

    if (existingSession) {
      return res.status(400).json({
        error: "Active session already exists",
        sessionId: existingSession._id
      });
    }

    // Create new session
    const session = await TestSession.create({
      test: testId,
      user: req.user._id,
      startTime: new Date(),
      status: 'started',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      browserSwitches: 0,
      currentQuestion: 0
    });

    res.status(201).json({
      message: "Test session started successfully",
      sessionId: session._id,
      startTime: session.startTime,
      status: session.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const endTestSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body; // Optional reason for ending session

    const session = await TestSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: "Test session not found" });
    }

    // Verify the session belongs to the current user
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to end this session" });
    }

    // Update session status
    session.endTime = new Date();
    session.status = 'completed';
    if (reason) {
      session.proctorNotes.push({
        note: `Session ended: ${reason}`,
        timestamp: new Date()
      });
    }

    await session.save();

    res.json({
      message: "Test session ended successfully",
      sessionId: session._id,
      duration: session.endTime - session.startTime,
      status: session.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyTestInvitation = async (req, res) => {
  try {
    const { token } = req.body;

    const invitation = await TestInvitation.findOne({ token })
      .populate('test')
      .populate('vendor', 'name email');

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid invitation token' });
    }

    // Check if invitation has expired
    if (invitation.validUntil < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if maximum attempts reached
    if (invitation.attemptsUsed >= invitation.maxAttempts) {
      return res.status(400).json({ error: 'Maximum attempts reached' });
    }

    // Check if test is still published
    if (!invitation.test || invitation.test.isDraft) {
      return res.status(400).json({ error: 'Test is no longer available' });
    }

    // Return test details with invitation info
    res.json({
      invitation: {
        id: invitation._id,
        email: invitation.email,
        validUntil: invitation.validUntil,
        attemptsLeft: invitation.maxAttempts - invitation.attemptsUsed,
        status: invitation.status
      },
      test: {
        id: invitation.test._id,
        title: invitation.test.title,
        description: invitation.test.description,
        duration: invitation.test.duration,
        totalMarks: invitation.test.totalMarks,
        vendor: {
          name: invitation.vendor.name,
          email: invitation.vendor.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptTestInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const invitation = await TestInvitation.findOne({ token });

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid invitation token' });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.attemptsUsed += 1;
    invitation.lastAttemptAt = new Date();
    await invitation.save();

    // Create test session
    const session = await TestSession.create({
      test: invitation.test,
      user: req.user._id,
      startTime: new Date(),
      status: 'started',
      invitation: invitation._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Invitation accepted successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendTestInvitations = async (req, res) => {
  try {
    const { testId } = req.params;
    const { candidates, validUntil, maxAttempts } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Create invitations for each candidate
    const invitations = await Promise.all(
      candidates.map(async (candidate) => {
        const token = crypto.randomBytes(32).toString('hex');
        const invitation = await TestInvitation.create({
          test: test._id,
          vendor: req.user._id,
          email: candidate.email,
          name: candidate.name,
          token,
          validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          maxAttempts: maxAttempts || 1,
          shareableLink: `${process.env.FRONTEND_URL}/test/take/${test._id}?token=${token}`
        });

        // TODO: Send email to candidate
        // await sendInvitationEmail(invitation);

        return invitation;
      })
    );

    res.json({
      message: 'Invitations sent successfully',
      invitations: invitations.map(inv => ({
        id: inv._id,
        email: inv.email,
        name: inv.name,
        shareableLink: inv.shareableLink,
        validUntil: inv.validUntil,
        maxAttempts: inv.maxAttempts
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestInvitations = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const invitations = await TestInvitation.find({
      test: testId,
      vendor: req.user._id
    }).sort({ createdAt: -1 });

    res.json(invitations.map(inv => ({
      id: inv._id,
      email: inv.email,
      name: inv.name,
      status: inv.status,
      validUntil: inv.validUntil,
      maxAttempts: inv.maxAttempts,
      attemptsUsed: inv.attemptsUsed,
      lastAttemptAt: inv.lastAttemptAt,
      shareableLink: inv.shareableLink
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestByUuid = async (req, res) => {
  try {
    console.log('UUID received:', req.params.uuid); // Add logging for debugging

    const test = await Test.findOne({ uuid: req.params.uuid });
    
    if (!test) {
      console.log('Test not found for UUID:', req.params.uuid); // Add logging
      return res.status(404).json({ 
        error: "Test not found",
        uuid: req.params.uuid 
      });
    }

    // Generate shareable link
    const shareableLink = `${process.env.FRONTEND_URL}/test/take/${test.uuid}`;

    // If test is private, include the sharing token
    const finalLink = test.accessControl?.type === 'private' 
      ? `${shareableLink}?token=${test.sharingToken}`
      : shareableLink;

    console.log('Sending response with link:', finalLink); // Add logging

    res.json({
      message: "Test link generated successfully",
      test: {
        id: test._id,
        title: test.title,
        type: test.type,
        accessControl: test.accessControl?.type || 'private',
        duration: test.duration,
        totalMarks: test.totalMarks
      },
      shareableLink: finalLink
    });

  } catch (error) {
    console.error('Error in getTestByUuid:', error); // Add logging
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message,
      uuid: req.params.uuid
    });
  }
};

// Test Completion Rate
export const getTestCompletionRate = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      query['test.vendor'] = req.user._id;
    }

    const stats = await TestSession.aggregate([
      {
        $lookup: {
          from: 'tests',
          localField: 'test',
          foreignField: '_id',
          as: 'test'
        }
      },
      { $unwind: '$test' },
      { $match: query },
      {
        $group: {
          _id: '$test._id',
          testTitle: { $first: '$test.title' },
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          testTitle: 1,
          totalSessions: 1,
          completedSessions: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedSessions', '$totalSessions'] },
              100
            ]
          }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Average Score Analytics
export const getAverageScores = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      query['test.vendor'] = req.user._id;
    }

    const stats = await TestResult.aggregate([
      {
        $lookup: {
          from: 'tests',
          localField: 'test',
          foreignField: '_id',
          as: 'test'
        }
      },
      { $unwind: '$test' },
      { $match: query },
      {
        $group: {
          _id: '$test._id',
          testTitle: { $first: '$test.title' },
          totalScores: { $sum: 1 },
          totalScore: { $sum: '$score' },
          averageScore: { $avg: '$score' }
        }
      },
      {
        $project: {
          testTitle: 1,
          totalScores: 1,
          totalScore: 1,
          averageScore: 1
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update coding challenge languages
export const updateCodingChallenges = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update each coding challenge with default allowed languages
    test.codingChallenges = test.codingChallenges.map(challenge => ({
      ...challenge,
      allowedLanguages: ['javascript', 'python', 'java'] // Add default languages
    }));

    await test.save();
    
    res.json({
      message: "Coding challenges updated successfully",
      test
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update test access control
export const updateTestAccess = async (req, res) => {
  try {
    const { testId } = req.params;
    const { type, userLimit, allowedUsers } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Validate user limit
    if (type === 'private' && userLimit > 0 && allowedUsers?.length > userLimit) {
      return res.status(400).json({ 
        error: "Number of allowed users exceeds the user limit" 
      });
    }

    // Update access control
    test.accessControl = {
      type: type || test.accessControl.type,
      userLimit: userLimit ?? test.accessControl.userLimit,
      allowedUsers: allowedUsers || test.accessControl.allowedUsers,
      currentUserCount: allowedUsers ? allowedUsers.length : test.accessControl.currentUserCount
    };

    await test.save();

    res.json({
      message: "Test access control updated successfully",
      accessControl: test.accessControl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add allowed users to test
export const addAllowedUsers = async (req, res) => {
  try {
    const { testId } = req.params;
    const { userIds } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Check if test is private
    if (test.accessControl.type !== 'private') {
      return res.status(400).json({ 
        error: "Cannot add allowed users to public test" 
      });
    }

    // Check user limit
    const newUserCount = test.accessControl.currentUserCount + userIds.length;
    if (newUserCount > test.accessControl.userLimit) {
      return res.status(400).json({ 
        error: "Number of allowed users exceeds the user limit" 
      });
    }

    // Add allowed users to test
    test.accessControl.allowedUsers.push(...userIds);
    test.accessControl.currentUserCount = newUserCount;

    await test.save();

    res.json({
      message: "Allowed users added successfully",
      accessControl: test.accessControl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove allowed users from test
export const removeAllowedUsers = async (req, res) => {
  try {
    const { testId } = req.params;
    const { userIds } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Remove users
    test.accessControl.allowedUsers = test.accessControl.allowedUsers.filter(
      id => !userIds.includes(id.toString())
    );
    test.accessControl.currentUserCount = test.accessControl.allowedUsers.length;

    await test.save();

    res.json({
      message: "Users removed successfully",
      accessControl: test.accessControl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get practice tests
export const getPracticeTests = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    
    // Build query
    const query = {
      type: 'practice',
      status: 'published',
      $or: [
        { 'accessControl.type': 'public' },
        { 
          'accessControl.type': 'private',
          'accessControl.allowedUsers': req.user._id 
        }
      ]
    };

    // Add optional filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const practiceTests = await Test.find(query)
      .select('title description category difficulty duration totalMarks')
      .populate('vendor', 'name')
      .sort({ difficulty: 1, category: 1 });

    res.json(practiceTests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTestVisibility = async (req, res) => {
  try {
    const { testId } = req.params;
    const { visibility } = req.body;

    // Add 'practice' as a valid visibility type
    if (!['public', 'private', 'practice'].includes(visibility)) {
      return res.status(400).json({ 
        error: "Visibility must be either 'public', 'private', or 'practice'" 
      });
    }

    // First update the test
    const test = await Test.findOneAndUpdate(
      { _id: testId },
      {
        $set: {
          'accessControl.type': visibility,
          type: visibility === 'practice' ? 'practice' : 'assessment'
        }
      },
      { new: true }
    );
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (req.user.role === 'vendor' && 
        test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: "Not authorized to change this test's visibility" 
      });
    }

    // Update all existing registrations for this test
    await TestRegistration.updateMany(
      { test: testId },
      { 
        $set: { 
          testType: visibility,
          registrationType: visibility === 'practice' ? 'practice' : 'assessment'
        }
      }
    );

    res.json({
      message: "Test visibility and registrations updated successfully",
      visibility: test.accessControl.type,
      type: test.type
    });
  } catch (error) {
    console.error('Error updating test visibility:', error);
    res.status(500).json({ 
      error: "Failed to update test visibility",
      message: error.message 
    });
  }
};

export const updateTestType = async (req, res) => {
  try {
    const { testId } = req.params;
    const { type } = req.body;

    if (!['assessment', 'practice'].includes(type)) {
      return res.status(400).json({ 
        error: "Type must be either 'assessment' or 'practice'" 
      });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization for vendors
    if (req.user.role === 'vendor' && 
        test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    test.type = type;
    await test.save();

    res.json({
      message: "Test type updated successfully",
      type: test.type
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all public tests with filtering and pagination
 */
export const getPublicTests = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty, type, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {
      status: 'published',
      'accessControl.type': 'public'  // Changed from $or to direct match
    };

    // Add optional filters
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Test.countDocuments(filter);

    // Get filtered and paginated tests
    const tests = await Test.find(filter)
      .select('-mcqs.correctOptions -codingChallenges.testCases')  // Exclude sensitive data
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform the response
    const transformedTests = tests.map(test => ({
      _id: test._id,
      title: test.title,
      description: test.description,
      category: test.category,
      difficulty: test.difficulty,
      duration: test.duration,
      totalMarks: test.totalMarks,
      type: test.type,
      vendor: {
        name: test.vendor?.name,
        email: test.vendor?.email
      },
      questionCounts: {
        mcq: test.mcqs?.length || 0,
        coding: test.codingChallenges?.length || 0
      },
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    }));

    // Calculate total pages
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      tests: transformedTests,
      pagination: {
        total,
        page: parseInt(page),
        pages,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting public tests:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

export const registerForTest = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { token } = req.body;
    
    const test = await Test.findOne({ uuid });
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Allow vendor to register for their own test
    const isVendor = test.vendor.toString() === req.user._id.toString();

    // Verify access for non-vendors
    if (test.accessControl.type === 'private' && !isVendor) {
      if (!token || token !== test.sharingToken) {
        return res.status(403).json({ message: 'Invalid access token' });
      }
    }

    // Check for existing registration
    const existingRegistration = await TestRegistration.findOne({
      test: test._id,
      user: req.user._id
    });

    if (existingRegistration) {
      return res.status(200).json({
        message: 'User has already registered for this test',
        registration: {
          registeredAt: existingRegistration.createdAt,
          status: existingRegistration.status,
          testType: existingRegistration.testType,
          registrationType: existingRegistration.registrationType
        }
      });
    }

    // Create test session
    const session = await TestSession.create({
      test: test._id,
      user: req.user._id,
      status: 'started',
      isVendorAttempt: isVendor
    });

    // Create test registration
    await TestRegistration.create({
      test: test._id,
      user: req.user._id,
      testType: test.accessControl.type,
      registrationType: test.type,
      status: 'registered',
      isVendorAttempt: isVendor
    });

    res.json({
      message: 'Successfully registered for test',
      sessionId: session._id,
      uuid: test.uuid
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update session status (for monitoring)
export const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { event, details } = req.body;

    const session = await TestSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Update based on event type
    switch (event) {
      case 'browser_switch':
        session.browserSwitches += 1;
        session.proctorNotes.push({
          note: 'Browser switch detected',
          timestamp: new Date()
        });
        break;
      case 'tab_switch':
        session.tabSwitches += 1;
        session.proctorNotes.push({
          note: 'Tab switch detected',
          timestamp: new Date()
        });
        break;
      case 'question_update':
        session.currentQuestion = details.questionNumber;
        break;
      // Add more event types as needed
    }

    session.status = 'in_progress';
    await session.save();

    res.json({
      message: "Session status updated",
      status: session.status,
      browserSwitches: session.browserSwitches,
      tabSwitches: session.tabSwitches,
      currentQuestion: session.currentQuestion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new endpoint specifically for user submissions
export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user has permission to access these submissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to access these submissions' });
    }

    // Get all submissions for the user
    const submissions = await Submission.find({ user: userId })
      .populate({
        path: 'test',
        select: 'title type category difficulty totalMarks passingMarks'
      })
      .sort({ submittedAt: -1 })
      .lean();

    // Separate MCQ and Coding submissions
    const transformedSubmissions = {
      mcq: submissions.filter(sub => sub.mcqAnswers?.length > 0).map(sub => ({
        testId: sub.test._id,
        testTitle: sub.test.title,
        type: sub.test.type,
        category: sub.test.category,
        difficulty: sub.test.difficulty,
        score: sub.score,
        totalMarks: sub.test.totalMarks,
        passingMarks: sub.test.passingMarks,
        status: sub.status,
        submittedAt: sub.submittedAt,
        answers: sub.mcqAnswers
      })),
      coding: submissions.filter(sub => sub.codingAnswers?.length > 0).map(sub => ({
        testId: sub.test._id,
        testTitle: sub.test.title,
        type: sub.test.type,
        category: sub.test.category,
        difficulty: sub.test.difficulty,
        score: sub.score,
        totalMarks: sub.test.totalMarks,
        passingMarks: sub.test.passingMarks,
        status: sub.status,
        submittedAt: sub.submittedAt,
        solutions: sub.codingAnswers
      }))
    };

    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error in getUserSubmissions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch submissions',
      message: error.message 
    });
  }
};

// Add this new controller function
export const verifyTestByUuid = async (req, res) => {
  try {
    console.log('Verifying test with UUID:', req.params.uuid); // Debug log

    const test = await Test.findOne({ uuid: req.params.uuid })
      .select('_id uuid title description duration type category difficulty totalMarks status accessControl vendor')
      .populate('vendor', 'name email')
      .lean();

    if (!test) {
      console.log('Test not found for UUID:', req.params.uuid); // Debug log
      return res.status(404).json({ 
        message: 'Test not found',
        uuid: req.params.uuid 
      });
    }

    console.log('Found test:', test); // Debug log

    const response = {
      test: {
        _id: test._id.toString(),
        uuid: test.uuid,
        title: test.title,
        description: test.description,
        duration: test.duration,
        type: test.type,
        category: test.category,
        difficulty: test.difficulty,
        totalMarks: test.totalMarks,
        accessControl: test.accessControl?.type || 'public',
        vendor: {
          name: test.vendor?.name || 'Anonymous',
          email: test.vendor?.email
        }
      }
    };

    console.log('Sending response:', response); // Debug log
    res.json(response);

  } catch (error) {
    console.error('Error in verifyTestByUuid:', error);
    res.status(500).json({ 
      message: 'Error verifying test',
      error: error.message,
      uuid: req.params.uuid
    });
  }
};

export const checkTestRegistration = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const test = await Test.findOne({ uuid })
      .populate('vendor', 'name email')
      .populate('accessControl.allowedUsers');
    
    if (!test) {
      return res.status(200).json({ 
        message: 'Test not found',
        canRegister: false,
        uuid
      });
    }

    // Check various authorization conditions
    const isAdmin = req.user.role === 'admin';
    const isVendor = test.vendor._id.toString() === req.user._id.toString();
    const isPublic = test.accessControl.type === 'public';
    const isAllowedUser = test.accessControl.allowedUsers?.some(
      user => user._id.toString() === req.user._id.toString()
    );

    // Check existing registration and update if needed
    const existingRegistration = await TestRegistration.findOne({
      test: test._id,
      user: req.user._id
    });

    // If registration exists, update it to match current test settings
    if (existingRegistration) {
      existingRegistration.testType = test.accessControl.type;
      existingRegistration.registrationType = test.type;
      await existingRegistration.save();
    }

    // Determine if user can register
    let canRegister = false;
    let message = '';
    let registrationStatus = null;

    if (existingRegistration) {
      canRegister = false;
      message = 'User has already registered for this test';
      registrationStatus = {
        registeredAt: existingRegistration.createdAt,
        status: existingRegistration.status,
        testType: existingRegistration.testType,
        registrationType: existingRegistration.registrationType
      };
    } else if (isAdmin) {
      canRegister = true;
      message = 'Admin has access to all tests';
    } else if (isVendor) {
      canRegister = true;
      message = 'Vendor can access their own test';
    } else if (isPublic) {
      canRegister = true;
      message = 'Test is public and available for all users';
    } else if (isAllowedUser) {
      canRegister = true;
      message = 'User is in the allowed users list';
    } else {
      message = 'User is not authorized to register for this test';
    }

    const response = {
      canRegister,
      message,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      test: {
        id: test._id,
        uuid: test.uuid,
        title: test.title,
        type: test.type,
        duration: test.duration,
        totalMarks: test.totalMarks,
        accessControl: test.accessControl.type,
        vendor: {
          id: test.vendor._id,
          name: test.vendor.name,
          email: test.vendor.email
        }
      }
    };

    // Add registration status if it exists
    if (registrationStatus) {
      response.registration = registrationStatus;
    }

    // Always return 200 status code
    res.status(200).json(response);

  } catch (error) {
    console.error('Error in checkTestRegistration:', error);
    res.status(500).json({ 
      message: 'Error checking test registration',
      error: error.message,
      canRegister: false,
      uuid: req.params.uuid
    });
  }
};


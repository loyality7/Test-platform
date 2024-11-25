import Test from "../models/test.model.js";
import TestSession from "../models/testSession.model.js";
import TestResult from "../models/testResult.model.js";
import TestInvitation from "../models/testInvitation.model.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import TestRegistration from "../models/testRegistration.model.js";
import Submission from '../models/submission.model.js';
import { LANGUAGE_IDS } from '../constants/languages.js';

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

    // Validate coding challenges and convert language IDs to names
    for (const challenge of codingChallenges) {
      // Validate allowedLanguages exists and is an array
      if (!Array.isArray(challenge.allowedLanguages) || challenge.allowedLanguages.length === 0) {
        return res.status(400).json({
          error: "At least one programming language must be allowed",
          receivedLanguages: challenge.allowedLanguages
        });
      }

      // Convert language IDs to names
      challenge.allowedLanguages = challenge.allowedLanguages.map(langId => {
        const language = Object.entries(LANGUAGE_IDS).find(([_, id]) => id === langId);
        if (!language) {
          throw new Error(`Invalid language ID: ${langId}`);
        }
        return language[0].toLowerCase(); // Return the language name in lowercase
      });

      if (!challenge.title || !challenge.description || !challenge.problemStatement || 
          !challenge.constraints || !challenge.allowedLanguages || 
          !challenge.languageImplementations || !challenge.marks || 
          !challenge.timeLimit || !challenge.memoryLimit || !challenge.difficulty) {
        return res.status(400).json({
          error: "Missing required fields in coding challenge"
        });
      }

      // Map allowed languages to Judge0 IDs
      challenge.allowedLanguages = challenge.allowedLanguages.map(lang => {
        const langId = LANGUAGE_IDS[lang.toLowerCase()];
        if (!langId) {
          throw new Error(`Unsupported language: ${lang}`);
        }
        return langId;
      });

      // Map language implementations to use Judge0 IDs as keys
      const mappedImplementations = {};
      for (const [lang, impl] of Object.entries(challenge.languageImplementations)) {
        const langId = LANGUAGE_IDS[lang.toLowerCase()];
        if (!langId) {
          throw new Error(`Unsupported language in implementations: ${lang}`);
        }
        if (!impl.visibleCode || !impl.invisibleCode) {
          throw new Error(`Both visibleCode and invisibleCode are required for language: ${lang}`);
        }
        mappedImplementations[langId] = impl;
      }
      challenge.languageImplementations = mappedImplementations;

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
    res.status(500).json({ 
      error: error.message,
      details: "Failed to create test with language mappings"
    });
  }
};

export const getTests = async (req, res) => {
  try {
    let query = { status: 'published' };
    
    // If user is authenticated
    if (req.user) {
      if (req.user.role === 'user') {
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

    // Create a reverse mapping of language IDs to names
    const LANGUAGE_NAMES = Object.entries(LANGUAGE_IDS).reduce((acc, [name, id]) => {
      acc[id] = name;
      return acc;
    }, {});

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
          // Map language IDs back to names
          allowedLanguages: challenge.allowedLanguages?.map(langId => 
            LANGUAGE_NAMES[langId] || langId
          )
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
    test.totalMarks = (test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) || 0)  + 
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

    // Convert language IDs to names for each challenge
    for (const challenge of challengesToAdd) {
      if (Array.isArray(challenge.allowedLanguages)) {
        challenge.allowedLanguages = challenge.allowedLanguages.map(langId => {
          const language = Object.entries(LANGUAGE_IDS).find(([_, id]) => id === langId);
          if (!language) {
            throw new Error(`Invalid language ID: ${langId}`);
          }
          return language[0].toLowerCase(); // Return the language name in lowercase
        });
      }
    }

    // Add coding challenges to test
    test.codingChallenges.push(...challengesToAdd);
    
    // Recalculate total marks
    test.totalMarks = test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) + 
                      test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0);
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
                       (test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0) || 0);
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
    const { uuid } = req.params;
    const { deviceInfo } = req.body;

    // Find test by UUID
    const test = await Test.findOne({ uuid });
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check for existing session
    const existingSession = await TestSession.findOne({
      test: test._id,
      user: req.user._id,
      status: 'active'
    });

    if (existingSession) {
      // Calculate if existing session has expired
      const timeElapsed = Date.now() - existingSession.startTime;
      const timeLimit = test.timeLimit * 60 * 1000; // Convert minutes to milliseconds

      if (timeElapsed > timeLimit) {
        // Update session to completed if expired
        existingSession.status = 'completed';
        existingSession.endTime = new Date(existingSession.startTime.getTime() + timeLimit);
        await existingSession.save();

        return res.status(400).json({
          message: 'Previous session has expired',
          session: {
            status: 'completed',
            reason: 'timeout'
          }
        });
      }

      return res.status(200).json({
        message: 'Existing session found',
        session: existingSession
      });
    }

    // Create new session with duration from test
    const session = await TestSession.create({
      test: test._id,
      user: req.user._id,
      startTime: new Date(),
      duration: test.timeLimit, // Set duration from test timeLimit
      status: 'active',
      deviceInfo: {
        userAgent: deviceInfo?.userAgent,
        platform: deviceInfo?.platform,
        screenResolution: deviceInfo?.screenResolution,
        language: deviceInfo?.language,
        ip: req.ip
      }
    });

    return res.status(201).json({
      message: 'Session created successfully',
      session: {
        _id: session._id,
        startTime: session.startTime,
        duration: session.duration,
        status: session.status,
        timeLimit: test.timeLimit * 60 * 1000 // Send timeLimit in milliseconds
      }
    });

  } catch (error) {
    console.error('Error in startTestSession:', error);
    return res.status(500).json({
      message: 'Error creating test session',
      error: error.message
    });
  }
};

export const endTestSession = async (req, res) => {
  try {
    const { uuid, sessionId } = req.params;

    const session = await TestSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    res.json({
      message: 'Session ended successfully',
      session: {
        _id: session._id,
        status: session.status,
        endTime: session.endTime
      }
    });

  } catch (error) {
    console.error('Error in endTestSession:', error);
    res.status(500).json({
      message: 'Error ending test session',
      error: error.message
    });
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

export const verifyTestByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const test = await Test.findOne({ uuid })
      .select('title description duration type category totalMarks status') // Select only needed fields
      .populate('vendor', 'name email');
    
    if (!test) {
      return res.status(404).json({
        message: 'Test not found'
      });
    }

    // Return in the expected structure
    return res.status(200).json({
      message: 'Test verified successfully',
      test: {
        uuid: test.uuid,
        title: test.title,
        description: test.description,
        duration: test.duration,
        type: test.type,
        category: test.category,
        totalMarks: test.totalMarks,
        status: test.status,
        vendor: test.vendor
      }
    });

  } catch (error) {
    console.error('Error in verifyTestByUuid:', error);
    return res.status(500).json({
      message: 'Error verifying test',
      error: error.message
    });
  }
};

export const checkTestRegistration = async (req, res) => {
  try {
    const { uuid } = req.params;
    const test = await Test.findOne({ uuid })
      .populate('vendor', 'name email');
    
    if (!test) {
      return res.status(404).json({ 
        message: 'Test not found',
        canAccess: false,
        requiresRegistration: false
      });
    }

    // Check existing registration
    const existingRegistration = await TestRegistration.findOne({
      test: test._id,
      user: req.user._id
    });

    // Get last completed session for assessment tests
    let lastSession = null;
    if (test.type === 'assessment') {
      lastSession = await TestSession.findOne({
        test: test._id,
        user: req.user._id,
        status: 'completed'
      }).sort({ endTime: -1 });
    }

    // First check if user is admin or vendor
    const isAdmin = req.user.role === 'admin';
    const isVendor = test.vendor.toString() === req.user._id.toString();

    if (isAdmin || isVendor) {
      return res.json({
        canAccess: true,
        requiresRegistration: !existingRegistration,
        isRegistered: !!existingRegistration,
        lastSession: lastSession,
        message: 'You have administrative access to this test',
        test: {
          id: test._id,
          uuid: test.uuid,
          title: test.title,
          type: test.type
        }
      });
    }

    // Check visibility and access type
    const isPublic = test.accessControl.type === 'public';
    const isPractice = test.type === 'practice';
    const isAllowed = test.accessControl.allowedUsers?.includes(req.user._id);

    // Determine if user can access based on visibility and type
    const canAccess = isPublic || isPractice || isAllowed;

    if (!canAccess) {
      return res.json({
        canAccess: false,
        requiresRegistration: false,
        isRegistered: !!existingRegistration,
        message: 'You do not have access to this test',
        test: {
          id: test._id,
          uuid: test.uuid,
          title: test.title,
          type: test.type
        }
      });
    }

    // User has access - return appropriate response
    return res.json({
      canAccess: true,
      requiresRegistration: !existingRegistration,
      isRegistered: !!existingRegistration,
      lastSession: lastSession,
      message: lastSession && test.type === 'assessment' ? 
        'You have already completed this assessment' : 
        'You can take this test',
      test: {
        id: test._id,
        uuid: test.uuid,
        title: test.title,
        type: test.type
      }
    });

  } catch (error) {
    console.error('Error in checkTestRegistration:', error);
    res.status(500).json({ 
      message: 'Error checking test access',
      error: error.message
    });
  }
};

export const getTestIdByUuid = async (req, res) => {
  try {
    console.log('UUID received:', req.params.uuid); // Debug log

    const test = await Test.findOne({ uuid: req.params.uuid })
      .select('_id uuid title'); // Only select necessary fields
    
    if (!test) {
      console.log('Test not found for UUID:', req.params.uuid);
      return res.status(404).json({ 
        message: "Test not found",
        uuid: req.params.uuid 
      });
    }

    res.json({
      message: "Test found successfully",
      data: {
        id: test._id,
        uuid: test.uuid,
        title: test.title
      }
    });

  } catch (error) {
    console.error('Error in getTestIdByUuid:', error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      uuid: req.params.uuid
    });
  }
};

export const createTestSession = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { deviceInfo } = req.body;

    // Find test by UUID
    const test = await Test.findOne({ uuid });
    if (!test) {
      return res.status(404).json({ 
        message: 'Test not found',
        uuid 
      });
    }

    // Check for existing active session
    const existingSession = await TestSession.findOne({
      test: test._id,
      user: req.user._id,
      status: { $in: ['started', 'in_progress'] }
    });

    if (existingSession) {
      return res.json({
        message: 'Active session exists',
        session: {
          _id: existingSession._id,
          status: existingSession.status,
          startTime: existingSession.startTime
        }
      });
    }

    // Create new session
    const session = await TestSession.create({
      test: test._id,
      user: req.user._id,
      status: 'started',
      startTime: new Date(),
      deviceInfo,
      browserSwitches: 0,
      tabSwitches: 0
    });

    res.status(201).json({
      message: 'Session created successfully',
      session: {
        _id: session._id,
        status: session.status,
        startTime: session.startTime
      }
    });

  } catch (error) {
    console.error('Error creating test session:', error);
    res.status(500).json({ 
      message: 'Error creating test session',
      error: error.message 
    });
  }
};

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

    // Initialize allowedUsers array if it doesn't exist
    if (!test.accessControl.allowedUsers) {
      test.accessControl.allowedUsers = [];
    }

    // Add new users to allowedUsers array (avoiding duplicates)
    const newUserIds = userIds.filter(
      userId => !test.accessControl.allowedUsers.includes(userId)
    );
    test.accessControl.allowedUsers.push(...newUserIds);

    await test.save();

    res.json({
      message: "Users added successfully",
      addedUsers: newUserIds,
      totalAllowedUsers: test.accessControl.allowedUsers.length
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

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

    // Initialize allowedUsers array if it doesn't exist
    if (!test.accessControl.allowedUsers) {
      test.accessControl.allowedUsers = [];
    }

    // Remove users from allowedUsers array
    const initialLength = test.accessControl.allowedUsers.length;
    test.accessControl.allowedUsers = test.accessControl.allowedUsers.filter(
      userId => !userIds.includes(userId.toString())
    );

    const removedCount = initialLength - test.accessControl.allowedUsers.length;

    await test.save();

    res.json({
      message: "Users removed successfully",
      removedCount,
      remainingUsers: test.accessControl.allowedUsers.length,
      removedUsers: userIds
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

export const getPublicTests = async (req, res) => {
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

    // Get tests with sorting options
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortOrder };

    const tests = await Test.find(query)
      .select('title description duration totalMarks type category difficulty vendor questionCounts createdAt updatedAt')
      .populate('vendor', 'name email')
      .sort(sortOptions)
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
      category: test.category,
      difficulty: test.difficulty,
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
      },
      filters: {
        category: req.query.category,
        difficulty: req.query.difficulty,
        type: req.query.type,
        search: req.query.search
      },
      sorting: {
        field: sortField,
        order: req.query.sortOrder || 'desc'
      }
    });
  } catch (error) {
    console.error('Error fetching public tests:', error);
    res.status(500).json({ 
      message: 'Error fetching public tests', 
      error: error.message 
    });
  }
};

export const getTestByUuid = async (req, res) => {
  try {
    console.log('UUID received:', req.params.uuid);

    const test = await Test.findOne({ uuid: req.params.uuid })
      .select('_id uuid title description duration type category difficulty totalMarks status accessControl vendor codingChallenges')
      .populate('vendor', 'name email')
      .lean();
    
    if (!test) {
      console.log('Test not found for UUID:', req.params.uuid);
      return res.status(404).json({ 
        message: "Test not found",
        uuid: req.params.uuid 
      });
    }

    // Create a reverse mapping of language IDs to names
    const LANGUAGE_NAMES = Object.entries(LANGUAGE_IDS).reduce((acc, [name, id]) => {
      acc[id] = name;
      return acc;
    }, {});

    // Transform coding challenges to use language names
    const transformedChallenges = test.codingChallenges?.map(challenge => ({
      ...challenge,
      allowedLanguages: challenge.allowedLanguages?.map(langId => 
        LANGUAGE_NAMES[langId] || langId
      ),
      languageImplementations: Object.entries(challenge.languageImplementations || {}).reduce((acc, [langId, impl]) => {
        const langName = LANGUAGE_NAMES[langId] || langId;
        acc[langName] = impl;
        return acc;
      }, {})
    }));

    res.json({
      message: "Test found successfully",
      data: {
        _id: test._id,
        uuid: test.uuid,
        title: test.title,
        description: test.description,
        duration: test.duration,
        type: test.type,
        category: test.category,
        difficulty: test.difficulty,
        totalMarks: test.totalMarks,
        status: test.status,
        accessControl: test.accessControl?.type || 'public',
        vendor: {
          name: test.vendor?.name || 'Anonymous',
          email: test.vendor?.email
        },
        codingChallenges: transformedChallenges
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
};

export const getUserSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user._id;

    // Find all submissions for this user and test
    const submissions = await Submission.find({
      test: testId,
      user: userId
    })
    .populate('test', 'title duration totalMarks passingMarks')
    .sort({ submittedAt: -1 })
    .lean();

    if (!submissions || submissions.length === 0) {
      return res.json({
        message: "No submissions found",
        submissions: []
      });
    }

    // Transform submissions data
    const transformedSubmissions = submissions.map(submission => ({
      _id: submission._id,
      test: {
        _id: submission.test._id,
        title: submission.test.title,
        duration: submission.test.duration,
        totalMarks: submission.test.totalMarks,
        passingMarks: submission.test.passingMarks
      },
      score: submission.score,
      status: submission.status,
      submittedAt: submission.submittedAt,
      duration: submission.duration,
      mcqAnswers: submission.mcqAnswers?.length || 0,
      codingAnswers: submission.codingAnswers?.length || 0,
      feedback: submission.feedback || null,
      attempts: submission.attempts || 1
    }));

    res.json({
      message: "Submissions retrieved successfully",
      count: submissions.length,
      submissions: transformedSubmissions
    });

  } catch (error) {
    console.error('Error in getUserSubmissions:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to retrieve submissions",
      details: error.message 
    });
  }
};

export const updateCodingChallenges = async (req, res) => {
  try {
    const { testId } = req.params;
    const challenges = Array.isArray(req.body) ? req.body : [req.body];

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedChallenges = [];
    const errors = [];

    // Update each challenge
    for (const challengeUpdate of challenges) {
      const { challengeId, ...updateData } = challengeUpdate;
      
      const challengeIndex = test.codingChallenges.findIndex(
        challenge => challenge._id.toString() === challengeId
      );

      if (challengeIndex === -1) {
        errors.push(`Challenge not found: ${challengeId}`);
        continue;
      }

      // Validate language implementations if provided
      if (updateData.languageImplementations) {
        for (const [lang, impl] of Object.entries(updateData.languageImplementations)) {
          if (!impl.visibleCode || !impl.invisibleCode) {
            errors.push(`Both visibleCode and invisibleCode are required for language: ${lang}`);
            continue;
          }
        }
      }

      // Update the challenge
      const updatedChallenge = {
        ...test.codingChallenges[challengeIndex].toObject(),
        ...updateData
      };

      test.codingChallenges[challengeIndex] = updatedChallenge;
      updatedChallenges.push(updatedChallenge);
    }

    // Recalculate total marks if any marks were updated
    if (updatedChallenges.some(c => c.marks)) {
      test.totalMarks = (test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) || 0) + 
                       (test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0) || 0);
      test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    }

    await test.save();

    res.json({
      message: "Coding challenges updated successfully",
      updatedCount: updatedChallenges.length,
      errors: errors.length > 0 ? errors : undefined,
      updatedChallenges: updatedChallenges.map(c => ({
        id: c._id,
        title: c.title,
        marks: c.marks
      }))
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update coding challenges",
      details: error.message 
    });
  }
};

export const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, proctorNote, browserSwitches, tabSwitches } = req.body;

    const session = await TestSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: "Test session not found" });
    }

    // Verify the session belongs to the current user
    if (session.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to update this session" });
    }

    // Validate status transition based on current status
    const validTransitions = {
      'active': ['in_progress', 'terminated'],
      'in_progress': ['completed', 'terminated'],
      'completed': [], // No transitions allowed from completed
      'terminated': [] // No transitions allowed from terminated
    };

    if (status && (!validTransitions[session.status] || !validTransitions[session.status].includes(status))) {
      return res.status(400).json({ 
        error: "Invalid status transition",
        currentStatus: session.status,
        allowedTransitions: validTransitions[session.status]
      });
    }

    // Update session fields
    if (status) {
      session.status = status;
      
      // Set end time only for completed or terminated status
      if (['completed', 'terminated'].includes(status)) {
        session.endTime = new Date();
      }
    }

    if (typeof browserSwitches === 'number') {
      session.browserSwitches = browserSwitches;
    }

    if (typeof tabSwitches === 'number') {
      session.tabSwitches = tabSwitches;
    }

    // Add proctor note if provided
    if (proctorNote) {
      session.proctorNotes.push({
        note: proctorNote,
        timestamp: new Date(),
        addedBy: req.user._id
      });
    }

    await session.save();

    res.json({
      message: "Session status updated successfully",
      session: {
        _id: session._id,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        browserSwitches: session.browserSwitches,
        tabSwitches: session.tabSwitches,
        lastUpdated: new Date(),
        proctorNotes: session.proctorNotes
      }
    });

  } catch (error) {
    console.error('Error in updateSessionStatus:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid session ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update session status",
      details: error.message 
    });
  }
};

export const updateTestAccess = async (req, res) => {
  try {
    const { testId } = req.params;
    const { accessControl } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update test access" });
    }

    // Validate access control type
    if (!accessControl || !['public', 'private', 'restricted', 'invitation'].includes(accessControl.type)) {
      return res.status(400).json({
        error: "Invalid access control type. Must be 'public', 'private', 'restricted', or 'invitation'",
        receivedType: accessControl?.type
      });
    }

    // Update access control settings
    test.accessControl = {
      type: accessControl.type,
      // Copy any additional access control settings
      ...(accessControl.password && { password: accessControl.password }),
      ...(accessControl.validUntil && { validUntil: new Date(accessControl.validUntil) }),
      ...(accessControl.maxAttempts && { maxAttempts: accessControl.maxAttempts }),
      ...(accessControl.allowedUsers && { allowedUsers: accessControl.allowedUsers }),
      ...(accessControl.allowedDomains && { allowedDomains: accessControl.allowedDomains }),
      updatedAt: new Date()
    };

    await test.save();

    // Return sanitized response (exclude sensitive data)
    res.json({
      message: "Test access updated successfully",
      test: {
        _id: test._id,
        title: test.title,
        accessControl: {
          type: test.accessControl.type,
          ...(test.accessControl.validUntil && { validUntil: test.accessControl.validUntil }),
          ...(test.accessControl.maxAttempts && { maxAttempts: test.accessControl.maxAttempts }),
          ...(test.accessControl.allowedDomains && { allowedDomains: test.accessControl.allowedDomains }),
          updatedAt: test.accessControl.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error in updateTestAccess:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update test access",
      details: error.message 
    });
  }
};

export const updateTestVisibility = async (req, res) => {
  try {
    const { testId } = req.params;
    const { visibility, status } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update test visibility" });
    }

    // Validate visibility
    if (visibility && !['public', 'private', 'unlisted'].includes(visibility)) {
      return res.status(400).json({
        error: "Invalid visibility type. Must be 'public', 'private', or 'unlisted'",
        receivedVisibility: visibility
      });
    }

    // Validate status
    if (status && !['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'draft', 'published', or 'archived'",
        receivedStatus: status
      });
    }

    // Update test visibility and status
    const updates = {
      ...(visibility && { 'accessControl.type': visibility }),
      ...(status && { status }),
      updatedAt: new Date()
    };

    const updatedTest = await Test.findByIdAndUpdate(
      testId,
      { $set: updates },
      { 
        new: true,
        select: 'title status accessControl updatedAt' 
      }
    );

    // Add visibility change to test history if needed
    if (visibility && visibility !== test.accessControl.type) {
      await Test.findByIdAndUpdate(testId, {
        $push: {
          history: {
            action: 'visibility_changed',
            from: test.accessControl.type,
            to: visibility,
            changedBy: req.user._id,
            timestamp: new Date()
          }
        }
      });
    }

    res.json({
      message: "Test visibility updated successfully",
      test: {
        _id: updatedTest._id,
        title: updatedTest.title,
        status: updatedTest.status,
        visibility: updatedTest.accessControl.type,
        updatedAt: updatedTest.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in updateTestVisibility:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update test visibility",
      details: error.message 
    });
  }
};

export const getFeaturedPublicTests = async (req, res) => {
  try {
    const tests = await Test.find({
      'accessControl.type': 'public',
      status: 'published',
      featured: true
    })
    .select('title description duration totalMarks type category difficulty vendor')
    .populate('vendor', 'name email')
    .limit(5)
    .sort({ createdAt: -1 });

    res.json({
      message: 'Featured tests retrieved successfully',
      tests: tests.map(test => ({
        _id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        type: test.type,
        category: test.category,
        difficulty: test.difficulty,
        vendor: {
          name: test.vendor.name,
          email: test.vendor.email
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching featured tests',
      error: error.message 
    });
  }
};

export const getPublicTestCategories = async (req, res) => {
  try {
    const categories = await Test.distinct('category', {
      'accessControl.type': 'public',
      status: 'published'
    });

    res.json({
      message: 'Categories retrieved successfully',
      categories
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching categories',
      error: error.message 
    });
  }
};

export const registerForTest = async (req, res) => {
  try {
    const { uuid } = req.params;
    const test = await Test.findOne({ uuid });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is admin or vendor
    const isAdmin = req.user.role === 'admin';
    const isVendor = test.vendor.toString() === req.user._id.toString();

    // Check visibility and access
    const isPublic = test.accessControl.type === 'public';
    const isPractice = test.type === 'practice';
    const isAllowed = test.accessControl.allowedUsers?.includes(req.user._id);

    // Determine if user can register
    const canRegister = isAdmin || isVendor || isPublic || isPractice || isAllowed;

    if (!canRegister) {
      return res.status(403).json({ message: 'You are not authorized to take this test' });
    }

    // Check for existing registration
    const existingRegistration = await TestRegistration.findOne({
      test: test._id,
      user: req.user._id
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this test' });
    }

    // For assessment tests, check if already completed
    if (test.type === 'assessment') {
      const existingSubmission = await TestResult.findOne({
        test: test._id,
        user: req.user._id,
        status: 'completed'
      });

      if (existingSubmission) {
        return res.status(400).json({ message: 'You have already completed this test' });
      }
    }

    // Create registration and session
    // ... rest of the existing registration code ...
  } catch (error) {
    console.error('Error in registerForTest:', error);
    res.status(500).json({ 
      message: 'Error registering for test',
      error: error.message
    });
  }
};

export const validateSession = async (req, res) => {
  try {
    const { uuid, sessionId } = req.params;
    console.log('Validating session:', { uuid, sessionId, userId: req.user._id });

    // Find the test first
    const test = await Test.findOne({ uuid });
    if (!test) {
      return res.status(404).json({ 
        message: 'Test not found',
        status: 'error' 
      });
    }

    // Find the session with proper population
    const session = await TestSession.findOne({
      _id: sessionId,
      test: test._id,
      user: req.user._id
    }).populate('test', 'duration timeLimit');

    if (!session) {
      return res.status(404).json({ 
        message: 'Session not found',
        status: 'error'
      });
    }

    // Check if session is already ended
    if (session.status !== 'active') {
      return res.status(400).json({ 
        message: 'Session is no longer active',
        session: {
          status: session.status,
          endTime: session.endTime
        }
      });
    }

    // Calculate time remaining
    const startTime = session.startTime || session.createdAt;
    const timeElapsed = Date.now() - startTime;
    const timeLimit = (test.timeLimit || test.duration) * 60 * 1000; // Convert to milliseconds
    const timeRemaining = Math.max(0, timeLimit - timeElapsed);

    // Auto-end session if time is up
    if (timeRemaining <= 0) {
      session.status = 'completed';
      session.endTime = new Date(startTime.getTime() + timeLimit);
      await session.save();

      return res.status(400).json({
        message: 'Session has expired',
        session: {
          status: 'completed',
          endTime: session.endTime,
          reason: 'timeout'
        }
      });
    }

    // Return valid session details
    return res.json({
      session: {
        id: session._id,
        status: session.status,
        startTime: startTime,
        timeRemaining,
        timeElapsed,
        totalDuration: timeLimit,
        warnings: session.warnings || 0
      }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ 
      message: 'Error validating session',
      error: error.message 
    });
  }
};

export const updateTestType = async (req, res) => {
  try {
    const { testId } = req.params;
    const { type } = req.body;

    // Validate test type
    if (!['assessment', 'practice'].includes(type)) {
      return res.status(400).json({
        error: "Invalid test type. Must be either 'assessment' or 'practice'",
        receivedType: type
      });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update test type" });
    }

    // Update test type
    const updatedTest = await Test.findByIdAndUpdate(
      testId,
      { 
        $set: { 
          type,
          updatedAt: new Date()
        }
      },
      { 
        new: true,
        select: 'title type status updatedAt' 
      }
    );

    // Add type change to test history
    await Test.findByIdAndUpdate(testId, {
      $push: {
        history: {
          action: 'type_changed',
          from: test.type,
          to: type,
          changedBy: req.user._id,
          timestamp: new Date()
        }
      }
    });

    res.json({
      message: "Test type updated successfully",
      test: {
        _id: updatedTest._id,
        title: updatedTest.title,
        type: updatedTest.type,
        status: updatedTest.status,
        updatedAt: updatedTest.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in updateTestType:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update test type",
      details: error.message 
    });
  }
};



// export const updateTest = async (req, res) => {
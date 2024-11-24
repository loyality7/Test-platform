import TestAnalytics from '../models/testAnalytics.model.js';
import Test from '../models/test.model.js';

export const getTestAnalytics = async (req, res) => {
  try {
    const { testId } = req.params;
    const { userId, questionId, challengeId, type } = req.query;

    // Check if testId is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId);
    
    // Get the actual test document
    const test = isUUID 
      ? await Test.findOne({ uuid: testId })
      : await Test.findById(testId);

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
        data: null
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized: Only admins and test vendors can access analytics",
        data: null
      });
    }

    // Build base query using the MongoDB _id
    const query = { test: test._id };

    // Add optional filters
    if (userId) query.user = userId;
    if (type) query.type = type;
    if (questionId) query.questionId = questionId;
    if (challengeId) query.challengeId = challengeId;

    // Get analytics data with populated references
    const analytics = await TestAnalytics.find(query)
      .populate('user', 'name email')
      .populate({
        path: 'questionId',
        select: 'question marks difficulty',
        model: 'Test.mcqs'
      })
      .populate({
        path: 'challengeId',
        select: 'title marks difficulty',
        model: 'Test.codingChallenges'
      })
      .sort({ 'metadata.timestamp': -1 });

    if (!analytics.length) {
      return res.json({
        message: "No analytics data found",
        data: {
          summary: null,
          details: []
        }
      });
    }

    // Calculate summary statistics
    const summary = {
      overview: {
        totalParticipants: new Set(analytics.map(a => a.user._id.toString())).size,
        totalSubmissions: analytics.length,
        averageTimeSpent: Math.round(
          analytics.reduce((acc, curr) => acc + (curr.behavior.timeSpent || 0), 0) / analytics.length
        )
      },
      behaviorMetrics: {
        warnings: {
          total: analytics.reduce((acc, curr) => acc + (curr.behavior.warnings || 0), 0),
          average: Number((analytics.reduce((acc, curr) => acc + (curr.behavior.warnings || 0), 0) / analytics.length).toFixed(2))
        },
        tabSwitches: {
          total: analytics.reduce((acc, curr) => acc + (curr.behavior.tabSwitches || 0), 0),
          average: Number((analytics.reduce((acc, curr) => acc + (curr.behavior.tabSwitches || 0), 0) / analytics.length).toFixed(2))
        },
        copyPasteAttempts: {
          total: analytics.reduce((acc, curr) => acc + (curr.behavior.copyPasteAttempts || 0), 0),
          average: Number((analytics.reduce((acc, curr) => acc + (curr.behavior.copyPasteAttempts || 0), 0) / analytics.length).toFixed(2))
        },
        focusLost: {
          total: analytics.reduce((acc, curr) => acc + (curr.behavior.focusLostCount || 0), 0),
          average: Number((analytics.reduce((acc, curr) => acc + (curr.behavior.focusLostCount || 0), 0) / analytics.length).toFixed(2))
        }
      },
      performanceMetrics: {
        averageScore: Number((analytics.reduce((acc, curr) => acc + (curr.performance.score || 0), 0) / analytics.length).toFixed(2)),
        averageExecutionTime: type === 'coding' ? 
          Number((analytics.reduce((acc, curr) => acc + (curr.performance.executionTime || 0), 0) / analytics.length).toFixed(2)) : 
          null,
        averageTestCasesPassed: type === 'coding' ? 
          Number((analytics.reduce((acc, curr) => acc + (curr.performance.testCasesPassed || 0), 0) / analytics.length).toFixed(2)) : 
          null
      }
    };

    // Prepare detailed analytics
    const details = analytics.map(entry => ({
      id: entry._id,
      user: {
        id: entry.user._id,
        name: entry.user.name,
        email: entry.user.email
      },
      type: entry.type,
      question: entry.type === 'mcq' ? {
        id: entry.questionId?._id,
        question: entry.questionId?.question,
        marks: entry.questionId?.marks,
        difficulty: entry.questionId?.difficulty
      } : null,
      challenge: entry.type === 'coding' ? {
        id: entry.challengeId?._id,
        title: entry.challengeId?.title,
        marks: entry.challengeId?.marks,
        difficulty: entry.challengeId?.difficulty
      } : null,
      behavior: {
        timeSpent: entry.behavior.timeSpent,
        warnings: entry.behavior.warnings,
        tabSwitches: entry.behavior.tabSwitches,
        copyPasteAttempts: entry.behavior.copyPasteAttempts,
        focusLostCount: entry.behavior.focusLostCount,
        submissionAttempts: entry.behavior.submissionAttempts,
        errorCount: entry.behavior.errorCount
      },
      performance: {
        score: entry.performance.score,
        executionTime: entry.performance.executionTime,
        memoryUsage: entry.performance.memoryUsage,
        testCasesPassed: entry.performance.testCasesPassed,
        totalTestCases: entry.performance.totalTestCases
      },
      metadata: {
        browser: entry.metadata.browser,
        os: entry.metadata.os,
        device: entry.metadata.device,
        screenResolution: entry.metadata.screenResolution,
        timestamp: entry.metadata.timestamp
      }
    }));

    res.json({
      message: "Analytics retrieved successfully",
      data: {
        summary,
        details
      }
    });

  } catch (error) {
    console.error('Error in getTestAnalytics:', error);
    res.status(500).json({
      error: "Failed to retrieve analytics",
      details: error.message
    });
  }
};

export const postMCQAnalytics = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questionId, analyticsData } = req.body;

    // Validate test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Validate MCQ exists
    if (!questionId) {
      return res.status(400).json({ error: "questionId is required for MCQ analytics" });
    }

    const mcqExists = test.mcqs.some(mcq => mcq._id.toString() === questionId);
    if (!mcqExists) {
      return res.status(404).json({ error: "Question not found in test" });
    }

    // Create analytics entry
    const analytics = await TestAnalytics.create({
      test: testId,
      user: req.user._id,
      questionId,
      type: 'mcq',
      behavior: {
        warnings: analyticsData.warnings || 0,
        tabSwitches: analyticsData.tabSwitches || 0,
        copyPasteAttempts: analyticsData.copyPasteAttempts || 0,
        timeSpent: analyticsData.timeSpent,
        mouseMoves: analyticsData.mouseMoves || 0,
        keystrokes: analyticsData.keystrokes || 0,
        browserEvents: analyticsData.browserEvents || [],
        focusLostCount: analyticsData.focusLostCount || 0,
        submissionAttempts: analyticsData.submissionAttempts || 0,
        hintViews: analyticsData.hintViews || 0
      },
      performance: {
        score: analyticsData.score
      },
      metadata: {
        browser: analyticsData.browser,
        os: analyticsData.os,
        device: analyticsData.device,
        screenResolution: analyticsData.screenResolution,
        timestamp: new Date()
      }
    });

    await analytics.populate({
      path: 'questionId',
      select: 'question marks',
      model: 'Test.mcqs'
    });

    res.status(201).json({
      message: "MCQ analytics data recorded successfully",
      analytics: {
        ...analytics.toObject(),
        question: analytics.questionId
      }
    });

  } catch (error) {
    console.error('Error in postMCQAnalytics:', error);
    res.status(500).json({
      error: "Failed to record MCQ analytics",
      details: error.message
    });
  }
};

export const postCodingAnalytics = async (req, res) => {
  try {
    const { testId } = req.params;
    const { challengeId, analyticsData } = req.body;

    // Validate test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Validate coding challenge exists
    if (!challengeId) {
      return res.status(400).json({ error: "challengeId is required for coding analytics" });
    }

    const challengeExists = test.codingChallenges.some(
      challenge => challenge._id.toString() === challengeId
    );
    if (!challengeExists) {
      return res.status(404).json({ error: "Coding challenge not found in test" });
    }

    // Create analytics entry
    const analytics = await TestAnalytics.create({
      test: testId,
      user: req.user._id,
      challengeId,
      type: 'coding',
      behavior: {
        warnings: analyticsData.warnings || 0,
        tabSwitches: analyticsData.tabSwitches || 0,
        copyPasteAttempts: analyticsData.copyPasteAttempts || 0,
        timeSpent: analyticsData.timeSpent,
        mouseMoves: analyticsData.mouseMoves || 0,
        keystrokes: analyticsData.keystrokes || 0,
        browserEvents: analyticsData.browserEvents || [],
        focusLostCount: analyticsData.focusLostCount || 0,
        submissionAttempts: analyticsData.submissionAttempts || 0,
        errorCount: analyticsData.errorCount || 0
      },
      performance: {
        executionTime: analyticsData.executionTime,
        memoryUsage: analyticsData.memoryUsage
      },
      metadata: {
        browser: analyticsData.browser,
        os: analyticsData.os,
        device: analyticsData.device,
        screenResolution: analyticsData.screenResolution,
        timestamp: new Date()
      }
    });

    await analytics.populate({
      path: 'challengeId',
      select: 'title marks',
      model: 'Test.codingChallenges'
    });

    res.status(201).json({
      message: "Coding analytics data recorded successfully",
      analytics: {
        ...analytics.toObject(),
        challenge: analytics.challengeId
      }
    });

  } catch (error) {
    console.error('Error in postCodingAnalytics:', error);
    res.status(500).json({
      error: "Failed to record coding analytics",
      details: error.message
    });
  }
};

export const postTestAnalytics = async (req, res) => {
  try {
    const { testId, analytics } = req.body;
    
    // First check if this is a UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId);
    
    // If it's a UUID, we need to find the test by uuid field instead of _id
    const test = isUUID 
      ? await Test.findOne({ uuid: testId })
      : await Test.findById(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Create new analytics document
    const testAnalytics = new TestAnalytics({
      testId: test._id, // Use the MongoDB _id here
      ...analytics,
      timestamp: new Date()
    });

    await testAnalytics.save();

    return res.status(200).json({
      success: true,
      message: 'Analytics saved successfully',
      data: testAnalytics
    });

  } catch (error) {
    console.error('Error in postTestAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save analytics',
      error: error.message
    });
  }
}; 
import User from '../models/user.model.js';
import { parse } from 'csv-parse';
import { validateEmail } from '../utils/validation.js';

/**
 * Add users to a test manually
 */
export const addTestUsers = async (req, res) => {
  try {
    const { users, validUntil, maxAttempts } = req.body;
    const test = req.test;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ message: "Users array is required" });
    }

    // Check for duplicate emails
    const emailCounts = {};
    users.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });

    const duplicatesInInput = Object.entries(emailCounts)
      .filter(([_, count]) => count > 1)
      .map(([email]) => email);

    if (duplicatesInInput.length > 0) {
      return res.status(400).json({
        message: "Duplicate emails found in input",
        duplicateEmails: duplicatesInInput
      });
    }

    const results = {
      addedUsers: [],
      duplicateUsers: [],
      summary: {
        totalProcessed: users.length,
        added: 0,
        duplicates: 0
      }
    };

    // Initialize access control if it doesn't exist
    if (!test.accessControl) {
      test.accessControl = {
        allowedUsers: [],
        currentUserCount: 0
      };
    }

    for (const userData of users) {
      const { email, name } = userData;
      
      // Validate email format
      if (!validateEmail(email)) {
        continue;
      }

      // Check if user is already in allowed users
      const isExistingUser = test.accessControl.allowedUsers?.some(
        user => user.email === email
      );

      if (isExistingUser) {
        results.duplicateUsers.push({ email, name });
        results.summary.duplicates++;
        continue;
      }

      // Add user to allowed users
      test.accessControl.allowedUsers.push({
        email,
        name,
        addedAt: new Date()
      });
      test.accessControl.currentUserCount++;
      
      results.addedUsers.push({ email, name });
      results.summary.added++;
    }

    // Update test settings if provided
    if (validUntil) {
      test.accessControl.validUntil = new Date(validUntil);
    }
    if (maxAttempts) {
      test.accessControl.maxAttempts = maxAttempts;
    }

    await test.save();

    if (results.summary.added === 0 && results.summary.duplicates > 0) {
      return res.status(409).json({
        message: "All users already exist in this test",
        duplicateUsers: results.duplicateUsers
      });
    }

    res.json({
      message: "Users processed successfully",
      ...results
    });

  } catch (error) {
    console.error('Error in addTestUsers:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add users to a test via CSV upload
 */
export const uploadTestUsers = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files.file;
    const test = req.test;
    const { validUntil, maxAttempts } = req.body;

    // Track emails to check for duplicates in CSV
    const seenEmails = new Set();
    const duplicateEmails = new Set();

    csv.parse(file.data, {
      columns: true,
      skip_empty_lines: true,
      on_record: (record) => {
        const email = record.email?.trim();
        if (seenEmails.has(email)) {
          duplicateEmails.add(email);
        }
        seenEmails.add(email);
        return record;
      }
    });

    if (duplicateEmails.size > 0) {
      return res.status(400).json({
        message: "Duplicate emails found in CSV",
        duplicateEmails: Array.from(duplicateEmails)
      });
    }

    // Parse CSV
    const results = await new Promise((resolve, reject) => {
      const results = {
        addedUsers: [],
        duplicateUsers: [],
        summary: {
          totalProcessed: 0,
          added: 0,
          duplicates: 0,
          invalid: 0
        }
      };

      csv.parse(file.data, {
        columns: true,
        skip_empty_lines: true
      })
        .on('data', async (row) => {
          results.summary.totalProcessed++;
          
          const email = row.email?.trim();
          const name = row.name?.trim();

          if (!email || !validateEmail(email)) {
            results.summary.invalid++;
            return;
          }

          // Check if user exists in database
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            if (!existingUser.availableTests?.includes(test._id)) {
              existingUser.availableTests = existingUser.availableTests || [];
              existingUser.availableTests.push(test._id);
              await existingUser.save();
            }
          }

          // Check for duplicate
          const isExistingUser = test.accessControl.allowedUsers?.some(
            userId => userId.toString() === email
          );

          if (isExistingUser) {
            results.duplicateUsers.push({ email, name });
            results.summary.duplicates++;
            return;
          }

          // Add new user
          if (!test.accessControl.allowedUsers) {
            test.accessControl.allowedUsers = [];
          }
          
          test.accessControl.allowedUsers.push(email);
          test.accessControl.currentUserCount++;
          
          results.addedUsers.push({ email, name });
          results.summary.added++;
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    // Update test settings if provided
    if (validUntil) {
      test.accessControl.validUntil = new Date(validUntil);
    }
    if (maxAttempts) {
      test.accessControl.maxAttempts = maxAttempts;
    }

    await test.save();

    if (results.summary.added === 0 && results.summary.duplicates > 0) {
      return res.status(409).json({
        message: "All users already exist in this test",
        duplicateUsers: results.duplicateUsers
      });
    }

    res.json({
      message: "CSV processed successfully",
      ...results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove users from a test
 */
export const removeTestUsers = async (req, res) => {
  try {
    const { emails } = req.body;
    const test = req.test;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ message: "Emails array is required" });
    }

    const results = {
      removedUsers: [],
      notFoundUsers: [],
      summary: {
        totalProcessed: emails.length,
        removed: 0,
        notFound: 0
      }
    };

    for (const email of emails) {
      // Check if user exists in allowed users
      const userIndex = test.accessControl.allowedUsers?.findIndex(
        userId => userId.toString() === email
      );

      if (userIndex === -1) {
        results.notFoundUsers.push(email);
        results.summary.notFound++;
        continue;
      }

      // Remove user
      test.accessControl.allowedUsers.splice(userIndex, 1);
      test.accessControl.currentUserCount--;
      
      results.removedUsers.push(email);
      results.summary.removed++;
    }

    await test.save();

    if (results.summary.removed === 0) {
      return res.status(404).json({
        message: "No users were found to remove",
        notFoundUsers: results.notFoundUsers
      });
    }

    res.json({
      message: "Users removed successfully",
      ...results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 
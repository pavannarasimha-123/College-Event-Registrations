const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Helper to generate JWT token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_development';
  return jwt.sign(
    {
      id: user._id,
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name
    },
    secret,
    { expiresIn: '7d' }
  );
};

// @desc    Register a new student account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required.' });
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Strict security requirement: Public registrations must ALWAYS be role = 'student'
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: 'student'
    });

    await newUser.save();

    res.status(201).json({
      message: 'Student registered successfully. Please log in.',
      user: {
        id: newUser._id,
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate password reset (Forgot Password)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please enter your registered email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    // Convenience fallback: if testing with pavan@gmail.com or rpavannn@gmail.com
    if (!user && (normalizedEmail === 'rpavannn@gmail.com' || normalizedEmail === 'pavan@gmail.com')) {
      user = await User.findOne({
        email: { $in: ['rpavannn@gmail.com', 'pavan@gmail.com'] }
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'No registered account found with that email address.' });
    }

    // Generate random reset token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity
    await user.save();

    // Determine client base URL cleanly
    let baseUrl = req.headers.origin;
    if (!baseUrl && req.headers['x-forwarded-host']) {
      const proto = req.headers['x-forwarded-proto'] || 'https';
      baseUrl = `${proto}://${req.headers['x-forwarded-host']}`;
    }
    if (!baseUrl && req.headers.host) {
      const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      baseUrl = `${proto}://${req.headers.host}`;
    }
    if (!baseUrl && req.headers.referer) {
      try {
        const parsed = new URL(req.headers.referer);
        baseUrl = parsed.origin;
      } catch (e) {
        baseUrl = null;
      }
    }
    if (!baseUrl) {
      baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    }
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    // Target recipient email: if pavan@gmail.com, forward to rpavannn@gmail.com
    const targetEmail = (user.email === 'pavan@gmail.com')
      ? 'rpavannn@gmail.com'
      : user.email;

    // Send email
    let emailPreviewUrl = null;
    try {
      const result = await sendPasswordResetEmail(targetEmail, resetUrl, user.name);
      if (result && result.previewUrl) {
        emailPreviewUrl = result.previewUrl;
        console.log(`[ForgotPassword] Email preview: ${emailPreviewUrl}`);
      }
      console.log(`[ForgotPassword] Password reset email dispatched to ${targetEmail}`);
    } catch (emailErr) {
      console.error('[Email Error] Could not dispatch email via SMTP:', emailErr.message);
      return res.status(500).json({
        message: `Failed to dispatch reset email via SMTP: ${emailErr.message}`,
        devResetUrl: resetUrl
      });
    }

    res.status(200).json({
      message: `Password reset instructions have been sent to ${targetEmail}.`,
      devResetUrl: resetUrl,
      ...(emailPreviewUrl && { emailPreviewUrl })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or has expired.' });
    }

    // Check if new password is identical to the current password
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      return res.status(400).json({
        message: 'Your new password cannot be the same as your previous password. Please choose a different password.'
      });
    }

    // Update password (pre-save hook will hash with bcrypt)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Your password has been successfully reset! Please log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser: getMe,
  getMe
};

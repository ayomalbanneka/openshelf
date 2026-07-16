import * as authService from '../services/auth.service.js';
import { setTokenCookies, clearTokenCookies } from '../utils/cookies.js';
import { generateTokens } from '../services/auth.service.js';

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });

    setTokenCookies(res, result);

    res.json({ user: result.user, message: result.message });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const result = await authService.verifyEmail({ userId: req.user.id, code });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const resendCode = async (req, res, next) => {
  try {
    const result = await authService.resendVerificationCode(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    setTokenCookies(res, result);

    res.json({ user: result.user });
  } catch (err) {
    next(err);
  }
};

const adminLoginStep1 = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.adminLoginStep1({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const adminLoginStep2 = async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    const result = await authService.adminLoginStep2({ userId, code });

    setTokenCookies(res, result);

    res.json({ user: result.user });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPassword({ email, code, newPassword });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    // Token now comes from cookie, not request body
    const rawToken = req.cookies.refresh_token;
    const result = await authService.refreshAccessToken(rawToken);

    setTokenCookies(res, result);

    res.json({ message: 'Token refreshed' });
  } catch (err) {
    next(err);
  }
};

const me = (req, res) => {
  res.json({ user: req.user });
};

const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies.refresh_token;
    await authService.logout(rawToken);

    clearTokenCookies(res);

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const oauthCallback = async (req, res, next) => {
  try {
    const tokens = await generateTokens(req.user.id);
    setTokenCookies(res, tokens);

    res.redirect(`${process.env.WEB_URL}/auth/callback`);
  } catch (err) {
    console.error('[oauthCallback] failed:', err);
    res.redirect(`${process.env.WEB_URL}/login?error=oauth_failed`);
  }
};

export {
  register,
  verifyEmail,
  resendCode,
  login,
  adminLoginStep1,
  adminLoginStep2,
  forgotPassword,
  resetPassword,
  refresh,
  me,
  logout,
  oauthCallback,
};

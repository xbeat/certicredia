/**
 * i18n Middleware
 * Handles language detection and switching
 */

const i18nMiddleware = (req, res, next) => {
  // Check for language in query params, cookie, or accept-language header
  let language = req.query.lang || req.cookies.language || req.acceptsLanguages(['it', 'en']);

  // Default to Italian if not supported
  if (!['it', 'en'].includes(language)) {
    language = 'it';
  }

  // Set language for this request
  req.setLocale(language);

  // Make language available in all views
  res.locals.currentLanguage = language;
  res.locals.__ = res.__;
  res.locals.alternateLanguage = language === 'it' ? 'en' : 'it';

  // Set cookie for future requests (30 days)
  res.cookie('language', language, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  next();
};

module.exports = { i18nMiddleware };

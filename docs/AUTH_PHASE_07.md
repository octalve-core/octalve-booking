# Booking Auth UI Phase 07 — design acceptance

- Login, registration, and password recovery are separate Next.js App Router pages.
- Layout follows supplied reference: centered white form card and a calm single pale-blue/white background, with no decorative cloud artwork.
- Sign-in includes email/password, password visibility toggle, remember-me checkbox, reset link, Google SSO placeholder explicitly disabled.
- Sign-up covers individual/business type, required name/email/password/confirmation, optional international phone country selector, agreement notices and optional business name/website/timezone/currency.
- Optional details can be skipped and finished later in the workspace setup flow.
- Forms only validate in React/browser; they do not persist users, send credentials, create sessions or send reset email.
- Terms/privacy links lead to honest preparation notices rather than made-up published legal policy.
- Sidebar hides scrollbar track with CSS while retaining overflow-y-auto, touch, wheel and keyboard access.
- Acceptance: Next build, typecheck, lint, domain/source tests, browser 320/390/768/1440 checks, and the existing single continuous click-driven journey.
- Production readiness still requires independent tenant auth, server-verified email, rate limits, recovery token rotation and expiry, sessions, consent policy publication, audit logs and robust phone validation.

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware from the session cookie. */
      user?: { id: string; sessionId: string };
    }
  }
}

export {};

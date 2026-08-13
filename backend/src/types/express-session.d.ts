import 'express-session';

declare module 'express-session' {
  interface SessionData {
    /** Set once the user has logged in. Seedr tokens live on their User record, not here. */
    userId?: string;
  }
}

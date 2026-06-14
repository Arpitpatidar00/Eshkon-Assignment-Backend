// Extend Express Request type to include cookies property
declare namespace Express {
  interface Request {
    /** Cookies parsed by cookie-parser middleware */
    cookies: { [key: string]: string };
  }
}

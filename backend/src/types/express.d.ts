declare global {
  namespace Express {
    interface Request {
      admin?: { _id: unknown; email?: string; tokenVersion?: number };
    }
  }
}

export {};

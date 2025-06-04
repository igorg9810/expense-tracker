import { Request, Response } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response): void => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: `Not Found - ${req.originalUrl}`,
    },
  });
};

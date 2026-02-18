import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  res.json({ message: 'Register' });
});

authRouter.post('/login', (req, res) => {
  res.json({ message: 'Login' });
});

authRouter.post('/logout', (req, res) => {
  res.json({ message: 'Logout' });
});

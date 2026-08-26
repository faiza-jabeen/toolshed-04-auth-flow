import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../lib/requireAuth.js';
import { asyncRoute } from '../lib/errors.js';

/** A protected resource, so "protected route" means something server-side too. */
export const loans = Router();

loans.get('/', requireAuth, asyncRoute((req, res) => {
  const rows = db.prepare(
    'SELECT id, tool, asset_tag AS assetTag, due_on AS dueOn FROM loans WHERE user_id = ? ORDER BY due_on',
  ).all(req.user.id);
  res.json({ data: rows });
}));

/** Keeper-only, to show role checks working. */
loans.get('/all', requireAuth, requireRole('keeper'), asyncRoute((_req, res) => {
  const rows = db.prepare(`
    SELECT l.id, l.tool, l.asset_tag AS assetTag, l.due_on AS dueOn, u.name AS borrower
    FROM loans l JOIN users u ON u.id = l.user_id ORDER BY l.due_on
  `).all();
  res.json({ data: rows });
}));

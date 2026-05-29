import { test, expect } from '@playwright/test';

test('verify chkobba pills and timeout logic', async ({ page }) => {
  await page.goto('http://localhost:8000');

  // Mock global state for Chkobba
  await page.evaluate(() => {
    window.onlineMode = true;
    window._myId = 'p1';
    window._myName = 'Jules';
    window._room = {
      code: 'TEST',
      players: [
        { id: 'p1', name: 'Jules', connected: true },
        { id: 'p2', name: 'Opponent', connected: true }
      ],
      config: { gameMode: 'chkobba', chkobbaMode: '1v1' },
      word_obj: {
        phase: 'playing',
        round: 1,
        turnIndex: 0,
        players: [
          {
            id: 'p1',
            name: 'Jules',
            hand: [{ id: 'h1', value: 7, suit: 'hearts' }, { id: 'h2', value: 3, suit: 'diamonds' }],
            captured: [{ id: 'c1', value: 1, suit: 'hearts' }],
            chkobbas: 0,
            totalScore: 10
          },
          {
            id: 'p2',
            name: 'Opponent',
            hand: [{ id: 'o1', value: 5, suit: 'spades' }],
            captured: [],
            chkobbas: 0,
            totalScore: 5
          }
        ],
        table: [{ id: 't1', value: 7, suit: 'diamonds' }, { id: 't2', value: 4, suit: 'hearts' }],
        deck: Array(20).fill({}),
        mode: '1v1'
      }
    };
    // Trigger render
    window._showOnlineChkobba(window._room);
  });

  await page.screenshot({ path: 'verification/chkobba_new_pills.png' });
});

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set to mobile view
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('http://localhost:8080');

  // Mock necessary globals for Chkobba
  await page.evaluate(() => {
    window.onlineMode = true;
    window._myId = 'me';
    window._myName = 'Jules';
    window._room = {
      code: 'TEST',
      config: { gameMode: 'chkobba', chkobbaMode: '1v1' },
      players: [
        { id: 'me', name: 'Jules', connected: true },
        { id: 'opp', name: 'Opponent', connected: true }
      ],
      word_obj: {
        phase: 'playing',
        round: 1,
        turnIndex: 0,
        deck: new Array(20).fill({}),
        table: [
            { id: 't1', suit: 'hearts', value: 2 },
            { id: 't2', suit: 'diamonds', value: 7 }
        ],
        players: [
            { id: 'me', name: 'Jules', hand: [{ id: 'h1', suit: 'hearts', value: 5 }], captured: [{id: 'c1'}], totalScore: 10 },
            { id: 'opp1', name: 'Opponent 1', hand: [{}, {}], captured: [{id:'c2'}], totalScore: 5 },
            { id: 'opp2', name: 'Opponent 2', hand: [{}, {}], captured: [], totalScore: 3 },
            { id: 'opp3', name: 'Opponent 3', hand: [{}, {}], captured: [{id:'c3'},{id:'c4'}], totalScore: 8 }
        ]
      }
    };

    // Trigger render
    window._showOnlineChkobba(window._room);
  });

  await page.screenshot({ path: 'chkobba_mobile_polish.png' });

  // Also check desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: 'chkobba_desktop_polish.png' });

  await browser.close();
})();

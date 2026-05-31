
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // Load the page (pointing to the local server)
  await page.goto('http://localhost:8000');

  // Mock Chkobba state
  await page.evaluate(() => {
    window._myId = 'p1';
    const state = {
      phase: 'playing',
      mode: '1v1v1v1',
      turnIndex: 3,
      round: 1,
      deck: new Array(20).fill({}),
      table: [
        { suit: 'diamonds', value: 7, id: 'd7' },
        { suit: 'hearts', value: 2, id: 'h2' }
      ],
      players: [
        { id: 'p1', name: 'Jules', hand: [{}, {}], captured: [{}, {}], totalScore: 0, chkobbas: 0 },
        { id: 'p2', name: 'Player 2', hand: [{}, {}], captured: [{}, {}], totalScore: 0, chkobbas: 0 },
        { id: 'p3', name: 'Player 3', hand: [{}, {}], captured: [{}, {}], totalScore: 0, chkobbas: 0 },
        { id: 'p4', name: 'Player 4', hand: [{}, {}], captured: [{}, {}], totalScore: 0, chkobbas: 0 }
      ]
    };
    const room = { id: 'test', word_obj: state, players: [
        {id:'p1', connected: true},
        {id:'p2', connected: true},
        {id:'p3', connected: true},
        {id:'p4', connected: true}
    ] };
    window._room = room;
    window._showOnlineChkobba(room);
  });

  await page.waitForTimeout(500);

  // Get computed styles of .chkobba-opponents
  const styles = await page.evaluate(() => {
    const el = document.querySelector('.chkobba-opponents');
    if (!el) return 'Not found';
    const s = window.getComputedStyle(el);
    return {
      display: s.display,
      gridTemplateColumns: s.gridTemplateColumns,
      width: s.width,
      flexDirection: s.flexDirection
    };
  });
  console.log('Opponents Container Styles:', JSON.stringify(styles, null, 2));

  const pillStyles = await page.evaluate(() => {
    const el = document.querySelector('.chkobba-player-pill');
    if (!el) return 'Not found';
    const s = window.getComputedStyle(el);
    const main = el.querySelector('.pill-main');
    const mainS = window.getComputedStyle(main);
    return {
      pillWidth: s.width,
      pillDisplay: s.display,
      mainDirection: mainS.flexDirection,
      mainPadding: mainS.padding
    };
  });
  console.log('Pill Styles:', JSON.stringify(pillStyles, null, 2));

  await page.screenshot({ path: 'chkobba_mobile_debug.png' });
  await browser.close();
})();

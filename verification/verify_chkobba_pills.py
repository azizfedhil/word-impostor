from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:8000")
    page.wait_for_timeout(1000)

    # Mock global state for Chkobba
    page.evaluate("""() => {
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
    }""")
    page.wait_for_timeout(1000)

    # Take screenshot of the new pills
    page.screenshot(path="/home/jules/verification/screenshots/chkobba_pills.png")

    # Expand a pill
    page.click(".chkobba-player-pill[data-player-id='p1']")
    page.wait_for_timeout(500)
    page.screenshot(path="/home/jules/verification/screenshots/chkobba_pill_expanded.png")

    # Hold for video
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

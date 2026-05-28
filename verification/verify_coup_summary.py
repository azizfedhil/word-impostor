from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(1000)

    # Mock online room state for Coup
    page.evaluate("""
        window.onlineMode = true;
        window._myId = 'p_me';
        window._room = {
            code: 'TEST12',
            state: 'coup',
            players: [
                { id: 'p_me', name: 'Aziz', coins: 7, hand: [{type: 'duke', lost: false}, {type: 'captain', lost: false}], lastAction: 'تسكير' },
                { id: 'p1', name: 'Omar', coins: 3, hand: [{type: 'duke', lost: true}, {type: 'captain', lost: true}], lastAction: 'شهرية' },
                { id: 'p2', name: 'Nora', coins: 10, hand: [{type: 'contessa', lost: false}, {type: 'duke', lost: true}], lastAction: 'انقلاب' },
                { id: 'p3', name: 'edge1', coins: 2, hand: [{type: 'duke', lost: false}, {type: 'captain', lost: false}], lastAction: 'سرقة' },
                { id: 'p4', name: 'extra1', coins: 5, hand: [{type: 'duke', lost: false}, {type: 'captain', lost: false}], lastAction: null },
                { id: 'p5', name: 'extra2', coins: 1, hand: [{type: 'duke', lost: false}, {type: 'captain', lost: false}], lastAction: null }
            ],
            word_obj: {
                deck: ['duke', 'captain'],
                turnIndex: 2,
                bankCoins: 20,
                log: 'نورة عملت انقلاب على عمر.',
                players: [
                    { id: 'p_me', name: 'Aziz', coins: 7, hand: [{type: 'duke', lost: false}, {type: 'captain', lost: false}], lastAction: 'تسكير' },
                    { id: 'p1', name: 'Omar', coins: 3, hand: [{type: 'duke', lost: true}, {type: 'captain', lost: true}], lastAction: 'شهرية' },
                    { id: 'p2', name: 'Nora', coins: 10, hand: [{type: 'contessa', lost: false}, {type: 'duke', lost: true}], lastAction: 'انقلاب' },
                    { id: 'p3', name: 'edge1', coins: 2, hand: [{type: 'duke', lost: false}, {type: 'captain', lost: false}], lastAction: 'سرقة' },
                    { id: 'p4', name: 'extra1', coins: 5, hand: [{type: 'duke', lost: false}, {type: 'captain', lost: false}], lastAction: null },
                    { id: 'p5', name: 'extra2', coins: 1, hand: [{type: 'duke', lost: false}, {type: 'captain', lost: false}], lastAction: null }
                ]
            }
        };
        window._showOnlineCoup(window._room);
    """)
    page.wait_for_timeout(1000)

    # Click on Nora's pill
    page.click("text=Nora")
    page.wait_for_timeout(500)

    # Take screenshot of expanded Nora info
    page.screenshot(path="verification/screenshots/verification_expanded.png")
    page.wait_for_timeout(1000)

    # Scroll pills to the right to see extra players
    page.hover(".coup-pills-container")
    page.mouse.wheel(500, 0)
    page.wait_for_timeout(500)
    page.screenshot(path="verification/screenshots/verification_scrolled.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos",
            viewport={'width': 480, 'height': 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

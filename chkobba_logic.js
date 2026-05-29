'use strict';

/**
 * Chkobba Core Logic - Authentic Tunisian Rules
 */
const ChkobbaLogic = {
    // Suits mapping
    SUITS: {
        DINARI: 'diamonds', // carreau
        KOBB: 'hearts',     // coeur
        SBITA: 'spades',    // pique
        JALLOU: 'clovers'   // trèfle
    },

    // Card Values for capture: A=1, 2-7=face, Q=8, J=9, K=10
    // Card Values for Prime (Basila):
    // 7: 21, 6: 18, Ace: 16, 5: 15, 4: 14, 3: 13, 2: 12, Face(8,9,10): 10
    PRIME_VALUES: {
        1: 16, // Ace
        2: 12,
        3: 13,
        4: 14,
        5: 15,
        6: 18,
        7: 21,
        8: 10, // Queen
        9: 10, // Jack
        10: 10 // King
    },

    /**
     * Initialize a new 40-card deck
     */
    createDeck: function() {
        const deck = [];
        const suits = Object.values(this.SUITS);
        for (const suit of suits) {
            for (let value = 1; value <= 10; value++) {
                deck.push({
                    suit: suit,
                    value: value,
                    id: `${suit}_${value}`
                });
            }
        }
        return this.shuffle(deck);
    },

    shuffle: function(deck) {
        const d = [...deck];
        for (let i = d.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [d[i], d[j]] = [d[j], d[i]];
        }
        return d;
    },

    /**
     * Centralized Asset Mapping
     */
    ASSETS: {
        BACK: 'assets/chkobba/Chkobba_dos.webp',
        POINT: 'assets/chkobba/Chkobba_point.webp',
        MAPPING: {
            'hearts':   { folder: 'Hearts',   prefix: 'coeur' },
            'spades':   { folder: 'Sapdes',   prefix: 'pique' },
            'clovers':  { folder: 'clovers',  prefix: 'trèfle' },
            'diamonds': { folder: 'diamonds', prefix: 'carreau' }
        }
    },

    /**
     * Map card to its asset path with robust fallback
     */
    getCardAsset: function(card) {
        if (!card) return this.ASSETS.BACK;

        const suitData = this.ASSETS.MAPPING[card.suit];
        if (!suitData) return this.ASSETS.BACK;

        const valStr = String(card.value).padStart(2, '0');
        const path = `assets/chkobba/${suitData.folder}/Chkobba_${suitData.prefix}_${valStr}.webp`;

        // Resilience: check if it's a known missing asset or invalid value
        if (card.value < 1 || card.value > 10) return this.ASSETS.BACK;

        // Special case: Hearts only has 9 cards in some versions, but here we assume the provided assets.
        // If an asset is missing, we'll return a generic "point" or back card.
        return path;
    },

    /**
     * Find all possible capture combinations for a played card
     * Returns an array of arrays of cards.
     */
    getValidCaptures: function(playedCard, tableCards) {
        const targetValue = playedCard.value;

        // Rule 1: Mandatory identical-value capture
        const directMatch = tableCards.find(c => c.value === targetValue);
        if (directMatch) {
            return [[directMatch]]; // MUST take the single matching card
        }

        // Rule 2: Sum combinations
        return this.findSumCombinations(tableCards, targetValue);
    },

    /**
     * Helper to find subsets of cards that sum to a target value
     */
    findSumCombinations: function(cards, target) {
        const results = [];

        const backtrack = (start, currentSum, currentSubset) => {
            if (currentSum === target) {
                results.push([...currentSubset]);
                return;
            }
            if (currentSum > target) return;

            for (let i = start; i < cards.length; i++) {
                currentSubset.push(cards[i]);
                backtrack(i + 1, currentSum + cards[i].value, currentSubset);
                currentSubset.pop();
            }
        };

        backtrack(0, 0, []);
        return results;
    },

    /**
     * Calculate scores for a round
     * @param {Object} playersCapturedCards - { playerId: [cards] }
     * @param {Object} chkobbas - { playerId: count }
     * @param {Array} teams - Optional array of teams [ [p1, p2], [p3, p4] ]
     */
    calculateScores: function(playersCapturedCards, chkobbas, teams = null) {
        const scores = {};
        const pIds = Object.keys(playersCapturedCards);

        // Initialize scores
        pIds.forEach(id => {
            scores[id] = {
                total: 0,
                details: { carti: 0, dinari: 0, berria: 0, basila: 0, chkobba: chkobbas[id] || 0 }
            };
        });

        if (teams && teams.length > 0) {
            // Team-based scoring (2v2)
            const teamResults = teams.map(teamIds => {
                const captured = teamIds.flatMap(id => playersCapturedCards[id] || []);
                const chkobbaCount = teamIds.reduce((sum, id) => sum + (chkobbas[id] || 0), 0);
                return {
                    ids: teamIds,
                    captured,
                    chkobbaCount,
                    prime: this.calculatePrimeScore(captured)
                };
            });

            // 1. Carti
            let maxCards = -1, cartiWinnerIdx = -1, cartiTie = false;
            teamResults.forEach((res, idx) => {
                if (res.captured.length > maxCards) { maxCards = res.captured.length; cartiWinnerIdx = idx; cartiTie = false; }
                else if (res.captured.length === maxCards) { cartiTie = true; }
            });
            if (!cartiTie && cartiWinnerIdx !== -1 && maxCards > 20) {
                teamResults[cartiWinnerIdx].carti = 1;
            }

            // 2. Dinari
            let maxDinari = -1, dinariWinnerIdx = -1, dinariTie = false;
            teamResults.forEach((res, idx) => {
                const count = res.captured.filter(c => c.suit === this.SUITS.DINARI).length;
                if (count > maxDinari) { maxDinari = count; dinariWinnerIdx = idx; dinariTie = false; }
                else if (count === maxDinari) { dinariTie = true; }
            });
            if (!dinariTie && dinariWinnerIdx !== -1 && maxDinari > 5) {
                teamResults[dinariWinnerIdx].dinari = 1;
            }

            // 3. Berria
            teamResults.forEach(res => {
                if (res.captured.some(c => c.suit === this.SUITS.DINARI && c.value === 7)) res.berria = 1;
            });

            // 4. Basila
            let maxPrime = -1, basilaWinnerIdx = -1, basilaTie = false;
            teamResults.forEach((res, idx) => {
                if (res.prime > maxPrime) { maxPrime = res.prime; basilaWinnerIdx = idx; basilaTie = false; }
                else if (res.prime === maxPrime) { basilaTie = true; }
            });
            if (!basilaTie && basilaWinnerIdx !== -1) teamResults[basilaWinnerIdx].basila = 1;

            // Distribute team scores to individual players (usually just for tracking total)
            teamResults.forEach(res => {
                const teamTotal = (res.carti||0) + (res.dinari||0) + (res.berria||0) + (res.basila||0) + res.chkobbaCount;
                res.ids.forEach(id => {
                    scores[id].total = teamTotal;
                    scores[id].details = {
                        carti: res.carti || 0,
                        dinari: res.dinari || 0,
                        berria: res.berria || 0,
                        basila: res.basila || 0,
                        chkobba: res.chkobbaCount // Total chkobbas for the team
                    };
                });
            });

        } else {
            // Individual scoring (1v1, 1v1v1)
            pIds.forEach(id => { scores[id].total += scores[id].details.chkobba; });

            // 1. Carti
            let maxCards = -1, cartiWinner = null, cartiTie = false;
            pIds.forEach(id => {
                const count = playersCapturedCards[id].length;
                if (count > maxCards) { maxCards = count; cartiWinner = id; cartiTie = false; }
                else if (count === maxCards) cartiTie = true;
            });
            if (!cartiTie && cartiWinner !== null && (pIds.length > 2 || maxCards > 20)) {
                scores[cartiWinner].details.carti = 1;
                scores[cartiWinner].total += 1;
            }

            // 2. Dinari
            let maxDinari = -1, dinariWinner = null, dinariTie = false;
            pIds.forEach(id => {
                const count = playersCapturedCards[id].filter(c => c.suit === this.SUITS.DINARI).length;
                if (count > maxDinari) { maxDinari = count; dinariWinner = id; dinariTie = false; }
                else if (count === maxDinari) dinariTie = true;
            });
            if (!dinariTie && dinariWinner !== null && (pIds.length > 2 || maxDinari > 5)) {
                scores[dinariWinner].details.dinari = 1;
                scores[dinariWinner].total += 1;
            }

            // 3. Berria
            pIds.forEach(id => {
                if (playersCapturedCards[id].some(c => c.suit === this.SUITS.DINARI && c.value === 7)) {
                    scores[id].details.berria = 1;
                    scores[id].total += 1;
                }
            });

            // 4. Basila
            let maxPrime = -1, basilaWinner = null, basilaTie = false;
            pIds.forEach(id => {
                const prime = this.calculatePrimeScore(playersCapturedCards[id]);
                if (prime > maxPrime) { maxPrime = prime; basilaWinner = id; basilaTie = false; }
                else if (prime === maxPrime) basilaTie = true;
            });
            if (!basilaTie && basilaWinner !== null) {
                scores[basilaWinner].details.basila = 1;
                scores[basilaWinner].total += 1;
            }
        }

        return scores;
    },

    /**
     * Calculate Basila score for a set of cards
     * Prime is the sum of the best card from each suit.
     */
    calculatePrimeScore: function(cards) {
        const bestPerSuit = {
            [this.SUITS.DINARI]: 0,
            [this.SUITS.KOBB]: 0,
            [this.SUITS.SBITA]: 0,
            [this.SUITS.JALLOU]: 0
        };

        cards.forEach(card => {
            const val = this.PRIME_VALUES[card.value] || 0;
            if (val > bestPerSuit[card.suit]) {
                bestPerSuit[card.suit] = val;
            }
        });

        return Object.values(bestPerSuit).reduce((a, b) => a + b, 0);
    }
};

if (typeof module !== 'undefined') {
    module.exports = ChkobbaLogic;
} else {
    window.ChkobbaLogic = ChkobbaLogic;
}

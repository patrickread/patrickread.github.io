document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let numPlayers = 0;
    let gridSize = 0;
    let currentPlayer = 0;
    let scores = [];
    let cards = [];
    let flippedCards = [];
    let canFlip = true;
    let remainingPairs = 0;

    // Player type variables
    let playerTypes = []; // 'human' or 'computer'
    let computerDifficulties = []; // 'easy', 'medium', or 'hard'
    let computerMemory = []; // For storing what the computer has seen
    let isComputerTurn = false;

    // Add a flag for computer-initiated flips
    let isComputerInitiatedFlip = false;

    // Add this to the game state variables
    let enablePoopCards = false;
    let poopCardIds = [];

    // Add a new game state variable
    let isBetweenTurns = false;

    // DOM elements
    const gameSetup = document.getElementById('game-setup');
    const gameBoard = document.getElementById('game-board');
    const gameOver = document.getElementById('game-over');
    const cardsGrid = document.getElementById('cards-grid');
    const currentPlayerDisplay = document.getElementById('current-player');
    const scoresDisplay = document.getElementById('scores');
    const finalScoresDisplay = document.getElementById('final-scores');
    const winnerDisplay = document.getElementById('winner');
    const playerButtons = document.querySelectorAll('.player-btn');
    const gridButtons = document.querySelectorAll('.grid-btn');
    const startGameButton = document.getElementById('start-game');
    const playAgainButton = document.getElementById('play-again');
    const playerTypesDiv = document.getElementById('player-types');
    const playerTypeControls = document.getElementById('player-type-controls');
    const poopCardsCheckbox = document.getElementById('enable-poop-cards');

    // Emoji set for card faces
    const emojis = [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
        '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
        '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
        '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
        '🐜', '🕷', '🦂', '🦀', '🐍', '🦎', '🦖', '🦕'
    ];

    // Player colors for score display
    const playerColors = ['#3498db', '#e74c3c', '#f39c12', '#9b59b6'];

    // Setup event listeners
    function setupEventListeners() {
        playerButtons.forEach(button => {
            button.addEventListener('click', () => {
                playerButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                numPlayers = parseInt(button.dataset.players);

                // Show player type selection if more than 1 player
                if (numPlayers > 1) {
                    setupPlayerTypeSelection();
                    playerTypesDiv.classList.remove('hidden');
                } else {
                    playerTypesDiv.classList.add('hidden');
                    playerTypes = ['human'];
                    computerDifficulties = [];
                }

                checkStartGameEnabled();
            });
        });

        gridButtons.forEach(button => {
            button.addEventListener('click', () => {
                gridButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                gridSize = parseInt(button.dataset.size);
                checkStartGameEnabled();
            });
        });

        startGameButton.addEventListener('click', startGame);
        playAgainButton.addEventListener('click', resetGame);

        poopCardsCheckbox.addEventListener('change', () => {
            enablePoopCards = poopCardsCheckbox.checked;
        });
    }

    // Setup player type selection UI
    function setupPlayerTypeSelection() {
        playerTypeControls.innerHTML = '';
        playerTypes = Array(numPlayers).fill('human');
        computerDifficulties = Array(numPlayers).fill('medium');

        // Create player type toggles for each player (except player 1)
        for (let i = 1; i < numPlayers; i++) {
            const playerRow = document.createElement('div');
            playerRow.className = 'player-type-row';

            const playerLabel = document.createElement('label');
            playerLabel.textContent = `Player ${i + 1}:`;
            playerRow.appendChild(playerLabel);

            const typeToggle = document.createElement('div');
            typeToggle.className = 'player-type-toggle';

            const humanBtn = document.createElement('button');
            humanBtn.textContent = 'Human';
            humanBtn.classList.add('selected');
            humanBtn.addEventListener('click', () => {
                humanBtn.classList.add('selected');
                computerBtn.classList.remove('selected');
                playerTypes[i] = 'human';
                difficultyDiv.classList.add('hidden');
            });

            const computerBtn = document.createElement('button');
            computerBtn.textContent = 'Computer';
            computerBtn.addEventListener('click', () => {
                computerBtn.classList.add('selected');
                humanBtn.classList.remove('selected');
                playerTypes[i] = 'computer';
                difficultyDiv.classList.remove('hidden');
            });

            typeToggle.appendChild(humanBtn);
            typeToggle.appendChild(computerBtn);
            playerRow.appendChild(typeToggle);

            // Computer difficulty selection - make sure it's hidden by default
            const difficultyDiv = document.createElement('div');
            difficultyDiv.className = 'computer-difficulty hidden';

            const difficulties = ['Easy', 'Medium', 'Hard'];
            const difficultyBtns = [];

            difficulties.forEach((diff, index) => {
                const btn = document.createElement('button');
                btn.textContent = diff;
                difficultyBtns.push(btn);

                // Add selected class to Medium by default
                if (diff.toLowerCase() === 'medium') {
                    btn.classList.add('selected');
                }

                btn.addEventListener('click', () => {
                    // Remove selected class from all difficulty buttons
                    difficultyBtns.forEach(b => b.classList.remove('selected'));
                    // Add selected class to clicked button
                    btn.classList.add('selected');
                    computerDifficulties[i] = diff.toLowerCase();
                });

                difficultyDiv.appendChild(btn);
            });

            playerRow.appendChild(difficultyDiv);
            playerTypeControls.appendChild(playerRow);
        }
    }

    // Check if start game button should be enabled
    function checkStartGameEnabled() {
        startGameButton.disabled = !(numPlayers > 0 && gridSize > 0);
    }

    // Start the game
    function startGame() {
        gameSetup.classList.add('hidden');
        gameBoard.classList.remove('hidden');

        // Initialize scores and computer memory
        scores = Array(numPlayers).fill(0);

        // Make sure playerTypes is properly initialized for all players
        if (playerTypes.length < numPlayers) {
            playerTypes = Array(numPlayers).fill('human');
            playerTypes[0] = 'human'; // First player is always human
        }

        // Initialize computer memory only for computer players
        computerMemory = Array(numPlayers).fill(null).map((_, i) =>
            playerTypes[i] === 'computer' ? {} : null
        );

        currentPlayer = 0;

        // Create cards
        createCards();

        // Update UI
        updateScoreDisplay();
        updateCurrentPlayerDisplay();

        // Check if first player is computer
        setTimeout(() => {
            checkAndPlayComputerTurn();
        }, 500);
    }

    // Create cards for the game
    function createCards() {
        cardsGrid.innerHTML = '';
        cardsGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

        const totalPairs = (gridSize * gridSize) / 2;
        remainingPairs = totalPairs;
        if (enablePoopCards) {
            remainingPairs = totalPairs - 1;
        }

        // Reset poop card IDs
        poopCardIds = [];

        // Select random emojis for this game
        const gameEmojis = [...emojis]
            .sort(() => 0.5 - Math.random())
            .slice(0, enablePoopCards ? totalPairs - 1 : totalPairs);

        // Create pairs
        let cardPairs = [...gameEmojis, ...gameEmojis];

        // Add poop cards if enabled
        if (enablePoopCards) {
            cardPairs.push('💩', '💩');
        }

        // Shuffle and create card objects
        cards = cardPairs
            .sort(() => 0.5 - Math.random())
            .map((emoji, index) => {
                const isPoop = emoji === '💩';
                if (isPoop) {
                    poopCardIds.push(index);
                }

                return {
                    id: index,
                    emoji: emoji,
                    isFlipped: false,
                    isMatched: false,
                    isPoop: isPoop
                };
            });

        // Create card elements
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.id = card.id;

            const cardFront = document.createElement('div');
            cardFront.className = 'card-face card-front';
            cardFront.textContent = card.emoji;

            const cardBack = document.createElement('div');
            cardBack.className = 'card-face card-back';

            cardElement.appendChild(cardFront);
            cardElement.appendChild(cardBack);

            cardElement.addEventListener('click', () => flipCard(card.id));

            cardsGrid.appendChild(cardElement);
        });

        // Initialize computer memory for all cards
        cards.forEach(card => {
            for (let i = 0; i < numPlayers; i++) {
                // Only initialize memory for computer players and make sure computerMemory[i] exists
                if (playerTypes[i] === 'computer' && computerMemory[i]) {
                    computerMemory[i][card.id] = null;
                }
            }
        });
    }

    // Check if current player is computer and play their turn
    function checkAndPlayComputerTurn() {
        if (currentPlayer < playerTypes.length && playerTypes[currentPlayer] === 'computer') {
            isComputerTurn = true;

            // Add a visual indicator that it's a computer's turn
            document.body.classList.add('computer-turn');

            // Add a slight delay before computer plays
            setTimeout(() => {
                playComputerTurn();
            }, 1000);
        } else {
            isComputerTurn = false;
            document.body.classList.remove('computer-turn');
        }
    }

    // Computer player's turn logic
    function playComputerTurn() {
        if (!canFlip || remainingPairs === 0) return;

        const difficulty = computerDifficulties[currentPlayer];
        const memory = computerMemory[currentPlayer];

        // Find all unmatched cards
        const unmatchedCards = cards.filter(card => !card.isMatched);

        // Check if we can make a match based on what we've seen
        let firstCardId = null;
        let secondCardId = null;

        // Try to find a match in memory (for medium and hard difficulties)
        if (difficulty !== 'easy') {
            // Create a map of emojis to card IDs
            const knownCards = {};

            // Populate the map with cards we've seen
            Object.entries(memory).forEach(([id, emoji]) => {
                if (emoji && !cards[id].isMatched) {
                    if (!knownCards[emoji]) {
                        knownCards[emoji] = [];
                    }
                    knownCards[emoji].push(parseInt(id));
                }
            });

            // Find a pair we know
            for (const [emoji, ids] of Object.entries(knownCards)) {
                if (ids.length >= 2) {
                    [firstCardId, secondCardId] = ids.slice(0, 2);
                    break;
                }
            }
        }

        // If we don't have a match in memory or we're on easy mode
        if (firstCardId === null) {
            // For the first card:
            // - Easy: Pick randomly
            // - Medium: Prefer unknown cards
            // - Hard: Pick strategically (known cards first if no match found)

            let availableFirstCards;

            if (difficulty === 'easy') {
                // Easy: Just pick randomly from unmatched cards
                availableFirstCards = unmatchedCards.filter(card => !card.isFlipped);
            } else if (difficulty === 'medium') {
                // Medium: Prefer unknown cards
                availableFirstCards = unmatchedCards.filter(
                    card => !card.isFlipped && memory[card.id] === null
                );

                // If no unknown cards, pick any unflipped card
                if (availableFirstCards.length === 0) {
                    availableFirstCards = unmatchedCards.filter(card => !card.isFlipped);
                }
            } else {
                // Hard: First try to pick a card we know but don't have a pair for
                const knownEmojis = new Set();
                const knownCardIds = new Set();

                // Find emojis we've seen exactly once
                Object.entries(memory).forEach(([id, emoji]) => {
                    if (emoji && !cards[parseInt(id)].isMatched) {
                        if (knownEmojis.has(emoji)) {
                            // We've seen this emoji before, so we have a pair
                            knownEmojis.delete(emoji);
                        } else {
                            knownEmojis.add(emoji);
                            knownCardIds.add(parseInt(id));
                        }
                    }
                });

                // If we have known cards without pairs, use those
                if (knownCardIds.size > 0) {
                    availableFirstCards = unmatchedCards.filter(
                        card => !card.isFlipped && knownCardIds.has(card.id)
                    );
                } else {
                    // Otherwise, prefer unknown cards
                    availableFirstCards = unmatchedCards.filter(
                        card => !card.isFlipped && memory[card.id] === null
                    );

                    // If no unknown cards, pick any unflipped card
                    if (availableFirstCards.length === 0) {
                        availableFirstCards = unmatchedCards.filter(card => !card.isFlipped);
                    }
                }
            }

            // If we have cards to choose from, pick one
            if (availableFirstCards.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableFirstCards.length);
                firstCardId = availableFirstCards[randomIndex].id;
            }
        }

        // If we found a first card
        if (firstCardId !== null) {
            // When flipping cards, set the flag
            isComputerInitiatedFlip = true;
            flipCard(firstCardId);

            setTimeout(() => {
                if (secondCardId !== null) {
                    flipCard(secondCardId);
                } else {
                    // For the second card:
                    // - Easy: Pick randomly
                    // - Medium/Hard: Check if we know a match, otherwise pick strategically

                    const firstCardEmoji = cards.find(card => card.id === firstCardId).emoji;
                    let matchingCardId = null;

                    // For medium and hard, check if we know a matching card
                    if (difficulty !== 'easy') {
                        // Look for a matching card in memory
                        Object.entries(memory).forEach(([id, emoji]) => {
                            const idNum = parseInt(id);
                            if (emoji === firstCardEmoji && idNum !== firstCardId && !cards[idNum].isMatched && !cards[idNum].isFlipped) {
                                // Medium has faulty recall, only 50% chance to recall
                                if (difficulty === 'medium') {
                                    if (Math.random() < 0.5) {
                                        matchingCardId = idNum;
                                    }
                                } else {
                                    matchingCardId = idNum;
                                }
                            }
                        });
                    }

                    // If we found a match in memory, use it
                    if (matchingCardId !== null) {
                        flipCard(matchingCardId);
                    } else {
                        // Otherwise, pick another card
                        const availableSecondCards = unmatchedCards.filter(
                            card => !card.isFlipped && card.id !== firstCardId
                        );

                        if (availableSecondCards.length > 0) {
                            const randomIndex = Math.floor(Math.random() * availableSecondCards.length);
                            flipCard(availableSecondCards[randomIndex].id);
                        }
                    }
                }
                isComputerInitiatedFlip = false;
            }, 1000);
        }
    }

    // Flip a card
    function flipCard(id) {
        const card = cards.find(card => card.id === id);

        // Check if card can be flipped
        if (!canFlip || card.isFlipped || card.isMatched || isBetweenTurns) {
            return;
        }

        // Prevent human players from flipping cards during computer turns
        if (isComputerTurn && !isComputerInitiatedFlip) {
            return;
        }

        // Flip the card
        card.isFlipped = true;
        const cardElement = document.querySelector(`.card[data-id="${id}"]`);
        cardElement.classList.add('flipped');

        // Add to flipped cards
        flippedCards.push(card);

        // Update computer memory with the card's emoji
        if (currentPlayer < playerTypes.length && playerTypes[currentPlayer] === 'computer') {
            computerMemory[currentPlayer][id] = card.emoji;
        }

        // For all computer players, remember this card
        for (let i = 0; i < numPlayers; i++) {
            if (playerTypes[i] === 'computer') {
                // Hard difficulty remembers all cards
                // Medium has 50% chance to remember
                // Easy has 40% chance to remember
                let rememberChance;
                switch (computerDifficulties[i]) {
                    case 'hard': rememberChance = 1; break;
                    case 'medium': rememberChance = 0.5; break;
                    default: rememberChance = 0.4;
                }

                if (Math.random() < rememberChance) {
                    computerMemory[i][id] = card.emoji;
                }
            }
        }

        // Check if it's a poop card
        if (card.isPoop) {
            // Handle poop card after a short delay
            setTimeout(() => {
                handlePoopCard(card);
            }, 1000);
            return;
        }

        // Check if two cards are flipped
        if (flippedCards.length === 2) {
            canFlip = false;
            checkForMatch();
        }
    }

    // Check if the two flipped cards match
    function checkForMatch() {
        const [card1, card2] = flippedCards;

        setTimeout(() => {
            if (card1.emoji === card2.emoji) {
                // Match found
                handleMatch(card1, card2);
            } else {
                // No match
                handleNoMatch(card1, card2);
            }

            // Clear flipped cards
            flippedCards = [];
            canFlip = true;

            // Check if game is over
            if (remainingPairs === 0) {
                endGame();
            }
        }, 2000);
    }

    // Handle matching cards
    function handleMatch(card1, card2) {
        // Set between turns flag to prevent interaction
        isBetweenTurns = true;

        card1.isMatched = true;
        card2.isMatched = true;

        document.querySelector(`.card[data-id="${card1.id}"]`).classList.add('matched');
        document.querySelector(`.card[data-id="${card2.id}"]`).classList.add('matched');

        // Update score
        scores[currentPlayer]++;
        updateScoreDisplay();

        // Trigger confetti animation
        triggerConfetti();

        remainingPairs--;

        // Check if next player is computer
        setTimeout(() => {
            // Reset between turns flag
            isBetweenTurns = false;

            isComputerInitiatedFlip = false;
            checkAndPlayComputerTurn();
        }, 1000);
    }

    // Add this new function for confetti
    function triggerConfetti() {
        // Get the player's color for the confetti
        const playerColor = playerColors[currentPlayer];

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: [playerColor, '#ffffff', '#2ecc71'],
            disableForReducedMotion: true
        });
    }

    // Handle non-matching cards
    function handleNoMatch(card1, card2) {
        isBetweenTurns = true;
        document.body.classList.add('between-turns');

        card1.isFlipped = false;
        card2.isFlipped = false;

        document.querySelector(`.card[data-id="${card1.id}"]`).classList.remove('flipped');
        document.querySelector(`.card[data-id="${card2.id}"]`).classList.remove('flipped');

        // Next player's turn
        currentPlayer = (currentPlayer + 1) % numPlayers;
        updateCurrentPlayerDisplay();

        // Check if next player is computer
        setTimeout(() => {
            // Reset between turns flag
            isBetweenTurns = false;
            document.body.classList.remove('between-turns');

            isComputerInitiatedFlip = false;
            checkAndPlayComputerTurn();
        }, 1000);
    }

    // Update the score display
    function updateScoreDisplay() {
        scoresDisplay.innerHTML = '';

        scores.forEach((score, index) => {
            const playerScore = document.createElement('div');
            playerScore.className = 'player-score';
            if (index === currentPlayer) {
                playerScore.classList.add('active-player');
            }
            playerScore.style.backgroundColor = playerColors[index];

            // Add indicator if player is computer with difficulty level
            let playerLabel = `Player ${index + 1}`;
            if (playerTypes[index] === 'computer') {
                // Capitalize first letter of difficulty
                const difficulty = computerDifficulties[index].charAt(0).toUpperCase() +
                    computerDifficulties[index].slice(1);
                playerLabel += ` (CPU-${difficulty})`;
            }

            playerScore.textContent = `${playerLabel}: ${score}`;
            scoresDisplay.appendChild(playerScore);
        });
    }

    // Update current player display
    function updateCurrentPlayerDisplay() {
        let playerLabel = `Player ${currentPlayer + 1}`;
        if (playerTypes[currentPlayer] === 'computer') {
            // Capitalize first letter of difficulty
            const difficulty = computerDifficulties[currentPlayer].charAt(0).toUpperCase() +
                computerDifficulties[currentPlayer].slice(1);
            playerLabel += ` (CPU-${difficulty})`;
        }

        currentPlayerDisplay.textContent = `${playerLabel}'s Turn`;
        currentPlayerDisplay.style.color = playerColors[currentPlayer];

        // Update active player in score display
        const playerScores = document.querySelectorAll('.player-score');
        playerScores.forEach((score, index) => {
            if (index === currentPlayer) {
                score.classList.add('active-player');
            } else {
                score.classList.remove('active-player');
            }
        });
    }

    // End the game
    function endGame() {
        gameBoard.classList.add('hidden');
        gameOver.classList.remove('hidden');

        // Display final scores
        finalScoresDisplay.innerHTML = '';
        scores.forEach((score, index) => {
            const playerScore = document.createElement('div');

            // Add player type and difficulty to final scores
            let playerLabel = `Player ${index + 1}`;
            if (playerTypes[index] === 'computer') {
                const difficulty = computerDifficulties[index].charAt(0).toUpperCase() +
                    computerDifficulties[index].slice(1);
                playerLabel += ` (CPU-${difficulty})`;
            }

            playerScore.textContent = `${playerLabel}: ${score} pairs`;
            playerScore.style.color = playerColors[index];
            finalScoresDisplay.appendChild(playerScore);
        });

        // Determine winner
        const maxScore = Math.max(...scores);
        const winners = scores
            .map((score, index) => ({ score, player: index + 1, type: playerTypes[index], difficulty: computerDifficulties[index] }))
            .filter(player => player.score === maxScore);

        if (winners.length === 1) {
            let winnerText = `Player ${winners[0].player}`;
            if (winners[0].type === 'computer') {
                const difficulty = winners[0].difficulty.charAt(0).toUpperCase() +
                    winners[0].difficulty.slice(1);
                winnerText += ` (CPU-${difficulty})`;
            }
            winnerDisplay.textContent = `${winnerText} wins!`;
            winnerDisplay.style.color = playerColors[winners[0].player - 1];
        } else {
            winnerDisplay.textContent = "It's a tie!";
            winnerDisplay.style.color = '#2c3e50';
        }
    }

    // Reset the game
    function resetGame() {
        gameOver.classList.add('hidden');
        gameSetup.classList.remove('hidden');

        // Reset selections
        playerButtons.forEach(btn => btn.classList.remove('selected'));
        gridButtons.forEach(btn => btn.classList.remove('selected'));

        numPlayers = 0;
        gridSize = 0;
        playerTypes = [];
        computerDifficulties = [];
        startGameButton.disabled = true;
        playerTypesDiv.classList.add('hidden');
    }

    // Add a new function to handle poop cards
    function handlePoopCard(card) {
        // Set between turns flag to prevent interaction
        isBetweenTurns = true;

        // Mark the poop card as matched so it stays face up but is disabled
        card.isMatched = true;
        const cardElement = document.querySelector(`.card[data-id="${card.id}"]`);
        cardElement.classList.add('poop-card');

        // Show a message
        const poopMessage = document.createElement('div');
        poopMessage.className = 'poop-message';
        poopMessage.textContent = `Oh no! ${playerTypes[currentPlayer] === 'computer' ? 'CPU' : 'Player'} ${currentPlayer + 1} stepped in poop! Skip turn!`;
        document.body.appendChild(poopMessage);

        // Remove the message after a delay
        setTimeout(() => {
            document.body.removeChild(poopMessage);

            // Clear flipped cards
            flippedCards = flippedCards.filter(c => c.id !== card.id);

            // Move to next player
            currentPlayer = (currentPlayer + 1) % numPlayers;
            updateCurrentPlayerDisplay();

            // Re-enable card flipping
            canFlip = true;

            // Reset between turns flag
            isBetweenTurns = false;

            // Check if next player is computer
            setTimeout(() => {
                isComputerInitiatedFlip = false;
                checkAndPlayComputerTurn();
            }, 500);
        }, 2000);
    }

    // Initialize the game
    setupEventListeners();
});

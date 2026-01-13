import { MESSAGES } from '../lang/messages/en/user.js';

/**
 * Represents an individual Memory Button component.
 */
class MemoryButton {
    /**
     * @param {string} id - Unique identifier for the element.
     * @param {string} color - Hex or CSS color string for background.
     * @param {number} originalOrder - The correct sequence number (1-n).
     */
    constructor(id, color, originalOrder) {
        this.id = id;
        this.color = color;
        this.order = originalOrder;
        this.element = this.createHTMLElement();
    }
    /**
     * Creates and configures the DOM button element.
     * @returns {HTMLButtonElement}
     */
    createHTMLElement() {
        const btn = document.createElement('button');
        btn.className = 'memory-button';
        btn.style.backgroundColor = this.color;
        btn.textContent = this.order;
        return btn;
    }
    /**
     * Updates the absolute position of the button on the screen.
     * @param {number} x - Horizontal coordinate in pixels.
     * @param {number} y - Vertical coordinate in pixels.
     */
    setPosition(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }
    /**
     * Controls the visibility of the number on the button.
     * @param {boolean} show - True to reveal the number, false to hide.
     */
    showNumber(show) {
        this.element.textContent = show ? this.order : "";
    }
    /**
     * Attaches a click event listener and makes the button interactive.
     * @param {Function} callback - Function to execute when clicked.
     */
    enableClick(callback) {
        this.element.onclick = () => callback(this);
    }
    /**
     * Removes click event listener to prevent interaction during scrambling.
     */
    disableClick() {
        this.element.onclick = null;
    }
}

/**
 * Handles all UI interactions, labels, and inputs.
 */
class UIHandler {
    /**
     * @param {string} containerId - ID of the div for controls.
     * @param {string} messageId - ID of the div for game feedback.
     * @param {Function} onGoCallback - Callback triggered when "Go" is clicked.
     */
    constructor(containerId, messageId, onGoCallback) {
        this.container = document.getElementById(containerId);
        this.messageDisplay = document.getElementById(messageId);
        this.init(onGoCallback);
    }
    /**
     * Builds the input field and "Go" button dynamically.
     */
    init(callback) {
        const label = document.createElement('label');
        label.textContent = MESSAGES.inputLabel;
        
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.min = 3;
        this.input.max = 7;
        
        const goBtn = document.createElement('button');
        goBtn.textContent = MESSAGES.goButton;
        // Validation logic: checks if n is between 3 and 7
        goBtn.onclick = () => {
            const val = parseInt(this.input.value);
            if (val >= 3 && val <= 7) {
                this.displayStatus("");
                callback(val);
            } else {
                this.displayStatus(MESSAGES.invalidInput);
            }
        };

        this.container.appendChild(label);
        this.container.appendChild(this.input);
        this.container.appendChild(goBtn);
    }
    /**
     * Updates the message text displayed to the user.
     * @param {string} msg 
     */
    displayStatus(msg) {
        this.messageDisplay.textContent = msg;
    }
}

/**
 * Main Engine controlling game state, scrambling, and logic.
 */
class GameEngine {
    constructor() {
        this.buttons = [];
        this.gameArea = document.getElementById('game-area');
        this.ui = new UIHandler('ui-container', 'message-display', (n) => this.startGame(n));
        this.expectedOrder = 1;
        this.isScrambling = false;
    }
    /**
     * Sets up the game sequence.
     * @param {number} n - Number of buttons requested by the user.
     */
    startGame(n) {
        this.resetGame();
        this.generateButtons(n);
        
        // Phase 1: Pause for n seconds to let user memorize
        setTimeout(() => {
            this.scrambleSequence(n, n);
        }, n * 1000);
    }
    /**
     * Clears existing game data and UI to start fresh.
     */
    resetGame() {
        this.gameArea.innerHTML = "";
        this.buttons = [];
        this.expectedOrder = 1;
        this.isScrambling = false;
    }
    /**
     * Creates n instances of MemoryButton and adds them to the DOM in a row.
     */
    generateButtons(n) {
        for (let i = 1; i <= n; i++) {
            const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
            const btn = new MemoryButton(`btn-${i}`, randomColor, i);
            this.buttons.push(btn);
            this.gameArea.appendChild(btn.element);
            
            // Initial row placement (simple CSS handles the row flow initially via default positioning)
            // But we set them relative to the window for consistent behavior
            btn.element.style.position = 'relative';
            btn.element.style.display = 'inline-flex';
            btn.element.style.marginRight = '5px';
        }
    }
    /**
     * Recursive function that moves buttons to random locations n times.
     * @param {number} n - Total number of moves.
     * @param {number} remaining - Count of moves left in sequence.
     */
    scrambleSequence(n, remaining) {
        if (remaining <= 0) {
            this.prepareForUser();
            return;
        }

        this.isScrambling = true;
        this.buttons.forEach(btn => {
            // Switch to absolute positioning for random movement
            btn.element.style.position = 'absolute';
            const pos = this.getRandomPosition();
            btn.setPosition(pos.x, pos.y);
        });
        // Interval of 2 seconds between moves
        setTimeout(() => {
            this.scrambleSequence(n, remaining - 1);
        }, 2000);
    }
    /**
     * Calculates a random (x, y) coordinate that keeps the button 
     * inside the current window boundaries.
     * @returns {Object} {x, y} coordinates.
     */
    getRandomPosition() {
        // Dimensions based on CSS: 10em x 5em (approx 160x80 pixels)
        const btnWidth = 160; // 10em * 16px
        const btnHeight = 80; // 5em * 16px
        
        // Reading browser sizes immediately before calculation
        const maxX = window.innerWidth - btnWidth;
        const maxY = window.innerHeight - btnHeight;
        // Ensure buttons don't land outside the window
        const randomX = Math.max(0, Math.floor(Math.random() * maxX));
        const randomY = Math.max(0, Math.floor(Math.random() * maxY));

        return { x: randomX, y: randomY };
    }
    /**
     * Finalizes scrambling, hides numbers, and enables user clicks.
     */
    prepareForUser() {
        this.isScrambling = false;
        this.buttons.forEach(btn => {
            btn.showNumber(false);
            btn.enableClick((clickedBtn) => this.handleButtonClick(clickedBtn));
        });
    }
    /**
     * Evaluates if the user clicked the correct button in sequence.
     * @param {MemoryButton} btn - The button object that was clicked.
     */
    handleButtonClick(btn) {
        // Prevent interaction during movement phases
        if (this.isScrambling) return;

        if (btn.order === this.expectedOrder) {
            // Correct click: Reveal number and lock the button
            btn.showNumber(true);
            btn.disableClick();
            if (this.expectedOrder === this.buttons.length) {
                this.ui.displayStatus(MESSAGES.excellentMemory);
            }
            this.expectedOrder++;
        } else {
            // Wrong click: Game Over logic
            this.ui.displayStatus(MESSAGES.wrongOrder);
            this.revealAll();
        }
    }
    /**
     * Ends the game and reveals the correct numbers for all buttons.
     */
    revealAll() {
        this.buttons.forEach(btn => {
            btn.showNumber(true);
            btn.disableClick();
        });
    }
}

// Instantiate the game
const game = new GameEngine();
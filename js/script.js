import { MESSAGES } from '../lang/messages/en/user.js';

/**
 * Represents an individual Memory Button component.
 */
class MemoryButton {
    constructor(id, color, originalOrder) {
        this.id = id;
        this.color = color;
        this.order = originalOrder;
        this.element = this.createHTMLElement();
    }

    createHTMLElement() {
        const btn = document.createElement('button');
        btn.className = 'memory-button';
        btn.style.backgroundColor = this.color;
        btn.textContent = this.order;
        return btn;
    }

    setPosition(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    showNumber(show) {
        this.element.textContent = show ? this.order : "";
    }

    enableClick(callback) {
        this.element.onclick = () => callback(this);
    }

    disableClick() {
        this.element.onclick = null;
    }
}

/**
 * Handles all UI interactions, labels, and inputs.
 */
class UIHandler {
    constructor(containerId, messageId, onGoCallback) {
        this.container = document.getElementById(containerId);
        this.messageDisplay = document.getElementById(messageId);
        this.init(onGoCallback);
    }

    init(callback) {
        const label = document.createElement('label');
        label.textContent = MESSAGES.inputLabel;
        
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.min = 3;
        this.input.max = 7;

        const goBtn = document.createElement('button');
        goBtn.textContent = MESSAGES.goButton;
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

    startGame(n) {
        this.resetGame();
        this.generateButtons(n);
        
        // Initial pause: n seconds
        setTimeout(() => {
            this.scrambleSequence(n, n);
        }, n * 1000);
    }

    resetGame() {
        this.gameArea.innerHTML = "";
        this.buttons = [];
        this.expectedOrder = 1;
        this.isScrambling = false;
    }

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

    scrambleSequence(n, remaining) {
        if (remaining <= 0) {
            this.prepareForUser();
            return;
        }

        this.isScrambling = true;
        this.buttons.forEach(btn => {
            btn.element.style.position = 'absolute';
            const pos = this.getRandomPosition();
            btn.setPosition(pos.x, pos.y);
        });

        setTimeout(() => {
            this.scrambleSequence(n, remaining - 1);
        }, 2000);
    }

    getRandomPosition() {
        const btnWidth = 160; // 10em * 16px
        const btnHeight = 80; // 5em * 16px
        
        // Reading browser sizes immediately before calculation
        const maxX = window.innerWidth - btnWidth;
        const maxY = window.innerHeight - btnHeight;

        const randomX = Math.max(0, Math.floor(Math.random() * maxX));
        const randomY = Math.max(0, Math.floor(Math.random() * maxY));

        return { x: randomX, y: randomY };
    }

    prepareForUser() {
        this.isScrambling = false;
        this.buttons.forEach(btn => {
            btn.showNumber(false);
            btn.enableClick((clickedBtn) => this.handleButtonClick(clickedBtn));
        });
    }

    handleButtonClick(btn) {
        if (this.isScrambling) return;

        if (btn.order === this.expectedOrder) {
            btn.showNumber(true);
            btn.disableClick();
            if (this.expectedOrder === this.buttons.length) {
                this.ui.displayStatus(MESSAGES.excellentMemory);
            }
            this.expectedOrder++;
        } else {
            this.ui.displayStatus(MESSAGES.wrongOrder);
            this.revealAll();
        }
    }

    revealAll() {
        this.buttons.forEach(btn => {
            btn.showNumber(true);
            btn.disableClick();
        });
    }
}

// Instantiate the game
const game = new GameEngine();
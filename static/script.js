/**
 * Modern Calculator JavaScript
 * Handles user interactions, calculations, and API communication
 */

class Calculator {
    constructor() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.shouldResetDisplay = false;
        
        // DOM elements
        this.mainDisplay = document.getElementById('main-display');
        this.secondaryDisplay = document.getElementById('secondary-display');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.statusContainer = document.getElementById('status-container');
        this.statusMessage = document.getElementById('status-message');
        
        // Initialize calculator
        this.init();
    }
    
    init() {
        this.attachEventListeners();
        this.attachKeyboardListeners();
        this.updateDisplay();
        this.showStatus('Calculator ready', 'success');
        
        // Test API connection
        this.testConnection();
    }
    
    attachEventListeners() {
        // Number buttons
        document.querySelectorAll('[data-number]').forEach(button => {
            button.addEventListener('click', () => {
                this.inputNumber(button.dataset.number);
            });
        });
        
        // Operator buttons
        document.querySelectorAll('[data-operator]').forEach(button => {
            button.addEventListener('click', () => {
                this.inputOperator(button.dataset.operator);
            });
        });
        
        // Action buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                this.handleAction(button.dataset.action);
            });
        });
    }
    
    attachKeyboardListeners() {
        document.addEventListener('keydown', (event) => {
            const key = event.key;
            
            // Prevent default for calculator keys
            if (/[0-9+\-*/=.cC]/.test(key) || key === 'Enter' || key === 'Escape' || key === 'Backspace') {
                event.preventDefault();
            }
            
            // Number keys
            if (/[0-9]/.test(key)) {
                this.inputNumber(key);
            }
            // Operator keys
            else if (key === '+') {
                this.inputOperator('+');
            }
            else if (key === '-') {
                this.inputOperator('-');
            }
            else if (key === '*') {
                this.inputOperator('*');
            }
            else if (key === '/') {
                this.inputOperator('/');
            }
            // Decimal point
            else if (key === '.') {
                this.handleAction('decimal');
            }
            // Calculate
            else if (key === 'Enter' || key === '=') {
                this.handleAction('calculate');
            }
            // Clear
            else if (key === 'Escape' || key.toLowerCase() === 'c') {
                this.handleAction('clear-all');
            }
            // Backspace
            else if (key === 'Backspace') {
                this.handleAction('backspace');
            }
        });
    }
    
    inputNumber(number) {
        if (this.waitingForOperand || this.shouldResetDisplay) {
            this.currentInput = number;
            this.waitingForOperand = false;
            this.shouldResetDisplay = false;
        } else {
            this.currentInput = this.currentInput === '0' ? number : this.currentInput + number;
        }
        
        this.updateDisplay();
    }
    
    inputOperator(nextOperator) {
        const inputValue = parseFloat(this.currentInput);
        
        if (this.previousInput === '') {
            this.previousInput = inputValue;
        } else if (this.operator) {
            const currentValue = this.previousInput || 0;
            const newValue = this.performCalculation();
            
            if (newValue !== null) {
                this.currentInput = String(newValue);
                this.previousInput = newValue;
            }
        }
        
        this.waitingForOperand = true;
        this.operator = nextOperator;
        this.updateSecondaryDisplay();
        this.updateDisplay();
        this.highlightOperator(nextOperator);
    }
    
    async handleAction(action) {
        switch (action) {
            case 'calculate':
                await this.calculate();
                break;
            case 'clear-all':
                this.clearAll();
                break;
            case 'clear-entry':
                this.clearEntry();
                break;
            case 'decimal':
                this.inputDecimal();
                break;
            case 'backspace':
                this.backspace();
                break;
        }
    }
    
    async calculate() {
        if (this.operator && this.previousInput !== '' && !this.waitingForOperand) {
            this.showLoading(true);
            
            try {
                const result = await this.apiCalculate(
                    this.previousInput,
                    this.operator,
                    parseFloat(this.currentInput)
                );
                
                if (result.success) {
                    this.currentInput = String(result.result);
                    this.previousInput = '';
                    this.operator = null;
                    this.waitingForOperand = true;
                    this.shouldResetDisplay = true;
                    this.updateDisplay();
                    this.updateSecondaryDisplay();
                    this.clearOperatorHighlight();
                    this.showStatus('Calculation completed', 'success');
                } else {
                    this.showError(result.error || 'Calculation failed');
                }
            } catch (error) {
                this.showError('Network error: ' + error.message);
            } finally {
                this.showLoading(false);
            }
        }
    }
    
    performCalculation() {
        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        
        if (isNaN(prev) || isNaN(current)) return null;
        
        switch (this.operator) {
            case '+':
                return prev + current;
            case '-':
                return prev - current;
            case '*':
                return prev * current;
            case '/':
                if (current === 0) {
                    this.showError('Division by zero');
                    return null;
                }
                return prev / current;
            default:
                return current;
        }
    }
    
    clearAll() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.shouldResetDisplay = false;
        this.updateDisplay();
        this.updateSecondaryDisplay();
        this.clearOperatorHighlight();
        this.showStatus('Calculator cleared', 'success');
    }
    
    clearEntry() {
        this.currentInput = '0';
        this.updateDisplay();
        this.showStatus('Entry cleared', 'success');
    }
    
    inputDecimal() {
        if (this.waitingForOperand || this.shouldResetDisplay) {
            this.currentInput = '0.';
            this.waitingForOperand = false;
            this.shouldResetDisplay = false;
        } else if (this.currentInput.indexOf('.') === -1) {
            this.currentInput += '.';
        }
        
        this.updateDisplay();
    }
    
    backspace() {
        if (this.currentInput !== '0' && this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.mainDisplay.textContent = this.formatNumber(this.currentInput);
        this.mainDisplay.classList.remove('error');
    }
    
    updateSecondaryDisplay() {
        if (this.operator && this.previousInput !== '') {
            const operatorSymbol = this.getOperatorSymbol(this.operator);
            this.secondaryDisplay.textContent = `${this.formatNumber(this.previousInput)} ${operatorSymbol}`;
        } else {
            this.secondaryDisplay.textContent = '';
        }
    }
    
    formatNumber(number) {
        const num = parseFloat(number);
        if (isNaN(num)) return number;
        
        // Handle very large or very small numbers
        if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
            return num.toExponential(5);
        }
        
        // Format with appropriate decimal places
        const formatted = num.toString();
        
        // Add commas for large numbers
        if (Math.abs(num) >= 1000 && !formatted.includes('e')) {
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        }
        
        return formatted;
    }
    
    getOperatorSymbol(operator) {
        const symbols = {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷'
        };
        return symbols[operator] || operator;
    }
    
    highlightOperator(operator) {
        this.clearOperatorHighlight();
        const button = document.querySelector(`[data-operator="${operator}"]`);
        if (button) {
            button.classList.add('active');
        }
    }
    
    clearOperatorHighlight() {
        document.querySelectorAll('[data-operator]').forEach(button => {
            button.classList.remove('active');
        });
    }
    
    async apiCalculate(num1, operator, num2) {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                num1: num1,
                operator: operator,
                num2: num2
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async testConnection() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                console.log('Calculator API connection successful');
            }
        } catch (error) {
            console.error('API connection test failed:', error);
            this.showError('Unable to connect to calculator service');
        }
    }
    
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.add('show');
        } else {
            this.loadingOverlay.classList.remove('show');
        }
    }
    
    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.classList.add('show');
        
        setTimeout(() => {
            this.statusMessage.classList.remove('show');
        }, 3000);
    }
    
    showError(message) {
        this.mainDisplay.textContent = 'Error';
        this.mainDisplay.classList.add('error');
        this.showStatus(message, 'error');
        
        // Reset after showing error
        setTimeout(() => {
            this.clearAll();
        }, 2000);
    }
}

// Animation utilities
function addButtonPressEffect() {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = '';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    });
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Python Calculator...');
    
    // Create calculator instance
    const calculator = new Calculator();
    
    // Add button press effects
    addButtonPressEffect();
    
    // Add welcome message
    setTimeout(() => {
        calculator.showStatus('Welcome to Python Calculator! Ready for calculations.', 'success');
    }, 1000);
    
    console.log('Calculator initialized successfully');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Calculator page is now visible');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Calculator is back online');
});

window.addEventListener('offline', () => {
    console.log('Calculator is offline');
});
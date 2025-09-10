#!/usr/bin/env python3
"""
Python Flask Calculator Web Application
Modern calculator with responsive design and REST API
"""

from flask import Flask, render_template, request, jsonify
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask application
app = Flask(__name__)

class Calculator:
    """Calculator class with basic arithmetic operations"""
    
    @staticmethod
    def add(a, b):
        """Addition operation"""
        return float(a) + float(b)
    
    @staticmethod
    def subtract(a, b):
        """Subtraction operation"""
        return float(a) - float(b)
    
    @staticmethod
    def multiply(a, b):
        """Multiplication operation"""
        return float(a) * float(b)
    
    @staticmethod
    def divide(a, b):
        """Division operation with zero check"""
        if float(b) == 0:
            raise ValueError("Division by zero is not allowed")
        return float(a) / float(b)
    
    @staticmethod
    def calculate(num1, operator, num2):
        """
        Perform calculation based on operator
        
        Args:
            num1: First number
            operator: Mathematical operator (+, -, *, /)
            num2: Second number
            
        Returns:
            Result of the calculation
            
        Raises:
            ValueError: For invalid operations or division by zero
        """
        operations = {
            '+': Calculator.add,
            '-': Calculator.subtract,
            '*': Calculator.multiply,
            '×': Calculator.multiply,  # Alternative multiplication symbol
            '/': Calculator.divide,
            '÷': Calculator.divide     # Alternative division symbol
        }
        
        if operator not in operations:
            raise ValueError(f"Invalid operator: {operator}")
        
        return operations[operator](num1, num2)

@app.route('/')
def index():
    """Serve the main calculator page"""
    return render_template('index.html')

@app.route('/api/calculate', methods=['POST'])
def api_calculate():
    """
    API endpoint for calculator operations
    
    Expected JSON payload:
    {
        "num1": number,
        "operator": string,
        "num2": number
    }
    
    Returns:
    {
        "result": number,
        "success": boolean,
        "error": string (if error occurs)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['num1', 'operator', 'num2']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        num1 = data['num1']
        operator = data['operator']
        num2 = data['num2']
        
        # Validate numbers
        try:
            float(num1)
            float(num2)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid number format'
            }), 400
        
        # Perform calculation
        result = Calculator.calculate(num1, operator, num2)
        
        # Format result to avoid floating point precision issues
        if result == int(result):
            result = int(result)
        else:
            result = round(result, 10)  # Limit to 10 decimal places
        
        logger.info(f"Calculation: {num1} {operator} {num2} = {result}")
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except ValueError as e:
        logger.error(f"Calculation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred'
        }), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Calculator API is running'
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 8000
    port = int(os.environ.get('PORT', 8000))
    
    # Run the Flask application
    print(f"Starting Calculator App on port {port}")
    print(f"Open your browser to http://localhost:{port}")
    
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=port,
        debug=True,      # Enable debug mode for development
        threaded=True    # Enable threading for better performance
    )
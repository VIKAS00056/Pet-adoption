// Validation utilities for email and mobile number

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mobile number validation regex (accepts various formats)
// Accepts: +1 234 567 8900, (123) 456-7890, 123-456-7890, 1234567890, +91 98765 43210, etc.
const mobileRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

// Validate email format (exposed globally)
window.validateEmail = function(email) {
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true };
};

// Validate mobile number format (exposed globally)
window.validateMobile = function(mobile) {
  // Mobile is optional, so empty is valid
  if (!mobile || !mobile.trim()) {
    return { valid: true };
  }
  
  // Remove spaces, dashes, parentheses, and plus signs for validation
  const cleaned = mobile.replace(/[\s\-\(\)\+]/g, '');
  
  // Check if it contains only digits and has reasonable length (7-15 digits)
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, message: 'Mobile number should contain only digits and common formatting characters' };
  }
  
  if (cleaned.length < 7 || cleaned.length > 15) {
    return { valid: false, message: 'Mobile number should be between 7 and 15 digits' };
  }
  
  // Check against regex pattern
  if (!mobileRegex.test(mobile.trim())) {
    return { valid: false, message: 'Please enter a valid mobile number (e.g., +1 234 567 8900)' };
  }
  
  return { valid: true };
}

// Add real-time validation to an input field
function addInputValidation(input, validator, errorMessageEl) {
  if (!input) return;
  
  // Create error message element if it doesn't exist
  if (!errorMessageEl) {
    errorMessageEl = document.createElement('span');
    errorMessageEl.className = 'field-error';
    errorMessageEl.style.display = 'block';
    errorMessageEl.style.color = '#b00020';
    errorMessageEl.style.fontSize = '12px';
    errorMessageEl.style.marginTop = '4px';
    input.parentNode.appendChild(errorMessageEl);
  }
  
  function validate() {
    const value = input.value;
    const result = validator(value);
    
    if (result.valid) {
      input.style.borderColor = '#ddd';
      errorMessageEl.textContent = '';
      errorMessageEl.style.display = 'none';
      return true;
    } else {
      input.style.borderColor = '#b00020';
      errorMessageEl.textContent = result.message || 'Invalid input';
      errorMessageEl.style.display = 'block';
      return false;
    }
  }
  
  // Validate on blur (when user leaves the field)
  input.addEventListener('blur', validate);
  
  // Also validate on input for better UX (optional - can be removed if too aggressive)
  input.addEventListener('input', function() {
    if (input.value.trim()) {
      validate();
    } else {
      // Clear error if field is empty (for optional fields)
      input.style.borderColor = '#ddd';
      errorMessageEl.textContent = '';
      errorMessageEl.style.display = 'none';
    }
  });
  
  return validate;
}

// Initialize validation for all email and mobile fields
document.addEventListener('DOMContentLoaded', function() {
  // Validate all email fields
  document.querySelectorAll('input[type="email"]').forEach(function(emailInput) {
    addInputValidation(emailInput, window.validateEmail);
  });
  
  // Validate all mobile/tel fields
  document.querySelectorAll('input[type="tel"]').forEach(function(mobileInput) {
    addInputValidation(mobileInput, window.validateMobile);
  });
});


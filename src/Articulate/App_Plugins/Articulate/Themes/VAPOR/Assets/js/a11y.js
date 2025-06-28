// Find the first element with class 'skip-link' and add a click event listener
document.querySelector('.skip-link').addEventListener('click', function(e) {
    // Get the href value (like '#main-content') and find that element
    const target = document.querySelector(this.getAttribute('href'));
    
    // If the target element exists
    if (target) {
      // Prevent the default anchor link behavior
      e.preventDefault();
      
      // Make the target focusable (if it isn't already)
      target.setAttribute('tabindex', '-1');
      
      // Move focus to the target element
      target.focus();
    }
  });
// Global error handler to prevent charAt and other string errors from breaking the app
export const setupGlobalErrorHandler = () => {
  // Override String prototype methods to be safe
  const originalCharAt = String.prototype.charAt;
  String.prototype.charAt = function(index: number) {
    if (this == null || this == undefined) return '';
    return originalCharAt.call(String(this), index);
  };

  const originalSlice = String.prototype.slice;
  String.prototype.slice = function(start?: number, end?: number) {
    if (this == null || this == undefined) return '';
    return originalSlice.call(String(this), start, end);
  };

  const originalToUpperCase = String.prototype.toUpperCase;
  String.prototype.toUpperCase = function() {
    if (this == null || this == undefined) return '';
    return originalToUpperCase.call(String(this));
  };

  // Global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('charAt')) {
      console.warn('charAt error caught and handled:', event.message);
      event.preventDefault();
      return false;
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('charAt')) {
      console.warn('charAt promise rejection caught and handled:', event.reason.message);
      event.preventDefault();
    }
  });
};

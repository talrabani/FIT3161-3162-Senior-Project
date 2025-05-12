import { useState, useEffect } from 'react';

/**
 * Custom hook to manage tutorial state across the application
 * 
 * @returns {Object} Tutorial management functions and state
 */
export const useTutorial = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  
  useEffect(() => {
    // Check if user has visited before
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (!hasVisitedBefore) {
      setIsFirstVisit(true);
      setTutorialOpen(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);
  
  const openTutorial = () => {
    setTutorialOpen(true);
  };
  
  const closeTutorial = () => {
    setTutorialOpen(false);
  };
  
  const resetTutorialState = () => {
    localStorage.removeItem('hasVisitedBefore');
    setIsFirstVisit(true);
  };
  
  return {
    isFirstVisit,
    tutorialOpen,
    openTutorial,
    closeTutorial,
    resetTutorialState,
  };
};

export default useTutorial; 
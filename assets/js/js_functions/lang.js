document.addEventListener('DOMContentLoaded', function() {
  // Hide Google Translate element
  hideGoogleTranslateElement();
  
  // Desktop language dropdown functionality
  const langDropdown = document.getElementById('mallify-lang-dropdown');
  const langTrigger = document.getElementById('mallify-lang-trigger');
  const langList = document.getElementById('mallify-lang-list');
  const selectedLangText = langTrigger?.querySelector('.mallify-selected-text');
  
  // Mobile language dropdown functionality
  const mobileLangItem = document.querySelector('.on-hover-item.has-submenu.arrow-white');
  const mobileLangText = mobileLangItem?.querySelector('.selected-text');
  const mobileLangList = mobileLangItem?.querySelector('.selectable-text-list');
  
  // Toggle desktop dropdown
  if (langTrigger) {
    langTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      langList.classList.toggle('active');
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (langDropdown && !langDropdown.contains(e.target)) {
      langList?.classList.remove('active');
    }
    
    if (mobileLangItem && !mobileLangItem.contains(e.target)) {
      mobileLangItem.classList.remove('active');
    }
  });
  
  // Toggle mobile dropdown
  if (mobileLangItem) {
    mobileLangItem.querySelector('a.selected-text')?.addEventListener('click', function(e) {
      e.preventDefault();
      mobileLangItem.classList.toggle('active');
    });
  }
  
  // Handle language selection for desktop
  if (langList) {
    langList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const langCode = this.getAttribute('data-value');
        const langText = this.textContent.trim();
        
        // Update selected text
        if (selectedLangText) {
          selectedLangText.textContent = langCode.toUpperCase();
        }
        
        // Close dropdown
        langList.classList.remove('active');
        
        // Change language using Google Translate
        changeLanguage(langCode);
        
        // Update mobile dropdown text to match
        if (mobileLangText) {
          mobileLangText.textContent = langCode.charAt(0).toUpperCase() + langCode.slice(1, 3);
        }
      });
    });
  }
  
  // Handle language selection for mobile
  if (mobileLangList) {
    mobileLangList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const langText = this.textContent.trim();
        let langCode = 'en'; // Default
        
        // Determine language code based on text
        if (langText.includes('English')) langCode = 'en';
        else if (langText.includes('Japan')) langCode = 'ja'; // Google uses 'ja' for Japanese
        else if (langText.includes('French')) langCode = 'fr';
        else if (langText.includes('Germany')) langCode = 'de';
        
        // Update selected text
        if (mobileLangText) {
          mobileLangText.textContent = langCode.charAt(0).toUpperCase() + langCode.slice(1, 3);
        }
        
        // Close dropdown
        mobileLangItem.classList.remove('active');
        
        // Change language using Google Translate
        changeLanguage(langCode);
        
        // Update desktop dropdown text to match
        if (selectedLangText) {
          selectedLangText.textContent = langCode.toUpperCase();
        }
      });
    });
  }
  
  // Function to change language using Google Translate
  function changeLanguage(langCode) {
    try {
      // Map our language codes to Google Translate codes if needed
      const googleLangCode = {
        'en': 'en',
        'jp': 'ja', // Google uses 'ja' for Japanese
        'fr': 'fr',
        'de': 'de'
      }[langCode] || langCode;
      
      // Use Google Translate API to change language
      if (window.google && window.google.translate) {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
          select.value = googleLangCode;
          select.dispatchEvent(new Event('change'));
          
          // Fallback method if the above doesn't work
          if (typeof select.onchange === 'function') {
            select.onchange();
          }
        } else {
          // If we can't find the select element, try alternative method
          alternativeTranslateMethod(googleLangCode);
        }
      } else {
        console.warn('Google Translate not loaded yet');
        // Store the language preference for when Google Translate loads
        localStorage.setItem('preferredLanguage', googleLangCode);
        
        // Try to load Google Translate if it's not loaded
        loadGoogleTranslate();
      }
      
      // Save language preference in localStorage
      localStorage.setItem('selectedLanguage', langCode);
      
      // Update URL with language parameter
      updateUrlWithLanguage(langCode);
    } catch (error) {
      console.error('Error changing language:', error);
      // Fallback to manual language change
      manualLanguageChange(langCode);
    }
  }
  
  // Alternative method to trigger translation
  function alternativeTranslateMethod(langCode) {
    try {
      // Try to access the translate function directly
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) {
          // Clear and recreate the translate element
          translateElement.innerHTML = '';
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,fr,de,ja',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          }, 'google_translate_element');
          
          // Try to select the language after a short delay
          setTimeout(() => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
              select.value = langCode;
              select.dispatchEvent(new Event('change'));
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Alternative translate method failed:', error);
    }
  }
  
  // Manual language change as last resort
  function manualLanguageChange(langCode) {
    // This is a fallback that just updates the UI without actual translation
    console.log('Using manual language change for:', langCode);
    
    // You could implement a basic translation system here if needed
    // For now, we'll just update the UI to reflect the selected language
    
    // Update URL parameter
    updateUrlWithLanguage(langCode);
  }
  
  // Update URL with language parameter
  function updateUrlWithLanguage(langCode) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', langCode);
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  }
  
  // Load Google Translate script
  function loadGoogleTranslate() {
    if (!window.google || !window.google.translate) {
      const script = document.createElement('script');
      script.src = '/google-translate-proxy';
      script.async = true;
      script.onerror = function() {
        console.error('Failed to load Google Translate script');
      };
      document.head.appendChild(script);
    }
  }
  
  // Function to hide Google Translate element
  function hideGoogleTranslateElement() {
    // Hide the Google Translate element
    const googleTranslateElement = document.getElementById('google_translate_element');
    if (googleTranslateElement) {
      googleTranslateElement.style.display = 'none';
    }
    
    // Add CSS to hide Google Translate bar
    const style = document.createElement('style');
    style.textContent = `
      .goog-te-banner-frame {
        display: none !important;
      }
      .goog-te-menu-value {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      .VIpgJd-ZVi9od-l4eHX-hSRGPd, .VIpgJd-ZVi9od-ORHb-OEVmcd {
        display: none !important;
      }
      .skiptranslate {
        display: none !important;
      }
      .goog-te-gadget {
        font-size: 0 !important;
      }
      .goog-te-gadget .goog-te-combo {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Initialize language from localStorage if available
  function initializeLanguage() {
    // First check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    
    // Then check localStorage
    const savedLang = urlLang || localStorage.getItem('selectedLanguage') || 'en';
    
    // Set the language after Google Translate has loaded
    setTimeout(() => changeLanguage(savedLang), 1000);
    
    // Update UI to show saved language
    if (selectedLangText) {
      selectedLangText.textContent = savedLang.toUpperCase();
    }
    if (mobileLangText) {
      mobileLangText.textContent = savedLang.charAt(0).toUpperCase() + savedLang.slice(1, 3);
    }
  }
  
  // Initialize language preference
  initializeLanguage();
  
  // Handle Google Translate initialization
  if (typeof googleTranslateElementInit === 'function') {
    // If Google Translate is already initialized
    const originalInit = googleTranslateElementInit;
    googleTranslateElementInit = function() {
      try {
        originalInit();
        // Apply saved language after Google Translate loads
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang) {
          setTimeout(() => changeLanguage(savedLang), 1000);
          localStorage.removeItem('preferredLanguage');
        }
        // Hide Google Translate UI
        setTimeout(hideGoogleTranslateElement, 100);
      } catch (error) {
        console.error('Error in googleTranslateElementInit:', error);
      }
    };
  }
  
  // MutationObserver to hide Google Translate elements that might be added dynamically
  try {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === 1) { // Element node
              if (node.classList && (
                  node.classList.contains('skiptranslate') || 
                  node.classList.contains('goog-te-banner-frame') ||
                  node.classList.contains('VIpgJd-ZVi9od-l4eHX-hSRGPd')
              )) {
                node.style.display = 'none';
              }
            }
          }
        }
      });
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (error) {
    console.error('Error setting up MutationObserver:', error);
  }
});
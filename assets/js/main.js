(function ($) {

  $(document).ready(function () {
    
  // ============== Mobile Menu Sidebar & Offcanvas Js Start ========
  $('.toggle-mobileMenu').on('click', function () {
    $('.mobile-menu').addClass('active');
    $('.side-overlay').addClass('show');
    $('body').addClass('scroll-hide-sm');
  }); 

  $('.close-button, .side-overlay').on('click', function () {
    $('.mobile-menu').removeClass('active');
    $('.side-overlay').removeClass('show');
    $('body').removeClass('scroll-hide-sm');
  }); 
  // ============== Mobile Menu Sidebar & Offcanvas Js End ========
  
  // ============== Mobile Nav Menu Dropdown Js Start =======================
  var windowWidth = $(window).width(); 
  
  $('.has-submenu').on('click', function () {
    var thisItem = $(this); 
    
    if(windowWidth < 992) {
      if(thisItem.hasClass('active')) {
        thisItem.removeClass('active')
      } else {
        $('.has-submenu').removeClass('active')
        $(thisItem).addClass('active')
      }
      
      var submenu = thisItem.find('.nav-submenu');
      
      $('.nav-submenu').not(submenu).slideUp(300);
      submenu.slideToggle(300);
    }
    
  });
  // ============== Mobile Nav Menu Dropdown Js End =======================
    
  // ===================== Scroll Back to Top Js Start ======================
  var progressPath = document.querySelector('.progress-wrap path');
  var pathLength = progressPath.getTotalLength();
  progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
  progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
  progressPath.style.strokeDashoffset = pathLength;
  progressPath.getBoundingClientRect();
  progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';
  var updateProgress = function () {
    var scroll = $(window).scrollTop();
    var height = $(document).height() - $(window).height();
    var progress = pathLength - (scroll * pathLength / height);
    progressPath.style.strokeDashoffset = progress;
  }
  updateProgress();
  $(window).scroll(updateProgress);
  var offset = 50;
  var duration = 550;
  jQuery(window).on('scroll', function() {
    if (jQuery(this).scrollTop() > offset) {
      jQuery('.progress-wrap').addClass('active-progress');
    } else {
      jQuery('.progress-wrap').removeClass('active-progress');
    }
  });
  jQuery('.progress-wrap').on('click', function(event) {
    event.preventDefault();
    jQuery('html, body').animate({scrollTop: 0}, duration);
    return false;
  })
  // ===================== Scroll Back to Top Js End ======================

  // ========================== add active class to ul>li top Active current page Js Start =====================
  function dynamicActiveMenuClass(selector) {
    let FileName = window.location.pathname.split("/").reverse()[0];
  
    // If we are at the root path ("/" or no file name), keep the activePage class on the Home item
    if (FileName === "" || FileName === "index.html") {
      // Keep the activePage class on the Home link
      selector.find("li.nav-menu__item.has-submenu").eq(0).addClass("activePage");
    } else {
      // Remove activePage class from all items first
      selector.find("li").removeClass("activePage");
  
      // Add activePage class to the correct li based on the current URL
      selector.find("li").each(function () {
        let anchor = $(this).find("a");
        if ($(anchor).attr("href") == FileName) {
          $(this).addClass("activePage");
        }
      });
  
      // If any li has activePage element, add class to its parent li
      selector.children("li").each(function () {
        if ($(this).find(".activePage").length) {
          $(this).addClass("activePage");
        }
      });
    }
  }
  
  if ($('ul').length) {
    dynamicActiveMenuClass($('ul'));
  }
  // ========================== add active class to ul>li top Active current page Js End =====================

  
  // ========================== Select2 Js Start =================================
  $(document).ready(function() {
    $('.js-example-basic-single').select2();
});
  // ========================== Select2 Js End =================================

  
  // ========================== Select2 Js End =================================
  $('.search-icon').on('click', function () {
    $('.search-box').addClass('active'); 
  }); 
  $('.search-box__close').on('click', function () {
    $('.search-box').removeClass('active'); 
  }); 
  // ========================== Select2 Js End =================================

  
  // ========================== Category Dropdown Responsive Js Start =================================
  $('.responsive-dropdown .has-submenus-submenu').on('click', function () {

    var windowWidth = $(window).width(); 
    if(windowWidth < 992) { 
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        $(this).children('.submenus-submenu').slideUp();
      } else {
        $('.responsive-dropdown .has-submenus-submenu').removeClass('active');
        $('.responsive-dropdown .has-submenus-submenu').children('.submenus-submenu').slideUp();
  
        $(this).addClass('active');
        $(this).children('.submenus-submenu').slideDown();
      }
    }
  });
  // ========================== Category Dropdown Responsive Js End =================================

  // ========================== On Click Category menu show Js Start =================================
  $('.category__button').on('click', function () {    
    $('.responsive-dropdown').addClass('active'); 
    $('.side-overlay').addClass('show');
    $('body').addClass('scroll-hide-sm');
  }); 
  $('.side-overlay, .close-responsive-dropdown').on('click', function () {    
    $('.responsive-dropdown').removeClass('active'); 
    $('.side-overlay').removeClass('show');
    $('body').removeClass('scroll-hide-sm');
  }); 
  // ========================== On Click Category menu show Js End =================================

  
  // ========================== Set Language in dropdown Js Start =================================
  $('.selectable-text-list li').each(function () {
    var thisItem = $(this); 

    thisItem.on('click', function () {
      const listText = thisItem.text(); 
      var item = thisItem.parent().parent().find('.selected-text').text(listText); 
    }); 
  }); 
  // ========================== Set Language in dropdown Js End =================================

  
  // ========================= Banner Slider Js Start ==============
  $('.banner-slider').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#banner-next',
    prevArrow: '#banner-prev',
  });  

  $('.banner-slider').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
    $('.wow').css('visibility', 'hidden').removeClass('animated'); 
  });

  $('.banner-slider').on('afterChange', function(event, slick, currentSlide) {
    new WOW().init();
    $('.wow').css('visibility', 'visible'); 
  });

  // ========================= Banner Slider Js End ===================
  
  // ========================= Banner Three Slider Js Start ==============
  $('.banner-three-slider').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#banner-three-next',
    prevArrow: '#banner-three-prev',
  });  
  
  $('.banner-three-slider').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
    $('.wow').css('visibility', 'hidden').removeClass('animated'); 
  });

  $('.banner-three-slider').on('afterChange', function(event, slick, currentSlide) {
    new WOW().init();
    $('.wow').css('visibility', 'visible'); 
  });
  // ========================= Banner Three Slider Js End ===================

   // ========================= hot deals Slider Js Start ==============
   $('.feature-item-wrapper').slick({
    slidesToShow: 10,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#feature-item-wrapper-next',
    prevArrow: '#feature-item-wrapper-prev',
    responsive: [
      {
        breakpoint: 1699,
        settings: {
          slidesToShow: 9,
        }
      },
      {
        breakpoint: 1599,
        settings: {
          slidesToShow: 8,
        }
      },
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 6,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 5,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 4,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 424,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 359,
        settings: {
          slidesToShow: 1,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================

   // ========================= hot deals Slider Js Start ==============
   $('.feature-three-item-wrapper').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#feature-item-wrapper-next',
    prevArrow: '#feature-item-wrapper-prev',
    responsive: [
      {
        breakpoint: 1599,
        settings: {
          slidesToShow: 5,
        }
      },
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 4,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 424,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 359,
        settings: {
          slidesToShow: 1,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================

  
  // ========================= Banner Slider Js Start ==============
  $('.banner-item-two__slider').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: true,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#banner-next',
    prevArrow: '#banner-prev',
    responsive: [
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  });  
  $('.banner-item-two__slider').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
    $('.wow').css('visibility', 'hidden').removeClass('animated'); 
  });

  $('.banner-item-two__slider').on('afterChange', function(event, slick, currentSlide) {
    new WOW().init();
    $('.wow').css('visibility', 'visible'); 
  });
  // ========================= Banner Slider Js End ===================

  
  // ========================= flash Sale Four Slider Js Start ==============
  $('.flash-sales__slider').slick({
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#flash-next',
    prevArrow: '#flash-prev',
    responsive: [
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 1,
          arrows: false,
        }
      }
    ]
  });  
  // ========================= flash Sale Four Slider Js End ==================
    
  // ========================= hot deals Slider Js Start ==============
  $('.hot-deals-slider').slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#deals-next',
    prevArrow: '#deals-prev',
    responsive: [
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 3,
          arrows: false,
        }
      },
      {
        breakpoint: 1199,
        settings: {
          slidesToShow: 2,
          arrows: false,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 1,
          arrows: false,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================
    
    
  // ========================= hot deals Slider Js Start ==============
  $('.deals-week-slider').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#deal-week-next',
    prevArrow: '#deal-week-prev',
    responsive: [
      {
        breakpoint: 1599,
        settings: {
          slidesToShow: 5,
          arrows: false,
        }
      },
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 3,
          arrows: false,
        }
      },
      {
        breakpoint: 1199,
        settings: {
          slidesToShow: 2,
          arrows: false,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 1,
          arrows: false,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================
    

  // ========================= hot deals Slider Js Start ==============
  $('.top-selling-product-slider').slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#top-selling-next',
    prevArrow: '#top-selling-prev',
    responsive: [
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 3,
          arrows: false,
        }
      },
      {
        breakpoint: 1199,
        settings: {
          slidesToShow: 2,
          arrows: false,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 1,
          arrows: false,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================

  
  // ========================= hot deals Slider Js Start ==============
  $('.organic-food__slider').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#organic-next',
    prevArrow: '#organic-prev',
    responsive: [
      {
        breakpoint: 1599,
        settings: {
          slidesToShow: 6,
          arrows: false,
        }
      },
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 4,
          arrows: false,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
          arrows: false,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 2,
          arrows: false,
        }
      },
      {
        breakpoint: 424,
        settings: {
          slidesToShow: 1,
          arrows: false,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================

  
  // ========================= New arrival Slider Js Start ==============

  
  // Function to remove text nodes from navigation buttons
  function removeTextFromNavButtons() {
    // Target the specific navigation buttons
    $('#new-arrival-prev, #new-arrival-next').contents().each(function() {
      // Check if this is a text node (nodeType 3)
      if (this.nodeType === 3) {
        $(this).remove(); // Remove text nodes
      }
    });
    
    // Also target any text that might be in slick-prev/next
    $('.slick-prev, .slick-next').contents().each(function() {
      if (this.nodeType === 3) {
        $(this).remove();
      }
    });
    
    // Change icon color - modify this color value to your preference
    const arrowColor = "#000000"; // Change this to your desired color (blue in this example)
    
    // Apply the color styles to the icons
    $('#new-arrival-prev i, #new-arrival-next i').css('color', arrowColor);
    $('.slick-prev:before, .slick-next:before').css('color', arrowColor);
    
    // Additional styling for better visibility
    $("<style>")
      .prop("type", "text/css")
      .html(`
        #new-arrival-prev i,
        #new-arrival-next i,
        .arrow-style-two .slick-prev::before,
        .arrow-style-two .slick-next::before {
          color: ${arrowColor} !important;
        }
      `)
      .appendTo("head");
  }
  
  // Run after slider initialization
  $('.new-arrival__slider').on('init', function() {
    setTimeout(removeTextFromNavButtons, 100);
  });
  
  // Re-apply whenever the slider changes
  $('.new-arrival__slider').on('afterChange', function() {
    removeTextFromNavButtons();
  });
  
  // Run on page load as well
  setTimeout(removeTextFromNavButtons, 500);
  
  // ========================= New arrival Slider Js End ===================

  
  // ========================= hot deals Slider Js Start ==============
  $('.short-product-list').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    prevArrow: '<button type="button" class="slick-prev border border-gray-100 w-30 h-30 bg-transparent rounded-pill position-absolute hover-bg-main-600 hover-text-white hover-border-main-600 transition-1"><i class="ph ph-caret-left"></i></button>',
    nextArrow: '<button type="button" class="slick-next border border-gray-100 w-30 h-30 bg-transparent rounded-pill position-absolute hover-bg-main-600 hover-text-white hover-border-main-600 transition-1"><i class="ph ph-caret-right"></i></button>',
  });  
  
// ========================= hot deals Slider Js End ===================

  
  // ========================= hot deals Slider Js Start ==============
  $('.brand-slider').slick({
    slidesToShow: 8,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#brand-next',
    prevArrow: '#brand-prev',
    responsive: [
      {
        breakpoint: 1599,
        settings: {
          slidesToShow: 7,
          arrows: false,
        }
      },
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 6,
          arrows: false,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 5,
          arrows: false,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 4,
          arrows: false,
        }
      },
      {
        breakpoint: 424,
        settings: {
          slidesToShow: 3,
          arrows: false,
        }
      },
      {
        breakpoint: 359,
        settings: {
          slidesToShow: 2,
          arrows: false,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================

  
  // ========================= Category Dropdown Two Js Start ===============================
  $('.category-two .category__button').on('click', function () {
    $('.category-two .category__button').toggleClass('active')
    $('.responsive-dropdown.style-two').addClass('active').slideToggle(400); 
  }); 
  // ========================= Category Dropdown Two Js End ===============================
  
  
  // ========================= Featured Products Slider Js Start ==============
  $('.featured-product-slider').slick({
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#featured-products-next',
    prevArrow: '#featured-products-prev',
    responsive: [
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 1,
          arrows: false,
        }
      }
    ]
  });  
  // ========================= Featured Products Slider Js End ==================

  
  // ========================= hot deals Slider Js Start ==============
  $('.recommended-slider').slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#recommended-next',
    prevArrow: '#recommended-prev',
    responsive: [
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 3,
          arrows: false,
        }
      },
      {
        breakpoint: 1199,
        settings: {
          slidesToShow: 2,
          arrows: false,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 1,
          arrows: false,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================
  
  // ========================= hot deals Slider Js Start ==============
  $('.vendor-card__list.style-two').slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#vendor-next',
    prevArrow: '#vendor-prev',
  });  
  // ========================= hot deals Slider Js End ===================
  
  
  // ========================= hot deals Slider Js Start ==============
  $('.top-brand__slider').slick({
    slidesToShow: 8,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: true,
    draggable: true,
    rtl: $('html').attr('dir') === 'rtl' ? true : false,
    speed: 900,
    infinite: true,
    nextArrow: '#topBrand-next',
    prevArrow: '#topBrand-prev',
    responsive: [
      {
        breakpoint: 1599,
        settings: {
          slidesToShow: 7,
          arrows: false,
        }
      },
      {
        breakpoint: 1399,
        settings: {
          slidesToShow: 6,
          arrows: false,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 5,
          arrows: false,
        }
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 4,
          arrows: false,
        }
      },
      {
        breakpoint: 424,
        settings: {
          slidesToShow: 3,
          arrows: false,
        }
      },
      {
        breakpoint: 359,
        settings: {
          slidesToShow: 2,
          arrows: false,
        }
      },
    ]
  });  
  // ========================= hot deals Slider Js End ===================

  
  // ========================= Product Details Thumbs Slider Js Start ===================
  $('.product-details__thumb-slider').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: true,
    asNavFor: '.product-details__images-slider'
  });

  $('.product-details__images-slider').slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    asNavFor: '.product-details__thumb-slider',
    dots: false,
    arrows: false,
    focusOnSelect: true
  });
  // ========================= Product Details Thumbs Slider Js End ===================


  
  // ========================= Color List Js Start ===================
  $('.color-list__button').on('click', function () {
    $('.color-list__button').removeClass('border-gray-900'); 

    if(!$(this).hasClass('border-gray-900')) {
      $(this).addClass('border-gray-900');
      $(this).removeClass('border-gray-50');
    } else {
      $(this).removeClass('border-gray-900');
      $(this).addClass('border-gray-50');
    };
  }); 
  // ========================= Color List Js End ===================


  
  // ========================== List Grid Js Start ================================
  $('.list-btn').on('click', function () {
    $('.grid-btn').addClass('border-gray-100'); 
    $('.grid-btn').removeClass('border-main-600 text-white bg-main-600'); 
    $('.list-grid-wrapper').removeClass('list-view'); 
    
    $(this).removeClass('border-gray-100'); 
    $(this).addClass('border-main-600 text-white bg-main-600'); 
    $('.list-grid-wrapper').addClass('list-view'); 
  }); 

  $('.grid-btn').on('click', function () {
    $('.list-btn').addClass('border-gray-100'); 
    $('.list-btn').removeClass('border-main-600 text-white bg-main-600'); 
    $('.list-grid-wrapper').removeClass('list-view'); 

    $(this).removeClass('border-gray-100'); 
    $(this).addClass('border-main-600 text-white bg-main-600'); 
  }); 
  // ========================== List Grid Js End ================================

  
  // ========================== Shop Sidebar Js Start ================================
  $('.sidebar-btn').on('click', function () {
    $(this).addClass('bg-main-600 text-white');
    $('.shop-sidebar').addClass('active');
    $('.side-overlay').addClass('show');
    $('body').addClass('scroll-hide-sm'); 
  }); 

  $('.side-overlay, .shop-sidebar__close').on('click', function () {
    $('.sidebar-btn').removeClass('bg-main-600 text-white');
    $('.shop-sidebar').removeClass('active');
    $('.side-overlay').removeClass('show');
    $('body').removeClass('scroll-hide-sm');
  }); 
  // ========================== Shop Sidebar Js End ================================



  // ========================= Background Image Js Start ===================
    $(".bg-img").css('background-image', function () {
      var bg = 'url(' + $(this).data("background-image") + ')';
      return bg;
    });
  // ========================= Background Image Js End ===================

  // ========================== Text Slide Js Start =====================
    $('.text-slider').marquee({
      pauseOnHover: true,
      allowCss3Support: true,
      css3easing: 'linear',
      easing: 'linear',
      delayBeforeStart: 0,
      duration: 7000,
      gap: 20,
      pauseOnCycle: false,
      startVisible: true
    });
    // ========================== Text Slide Js End =====================
    // ========================== Trending Products Js Strt =====================
    $('.wishlist-btn').on('click', function () {
      if($(this).children('i').hasClass('ph ph-heart')) {
        $(this).children('i').removeClass('ph ph-heart')
        $(this).children('i').addClass('ph-fill ph-heart text-main-two-600')
      } else {
        $(this).children('i').removeClass('ph-fill ph-heart text-main-two-600')
        $(this).children('i').addClass('ph ph-heart')
      }
    });
    // ========================== Trending Products Js End =====================
    // ========================== Instagram Slider Js Start =====================
    $('.instagram-slider').slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $('html').attr('dir') === 'rtl' ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: '#instagram-next',
      prevArrow: '#instagram-prev',
      responsive: [
        {
          breakpoint: 1299,
          settings: {
            slidesToShow: 3,
            arrows: false,
          }
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 3,
            arrows: false,
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 2,
            arrows: false,
          }
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 1,
            arrows: false,
          }
        },
      ]
    });  
    // ========================== Instagram Slider Js End =====================
    

    // ========================== Testimonials Thumbs Slider Js Start =====================
    $('.testimonials-slider').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      asNavFor: '.testimonials-thumbs-slider',
      dots: true,
      centerMode: true,
      focusOnSelect: true,
      fade: true,
      cssEase: 'linear',
      dots: false,
      arrows: false,
    });

    $('.testimonials-thumbs-slider').slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $('html').attr('dir') === 'rtl' ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: '#testi-next',
      prevArrow: '#testi-prev',
      asNavFor: '.testimonials-slider',
      responsive: [
        {
          breakpoint: 1299,
          settings: {
            slidesToShow: 3,
            arrows: false,
          }
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 3,
            arrows: false,
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 2,
            arrows: false,
          }
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 2,
            arrows: false,
          }
        },
      ]
    });  
    // ========================== Testimonials Thumbs Slider Js End =====================
  new WOW().init();
  // ========================= Wow Js End ===================

  // ========================= AOS Animation Js Start ===================
  AOS.init({
    offset: 40,
    duration: 1000,
    // once: true,
    easing: 'ease',
  });
  // ========================= AOS Animation Js End ===================

  // ========================= Counter Up Js End ===================
  const counterUp = window.counterUp.default;

  const callback = (entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      if (entry.isIntersecting && !el.classList.contains('is-visible')) {
        counterUp(el, {
          duration: 2000,
          delay: 16,
        });
        el.classList.add('is-visible');
      }
    });
  };

  const IO = new IntersectionObserver(callback, { threshold: 1 });

  // Counter Two for each
  const counterNumbers = document.querySelectorAll('.counter');
  if (counterNumbers.length > 0) {
    counterNumbers.forEach((counterNumber) => {
      IO.observe(counterNumber);
    });
  }


  
  });
    // ========================= Header Sticky Js Start ==============
    $(window).on('scroll', function() {
      if ($(window).scrollTop() >= 260) {
        $('.header').addClass('fixed-header');
      }
      else {
          $('.header').removeClass('fixed-header');
      }
    }); 
    // ========================= Header Sticky Js End===================
    $(document).ready(function() {
      // Use the ID selector for all elements with id="searchIcon" (not recommended for multiple elements)
      $('[id="searchIcon"]').on('click', function(event) {
        event.preventDefault(); // Prevent default action for the icon click
        
        // Redirect to shop.html
        window.location.href = 'shop.html';
      });
    });
    
    
    
})(jQuery);
// Modern Dropdown Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize dropdowns
  function initDropdowns() {
    const dropdowns = document.querySelectorAll('.mallify-dropdown');
    
    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('.mallify-dropdown-trigger');
      const list = dropdown.querySelector('.mallify-dropdown-list');
      const selectedText = dropdown.querySelector('.mallify-selected-text');
      
      // Toggle dropdown on trigger click
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Close all other dropdowns
        dropdowns.forEach(otherDropdown => {
          if (otherDropdown !== dropdown) {
            otherDropdown.classList.remove('active');
          }
        });
        
        // Toggle this dropdown
        dropdown.classList.toggle('active');
      });
      
      // Handle item selection
      if (list) {
        const items = list.querySelectorAll('a');
        items.forEach(item => {
          item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Update selected text
            if (selectedText) {
              selectedText.textContent = this.textContent.trim();
            }
            
            // Store selected value if needed
            const value = this.getAttribute('data-value');
            if (value) {
              trigger.setAttribute('data-selected', value);
              
              // You can trigger a custom event if needed
              const changeEvent = new CustomEvent('mallify:change', {
                detail: { value: value }
              });
              dropdown.dispatchEvent(changeEvent);
            }
            
            // Close dropdown
            dropdown.classList.remove('active');
          });
        });
      }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.mallify-dropdown')) {
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });
    
    // Close dropdowns on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });
  }
  
  // Initialize
  initDropdowns();
});

// ========================= Cart & Wishlist Counter Functionality Start ===================
// Function to update cart and wishlist counters across all pages
function updateCounters() {
  // Get the client ID directly from localStorage
  const clientId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  
  if (clientId && token) {
    // User is logged in, fetch actual counts from database
    fetchWishlistCount(clientId, token);
    fetchCartCount(clientId, token);
  } else {
    // User is not logged in, use localStorage counts
    const wishlistCount = localStorage.getItem('wishlistCount') || 0;
    const cartCount = localStorage.getItem('cartCount') || 0;
    
    updateWishlistCounters(wishlistCount);
    updateCartCounters(cartCount);
  }
}

// Function to fetch wishlist count from database
function fetchWishlistCount(clientId, token) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `http://localhost:3000/favoris/${clientId}`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  
  xhr.onload = function() {
    if (this.status === 200) {
      try {
        const response = JSON.parse(this.responseText);
        if (response.favorites && Array.isArray(response.favorites)) {
          const count = response.favorites.length;
          localStorage.setItem('wishlistCount', count);
          updateWishlistCounters(count);
        } else {
          localStorage.setItem('wishlistCount', '0');
          updateWishlistCounters(0);
        }
      } catch (e) {
        console.error('Error parsing wishlist count:', e);
        updateWishlistCounters(0);
      }
    } else if (this.status === 404) {
      // No wishlist found, set count to 0
      localStorage.setItem('wishlistCount', '0');
      updateWishlistCounters(0);
    } else {
      console.error('Failed to fetch wishlist count:', this.status, this.responseText);
    }
  };
  
  xhr.onerror = function() {
    console.error('Network error when fetching wishlist count');
  };
  
  xhr.send();
}

// Function to fetch cart count from database
function fetchCartCount(clientId, token) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `http://localhost:3000/cart/${clientId}`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  
  xhr.onload = function() {
    if (this.status === 200) {
      try {
        const response = JSON.parse(this.responseText);
        if (response.cart && response.cart.items) {
          // Count unique products instead of total quantity
          const count = response.cart.items.length;
          localStorage.setItem('cartCount', count);
          updateCartCounters(count);
        } else {
          localStorage.setItem('cartCount', '0');
          updateCartCounters(0);
        }
      } catch (e) {
        console.error('Error parsing cart count:', e);
        updateCartCounters(0);
      }
    } else {
      console.error('Failed to fetch cart count:', this.status, this.responseText);
    }
  };
  
  xhr.onerror = function() {
    console.error('Network error when fetching cart count');
  };
  
  xhr.send();
}

// Function to update all wishlist counters in the page
function updateWishlistCounters(count) {
  const wishlistCounters = document.querySelectorAll('.ph-heart + span');
  wishlistCounters.forEach(counter => {
    counter.textContent = count;
  });
}

// Function to update all cart counters in the page
function updateCartCounters(count) {
  const cartCounters = document.querySelectorAll('.ph-shopping-cart-simple + span');
  cartCounters.forEach(counter => {
    counter.textContent = count;
  });
}

// Update counters when page loads
$(document).ready(function() {
  // Initialize counters
  updateCounters();
  
  // Handle the wishlist button clicks
  $(document).on('click', '.wishlist-btn', function() {
    // Toggle heart icon (purely visual feedback)
    if($(this).children('i').hasClass('ph ph-heart')) {
      $(this).children('i').removeClass('ph ph-heart');
      $(this).children('i').addClass('ph-fill ph-heart text-main-two-600');
      // Increment the wishlist counter immediately for instant feedback
      const currentCount = parseInt(localStorage.getItem('wishlistCount') || '0');
      updateWishlistCounters(currentCount + 1);
    } else {
      $(this).children('i').removeClass('ph-fill ph-heart text-main-two-600');
      $(this).children('i').addClass('ph ph-heart');
      // Decrement the wishlist counter immediately for instant feedback
      const currentCount = parseInt(localStorage.getItem('wishlistCount') || '0');
      updateWishlistCounters(Math.max(0, currentCount - 1));
    }
  });
  
  // Add to cart button functionality - provide instant visual feedback
  $(document).on('click', '.add-to-cart, .product-card__cart', function(e) {
    // Don't prevent default if it's an actual link that should navigate
    if (!$(this).attr('href')) {
      e.preventDefault();
      
      // Increment the cart counter immediately for instant feedback
      const currentCount = parseInt(localStorage.getItem('cartCount') || '0');
      updateCartCounters(currentCount + 1);
    }
  });
});

// ========================= Cart & Wishlist Counter Functionality Start ===================
// Function to update cart and wishlist counters across all pages
function updateCounters() {
  // Get the client ID directly from localStorage
  const clientId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  
  if (clientId && token) {
    // User is logged in, fetch actual counts from database
    fetchWishlistCount(clientId, token);
    fetchCartCount(clientId, token);
  } else {
    // User is not logged in, use localStorage counts
    const wishlistCount = localStorage.getItem('wishlistCount') || 0;
    const cartCount = localStorage.getItem('cartCount') || 0;
    
    updateWishlistCounters(wishlistCount);
    updateCartCounters(cartCount);
  }
}

// Function to fetch wishlist count from database
function fetchWishlistCount(clientId, token) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `http://localhost:3000/favoris/${clientId}`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  
  xhr.onload = function() {
    if (this.status === 200) {
      try {
        const response = JSON.parse(this.responseText);
        if (response.favorites && Array.isArray(response.favorites)) {
          const count = response.favorites.length;
          localStorage.setItem('wishlistCount', count);
          updateWishlistCounters(count);
        } else {
          localStorage.setItem('wishlistCount', '0');
          updateWishlistCounters(0);
        }
      } catch (e) {
        console.error('Error parsing wishlist count:', e);
        updateWishlistCounters(0);
      }
    } else if (this.status === 404) {
      // No wishlist found, set count to 0
      localStorage.setItem('wishlistCount', '0');
      updateWishlistCounters(0);
    } else {
      console.error('Failed to fetch wishlist count:', this.status, this.responseText);
    }
  };
  
  xhr.onerror = function() {
    console.error('Network error when fetching wishlist count');
  };
  
  xhr.send();
}

// Function to fetch cart count from database
function fetchCartCount(clientId, token) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `http://localhost:3000/cart/${clientId}`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  
  xhr.onload = function() {
    if (this.status === 200) {
      try {
        const response = JSON.parse(this.responseText);
        if (response.cart && response.cart.items) {
          // Count unique products instead of total quantity
          const count = response.cart.items.length;
          localStorage.setItem('cartCount', count);
          updateCartCounters(count);
        } else {
          localStorage.setItem('cartCount', '0');
          updateCartCounters(0);
        }
      } catch (e) {
        console.error('Error parsing cart count:', e);
        updateCartCounters(0);
      }
    } else {
      console.error('Failed to fetch cart count:', this.status, this.responseText);
    }
  };
  
  xhr.onerror = function() {
    console.error('Network error when fetching cart count');
  };
  
  xhr.send();
}

// Helper functions to increment/decrement counters directly for immediate visual feedback
function incrementWishlistCount() {
  const currentCount = parseInt(localStorage.getItem('wishlistCount') || '0');
  const newCount = currentCount + 1;
  localStorage.setItem('wishlistCount', newCount);
  updateWishlistCounters(newCount);
  return newCount;
}

function decrementWishlistCount() {
  const currentCount = parseInt(localStorage.getItem('wishlistCount') || '0');
  const newCount = Math.max(0, currentCount - 1); // Ensure it doesn't go below 0
  localStorage.setItem('wishlistCount', newCount);
  updateWishlistCounters(newCount);
  return newCount;
}

function incrementCartCount(amount = 1) {
  const currentCount = parseInt(localStorage.getItem('cartCount') || '0');
  const newCount = currentCount + amount;
  localStorage.setItem('cartCount', newCount);
  updateCartCounters(newCount);
  return newCount;
}

function decrementCartCount(amount = 1) {
  const currentCount = parseInt(localStorage.getItem('cartCount') || '0');
  const newCount = Math.max(0, currentCount - amount); // Ensure it doesn't go below 0
  localStorage.setItem('cartCount', newCount);
  updateCartCounters(newCount);
  return newCount;
}

function setWishlistCount(count) {
  localStorage.setItem('wishlistCount', count);
  updateWishlistCounters(count);
}

function setCartCount(count) {
  localStorage.setItem('cartCount', count);
  updateCartCounters(count);
}


window.mallifyCounters = {
  updateCounters,
  incrementWishlistCount,
  decrementWishlistCount,
  incrementCartCount,
  decrementCartCount,
  setWishlistCount,
  setCartCount,
  fetchWishlistCount,
  fetchCartCount
};


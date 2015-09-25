/*
 * jSwipe - jQuery Plugin
 * http://plugins.jquery.com/project/swipe
 * http://www.ryanscherf.com/demos/swipe/
 *
 * Copyright (c) 2009 Ryan Scherf (www.ryanscherf.com)
 * Licensed under the MIT license
 *
 * $Date: 2009-07-14 (Tue, 14 Jul 2009) $
 * $version: 0.1
 *
 * This jQuery plugin will only run on devices running Mobile Safari
 * on iPhone or iPod Touch devices running iPhone OS 2.0 or later.
 * http://developer.apple.com/iphone/library/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW5
 */
(function($) {
  $.fn.swipe = function(options) {
    // Default thresholds & swipe functions
    var defaults = {
      threshold: {
        x: 30,
        y: 10
      },
      swipeLeft: function() { alert('swiped left') },
      swipeRight: function() { alert('swiped right') },
      preventDefaultEvents: true
    };

    var options = $.extend(defaults, options);

    if (!this) return false;

    return this.each(function() {

      var me = $(this)

      // Private variables for each element
      var originalCoord = { x: 0, y: 0 }
      var finalCoord = { x: 0, y: 0 }

      // Screen touched, store the original coordinate
      function touchStart(event) {
        console.log('Starting swipe gesture...')
        originalCoord.x = event.targetTouches[0].pageX
        originalCoord.y = event.targetTouches[0].pageY
      }

      // Store coordinates as finger is swiping
      function touchMove(event) {
        if (defaults.preventDefaultEvents)
            event.preventDefault();
        finalCoord.x = event.targetTouches[0].pageX // Updated X,Y coordinates
        finalCoord.y = event.targetTouches[0].pageY
      }

      // Done Swiping
      // Swipe should only be on X axis, ignore if swipe on Y axis
      // Calculate if the swipe was left or right
      function touchEnd(event) {
        console.log('Ending swipe gesture...')
        var changeY = originalCoord.y - finalCoord.y
        if(changeY < defaults.threshold.y && changeY > (defaults.threshold.y*-1)) {
          changeX = originalCoord.x - finalCoord.x

          if(changeX > defaults.threshold.x) {
            defaults.swipeLeft()
          }
          if(changeX < (defaults.threshold.x*-1)) {
            defaults.swipeRight()
          }
        }
      }

      // Swipe was canceled
      function touchCancel(event) {
        console.log('Canceling swipe gesture...')
      }

      // Add gestures to all swipable areas
      this.addEventListener("touchstart", touchStart, false);
      this.addEventListener("touchmove", touchMove, false);
      this.addEventListener("touchend", touchEnd, false);
      this.addEventListener("touchcancel", touchCancel, false);

    });
  };
})(jQuery);

// My stuff

var iphone = navigator.userAgent.match(/iPhone/i);
var ipod = navigator.userAgent.match(/iPod/i);
var idevice = (iphone || ipod);
var standalone = window.navigator.standalone;
var moved = false; // whether or not touchmove has occurred
var initial_hash = location.hash;

var ivent = idevice ? "touchend": "click";

var index = 0; //index of the current flash card

function hide_address_bar() {
    window.scrollTo(0, 1);
}

function reoriented() {
    var is_portrait = (window.orientation == 0),
        $body = $("body");

    $body.removeClass("portrait landscape");
    if (is_portrait) {
        $body.addClass("portrait");
    } else {
        $body.addClass("landscape");
    }

    setTimeout(hide_address_bar, 100);
}

function supports_local_storage() {
  return !!window.localStorage;
}

/*
function fromHash() {
    if ($(location.hash).length == 1) {
        var text;
        $("dd, dt").hide();
        $(location.hash).show();
        if ($(location.hash).is("dt")) {
            text = $(location.hash).index("dt")+1;
        } else {
            text = $(location.hash).index("dd")+1;
        }
        index = parseInt(text) - 1;
        $("#current").text(text);
    }
}

function toHash() {
    location.hash = "#"+$("dl>*:visible").attr("id");
}
*/

function swapCard(direction) {
    if (moved === false || direction !== null) {
        $("dd:visible").hide().prev("dt").show();

        var $dt = $("dt"),
            $self = $(event.target);

        $dt.hide();
        if ($self.is("#prev") || direction === "right") {
            // previous
            if (index === 0) {
                index = $dt.length - 1;
            } else {
                index -= 1;
            }
        } else if ($self.is("#shuffle")) {
            // shuffle
            index = Math.floor(Math.random() * $dt.length);
        } else {
            // next or delete
            if (index === ($dt.length - 1)) {
                index = 0;
            } else {
                index += 1;
            }
        }

        $dt.eq(index).show();
        $("#current").text($dt.length ? index + 1 : 0);

        // toHash();
        return false;
    }
}

$(function() {
    // setInterval(fromHash, 100);

  if (idevice) {
      $("body").addClass("iphone");

      reoriented();
        window.addEventListener('orientationchange', reoriented, false);

        if (standalone) {
            $("body").addClass("standalone");
        }

    }

    if ($("#cards").length > 0) {
        $("dt:first-child").show();

        $("dt").bind(ivent, function() {
            if (moved == false) {
                $(this).hide().next("dd").show();
                // toHash();
                return false;
            }
        });
        $("dd").bind(ivent, function() {
            if (moved == false) {
                $(this).hide().prev("dt").show();
                // toHash();
                return false;
            }
        });

        $('dt, dd').swipe({
             threshold: {x:200, y:40},
             swipeLeft: function(){swapCard("left");},
             swipeRight: function(){swapCard("right");},
        });

        $("#next, #prev, #shuffle").bind(ivent, swapCard);

        $("#remove").bind(ivent, function() {
            if (moved === false) {
                $("dt:visible").next("dd").remove();
                $("dd:visible").prev("dt").remove();
                $("dt:visible, dd:visible").remove();
                index -= 1;
                $("#total").text($("dt").length);
                swapCard();
            }
        });

        $(window).keydown(function(e) {
            if (e.keyCode == 39) {
                // right
                $("#next").click();
            } else if (e.keyCode == 37) {
                // left
                $("#prev").click();
            } else if (e.keyCode == 32) {
                // space
                $("dt:visible, dd:visible").click();
            } else if (e.keyCode == 27) {
                // esc
                $("#remove").click();
            }
        });
    }

    $("a, dt, dd, input, textarea").bind("touchstart", function() {
        moved = false;
        $(this).addClass("touch");
    });

    $("a, dt, dd, input, textarea").bind("touchmove", function() {
        moved = true;
        $(this).removeClass("touch");
    });

    $("a, dt, dd, input, textarea").bind("touchend", function() {
        $(this).removeClass("touch");
    });

    /*  show or hide the labels depending on if their
        corresponding inputs have content */

    if ($("input#title").val() == "") {
        $("input#title").prev("label").show();
    }
    if ($("textarea#content").val() == "") {
        $("textarea#content").prev("label").show();
    }

    $("input#title, textarea#content").focus(function() {
        if ($(this).val() == "") {
            $(this).prev("label").addClass("focus");
        }
    }).blur(function() {
        if ($(this).val() == "") {
            $(this).prev("label").removeClass("focus").show();
        }
    }).keydown(function() {
        $(this).prev("label").hide();
    }).keyup(function() {
        if ($(this).val() == "") {
            $(this).prev("label").show();
        }
    });

    /* textarea resizing plugin made from scratch */

    (function($) {
        $.fn.extend({
            resizeTextarea: function(){
                var defaults = {rows: 6};
                var options = $.extend(defaults, options);

                return this.each(function() {
                    var o = options;

                    var content = $(this).val();
                    var returns = content.match(/\n/g);
                    if (returns) {
                        if (returns.length >= o.rows) {
                            $(this).attr("rows", returns.length+1);
                        } else {
                            $(this).attr("rows", o.rows);
                        }
                    } else {
                        $(this).attr("rows", o.rows);
                    }
                });
            }
        });
    })(jQuery);

    $("textarea#content").resizeTextarea();

    $("textarea#content").keyup(function(){
       $(this).resizeTextarea();
    });
});

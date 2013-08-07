/*  ******************************
  Modal
  Author: Jack Lukic
  Notes: First Commit May 14, 2012

  Manages modal state and
  stage dimming

******************************  */

;(function ( $, window, document, undefined ) {

$.fn.modal = function(parameters) {
  var
    $allModals     = $(this),
    $document      = $(document),

    settings        = ( $.isPlainObject(parameters) )
      ? $.extend(true, {}, $.fn.modal.settings, parameters)
      : $.fn.modal.settings,

    selector       = settings.selector,
    className      = settings.className,
    namespace      = settings.namespace,
    error          = settings.error,
    
    eventNamespace = '.' + namespace,
    moduleNamespace = 'module-' + namespace,
    moduleSelector = $allModals.selector || '',
    
    time           = new Date().getTime(),
    performance    = [],
    
    query          = arguments[0],
    methodInvoked  = (typeof query == 'string'),
    queryArguments = [].slice.call(arguments, 1),

    invokedResponse
  ;

  $allModals
    .each(function() {
      var
        $modal       = $(this),
        $context     = $(settings.context),
        $otherModals = $allModals.not($modal),
        $closeButton = $modal.find(selector.closeButton),
        
        element      = this,
        instance     = $modal.data(moduleNamespace),
        modal
      ;

      modal  = {

        initialize: function() {
          modal.verbose('Initializing modal');
          $closeButton
            .on('click', modal.event.close)
          ;
          $context
            .dimmer({
              duration: settings.duration,
              onShow: function() {
                modal.add.keyboardShortcuts();
                $.proxy(settings.onShow, this)();
              },
              onHide: function() {
                if($modal.is(':visible')) {
                  modal.hide();
                  $.proxy(settings.onHide, this)();
                }
                modal.remove.keyboardShortcuts();
              }
            })
          ;
          modal.cache.sizes();
          modal.instantiate();
        },

        instantiate: function() {
          modal.verbose('Storing instance of modal');
          instance = modal;
          $modal
            .data(moduleNamespace, instance)
          ;
        },

        destroy: function() {
          modal.verbose('Destroying previous modal');
          $modal
            .off(eventNamespace)
          ;
        },

        event: {
          close: function() {
            modal.verbose('Close button pressed');
            $context.dimmer('hide');
          },
          keyboard: function(event) {
            var
              keyCode   = event.which,
              escapeKey = 27
            ;
            if(keyCode == escapeKey) {
              modal.debug('Escape key pressed hiding modal');
              $context.dimmer('hide');
              event.preventDefault();
            }
          },
          resize: function() {
            modal.cache.sizes();
            if( $modal.is(':visible') ) {
              modal.set.type();
              modal.set.position(); 
            }
          }
        },

        show: function() {
          modal.set.type();
          modal.set.position();
          modal.hideOthers();
          if(settings.transition && $.fn.transition !== undefined) {
            $modal
              .transition(settings.transition + ' in', settings.duration)
            ;
          }
          else {
            $modal
              .fadeIn(settings.duration, settings.easing)
            ;
          }
          $context.dimmer('show');
        },

        hide: function() {
          // remove keyboard detection
          $document
            .off('keyup.' + namespace)
          ;
          if(settings.transition && $.fn.transition !== undefined) {
            $modal
              .transition(settings.transition + ' out', settings.duration, settings.unDim)
            ;
          }
          else {
            $modal
              .fadeOut(settings.duration, settings.easing, settings.unDim)
            ;
          }
        },

        hideOthers: function() {
          $otherModals
            .filter(':visible')
            .modal('hide')
          ;
        },

        add: {
          keyboardShortcuts: function() {
            modal.verbose('Adding keyboard shortcuts');
            $document
              .on('keyup' + eventNamespace, modal.event.keyboard)
            ;
          }
        },

        remove: {
          keyboardShortcuts: function() {
            modal.verbose('Removing keyboard shortcuts');
            $document
              .off('keyup' + eventNamespace)
            ;
          }
        },

        cache: {
          sizes: function() {
            modal.cache = {
              height        : $modal.outerHeight() + settings.offset,
              contextHeight : (settings.context == 'body')
                ? $(window).height()
                : $context.height()
            };
            modal.debug('Caching modal and container sizes', modal.cache);
          }
        },

        can: {
          fit: function() {
            return (modal.cache.height < modal.cache.contextHeight);
          }
        },

        set: {
          type: function() {
            if(modal.can.fit()) {
              modal.verbose('Modal fits on screen');
              $modal.removeClass(className.scrolling);
            }
            else {
              modal.verbose('Modal cannot fit on screen setting to scrolling');
              $modal.addClass(className.scrolling);
            }
          },
          position: function() {
            modal.verbose('Centering modal on page');
            if(modal.can.fit()) {
              $modal
                .css({
                  marginTop: -(modal.cache.height / 2)
                })
              ;
            }
            else {
              $modal
                .css({
                  top: $context.prop('scrollTop')
                })
              ;
            }
          }
        },

        setting: function(name, value) {
          if(value !== undefined) {
            if( $.isPlainObject(name) ) {
              $.extend(true, settings, name);
            }
            else {
              settings[name] = value;
            }
          }
          else {
            return settings[name];
          }
        },
        internal: function(name, value) {
          if(value !== undefined) {
            if( $.isPlainObject(name) ) {
              $.extend(true, modal, name);
            }
            else {
              modal[name] = value;
            }
          }
          else {
            return modal[name];
          }
        },
        debug: function() {
          if(settings.debug) {
            if(settings.performance) {
              modal.performance.log(arguments);
            }
            else {
              modal.debug = Function.prototype.bind.call(console.info, console, settings.moduleName + ':');
              modal.debug.apply(console, arguments);
            }
          }
        },
        verbose: function() {
          if(settings.verbose && settings.debug) {
            if(settings.performance) {
              modal.performance.log(arguments);
            }
            else {
              modal.verbose = Function.prototype.bind.call(console.info, console, settings.moduleName + ':');
              modal.verbose.apply(console, arguments);
            }
          }
        },
        error: function() {
          modal.error = Function.prototype.bind.call(console.error, console, settings.moduleName + ':');
          modal.error.apply(console, arguments);
        },
        performance: {
          log: function(message) {
            var
              currentTime,
              executionTime,
              previousTime
            ;
            if(settings.performance) {
              currentTime   = new Date().getTime();
              previousTime  = time || currentTime;
              executionTime = currentTime - previousTime;
              time          = currentTime;
              performance.push({
                'Element'        : element,
                'Name'           : message[0],
                'Arguments'      : [].slice.call(message, 1) || '',
                'Execution Time' : executionTime
              });
            }
            clearTimeout(modal.performance.timer);
            modal.performance.timer = setTimeout(modal.performance.display, 100);
          },
          display: function() {
            var
              title = settings.moduleName + ':',
              totalTime = 0
            ;
            time = false;
            clearTimeout(modal.performance.timer);
            $.each(performance, function(index, data) {
              totalTime += data['Execution Time'];
            });
            title += ' ' + totalTime + 'ms';
            if(moduleSelector) {
              title += ' \'' + moduleSelector + '\'';
            }
            if( (console.group !== undefined || console.table !== undefined) && performance.length > 0) {
              console.groupCollapsed(title);
              if(console.table) {
                console.table(performance);
              }
              else {
                $.each(performance, function(index, data) {
                  console.log(data['Name'] + ': ' + data['Execution Time']+'ms');
                });
              }
              console.groupEnd();
            }
            performance = [];
          }
        },
        invoke: function(query, passedArguments, context) {
          var
            maxDepth,
            found
          ;
          passedArguments = passedArguments || queryArguments;
          context         = element         || context;
          if(typeof query == 'string' && instance !== undefined) {
            query    = query.split(/[\. ]/);
            maxDepth = query.length - 1;
            $.each(query, function(depth, value) {
              if( $.isPlainObject( instance[value] ) && (depth != maxDepth) ) {
                instance = instance[value];
              }
              else if( instance[value] !== undefined ) {
                found = instance[value];
              }
              else {
                modal.error(error.method);
              }
            });
          }
          if ( $.isFunction( found ) ) {
            return found.apply(context, passedArguments);
          }
          return found || false;
        }
      };

      if(methodInvoked) {
        if(instance === undefined) {
          modal.initialize();
        }
        invokedResponse = modal.invoke(query);
      }
      else {
        if(instance !== undefined) {
          modal.destroy();
        }
        modal.initialize();
      }
    })
  ;
};

$.fn.modal.settings = {

  moduleName  : 'Modal',
  namespace   : 'modal',
  
  verbose     : true,
  debug       : true,
  performance : true,

  selector   : {
    closeButton : '.close'
  },

  error : {
    method : 'The method you called is not defined.'
  },

  className : {
    scrolling : 'scrolling'
  },

  onShow     : function(){},
  onHide     : function(){},

  transition : 'scale',

  context    : 'body',
  offset     : -25,

  duration   : 400,
  easing     : 'easeOutExpo'
};


})( jQuery, window , document );
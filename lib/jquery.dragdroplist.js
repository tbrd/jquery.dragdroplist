/**
 * dragdroplist v0.1
 * author @tbrd
 * 28/05/2012
 *
 */

(function ($) {
    var DragDropList = function (settings) {
        var $dragging;
        var positions;
        var scrollInterval;
        var $boundary = settings.$boundary;
        var boundaryScrollHeight;
        var UP = 'up';
        var DOWN = 'down';
        var SCROLL_SPEED = 8; // pixels per scroll-interval
        var SCROLL_INTERVAL = 30; // ms

        /**
         * store the original boundary-relative position and set absolute position
         * assumes 'this' is a draggable html element within boundary
         */
        function setAbsolutePosition() {
            var top = $(this).position().top + $boundary.scrollTop();
            var width = $(this).innerWidth();

            // store current yPos
            positions.unshift(top);
            // move to absolute positioning
            $(this)
                .css({
                    position: 'absolute',
                    top: top,
                    width: width
                });
        }

        /**
         * handle start.dragndrop event
         * @param event
         */
        function handleDragStart(event) {
            positions = [];
            $.fn.reverse = [].reverse;
            // HTMLElement.scrollHeight provides incorrect value
            boundaryScrollHeight = function(){
                var scrollHeight = 0;
                $boundary
                    .children()
                        .each(function(){
                            scrollHeight += $(this).outerHeight();
                        });
                return scrollHeight;
            }();
            // insert placeholder
            $boundary.append($('<' + settings.tagName + '/>', {
                'class': 'placeholder',
                height: boundaryScrollHeight
            }));
            // bring list to the front
            $boundary
                .css('z-index', 2)
                .find('.draggable')
                    .each(function (listIndex) {
                        // store current list index
                        $(this).data('draggable-index', listIndex);
                    })
                    .reverse()
                    .each(setAbsolutePosition);
            $dragging = $(event.target);
            $dragging.css({'z-index': 10});
        }

        /**
         * swap list positions of draggable and target
         * @param $target
         */
        function swapListItemPositions($target, direction) {
            var draggableListIndex = $dragging.data('draggable-index');
            var targetListIndex = $target.data('draggable-index');
            var targetTop;
            var heightDifference = $target.outerHeight() - $dragging.outerHeight();

            if (direction === "up") {
                targetTop = positions[draggableListIndex] - heightDifference;
            } else {
                targetTop = positions[draggableListIndex];
                positions[targetListIndex] = targetTop + $target.outerHeight();
            }
            $target
                .stop()
                .animate({'top': targetTop}, 'fast');
            $dragging.data('draggable-index', targetListIndex);
            $target.data('draggable-index', draggableListIndex);

        }

        /**
         * as the draggable moves, we calculate if we need to move it to a new list position
         * @param direction ['up'|'down']
         */
        function snapToListPosition(direction) {
            var $target;
            var dragElementPositionTop = $dragging.position().top;
            var dragElementHeight = $dragging.outerHeight();
            var targetElementPositionTop;
            var targetElementHeight;

            // if the delta is large enough, $target may well not be the previous list element
            if (direction === UP) {
                $target = $dragging.prev('.draggable');
            } else {
                $target = $dragging.next('.draggable');
            }

            // if $draggable is more than 50% over $target swap positions
            if ($target.length) {
                targetElementPositionTop = $target.position().top;
                targetElementHeight = $target.outerHeight();
                if (direction === UP) {
                    if (dragElementPositionTop <
                        targetElementPositionTop + targetElementHeight / 2) {
                        $dragging.insertBefore($target);
                        swapListItemPositions($target, direction);
                    }
                } else {
                    // check whether drag.$dragging yPos is more than 50% over $target
                    if (dragElementPositionTop + dragElementHeight >
                        targetElementPositionTop + targetElementHeight / 2) {
                        // if it is, switch positions
                        $dragging.insertAfter($target);
                        swapListItemPositions($target, direction);
                    }
                }
            }
        }

        /**
         * scroll the js-int-scroller
         * @param direction ['up'|'down']
         */
        function scroll(direction) {
            var delta = direction === DOWN ? SCROLL_SPEED : -SCROLL_SPEED;
            var boundaryScrollTop = $boundary.scrollTop();
            var dragElementTop = parseInt($dragging.css('top'), 10);
            var dragElementBottom = dragElementTop + $dragging.outerHeight();

            // don't try to scroll off the top of the list
            if (boundaryScrollTop + delta < 0) {
                stopScroll();
            // don't try to scroll off the bottom of the list
            } else if (boundaryScrollTop + delta > boundaryScrollHeight - $boundary.innerHeight()) {
                stopScroll();
            } else {
                $boundary.scrollTop($boundary.scrollTop() + delta);
                if ((dragElementTop + delta > 0) &&
                    (dragElementBottom + delta < boundaryScrollHeight)) {
                    $dragging.css({'top': dragElementTop + delta});
                }
                snapToListPosition(direction);
            }
        }

        /**
         * @param direction ['up'|'down']
         */
        function startScroll(direction) {
            stopScroll();
            scrollInterval = setInterval(_.bind(scroll, this, direction), SCROLL_INTERVAL);
        }

        function stopScroll() {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }

        /**
         * handle the drag.draggable event
         * @param event Not used
         * @param delta
         */
        function handleDrag(event, delta, mousepos) {
            // check $dragging has been initialized properly.
            if ($dragging) {
                var direction;
                var draggableTop = parseInt($dragging.css('top'), 10);
                var draggableBottom = draggableTop + $dragging.outerHeight();
                var scrollBottom = $boundary.scrollTop() + $boundary.innerHeight();
                var deltaY;

                // move dragging element
                if (delta) {
                    direction = delta.y < 0 ? UP : DOWN;
                    deltaY = delta.y;
                    // move the placeholder position of the dragging item up/down the list until
                    // it corresponds to the provided delta. we have to repeat this to ensure all
                    // steps are animated
                    while (deltaY < 0) {
                        snapToListPosition(direction);
                        deltaY += $dragging.outerHeight();
                    }
                    deltaY = delta.y;
                    while (deltaY > 0) {
                        snapToListPosition(direction);
                        deltaY -= $dragging.outerHeight();
                    }
                }

                // sometimes mousepos is not defined, no idea why as this is always passed with the
                // trigger
                if (mousepos) {
                    // stop scrolling if the mouse is within the boundary
                    if (mousepos.y > $boundary.offset().top ||
                        mousepos.y < $boundary.offset().top + $boundary.outerHeight()) {
                        stopScroll();
                    }
                } else {
                    stopScroll();
                }
                // scroll
                // if the element is above/below the top/bottom of the list we should scroll the
                // list
                if (!scrollInterval) {
                    if (draggableBottom > scrollBottom) {
                        startScroll(DOWN);
                    } else if (draggableTop < $boundary.scrollTop()) {
                        startScroll(UP);
                    } else {
                        stopScroll();
                    }
                }
            }
        }

        /**
         * reset styles & remove placeholder
         */
        function reset() {
            $boundary
                .css('height', 'auto')
                .find('.placeholder')
                .remove()
                .end()
                .find('.draggable')
                .attr('style', '');
        }

        /**
         * handle the drop.draggable event - clear up
         */
        function handleDrop() {
            stopScroll();
            // drop draggable in to place smoothly
            $dragging.animate({'top': positions[$dragging.data('draggable-index')]}, 'fast', reset);
            $dragging.trigger('drop.dragdroplist');
        }

        return {
            handleDragStart: handleDragStart,
            handleDrop: handleDrop,
            handleDrag: handleDrag
        };

    };

    $.fn.dragdroplist = function (options) {
        var defaults = {
            orientation: 'vertical',
            tagName: 'li'
        };

        $(this).each(function() {

            var settings;
            var dragDropList;

            if (!$(this).data('dragdroplist')) {
                settings = $.extend({}, defaults, options);
                settings.$boundary = $(this);
                $(this).data('dragdroplist', {'settings': settings});
                dragDropList = new DragDropList(settings);
                $(this)
                    .find(settings.tagName)
                        .dragndrop({
                            translateX: settings.orientation === 'horizontal',
                            translateY: settings.orientation === 'vertical',
                            handle: settings.handle ? settings.handle : settings.tagName,
                            boundary: settings.$boundary
                        });
                $(this)
                    .bind('start.draggable', dragDropList.handleDragStart)
                    .bind('drop.draggable', dragDropList.handleDrop)
                    .bind('drag.draggable', dragDropList.handleDrag);
            }
        });

        return $(this);

    };
}(jQuery));
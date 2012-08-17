jquery.dragdroplist
===================

Jquery drag-n-drop list plugin

Allow user to drag/drop items within a list. Other list items are move around dragging element.

Draggable elements within the list should have the class 'draggable'

NB: Requires jquery.dragndrop.js (http://github.com/tbrd/jquery.dragndrop)

jquery.dragdroplist currently only supports vertical lists.

Usage
-----

    $().dragdroplist(Options)

Example
-------

    $('.drag-drop-list').dragdroplist({
        translateY: true,
        handle: '.drag-handle'
    });


Settings
--------

### tagName (String)
Default: 'li'
Tag name for draggable elements (elements must all be of same type)

### handle (String)
Default: undefined
Selector for child element to use as drag handle.

### translateY (Boolean)
Default: true
Allow user to drag items along Y axis

Events
------

### drop.dragdroplist
Fired when user drops element
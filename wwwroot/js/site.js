// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

/**
 * Initialize Bootstrap 5 tooltips under a container (or whole document).
 * Safe to call after adding dynamic HTML; skips elements that already have a Tooltip instance.
 */
window.initTooltips = function (container) {
    if (typeof bootstrap === 'undefined') return;
    var root = container && container.nodeType ? container : document;
    var nodes = root.querySelectorAll('[data-bs-toggle="tooltip"]');
    nodes.forEach(function (el) {
        if (!bootstrap.Tooltip.getInstance(el)) {
            new bootstrap.Tooltip(el);
        }
    });
};

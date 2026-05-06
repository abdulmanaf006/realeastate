/**
 * App-wide modal dialogs (replaces window.alert / window.confirm for UI consistency).
 * Requires Bootstrap 5 + Views/Shared/_AppDialogs.cshtml included before this script.
 */
(function () {
    'use strict';

    var alertModalInst;
    var confirmModalInst;

    function getAlertModal() {
        var el = document.getElementById('appDialogAlertModal');
        if (!el || typeof bootstrap === 'undefined') return null;
        if (!alertModalInst) alertModalInst = bootstrap.Modal.getOrCreateInstance(el, { backdrop: 'static', keyboard: true });
        return alertModalInst;
    }

    function getConfirmModal() {
        var el = document.getElementById('appDialogConfirmModal');
        if (!el || typeof bootstrap === 'undefined') return null;
        if (!confirmModalInst) confirmModalInst = bootstrap.Modal.getOrCreateInstance(el, { backdrop: 'static', keyboard: true });
        return confirmModalInst;
    }

    window.AppDialog = {
        /**
         * @param {string} message
         * @param {{ title?: string, variant?: 'primary'|'danger' }} [options]
         * @returns {Promise<void>}
         */
        alert: function (message, options) {
            options = options || {};
            return new Promise(function (resolve) {
                var m = getAlertModal();
                var el = document.getElementById('appDialogAlertModal');
                var body = document.getElementById('appDialogAlertBody');
                var titleEl = document.getElementById('appDialogAlertTitle');
                var iconWrap = document.getElementById('appDialogAlertIcon');
                if (!m || !el || !body) {
                    window.alert(message);
                    resolve();
                    return;
                }
                if (titleEl) titleEl.textContent = options.title || 'Notice';
                body.textContent = message || '';
                if (iconWrap) {
                    var danger = options.variant === 'danger';
                    iconWrap.className =
                        'avatar avatar-sm d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ' +
                        (danger ? 'bg-label-danger' : 'bg-label-primary');
                    iconWrap.innerHTML = danger ? '<i class="bx bx-error-circle"></i>' : '<i class="bx bx-info-circle"></i>';
                }

                var settled = false;
                function done() {
                    if (settled) return;
                    settled = true;
                    el.removeEventListener('hidden.bs.modal', onHidden);
                    resolve();
                }

                function onHidden() {
                    done();
                }

                el.addEventListener('hidden.bs.modal', onHidden);
                m.show();
            });
        },

        /**
         * @param {string} message
         * @param {{ title?: string, danger?: boolean, confirmText?: string, cancelText?: string }} [options]
         * @returns {Promise<boolean>}
         */
        confirm: function (message, options) {
            options = options || {};
            return new Promise(function (resolve) {
                var m = getConfirmModal();
                var modalEl = document.getElementById('appDialogConfirmModal');
                var body = document.getElementById('appDialogConfirmBody');
                var titleEl = document.getElementById('appDialogConfirmTitle');
                var okBtn = document.getElementById('appDialogConfirmOk');
                var cancelBtn = document.getElementById('appDialogConfirmCancel');
                if (!m || !modalEl || !body || !okBtn || !cancelBtn) {
                    resolve(window.confirm(message));
                    return;
                }

                if (titleEl) titleEl.textContent = options.title || 'Please confirm';
                body.textContent = message || '';
                okBtn.textContent = options.confirmText || 'Confirm';
                cancelBtn.textContent = options.cancelText || 'Cancel';
                var danger = options.danger !== false;
                okBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');

                var settled = false;

                function cleanup() {
                    okBtn.removeEventListener('click', onOk);
                    cancelBtn.removeEventListener('click', onCancel);
                    modalEl.removeEventListener('hidden.bs.modal', onHidden);
                }

                function finish(val) {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    resolve(val);
                }

                function onOk() {
                    finish(true);
                    m.hide();
                }

                function onCancel() {
                    finish(false);
                    m.hide();
                }

                function onHidden() {
                    if (!settled) finish(false);
                }

                okBtn.addEventListener('click', onOk);
                cancelBtn.addEventListener('click', onCancel);
                modalEl.addEventListener('hidden.bs.modal', onHidden);
                m.show();
            });
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        document.addEventListener(
            'submit',
            function (e) {
                var form = e.target;
                if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-app-confirm')) return;
                e.preventDefault();
                e.stopPropagation();
                var msg = form.getAttribute('data-app-confirm');
                var title = form.getAttribute('data-app-confirm-title');
                window.AppDialog.confirm(msg || '', {
                    title: title || 'Please confirm',
                    danger: true
                }).then(function (ok) {
                    if (ok) form.submit();
                });
            },
            false
        );

        document.addEventListener(
            'click',
            function (e) {
                var btn = e.target.closest('[data-app-submit-form][data-app-confirm]');
                if (!btn) return;
                e.preventDefault();
                e.stopPropagation();
                var formId = btn.getAttribute('data-app-submit-form');
                var msg = btn.getAttribute('data-app-confirm');
                var title = btn.getAttribute('data-app-confirm-title');
                var form = document.getElementById(formId);
                if (!form) return;
                window.AppDialog.confirm(msg || '', {
                    title: title || 'Please confirm',
                    danger: true
                }).then(function (ok) {
                    if (ok) form.submit();
                });
            },
            false
        );

        document.addEventListener(
            'click',
            function (e) {
                var a = e.target.closest('a[data-app-confirm][href]');
                if (!a || a.hasAttribute('data-app-no-dialog')) return;
                var href = a.getAttribute('href');
                if (!href || href === '#' || href.indexOf('javascript:') === 0) return;
                e.preventDefault();
                e.stopPropagation();
                var title = a.getAttribute('data-app-confirm-title');
                window.AppDialog.confirm(a.getAttribute('data-app-confirm') || '', {
                    title: title || 'Please confirm',
                    danger: false
                }).then(function (ok) {
                    if (ok) window.location.href = href;
                });
            },
            false
        );

        document.addEventListener(
            'click',
            function (e) {
                var btn = e.target.closest('[data-app-alert-msg]');
                if (!btn) return;
                e.preventDefault();
                e.stopPropagation();
                var msg = btn.getAttribute('data-app-alert-msg');
                var title = btn.getAttribute('data-app-alert-title');
                var variant = btn.getAttribute('data-app-alert-variant');
                window.AppDialog.alert(msg || '', {
                    title: title || 'Notice',
                    variant: variant === 'danger' ? 'danger' : 'primary'
                });
            },
            false
        );
    });
})();

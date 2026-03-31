(function () {
    var cfg = window.pdcPayableConfig;
    if (!cfg) return;

    function getFilterPayload() {
        var showAll = $('#ShowAll').is(':checked');
        var ledgerId = $('#accountSelect').val();
        var st = $('#SearchText').val();
        return {
            chequeDateFrom: $('#ChequeDateFrom').val() || null,
            chequeDateTo: $('#ChequeDateTo').val() || null,
            accountType: $('#AccountType').val() || null,
            accountLedgerId: ledgerId ? parseInt(ledgerId, 10) : null,
            showAll: showAll,
            searchText: st && String(st).trim() ? String(st).trim() : null
        };
    }

    function getFilterQuery() {
        var f = getFilterPayload();
        return $.param({
            chequeDateFrom: f.chequeDateFrom || '',
            chequeDateTo: f.chequeDateTo || '',
            accountType: f.accountType || '',
            accountLedgerId: f.accountLedgerId || '',
            showAll: f.showAll,
            searchText: f.searchText || ''
        });
    }

    function statusBadge(status) {
        if (status === 'Cleared') return '<span class="badge bg-label-success">Cleared</span>';
        if (status === 'Bounced') return '<span class="badge bg-label-secondary">Bounced</span>';
        if (status === 'Pending') return '<span class="badge bg-label-warning">Pending</span>';
        return '<span class="badge bg-label-secondary">' + $('<div>').text(status).html() + '</span>';
    }

    function journalDetailsUrl(id) {
        if (!cfg.journalDetailsUrlTemplate) return '#';
        return cfg.journalDetailsUrlTemplate.replace('999999', String(id));
    }

    function actionsCell(r) {
        var canEdit = cfg.canEdit;
        var canViewJ = cfg.canViewJournal;
        var rk = r.rowKey || '';
        if (canEdit && r.canClear) {
            var clearUrl = cfg.redirectToJournalUrl + '?rowKey=' + encodeURIComponent(rk);
            return '<td class="text-end text-nowrap d-print-none">' +
                '<a class="btn btn-sm btn-primary pdc-clear-link" href="' + clearUrl + '" onclick="return confirm(\'Create a journal voucher to clear this PDC cheque? You will be redirected to Journal Voucher.\');">' +
                '<i class="bx bx-right-arrow-alt me-1"></i> Clear</a></td>';
        }
        if (canViewJ && r.journalVoucherId) {
            var jvNo = r.journalVoucherNo ? $('<div>').text(r.journalVoucherNo).html() : '';
            var jvHref = journalDetailsUrl(r.journalVoucherId);
            return '<td class="text-end text-nowrap d-print-none">' +
                '<a class="btn btn-sm btn-outline-secondary" href="' + jvHref + '" title="View journal voucher">' +
                '<i class="bx bx-file me-1"></i> JV ' + jvNo + '</a></td>';
        }
        return '<td class="text-end d-print-none"><span class="text-muted">—</span></td>';
    }

    function renderRows(rows) {
        var colSpan = cfg.tableColSpan || 10;

        if (!rows || rows.length === 0) {
            $('#pdcTableBody').html(
                '<tr id="pdcEmptyRow"><td colspan="' + colSpan + '" class="text-secondary py-4 text-center">No PDC cheques match your filters.</td></tr>'
            );
            return;
        }

        var html = '';
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            var rk = r.rowKey || '';
            var rowClass = r.rowCssClass || '';
            html += '<tr class="' + $('<div>').text(rowClass).html() + '" data-row-key="' + $('<div>').text(rk).html() + '" data-kind="' + r.rowKind + '">';
            html += '<td class="fw-medium text-nowrap">' + $('<div>').text(r.voucherCode).html() + '</td>';
            html += '<td class="text-nowrap">' + (r.voucherDate ? r.voucherDate.split('T')[0] : '') + '</td>';
            html += '<td>' + $('<div>').text(r.chequeNo).html() + '</td>';
            html += '<td class="text-nowrap">' + (r.chequeDate ? r.chequeDate.split('T')[0] : '') + '</td>';
            html += '<td>' + (r.description ? $('<div>').text(r.description).html() : '—') + '</td>';
            html += '<td>' + $('<div>').text(r.accountName).html() + '</td>';
            html += '<td class="text-end">' + Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
            html += '<td>' + $('<div>').text(r.daysTillNowDisplay).html() + '</td>';
            html += '<td>' + statusBadge(r.status) + '</td>';
            html += actionsCell(r);
            html += '</tr>';
        }
        $('#pdcTableBody').html(html);
    }

    function runSearch() {
        $('#pdcSearchAlert').addClass('d-none').text('');
        $.ajax({
            url: cfg.searchUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(getFilterPayload())
        }).done(function (res) {
            if (!res.ok) {
                var msg = (res.errors && res.errors.length) ? res.errors.join(' ') : 'Validation failed.';
                $('#pdcSearchAlert').removeClass('d-none').text(msg);
                return;
            }
            renderRows(res.rows || []);
        }).fail(function () {
            $('#pdcSearchAlert').removeClass('d-none').text('Search failed.');
        });
    }

    function buildExportUrl(base) {
        return base + (base.indexOf('?') >= 0 ? '&' : '?') + getFilterQuery();
    }

    $(function () {
        $('#accountSelect').select2({
            placeholder: 'Search account…',
            allowClear: true,
            ajax: {
                delay: 250,
                url: cfg.accountsUrl,
                dataType: 'json',
                data: function (params) {
                    return {
                        q: params.term,
                        accountType: $('#AccountType').val(),
                        showAll: $('#ShowAll').is(':checked')
                    };
                },
                processResults: function (data) {
                    return { results: (data && data.results) ? data.results : [] };
                },
                cache: true
            },
            minimumInputLength: 0
        });

        function toggleAccountSelect() {
            var showAll = $('#ShowAll').is(':checked');
            $('#accountSelect').prop('disabled', showAll);
            if (showAll) {
                $('#accountSelect').val(null).trigger('change');
            }
        }

        $('#ShowAll').on('change', toggleAccountSelect);
        toggleAccountSelect();

        $('#AccountType').on('change', function () {
            $('#accountSelect').val(null).trigger('change');
        });

        $('#btnSearch').on('click', runSearch);

        $('#btnReset').on('click', function () {
            $('#ChequeDateFrom').val('');
            $('#ChequeDateTo').val('');
            $('#AccountType').val('');
            $('#SearchText').val('');
            $('#ShowAll').prop('checked', true);
            $('#accountSelect').val(null).trigger('change');
            toggleAccountSelect();
            runSearch();
        });

        $('#btnPrint').on('click', function () {
            window.print();
        });

        $('#lnkExcel').on('click', function (e) {
            e.preventDefault();
            window.location.href = buildExportUrl(cfg.exportExcelUrl);
        });

        $('#lnkPdf').on('click', function (e) {
            e.preventDefault();
            window.location.href = buildExportUrl(cfg.exportPdfUrl);
        });
    });
})();

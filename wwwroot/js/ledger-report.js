(function () {
    var cfg = window.ledgerReportConfig;
    if (!cfg) return;

    function getFilterPayload() {
        var lid = $('#LedgerId').val();
        return {
            ledgerId: lid ? parseInt(lid, 10) : null,
            fromDate: $('#FromDate').val() || null,
            toDate: $('#ToDate').val() || null
        };
    }

    function getFilterQuery() {
        var f = getFilterPayload();
        return $.param({
            ledgerId: f.ledgerId || '',
            fromDate: f.fromDate || '',
            toDate: f.toDate || ''
        });
    }

    function fmtMoney(n) {
        if (n === undefined || n === null || isNaN(n)) return '—';
        return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function renderResult(result) {
        var lines = result.lines || [];
        if (lines.length === 0) {
            $('#ledgerTableBody').html(
                '<tr><td colspan="8" class="text-secondary py-4 text-center">No journal lines for this period.</td></tr>'
            );
        } else {
            var html = '';
            for (var i = 0; i < lines.length; i++) {
                var r = lines[i];
                var d = r.date ? (r.date.split('T')[0] || r.date) : '';
                html += '<tr>';
                html += '<td class="text-end">' + $('<div>').text(r.siNo).html() + '</td>';
                html += '<td class="text-nowrap">' + $('<div>').text(d).html() + '</td>';
                html += '<td>' + $('<div>').text(r.reference || '').html() + '</td>';
                html += '<td class="text-nowrap">' + $('<div>').text(r.documentNo || '').html() + '</td>';
                html += '<td>' + $('<div>').text(r.description || '—').html() + '</td>';
                html += '<td class="text-end">' + (r.debit > 0 ? fmtMoney(r.debit) : '—') + '</td>';
                html += '<td class="text-end">' + (r.credit > 0 ? fmtMoney(r.credit) : '—') + '</td>';
                html += '<td class="text-end">' + fmtMoney(r.balance) + '</td>';
                html += '</tr>';
            }
            $('#ledgerTableBody').html(html);
        }

        $('#footOpening').text(fmtMoney(result.openingBalance));
        $('#footDebit').text(fmtMoney(result.totalDebit));
        $('#footCredit').text(fmtMoney(result.totalCredit));
        $('#footClosing').text(fmtMoney(result.closingBalance));
        $('#ledgerFooter').removeClass('d-none');
        $('#btnPrint').prop('disabled', false).attr('title', '');
        $('#lnkPdf').removeClass('d-none').attr('href', cfg.exportPdfUrl + '?' + getFilterQuery());
    }

    function runSearch() {
        $('#ledgerSearchAlert').addClass('d-none').text('');
        var f = getFilterPayload();
        if (!f.ledgerId) {
            $('#ledgerSearchAlert').removeClass('d-none').text('Please select a ledger.');
            return;
        }

        $.ajax({
            url: cfg.searchUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(getFilterPayload())
        }).done(function (res) {
            if (!res.ok) {
                var msg = (res.errors && res.errors.length) ? res.errors.join(' ') : 'Search failed.';
                $('#ledgerSearchAlert').removeClass('d-none').text(msg);
                $('#ledgerFooter').addClass('d-none');
                $('#btnPrint').prop('disabled', true);
                $('#lnkPdf').addClass('d-none');
                $('#ledgerTableBody').html(
                    '<tr><td colspan="8" class="text-secondary py-4 text-center">No data.</td></tr>'
                );
                return;
            }
            renderResult(res.result);
        }).fail(function () {
            $('#ledgerSearchAlert').removeClass('d-none').text('Search failed.');
        });
    }

    $(function () {
        $('#btnSearch').on('click', runSearch);

        $('#btnReset').on('click', function () {
            $('#LedgerId').val('');
            $('#FromDate').val(cfg.defaultFrom || '');
            $('#ToDate').val(cfg.defaultTo || '');
            $('#ledgerTableBody').html(
                '<tr id="ledgerEmptyRow"><td colspan="8" class="text-secondary py-4 text-center">Select a ledger and click Search to load the statement.</td></tr>'
            );
            $('#ledgerFooter').addClass('d-none');
            $('#btnPrint').prop('disabled', true).attr('title', 'Run a search first');
            $('#lnkPdf').addClass('d-none');
            $('#ledgerSearchAlert').addClass('d-none').text('');
        });

        $('#btnPrint').on('click', function () {
            var f = getFilterPayload();
            if (!f.ledgerId) {
                $('#ledgerSearchAlert').removeClass('d-none').text('Please select a ledger and run Search first.');
                return;
            }
            var url = cfg.printUrl + (cfg.printUrl.indexOf('?') >= 0 ? '&' : '?') + getFilterQuery();
            window.open(url, '_blank', 'noopener,noreferrer');
        });
    });
})();

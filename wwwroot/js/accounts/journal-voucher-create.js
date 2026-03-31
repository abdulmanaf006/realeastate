(function ($) {
    function toNumber(v) {
        var n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }

    function reindexRows() {
        $('#entryTable tbody tr').each(function (idx) {
            $(this).find('input, select').each(function () {
                var name = $(this).attr('name');
                if (!name) return;
                $(this).attr('name', name.replace(/Entries\[\d+\]/, 'Entries[' + idx + ']'));
            });
        });
    }

    function calculateTotals() {
        var totalDebit = 0;
        var totalCredit = 0;

        $('#entryTable tbody tr').each(function () {
            var d = toNumber($(this).find('.debit-input').val());
            var c = toNumber($(this).find('.credit-input').val());
            totalDebit += d;
            totalCredit += c;

            var invalid = (d > 0 && c > 0) || (d <= 0 && c <= 0);
            $(this).toggleClass('table-danger', invalid);
        });

        $('#TotalDebit').val(totalDebit.toFixed(2));
        $('#TotalCredit').val(totalCredit.toFixed(2));

        var diff = totalDebit - totalCredit;
        $('#Difference').val(diff.toFixed(2));
        $('#Difference').toggleClass('text-danger fw-bold', Math.abs(diff) > 0.0001);
        $('#saveBtn').prop('disabled', Math.abs(diff) > 0.0001);
    }

    function updateOptionalBalanceInfo($row, ledgerData) {
        var debit = toNumber($row.find('.debit-input').val());
        var credit = toNumber($row.find('.credit-input').val());
        var previous = toNumber(ledgerData.previousBalance || 0);
        var current = previous + debit - credit;
        $('#PreviousBalance').val(previous.toFixed(2));
        $('#CurrentBalance').val(current.toFixed(2));
        $('#CurrentBalance').toggleClass('text-danger fw-bold', current < 0);
        $('#SelectedLedgerName').val((ledgerData.code || '') + (ledgerData.name ? ' - ' + ledgerData.name : ''));
    }

    function loadLedgerInfo($row) {
        var ledgerId = $row.find('.ledger-select').val();
        if (!ledgerId) {
            $row.find('.account-code').val('');
            $row.find('.account-name').val('');
            $('#SelectedLedgerName').val('-');
            $('#PreviousBalance').val('0.00');
            $('#CurrentBalance').val('0.00');
            return;
        }

        $.getJSON('/Accounts/JournalVoucher/LedgerInfo', { ledgerId: ledgerId })
            .done(function (data) {
                $row.find('.account-code').val(data.code || '');
                $row.find('.account-name').val(data.name || '');
                updateOptionalBalanceInfo($row, data);
            });
    }

    function addRow() {
        var nextIndex = $('#entryTable tbody tr').length;
        var html = $('#entryRowTemplate').prop('outerHTML').replaceAll('__index__', nextIndex);
        $('#entryTable tbody').append(html);
        $('#entryTable tbody tr:last').removeAttr('id');
        calculateTotals();
    }

    $(function () {
        $('#addRowBtn').on('click', addRow);

        $('#entryTable').on('click', '.delete-row-btn', function () {
            if ($('#entryTable tbody tr').length <= 2) {
                alert('At least 2 rows are required.');
                return;
            }
            $(this).closest('tr').remove();
            reindexRows();
            calculateTotals();
        });

        $('#entryTable').on('change', '.ledger-select', function () {
            var $row = $(this).closest('tr');
            loadLedgerInfo($row);
            calculateTotals();
        });

        $('#entryTable').on('input', '.debit-input', function () {
            var $row = $(this).closest('tr');
            if (toNumber($(this).val()) > 0) {
                $row.find('.credit-input').val('0');
            }
            calculateTotals();
            if ($row.find('.ledger-select').val()) {
                loadLedgerInfo($row);
            }
        });

        $('#entryTable').on('input', '.credit-input', function () {
            var $row = $(this).closest('tr');
            if (toNumber($(this).val()) > 0) {
                $row.find('.debit-input').val('0');
            }
            calculateTotals();
            if ($row.find('.ledger-select').val()) {
                loadLedgerInfo($row);
            }
        });

        $('#entryTable tbody tr').each(function () {
            var $row = $(this);
            if ($row.find('.ledger-select').val()) {
                loadLedgerInfo($row);
            }
        });

        calculateTotals();
    });
})(jQuery);

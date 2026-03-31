(function ($) {
    var LIMIT = 1000000;

    function toNumber(value) {
        var n = parseFloat(value);
        return isNaN(n) ? 0 : n;
    }

    function calculateBalance() {
        var previous = toNumber($("#PreviousBalance").val());
        var amount = toNumber($("#Amount").val());
        var balance = previous - amount;

        $("#BeingPaid").val(amount.toFixed(2));
        $("#Balance").val(balance.toFixed(2));
        $("#Balance").toggleClass("text-danger fw-bold", balance < 0);

        var exceeds = Math.abs(balance) > LIMIT;
        $("#BalanceAlert").toggleClass("d-none", !exceeds);
    }

    function togglePaymentFields() {
        var type = ($("#PaymentType").val() || '').toLowerCase();
        var isCheque = type === 'cheque';
        var isBank = type === 'bank' || type === 'cheque';

        $(".cheque-only").toggleClass("d-none", !isCheque);
        $(".bank-only").toggleClass("d-none", !isBank);

        if (!isCheque) {
            $("#ChequeDate").val('');
            $("#IsPDC").prop('checked', false);
        }

        if (!isBank) {
            $("#BankName").val('');
        }
    }

    function loadAccountInfo(ledgerId) {
        if (!ledgerId) {
            $("#AccountCode").val("");
            $("#AccountName").val("");
            $("#PreviousBalance").val("0.00");
            calculateBalance();
            return;
        }

        $.getJSON('/Accounts/PaymentVoucher/AccountInfo', { ledgerId: ledgerId })
            .done(function (data) {
                $("#AccountCode").val(data.code || '');
                $("#AccountName").val(data.name || '');
                $("#PreviousBalance").val((toNumber(data.previousBalance)).toFixed(2));
                calculateBalance();
            });
    }

    $(function () {
        $("#AccountLedgerId").on("change", function () {
            loadAccountInfo($(this).val());
        });

        $("#Amount").on("input", calculateBalance);
        $("#PaymentType").on("change", togglePaymentFields);

        togglePaymentFields();

        if ($("#AccountLedgerId").val()) {
            loadAccountInfo($("#AccountLedgerId").val());
        } else {
            calculateBalance();
        }
    });
})(jQuery);

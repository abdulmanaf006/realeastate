(function ($) {
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
    }

    function loadAccountInfo(ledgerId) {
        if (!ledgerId) {
            $("#AccountCode").val("");
            $("#AccountName").val("");
            $("#PreviousBalance").val("0.00");
            calculateBalance();
            return;
        }

        $.getJSON('/Accounts/ReceiptVoucher/AccountInfo', { ledgerId: ledgerId })
            .done(function (data) {
                $("#AccountCode").val(data.code || '');
                $("#AccountName").val(data.name || '');
                $("#PreviousBalance").val((toNumber(data.previousBalance)).toFixed(2));
                calculateBalance();
            });
    }

    function syncPdcUi() {
        var on = $("#IsPDC").is(":checked");
        $(".pdc-only").toggleClass("d-none", !on);
    }

    $(function () {
        $("#AccountLedgerId").on("change", function () {
            loadAccountInfo($(this).val());
        });

        $("#Amount").on("input", calculateBalance);

        $("#IsPDC").on("change", syncPdcUi);
        syncPdcUi();

        if ($("#AccountLedgerId").val()) {
            loadAccountInfo($("#AccountLedgerId").val());
        } else {
            calculateBalance();
        }
    });
})(jQuery);

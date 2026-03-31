!(function() {
    var e = document.querySelectorAll(".invoice-item-price"),
        t = document.querySelectorAll(".invoice-item-qty"),
        n = document.querySelectorAll(".date-picker");
    e &&
        e.forEach(function(e) {
            new Cleave(e, { delimiter: "", numeral: !0 });
        }),
        t &&
        t.forEach(function(e) {
            new Cleave(e, { delimiter: "", numeral: !0 });
        }),
        n &&
        n.forEach(function(e) {
            e.flatpickr({ monthSelectorType: "static" });
        });
})(),
$(function() {
    var e = $(".btn-apply-changes"),
        t = $(".source-item"),
        c = { "App Design": "Designed UI kit & app pages.", "App Customization": "Customization & Bug Fixes.", "ABC Template": "Bootstrap 4 admin template.", "App Development": "Native App Development." };

    var TAX_PCT = 5;

    function fmtMoney(n) {
        return "$" + (Math.round(n * 100) / 100).toFixed(2);
    }

    function parseDiscPct($w) {
        return parseFloat(String($w.find(".discount").first().text()).replace(/[^0-9.-]/g, "")) || 0;
    }

    function recalcInvoiceAdd() {
        var sumGross = 0,
            sumDisc = 0,
            sumTax = 0,
            sumLine = 0;
        $(".invoice-add .repeater-wrapper").each(function() {
            var $w = $(this);
            var u = parseFloat(String($w.find(".invoice-item-price").val()).replace(/[^0-9.-]/g, "")) || 0;
            var q = parseFloat(String($w.find(".invoice-item-qty").val()).replace(/[^0-9.-]/g, "")) || 0;
            var discPct = parseDiscPct($w);
            var gross = u * q;
            var afterDisc = gross * (1 - discPct / 100);
            var lineTotal = afterDisc * (1 + TAX_PCT / 100);
            var discAmt = gross - afterDisc;
            var taxAmt = lineTotal - afterDisc;
            sumGross += gross;
            sumDisc += discAmt;
            sumTax += taxAmt;
            sumLine += lineTotal;
            $w.find(".tax-1").first().text(TAX_PCT + "%");
            $w.find(".tax-2").first().text("0%");
            $w.find(".line-total-display").first().text(fmtMoney(lineTotal));
        });
        $("#invoice-add-calc-subtotal").text(fmtMoney(sumGross));
        $("#invoice-add-calc-discount").text(fmtMoney(sumDisc));
        $("#invoice-add-calc-tax").text(fmtMoney(sumTax));
        $("#invoice-add-calc-total").text(fmtMoney(sumLine));
    }

    $(document).on("click", ".tax-select", function(e) {
            e.stopPropagation();
        }),
        e.length &&
        $(document).on("click", ".btn-apply-changes", function(e) {
            var $btn = $(this);
            var $inp = $btn.closest(".dropdown-menu").find(".discount-input");
            if ($inp.val() !== undefined && $inp.val() !== "") {
                $btn.closest(".repeater-wrapper").find(".discount").first().text($inp.val() + "%");
            }
            recalcInvoiceAdd();
        }),
        t.length &&
        (t.on("submit", function(e) {
                e.preventDefault();
            }),
            t.repeater({
                show: function() {
                    $(this).slideDown(), [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function(e) {
                        return new bootstrap.Tooltip(e);
                    });
                    recalcInvoiceAdd();
                },
                hide: function(e) {
                    $(this).slideUp();
                },
            })),
        $(document).on("change", ".item-details", function() {
            var e = $(this),
                t = c[e.val()];
            e.next("textarea").length ? e.next("textarea").val(t) : e.after('<textarea class="form-control" rows="2">' + t + "</textarea>");
        });
    $(document).on("input change keyup", ".invoice-add .invoice-item-price, .invoice-add .invoice-item-qty", function() {
        recalcInvoiceAdd();
    });
    recalcInvoiceAdd();
});
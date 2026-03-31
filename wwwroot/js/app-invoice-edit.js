!(function () {
    "use strict";
})();

$(function () {
    var $root = $(".invoice-edit");
    var invoiceId = parseInt($root.data("invoice-id"), 10) || 0;
    var pristine = "";
    var fpIssued = null;
    var fpDue = null;

    /** Fixed VAT/sales tax rate (line total = after-discount × (1 + TAX_PCT/100)) */
    var TAX_PCT = 5;

    var ITEM_DESC = {
        "App Design": "Designed UI kit & app pages.",
        "App Customization": "Customization & Bug Fixes.",
        "ABC Template": "Bootstrap 4 admin template.",
        "App Development": "Native App Development.",
        "Software Development": "Sprint delivery & QA.",
        "UI/UX Design & Development": "Wireframes and implementation.",
        "Unlimited Extended License": "Perpetual license for internal use.",
        "Template Customization": "Theme and layout updates."
    };

    function parseMoneyInput(s) {
        return parseFloat(String(s || "").replace(/[^0-9.-]/g, "")) || 0;
    }

    function parsePctText(s) {
        return parseFloat(String(s || "0").replace(/[^0-9.-]/g, "")) || 0;
    }

    function formatMoney(n) {
        return "$" + (Math.round(n * 100) / 100).toFixed(2);
    }

    function formatBalanceApi(total) {
        if (Math.abs(total) < 0.005) {
            return "0";
        }
        return "$" + (Math.round(total * 100) / 100).toFixed(2);
    }

    function lineAmounts(unit, qty, discPct) {
        var gross = unit * qty;
        var afterDisc = gross * (1 - discPct / 100);
        var lineTotal = afterDisc * (1 + TAX_PCT / 100);
        var discAmt = gross - afterDisc;
        var taxAmt = lineTotal - afterDisc;
        return { gross: gross, afterDisc: afterDisc, lineTotal: lineTotal, discAmt: discAmt, taxAmt: taxAmt };
    }

    function applyFixedTaxLabels($w) {
        $w.find(".tax-1").first().text(TAX_PCT + "%");
        $w.find(".tax-2").first().text("0%");
    }

    function initCleaveIn($row) {
        if (typeof Cleave === "undefined") {
            return;
        }
        $row.find(".invoice-item-price, .invoice-item-qty").each(function () {
            if (this._cleave) {
                try {
                    if (typeof this._cleave.destroy === "function") {
                        this._cleave.destroy();
                    }
                } catch (err) {}
            }
            this._cleave = new Cleave(this, { delimiter: "", numeral: true });
        });
    }

    function setRowFromItem($row, it) {
        var key = it.item_key || "App Customization";
        var $sel = $row.find(".item-details");
        if ($sel.find('option[value="' + key.replace(/"/g, "\\\"") + '"]').length === 0) {
            $sel.append($("<option>").attr("value", key).text(key));
        }
        $sel.val(key);
        $row.find("textarea").first().val(it.description || ITEM_DESC[key] || "");
        var unit = parseFloat(it.unit_price) || 0;
        var qty = parseFloat(it.qty) || 1;
        var disc = parseFloat(it.discount_pct) || 0;
        $row.find(".invoice-item-price").val(String(unit));
        $row.find(".invoice-item-qty").val(String(qty));
        $row.find(".discount").first().text(disc + "%");
        applyFixedTaxLabels($row);
        $row.find(".dropdown-menu").first().find(".discount-input").val(disc);
    }

    function recalcTotals() {
        var sumGross = 0,
            sumDisc = 0,
            sumTax = 0,
            sumLine = 0;
        $root.find(".repeater-wrapper").each(function () {
            var $w = $(this);
            var unit = parseMoneyInput($w.find(".invoice-item-price").val());
            var qty = parseMoneyInput($w.find(".invoice-item-qty").val());
            var discPct = parsePctText($w.find(".discount").first().text());
            applyFixedTaxLabels($w);
            var L = lineAmounts(unit, qty, discPct);
            sumGross += L.gross;
            sumDisc += L.discAmt;
            sumTax += L.taxAmt;
            sumLine += L.lineTotal;
            $w.find(".line-total-display").first().text(formatMoney(L.lineTotal));
        });
        $("#calc-subtotal").text(formatMoney(sumGross));
        $("#calc-discount").text(formatMoney(sumDisc));
        $("#calc-tax").text(formatMoney(sumTax));
        $("#calc-total").text(formatMoney(sumLine));
        $("#bill-total-due").text(formatMoney(sumLine));
        $("#payment-invoice-balance").text(formatMoney(sumLine));
    }

    function collectState() {
        var o = {
            invoice_no: $("#invoice-no").val(),
            issued: $(".invoice-date").first().val(),
            due: $(".due-date").first().val(),
            client_name: $("#client_name").val(),
            client_company: $("#client_company").val(),
            salesperson: $("#salesperson").val(),
            invoice_status: $("#invoice_status").val(),
            note: $("#note").val(),
            invoiceMsg: $("#invoiceMsg").val(),
            items: []
        };
        $root.find(".repeater-wrapper").each(function () {
            var $w = $(this);
            o.items.push({
                item_key: $w.find(".item-details").val() || "",
                description: $w.find("textarea").first().val() || "",
                unit_price: parseMoneyInput($w.find(".invoice-item-price").val()),
                qty: parseMoneyInput($w.find(".invoice-item-qty").val()),
                discount: $w.find(".discount").first().text(),
                tax1: $w.find(".tax-1").first().text(),
                tax2: $w.find(".tax-2").first().text()
            });
        });
        return JSON.stringify(o);
    }

    function updateDirty() {
        var dirty = pristine !== collectState();
        $("#btn-save-invoice").prop("disabled", !dirty);
    }

    function setPristine() {
        pristine = collectState();
        $("#btn-save-invoice").prop("disabled", true);
    }

    function buildLineItems(items) {
        var $list = $root.find('[data-repeater-list="group-a"]');
        var $first = $list.find("[data-repeater-item]").first();
        if (!$first.length) {
            return;
        }
        var $tmpl = $first.clone(true, true);
        $list.empty();
        var rows = items && items.length ? items : [{}];
        rows.forEach(function (it) {
            var $r = $tmpl.clone(true, true);
            $list.append($r);
            if (it && (it.unit_price !== undefined || it.item_key)) {
                setRowFromItem($r, it);
            }
        });
    }

    function initDatePickers(issued, due) {
        function parseUs(s) {
            if (!s) {
                return new Date();
            }
            var p = String(s).split(/[\/\-]/);
            if (p.length >= 3) {
                return new Date(parseInt(p[2], 10), parseInt(p[0], 10) - 1, parseInt(p[1], 10));
            }
            return new Date(s);
        }
        var $i = $(".invoice-date").first();
        var $d = $(".due-date").first();
        if (fpIssued && typeof fpIssued.destroy === "function") {
            fpIssued.destroy();
        }
        if (fpDue && typeof fpDue.destroy === "function") {
            fpDue.destroy();
        }
        fpIssued = null;
        fpDue = null;
        if ($i.length && typeof flatpickr === "function") {
            fpIssued = flatpickr($i[0], {
                monthSelectorType: "static",
                defaultDate: parseUs(issued),
                dateFormat: "m/d/Y",
                onChange: function () {
                    updateDirty();
                }
            });
        }
        if ($d.length && typeof flatpickr === "function") {
            fpDue = flatpickr($d[0], {
                monthSelectorType: "static",
                defaultDate: parseUs(due),
                dateFormat: "m/d/Y",
                onChange: function () {
                    updateDirty();
                }
            });
        }
    }

    function initRepeater() {
        var $form = $(".source-item");
        if (!$form.length) {
            return;
        }
        $form.off("submit").on("submit", function (e) {
            e.preventDefault();
        });
        $form.repeater({
            show: function () {
                $(this).slideDown();
                var $row = $(this);
                initCleaveIn($row);
                $row.find(".discount").first().text("0%");
                applyFixedTaxLabels($row);
                $row.find(".discount-input").val(0);
                recalcTotals();
                updateDirty();
                [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (el) {
                    return new bootstrap.Tooltip(el);
                });
            },
            hide: function (deleteElement) {
                if (confirm("Remove this line item?")) {
                    deleteElement();
                    setTimeout(function () {
                        recalcTotals();
                        updateDirty();
                    }, 0);
                }
            }
        });
    }

    function wireEvents() {
        $root
            .off(".invEdit")
            .on("input.invEdit change.invEdit keyup.invEdit", ".invoice-item-price, .invoice-item-qty, .item-details, textarea", function () {
                recalcTotals();
                updateDirty();
            })
            .on("input.invEdit change.invEdit", "#invoice-no, #client_name, #client_company, #salesperson, #note, #invoiceMsg", function () {
                updateDirty();
            })
            .on("change.invEdit", "#invoice_status", function () {
                updateDirty();
            });

        $(document)
            .off("click.invEdit", ".invoice-edit .btn-apply-changes")
            .on("click.invEdit", ".invoice-edit .btn-apply-changes", function (e) {
                e.preventDefault();
                var $btn = $(this);
                var $menu = $btn.closest(".dropdown-menu");
                var $row = $btn.closest(".repeater-wrapper");
                var d = $menu.find(".discount-input").val();
                $row.find(".discount").first().text((d !== undefined && d !== "" ? d : "0") + "%");
                applyFixedTaxLabels($row);
                var dd = $btn.closest(".dropdown").find('[data-bs-toggle="dropdown"]')[0];
                if (dd && bootstrap.Dropdown.getInstance(dd)) {
                    bootstrap.Dropdown.getInstance(dd).hide();
                }
                recalcTotals();
                updateDirty();
            });

        $root.on("change.invEdit", ".item-details", function () {
            var $e = $(this);
            var t = ITEM_DESC[$e.val()] || "";
            var $ta = $e.closest(".repeater-wrapper").find("textarea").first();
            if ($ta.length) {
                $ta.val(t);
            }
            updateDirty();
        });

        $("#btn-save-invoice")
            .off("click.invEdit")
            .on("click.invEdit", function () {
                if ($(this).prop("disabled")) {
                    return;
                }
                var items = [];
                var sumGross = 0,
                    sumDisc = 0,
                    sumLine = 0;
                $root.find(".repeater-wrapper").each(function () {
                    var $w = $(this);
                    var unit = parseMoneyInput($w.find(".invoice-item-price").val());
                    var qty = parseMoneyInput($w.find(".invoice-item-qty").val());
                    var discPct = parsePctText($w.find(".discount").first().text());
                    var L = lineAmounts(unit, qty, discPct);
                    sumGross += L.gross;
                    sumDisc += L.discAmt;
                    sumLine += L.lineTotal;
                    items.push({
                        item_key: $w.find(".item-details").val() || "",
                        description: $w.find("textarea").first().val() || "",
                        unit_price: unit,
                        qty: qty,
                        discount_pct: discPct,
                        tax1_pct: TAX_PCT,
                        tax2_pct: 0,
                        line_total: Math.round(L.lineTotal * 100) / 100
                    });
                });
                var payload = {
                    id: invoiceId,
                    invoice_no: ($("#invoice-no").val() || "").trim(),
                    issued_date: $(".invoice-date").first().val() || "",
                    due_date: $(".due-date").first().val() || "",
                    client_name: ($("#client_name").val() || "").trim(),
                    client_company: ($("#client_company").val() || "").trim(),
                    service_summary: items.length ? items[0].item_key : "",
                    subtotal: Math.round(sumGross * 100) / 100,
                    discount_total: Math.round(sumDisc * 100) / 100,
                    tax_note: TAX_PCT + "%",
                    total: Math.round(sumLine * 100) / 100,
                    balance: formatBalanceApi(sumLine),
                    invoice_status: $("#invoice_status").val() || "Draft",
                    note: $("#note").val() || "",
                    salesperson: ($("#salesperson").val() || "").trim(),
                    items: items
                };
                var $btn = $("#btn-save-invoice");
                $btn.prop("disabled", true);
                $.ajax({
                    url: "api/invoices.php",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(payload),
                    dataType: "json"
                })
                    .done(function (r) {
                        if (r && r.ok) {
                            setPristine();
                            recalcTotals();
                        } else {
                            alert((r && r.error) ? r.error : "Could not save invoice.");
                            $btn.prop("disabled", false);
                        }
                    })
                    .fail(function () {
                        alert("Could not save invoice.");
                        $btn.prop("disabled", false);
                    });
            });
    }

    if (!invoiceId) {
        return;
    }

    $.getJSON("api/invoices.php?id=" + encodeURIComponent(invoiceId))
        .done(function (resp) {
            if (!resp || !resp.ok || !resp.data) {
                $root.prepend(
                    '<div class="alert alert-danger">Could not load invoice.</div>'
                );
                return;
            }
            var inv = resp.data;
            $("#invoice-no").val(inv.invoice_no || "");
            $("#client_name").val(inv.client_name || "");
            $("#client_company").val(inv.client_company || "");
            $("#salesperson").val(inv.salesperson || "");
            $("#invoice_status").val(inv.invoice_status || "Draft");
            $("#note").val(inv.note || "");
            buildLineItems(inv.items);

            initRepeater();
            $root.find(".repeater-wrapper").each(function () {
                initCleaveIn($(this));
            });
            initDatePickers(inv.issued_date, inv.due_date);
            recalcTotals();
            wireEvents();
            setTimeout(function () {
                setPristine();
            }, 80);
        })
        .fail(function () {
            $root.prepend('<div class="alert alert-danger">Could not load invoice.</div>');
        });
});

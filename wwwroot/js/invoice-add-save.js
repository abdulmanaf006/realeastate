$(function () {
    var TAX_PCT = 5;

    $(document).on("click", "#btn-save-invoice", function (e) {
        e.preventDefault();
        var issued = $(".invoice-add .invoice-date").first().val() || "";
        var due = $(".invoice-add .due-date").first().val() || "";
        var client = ($("#invoice-client-select").val() || "").trim();
        var items = [];
        var sumGross = 0,
            sumDisc = 0,
            sumLine = 0;

        $(".invoice-add .repeater-wrapper").each(function () {
            var $w = $(this);
            var unit = parseFloat(String($w.find(".invoice-item-price").val()).replace(/[^0-9.-]/g, "")) || 0;
            var q = parseFloat(String($w.find(".invoice-item-qty").val()).replace(/[^0-9.-]/g, "")) || 0;
            var discTxt = ($w.find(".discount").first().text() || "0").replace(/[^0-9.-]/g, "");
            var discount_pct = parseFloat(discTxt) || 0;
            var gross = unit * q;
            var afterDisc = gross * (1 - discount_pct / 100);
            var line_total = afterDisc * (1 + TAX_PCT / 100);
            sumGross += gross;
            sumDisc += gross - afterDisc;
            sumLine += line_total;
            items.push({
                item_key: $w.find(".item-details").val() || "",
                description: $w.find("textarea").val() || "",
                unit_price: unit,
                qty: q,
                discount_pct: discount_pct,
                tax1_pct: TAX_PCT,
                tax2_pct: 0,
                line_total: Math.round(line_total * 100) / 100
            });
        });

        var payload = {
            issued_date: issued,
            due_date: due,
            client_name: client,
            client_company: "",
            service_summary: items.length ? items[0].item_key : "",
            subtotal: Math.round(sumGross * 100) / 100,
            discount_total: Math.round(sumDisc * 100) / 100,
            tax_note: TAX_PCT + "%",
            total: Math.round(sumLine * 100) / 100,
            balance:
                sumLine > 0
                    ? "$" + (Math.round(sumLine * 100) / 100).toFixed(2)
                    : "0",
            invoice_status: "Draft",
            note: $("#note").val() || "",
            salesperson: $("#salesperson").val() || "",
            items: items
        };
        $.ajax({
            url: "api/invoices.php",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(payload),
            dataType: "json"
        })
            .done(function (r) {
                if (r && r.ok) {
                    window.location.href = "app-invoice-list.php";
                } else {
                    window.AppDialog.alert(r && r.error ? r.error : "Could not save invoice.", { title: 'Error', variant: 'danger' });
                }
            })
            .fail(function () {
                window.AppDialog.alert("Could not save invoice.", { title: 'Error', variant: 'danger' });
            });
    });
});

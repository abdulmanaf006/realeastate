$(function() {
    $.getJSON("api/categories.php", function(resp) {
        if (!resp || !resp.ok || !resp.for_select) {
            return;
        }
        var $sel = $("#category-org");
        if (!$sel.length) {
            return;
        }
        $sel.empty().append('<option value="">Select Category</option>');
        resp.for_select.forEach(function(c) {
            $sel.append($("<option></option>").attr("value", c.name).text(c.name));
        });
        if ($sel.hasClass("select2-hidden-accessible")) {
            $sel.select2("destroy");
        }
        $sel.wrap('<div class="position-relative"></div>');
        $sel.select2({ dropdownParent: $sel.parent(), placeholder: "Select Category" });
    });

    $(document).on("click", "#btn-publish-product", function(e) {
        e.preventDefault();
        var desc = "";
        var qel = document.querySelector("#ecommerce-category-description.ql-editor") || document.querySelector("#ecommerce-category-description .ql-editor");
        if (qel) {
            desc = qel.innerHTML;
        }
        var statusMap = { Scheduled: 1, Published: 2, Inactive: 3 };
        var stLabel = $("#status-org").val() || "Published";
        var st = statusMap[stLabel] || 2;
        var qty = parseInt($("#ecommerce-product-stock").val(), 10) || 0;
        var payload = {
            name: ($("#ecommerce-product-name").val() || "").trim(),
            productSku: $("#ecommerce-product-sku").val(),
            productBarcode: $("#ecommerce-product-barcode").val(),
            description: desc,
            category: $("#category-org").val(),
            productPrice: $("#ecommerce-product-price").val(),
            productDiscountedPrice: $("#ecommerce-product-discount-price").val(),
            quantity: qty,
            in_stock: qty > 0 ? 1 : 0,
            status: st,
            brand: "",
            tags: $("#ecommerce-product-tags").val() || ""
        };
        if (!payload.name) {
            window.AppDialog.alert("Please enter a product name.", { title: 'Validation', variant: 'danger' });
            return;
        }
        $.ajax({
            url: "api/products.php",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(payload),
            dataType: "json"
        }).done(function(r) {
            if (r && r.ok) {
                window.location.href = "app-product-list.php";
            } else {
                window.AppDialog.alert((r && r.error) ? r.error : "Could not save product.", { title: 'Error', variant: 'danger' });
            }
        }).fail(function() {
            window.AppDialog.alert("Could not save product.", { title: 'Error', variant: 'danger' });
        });
    });
});

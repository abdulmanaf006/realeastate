$(function() {
    var a, e = $(".invoice-list-table");

    $.getJSON("api/invoices.php", function(resp) {
        var invoiceData = resp && resp.ok ? resp.data : [];

        function escHtml(s) {
            return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
        function escAttr(s) {
            return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        }
        var STATUS_TOOLTIP = {
            Sent: "Invoice has been sent to the client.",
            Draft: "Draft — not sent yet; you can still edit.",
            "Past Due": "Due date has passed; payment is overdue.",
            "Partial Payment": "Some payment received; balance remains.",
            Paid: "Invoice is fully paid.",
            Downloaded: "Client has downloaded the invoice."
        };

    e.length && (a = e.DataTable({
            // ajax: assetsPath + "json/invoice-list.json",
            data: invoiceData, // Use the JSON data directly here   
            columns: [{
                data: "invoice_id"
            }, {
                data: "invoice_id"
            }, {
                data: "invoice_id"
            }, {
                data: "invoice_status"
            }, {
                data: "issued_date"
            }, {
                data: "client_name"
            }, {
                data: "total"
            }, {
                data: "balance"
            }, {
                data: "invoice_status"
            }, {
                data: "action"
            }],
            columnDefs: [{
                className: "control",
                responsivePriority: 2,
                searchable: !1,
                targets: 0,
                render: function(a, e, t, s) {
                    return ""
                }
            }, {
                targets: 1,
                orderable: !1,
                checkboxes: {
                    selectAllRender: '<input type="checkbox" class="form-check-input">'
                },
                render: function() {
                    return '<input type="checkbox" class="dt-checkboxes form-check-input" >'
                },
                searchable: !1
            }, {
                targets: 2,
                render: function(a, e, t, s) {
                    var num = t.invoice_no ? String(t.invoice_no).replace(/^INV-/, "") : String(t.invoice_id);
                    return '<a href="app-invoice-preview.php?id=' + t.invoice_id + '">#' + num + "</a>"
                }
            }, {
                targets: 3,
                render: function(a, e, t, s) {
                    var n = t.invoice_status || "Draft",
                        l = t.due_date || "—",
                        b = t.balance,
                        tip = STATUS_TOOLTIP[n] || ("Status: " + n + "."),
                        badges = {
                            Sent: '<span class="badge rounded-pill p-1_5 bg-label-secondary"><i class="bx bx-envelope bx-xs"></i></span>',
                            Draft: '<span class="badge rounded-pill p-1_5 bg-label-primary"><i class="bx bx-folder bx-xs"></i></span>',
                            "Past Due": '<span class="badge rounded-pill p-1_5 bg-label-danger"><i class="bx bx-error bx-xs"></i></span>',
                            "Partial Payment": '<span class="badge rounded-pill p-1_5 bg-label-success"><i class="bx bx-check bx-xs"></i></span>',
                            Paid: '<span class="badge rounded-pill p-1_5 bg-label-warning"><i class="bx bx-pie-chart-alt bx-xs"></i></span>',
                            Downloaded: '<span class="badge rounded-pill p-1_5 bg-label-info"><i class="bx bx-down-arrow-alt bx-xs"></i></span>'
                        },
                        badgeInner = badges[n] || '<span class="badge rounded-pill p-1_5 bg-label-secondary"><i class="bx bx-help-circle bx-xs"></i></span>',
                        titleHtml = "<strong>" + escHtml(n) + "</strong><br><span class=\"text-muted\">" + escHtml(tip) + "</span><br><span class=\"fw-medium\">Balance:</span> " + escHtml(String(b)) + "<br><span class=\"fw-medium\">Due date:</span> " + escHtml(String(l));
                    return '<span class="d-inline-block" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" title="' + escAttr(titleHtml) + '">' + badgeInner + "</span>"
                }
            }, {
                targets: 4,
                responsivePriority: 4,
                render: function(a, e, t, s) {
                    var n = t.client_name,
                        l = t.service,
                        i = t.avatar_image,
                        o = Math.floor(11 * Math.random()) + 1;
                    return '<div class="d-flex justify-content-start align-items-center"><div class="avatar-wrapper"><div class="avatar avatar-sm me-3">' + (!0 === i ? '<img src="' + "assets/img/avatars/" + (o + ".png") + '" alt="Avatar" class="rounded-circle">' : '<span class="avatar-initial rounded-circle bg-label-' + ["success", "danger", "warning", "info", "dark", "primary", "secondary"][Math.floor(6 * Math.random())] + '">' + (i = (((i = (n = t.client_name).match(/\b\w/g) || []).shift() || "") + (i.pop() || "")).toUpperCase()) + "</span>") + '</div></div><div class="d-flex flex-column"><a href="pages-profile-user.html" class="text-heading text-truncate"><span class="fw-medium">' + n + '</span></a><small class="text-truncate">' + l + "</small></div></div>"
                }
            }, {
                targets: 5,
                render: function(a, e, t, s) {
                    t = t.total;
                    return '<span class="d-none">' + t + "</span>$" + t
                }
            }, {
                targets: 6,
                render: function(a, e, t, s) {
                    t = new Date(t.due_date);
                    return '<span class="d-none">' + moment(t).format("YYYYMMDD") + "</span>" + moment(t).format("DD MMM YYYY")
                }
            }, {
                targets: 7,
                orderable: !1,
                render: function(a, e, t, s) {
                    t = t.balance;
                    return 0 === t ? '<span class="badge bg-label-success" text-capitalized> Paid </span>' : '<span class="d-none">' + t + '</span><span class="text-heading">' + t + "</span>"
                }
            }, {
                targets: 8,
                visible: !1
            }, {
                targets: -1,
                title: "Actions",
                searchable: !1,
                orderable: !1,
                render: function(a, e, t, s) {
                    return '<div class="d-flex align-items-center"><a href="javascript:;" data-bs-toggle="tooltip" class="btn btn-icon delete-record" data-bs-placement="top" title="Delete"><i class="bx bx-trash bx-md"></i></a><a href="app-invoice-preview.php?id=' + t.invoice_id + '" data-bs-toggle="tooltip" class="btn btn-icon" data-bs-placement="top" title="Preview Invoice"><i class="bx bx-show bx-md"></i></a><div class="dropdown"><a href="javascript:;" class="btn dropdown-toggle hide-arrow btn-icon p-0" data-bs-toggle="dropdown"><i class="bx bx-dots-vertical-rounded bx-md"></i></a><div class="dropdown-menu dropdown-menu-end"><a href="javascript:;" class="dropdown-item">Download</a><a href="app-invoice-edit.php?id=' + t.invoice_id + '" class="dropdown-item">Edit</a><a href="javascript:;" class="dropdown-item">Duplicate</a></div></div>'
                }
            }],
            order: [
                [2, "desc"]
            ],
            dom: '<"row"<"col-12 col-md-6 d-flex align-items-center justify-content-center justify-content-md-start gap-2"l<"dt-action-buttons text-xl-end text-lg-start text-md-end text-start"B>><"col-12 col-md-6 d-flex align-items-center justify-content-end flex-column flex-md-row gap-md-4 mt-n6 mt-md-0"f<"invoice_status mb-6 mb-md-0">>>t<"row"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6"p>>',
            language: {
                sLengthMenu: "Show _MENU_",
                search: "",
                searchPlaceholder: "Search Invoice",
                paginate: {
                    next: '<i class="bx bx-chevron-right bx-18px"></i>',
                    previous: '<i class="bx bx-chevron-left bx-18px"></i>'
                }
            },
            buttons: [{
                text: '<i class="bx bx-plus bx-sm me-md-2"></i><span class="d-md-inline-block d-none">Create Invoice</span>',
                className: "btn btn-primary",
                action: function(a, e, t, s) {
                    window.location = "app-invoice-add.php"
                }
            }],
            responsive: {
                details: {
                    display: $.fn.dataTable.Responsive.display.modal({
                        header: function(a) {
                            return "Details of " + a.data().full_name
                        }
                    }),
                    type: "column",
                    renderer: function(a, e, t) {
                        t = $.map(t, function(a, e) {
                            return "" !== a.title ? '<tr data-dt-row="' + a.rowIndex + '" data-dt-column="' + a.columnIndex + '"><td>' + a.title + ":</td> <td>" + a.data + "</td></tr>" : ""
                        }).join("");
                        return !!t && $('<table class="table"/><tbody />').append(t)
                    }
                }
            },
            initComplete: function() {
                this.api().columns(8).every(function() {
                    var e = this,
                        t = $('<select id="UserRole" class="form-select"><option value=""> Invoice Status </option></select>').appendTo(".invoice_status").on("change", function() {
                            var a = $.fn.dataTable.util.escapeRegex($(this).val());
                            e.search(a ? "^" + a + "$" : "", !0, !1).draw()
                        });
                    e.data().unique().sort().each(function(a, e) {
                        t.append('<option value="' + a + '" class="text-capitalize">' + a + "</option>")
                    })
                })
            }
        })),
        e.on("draw.dt", function() {
            [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function(a) {
                return new bootstrap.Tooltip(a, {
                    boundary: document.body
                })
            })
        }),
        $(".invoice-list-table tbody").on("click", ".delete-record", function() {
            var row = a.row($(this).parents("tr")),
                d = row.data();
            if (d && d.invoice_id) {
                $.ajax({ url: "api/invoices.php?id=" + encodeURIComponent(d.invoice_id), type: "DELETE" }).done(function() {
                    row.remove().draw(!1)
                })
            }
        }),
        setTimeout(() => {
            $(".dataTables_filter .form-control").removeClass("form-control-sm"),
                $(".dataTables_length .form-select").removeClass("form-select-sm")
        }, 300)
    });
});
(function ($) {
    'use strict';

    var tenantSearchTimer;
    var buildingSearchTimer;

    function escapeHtml(s) {
        return $('<div/>').text(s || '').html();
    }

    function loadUnitsForBuilding(buildingId, preserveRows) {
        if (!buildingId) return;

        $.getJSON(window.trReg.urls.units, { buildingId: buildingId })
            .done(function (units) {
                window.trReg.unitOptions = units || [];
                if (preserveRows && $('#contractUnitsBody tr').length > 0) {
                    $('#contractUnitsBody tr').each(function () {
                        var $tr = $(this);
                        var $sel = $tr.find('.unit-select');
                        var val = $sel.val();
                        $sel.html(unitSelectOptionsHtml());
                        if (val) {
                            $sel.val(val);
                        }
                        // Do not trigger('change'): that handler copies master unit rent into the row
                        // and would wipe contract-line amounts when reloading options on edit.
                        var $opt = $sel.find('option:selected');
                        $tr.find('.unit-flatno').text($opt.text() || '—');
                        recalcRow($tr);
                    });
                } else {
                    $('#contractUnitsBody').empty();
                    addContractUnitRow(true);
                }
            })
            .fail(function () {
                window.AppDialog.alert('Unable to load units for this building.', { title: 'Error', variant: 'danger' });
            });
    }

    function unitSelectOptionsHtml() {
        var opts = '<option value="0">— Select unit —</option>';
        (window.trReg.unitOptions || []).forEach(function (u) {
            opts += '<option value="' + u.id + '" data-actual="' + u.actualRentAmount + '" data-rent="' + u.rentAmount + '">' +
                escapeHtml(u.flatNo) + ' (' + escapeHtml(u.status) + ')</option>';
        });
        return opts;
    }

    function addContractUnitRow(isFirst) {
        var idx = $('#contractUnitsBody tr').length;
        var $tr = $('<tr/>');
        $tr.append(
            '<td><select class="form-select form-select-sm unit-select" name="ContractUnits[' + idx + '].UnitId">' + unitSelectOptionsHtml() + '</select></td>' +
            '<td class="text-muted small unit-flatno">—</td>' +
            '<td><input type="number" step="0.01" class="form-control form-control-sm inp-actual" name="ContractUnits[' + idx + '].ActualRentAmount" value="0" /></td>' +
            '<td><input type="number" step="0.01" class="form-control form-control-sm inp-rent" name="ContractUnits[' + idx + '].RentAmount" value="0" /></td>' +
            '<td><input type="number" step="0.01" class="form-control form-control-sm inp-taxpct" name="ContractUnits[' + idx + '].TaxPercent" value="0" /></td>' +
            '<td><input type="text" readonly class="form-control form-control-sm inp-taxamt" value="0" /></td>' +
            '<td><input type="text" readonly class="form-control form-control-sm inp-total" value="0" /></td>' +
            '<td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger btn-rm-unit">&times;</button></td>'
        );
        $('#contractUnitsBody').append($tr);
        recalcRow($tr);
    }

    function recalcRow($tr) {
        var rent = parseFloat($tr.find('.inp-rent').val()) || 0;
        var pct = parseFloat($tr.find('.inp-taxpct').val()) || 0;
        var tax = Math.round((rent * pct / 100) * 100) / 100;
        var total = rent + tax;
        $tr.find('.inp-taxamt').val(tax.toFixed(2));
        $tr.find('.inp-total').val(total.toFixed(2));
        recalcContractUnitsTotals();
    }

    function recalcContractUnitsTotals() {
        var totalRent = 0;
        var totalTax = 0;
        var totalInclVat = 0;
        var selectedUnits = 0;
        $('#contractUnitsBody tr').each(function () {
            var $tr = $(this);
            var unitId = parseInt($tr.find('.unit-select').val(), 10) || 0;
            if (unitId <= 0) return;
            selectedUnits++;
            totalRent += parseFloat($tr.find('.inp-rent').val()) || 0;
            totalTax += parseFloat($tr.find('.inp-taxamt').val()) || 0;
            totalInclVat += parseFloat($tr.find('.inp-total').val()) || 0;
        });
        $('#contractTotalRent').text(totalRent.toFixed(2));
        $('#contractTotalTax').text(totalTax.toFixed(2));
        $('#contractTotalWithTax').text(totalInclVat.toFixed(2));
        if (selectedUnits >= 2) {
            $('#contractUnitsTotalsWrap').removeClass('d-none');
        } else {
            $('#contractUnitsTotalsWrap').addClass('d-none');
        }
        recalcPaymentSectionTotals();
    }

    function recalcPaymentSectionTotals() {
        var unitsTotal = parseFloat($('#contractTotalWithTax').text().replace(/,/g, '')) || 0;
        var agent = parseFloat($('#AgentCommission').val()) || 0;
        var reg = parseFloat($('#RegistrationFee').val()) || 0;
        var sec = parseFloat($('#SecurityDeposit').val()) || 0;
        var finalAmt = unitsTotal + agent + reg + sec;
        var received = 0;
        $('#paymentsBody .inp-pay-amt').each(function () {
            received += parseFloat($(this).val()) || 0;
        });
        var balance = finalAmt - received;
        $('#paymentFinalAmount').text(finalAmt.toFixed(2));
        $('#paymentAmountReceived').text(received.toFixed(2));
        var $bal = $('#paymentBalanceAmount');
        $bal.text(balance.toFixed(2));
        $bal.removeClass('text-success text-danger text-warning');
        if (Math.abs(balance) < 0.005) {
            $bal.addClass('text-success');
        } else if (balance > 0) {
            $bal.addClass('text-danger');
        } else {
            $bal.addClass('text-warning');
        }
    }

    function addPaymentRow() {
        var idx = $('#paymentsBody tr').length;
        var ledgerInner = window.trReg.payLedgerOptionsCombinedHtml || '';
        var today = new Date().toISOString().slice(0, 10);
        var $tr = $('<tr class="payment-row"/>');
        $tr.append(
            '<td><select class="form-select form-select-sm pay-type-select" name="Payments[' + idx + '].PaymentType">' +
            '<option value="Cash" selected>Cash</option><option value="Bank">Bank</option><option value="Cheque">Cheque</option><option value="CreditCard">Credit card</option></select></td>' +
            '<td class="pay-ledger-cell"><select class="form-select form-select-sm pay-ledger-combined" name="Payments[' + idx + '].CashBankLedgerId">' + ledgerInner + '</select></td>' +
            '<td><input type="text" class="form-control form-control-sm" name="Payments[' + idx + '].ChequeNo" placeholder="—" /></td>' +
            '<td><input type="date" class="form-control form-control-sm" name="Payments[' + idx + '].ChequeDate" /></td>' +
            '<td><input type="number" step="0.01" min="0" class="form-control form-control-sm inp-pay-amt" name="Payments[' + idx + '].Amount" value="0" placeholder="0.00" /></td>' +
            '<td><input type="date" class="form-control form-control-sm" name="Payments[' + idx + '].PaymentDate" value="' + today + '" /></td>' +
            '<td class="text-center align-middle"><input type="hidden" name="Payments[' + idx + '].IsPdc" value="false" /><input type="checkbox" class="form-check-input" name="Payments[' + idx + '].IsPdc" value="true" title="Post-dated cheque" /></td>' +
            '<td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger btn-rm-pay" title="Remove line">&times;</button></td>'
        );
        $('#paymentsBody').append($tr);
        recalcPaymentSectionTotals();
    }

    function addBuildingUnitRow() {
        var $tb = $('#buildingUnitsBody');
        var idx = $tb.find('tr').length;
        var $tr = $('<tr/>');
        $tr.append(
            '<td><input class="form-control form-control-sm b-in-flat" name="Units[' + idx + '].FlatNo" required /></td>' +
            '<td><input type="number" class="form-control form-control-sm b-in-rooms" name="Units[' + idx + '].NoOfRooms" value="0" /></td>' +
            '<td><input type="number" step="0.01" class="form-control form-control-sm b-in-actual" name="Units[' + idx + '].ActualRentAmount" value="0" /></td>' +
            '<td><input type="number" step="0.01" class="form-control form-control-sm b-in-rent" name="Units[' + idx + '].RentAmount" value="0" /></td>' +
            '<td><select class="form-select form-select-sm b-in-type" name="Units[' + idx + '].Type"><option>Residential</option><option>Commercial</option></select></td>' +
            '<td><select class="form-select form-select-sm b-in-status" name="Units[' + idx + '].Status"><option value="Vacant" selected>Vacant</option><option value="Occupied">Occupied</option></select></td>' +
            '<td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger btn-rm-bunit">&times;</button></td>'
        );
        $tb.append($tr);
    }

    function bindTenantSearch() {
        $('#tenantSearchInput').on('input', function () {
            var q = $(this).val();
            clearTimeout(tenantSearchTimer);
            tenantSearchTimer = setTimeout(function () {
                $.getJSON(window.trReg.urls.searchTenants, { q: q }).done(function (data) {
                    var $box = $('#tenantSearchResults').empty();
                    (data || []).forEach(function (t) {
                        var $a = $('<a href="#" class="list-group-item list-group-item-action"></a>');
                        $a.text(t.code + ' — ' + t.name + ' — ' + t.phone);
                        $a.data('tenant', t);
                        $a.on('click', function (e) {
                            e.preventDefault();
                            var x = $(this).data('tenant');
                            $('#TenantId').val(x.id);
                            $('#tenantSelectedLabel').text(x.name + ' (' + x.code + ')');
                            $('#tenantMobileDisplay').text(x.phone);
                            $box.empty();
                        });
                        $box.append($a);
                    });
                });
            }, 250);
        });
    }

    function bindBuildingSearch() {
        var $input = $('#buildingSearchInput');

        function renderBuildingResults(data) {
            var $box = $('#buildingSearchResults').empty();
            (data || []).forEach(function (b) {
                var $a = $('<a href="#" class="list-group-item list-group-item-action"></a>');
                var label = (b.buildingNo || '') + ' ' + b.name;
                $a.text(label.trim() + (b.address ? ' — ' + b.address : ''));
                $a.data('building', b);
                $a.on('click', function (e) {
                    e.preventDefault();
                    var x = $(this).data('building');
                    $('#BuildingId').val(x.id);
                    $('#buildingSelectedLabel').text(x.name);
                    $box.empty();
                    loadUnitsForBuilding(x.id, false);
                });
                $box.append($a);
            });
        }

        function fetchBuildings(q, debounceMs) {
            clearTimeout(buildingSearchTimer);
            buildingSearchTimer = setTimeout(function () {
                $.getJSON(window.trReg.urls.searchBuildings, { q: q }).done(renderBuildingResults);
            }, debounceMs);
        }

        $input.on('input', function () {
            fetchBuildings($(this).val(), 250);
        });

        // Show all buildings immediately when the user clicks/focuses the search box.
        $input.on('focus click', function () {
            fetchBuildings($(this).val() || '', 0);
        });
    }

    $(document).on('change', '.unit-select', function () {
        var $tr = $(this).closest('tr');
        var $opt = $(this).find('option:selected');
        var fid = parseInt($(this).val(), 10) || 0;
        $tr.find('.unit-flatno').text($opt.text() || '—');
        if (fid > 0) {
            var ar = parseFloat($opt.attr('data-actual')) || 0;
            var rr = parseFloat($opt.attr('data-rent')) || 0;
            $tr.find('.inp-actual').val(ar);
            $tr.find('.inp-rent').val(rr);
        }
        recalcRow($tr);
    });

    $(document).on('input', '.inp-rent, .inp-taxpct', function () {
        recalcRow($(this).closest('tr'));
    });

    $(document).on('input', '.inp-final-calc, .inp-pay-amt', function () {
        recalcPaymentSectionTotals();
    });

    $(document).on('click', '#btnAddContractUnit', function () {
        addContractUnitRow(false);
    });

    $(document).on('click', '.btn-rm-unit', function () {
        var $tr = $(this).closest('tr');
        if ($('#contractUnitsBody tr').length > 1) {
            $tr.remove();
            recalcContractUnitsTotals();
        }
    });

    $(document).on('click', '.btn-add-payment-line', function () {
        addPaymentRow();
    });

    $(document).on('click', '.btn-rm-pay', function () {
        var $tr = $(this).closest('tr');
        if ($('#paymentsBody tr').length > 1) {
            $tr.remove();
            recalcPaymentSectionTotals();
        }
    });

    $(document).on('click', '#btnBuildingAddUnitRow', function () {
        addBuildingUnitRow();
    });

    $(document).on('click', '.btn-rm-bunit', function () {
        var $tr = $(this).closest('tr');
        if ($('#buildingUnitsBody tr').length > 1) $tr.remove();
    });

    function localIsoDate() {
        var d = new Date();
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function formatTenantAjaxError(xhr) {
        var j = xhr.responseJSON;
        if (!j) return xhr.statusText || 'Request failed.';
        var base;
        if (typeof j.message === 'string' && j.message) base = j.message;
        else if (typeof j.title === 'string' && j.title) base = j.title;
        else if (typeof j.error === 'string' && j.error) base = j.error;
        else if (Array.isArray(j.errors) && j.errors.length) base = j.errors.join(' ');
        else if (j.errors && typeof j.errors === 'object' && !Array.isArray(j.errors)) {
            var parts = [];
            Object.keys(j.errors).forEach(function (k) {
                var arr = j.errors[k];
                if (Array.isArray(arr)) arr.forEach(function (x) { parts.push(x); });
            });
            base = parts.length ? parts.join(' ') : null;
        }
        if (!base) base = xhr.statusText || 'Request failed.';
        if (typeof j.detail === 'string' && j.detail && j.detail !== base && j.detail.length < 400)
            return base + ' — ' + j.detail;
        return base;
    }

    $('#btnSaveTenantModal').on('click', function () {
        var emailTrim = ($('#mt_email').val() || '').trim();
        var asOf = ($('#mt_asof').val() || '').trim();
        var payload = {
            name: ($('#mt_name').val() || '').trim(),
            phone: ($('#mt_phone').val() || '').trim(),
            email: emailTrim ? emailTrim : null,
            trn: ($('#mt_trn').val() || '').trim() || null,
            emiratesId: ($('#mt_emirates').val() || '').trim() || null,
            addressLine1: ($('#mt_address').val() || '').trim() || null,
            openingBalance: parseFloat($('#mt_ob').val()) || 0,
            balanceType: $('#mt_balanceType').val(),
            asOfDate: asOf || localIsoDate(),
            creditLimit: parseFloat($('#mt_credit').val()) || 0,
            staffId: $('#mt_staff').val() ? parseInt($('#mt_staff').val(), 10) : null,
            status: $('#mt_status').is(':checked')
        };

        $.ajax({
            url: window.trReg.urls.createTenant,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload)
        }).done(function (res) {
            $('#tenantModal').modal('hide');
            $('#TenantId').val(res.tenant.id);
            $('#tenantSelectedLabel').text(res.tenant.name + ' (' + res.tenant.code + ')');
            $('#tenantMobileDisplay').text(res.tenant.phone);
        }).fail(function (xhr) {
            window.AppDialog.alert('Unable to save tenant: ' + formatTenantAjaxError(xhr), { title: 'Error', variant: 'danger' });
        });
    });

    $('#btnSaveBuildingModal').on('click', function () {
        var name = ($('#mb_name').val() || '').trim();
        if (!name) {
            window.AppDialog.alert('Building name is required.', { title: 'Validation', variant: 'danger' });
            return;
        }

        var cashId = parseInt($('#mb_cash').val(), 10);
        var bankId = parseInt($('#mb_bank').val(), 10);
        if (!cashId || !bankId) {
            window.AppDialog.alert('Select both a cash ledger and a bank ledger.', { title: 'Validation', variant: 'danger' });
            return;
        }
        if (cashId === bankId) {
            window.AppDialog.alert('Cash ledger and bank ledger must be different.', { title: 'Validation', variant: 'danger' });
            return;
        }

        var units = [];
        $('#buildingUnitsBody tr').each(function () {
            var $r = $(this);
            units.push({
                flatNo: ($r.find('.b-in-flat').val() || '').trim(),
                noOfRooms: parseInt($r.find('.b-in-rooms').val(), 10) || 0,
                actualRentAmount: parseFloat($r.find('.b-in-actual').val()) || 0,
                rentAmount: parseFloat($r.find('.b-in-rent').val()) || 0,
                type: $r.find('.b-in-type').val(),
                status: $r.find('.b-in-status').val()
            });
        });

        for (var i = 0; i < units.length; i++) {
            if (!units[i].flatNo) {
                window.AppDialog.alert('Unit number (flat no.) is required for each unit row.', { title: 'Validation', variant: 'danger' });
                return;
            }
        }

        var payload = {
            buildingNo: ($('#mb_no').val() || '').trim() || null,
            buildingName: name,
            address: ($('#mb_address').val() || '').trim() || null,
            cashLedgerId: cashId,
            bankLedgerId: bankId,
            units: units
        };

        $.ajax({
            url: window.trReg.urls.createBuilding,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload)
        }).done(function (res) {
            $('#buildingModal').modal('hide');
            $('#BuildingId').val(res.building.id);
            $('#buildingSelectedLabel').text(res.building.buildingName);
            loadUnitsForBuilding(res.building.id, false);
        }).fail(function (xhr) {
            window.AppDialog.alert('Unable to save building: ' + formatTenantAjaxError(xhr), { title: 'Error', variant: 'danger' });
        });
    });

    function updateChargePaymentRow($row) {
        var method = $row.find('.charge-method-select').val();
        var isCash = method === 'Cash';
        $row.find('.charge-col-cash').toggleClass('d-none', !isCash);
        $row.find('.charge-col-bank').toggleClass('d-none', isCash);
    }

    $(document).on('change', '.charge-method-select', function () {
        updateChargePaymentRow($(this).closest('tr'));
    });

    $(function () {
        bindTenantSearch();
        bindBuildingSearch();
        window.trReg.unitOptions = window.trReg.unitOptions || [];
        if (window.trReg.initialTenantId) {
            $('#TenantId').val(window.trReg.initialTenantId);
            $('#tenantSelectedLabel').text(window.trReg.initialTenantLabel || '');
            $('#tenantMobileDisplay').text(window.trReg.initialTenantPhone || '—');
        }
        if (window.trReg.initialBuildingId) {
            $('#BuildingId').val(window.trReg.initialBuildingId);
            $('#buildingSelectedLabel').text(window.trReg.initialBuildingLabel || '');
        }
        var bid = parseInt($('#BuildingId').val(), 10) || 0;
        if (bid > 0) {
            loadUnitsForBuilding(bid, true);
        }
        $('.charge-payment-row').each(function () {
            updateChargePaymentRow($(this));
        });
        recalcPaymentSectionTotals();
    });
})(jQuery);

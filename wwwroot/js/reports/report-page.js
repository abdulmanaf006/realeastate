(function () {
  'use strict';

  function valDate(sel) {
    var v = $(sel).val();
    return v && v.length ? v : null;
  }

  function nullIfInt(v) {
    if (v === undefined || v === null || v === '') return null;
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  function emptyToNull(v) {
    return v && String(v).length ? v : null;
  }

  function collectFilterJson() {
    return {
      fromDate: valDate('#Filter_FromDate'),
      toDate: valDate('#Filter_ToDate'),
      expiryFrom: valDate('#Filter_ExpiryFrom'),
      expiryTo: valDate('#Filter_ExpiryTo'),
      buildingId: nullIfInt($('#Filter_BuildingId').val()),
      partyId: nullIfInt($('#Filter_PartyId').val()),
      statusFilter: emptyToNull($('#Filter_StatusFilter').val()),
      paymentType: emptyToNull($('#Filter_PaymentType').val()),
      showAll: $('#Filter_ShowAll').is(':checked')
    };
  }

  function buildPrintQuery() {
    var f = collectFilterJson();
    var p = new URLSearchParams();
    if (f.fromDate) p.set('FromDate', f.fromDate);
    if (f.toDate) p.set('ToDate', f.toDate);
    if (f.expiryFrom) p.set('ExpiryFrom', f.expiryFrom);
    if (f.expiryTo) p.set('ExpiryTo', f.expiryTo);
    if (f.buildingId != null) p.set('BuildingId', String(f.buildingId));
    if (f.partyId != null) p.set('PartyId', String(f.partyId));
    if (f.statusFilter) p.set('StatusFilter', f.statusFilter);
    if (f.paymentType) p.set('PaymentType', f.paymentType);
    p.set('ShowAll', f.showAll ? 'true' : 'false');
    return p.toString();
  }

  function fmtN(n) {
    if (n == null || n === undefined) return '—';
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderRows(bundle, reportKey) {
    var rows = bundle.rows || [];
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var trClass = r.rowCssClass || '';
      html += '<tr class="' + esc(trClass) + '">';
      html += '<td>' + esc(r.siNo) + '</td>';
      html += '<td>' + esc(r.buildingName) + '</td>';
      html += '<td>' + esc(r.unitNo) + '</td>';
      html += '<td>' + esc(r.partyName) + '</td>';
      html += '<td>' + esc(r.contractStartDate && r.contractStartDate.substring(0, 10)) + '</td>';
      html += '<td>' + esc(r.contractEndDate && r.contractEndDate.substring(0, 10)) + '</td>';
      html += '<td class="text-end">' + fmtN(r.contractAmount) + '</td>';
      html += '<td>' + esc(r.displayStatus) + '</td>';
      html += '<td>' + esc(r.paymentType) + '</td>';
      if (reportKey === 'contract-expiry') {
        html += '<td class="text-end">' + (r.daysRemaining != null ? esc(String(r.daysRemaining)) : '—') + '</td>';
      }
      if (reportKey === 'security-deposit') {
        html += '<td class="text-end">' + fmtN(r.depositAmount) + '</td>';
        html += '<td class="text-end">' + fmtN(r.paidAmount) + '</td>';
        html += '<td class="text-end">' + fmtN(r.balanceAmount) + '</td>';
      }
      if (reportKey === 'registration-fees') {
        html += '<td class="text-end">' + fmtN(r.registrationFeeAmount) + '</td>';
        html += '<td>' + esc(r.paidStatus) + '</td>';
      }
      if (reportKey === 'commission') {
        html += '<td class="text-end">' + fmtN(r.commissionAmount) + '</td>';
        html += '<td>' + esc(r.commissionTypeLabel) + '</td>';
        html += '<td>' + esc(r.agentName) + '</td>';
        html += '<td>' + esc(r.commissionPaymentStatus) + '</td>';
      }
      html += '<td class="small">' + esc(r.remarks) + '</td>';
      html += '</tr>';
    }
    $('#reportTableBody').html(html);
  }

  function renderTotals(bundle, reportKey) {
    var r = bundle;
    var html = '';
    if (reportKey === 'contract-expiry') {
      html =
        '<tr><td colspan="6" class="text-end">Totals</td><td class="text-end">' +
        fmtN(r.totalContractAmount) +
        '</td><td colspan="3"></td><td></td></tr>';
    } else if (reportKey === 'security-deposit') {
      html =
        '<tr><td colspan="6" class="text-end">Totals</td><td class="text-end">' +
        fmtN(r.totalContractAmount) +
        '</td><td colspan="2"></td><td class="text-end">' +
        fmtN(r.totalDeposit) +
        '</td><td class="text-end">' +
        fmtN(r.totalPaid) +
        '</td><td class="text-end">' +
        fmtN(r.totalBalance) +
        '</td><td></td></tr>';
    } else if (reportKey === 'registration-fees') {
      html =
        '<tr><td colspan="6" class="text-end">Totals</td><td class="text-end">' +
        fmtN(r.totalContractAmount) +
        '</td><td colspan="2"></td><td class="text-end">' +
        fmtN(r.totalRegistrationFee) +
        '</td><td></td><td></td></tr>';
    } else if (reportKey === 'commission') {
      html =
        '<tr><td colspan="6" class="text-end">Totals</td><td class="text-end">' +
        fmtN(r.totalContractAmount) +
        '</td><td colspan="2"></td><td class="text-end">' +
        fmtN(r.totalCommission) +
        '</td><td colspan="3"></td><td></td></tr>';
    }
    $('#reportTableFoot').html(html);
  }

  function init() {
    var cfg = window.reportPageConfig;
    if (!cfg || !cfg.searchUrl) return;

    $('#reportSearchBtn').on('click', function () {
      $.ajax({
        url: cfg.searchUrl,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(collectFilterJson())
      })
        .done(function (resp) {
          if (resp.errorMessage) {
            alert(resp.errorMessage);
            return;
          }
          renderRows(resp, cfg.reportKey);
          renderTotals(resp, cfg.reportKey);
        })
        .fail(function (xhr) {
          var msg = 'Search failed.';
          if (xhr.responseJSON && xhr.responseJSON.title) msg = xhr.responseJSON.title;
          alert(msg);
        });
    });

    $('#reportResetBtn').on('click', function () {
      window.location.href = cfg.resetUrl;
    });

    $('#reportPrintBtn').on('click', function () {
      var q = buildPrintQuery();
      var url = cfg.printUrl + (q ? '?' + q : '');
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  $(init);
})();

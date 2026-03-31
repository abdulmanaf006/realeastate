$(function () {
    $(document).on('click', '.btn-delete-quotation', function () {
        var id = $(this).data('id');
        if (!id || !confirm('Delete this quotation?')) return;
        var $btn = $(this);
        $btn.prop('disabled', true);
        $.ajax({
            url: 'api/quotations.php?id=' + id,
            method: 'DELETE',
            success: function (res) {
                if (res.ok) {
                    $btn.closest('tr').fadeOut(300, function () {
                        $(this).remove();
                    });
                } else {
                    alert(res.error || 'Could not delete');
                    $btn.prop('disabled', false);
                }
            },
            error: function () {
                alert('Error deleting quotation');
                $btn.prop('disabled', false);
            }
        });
    });
});

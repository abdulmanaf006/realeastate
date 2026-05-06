$(function () {
    $(document).on('click', '.btn-delete-quotation', function () {
        var id = $(this).data('id');
        if (!id) return;
        var $btn = $(this);
        window.AppDialog.confirm('Delete this quotation?', { title: 'Delete quotation', danger: true }).then(function (ok) {
            if (!ok) return;
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
                        window.AppDialog.alert(res.error || 'Could not delete', { title: 'Error', variant: 'danger' });
                        $btn.prop('disabled', false);
                    }
                },
                error: function () {
                    window.AppDialog.alert('Error deleting quotation', { title: 'Error', variant: 'danger' });
                    $btn.prop('disabled', false);
                }
            });
        });
    });
});

"use strict";

var commentEditor = document.querySelector(".comment-editor");
commentEditor && new Quill(commentEditor, {
  modules: {
    toolbar: ".comment-toolbar"
  },
  placeholder: "Write a Comment...",
  theme: "snow"
});
$(function () {
  var e, t, a;
  e = config.colors.borderColor;
  t = config.colors.bodyBg;
  a = config.colors.headingColor; // JSON data (replace with your actual data)

  var invoiceData = [{
    "id": 1,
    "cat_image": "product-1.png",
    "categories": "Smart Phone",
    "category_detail": "Choose from wide range of smartphones from popular brands",
    "total_earnings": "$99129",
    "total_products": 1947
  }, {
    "id": 2,
    "cat_image": "product-2.png",
    "categories": "Electronics",
    "category_detail": "Choose from wide range of electronics from popular brands",
    "total_earnings": "$2512.50",
    "total_products": 7283
  }, {
    "id": 3,
    "cat_image": "product-3.png",
    "categories": "Clocks",
    "category_detail": "Choose from wide range of clocks from popular brands",
    "total_earnings": "$1612.34",
    "total_products": 2954
  }, {
    "id": 4,
    "cat_image": "product-4.png",
    "categories": "Shoes",
    "category_detail": "Explore the latest shoes from Top brands",
    "total_earnings": "$3612.98",
    "total_products": 4940
  }, {
    "id": 5,
    "cat_image": "product-5.png",
    "categories": "Accessories",
    "category_detail": "Explore best selling accessories from Top brands",
    "total_earnings": "$79129",
    "total_products": 4665
  }, {
    "id": 6,
    "cat_image": "product-6.png",
    "categories": "Games",
    "category_detail": "Dive into world of Virtual Reality with latest games",
    "total_earnings": "$29129",
    "total_products": 5764
  }, {
    "id": 7,
    "cat_image": "product-10.png",
    "categories": "Home Decor",
    "category_detail": "Choose from wide range of home decor from popular brands",
    "total_earnings": "$19120.45",
    "total_products": 9184
  }, {
    "id": 8,
    "cat_image": "product-16.png",
    "categories": "Travel",
    "category_detail": "Choose from wide range of travel accessories from popular brands",
    "total_earnings": "$7912.99",
    "total_products": 4186
  }, {
    "id": 9,
    "cat_image": "product-21.png",
    "categories": "Baby Products",
    "category_detail": "Choose from wide range of Baby products from popular brands",
    "total_earnings": "$7912.99",
    "total_products": 4186
  }, {
    "id": 10,
    "cat_image": "product-22.png",
    "categories": "Jewellery",
    "category_detail": "Choose from wide range of Jewellery from popular brands",
    "total_earnings": "$7912.99",
    "total_products": 4186
  }, {
    "id": 11,
    "cat_image": "product-23.png",
    "categories": "Grocery",
    "category_detail": "Get fresh groceries delivered at your doorstep",
    "total_earnings": "$7912.99",
    "total_products": 4186
  }, {
    "id": 12,
    "cat_image": "product-24.png",
    "categories": "Clothing",
    "category_detail": "Choose from wide range of clothing from popular brands",
    "total_earnings": "$7912.99",
    "total_products": 4186
  }, {
    "id": 13,
    "cat_image": "product-25.png",
    "categories": "Books",
    "category_detail": "Dive into world of books from Top authors",
    "total_earnings": "$7912.99",
    "total_products": 4186
  }, {
    "id": 14,
    "cat_image": "product-26.png",
    "categories": "Beauty & Personal Care",
    "category_detail": "Choose from wide range of beauty & personal care from popular brands",
    "total_earnings": "$7912.99",
    "total_products": 4186
  }];
  var o = $(".datatables-category-list"),
      s = $(".select2"); // Initialize select2

  s.length && s.each(function () {
    var e = $(this);
    e.wrap('<div class="position-relative"></div>').select2({
      dropdownParent: e.parent(),
      placeholder: e.data("placeholder")
    });
  }); // Initialize DataTable

  o.length && o.DataTable({
    //ajax: assetsPath + "json/ecommerce-category-list.json",
    data: invoiceData,
    // Use the JSON data directly here   
    columns: [{
      data: ""
    }, {
      data: "id"
    }, {
      data: "categories"
    }, {
      data: "total_products"
    }, {
      data: "total_earnings"
    }, {
      data: ""
    }],
    columnDefs: [{
      className: "control",
      searchable: false,
      orderable: false,
      responsivePriority: 1,
      targets: 0,
      render: function render(e, t, a, o) {
        return "";
      }
    }, {
      targets: 1,
      orderable: false,
      searchable: false,
      responsivePriority: 4,
      checkboxes: {
        selectAllRender: '<input type="checkbox" class="form-check-input">'
      },
      render: function render() {
        return '<input type="checkbox" class="dt-checkboxes form-check-input">';
      }
    }, {
      targets: 2,
      responsivePriority: 2,
      render: function render(e, t, a, o) {
        var s = a.categories,
            r = a.category_detail,
            n = a.cat_image,
            l = a.id;
        return '<div class="d-flex align-items-center"><div class="avatar-wrapper me-3 rounded-2 bg-label-secondary"><div class="avatar">' + (n ? '<img src="' + "assets/img/ecommerce-images/" + n + '" alt="Product-' + l + '" class="rounded">' : '<span class="avatar-initial rounded-2 bg-label-' + ["success", "danger", "warning", "info", "dark", "primary", "secondary"][Math.floor(6 * Math.random())] + '">' + (n = (((n = (s = a.category_detail).match(/\b\w/g) || []).shift() || "") + (n.pop() || "")).toUpperCase()) + "</span>") + '</div></div><div class="d-flex flex-column justify-content-center"><span class="text-heading text-wrap fw-medium">' + s + '</span><span class="text-truncate mb-0 d-none d-sm-block"><small>' + r + "</small></span></div></div>";
      }
    }, {
      targets: 3,
      responsivePriority: 3,
      render: function render(e, t, a, o) {
        return '<div class="text-sm-end">' + a.total_products + "</div>";
      }
    }, {
      targets: 4,
      orderable: false,
      render: function render(e, t, a, o) {
        return "<div class='mb-0 text-sm-end'>" + a.total_earnings + "</div>";
      }
    }, {
      targets: -1,
      title: "Actions",
      searchable: false,
      orderable: false,
      render: function render(e, t, a, o) {
        return '<div class="d-flex align-items-sm-center justify-content-sm-center"><button class="btn btn-icon"><i class="bx bx-edit bx-md"></i></button><button class="btn btn-icon dropdown-toggle hide-arrow" data-bs-toggle="dropdown"><i class="bx bx-dots-vertical-rounded bx-md"></i></button><div class="dropdown-menu dropdown-menu-end m-0"><a href="javascript:0;" class="dropdown-item">View</a><a href="javascript:0;" class="dropdown-item">Suspend</a></div></div>';
      }
    }],
    order: [2, "desc"],
    dom: '<"card-header d-flex flex-wrap py-0 flex-column flex-sm-row"<f><"d-flex justify-content-center justify-content-md-end align-items-baseline"<"dt-action-buttons d-flex justify-content-center flex-md-row align-items-baseline"lB>>>t<"row"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6"p>>',
    lengthMenu: [7, 10, 20, 50, 70, 100],
    language: {
      sLengthMenu: "_MENU_",
      search: "",
      searchPlaceholder: "Search Category",
      paginate: {
        next: '<i class="bx bx-chevron-right bx-18px"></i>',
        previous: '<i class="bx bx-chevron-left bx-18px"></i>'
      }
    },
    buttons: [{
      text: '<i class="bx bx-plus bx-sm me-0 me-sm-2"></i><span class="d-none d-sm-inline-block">Add Category</span>',
      className: "add-new btn btn-primary ms-2",
      attr: {
        "data-bs-toggle": "offcanvas",
        "data-bs-target": "#offcanvasEcommerceCategoryList"
      }
    }],
    responsive: {
      details: {
        display: $.fn.dataTable.Responsive.display.modal({
          header: function header(e) {
            return "Details of " + e.data().categories;
          }
        }),
        type: "column",
        renderer: function renderer(e, t, a) {
          a = $.map(a, function (e, t) {
            return "" !== e.title ? '<tr data-dt-row="' + e.rowIndex + '" data-dt-column="' + e.columnIndex + '"><td> ' + e.title + ':</td> <td class="ps-0">' + e.data + "</td></tr>" : "";
          }).join("");
          return !!a && $('<table class="table"/><tbody />').append(a);
        }
      }
    }
  });
  $(".dt-action-buttons").addClass("pt-0");
  $(".dataTables_filter").addClass("me-3 mb-sm-6 mb-0 ps-0");
  setTimeout(function () {
    $(".dataTables_filter .form-control").removeClass("form-control-sm").addClass("ms-0");
    $(".dataTables_length .form-select").removeClass("form-select-sm").addClass("ms-0");
  }, 300);
}); // Form Validation

(function () {
  var e = document.getElementById("eCommerceCategoryListForm");
  FormValidation.formValidation(e, {
    fields: {
      categoryTitle: {
        validators: {
          notEmpty: {
            message: "Please enter category title"
          }
        }
      },
      slug: {
        validators: {
          notEmpty: {
            message: "Please enter slug"
          }
        }
      }
    },
    plugins: {
      trigger: new FormValidation.plugins.Trigger(),
      bootstrap5: new FormValidation.plugins.Bootstrap5({
        eleValidClass: "is-valid",
        rowSelector: function rowSelector(e, t) {
          return ".mb-6";
        }
      }),
      submitButton: new FormValidation.plugins.SubmitButton(),
      autoFocus: new FormValidation.plugins.AutoFocus()
    }
  });
})();
//# sourceMappingURL=app-category-list.dev.js.map

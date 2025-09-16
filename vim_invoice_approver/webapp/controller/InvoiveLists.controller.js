sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("com.invoiceapp.viminvoiceapprover.controller.InvoiveLists", {
        onInit() {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteInvoiveLists")
                .attachPatternMatched(this._onRouteMatchedwithoutid, this);
        },

        _onRouteMatchedwithoutid: function () {
            const oSmartTable = this.byId("idSmartTablePend");
            if (oSmartTable) {
                oSmartTable.rebindTable();
            }
        },

        indicationFormat: function (status) {
            console.log(status)
            if (!status) return "None";
            switch (status.toLowerCase()) {
                case "pending":
                    return "Indication11";
                case "in process":
                    return "Indication13";
                case "completed":
                    return "Success";
                default:
                    return "None";
            }
        },

        statusFormattertest: function (role) {
            return `InProcess-${role}`;
        },

        formatSourceType: function (sSourceType) {
            if (sSourceType) {
                // Remove the '02-' prefix and return only the 'Portal' part
                return sSourceType.split('-')[1];
            }
            return sSourceType;
        },
    

        onTabSelect: function (oEvent) {
            const selectedKey = oEvent.getParameter("key");

            switch (selectedKey) {
                case "pending":
                    this.byId("idSmartTablePend")?.rebindTable();
                    break;
                case "rejected":
                    this.byId("idSmartTabRej")?.rebindTable();
                    break;
                case "approved":
                    this.byId("idSmartTabApp")?.rebindTable();
                    break;
            }
        },


        onClickInvoiceList: function (oEvent) {
            let reqNum = oEvent.getSource().getBindingContext().getObject().REQUEST_NO;
            // this.getOwnerComponent().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getOwnerComponent().getRouter().navTo("RouteCoderDetails", {
                reqNo: reqNum
            });
        },

        formatODataDate: function (dateValue) {
            if (!dateValue || !(dateValue instanceof Date)) return "";
            const day = String(dateValue.getDate()).padStart(2, '0');
            const month = String(dateValue.getMonth() + 1).padStart(2, '0');
            const year = dateValue.getFullYear();
            return `${day}-${month}-${year}`;
        }
    });
});
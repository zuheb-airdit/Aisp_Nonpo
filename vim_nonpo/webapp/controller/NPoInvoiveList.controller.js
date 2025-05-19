sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("com.nonpo.vimnonpo.controller.NPoInvoiveList", {
        onInit() {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteNPoInvoiveList")
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
            return `InProcess-${role}`
        },

        onTabSelect: function (oEvent) {
            const selectedKey = oEvent.getParameter("key");
            if (selectedKey === "pending") {
                const oSmartTable = this.byId("idSmartTablePend");
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            } else if (selectedKey === "rejected") {
                const oSmartTable = this.byId("idSmartTabRej");
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            }
        },


        onClickInvoiceList: function (oEvent) {
            let reqNum = oEvent.getSource().getBindingContext().getObject().REQUEST_NO;
            // this.getOwnerComponent().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getOwnerComponent().getRouter().navTo("RouteCoderDetails", {
                reqNo: reqNum
            });
        }
    });
});
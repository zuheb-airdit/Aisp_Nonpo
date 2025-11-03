sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, Filter, FilterOperator) => {
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
        },

        onRebindPending: function (oEvent) {
            let bParams = oEvent.getParameter("bindingParams");
            bParams.filters.push(new Filter("STATUS", FilterOperator.EQ, 4))
            var oSorter = new sap.ui.model.Sorter("CREATED_ON", true); // true for descending
            bParams.sorter.push(oSorter);
        },

        onRebindApproved: function (oEvent) {
            let bParams = oEvent.getParameter("bindingParams");
            bParams.filters.push(new Filter("STATUS", FilterOperator.EQ, 5))
            var oSorter = new sap.ui.model.Sorter("CREATED_ON", true); // true for descending
            bParams.sorter.push(oSorter);
        },
        onRebindReject: function (oEvent) {
            let bParams = oEvent.getParameter("bindingParams");
            bParams.filters.push(new Filter("STATUS", FilterOperator.EQ, 3))
            var oSorter = new sap.ui.model.Sorter("CREATED_ON", true); // true for descending
            bParams.sorter.push(oSorter);
        },

          onTabSelect: function (oEvent) {
            // Get the selected tab key
            var sSelectedKey = oEvent.getParameter("key");

            // Get references to the SmartFilterBars
            var oSmartFilterBarPending = this.byId("smartFilterBarPending");
            var oSmartFilterBarRejected = this.byId("smartFilterBarRejected");
            var oSmartFilterBarApproved = this.byId("smartFilterBarApproved");

            // Get references to the SmartTables
            var oSmartTablePending = this.byId("idSmartTablePend");
            var oSmartTableRejected = this.byId("idSmartTabRej");
            var oSmartTableApproved = this.byId("idSmartTabApp");

            // Manage visibility and rebind based on the selected tab
            switch (sSelectedKey) {
                case "pending":
                    oSmartFilterBarPending.setVisible(true);
                    oSmartFilterBarRejected.setVisible(false);
                    oSmartFilterBarApproved.setVisible(false);
                    oSmartTablePending.rebindTable();
                    break;
                case "rejected":
                    oSmartFilterBarPending.setVisible(false);
                    oSmartFilterBarRejected.setVisible(true);
                    oSmartFilterBarApproved.setVisible(false);
                    oSmartTableRejected.rebindTable();
                    break;
                case "approved":
                    oSmartFilterBarPending.setVisible(false);
                    oSmartFilterBarRejected.setVisible(false);
                    oSmartFilterBarApproved.setVisible(true);
                    oSmartTableApproved.rebindTable();
                    break;
                default:
                    // Default to showing Pending filter bar and table
                    oSmartFilterBarPending.setVisible(true);
                    oSmartFilterBarRejected.setVisible(false);
                    oSmartFilterBarApproved.setVisible(false);
                    oSmartTablePending.rebindTable();
                    break;
            }
        }
    });
});
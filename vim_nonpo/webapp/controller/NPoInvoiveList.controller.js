sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, Filter, FilterOperator) => {
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
            const oSMartFilter = this.byId("smartFilterBar")
            if (oSmartTable) {
                oSmartTable.rebindTable();
                oSMartFilter.setEntitySet("CODERHEAD")
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

        formatSourceType: function (sSourceType) {
            if (sSourceType) {
                // Remove the '02-' prefix and return only the 'Portal' part
                return sSourceType.split('-')[1];
            }
            return sSourceType;
        },


        statusFormattertest: function (role) {
            return `InProcess-${role}`
        },

        onTabSelect: function (oEvent) {
            const selectedKey = oEvent.getParameter("key");
            const oSMartFilter = this.byId("smartFilterBar")
            if (selectedKey === "pending") {
                const oSmartTable = this.byId("idSmartTablePend");
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                    oSMartFilter.setEntitySet("CODERHEAD")
                }
            } else if (selectedKey === "rejected") {
                const oSmartTable = this.byId("idSmartTabRej");
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                    oSMartFilter.setEntitySet("RejectedTabForIU")
                }
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

        currencyFormatter: function (amount) {
            return `${amount} INR`
        },

        onRebindPending: function (oEvent) {
            // Get binding parameters from the event
            var oBindingParams = oEvent.getParameter("bindingParams");

            // Create filter for STATUS eq 25
            var oFilter = new Filter({
                path: "STATUS",
                operator: FilterOperator.EQ,
                value1: 25
            });

            // Add the filter to binding parameters
            oBindingParams.filters.push(oFilter);
            var oSorter = new sap.ui.model.Sorter("CREATED_ON", true); // true for descending
            oBindingParams.sorter.push(oSorter);
            // Optionally set additional binding parameters
        },

        // Handler for Rejected Tab
        onRebindRejected: function (oEvent) {
            // Get binding parameters from the event
            var oBindingParams = oEvent.getParameter("bindingParams");

            // Create filter for STATUS eq 3
            var oFilter = new Filter({
                path: "STATUS",
                operator: FilterOperator.EQ,
                value1: 3
            });

            // Add the filter to binding parameters
            oBindingParams.filters.push(oFilter);
            var oSorter = new sap.ui.model.Sorter("CREATED_ON", true); // true for descending
            oBindingParams.sorter.push(oSorter);

            // Optionally set additional binding parameters
        }
    });
});
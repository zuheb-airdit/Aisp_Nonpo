sap.ui.define(
  ["sap/ui/core/mvc/Controller", "com/vim/vimnspo/utils/formatter"],
  (Controller, formatter) => {
    "use strict";

    return Controller.extend("com.vim.vimnspo.controller.index", {
      formatter: formatter,
      onInit() {
        this.getOwnerComponent()
        .getRouter()
        .getRoute("Routeindex")
        .attachPatternMatched(this._onPatternMatched, this);
      },

      _onPatternMatched: function () {
        const oSmartTable = this.byId("smartTableProjects");
        if (oSmartTable) {
            oSmartTable.rebindTable();
        }
    },
    
      onPressCreate: function () {
        // debugger;
        this.getOwnerComponent().getRouter().navTo("Routesecond", {});
      },
      handleRowClick: function (oEvent) {
        const selectedItem = oEvent.getSource();
        const context = selectedItem.getBindingContext();
        const requestNumber = context.getProperty("REQUEST_NO");

        this.getOwnerComponent().getRouter().navTo("Routethird", {
          requestNumber: requestNumber,
        });
      },

      handleBeforeRebind_Table: function(oEvent){
        let oBindingParams = oEvent.getParameter("bindingParams");
        var oSorter = new sap.ui.model.Sorter("CREATED_ON", true); // true for descending
        oBindingParams.sorter.push(oSorter);
      }
    });
  }
);

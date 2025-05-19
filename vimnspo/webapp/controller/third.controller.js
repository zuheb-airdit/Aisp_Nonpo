sap.ui.define(
  ["sap/ui/core/mvc/Controller", "com/vim/vimnspo/utils/formatter"],
  (Controller, formatter) => {
    "use strict";

    return Controller.extend("com.vim.vimnspo.controller.third", {
      formatter: formatter,
      onInit: function () {
        this.getOwnerComponent()
          .getRouter()
          .getRoute("Routethird")
          .attachPatternMatched(this._onPatternMatched, this);
      },

      _onPatternMatched: async function (oEvent) {
        const requestNumber = oEvent.getParameter("arguments").requestNumber;
        this.getView().byId("splitterSize").setSize("100%");
        document.getElementById("pdfFrame").src = "";
        const oModel = this.getView().getModel();
        const that = this;

        try {
          await oModel.metadataLoaded();

          const oData = await new Promise((resolve, reject) => {
            oModel.read("/NPoVimHead", {
              filters: [
                new sap.ui.model.Filter(
                  "REQUEST_NO",
                  sap.ui.model.FilterOperator.EQ,
                  requestNumber
                ),
              ],
              success: resolve,
              error: reject,
            });
          });

          if (oData.results.length > 0) {
            const oHeaderData = oData.results[0];
            const isApproved = oHeaderData.STATUS_DESC === "Approved" || oHeaderData.STATUS_DESC === "In-Process CODER";

            that.getView().byId("itemTableBox").setVisible(isApproved);
            that.getView().byId("attachmentsBox").setVisible(isApproved);
            that.getView().byId("waitingStrip").setVisible(!isApproved);

            const oJsonModel = new sap.ui.model.json.JSONModel(oHeaderData);
            that.getView().setModel(oJsonModel, "vimHeader");
          } else {
            sap.m.MessageToast.show("No data found for this request.");
          }
        } catch (err) {
          console.error("Failed to fetch invoice data:", err);
          sap.m.MessageToast.show("Failed to fetch invoice data.");
        }
      },

      handleClose: function () {
        this.getOwnerComponent().getRouter().navTo("Routeindex")
      },

      onPreviewPdf: function (oEvent) {
        const sUrl = oEvent.getSource().data("imageUrl");
        const oView = this.getView();

        if (!sUrl) {
          sap.m.MessageToast.show("No PDF URL available");
          return;
        }
        // debugger;

        // Set the PDF source
        // const oPdfViewer = oView.byId("pdf");
        // oPdfViewer.setSource(sUrl);
        // oPdfViewer.setVisible(true);

        document.getElementById("pdfFrame").src = sUrl;

        // Resize panels
        oView.byId("splitterSize").setSize("65%");
        // oView.byId("rightPaneLayout").setSize("35%");
      },
    });
  }
);

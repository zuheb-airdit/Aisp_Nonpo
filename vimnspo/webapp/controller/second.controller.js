sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/base/security/URLListValidator",
  ],
  function (Controller, JSONModel, MessageToast,MessageBox, URLListValidator) {
    "use strict";

    return Controller.extend("com.vim.vimnspo.controller.second", {
      onInit: function () {
        const oUploadModel = new JSONModel({ file: null });
        this.getView().setModel(oUploadModel, "uploadModel");

        this.getOwnerComponent()
          .getRouter()
          .getRoute("Routesecond")
          .attachPatternMatched(this._onPatternMatched, this);
      },

      onBeforeItemAdded: async function (oEvent) {
        const oFile = oEvent.getParameter("item").getFileObject();

        if (!oFile || oFile.type !== "application/pdf") {
          sap.m.MessageToast.show("Only PDF files are allowed.");
          oEvent.preventDefault();
          return;
        }

        const that = this;
        const oReader = new FileReader();
        const blobUrl = URL.createObjectURL(oFile);

        oReader.onload = function (e) {
          const url = e.target.result; // base64 string like data:application/pdf;base64,...
          const base64 = url.split(",")[1]; // you can store/use this if needed
          debugger;
          // URLListValidator.add(undefined, url);

          // ✅ Save to model
          const uploadModel = that.getView().getModel("uploadModel");
          uploadModel.setProperty("/file", base64); // Set this so it passes validation
          uploadModel.setProperty("/fileName", oFile.name); // Optional for payload

          // ✅ Set PDFViewer source
          // const pdfViewer = that.getView().byId("pdfViewer");
          // pdfViewer.setSource(url); // ✅ Correct: full Data URL like data:application/pdf;base64,...
          // pdfViewer.setTitle(oFile.name);
          // pdfViewer.setVisible(true);

          const iframe = document.getElementById("pdfFrame");
          if (iframe) {
            iframe.src = url;
          }

          // ✅ Optionally hide UploadSet
          that.getView().byId("uploadSet").setVisible(false);
          const clearBtn = that.getView().byId("idClearBtn");
          clearBtn.setVisible(true)
          sap.m.MessageToast.show("PDF loaded for preview.");
        };

        oReader.onerror = function (error) {
          sap.m.MessageToast.show("Error reading file.");
          console.error(error);
        };

        oReader.readAsDataURL(oFile); // ✅ Starts reading the file as base64

        oEvent.preventDefault(); // Prevent UploadSet default behavior
      },

      _onPatternMatched: function () {
        // Reset UploadSet
        const uploadSet = this.getView().byId("uploadSet");
        // const clearBtn = this.getView().byId("idClearBtn");
        // clearBtn.setVisible(true)
        uploadSet.removeAllItems(); // Clear uploaded items if any
        uploadSet.setVisible(true);
        // this.byId("idContainer").setVisible(false)
        // Reset PDFViewer
        // const pdfViewer = this.getView().byId("pdfViewer");
        // pdfViewer.setSource(""); // Clear source
        // pdfViewer.setVisible(false); // Hide viewer

        // Optionally reset model if needed
        const uploadModel = this.getView().getModel("uploadModel");
        if (uploadModel) {
          uploadModel.setProperty("/file", null);
        }
      },

      onClearPreview: function(){
        const iframe = document.getElementById("pdfFrame");
        const uploadSet = this.getView().byId("uploadSet");
        const clearBtn = this.getView().byId("idClearBtn");
        clearBtn.setVisible(false)
        uploadSet.setVisible(true);
        if (iframe) {
          iframe.src = "";
        }

      },

      setVisibility: function(){
        debugger;
        const uploadSet = this.getView().byId("uploadSet");
        const clearBtn = this.getView().byId("idClearBtn");
        

        uploadSet.removeAllItems(); // Clear uploaded items if any
        uploadSet.setVisible(false);
        clearBtn.setVisible(true)
        // this.byId("idContainer").setVisible(true)
      },

      onSave: function () {
        const oView = this.getView();
        const oModel = oView.getModel(); // OData V4 model
        const uploadModel = oView.getModel("uploadModel");
      
        // 1. Read input values
        const invoiceNumber = oView.byId("invoiceNumber").getValue();
        const invoiceDate = oView.byId("invoiceDate").getDateValue();
        const totalAmount = oView.byId("totalAmount").getValue();
        const fileURL = uploadModel.getProperty("/file");
        const fileName = uploadModel.getProperty("/fileName");
      
        // 2. Validate
        if (!invoiceNumber || !invoiceDate || !totalAmount) {
          MessageToast.show("Please fill all required fields.");
          return;
        }
        if (!fileURL || !fileName) {
          MessageToast.show("PDF must be uploaded before submission.");
          return;
        }
      
        const formattedDate = invoiceDate.toISOString().split("T")[0];
      
        // 3. Construct payload
        const payload = {
          action: "CREATE",
          NPoVimhead: [
            {
              SUPPLIER_NAME: "MARDEN INDUSTRIES",
              SUPPLIER_NUMBER: "100264",
              COMPANY_CODE: "1000",
              INVOICE_NUMBER: invoiceNumber,
              INVOICE_DATE: formattedDate,
              TOTAL_AMOUNT: totalAmount
            }
          ],
          NPoVimitem: [],
          Attachment: [
            {
              VendorCode: "110346",
              DESCRIPTION: "Vendor Invoice",
              IMAGEURL: fileURL,
              IMAGE_FILE_NAME: fileName
            }
          ]
        };
      
        // 4. Confirm before submit
        MessageBox.confirm("Do you want to submit this invoice?", {
          title: "Confirm Submission",
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              oView.setBusy(true);
      
              oModel.create("/PostNPOVimData", payload, {
                success: function () {
                  oView.setBusy(false);
                  this.onClearPreview();
                  this.clearForm();      // ✅ Reset all form fields
                  MessageBox.success("Invoice submitted successfully.", {
                    onClose: function () {
                      this.getOwnerComponent().getRouter().navTo("Routeindex");
                    }.bind(this)
                  });
                }.bind(this),
                error: function (oError) {
                  console.error("Submission error:", oError);
                  oView.setBusy(false);
                  MessageBox.error("Submission failed. Please try again.");
                }
              });
            }
          }.bind(this)
        });
      },
      
      clearForm: function () {
        const oView = this.getView();
      
        // Clear inputs
        oView.byId("invoiceNumber").setValue("");
        oView.byId("invoiceDate").setDateValue(null); // for DatePicker
        oView.byId("totalAmount").setValue("");
      
        // Clear upload model
        const uploadModel = oView.getModel("uploadModel");
        if (uploadModel) {
          uploadModel.setData({ file: "", fileName: "" });
        }
      
        // Clear iframe preview
        const iframe = document.getElementById("pdfFrame");
        if (iframe) {
          iframe.src = "";
        }
      
        // Reset UploadSet if needed
        const uploadSet = oView.byId("uploadSet");
        if (uploadSet) {
          uploadSet.removeAllIncompleteItems();
          uploadSet.setVisible(true);
        }
      
        // Hide clear button
        const clearBtn = oView.byId("idClearBtn");
        if (clearBtn) {
          clearBtn.setVisible(false);
        }
      },
      

      onCancel: function () {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("Routeindex");
      },
    });
  }
);

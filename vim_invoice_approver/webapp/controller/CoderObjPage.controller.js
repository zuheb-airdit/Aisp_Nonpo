sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"

], (Controller, MessageBox, Spreadsheet, library) => {
    "use strict";

    return Controller.extend("com.invoiceapp.viminvoiceapprover.controller.CoderObjPage", {
        onInit() {
            let oModel = this.getOwnerComponent().getModel();
            this.getView().setModel(oModel)

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteCoderDetails")
                .attachPatternMatched(this._onRouteMatchedwithoutid, this);
        },

        _onRouteMatchedwithoutid: function (oEvent) {
            const oArguments = oEvent.getParameter("arguments");
            const emptyModel = new sap.ui.model.json.JSONModel({ results: [] });
            this.getView().setModel(emptyModel, "tableModel");
            this.reqNumber = oArguments.reqNo;

            const oSplitterLayout = this.byId("previewSplitterLayout");
            if (oSplitterLayout) {
                oSplitterLayout.setSize("0%");
            }

            const oODataModel = this.getView().getModel(); // default ODataModel
            const oView = this.getView();

            const aFilters = [
                new sap.ui.model.Filter("REQUEST_NO", sap.ui.model.FilterOperator.EQ, this.reqNumber)
            ];

            oODataModel.read("/NPoVimHead", {
                filters: aFilters,
                urlParameters: {
                    "$expand": "TO_VIM_NON_PO_ITEMS,TO_VIM_NON_PO_ATTCHEMENTS"
                },
                success: function (oData) {
                    if (oData && oData.results && oData.results.length > 0) {
                        const headData = oData.results[0];

                        // Inject `editable` based on STATUS
                        headData.editable = (headData.STATUS !== 3);
                        // Bind TO_VIM_NON_PO_ITEMS as tableModel
                        const itemsRaw = headData.TO_VIM_NON_PO_ITEMS?.results || [];
                        const mappedItems = itemsRaw.map(item => ({
                            SrNo: String(item.SR_NO).padStart(3, "0"),
                            Material: item.MATERIAL,
                            CostObjectType: item.COST_OBJECT_TYPE,
                            CostObject: item.COST_OBJECT,
                            GLAccount: item.GL_ACCOUNT,
                            Qty: item.QUANTITY,
                            Total: item.PRICE
                        }));

                        const tableModel = new sap.ui.model.json.JSONModel({ results: mappedItems });
                        oView.setModel(tableModel, "tableModel")

                        const oJsonModel = new sap.ui.model.json.JSONModel(headData);
                        oView.setModel(oJsonModel, "headData");

                    } else {
                        sap.m.MessageToast.show("No data found for request number " + oArguments.reqNo);
                    }
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Error fetching data.");
                    console.error(oError);
                }
            });
        },


        statusState: function (statusDesc) {
            if (!statusDesc) return "None";
            if (statusDesc.includes("Pending")) return "Warning";
            if (statusDesc.includes("Approved")) return "Success";
            if (statusDesc.includes("Rejected")) return "Error";
            return "Information";
        },

        onPreviewPdf: function (oEvent) {
            // Get PDF URL from CustomData
            const pdfUrl = oEvent.getSource().getCustomData().find(d => d.getKey() === "imageUrl")?.getValue();

            if (pdfUrl) {
                // 1. Show the right pane by setting size
                const oSplitterLayout = this.byId("previewSplitterLayout");
                if (oSplitterLayout) {
                    oSplitterLayout.setSize("35%");
                }

                // 2. Inject PDF into iframe
                const iframe = document.getElementById("pdfFrame");
                if (iframe) {
                    iframe.src = pdfUrl;
                }
            } else {
                sap.m.MessageToast.show("Unable to load PDF.");
            }
        },

        onExportExcel: function () {
            const oTable = this.byId("myTable");
            const oTableModel = this.getView().getModel("tableModel");
            const oTableData = oTableModel.getProperty("/results");
            const oHeadData = this.getView().getModel("headData").getData();

            if (!oTableData || oTableData.length === 0) {
                MessageBox.warning("No data available to export.");
                return;
            }

            // Check if Spreadsheet is available
            if (!Spreadsheet) {
                MessageBox.error("Excel export is not supported in this SAPUI5 version. Please ensure SAPUI5 version 1.50 or higher.");
                return;
            }

            // Define columns for the Excel export using fully qualified EdmType
            const aColumns = [
                { label: "Sr No", property: "SrNo", type: sap.ui.export.EdmType.String },
                { label: "Material", property: "Material", type: sap.ui.export.EdmType.String },
                { label: "Cost Object Type", property: "CostObjectType", type: sap.ui.export.EdmType.String },
                { label: "Cost Object", property: "CostObject", type: sap.ui.export.EdmType.String },
                { label: "GL/Account", property: "GLAccount", type: sap.ui.export.EdmType.String },
                { label: "QTY", property: "Qty", type: sap.ui.export.EdmType.Number },
                { label: "Price", property: "Total", type: sap.ui.export.EdmType.Number }
            ];

            // Add Total Amount as a custom row
            const aData = oTableData.concat([{
                SrNo: "Total",
                Material: "",
                CostObjectType: "",
                CostObject: "",
                GLAccount: "",
                Qty: "",
                Total: oHeadData.TOTAL_AMOUNT || 0
            }]);

            // Create Spreadsheet instance
            const oSettings = {
                workbook: {
                    columns: aColumns,
                    context: {
                        title: "Invoice Items Export",
                        sheetName: "InvoiceItems"
                    }
                },
                dataSource: aData,
                fileName: `Invoice_Items_${new Date().toISOString().split("T")[0]}.xlsx`
            };

            const oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build().then(() => {
                oSpreadsheet.destroy();
            }).catch((oError) => {
                MessageBox.error("Error exporting to Excel: " + oError.message);
            });
        },

        formatDate: function (dateInput) {
            const date = new Date(dateInput);
            if (isNaN(date)) return "";
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        },

        onClosePreview: function () {
            const oSplitterLayout = this.byId("previewSplitterLayout");
            if (oSplitterLayout) {
                oSplitterLayout.setSize("0%");
            }

            const iframe = document.getElementById("pdfFrame");
            if (iframe) {
                iframe.src = ""; // Optionally clear the PDF to free memory
            }
        },


        onApproveInvoice: function () {
            let commApp = this.byId("commentTextArea");
            if (commApp) {
                commApp.setValue(""); // Corrected: Call setValue as a method
            }
            if (!this._oCommentDialog) {
                this.loadFragment({
                    name: "com.invoiceapp.viminvoiceapprover.fragments.Approved"
                }).then(function (oDialog) {
                    this._oCommentDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oCommentDialog.open();
            }
        },

        onRejectInvoice: function () {
            let commApp = this.byId("commentTextArea1");
            if (commApp) {
                commApp.setValue(""); // Corrected: Call setValue as a method
            }
            if (!this._oCommentDialog) {
                this.loadFragment({
                    name: "com.invoiceapp.viminvoiceapprover.fragments.Rejected"
                }).then(function (oDialog) {
                    this._oCommentDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oCommentDialog.open();
            }
        },

        onApprovFrag: function () {
            const sComment = this.byId("commentTextArea").getValue().trim();
            if (!sComment) {
                sap.m.MessageToast.show("Please enter a comment.");
                return;
            }

            this._oCommentDialog.close();

            // Call payload builder with comment
            this._buildFinalPayloadAndSend(sComment, "APPROVE");
        },

        onRejectFrag: function () {
            const sComment = this.byId("commentTextArea1").getValue().trim();
            if (!sComment) {
                sap.m.MessageToast.show("Please enter a comment.");
                return;
            }

            this._oCommentDialog.close();

            // Call payload builder with comment
            this._buildFinalPayloadAndSend(sComment, "REJECT");
        },

        onCommentCancel: function () {
            if (this._oCommentDialog) {
                this._oCommentDialog.close();
            }
        },

        _buildFinalPayloadAndSend: function (sComment, type) {
            const oRouter = this.getOwnerComponent().getRouter();
            const oView = this.getView();
            oView.setBusy(true)
            const oHeadData = oView.getModel("headData").getData();
            const aItems = oView.getModel("tableModel")?.getProperty("/results") || [];
            const aAttachments = oHeadData.TO_VIM_NON_PO_ATTCHEMENTS?.results || [];
            const oModel = this.getView().getModel();
            const payload = {
                action: type,
                REQUEST_NO: oHeadData.REQUEST_NO,
                NPoVimhead: [{
                    SUPPLIER_NAME: oHeadData.SUPPLIER_NAME || "",
                    SUPPLIER_NUMBER: oHeadData.SUPPLIER_NUMBER || "",
                    COMPANY_CODE: oHeadData.COMPANY_CODE || "",
                    CURRENT_ASSIGNEE: oHeadData.CURRENT_ASSIGNEE || "",
                    CURRENT_ASSIGNEE_ROLE: oHeadData.APPROVER_ROLE || "",
                    INVOICE_NUMBER: oHeadData.INVOICE_NUMBER || "",
                    INVOICE_DATE: this._formatDate(oHeadData.INVOICE_DATE),
                    TOTAL_AMOUNT: parseInt(oHeadData.TOTAL_AMOUNT || "0.00"),
                    EXPENSE_TYPE: oHeadData.EXPENSE_TYPE || "",
                    APPROVED_COMMENT: sComment // inject comment
                }],
                NPoVimitem: aItems.map((item, index) => ({
                    SR_NO: index + 1,
                    MATERIAL: item.Material || "",
                    COST_OBJECT_TYPE: item.CostObjectType || "",
                    COST_OBJECT: item.CostObject || "",
                    GL_ACCOUNT: item.GLAccount || "",
                    QUANTITY: parseInt(item.Qty || "0"),
                    PRICE: parseInt(item.Total || "0")
                })),
                Attachment: aAttachments.map(att => ({
                    VendorCode: att.VendorCode || "",
                    DESCRIPTION: att.DESCRIPTION || "Vendor Invoice",
                    IMAGEURL: att.IMAGEURL || "",
                    IMAGE_FILE_NAME: att.IMAGE_FILE_NAME || ""
                }))
            };

            console.log("Final Payload with Comment:", payload);
            oModel.create("/PostNPOVimData", payload, {
                success: function (res) {
                    oView.setBusy(false)
                    MessageBox.success(res.PostNPOVimData)
                    MessageBox.success(
                        res?.PostNPOVimData || `Invoice approved`,
                        {
                            title: "Success",
                            onClose: function () {
                                oRouter.navTo("RouteInvoiveLists");
                            }
                        }
                    );
                    debugger;
                },
                error: function (err) {
                    oView.setBusy(false)
                    MessageBox.error("Unable to Approve.")
                    debugger;
                }
            })

        },


        _formatDate: function (dateInput) {
            const d = new Date(dateInput);
            if (isNaN(d)) return "";
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        },

        handleClose: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteInvoiveLists");
        },
















    });
});
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"

], (Controller, MessageBox) => {
    "use strict";

    return Controller.extend("com.nonpo.vimnonpo.controller.CoderObjPage", {
        onInit() {
            this.aInput2Refs = [];
            let oModel = this.getOwnerComponent().getModel();
            this.getView().setModel(oModel)

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteCoderDetails")
                .attachPatternMatched(this._onRouteMatchedwithoutid, this);
        },

        _onRouteMatchedwithoutid: function (oEvent) {
            const oArguments = oEvent.getParameter("arguments");
            const oEditBtn = this.byId("idEditBtn");
            oEditBtn.setText("Edit")
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
                success: function (oData) {
                    if (oData && oData.results && oData.results.length > 0) {
                        const headData = oData.results[0];

                        // Inject `editable` based on STATUS
                        headData.editable = (headData.STATUS !== 3);
                        if (headData.STATUS === 3) {
                            const itemsRaw = headData.TO_VIM_NON_PO_ITEMS?.results || [];

                            // Map and calculate total only from PRICE
                            let totalAmount = 0;
                            const mappedItems = itemsRaw.map(item => {
                                const price = parseFloat(item.PRICE) || 0;
                                totalAmount += price;

                                return {
                                    SrNo: String(item.SR_NO).padStart(3, "0"),
                                    Material: item.MATERIAL,
                                    CostObjectType: item.COST_OBJECT_TYPE,
                                    CostObject: item.COST_OBJECT,
                                    GLAccount: item.GL_ACCOUNT,
                                    Qty: item.QUANTITY,
                                    Price: item.PRICE,
                                    Total: price.toFixed(2)
                                };
                            });

                            // Update headData TOTAL_AMOUNT
                            // headData.TOTAL_AMOUNT = totalAmount.toFixed(2);
                            this.byId("totalAmountText").setText(`Total Amount: ${totalAmount.toFixed(2)}`)
                            const tableModel = new sap.ui.model.json.JSONModel({ results: mappedItems });
                            oView.setModel(tableModel, "tableModel");
                        }


                        const oJsonModel = new sap.ui.model.json.JSONModel(headData);
                        oView.setModel(oJsonModel, "headData");

                    } else {
                        sap.m.MessageToast.show("No data found for request number " + oArguments.reqNo);
                    }
                }.bind(this),
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
            const aCols = [
                { label: "Sr No", property: "SrNo" },
                { label: "Material", property: "Material" },
                { label: "Cost Object Type", property: "CostObjectType" },
                { label: "Cost Object", property: "CostObject" },
                { label: "GL/Account", property: "GLAccount" },
                { label: "QTY", property: "Qty" },
                { label: "Price", property: "Price" },
                { label: "Total", property: "Total" }
            ];

            const oSettings = {
                workbook: { columns: aCols },
                dataSource: this.getView().getModel("tableModel").getProperty("/results"),
                fileName: "Item_Details.xlsx"
            };

            const oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);
            oSpreadsheet.build().finally(() => oSpreadsheet.destroy());
        },


        onAddItem: function () {
            debugger;
            const oTableModel = this.getView().getModel("tableModel");
            const data = oTableModel.getProperty("/results") || [];

            data.push({
                SrNo: String(data.length + 1).padStart(3, "0"),
                Material: "",
                CostObjectType: "",
                CostObject: "",
                GLAccount: "",
                Qty: 0,
                Price: 0,
                Total: "",
                Status: "",
                Action: ""
            });

            oTableModel.setProperty("/results", data);
            this.onTotalAmountChanged();
        },

        onDeleteItem: function () {
            const oTable = this.byId("myTable");
            const selectedItem = oTable.getSelectedItem();

            if (!selectedItem) {
                sap.m.MessageBox.error("Please select an item to delete.");
                return;
            }

            const oModel = this.getView().getModel("tableModel");
            let data = oModel.getProperty("/results");

            const index = oTable.indexOfItem(selectedItem);
            data.splice(index, 1);

            // Reindex Sr No
            data.forEach((item, i) => item.SrNo = String(i + 1).padStart(3, "0"));
            oModel.setProperty("/results", data);

            oTable.removeSelections(true);
            this.onTotalAmountChanged();
        },

        onTotalAmountChanged: function () {
            const oView = this.getView();
            const oText = oView.byId("totalAmountText");
            const oModel = oView.getModel("tableModel");
            const aItems = oModel.getProperty("/results") || [];
            // Initialize total first
            let total = 0;

            // Add values from the model items
            aItems.forEach(item => {
                const price = parseFloat(item.Total);
                if (!isNaN(price)) {
                    total += price;
                }
            });
            
            (this.aInput2Refs || []).forEach(oInput => {
                const val = parseFloat(oInput.getValue());
                if (!isNaN(val)) {
                    total += val;
                }
            });        

            // Update total text
            if (oText) {
                oText.setText("Total Amount: " + total.toFixed(2));
            }
        },
        onClickAdd: function () {
            var oItemsVBox = this.byId("itemsVBox");
        
            var oInput1 = new sap.m.Input({
                placeholder: "Label",
                value: "",
                width: "5rem",
                valueHelpOnly: false,
                showValueHelp: false,
                valueLiveUpdate: true,
                layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginEnd" })
            });
        
            var oInput2 = new sap.m.Input({
                placeholder: "%",
                value: "",
                width: "5rem",
                layoutData: new sap.m.FlexItemData()
            });
        
            // Add input reference for later total calculation
            this.aInput2Refs.push(oInput2);
        
            var oDeleteBtn = new sap.m.Button({
                icon: "sap-icon://delete",
                type: "Transparent",
                press: () => {
                    // Remove this HBox from VBox
                    oItemsVBox.removeItem(oHBox);
        
                    // Remove input2 ref from aInput2Refs
                    const index = this.aInput2Refs.indexOf(oInput2);
                    if (index !== -1) {
                        this.aInput2Refs.splice(index, 1);
                    }
        
                    // Recalculate total after deletion
                    this.onTotalAmountChanged();
                }
            });
        
            var oHBox = new sap.m.HBox({
                alignItems: "Center",
                justifyContent: "End",
                items: [oInput1, oInput2, oDeleteBtn],
                class: "sapUiTinyMarginTop"
            });
        
            oItemsVBox.addItem(oHBox);
            oInput2.attachLiveChange(() => {
                this.onTotalAmountChanged();
            });
        },
        

        _recalculateTotal: function () {
            debugger;
            const data = this.getView().getModel("tableModel").getProperty("/results") || [];
            const grandTotal = data.reduce((sum, item) => sum + (item.Total || 0), 0);
            this.getView().byId("totalAmountText").setText("Total Amount: " + grandTotal.toLocaleString());
        },

        formatDate: function (dateInput) {
            const date = new Date(dateInput);
            if (isNaN(date)) return "";
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        },

        onValueHelpCostObjectType: function (oEvent) {
            this.getView().setBusy(true); // Show busy indicator

            var oInput = oEvent.getSource(); // Get the input field that triggered the event
            this._inputFieldCostObjective = oInput;

            var oView = this.getView();

            if (!this._oValueHelpDialog) {
                this.loadFragment({
                    name: "com.nonpo.vimnonpo.fragments.CostObjectType"
                }).then(function (oDialog) {
                    this._oValueHelpDialog = oDialog;
                    oView.addDependent(oDialog);

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(oView.getModel()); // Bind default OData model

                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", {
                                path: "/CostObjectTypes",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                        oView.setBusy(false); // Hide busy after data is received
                                    }
                                }
                            });

                            // Add columns dynamically
                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Code" }),
                                template: new sap.m.Text({ text: "{TYPE_CODE}" })
                            }));

                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Description" }),
                                template: new sap.m.Text({ text: "{DESCRIPTION}" })
                            }));
                        } else {
                            oView.setBusy(false); // In case no binding method exists
                        }

                        oDialog.update();
                    }.bind(this));

                    oDialog.open();
                }.bind(this)).catch(function (error) {
                    console.error("Error loading fragment:", error);
                    oView.setBusy(false);
                });
            } else {
                this._oValueHelpDialog.open();
                oView.setBusy(false); // Already cached, unset busy immediately
            }
        },


        onValueHelpOk: function (oEvent) {
            const aTokens = oEvent.getParameter("tokens");
            var sPath = this._inputFieldCostObjective.getBindingContext("tableModel").getPath();
            if (aTokens && aTokens.length > 0) {
                const sSelectedText = aTokens[0].getText(); // This is the displayed text in token (e.g., "CODE (Description)")
                const sSelectedKey = aTokens[0].getKey();   // Use key if available

                // Set the selected value to input field with ID "idCostObj"
                const oInput = this.byId("idCostObj");
                if (oInput) {
                    oInput.setValue(sSelectedKey || sSelectedText);
                    this.getView().getModel("tableModel").setProperty(sPath + "/CostObjectType", sSelectedKey);

                }

            }

            // Close dialog
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.close();
            }
        },


        onValueHelpCancel: function () {
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.close();
            }
        },

        onValueHelpAfterClose: function () {
            // Ensure the input field is available
            if (!this._inputFieldCostObjective) return;

            // Get selected CostObjectType value from input field
            const sSelectedType = this._inputFieldCostObjective.getValue();
            if (!sSelectedType) return;

            // Construct filter: $filter=TYPE eq 'Cost Centre'
            const oFilter = new sap.ui.model.Filter("TYPE", sap.ui.model.FilterOperator.EQ, sSelectedType);

            // Get ODataModel (assuming it's default)
            const oModel = this.getView().getModel(); // OData v4 assumed
            const oView = this.getView();

            oModel.read("/CostObjects", {
                filters: [oFilter],
                success: function (oData) {
                    // Set result into a JSON model
                    const oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData);
                    oView.setModel(oJsonModel, "FilteredCostObjects");

                    sap.m.MessageToast.show("Cost Objects loaded.");
                },
                error: function (oError) {
                    console.error("Error fetching Cost Objects:", oError);
                    sap.m.MessageToast.show("Failed to load Cost Objects.");
                }
            });
        },

        onValueHelpCB: function (oEvent) {
            const oInput = oEvent.getSource(); // Capture triggering input field
            this._inputFieldCostObjectCB = oInput;

            const oView = this.getView();
            if (!this._oValueHelpDialogCB) {
                this.loadFragment({
                    name: "com.nonpo.vimnonpo.fragments.CostObjects" // Update with correct fragment name if needed
                }).then(function (oDialog) {
                    this._oValueHelpDialogCB = oDialog;
                    oView.addDependent(oDialog);

                    oDialog.getTableAsync().then(function (oTable) {
                        // Set the FilteredCostObjects JSON model
                        oTable.setModel(oView.getModel("FilteredCostObjects"));

                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", {
                                path: "/results", // Path inside JSON model
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Add Columns
                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Label" }),
                                template: new sap.m.Text({ text: "{LABEL}" })
                            }));

                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Value" }),
                                template: new sap.m.Text({ text: "{TYPE}" })
                            }));

                        }

                        oDialog.update();
                    }.bind(this));

                    oDialog.open();
                }.bind(this));
            } else {
                this._oValueHelpDialogCB.open();
            }
        },

        onValueHelpOkPress: function (oEvent) {
            const aTokens = oEvent.getParameter("tokens");
            const oInput = this._inputFieldCostObjectCB; // or whichever variable holds the triggering input

            if (aTokens && aTokens.length > 0 && oInput) {
                const sKey = aTokens[0].getKey();       // e.g., VALUE
                const sText = aTokens[0].getText();     // e.g., LABEL

                // Set selected text (Label) in input
                oInput.setValue(sText);

                // Also update VALUE in model if input is bound to table row
                const oCtx = oInput.getBindingContext("tableModel");
                if (oCtx) {
                    const sPath = oCtx.getPath();
                    oCtx.getModel().setProperty(sPath + "/CostObject", sKey); // store VALUE
                    oCtx.getModel().setProperty(sPath + "/CostObjectLabel", sText); // optional: store LABEL
                }
            }

            if (this._oValueHelpDialogCB) {
                this._oValueHelpDialogCB.close();
            }
        },

        onValueHelpCancelPress: function () {
            if (this._oValueHelpDialogCB) {
                this._oValueHelpDialogCB.close();
            }
        },

        onValueHelpGLAccount: function (oEvent) {
            this.getView().setBusy(true);
            const oInput = oEvent.getSource();
            this._inputFieldGLAccount = oInput;

            const oView = this.getView();
            const oModel = oView.getModel(); // assuming default ODataModel is set

            if (!this._oValueHelpDialogGL) {
                this.loadFragment({
                    name: "com.nonpo.vimnonpo.fragments.GLAccount" // Your fragment file name
                }).then(function (oDialog) {
                    this._oValueHelpDialogGL = oDialog;
                    oView.addDependent(oDialog);

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(oModel);

                        if (oTable.bindRows) {
                            oTable.bindRows({
                                path: "/GL_ACCOUNT",
                                parameters: {
                                    $select: "SAKNR,TXT20"
                                },
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                        oView.setBusy(false);
                                    }
                                }
                            });

                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "GL Account" }),
                                template: new sap.m.Text({ text: "{SAKNR}" })
                            }));

                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Description" }),
                                template: new sap.m.Text({ text: "{TXT20}" })
                            }));
                        } else {
                            oView.setBusy(false);
                        }

                        oDialog.update();
                    }.bind(this));

                    oDialog.open();
                }.bind(this)).catch(function (err) {
                    console.error("Failed to load fragment:", err);
                    this.getView().setBusy(false);
                }.bind(this));
            } else {
                this._oValueHelpDialogGL.open();
                oView.setBusy(false);
            }
        },

        onValueHelpOkGL: function (oEvent) {
            const aTokens = oEvent.getParameter("tokens");
            const oInput = this._inputFieldGLAccount;

            if (aTokens && aTokens.length > 0 && oInput) {
                const sKey = aTokens[0].getKey();   // e.g., GL Account (SAKNR)
                const sText = aTokens[0].getText(); // e.g., "500100 (Rent Expense)"

                // Set label (sText) to the input field
                oInput.setValue(sText);

                // Update bound model if input is inside a table row
                const oCtx = oInput.getBindingContext("tableModel");
                if (oCtx) {
                    const sPath = oCtx.getPath();
                    const oModel = oCtx.getModel();
                    oModel.setProperty(sPath + "/GLAccount", sKey);  // Save actual SAKNR
                    oModel.setProperty(sPath + "/GLDescription", sText); // Optionally save full label
                }
            }

            if (this._oValueHelpDialogGL) {
                this._oValueHelpDialogGL.close();
            }
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


        onValueHelpCancelPressGL: function () {
            if (this._oValueHelpDialogGL) {
                this._oValueHelpDialogGL.close();
            }
        },


        onSubmitCoder: function () {
            if (!this._oCommentDialog) {
                this.loadFragment({
                    name: "com.nonpo.vimnonpo.fragments.Approved"
                }).then(function (oDialog) {
                    this._oCommentDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oCommentDialog.open();
            }
        },

        onEditSubmitCoder: function () {
            if (!this._oCommentDialog) {
                this.loadFragment({
                    name: "com.nonpo.vimnonpo.fragments.Resub"
                }).then(function (oDialog) {
                    this._oCommentDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oCommentDialog.open();
            }
        },

        onCommentSubmit: function () {
            const sComment = this.byId("commentTextArea").getValue().trim();
            if (!sComment) {
                sap.m.MessageToast.show("Please enter a comment.");
                return;
            }

            this._oCommentDialog.close();

            // Call payload builder with comment
            this._buildFinalPayloadAndSend(sComment);
        },

        onCommentResub: function () {
            const sComment = this.byId("commentTextArea3").getValue().trim();
            if (!sComment) {
                sap.m.MessageToast.show("Please enter a comment.");
                return;
            }

            this._oCommentDialog.close();

            // Call payload builder with comment
            this._buildFinalPayloadAndSend(sComment);
        },

        onCommentCancel: function () {
            if (this._oCommentDialog) {
                this._oCommentDialog.close();
            }
        },

        _buildFinalPayloadAndSend: function (sComment) {
            const oRouter = this.getOwnerComponent().getRouter();
            const oView = this.getView();
            oView.setBusy(true);

            const oHeadData = oView.getModel("headData").getData();
            const aItems = oView.getModel("tableModel")?.getProperty("/results") || [];
            const aAttachments = oHeadData.TO_VIM_NON_PO_ATTCHEMENTS?.results || [];
            const oModel = oView.getModel();

            // ✅ 1. Expense Type must be filled
            if (!oHeadData.EXPENSE_TYPE || oHeadData.EXPENSE_TYPE.trim() === "") {
                oView.setBusy(false);
                MessageBox.error("Expense Type is required.");
                return;
            }

            // ✅ 2. Must have at least one item in the list
            if (!aItems.length) {
                oView.setBusy(false);
                MessageBox.error("At least one item must be added in the table.");
                return;
            }

            // ✅ 3. Total amount in header must match table total
            let tableTotal = 0;
            aItems.forEach(item => {
                const amount = parseFloat(item.Total || "0");
                tableTotal += isNaN(amount) ? 0 : amount;
            });

            const headerTotal = parseFloat(oHeadData.TOTAL_AMOUNT || "0");
            if (headerTotal !== tableTotal) {
                oView.setBusy(false);
                MessageBox.error(`Total Amount mismatch. Table total: ₹${tableTotal}, Header total: ₹${headerTotal}`);
                return;
            }

            // ✅ Construct payload
            const payload = {
                action: "EDIT_RESUBMIT",
                REQUEST_NO: oHeadData.REQUEST_NO,
                NPoVimhead: [{
                    SUPPLIER_NAME: oHeadData.SUPPLIER_NAME || "",
                    SUPPLIER_NUMBER: oHeadData.SUPPLIER_NUMBER || "",
                    COMPANY_CODE: oHeadData.COMPANY_CODE || "",
                    CURRENT_ASSIGNEE: oHeadData.CURRENT_ASSIGNEE || "",
                    CURRENT_ASSIGNEE_ROLE: oHeadData.APPROVER_ROLE || "",
                    INVOICE_NUMBER: oHeadData.INVOICE_NUMBER || "",
                    INVOICE_DATE: this._formatDate(oHeadData.INVOICE_DATE),
                    TOTAL_AMOUNT: oHeadData.TOTAL_AMOUNT || "0.00",
                    EXPENSE_TYPE: oHeadData.EXPENSE_TYPE || "",
                    APPROVED_COMMENT: sComment
                }],
                NPoVimitem: aItems.map((item, index) => ({
                    SR_NO: index + 1,
                    MATERIAL: item.Material || "",
                    COST_OBJECT_TYPE: item.CostObjectType || "",
                    COST_OBJECT: item.CostObject || "",
                    GL_ACCOUNT: item.GLAccount || "",
                    QUANTITY: item.Qty || "0",
                    PRICE: item.Total || "0"
                })),
                Attachment: aAttachments.map(att => ({
                    VendorCode: att.VendorCode || "",
                    DESCRIPTION: att.DESCRIPTION || "Vendor Invoice",
                    IMAGEURL: att.IMAGEURL || "",
                    IMAGE_FILE_NAME: att.IMAGE_FILE_NAME || ""
                }))
            };

            // 🔄 Call backend
            oModel.create("/PostNPOVimData", payload, {
                success: function (res) {
                    oView.setBusy(false);
                    MessageBox.success(res?.PostNPOVimData || "Invoice sent for approval.", {
                        title: "Success",
                        onClose: function () {
                            oRouter.navTo("RouteNPoInvoiveList");
                        }
                    });
                },
                error: function (err) {
                    oView.setBusy(false);
                    MessageBox.error("Unable to submit invoice.");
                    console.error(err);
                }
            });
        },


        onExtractOCR: function () {
            const oView = this.getView();
            oView.setBusy(true)
            const oModel = oView.getModel(); // default ODataModel v2 or v4
            let hModel = this.getView().getModel("headData")
            const oHeadData = hModel.getData();
            const aAttachments = oHeadData?.TO_VIM_NON_PO_ATTCHEMENTS?.results || [];

            if (!aAttachments.length || !aAttachments[0].IMAGEURL) {
                sap.m.MessageToast.show("No file URL found in attachments.");
                oView.setBusy(false)
                return;
            }

            const sFileUrl = aAttachments[0].IMAGEURL;

            const oPayload = { fileUrl: sFileUrl };

            oModel.create("/triggerOCR", oPayload, {
                success: function (oData) {
                    oView.setBusy(false)
                    const oOCR = oData?.triggerOCR;

                    if (oOCR?.status !== "SUCCESS" || !oOCR.items?.length) {
                        sap.m.MessageToast.show("OCR completed, but no items were extracted.");
                        return;
                    }

                    // Prepare item array for tableModel
                    const aExtractedItems = oOCR.items.map((item, index) => ({
                        SrNo: index + 1,
                        Material: item.description,
                        Qty: item.quantity,
                        Total: item.totalPrice.replace(/[^\d.-]/g, '') // remove ₹ and commas
                    }));

                    // Set data to tableModel
                    const oTableModel = oView.getModel("tableModel");
                    oTableModel.setProperty("/results", aExtractedItems);
                    this.onTotalAmountChanged();
                    const oSplitterLayout = this.byId("previewSplitterLayout");
                    if (oSplitterLayout) {
                        oSplitterLayout.setSize("35%");
                    }

                    const iframe = document.getElementById("pdfFrame");
                    if (iframe) {
                        iframe.src = sFileUrl; // use the same file URL we passed to OCR
                    }

                    sap.m.MessageToast.show("OCR items extracted and added to the table.");
                }.bind(this),
                error: function (err) {
                    oView.setBusy(false)
                    console.error("OCR call failed:", err);
                    sap.m.MessageBox.error("Failed to extract OCR data.");
                }
            });
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
            oRouter.navTo("RouteNPoInvoiveList");
        },

        onEditNonPO: function () {
            const oHeadModel = this.getView().getModel("headData");
            const oHeadData = oHeadModel.getData();
            const oEditBtn = this.byId("idEditBtn");
            oHeadData.editable = !oHeadData.editable;
            oHeadModel.setData(oHeadData);

            if (oEditBtn.getText() === "Edit") {
                oEditBtn.setText("Cancel");
            } else {
                oEditBtn.setText("Edit");
            }
        },
    });
});
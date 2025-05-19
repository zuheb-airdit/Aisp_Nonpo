/*global QUnit*/

sap.ui.define([
	"com/invoiceapp/viminvoiceapprover/controller/InvoiveLists.controller"
], function (Controller) {
	"use strict";

	QUnit.module("InvoiveLists Controller");

	QUnit.test("I should test the InvoiveLists controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

/*global QUnit*/

sap.ui.define([
	"com/nonpo/vimnonpo/controller/NPoInvoiveList.controller"
], function (Controller) {
	"use strict";

	QUnit.module("NPoInvoiveList Controller");

	QUnit.test("I should test the NPoInvoiveList controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

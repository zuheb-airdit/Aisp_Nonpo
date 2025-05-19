sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/vim/vimnspo/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.vim.vimnspo.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);
     
            // set the device model
            if (sap.ushell && sap.ushell.Container) {
                const oUser = sap.ushell.Container.getUser();
                const userId = oUser.getId();
                const userFullName = oUser.getFullName();
                const userEmail = oUser.getEmail();
                const userRoles = sap.ushell.Container.getUser().getRoles();
                console.log("Roles:", userRoles);

                console.log("User ID:", userId);
                console.log("Full Name:", userFullName);
                console.log("Email:", userEmail);
            } else {
                console.warn("Not running inside FLP shell. Cannot get user info.");
            }
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});
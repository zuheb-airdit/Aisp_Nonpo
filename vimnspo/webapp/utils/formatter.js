sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
  "use strict";

  const oDateFmt = DateFormat.getDateInstance({ pattern: "dd-MM-yyyy" });

  return {
    /** Turn JS/ISO date strings into dd‑MM‑yyyy */
    date: function (vDate) {
      if (!vDate) {
        return "";
      }
      return oDateFmt.format(new Date(vDate));
    },

    /** Map business status → UI5 state colour */
    statusState: function (sStatus) {
      switch (sStatus.toLowerCase()) {
        case "uploaded":
          return "Indication03";
        case "in-approval":
          return "Error";
        case "approved":
          return "Information";
        default:
          return "None";
      }
    },

    statusText: function (sStatus) {
      if (!sStatus) return "";

      switch (sStatus.toLowerCase()) {
        case "In-Process CODER":
          return "Uploaded";
        case "in-process sm":
          return "In Approval";
        case "approved":
          return "Approved";
        case "payment-done":
          return "Payment Done";
        default:
          return sStatus;
      }
    },
  };
});

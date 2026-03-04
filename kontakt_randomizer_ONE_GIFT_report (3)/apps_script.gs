// Google Apps Script for TARO 8 МАРТА
// Sheets: Leads, Gifts
// Deploy as Web App (Anyone)

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || "{}");
    if (payload.action !== "claim") return json_({ ok:false, message:"Unknown action" });

    var email = String(payload.email || "").trim().toLowerCase();
    if (!email) return json_({ ok:false, message:"Email is required" });

    var ss = SpreadsheetApp.openById("19a4vIUPRp1njkUNCFdXFMfOcu86gcy03STQ-CqUmsBw");
    var leads = ss.getSheetByName("Leads");
    var gifts = ss.getSheetByName("Gifts");
    if (!leads || !gifts) return json_({ ok:false, message:"Missing sheets Leads/Gifts" });

    // Check if email already claimed
    var leadData = leads.getDataRange().getValues();
    var emailCol = 3; // timestamp(1), name(2), email(3)...
    for (var i=1; i<leadData.length; i++){
      var rowEmail = String(leadData[i][emailCol-1] || "").trim().toLowerCase();
      if (rowEmail && rowEmail === email){
        return json_({ ok:false, message:"Этот email уже получал подарок" });
      }
    }

    // Check gift availability
    var giftId = String(payload.gift_id || "").trim();
    if (!giftId) return json_({ ok:false, message:"gift_id is required" });

    var giftData = gifts.getDataRange().getValues();
    // columns: gift_id, gift_name, limit, issued
    var found = -1;
    for (var j=1; j<giftData.length; j++){
      if (String(giftData[j][0]).trim() === giftId){
        found = j;
        break;
      }
    }
    if (found === -1) return json_({ ok:false, message:"Unknown gift" });

    var limit = Number(giftData[found][2] || 0);
    var issued = Number(giftData[found][3] || 0);
    if (issued >= limit){
      return json_({ ok:false, message:"Лимит по этому подарку исчерпан" });
    }

    // Write lead
    var now = new Date();
    leads.appendRow([
      now,
      payload.name || "",
      email,
      payload.phone || "",
      payload.company || "",
      payload.title || "",
      giftId,
      payload.gift_name || "",
      payload.user_agent || ""
    ]);

    // Update issued
    gifts.getRange(found+1, 4).setValue(issued + 1);

    return json_({ ok:true });
  } catch(err){
    return json_({ ok:false, message:String(err) });
  }
}

function json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

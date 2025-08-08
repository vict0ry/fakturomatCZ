// Debug script to test invoice update data flow
const fetch = require('node-fetch');

const testData = {
  invoiceId: 1,
  updateData: {
    customerId: 1,
    items: [
      {
        description: "Existing Item",
        quantity: "1",
        unit: "ks", 
        unitPrice: "1000",
        vatRate: "21",
        total: "1210"
      },
      {
        description: "NEW ADDED ITEM",
        quantity: "2", 
        unit: "ks",
        unitPrice: "500",
        vatRate: "21", 
        total: "1210"
      }
    ]
  }
};

console.log("=== INVOICE UPDATE TEST DATA ===");
console.log("Invoice ID:", testData.invoiceId);
console.log("Update data:", JSON.stringify(testData.updateData, null, 2));
console.log("Items count:", testData.updateData.items.length);
console.log("New item details:", testData.updateData.items[1]);

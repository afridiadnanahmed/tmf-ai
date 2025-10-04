// This shows the data structure returned from Shopify API

const exampleShopifyData = {
  // What we receive from Shopify Orders API
  rawOrders: [
    {
      id: 1234567890,
      email: "customer@example.com",
      created_at: "2025-10-01T10:00:00Z",
      total_price: "150.00",
      currency: "USD",
      financial_status: "paid",
      fulfillment_status: "fulfilled",
      line_items: [
        { title: "Product 1", quantity: 2, price: "50.00" },
        { title: "Product 2", quantity: 1, price: "50.00" }
      ]
    },
    {
      id: 1234567891,
      email: "customer2@example.com",
      created_at: "2025-10-02T15:30:00Z",
      total_price: "89.99",
      currency: "USD",
      financial_status: "paid",
      fulfillment_status: "fulfilled",
      line_items: [
        { title: "Product 3", quantity: 1, price: "89.99" }
      ]
    }
  ],

  // What we calculate and transform for the dashboard
  calculatedAnalytics: {
    orders: {
      totalOrders: 2,           // Number of orders
      totalSales: 239.99,       // Sum of all order total_price
      avgOrderValue: 119.995    // totalSales / totalOrders
    },
    traffic: {
      sessions: 100,            // Estimated: totalOrders / 0.02 (2% conversion rate)
      pageViews: 300            // Estimated: sessions * 3
    },
    conversion: {
      conversionRate: 2,        // 2% (hardcoded estimate)
      totalConversions: 2       // Same as totalOrders
    }
  },

  // What we send to the dashboard as campaign data
  campaignDataStructure: {
    id: "shopify-store-performance",
    name: "Shopify Store Performance",
    platform: "shopify",
    status: "active",
    spend: 0,                   // Shopify doesn't track ad spend
    clicks: 100,                // = analytics.traffic.sessions
    impressions: 300,           // = analytics.traffic.pageViews
    conversions: 2,             // = analytics.conversion.totalConversions (total orders)
    revenue: 239.99,            // = analytics.orders.totalSales
    metadata: {
      totalOrders: 2,
      avgOrderValue: 119.995,
      conversionRate: 2
    }
  },

  // Mapping explanation
  mapping: {
    "Dashboard 'Spend'": "0 (Shopify doesn't have ad spend data)",
    "Dashboard 'Clicks'": "Estimated sessions (orders / 0.02)",
    "Dashboard 'Conversions'": "Total number of orders",
    "Dashboard 'Revenue'": "Sum of all order total_price",
    "Dashboard 'Impressions'": "Estimated page views (sessions * 3)"
  }
};

console.log('=== SHOPIFY DATA STRUCTURE ===\n');
console.log('1. Raw Orders from API:');
console.log(JSON.stringify(exampleShopifyData.rawOrders, null, 2));

console.log('\n2. Calculated Analytics:');
console.log(JSON.stringify(exampleShopifyData.calculatedAnalytics, null, 2));

console.log('\n3. Final Campaign Data Sent to Dashboard:');
console.log(JSON.stringify(exampleShopifyData.campaignDataStructure, null, 2));

console.log('\n4. Field Mapping:');
console.log(JSON.stringify(exampleShopifyData.mapping, null, 2));

console.log('\n=== IMPORTANT NOTES ===');
console.log('- Spend: Always 0 (Shopify doesn\'t track advertising spend)');
console.log('- Clicks: Estimated website sessions based on 2% conversion rate');
console.log('- Impressions: Estimated page views (sessions × 3)');
console.log('- Conversions: Actual number of completed orders');
console.log('- Revenue: Actual total sales amount from orders');

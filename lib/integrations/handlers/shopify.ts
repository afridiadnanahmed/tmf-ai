// Shopify integration handler
export interface ShopifyCredentials {
  storeName: string;
  accessToken: string;
}

export interface ShopifyAnalytics {
  orders: {
    totalOrders: number;
    totalSales: number;
    avgOrderValue: number;
  };
  traffic: {
    sessions: number;
    pageViews: number;
  };
  conversion: {
    conversionRate: number;
    totalConversions: number;
  };
}

export class ShopifyIntegration {
  private credentials: ShopifyCredentials;
  private apiVersion = '2024-01';

  constructor(credentials: ShopifyCredentials) {
    this.credentials = credentials;
  }

  private async makeRequest(endpoint: string, method = 'GET', body?: any) {
    const url = `https://${this.credentials.storeName}/admin/api/${this.apiVersion}/${endpoint}`;

    console.log(`[Shopify] Making API request to: ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'X-Shopify-Access-Token': this.credentials.accessToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Shopify] API Error - Status: ${response.status}, StatusText: ${response.statusText}, Body: ${errorText}`);
      throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  private async makeGraphQLRequest(query: string, variables?: any) {
    const url = `https://${this.credentials.storeName}/admin/api/${this.apiVersion}/graphql.json`;

    console.log(`[Shopify] Making GraphQL request to: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': this.credentials.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Shopify] GraphQL Error - Status: ${response.status}, StatusText: ${response.statusText}, Body: ${errorText}`);
      throw new Error(`Shopify GraphQL error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('[Shopify] GraphQL errors:', result.errors);
      throw new Error(`Shopify GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  async getOrders(dateFrom?: Date, dateTo?: Date) {
    try {
      console.log('[Shopify] Fetching orders via REST API...');

      const params = new URLSearchParams();
      params.append('status', 'any');
      params.append('limit', '250');

      if (dateFrom) {
        params.append('created_at_min', dateFrom.toISOString());
      }
      if (dateTo) {
        params.append('created_at_max', dateTo.toISOString());
      }

      const data = await this.makeRequest(`orders.json?${params.toString()}`);
      console.log(`[Shopify] Fetched ${data.orders?.length || 0} orders`);

      return data.orders || [];
    } catch (error) {
      console.error('[Shopify] Error fetching orders:', error);
      return [];
    }
  }

  async getAnalytics(dateFrom?: Date, dateTo?: Date): Promise<ShopifyAnalytics> {
    try {
      console.log('[Shopify] Calculating analytics from orders...');

      // Fetch orders from the last 30 days
      const orders = await this.getOrders(dateFrom, dateTo);

      // Calculate metrics from orders
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum: number, order: any) => {
        return sum + parseFloat(order.total_price || '0');
      }, 0);
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      console.log(`[Shopify] Analytics: ${totalOrders} orders, $${totalSales.toFixed(2)} in sales`);

      // Estimate sessions based on typical e-commerce conversion rates
      // You could also use GraphQL to fetch actual session data if available
      const estimatedConversionRate = 0.02; // 2% typical conversion rate
      const estimatedSessions = totalOrders > 0 ? Math.floor(totalOrders / estimatedConversionRate) : 0;
      const pageViews = Math.floor(estimatedSessions * 3); // Estimate 3 pages per session

      return {
        orders: {
          totalOrders,
          totalSales,
          avgOrderValue,
        },
        traffic: {
          sessions: estimatedSessions,
          pageViews,
        },
        conversion: {
          conversionRate: estimatedConversionRate * 100,
          totalConversions: totalOrders,
        },
      };
    } catch (error) {
      console.error('[Shopify] Error calculating analytics:', error);
      return {
        orders: { totalOrders: 0, totalSales: 0, avgOrderValue: 0 },
        traffic: { sessions: 0, pageViews: 0 },
        conversion: { conversionRate: 0, totalConversions: 0 },
      };
    }
  }

  async getCampaignData() {
    try {
      // Get analytics for the last 30 days
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);

      const analytics = await this.getAnalytics(dateFrom, dateTo);

      // Fetch orders for last 12 months for monthly breakdown
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      const allOrders = await this.getOrders(twelveMonthsAgo, new Date());

      // Group orders by month
      const monthlyBreakdown = this.groupOrdersByMonth(allOrders);

      // Create a campaign-like structure from Shopify data
      const campaignData = {
        id: 'shopify-store-performance',
        name: 'Shopify Store Performance',
        platform: 'shopify',
        status: 'active',
        spend: 0, // Shopify doesn't track ad spend
        clicks: analytics.traffic.sessions,
        impressions: analytics.traffic.pageViews,
        conversions: analytics.conversion.totalConversions,
        revenue: analytics.orders.totalSales,
        metadata: {
          totalOrders: analytics.orders.totalOrders,
          avgOrderValue: analytics.orders.avgOrderValue,
          conversionRate: analytics.conversion.conversionRate,
          monthlyBreakdown, // Add monthly data
        },
      };

      console.log('[Shopify] Final campaign data structure:', JSON.stringify(campaignData, null, 2));
      return campaignData;
    } catch (error) {
      console.error('Error getting Shopify campaign data:', error);
      return null;
    }
  }

  private groupOrdersByMonth(orders: any[]): Array<{ month: string; revenue: number; orders: number }> {
    const monthlyData: { [key: string]: { revenue: number; orders: number } } = {};

    console.log(`[Shopify] Grouping ${orders.length} orders by month`);

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { revenue: 0, orders: 0 };
    }

    console.log('[Shopify] Initialized months:', Object.keys(monthlyData));

    // Group orders by month
    let matchedOrders = 0;
    let unmatchedOrders = 0;
    orders.forEach((order: any) => {
      const orderDate = new Date(order.created_at);
      const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData[key]) {
        monthlyData[key].revenue += parseFloat(order.total_price || '0');
        monthlyData[key].orders += 1;
        matchedOrders++;
      } else {
        unmatchedOrders++;
        if (unmatchedOrders <= 5) {
          console.log(`[Shopify] Order ${order.id} from ${order.created_at} (key: ${key}) doesn't match any initialized month`);
        }
      }
    });

    console.log(`[Shopify] Matched ${matchedOrders} orders, ${unmatchedOrders} orders outside date range`);

    // Convert to array format
    return Object.entries(monthlyData).map(([key, data]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: Math.round(data.revenue * 100) / 100, // Round to 2 decimals
        orders: data.orders,
      };
    });
  }
}

// CRM client integrations for fetching leads from different platforms

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  value?: number;
  currency?: string;
  status: string;
  source: string;
  platform: string;
  createdAt: Date;
  updatedAt?: Date;
  customFields?: Record<string, any>;
}

export interface CRMClient {
  fetchLeads(accessToken: string, metadata?: any): Promise<Lead[]>;
  syncLead(accessToken: string, lead: Lead, metadata?: any): Promise<boolean>;
}

// Salesforce CRM Client
export class SalesforceClient implements CRMClient {
  async fetchLeads(accessToken: string, metadata?: any): Promise<Lead[]> {
    const instanceUrl = metadata?.instanceUrl || 'https://login.salesforce.com';

    try {
      const response = await fetch(`${instanceUrl}/services/data/v58.0/query?q=SELECT+Id,Name,Email,Phone,Company,Status,CreatedDate,LastModifiedDate,LeadSource+FROM+Lead+ORDER+BY+CreatedDate+DESC+LIMIT+100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Salesforce API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.records.map((record: any) => ({
        id: record.Id,
        name: record.Name,
        email: record.Email,
        phone: record.Phone,
        company: record.Company,
        status: record.Status,
        source: record.LeadSource || 'Salesforce',
        platform: 'salesforce',
        createdAt: new Date(record.CreatedDate),
        updatedAt: record.LastModifiedDate ? new Date(record.LastModifiedDate) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching Salesforce leads:', error);
      return [];
    }
  }

  async syncLead(accessToken: string, lead: Lead, metadata?: any): Promise<boolean> {
    // Implementation for syncing leads to Salesforce
    return true;
  }
}

// HubSpot CRM Client
export class HubSpotClient implements CRMClient {
  async fetchLeads(accessToken: string): Promise<Lead[]> {
    try {
      const allContacts: any[] = [];
      let after: string | undefined = undefined;
      const limit = 100; // HubSpot's max is 100 per page

      // Paginate through all contacts
      do {
        const url = new URL('https://api.hubapi.com/crm/v3/objects/contacts');
        url.searchParams.append('limit', limit.toString());
        url.searchParams.append('properties', 'firstname,lastname,email,phone,company,hs_lead_status,createdate');

        if (after) {
          url.searchParams.append('after', after);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.statusText}`);
        }

        const data = await response.json();
        allContacts.push(...data.results);

        // Check if there are more pages
        after = data.paging?.next?.after;

        // Safety check to prevent infinite loops (optional)
        if (allContacts.length > 10000) {
          console.warn('HubSpot: Reached safety limit of 10,000 contacts');
          break;
        }
      } while (after);

      return allContacts.map((contact: any) => ({
        id: contact.id,
        name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
        email: contact.properties.email,
        phone: contact.properties.phone,
        company: contact.properties.company,
        status: contact.properties.hs_lead_status || 'New',
        source: 'HubSpot',
        platform: 'hubspot',
        createdAt: new Date(contact.properties.createdate),
        customFields: contact.properties,
      }));
    } catch (error) {
      console.error('Error fetching HubSpot leads:', error);
      return [];
    }
  }

  async syncLead(accessToken: string, lead: Lead): Promise<boolean> {
    return true;
  }
}

// Zoho CRM Client
export class ZohoCRMClient implements CRMClient {
  async fetchLeads(accessToken: string, metadata?: any): Promise<Lead[]> {
    try {
      const response = await fetch('https://www.zohoapis.com/crm/v3/Leads?fields=Full_Name,Email,Phone,Company,Lead_Status,Lead_Source,Created_Time,Modified_Time&per_page=100', {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Zoho CRM API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.data.map((lead: any) => ({
        id: lead.id,
        name: lead.Full_Name,
        email: lead.Email,
        phone: lead.Phone,
        company: lead.Company,
        status: lead.Lead_Status || 'New',
        source: lead.Lead_Source || 'Zoho CRM',
        platform: 'zohoCRM',
        createdAt: new Date(lead.Created_Time),
        updatedAt: lead.Modified_Time ? new Date(lead.Modified_Time) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching Zoho CRM leads:', error);
      return [];
    }
  }

  async syncLead(accessToken: string, lead: Lead): Promise<boolean> {
    return true;
  }
}

// Pipedrive Client
export class PipedriveClient implements CRMClient {
  async fetchLeads(accessToken: string, metadata?: any): Promise<Lead[]> {
    const companyDomain = metadata?.companyDomain || '';

    try {
      // Fetch persons (contacts) from Pipedrive
      const response = await fetch(`https://${companyDomain}/v1/persons?limit=100&api_token=${accessToken}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Pipedrive API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        return [];
      }

      return data.data.map((person: any) => ({
        id: person.id.toString(),
        name: person.name,
        email: person.email?.[0]?.value,
        phone: person.phone?.[0]?.value,
        company: person.org_name,
        status: person.active_flag ? 'Active' : 'Inactive',
        source: 'Pipedrive',
        platform: 'pipedrive',
        createdAt: new Date(person.add_time),
        updatedAt: person.update_time ? new Date(person.update_time) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching Pipedrive leads:', error);
      return [];
    }
  }

  async syncLead(accessToken: string, lead: Lead): Promise<boolean> {
    return true;
  }
}

// Microsoft Dynamics 365 Client
export class Dynamics365Client implements CRMClient {
  async fetchLeads(accessToken: string, metadata?: any): Promise<Lead[]> {
    const instanceUrl = metadata?.instanceUrl || '';

    try {
      const response = await fetch(`${instanceUrl}/api/data/v9.2/leads?$select=leadid,fullname,emailaddress1,telephone1,companyname,statuscode,createdon,modifiedon&$top=100&$orderby=createdon desc`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Dynamics 365 API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.value.map((lead: any) => ({
        id: lead.leadid,
        name: lead.fullname,
        email: lead.emailaddress1,
        phone: lead.telephone1,
        company: lead.companyname,
        status: this.getStatusLabel(lead.statuscode),
        source: 'Dynamics 365',
        platform: 'dynamics365',
        createdAt: new Date(lead.createdon),
        updatedAt: lead.modifiedon ? new Date(lead.modifiedon) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching Dynamics 365 leads:', error);
      return [];
    }
  }

  private getStatusLabel(statusCode: number): string {
    const statusMap: Record<number, string> = {
      1: 'New',
      2: 'Contacted',
      3: 'Qualified',
      4: 'Disqualified',
    };
    return statusMap[statusCode] || 'Unknown';
  }

  async syncLead(accessToken: string, lead: Lead): Promise<boolean> {
    return true;
  }
}

// Freshsales Client
export class FreshsalesClient implements CRMClient {
  async fetchLeads(accessToken: string, metadata?: any): Promise<Lead[]> {
    const domain = metadata?.domain || '';

    try {
      const response = await fetch(`https://${domain}/api/leads/view/all_leads?per_page=100`, {
        headers: {
          'Authorization': `Token token=${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Freshsales API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.leads.map((lead: any) => ({
        id: lead.id.toString(),
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        email: lead.email,
        phone: lead.mobile_number || lead.work_number,
        company: lead.company_name,
        status: lead.lead_stage?.name || 'New',
        source: lead.lead_source?.name || 'Freshsales',
        platform: 'freshsales',
        createdAt: new Date(lead.created_at),
        updatedAt: lead.updated_at ? new Date(lead.updated_at) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching Freshsales leads:', error);
      return [];
    }
  }

  async syncLead(accessToken: string, lead: Lead): Promise<boolean> {
    return true;
  }
}

// Factory function to get the appropriate CRM client
export function getCRMClient(platform: string): CRMClient | null {
  switch (platform) {
    case 'salesforce':
      return new SalesforceClient();
    case 'hubspot':
      return new HubSpotClient();
    case 'zohoCRM':
      return new ZohoCRMClient();
    case 'pipedrive':
      return new PipedriveClient();
    case 'dynamics365':
      return new Dynamics365Client();
    case 'freshsales':
      return new FreshsalesClient();
    default:
      return null;
  }
}

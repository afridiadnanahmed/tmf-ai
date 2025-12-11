import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { integrations, contacts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCRMClient, Lead } from '@/lib/crm/crm-clients';

// GET - Fetch leads from all connected CRM platforms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const syncToDb = searchParams.get('sync') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // CRM platforms that support lead fetching
    const crmPlatforms = ['salesforce', 'hubspot', 'zohoCRM', 'pipedrive', 'dynamics365', 'freshsales'];

    const allLeads: Lead[] = [];
    const errors: Array<{ platform: string; error: string }> = [];
    const connectedPlatforms: string[] = [];

    // Always fetch connected platforms list for the filter dropdown
    const allUserIntegrations = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, session.id),
          eq(integrations.isActive, true)
        )
      );

    // Add CRM platforms to connectedPlatforms
    for (const integration of allUserIntegrations) {
      if (crmPlatforms.includes(integration.platform) && !connectedPlatforms.includes(integration.platform)) {
        connectedPlatforms.push(integration.platform);
      }
    }

    // Fetch from local database for manual/imported entries
    // OR when fetching all platforms (to include manual/imported alongside CRM data)
    if (!platform || platform === 'manual' || platform === 'imported') {
      const localContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.userId, session.id));

      for (const contact of localContacts) {
        const metadata = contact.metadata as any;
        const contactPlatform = metadata?.crmPlatform || 'manual';

        // Add to connectedPlatforms if it's manual/imported and not already there
        if ((contactPlatform === 'manual' || contactPlatform === 'imported') && !connectedPlatforms.includes(contactPlatform)) {
          connectedPlatforms.push(contactPlatform);
        }

        // Only include manual/imported entries (not synced CRM data)
        if ((contactPlatform === 'manual' || contactPlatform === 'imported')) {
          // Filter by requested platform (or include all if no filter)
          if (!platform || contactPlatform === platform) {
            allLeads.push({
              id: contact.id,
              name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed',
              email: contact.email || undefined,
              phone: contact.phone || undefined,
              company: contact.company || undefined,
              status: metadata?.status || 'New',
              source: metadata?.source || 'Manual Entry',
              platform: contactPlatform,
              value: metadata?.value,
              currency: metadata?.currency,
              createdAt: contact.createdAt || new Date(),
            });
          }
        }
      }
    }

    // Fetch from CRM platforms (live API calls)
    if (!platform || crmPlatforms.includes(platform || '')) {
      // Fetch from CRM platforms (existing logic)
      // Get user's connected CRM integrations
      let userIntegrations = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.userId, session.id),
            eq(integrations.isActive, true)
          )
        );

      // Filter to CRM platforms only
      userIntegrations = userIntegrations.filter(integration =>
        crmPlatforms.includes(integration.platform)
      );

      // If specific platform requested, filter to that
      if (platform) {
        userIntegrations = userIntegrations.filter(i => i.platform === platform);
      }

      for (const integration of userIntegrations) {
      try {
        const client = getCRMClient(integration.platform);

        if (!client) {
          errors.push({
            platform: integration.platform,
            error: 'CRM client not implemented'
          });
          continue;
        }

        if (!integration.accessToken) {
          errors.push({
            platform: integration.platform,
            error: 'No access token available'
          });
          continue;
        }

        // Fetch leads from the platform
        const leads = await client.fetchLeads(
          integration.accessToken,
          integration.metadata
        );

        allLeads.push(...leads);

        // Optionally sync leads to local database
        if (syncToDb) {
          await syncLeadsToDatabase(session.id, leads);
        }
      } catch (error) {
        console.error(`Error fetching leads from ${integration.platform}:`, error);
        errors.push({
          platform: integration.platform,
          error: String(error)
        });
      }
    }
    }

    // Calculate stats from all leads
    const stats = calculateLeadStats(allLeads);

    // Implement pagination
    const totalLeads = allLeads.length;
    const totalPages = Math.ceil(totalLeads / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLeads = allLeads.slice(startIndex, endIndex);

    return NextResponse.json({
      leads: paginatedLeads,
      stats,
      platforms: connectedPlatforms,
      errors: errors.length > 0 ? errors : undefined,
      pagination: {
        page,
        limit,
        totalLeads,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to fetch CRM leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CRM leads', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Add a new lead or sync leads to database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sync, name, email, phone, company, status, source, value, currency } = body;

    // If sync request, re-fetch and sync leads
    if (sync === true) {
      const response = await GET(request);
      const data = await response.json();

      return NextResponse.json({
        success: true,
        syncedCount: data.leads?.length || 0,
        message: 'Leads synced successfully',
      });
    }

    // Validate required fields for adding a lead
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create new contact in database
    const contactData = {
      userId: session.id,
      email: email || null,
      phone: phone || null,
      firstName: name.split(' ')[0] || null,
      lastName: name.split(' ').slice(1).join(' ') || null,
      company: company || null,
      metadata: {
        crmPlatform: 'manual',
        status: status || 'New',
        source: source || 'Manual Entry',
        value: value || null,
        currency: currency || 'USD',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newContact] = await db.insert(contacts).values(contactData).returning();

    return NextResponse.json({
      success: true,
      contact: newContact,
      message: 'Lead added successfully',
    });
  } catch (error) {
    console.error('Failed to add lead:', error);
    return NextResponse.json(
      { error: 'Failed to add lead', details: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to sync leads to the database
async function syncLeadsToDatabase(userId: string, leads: Lead[]): Promise<void> {
  for (const lead of leads) {
    try {
      // Check if contact already exists
      const existing = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.email, lead.email || '')
          )
        )
        .limit(1);

      const contactData = {
        userId,
        email: lead.email || null,
        phone: lead.phone || null,
        firstName: lead.name.split(' ')[0] || null,
        lastName: lead.name.split(' ').slice(1).join(' ') || null,
        company: lead.company || null,
        metadata: {
          crmPlatform: lead.platform,
          crmId: lead.id,
          status: lead.status,
          source: lead.source,
          value: lead.value,
          currency: lead.currency,
          ...lead.customFields,
        },
        updatedAt: new Date(),
      };

      if (existing.length === 0) {
        // Create new contact
        await db.insert(contacts).values(contactData);
      } else {
        // Update existing contact
        await db
          .update(contacts)
          .set(contactData)
          .where(eq(contacts.id, existing[0].id));
      }
    } catch (error) {
      console.error(`Failed to sync lead ${lead.id}:`, error);
    }
  }
}

// Helper function to calculate lead statistics
function calculateLeadStats(leads: Lead[]): {
  total: number;
  new: number;
  qualified: number;
  converted: number;
} {
  const stats = {
    total: leads.length,
    new: 0,
    qualified: 0,
    converted: 0,
  };

  for (const lead of leads) {
    const status = lead.status.toLowerCase();

    if (status.includes('new') || status.includes('open')) {
      stats.new++;
    } else if (status.includes('qualified') || status.includes('working')) {
      stats.qualified++;
    } else if (status.includes('convert') || status.includes('won') || status.includes('closed')) {
      stats.converted++;
    }
  }

  return stats;
}

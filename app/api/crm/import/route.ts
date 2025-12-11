import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';

// POST - Import leads from CSV/Excel file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leads } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads data provided' }, { status: 400 });
    }

    const results = {
      total: leads.length,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    };

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];

      try {
        // Validate required fields
        if (!lead.name || lead.name.trim() === '') {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Name is required',
            data: lead,
          });
          continue;
        }

        // Check if contact already exists by email
        let existingContact = null;
        if (lead.email && lead.email.trim() !== '') {
          const existing = await db
            .select()
            .from(contacts)
            .where((c) => c.userId === session.id && c.email === lead.email.trim())
            .limit(1);

          if (existing.length > 0) {
            existingContact = existing[0];
          }
        }

        // Parse name into first and last name
        const nameParts = lead.name.trim().split(' ');
        const firstName = nameParts[0] || null;
        const lastName = nameParts.slice(1).join(' ') || null;

        // Parse value
        let value = null;
        if (lead.value) {
          const parsedValue = typeof lead.value === 'string'
            ? parseFloat(lead.value.replace(/[^0-9.-]/g, ''))
            : parseFloat(lead.value);
          if (!isNaN(parsedValue)) {
            value = parsedValue;
          }
        }

        const contactData = {
          userId: session.id,
          email: lead.email?.trim() || null,
          phone: lead.phone?.trim() || null,
          firstName,
          lastName,
          company: lead.company?.trim() || null,
          metadata: {
            crmPlatform: 'imported',
            status: lead.status || 'New',
            source: lead.source || 'CSV Import',
            value,
            currency: lead.currency || 'USD',
            importDate: new Date().toISOString(),
          },
          updatedAt: new Date(),
        };

        if (existingContact) {
          // Update existing contact
          await db
            .update(contacts)
            .set(contactData)
            .where((c) => c.id === existingContact.id);
          results.updated++;
        } else {
          // Create new contact
          await db.insert(contacts).values({
            ...contactData,
            createdAt: new Date(),
          });
          results.imported++;
        }
      } catch (error) {
        console.error(`Failed to import lead at row ${i + 1}:`, error);
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : String(error),
          data: lead,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Successfully imported ${results.imported} leads, updated ${results.updated} leads. ${results.failed} failed.`,
    });
  } catch (error) {
    console.error('Failed to import leads:', error);
    return NextResponse.json(
      { error: 'Failed to import leads', details: String(error) },
      { status: 500 }
    );
  }
}

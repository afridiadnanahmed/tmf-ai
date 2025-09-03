import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Get user settings
export async function GET(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let session: any;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get user settings from database
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.userId))
      .limit(1);

    // If no settings exist, create default settings
    if (!settings.length) {
      const newSettings = await db
        .insert(userSettings)
        .values({
          userId: session.userId,
          settings: {
            notifications: {
              emailAlerts: true,
              pushNotifications: true,
              weeklyReports: true,
              campaignUpdates: true,
            },
            theme: 'light',
          },
        })
        .returning();

      return NextResponse.json({
        settings: newSettings[0].settings
      });
    }

    return NextResponse.json({
      settings: settings[0].settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

// Update user settings
export async function PUT(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let session: any;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get request body - could be partial updates
    const body = await request.json();

    // Check if settings exist
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.userId))
      .limit(1);

    let updatedSettings;
    
    if (existingSettings.length > 0) {
      // Merge new settings with existing ones
      const currentSettings = existingSettings[0].settings as any;
      const mergedSettings = {
        ...currentSettings,
        ...body,
        // Deep merge for nested objects like notifications
        notifications: {
          ...currentSettings?.notifications,
          ...body?.notifications,
        },
      };
      
      // Update existing settings
      updatedSettings = await db
        .update(userSettings)
        .set({
          settings: mergedSettings,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, session.userId))
        .returning();
    } else {
      // Create new settings with defaults
      const defaultSettings = {
        notifications: {
          emailAlerts: true,
          pushNotifications: true,
          weeklyReports: true,
          campaignUpdates: true,
        },
        theme: 'light',
      };
      
      const mergedSettings = {
        ...defaultSettings,
        ...body,
        notifications: {
          ...defaultSettings.notifications,
          ...body?.notifications,
        },
      };
      
      updatedSettings = await db
        .insert(userSettings)
        .values({
          userId: session.userId,
          settings: mergedSettings,
        })
        .returning();
    }

    if (!updatedSettings.length) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      settings: updatedSettings[0].settings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
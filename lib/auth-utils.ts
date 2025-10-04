import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    // Parse session data
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (error) {
      return null;
    }

    // Get fresh user data from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionData.userId))
      .limit(1);

    if (user.length === 0 || !user[0].isActive) {
      return null;
    }

    return {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      image: user[0].image,
    };
  } catch (error) {
    console.error('Get server session error:', error);
    return null;
  }
}
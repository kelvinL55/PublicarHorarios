import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
    const db = getDB();
    // Return only usernames, not passwords or other sensitive info
    const usernames = db.users.map(u => u.username);
    return NextResponse.json(usernames);
}

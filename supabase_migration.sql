-- Supabase Migration Script for Shuck-in
-- Generated from Prisma schema
-- Run this in Supabase SQL Editor

-- ============================================
-- ENUMS
-- ============================================

-- Create Role enum
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'PLAYER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create MemberStatus enum
DO $$ BEGIN
    CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create GameType enum
DO $$ BEGIN
    CREATE TYPE "GameType" AS ENUM ('GAME', 'PRACTICE', 'SCRIMMAGE', 'TOURNAMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create GameResult enum
DO $$ BEGIN
    CREATE TYPE "GameResult" AS ENUM ('WIN', 'LOSS', 'TIE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RsvpStatus enum
DO $$ BEGIN
    CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'IN', 'OUT', 'MAYBE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create MediaType enum
DO $$ BEGIN
    CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "phone" TEXT,
    "jerseyNumber" TEXT,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "smsReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailReminders" BOOLEAN NOT NULL DEFAULT true,
    "chatNotifications" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Team table
CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1976d2',
    "inviteCode" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create unique index on inviteCode
CREATE UNIQUE INDEX IF NOT EXISTS "Team_inviteCode_key" ON "Team"("inviteCode");

-- Chirper table (AI Sports Figure)
CREATE TABLE IF NOT EXISTS "Chirper" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "personality" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "Chirper_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Chirper_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on teamId
CREATE INDEX IF NOT EXISTS "Chirper_teamId_idx" ON "Chirper"("teamId");

-- ChirperMessage table
CREATE TABLE IF NOT EXISTS "ChirperMessage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chirperId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "ChirperMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChirperMessage_chirperId_fkey" FOREIGN KEY ("chirperId") REFERENCES "Chirper"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on teamId, createdAt
CREATE INDEX IF NOT EXISTS "ChirperMessage_teamId_createdAt_idx" ON "ChirperMessage"("teamId", "createdAt" DESC);

-- TeamMember table
CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint on userId + teamId
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_userId_teamId_key" ON "TeamMember"("userId", "teamId");

-- Game table
CREATE TABLE IF NOT EXISTS "Game" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "opponent" TEXT,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "gameType" "GameType" NOT NULL DEFAULT 'GAME',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "notes" TEXT,
    "rsvpDeadline" TIMESTAMP(3),
    "teamScore" INTEGER,
    "opponentScore" INTEGER,
    "result" "GameResult",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "Game_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Game_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- GameRsvp table
CREATE TABLE IF NOT EXISTS "GameRsvp" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "status" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "GameRsvp_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GameRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameRsvp_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint on userId + gameId
CREATE UNIQUE INDEX IF NOT EXISTS "GameRsvp_userId_gameId_key" ON "GameRsvp"("userId", "gameId");

-- ReminderSent table
CREATE TABLE IF NOT EXISTS "ReminderSent" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ReminderSent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReminderSent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Message table
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- TeamMedia table
CREATE TABLE IF NOT EXISTS "TeamMedia" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "title" TEXT,
    "description" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "TeamMedia_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamMedia_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMedia_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on teamId, createdAt
CREATE INDEX IF NOT EXISTS "TeamMedia_teamId_createdAt_idx" ON "TeamMedia"("teamId", "createdAt" DESC);

-- ============================================
-- TRIGGERS FOR updatedAt
-- ============================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for each table with updatedAt
DO $$ BEGIN
    CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_team_updated_at BEFORE UPDATE ON "Team"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_chirper_updated_at BEFORE UPDATE ON "Chirper"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_game_updated_at BEFORE UPDATE ON "Game"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_gamersvp_updated_at BEFORE UPDATE ON "GameRsvp"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_teammedia_updated_at BEFORE UPDATE ON "TeamMedia"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- RLS (Row Level Security) - OPTIONAL
-- Enable these if you want to use Supabase RLS
-- ============================================

-- Enable RLS on all tables (uncomment if needed)
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Game" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "GameRsvp" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "TeamMedia" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Chirper" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ChirperMessage" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ReminderSent" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANTS (for Supabase)
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant all privileges on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant all privileges on all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

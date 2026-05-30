ALTER TABLE "Property" ADD COLUMN "landmark" TEXT NOT NULL DEFAULT '';

CREATE TABLE "RoommateInterest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoommateInterest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoommateInterest_requesterId_recipientId_propertyId_key"
  ON "RoommateInterest"("requesterId", "recipientId", "propertyId");

CREATE INDEX "RoommateInterest_recipientId_status_idx"
  ON "RoommateInterest"("recipientId", "status");

CREATE INDEX "RoommateInterest_requesterId_idx"
  ON "RoommateInterest"("requesterId");

ALTER TABLE "RoommateInterest"
  ADD CONSTRAINT "RoommateInterest_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoommateInterest"
  ADD CONSTRAINT "RoommateInterest_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoommateInterest"
  ADD CONSTRAINT "RoommateInterest_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

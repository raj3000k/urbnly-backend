-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lookingForRoommate" BOOLEAN NOT NULL DEFAULT false;

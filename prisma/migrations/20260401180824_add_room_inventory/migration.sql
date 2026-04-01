-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "occupiedRooms" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roomInventory" JSONB,
ADD COLUMN     "totalRooms" INTEGER NOT NULL DEFAULT 1;

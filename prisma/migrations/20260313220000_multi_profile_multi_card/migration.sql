-- DropUniqueIndex Profile.userId
DROP INDEX IF EXISTS "profiles_userId_key";
CREATE INDEX IF NOT EXISTS "profiles_userId_idx" ON "profiles"("userId");

-- DropUniqueIndex NfcCard.profileId
DROP INDEX IF EXISTS "nfc_cards_profileId_key";
CREATE INDEX IF NOT EXISTS "nfc_cards_profileId_idx" ON "nfc_cards"("profileId");

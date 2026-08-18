CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoredFile_key_key" ON "StoredFile"("key");
CREATE INDEX "StoredFile_created_at_idx" ON "StoredFile"("created_at");

ALTER TABLE "StoredFile"
ADD CONSTRAINT "StoredFile_uploaded_by_id_fkey"
FOREIGN KEY ("uploaded_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

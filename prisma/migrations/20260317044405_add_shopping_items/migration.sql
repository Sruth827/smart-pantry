-- CreateTable
CREATE TABLE "shopping_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "item_name" VARCHAR(100) NOT NULL,
    "quantity" VARCHAR(50),
    "source" VARCHAR(50),
    "source_label" VARCHAR(100),
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopping_items_user_id_idx" ON "shopping_items"("user_id");

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

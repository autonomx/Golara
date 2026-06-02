CREATE TABLE IF NOT EXISTS "CheckoutFulfillmentShipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "fulfillmentType" TEXT NOT NULL DEFAULT 'delivery',
    "carrierName" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveryWindow" TEXT,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "addressSummary" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutFulfillmentShipment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CheckoutFulfillmentShipment"
    ADD CONSTRAINT "CheckoutFulfillmentShipment_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "CheckoutFulfillmentShipment_orderId_createdAt_idx"
    ON "CheckoutFulfillmentShipment"("orderId", "createdAt");

CREATE INDEX IF NOT EXISTS "CheckoutFulfillmentShipment_status_createdAt_idx"
    ON "CheckoutFulfillmentShipment"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "CheckoutFulfillmentShipment_trackingNumber_idx"
    ON "CheckoutFulfillmentShipment"("trackingNumber");

-- CreateTable
CREATE TABLE "alert_states" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "isBreached" BOOLEAN NOT NULL DEFAULT false,
    "lastAlertedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alert_states_metric_key" ON "alert_states"("metric");

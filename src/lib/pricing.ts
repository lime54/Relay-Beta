// Centralized pricing for Relay Pro. Edit here to update prices everywhere.

export const RELAY_PRO_PRICING = {
    monthly: {
        amount: 15,
        currency: "USD",
        cadence: "month" as const,
        label: "$15",
    },
    yearly: {
        amount: 120,
        currency: "USD",
        cadence: "year" as const,
        label: "$120",
        // Effective monthly rate ($120 / 12 = $10)
        equivalentMonthly: 10,
        savingsPct: 33, // $180/year vs. $120/year
    },
} as const

export type ProBillingCadence = keyof typeof RELAY_PRO_PRICING

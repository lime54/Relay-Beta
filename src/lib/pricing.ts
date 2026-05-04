// Centralized pricing for Relay Pro. Edit here to update prices everywhere.

export const RELAY_PRO_PRICING = {
    monthly: {
        amount: 9,
        currency: "USD",
        cadence: "month" as const,
        label: "$9",
    },
    yearly: {
        amount: 79,
        currency: "USD",
        cadence: "year" as const,
        label: "$79",
        // Effective monthly rate ($79 / 12 ≈ $6.58)
        equivalentMonthly: 6.58,
        savingsPct: 27, // ~$108/year vs. $79/year
    },
} as const

export type ProBillingCadence = keyof typeof RELAY_PRO_PRICING
